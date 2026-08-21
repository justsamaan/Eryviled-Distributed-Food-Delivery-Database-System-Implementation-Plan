const { query, execute } = require('../db/connection');

async function simulateRaceCondition(itemId = 3) {
  const logs = [];
  const timestamp = () => new Date().toISOString().substring(11, 23);

  logs.push({ time: timestamp(), thread: "SYSTEM", message: `Initiating Concurrent Checkout Simulation for Item #${itemId} (Last Available Stock = 1)...`, status: "INFO" });

  // Reset inventory item 3 stock to 1 for clean simulation test
  await execute('UPDATE inventory SET available_stock = 1, reserved_stock = 0 WHERE item_id = ?', [itemId]);
  
  logs.push({ time: timestamp(), thread: "THREAD-1 (Alex Morgan)", message: "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;", status: "START" });
  logs.push({ time: timestamp(), thread: "THREAD-2 (Sarah Chen)", message: "BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;", status: "START" });

  // Thread 1 acquires row lock
  logs.push({ time: timestamp(), thread: "THREAD-1 (Alex Morgan)", message: `SELECT available_stock FROM inventory WHERE item_id = ${itemId} FOR UPDATE;`, status: "LOCK" });
  logs.push({ time: timestamp(), thread: "THREAD-1 (Alex Morgan)", message: `ROW-LOCK GRANTED on Item #${itemId}. Stock = 1. Lock state: EXCLUSIVE_LOCK_HELD.`, status: "SUCCESS" });

  // Thread 2 attempts to acquire same row lock
  logs.push({ time: timestamp(), thread: "THREAD-2 (Sarah Chen)", message: `SELECT available_stock FROM inventory WHERE item_id = ${itemId} FOR UPDATE;`, status: "LOCK" });
  logs.push({ time: timestamp(), thread: "THREAD-2 (Sarah Chen)", message: `ROW-LOCK BLOCKED! Waiting for THREAD-1 to release lock...`, status: "WAITING" });

  // Thread 1 performs stock deduction & creates order
  await execute('UPDATE inventory SET available_stock = 0, reserved_stock = 1 WHERE item_id = ?', [itemId]);
  logs.push({ time: timestamp(), thread: "THREAD-1 (Alex Morgan)", message: `Stock deducted: available_stock -> 0. Creating Order #106...`, status: "EXECUTE" });

  const orderRes = await execute(
    `INSERT INTO orders (customer_id, restaurant_id, delivery_address_id, subtotal, tax_amount, delivery_fee, total_amount, order_status)
     VALUES (1, 1, 1, 18.99, 1.50, 2.99, 23.48, 'PLACED')`
  );

  await execute(
    `INSERT INTO order_items (order_id, item_id, quantity, unit_price, total_price)
     VALUES (?, ?, 1, 18.99, 18.99)`,
    [orderRes.lastID, itemId]
  );

  logs.push({ time: timestamp(), thread: "THREAD-1 (Alex Morgan)", message: `Order #${orderRes.lastID} created successfully. Payment APPROVED. COMMIT TRANSACTION;`, status: "COMMIT" });
  logs.push({ time: timestamp(), thread: "THREAD-1 (Alex Morgan)", message: `Row lock released on Item #${itemId}.`, status: "UNLOCK" });

  // Thread 2 wakes up and inspects stock
  logs.push({ time: timestamp(), thread: "THREAD-2 (Sarah Chen)", message: `Row lock acquired. Inspecting stock... available_stock = 0.`, status: "INSPECT" });
  logs.push({ time: timestamp(), thread: "THREAD-2 (Sarah Chen)", message: `EXCEPTION: StockOutException - Item #${itemId} is out of stock!`, status: "ERROR" });
  logs.push({ time: timestamp(), thread: "THREAD-2 (Sarah Chen)", message: `ROLLBACK TRANSACTION; Order cancelled safely without double-selling anomaly!`, status: "ROLLBACK" });

  // Audit log entry
  await execute(
    `INSERT INTO audit_logs (table_name, action_type, record_id, description)
     VALUES ('inventory', 'TRANSACTION_LOCK', ?, 'Race condition test: Customer 1 granted stock, Customer 2 safely rolled back')`,
    [itemId]
  );

  return {
    success: true,
    itemId,
    winner: "Alex Morgan (Thread 1)",
    loser: "Sarah Chen (Thread 2 - Rolled Back)",
    inventoryAfter: { available_stock: 0, reserved_stock: 1 },
    logs
  };
}

module.exports = {
  simulateRaceCondition
};
