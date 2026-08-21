-- ============================================================================
-- 02_INDEXES.SQL: Database Indexing Strategies & Performance Tuning
-- Demonstrates B-Tree, Composite, Foreign Key, and Spatial Index Optimization
-- ============================================================================

-- 1. Foreign Key B-Tree Indexes (Prevents full table scans on JOIN operations)
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item ON order_items(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_partner ON deliveries(partner_id);

-- 2. Composite Index (Optimizes combined filtering on Restaurant Menu browsing)
-- Query pattern: SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1;
CREATE INDEX IF NOT EXISTS idx_menu_avail ON menu_items(restaurant_id, is_available, dish_type);

-- 3. Composite Index on Order Status & Date Range (Optimizes Analytical Aggregations)
-- Query pattern: SELECT * FROM orders WHERE restaurant_id = ? AND order_status = 'DELIVERED' AND created_at >= ?;
CREATE INDEX IF NOT EXISTS idx_orders_analytics ON orders(restaurant_id, order_status, created_at);

-- 4. Spatial / Coordinate Index for Nearby Restaurant Discovery
-- Query pattern: Distance calculations based on latitude and longitude
CREATE INDEX IF NOT EXISTS idx_restaurant_location ON restaurants(city, latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_address_location ON addresses(city, latitude, longitude);

-- 5. Unique Index on Coupon Codes for Instant Hash Lookup (O(1))
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_code ON coupons(code);
