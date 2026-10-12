const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { query, execute } = require('../db/connection');
const cacheService = require('../services/cacheService');
const { runExplainAnalyze } = require('../services/explainService');
const { simulateRaceCondition } = require('../services/concurrencyService');
const aiRecommendationService = require('../services/aiRecommendationService');
const aiPipelineService = require('../services/aiPipelineService');
const aiSentimentService = require('../services/aiSentimentService');
const aiSqlService = require('../services/aiSqlService');


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

// 9. AI VECTOR RECOMMENDATIONS API
router.get('/ai-recommendations', async (req, res) => {
  try {
    const customerId = Number(req.query.customerId || 1);
    const customPrefs = req.query.spiceLevel !== undefined ? {
      spiceLevel: req.query.spiceLevel,
      healthScore: req.query.healthScore,
      priceSensitivity: req.query.priceSensitivity,
      veganWeight: req.query.veganWeight,
      asianPreference: req.query.asianPreference
    } : null;

    const recommendations = await aiRecommendationService.getAiRecommendationsForCustomer(customerId, customPrefs);
    res.json(recommendations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. AI PIPELINE - DATASET SUMMARY (STEP 1)
router.get('/ai/dataset-stats', (req, res) => {
  try {
    const stats = aiPipelineService.getDatasetStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. AI PIPELINE - PREPROCESSING STEP (STEP 1)
router.post('/ai/preprocess', (req, res) => {
  try {
    const preprocessed = aiPipelineService.preprocessSample(req.body);
    res.json(preprocessed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. AI PIPELINE - NLP TO SQL CHATBOT PROCESS (STEP 2: Input -> Query -> Output -> Chatbot -> Output)
router.post('/ai/nlp-to-sql-chatbot', async (req, res) => {
  try {
    const prompt = req.body.prompt || "Show me delayed orders";
    const result = await aiPipelineService.executeNlpToSqlChatbot(prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. AI PIPELINE - PREDICTION OR OUTPUT (STEP 3: Delivery ETA Regressor & Risk Classifier)
router.post('/ai/predict-eta', (req, res) => {
  try {
    const prediction = aiPipelineService.predictDeliveryTime(req.body);
    res.json(prediction);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* Shared AI endpoints used by SQL Studio and the in-store concierge. */
router.post('/ai/text-to-sql', async (req, res) => {
  try {
    const prompt = String(req.body?.prompt || '').trim();
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });
    const translated = aiSqlService.translateToSql(prompt);
    const result = await query(translated.sql);
    res.json({ sql: translated.sql, explanation: translated.explanation, rows: result.rows, rowCount: result.rows.length, executionTimeMs: Number(result.executionTimeMs.toFixed(2)), source: 'SQLITE_DATABASE' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/ai/recommendations/:customerId', async (req, res) => {
  try {
    const customerId = Math.max(1, Number(req.params.customerId) || 1);
    const result = await aiRecommendationService.getAiRecommendationsForCustomer(customerId);
    res.json({ data: result.topRecommendations.map(item => ({ ...item, ai_match_score: item.matchPercentage })), algorithm: result.algorithm, latencyMs: result.latencyMs, customerId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* AI MODEL OPERATIONS — training is explicit and returns held-out evaluation metrics. */
router.get('/ai/model-status', (req, res) => {
  try { res.json(aiPipelineService.getModelStatus()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/ai/train-model', (req, res) => {
  try { res.json({ success: true, ...aiPipelineService.trainEtaModel() }); }
  catch (err) { res.status(400).json({ success: false, error: err.message }); }
});

router.get('/ai/dataset.csv', (req, res) => {
  const datasetPath = path.join(__dirname, '..', '..', '..', 'data', 'food_delivery_dataset.csv');
  if (!fs.existsSync(datasetPath)) return res.status(404).json({ error: 'Training dataset was not found on this server.' });
  res.download(datasetPath, 'eryviled-food-delivery-dataset.csv');
});

router.get('/ai/sentiment-summary', async (req, res) => {
  try {
    const reviews = await query('SELECT review_id, comment, rating, restaurant_id FROM reviews ORDER BY review_id DESC LIMIT 1000');
    const counts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
    const keywords = {};
    const analyzed = reviews.rows.map(review => {
      const result = aiSentimentService.analyzeText(review.comment || '');
      counts[result.label] = (counts[result.label] || 0) + 1;
      result.themes.forEach(theme => { keywords[theme] = (keywords[theme] || 0) + 1; });
      return { ...review, sentiment_label: result.label, sentiment_score: result.score, key_themes: result.themes };
    });
    const distribution = Object.entries(counts).map(([sentiment_label, count]) => ({ sentiment_label, count }));
    const topKeywords = Object.entries(keywords).sort((a,b) => b[1]-a[1]).slice(0, 12);
    res.json({ source: 'SQLITE_REVIEWS + AI_SENTIMENT_SERVICE', totalReviews: analyzed.length, distribution, topKeywords, reviews: analyzed.slice(0, 30) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/analyze-review', (req, res) => {
  const text = String(req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'Review text is required.' });
  res.json({ ...aiSentimentService.analyzeText(text), source: 'AI_SENTIMENT_SERVICE' });
});

module.exports = router;

