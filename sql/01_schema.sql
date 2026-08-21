-- ============================================================================
-- DISTRIBUTED FOOD DELIVERY DATABASE SYSTEM
-- 01_SCHEMA.SQL: 15 Normalized Database Tables (3NF/BCNF)
-- PostgreSQL & SQLite Compatible Schema Definition
-- ============================================================================

-- Enable Foreign Key constraints in SQLite
PRAGMA foreign_keys = ON;

-- 1. USERS TABLE (Base Authentication Entity)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    user_role VARCHAR(20) CHECK (user_role IN ('CUSTOMER', 'RESTAURANT_OWNER', 'DELIVERY_PARTNER', 'ADMIN')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. CUSTOMERS TABLE (Customer Profile Details)
CREATE TABLE IF NOT EXISTS customers (
    customer_id INTEGER PRIMARY KEY,
    membership_tier VARCHAR(20) DEFAULT 'BRONZE' CHECK (membership_tier IN ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
    loyalty_points INTEGER DEFAULT 0,
    preferred_payment_method VARCHAR(50) DEFAULT 'CREDIT_CARD',
    FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. ADDRESSES TABLE (1:N Customer Delivery Addresses)
CREATE TABLE IF NOT EXISTS addresses (
    address_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address_label VARCHAR(50) DEFAULT 'Home', -- e.g. Home, Work, Other
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_default BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. RESTAURANT CATEGORIES TABLE (Cuisine Classifications)
CREATE TABLE IF NOT EXISTS restaurant_categories (
    category_id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_name VARCHAR(50) DEFAULT 'utensils'
);

-- 5. RESTAURANTS TABLE (Merchant Entity)
CREATE TABLE IF NOT EXISTS restaurants (
    restaurant_id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id INTEGER NOT NULL,
    city VARCHAR(100) NOT NULL,
    street_address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 4.5 CHECK (rating >= 0.0 AND rating <= 5.0),
    is_active BOOLEAN DEFAULT 1,
    delivery_radius_km DECIMAL(4, 2) DEFAULT 10.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES restaurant_categories(category_id)
);

-- 6. MENU ITEMS TABLE (Dish Catalog)
CREATE TABLE IF NOT EXISTS menu_items (
    item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurant_id INTEGER NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    dish_type VARCHAR(20) CHECK (dish_type IN ('VEG', 'NON_VEG', 'VEGAN', 'BEVERAGE')) DEFAULT 'VEG',
    is_available BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id) ON DELETE CASCADE
);

-- 7. INVENTORY TABLE (Real-time Stock Control for Concurrency Locking)
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER UNIQUE NOT NULL,
    available_stock INTEGER NOT NULL CHECK (available_stock >= 0),
    reserved_stock INTEGER DEFAULT 0 CHECK (reserved_stock >= 0),
    last_restocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id) ON DELETE CASCADE
);

-- 8. COUPONS TABLE (Promotional Discounts)
CREATE TABLE IF NOT EXISTS coupons (
    coupon_id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage DECIMAL(5, 2) CHECK (discount_percentage > 0 AND discount_percentage <= 100),
    max_discount_amount DECIMAL(10, 2) NOT NULL,
    min_order_amount DECIMAL(10, 2) DEFAULT 0.00,
    valid_until TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT 1
);

-- 9. ORDERS TABLE (Core Transactional Order Header)
CREATE TABLE IF NOT EXISTS orders (
    order_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    delivery_address_id INTEGER NOT NULL,
    order_status VARCHAR(30) CHECK (order_status IN ('PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED')) DEFAULT 'PLACED',
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    coupon_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    partition_key VARCHAR(10) NOT NULL DEFAULT '2026-08', -- Used for Date Range Partitioning Strategy
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
    FOREIGN KEY (delivery_address_id) REFERENCES addresses(address_id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(coupon_id)
);

-- 10. ORDER ITEMS TABLE (Line Items for Each Order)
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES menu_items(item_id)
);

-- 11. PAYMENTS TABLE (ACID Transaction Payment Record)
CREATE TABLE IF NOT EXISTS payments (
    payment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING', 'SUCCESSFUL', 'FAILED', 'REFUNDED')) DEFAULT 'PENDING',
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
);

-- 12. DELIVERY PARTNERS TABLE (Fleet Drivers)
CREATE TABLE IF NOT EXISTS delivery_partners (
    partner_id INTEGER PRIMARY KEY,
    vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('BIKE', 'SCOOTER', 'CAR', 'ELECTRIC_BICYCLE')) DEFAULT 'BIKE',
    vehicle_number VARCHAR(50) NOT NULL,
    is_available BOOLEAN DEFAULT 1,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    rating DECIMAL(3, 2) DEFAULT 4.8,
    FOREIGN KEY (partner_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 13. DELIVERIES TABLE (Logistics Tracking Entity)
CREATE TABLE IF NOT EXISTS deliveries (
    delivery_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    partner_id INTEGER,
    delivery_status VARCHAR(30) CHECK (delivery_status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED')) DEFAULT 'ASSIGNED',
    estimated_delivery_time TIMESTAMP,
    actual_delivery_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (partner_id) REFERENCES delivery_partners(partner_id)
);

-- 14. REVIEWS TABLE (Ratings & Feedback)
CREATE TABLE IF NOT EXISTS reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    restaurant_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (customer_id) REFERENCES users(user_id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

-- 15. AUDIT LOGS TABLE (Database Trigger & Transaction Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRANSACTION_LOCK')) NOT NULL,
    record_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
