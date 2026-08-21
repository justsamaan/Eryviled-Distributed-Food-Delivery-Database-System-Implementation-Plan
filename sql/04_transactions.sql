-- ============================================================================
-- 04_TRANSACTIONS.SQL: ACID Order Checkout Transaction with Row Locking
-- Demonstrates Isolation Levels, Row-Level Locking, and Rollback Mechanics
-- ============================================================================

-- TRANSACTION WORKFLOW:
-- 1. BEGIN TRANSACTION (SERIALIZABLE / REPEATABLE READ)
-- 2. Lock item row in INVENTORY table (SELECT ... FOR UPDATE)
-- 3. Check stock availability (available_stock >= requested_qty)
-- 4. Deduct available_stock and increment reserved_stock
-- 5. Create Order header entry in ORDERS table
-- 6. Insert Order line items in ORDER_ITEMS table
-- 7. Record payment entry in PAYMENTS table
-- 8. Log action in AUDIT_LOGS
-- 9. COMMIT TRANSACTION (Or ROLLBACK if any step fails)

-- PostgreSQL Transaction Blueprint:
/*
BEGIN ISOLATION LEVEL SERIALIZABLE;

-- Step 1: Lock Inventory Row exclusively
SELECT available_stock FROM inventory 
WHERE item_id = 1 
FOR UPDATE;

-- Step 2: Update stock conditionally
UPDATE inventory 
SET available_stock = available_stock - 1, 
    reserved_stock = reserved_stock + 1 
WHERE item_id = 1 AND available_stock >= 1;

-- Step 3: Insert Order Header
INSERT INTO orders (customer_id, restaurant_id, delivery_address_id, subtotal, tax_amount, delivery_fee, total_amount, order_status)
VALUES (1, 1, 1, 18.99, 1.50, 2.99, 23.48, 'PLACED');

-- Step 4: Insert Order Item
INSERT INTO order_items (order_id, item_id, quantity, unit_price, total_price)
VALUES (currval('orders_order_id_seq'), 1, 1, 18.99, 18.99);

-- Step 5: Insert Payment
INSERT INTO payments (order_id, payment_status, payment_method, transaction_reference, amount)
VALUES (currval('orders_order_id_seq'), 'SUCCESSFUL', 'CREDIT_CARD', 'TXN_' || gen_random_uuid(), 23.48);

COMMIT;
*/
