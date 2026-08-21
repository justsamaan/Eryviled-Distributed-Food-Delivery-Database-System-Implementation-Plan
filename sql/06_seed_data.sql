-- ============================================================================
-- 06_SEED_DATA.SQL: Realistic Dataset for Testing & Benchmarks
-- Populates 15 Normalized Tables with Users, Restaurants, Menus, Orders, etc.
-- ============================================================================

-- 1. SEED RESTAURANT CATEGORIES
INSERT OR IGNORE INTO restaurant_categories (category_id, category_name, description, icon_name) VALUES
(1, 'Italian & Pizza', 'Artisanal pizzas, pasta, and Mediterranean delights', 'pizza-slice'),
(2, 'Asian & Sushi', 'Fresh sushi rolls, ramen bowls, and Dim Sum', 'utensils'),
(3, 'American & Burgers', 'Gourmet smash burgers, fries, and shakes', 'hamburger'),
(4, 'Indian & Curry', 'Authentic biryanis, tikka masalas, and garlic naan', 'bowl-rice'),
(5, 'Healthy & Salads', 'Organic grain bowls, fresh smoothies, and salads', 'leaf');

-- 2. SEED USERS (Customers, Restaurant Owners, Delivery Partners)
-- Customer Users (IDs 1-6)
INSERT OR IGNORE INTO users (user_id, email, password_hash, full_name, phone_number, user_role) VALUES
(1, 'alex.morgan@example.com', 'hash_pass_123', 'Alex Morgan', '+15550192831', 'CUSTOMER'),
(2, 'sarah.chen@example.com', 'hash_pass_124', 'Sarah Chen', '+15550192832', 'CUSTOMER'),
(3, 'michael.brown@example.com', 'hash_pass_125', 'Michael Brown', '+15550192833', 'CUSTOMER'),
(4, 'emily.davis@example.com', 'hash_pass_126', 'Emily Davis', '+15550192834', 'CUSTOMER'),
(5, 'david.wilson@example.com', 'hash_pass_127', 'David Wilson', '+15550192835', 'CUSTOMER'),
(6, 'jessica.taylor@example.com', 'hash_pass_128', 'Jessica Taylor', '+15550192836', 'CUSTOMER');

-- Restaurant Owner Users (IDs 7-11)
INSERT OR IGNORE INTO users (user_id, email, password_hash, full_name, phone_number, user_role) VALUES
(7, 'owner.luigi@example.com', 'hash_pass_201', 'Luigi Rossi', '+15550291101', 'RESTAURANT_OWNER'),
(8, 'owner.kenji@example.com', 'hash_pass_202', 'Kenji Sato', '+15550291102', 'RESTAURANT_OWNER'),
(9, 'owner.samuel@example.com', 'hash_pass_203', 'Samuel Jackson', '+15550291103', 'RESTAURANT_OWNER'),
(10, 'owner.priya@example.com', 'hash_pass_204', 'Priya Sharma', '+15550291104', 'RESTAURANT_OWNER'),
(11, 'owner.chloe@example.com', 'hash_pass_205', 'Chloe Bennett', '+15550291105', 'RESTAURANT_OWNER');

-- Delivery Partner Users (IDs 12-15)
INSERT OR IGNORE INTO users (user_id, email, password_hash, full_name, phone_number, user_role) VALUES
(12, 'driver.carlos@example.com', 'hash_pass_301', 'Carlos Rodriguez', '+15550382201', 'DELIVERY_PARTNER'),
(13, 'driver.marcus@example.com', 'hash_pass_302', 'Marcus Vance', '+15550382202', 'DELIVERY_PARTNER'),
(14, 'driver.elena@example.com', 'hash_pass_303', 'Elena Rostova', '+15550382203', 'DELIVERY_PARTNER'),
(15, 'driver.liam@example.com', 'hash_pass_304', 'Liam O''Connor', '+15550382204', 'DELIVERY_PARTNER');

-- 3. SEED CUSTOMERS METADATA
INSERT OR IGNORE INTO customers (customer_id, membership_tier, loyalty_points, preferred_payment_method) VALUES
(1, 'GOLD', 420, 'CREDIT_CARD'),
(2, 'PLATINUM', 890, 'APPLE_PAY'),
(3, 'SILVER', 150, 'DEBIT_CARD'),
(4, 'BRONZE', 45, 'CREDIT_CARD'),
(5, 'GOLD', 510, 'PAYPAL'),
(6, 'SILVER', 220, 'CREDIT_CARD');

-- 4. SEED ADDRESSES
INSERT OR IGNORE INTO addresses (address_id, user_id, address_label, street_address, city, state, postal_code, latitude, longitude, is_default) VALUES
(1, 1, 'Home', '742 Evergreen Terrace', 'New York', 'NY', '10001', 40.712800, -74.006000, 1),
(2, 2, 'Apartment', '120 Broadway Apt 4B', 'New York', 'NY', '10005', 40.708100, -74.011200, 1),
(3, 3, 'Office', '350 Fifth Avenue Fl 32', 'New York', 'NY', '10118', 40.748400, -73.985700, 1),
(4, 4, 'Home', '88 Pine Street', 'San Francisco', 'CA', '94111', 37.792200, -122.399000, 1),
(5, 5, 'Condo', '500 Howard Street', 'San Francisco', 'CA', '94105', 37.788100, -122.396500, 1),
(6, 6, 'Studio', '200 Park Avenue', 'New York', 'NY', '10166', 40.753300, -73.976700, 1);

-- 5. SEED RESTAURANTS
INSERT OR IGNORE INTO restaurants (restaurant_id, owner_id, name, category_id, city, street_address, latitude, longitude, rating, is_active, delivery_radius_km) VALUES
(1, 7, 'Bella Italia Pizzeria', 1, 'New York', '45 Mulberry St', 40.715200, -73.998400, 4.8, 1, 8.5),
(2, 8, 'Sakura Japanese & Ramen', 2, 'New York', '112 East 23rd St', 40.739800, -73.986200, 4.9, 1, 10.0),
(3, 9, 'The Big Apple Burger Co.', 3, 'New York', '78 West 8th St', 40.732400, -73.996800, 4.6, 1, 7.0),
(4, 10, 'Taj Mahal Indian Spice', 4, 'New York', '315 Lexington Ave', 40.746100, -73.978200, 4.7, 1, 9.0),
(5, 11, 'Green Goddess Bowl Lab', 5, 'San Francisco', '450 Mission St', 37.790500, -122.398100, 4.8, 1, 6.5);

-- 6. SEED MENU ITEMS
INSERT OR IGNORE INTO menu_items (item_id, restaurant_id, item_name, description, price, dish_type, is_available) VALUES
-- Bella Italia Pizzeria (Restaurant 1)
(1, 1, 'Truffle Mushroom Pizza', 'Wood-fired crust, black truffle cream, wild mushrooms, fior di latte', 21.99, 'VEG', 1),
(2, 1, 'Classic Margherita Pizza', 'San Marzano tomato sauce, fresh mozzarella, organic basil, extra virgin olive oil', 16.50, 'VEG', 1),
(3, 1, 'Artisanal Pepperoni Pizza', 'Spicy pepperoni, aged provolone, honey chili drizzle', 18.99, 'NON_VEG', 1),
(4, 1, 'Creamy Burrata Salad', 'Heirloom tomatoes, balsamic glaze, toasted pine nuts', 14.00, 'VEG', 1),

-- Sakura Japanese & Ramen (Restaurant 2)
(5, 2, 'Tonkotsu Pork Ramen', 'Rich 16-hour pork bone broth, chashu pork belly, ajitama egg, bamboo shoots', 17.50, 'NON_VEG', 1),
(6, 2, 'Salmon Nigiri Platter (6pcs)', 'Fresh Atlantic salmon over seasoned sushi rice', 19.00, 'NON_VEG', 1),
(7, 2, 'Spicy Tuna Dragon Roll', 'Ahi tuna, avocado, cucumber, spicy mayo, unagi sauce', 16.00, 'NON_VEG', 1),
(8, 2, 'Vegetable Gyoza (6pcs)', 'Pan-fried dumplings stuffed with cabbage, shiitake, ginger', 8.50, 'VEGAN', 1),

-- The Big Apple Burger Co. (Restaurant 3)
(9, 3, 'Double Smash Cheeseburger', 'Two Angus beef patties, American cheese, grilled onions, secret sauce', 15.99, 'NON_VEG', 1),
(10, 3, 'Truffle Parmesan Fries', 'Hand-cut fries, white truffle oil, grated parmesan, parsley', 7.50, 'VEG', 1),
(11, 3, 'Crispy Buffalo Chicken Sandwich', 'Buttermilk fried chicken breast, spicy buffalo, blue cheese slaw', 14.50, 'NON_VEG', 1),

-- Taj Mahal Indian Spice (Restaurant 4)
(12, 4, 'Chicken Tikka Masala', 'Tandoori grilled chicken in creamy spiced tomato sauce', 18.50, 'NON_VEG', 1),
(13, 4, 'Paneer Butter Masala', 'Cottage cheese cubes in rich cashew tomato gravy', 16.00, 'VEG', 1),
(14, 4, 'Garlic Butter Naan', 'Freshly baked tandoori flatbread brushed with garlic butter', 3.99, 'VEG', 1),
(15, 4, 'Hyderabadi Dum Biryani', 'Fragrant basmati rice cooked with whole spices and tender lamb', 20.00, 'NON_VEG', 1);

-- 7. SEED INVENTORY (Stock Control)
INSERT OR IGNORE INTO inventory (inventory_id, item_id, available_stock, reserved_stock) VALUES
(1, 1, 15, 2),   -- Truffle Pizza
(2, 2, 25, 0),   -- Margherita
(3, 3, 1, 0),    -- Pepperoni Pizza (LAST ITEM FOR CONCURRENCY LAB SIMULATOR!)
(4, 4, 30, 0),
(5, 5, 20, 1),
(6, 6, 12, 0),
(7, 7, 18, 0),
(8, 8, 40, 0),
(9, 9, 22, 1),
(10, 10, 50, 0),
(11, 11, 14, 0),
(12, 12, 28, 2),
(13, 13, 19, 0),
(14, 14, 100, 0),
(15, 15, 10, 0);

-- 8. SEED COUPONS
INSERT OR IGNORE INTO coupons (coupon_id, code, discount_percentage, max_discount_amount, min_order_amount, valid_until, is_active) VALUES
(1, 'WELCOME20', 20.00, 10.00, 20.00, '2027-12-31 23:59:59', 1),
(2, 'SUMMER50', 50.00, 15.00, 30.00, '2027-12-31 23:59:59', 1),
(3, 'FREESHIP', 100.00, 5.00, 15.00, '2027-12-31 23:59:59', 1);

-- 9. SEED ORDERS
INSERT OR IGNORE INTO orders (order_id, customer_id, restaurant_id, delivery_address_id, order_status, subtotal, tax_amount, delivery_fee, discount_amount, total_amount, coupon_id, created_at, partition_key) VALUES
(101, 1, 1, 1, 'DELIVERED', 38.49, 3.46, 2.99, 5.00, 39.94, 1, '2026-08-15 12:30:00', '2026-08'),
(102, 2, 2, 2, 'DELIVERED', 52.50, 4.73, 0.00, 10.00, 47.23, 1, '2026-08-16 19:15:00', '2026-08'),
(103, 3, 3, 3, 'DELIVERED', 23.49, 2.11, 2.99, 0.00, 28.59, NULL, '2026-08-18 13:00:00', '2026-08'),
(104, 1, 4, 1, 'DELIVERED', 42.49, 3.82, 3.49, 8.50, 41.30, 2, '2026-08-19 20:10:00', '2026-08'),
(105, 5, 5, 5, 'OUT_FOR_DELIVERY', 22.50, 2.03, 1.99, 0.00, 26.52, NULL, '2026-08-21 14:00:00', '2026-08');

-- 10. SEED ORDER ITEMS
INSERT OR IGNORE INTO order_items (order_item_id, order_id, item_id, quantity, unit_price, total_price) VALUES
(1, 101, 1, 1, 21.99, 21.99),
(2, 101, 2, 1, 16.50, 16.50),
(3, 102, 5, 2, 17.50, 35.00),
(4, 102, 6, 1, 17.50, 17.50),
(5, 103, 9, 1, 15.99, 15.99),
(6, 103, 10, 1, 7.50, 7.50),
(7, 104, 12, 1, 18.50, 18.50),
(8, 104, 15, 1, 20.00, 20.00),
(9, 104, 14, 1, 3.99, 3.99);

-- 11. SEED PAYMENTS
INSERT OR IGNORE INTO payments (payment_id, order_id, payment_status, payment_method, transaction_reference, amount, paid_at) VALUES
(1, 101, 'SUCCESSFUL', 'CREDIT_CARD', 'TXN_998120391', 39.94, '2026-08-15 12:31:00'),
(2, 102, 'SUCCESSFUL', 'APPLE_PAY', 'TXN_998120392', 47.23, '2026-08-16 19:16:00'),
(3, 103, 'SUCCESSFUL', 'DEBIT_CARD', 'TXN_998120393', 28.59, '2026-08-18 13:01:00'),
(4, 104, 'SUCCESSFUL', 'CREDIT_CARD', 'TXN_998120394', 41.30, '2026-08-19 20:11:00'),
(5, 105, 'SUCCESSFUL', 'PAYPAL', 'TXN_998120395', 26.52, '2026-08-21 14:01:00');

-- 12. SEED DELIVERY PARTNERS
INSERT OR IGNORE INTO delivery_partners (partner_id, vehicle_type, vehicle_number, is_available, current_latitude, current_longitude, rating) VALUES
(12, 'BIKE', 'NY-BK-8891', 1, 40.716000, -73.997000, 4.9),
(13, 'SCOOTER', 'NY-SC-4412', 1, 40.741000, -73.985000, 4.8),
(14, 'ELECTRIC_BICYCLE', 'SF-EB-1209', 1, 37.791000, -122.397000, 4.95),
(15, 'CAR', 'NY-CR-7723', 0, 40.750000, -73.980000, 4.75);

-- 13. SEED DELIVERIES
INSERT OR IGNORE INTO deliveries (delivery_id, order_id, partner_id, delivery_status, estimated_delivery_time, actual_delivery_time) VALUES
(1, 101, 12, 'DELIVERED', '2026-08-15 13:00:00', '2026-08-15 12:54:00'),
(2, 102, 13, 'DELIVERED', '2026-08-16 19:45:00', '2026-08-16 19:38:00'),
(3, 103, 12, 'DELIVERED', '2026-08-18 13:30:00', '2026-08-18 13:28:00'),
(4, 104, 15, 'DELIVERED', '2026-08-19 20:45:00', '2026-08-19 20:41:00'),
(5, 105, 14, 'IN_TRANSIT', '2026-08-21 14:30:00', NULL);

-- 14. SEED AUDIT LOGS
INSERT OR IGNORE INTO audit_logs (log_id, table_name, action_type, record_id, description, executed_at) VALUES
(1, 'inventory', 'TRANSACTION_LOCK', 3, 'Acquired exclusive row-level lock on Pepperoni Pizza (item_id=3) for order checkout', '2026-08-21 14:00:00'),
(2, 'orders', 'INSERT', 105, 'Created order header #105 for customer_id=5 total=$26.52', '2026-08-21 14:00:01'),
(3, 'payments', 'INSERT', 5, 'Recorded payment #5 TXN_998120395 SUCCESSFUL amount=$26.52', '2026-08-21 14:00:02');
