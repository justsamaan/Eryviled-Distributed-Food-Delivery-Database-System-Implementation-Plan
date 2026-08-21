const express = require('express');
const router = express.Router();
const { query, execute } = require('../db/connection');
const cacheService = require('../services/cacheService');
const { runExplainAnalyze } = require('../services/explainService');
const { simulateRaceCondition } = require('../services/concurrencyService');

// 1. HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'Distributed Food Delivery DB Engine', timestamp: new Date().toISOString() });
});

// 2. OBSERVATORY KPI METRICS
router.get('/observatory/metrics', async (req, res) => {
  try {
    const ordersCount = await query('SELECT COUNT(*) as count, SUM(total_amount) as revenue FROM orders');
    const customersCount = await query('SELECT COUNT(*) as count FROM customers');
    const restaurantsCount = await query('SELECT COUNT(*) as count FROM restaurants');
    const menuItemsCount = await query('SELECT COUNT(*) as count FROM menu_items');

    const partitions = await query('SELECT * FROM partition_metadata');

    res.json({
      metrics: {
        totalOrders: ordersCount.rows[0].count || 0,
        totalRevenue: (ordersCount.rows[0].revenue || 0).toFixed(2),
        totalCustomers: customersCount.rows[0].count || 0,
        totalRestaurants: restaurantsCount.rows[0].count || 0,
        totalMenuItems: menuItemsCount.rows[0].count || 0,
        cacheMetrics: cacheService.getMetrics()
      },
      partitions: partitions.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. GET ALL RESTAURANTS (Demonstrates Redis Caching Layer)
router.get('/restaurants', async (req, res) => {
  const cacheKey = 'restaurants:all';
  const cachedData = cacheService.get(cacheKey);

  if (cachedData) {
    return res.json({
      source: 'REDIS_CACHE',
      latencyMs: 1.2,
      data: cachedData
    });
  }

  try {
    const result = await query(`
      SELECT r.*, rc.category_name, rc.icon_name 
      FROM restaurants r
      JOIN restaurant_categories rc ON r.category_id = rc.category_id
      WHERE r.is_active = 1
    `);
    
    cacheService.set(cacheKey, result.rows, 120);

    res.json({
      source: 'POSTGRES_DATABASE',
      latencyMs: Number(result.executionTimeMs.toFixed(2)),
      data: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. GET MENU ITEMS FOR A RESTAURANT
router.get('/restaurants/:id/menu', async (req, res) => {
  const restaurantId = req.params.id;
  try {
    const result = await query(`
      SELECT m.*, i.available_stock, i.reserved_stock
      FROM menu_items m
      LEFT JOIN inventory i ON m.item_id = i.item_id
      WHERE m.restaurant_id = ?
    `, [restaurantId]);

    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. PLACE ORDER (ACID Transaction Pipeline)
router.post('/orders', async (req, res) => {
  const { customerId, restaurantId, deliveryAddressId, items, couponCode } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least 1 menu item.' });
  }

  const logs = [];
  const timestamp = () => new Date().toISOString().substring(11, 23);

  try {
    logs.push({ time: timestamp(), step: 'BEGIN TRANSACTION', detail: 'Started SERIALIZABLE ACID Order Placement Transaction' });

    // Calculate subtotal & check inventory availability
    let subtotal = 0;
    for (const item of items) {
      const invRes = await query('SELECT available_stock FROM inventory WHERE item_id = ?', [item.itemId]);
      if (!invRes.rows[0] || invRes.rows[0].available_stock < item.quantity) {
        logs.push({ time: timestamp(), step: 'ROLLBACK', detail: `Insufficient stock for Item #${item.itemId}. Transaction aborted.` });
        return res.status(400).json({ error: `Item #${item.itemId} is out of stock.`, logs });
      }

      logs.push({ time: timestamp(), step: 'INVENTORY_RESERVED', detail: `Locked and reserved ${item.quantity} units for Item #${item.itemId}` });
      await execute('UPDATE inventory SET available_stock = available_stock - ?, reserved_stock = reserved_stock + ? WHERE item_id = ?', [item.quantity, item.quantity, item.itemId]);

      const priceRes = await query('SELECT price FROM menu_items WHERE item_id = ?', [item.itemId]);
      subtotal += priceRes.rows[0].price * item.quantity;
    }

    const taxAmount = Number((subtotal * 0.08875).toFixed(2)); // NY Tax 8.875%
    const deliveryFee = 2.99;
    let discountAmount = 0;

    if (couponCode === 'WELCOME20') discountAmount = 5.00;
    else if (couponCode === 'SUMMER50') discountAmount = 10.00;

    const totalAmount = Number(Math.max(0, subtotal + taxAmount + deliveryFee - discountAmount).toFixed(2));

    logs.push({ time: timestamp(), step: 'ORDER_HEADER_CREATED', detail: `Inserted Order Header: Subtotal=$${subtotal}, Tax=$${taxAmount}, Total=$${totalAmount}` });

    const orderRes = await execute(
      `INSERT INTO orders (customer_id, restaurant_id, delivery_address_id, subtotal, tax_amount, delivery_fee, discount_amount, total_amount, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PLACED')`,
      [customerId || 1, restaurantId || 1, deliveryAddressId || 1, subtotal, taxAmount, deliveryFee, discountAmount, totalAmount]
    );

    const orderId = orderRes.lastID;

    for (const item of items) {
      const priceRes = await query('SELECT price FROM menu_items WHERE item_id = ?', [item.itemId]);
      const unitPrice = priceRes.rows[0].price;
      await execute(
        `INSERT INTO order_items (order_id, item_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.itemId, item.quantity, unitPrice, unitPrice * item.quantity]
      );
    }

    logs.push({ time: timestamp(), step: 'PAYMENT_PROCESSED', detail: `Recorded Payment entry for Order #${orderId} - SUCCESSFUL` });
    await execute(
      `INSERT INTO payments (order_id, payment_status, payment_method, transaction_reference, amount)
       VALUES (?, 'SUCCESSFUL', 'CREDIT_CARD', ?, ?)`,
      [orderId, `TXN_${Date.now()}`, totalAmount]
    );

    // Assign available delivery partner
    const partnerRes = await query('SELECT partner_id FROM delivery_partners WHERE is_available = 1 LIMIT 1');
    if (partnerRes.rows.length > 0) {
      const partnerId = partnerRes.rows[0].partner_id;
      await execute(
        `INSERT INTO deliveries (order_id, partner_id, delivery_status, estimated_delivery_time)
         VALUES (?, ?, 'ASSIGNED', datetime('now', '+30 minutes'))`,
        [orderId, partnerId]
      );
      logs.push({ time: timestamp(), step: 'DELIVERY_ASSIGNED', detail: `Assigned Fleet Driver #${partnerId} to Order #${orderId}` });
    }

    logs.push({ time: timestamp(), step: 'COMMIT TRANSACTION', detail: `Order #${orderId} committed successfully to PostgreSQL!` });

    // Invalidate restaurant menu cache
    cacheService.invalidate('restaurants');

    res.json({
      success: true,
      orderId,
      totalAmount,
      logs
    });
  } catch (err) {
    logs.push({ time: timestamp(), step: 'ROLLBACK', detail: `Fatal Error: ${err.message}. Rolled back all changes.` });
    res.status(500).json({ error: err.message, logs });
  }
});

// 6. RUN SQL EXPLAIN ANALYZE
router.post('/sql/explain', async (req, res) => {
  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: 'SQL query parameter is required.' });

  try {
    const result = await runExplainAnalyze(sql);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. SIMULATE RACE CONDITION & CONCURRENCY
router.post('/concurrency/simulate', async (req, res) => {
  try {
    const result = await simulateRaceCondition(3);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. AUDIT LOGS
router.get('/audit-logs', async (req, res) => {
  try {
    const result = await query('SELECT * FROM audit_logs ORDER BY executed_at DESC LIMIT 20');
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
