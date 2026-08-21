-- ============================================================================
-- 03_PARTITIONING.SQL: PostgreSQL Range Partitioning Strategy for Orders Table
-- Demonstrates high-scalability table decomposition by Date Range (YYYY-MM)
-- ============================================================================

-- PostgreSQL Native Declarative Partitioning Syntax Overview:
--
-- Step 1: Create Parent Partitioned Table
-- CREATE TABLE orders_partitioned (
--     order_id BIGSERIAL,
--     customer_id INT NOT NULL,
--     restaurant_id INT NOT NULL,
--     total_amount DECIMAL(10,2) NOT NULL,
--     order_status VARCHAR(30) NOT NULL,
--     created_at TIMESTAMP NOT NULL,
--     PRIMARY KEY (order_id, created_at)
-- ) PARTITION BY RANGE (created_at);

-- Step 2: Create Monthly Child Partitions
-- CREATE TABLE orders_y2026m01 PARTITION OF orders_partitioned
--     FOR VALUES FROM ('2026-01-01 00:00:00') TO ('2026-02-01 00:00:00');

-- CREATE TABLE orders_y2026m02 PARTITION OF orders_partitioned
--     FOR VALUES FROM ('2026-02-01 00:00:00') TO ('2026-03-01 00:00:00');

-- CREATE TABLE orders_y2026m03 PARTITION OF orders_partitioned
--     FOR VALUES FROM ('2026-03-01 00:00:00') TO ('2026-04-01 00:00:00');

-- CREATE TABLE orders_y2026m08 PARTITION OF orders_partitioned
--     FOR VALUES FROM ('2026-08-01 00:00:00') TO ('2026-09-01 00:00:00');

-- Step 3: Partition Pruning Demonstration Query
-- PostgreSQL query planner prunes unnecessary partitions automatically:
-- EXPLAIN ANALYZE SELECT * FROM orders_partitioned WHERE created_at >= '2026-08-01' AND created_at < '2026-09-01';
-- Result: Scans ONLY orders_y2026m08 partition (ignoring millions of historical rows in prior partitions).

-- Simulated SQLite Partition Metadata View for Database Observatory Inspector:
CREATE TABLE IF NOT EXISTS partition_metadata (
    partition_name VARCHAR(100) PRIMARY KEY,
    parent_table VARCHAR(100) NOT NULL,
    range_start TIMESTAMP NOT NULL,
    range_end TIMESTAMP NOT NULL,
    row_count INTEGER DEFAULT 0,
    size_mb DECIMAL(6,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

INSERT OR REPLACE INTO partition_metadata (partition_name, parent_table, range_start, range_end, row_count, size_mb, status) VALUES
('orders_2026_m05', 'orders', '2026-05-01 00:00:00', '2026-06-01 00:00:00', 482190, 42.50, 'ARCHIVED'),
('orders_2026_m06', 'orders', '2026-06-01 00:00:00', '2026-07-01 00:00:00', 521400, 46.10, 'ARCHIVED'),
('orders_2026_m07', 'orders', '2026-07-01 00:00:00', '2026-08-01 00:00:00', 612800, 54.30, 'READ_ONLY'),
('orders_2026_m08', 'orders', '2026-08-01 00:00:00', '2026-09-01 00:00:00', 742150, 65.80, 'ACTIVE');
