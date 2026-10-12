-- ============================================================================
-- 05_ADVANCED_QUERIES.SQL: Complex Real-World Analytical SQL Queries
-- Demonstrates CTEs, Window Functions (DENSE_RANK), Aggregations & Joins
-- ============================================================================

-- ----------------------------------------------------------------------------
-- QUERY 1: Top 5 Restaurants per City by Revenue (Window Function: DENSE_RANK)
-- ----------------------------------------------------------------------------
WITH restaurant_revenue AS (
    SELECT 
        r.city,
        r.restaurant_id,
        r.name AS restaurant_name,
        rc.category_name,
        COUNT(o.order_id) AS total_orders,
        SUM(o.total_amount) AS total_revenue
    FROM restaurants r
    JOIN restaurant_categories rc ON r.category_id = rc.category_id
    JOIN orders o ON r.restaurant_id = o.restaurant_id
    WHERE o.order_status = 'DELIVERED'
    GROUP BY r.city, r.restaurant_id, r.name, rc.category_name
),
ranked_restaurants AS (
    SELECT 
        city,
        restaurant_name,
        category_name,
        total_orders,
        total_revenue,
        DENSE_RANK() OVER (PARTITION BY city ORDER BY total_revenue DESC) AS revenue_rank
    FROM restaurant_revenue
)
SELECT city, revenue_rank, restaurant_name, category_name, total_orders, total_revenue
FROM ranked_restaurants
WHERE revenue_rank <= 5
ORDER BY city, revenue_rank;


-- ----------------------------------------------------------------------------
-- QUERY 2: Customer Order Retention & Lifetime Value (CTE + Window Aggregations)
-- ----------------------------------------------------------------------------
WITH customer_summary AS (
    SELECT 
        u.user_id,
        u.full_name,
        u.email,
        c.membership_tier,
        COUNT(o.order_id) AS order_count,
        SUM(o.total_amount) AS lifetime_spend,
        MIN(o.created_at) AS first_order_date,
        MAX(o.created_at) AS last_order_date
    FROM users u
    JOIN customers c ON u.user_id = c.customer_id
    JOIN orders o ON u.user_id = o.customer_id
    WHERE o.order_status = 'DELIVERED'
    GROUP BY u.user_id, u.full_name, u.email, c.membership_tier
)
SELECT 
    full_name,
    membership_tier,
    order_count,
    ROUND(lifetime_spend, 2) AS total_ltv,
    ROUND(lifetime_spend / order_count, 2) AS avg_order_value,
    first_order_date,
    last_order_date
FROM customer_summary
WHERE order_count >= 2
ORDER BY lifetime_spend DESC;


-- ----------------------------------------------------------------------------
-- QUERY 3: Peak Delivery Time Latency Analysis (Delivery Turnaround Metrics)
-- ----------------------------------------------------------------------------
SELECT 
    r.city,
    dp.vehicle_type,
    COUNT(d.delivery_id) AS completed_deliveries,
    ROUND(AVG(o.delivery_fee), 2) AS avg_delivery_fee,
    ROUND(AVG(o.total_amount), 2) AS avg_order_value
FROM deliveries d
JOIN orders o ON d.order_id = o.order_id
JOIN restaurants r ON o.restaurant_id = r.restaurant_id
JOIN delivery_partners dp ON d.partner_id = dp.partner_id
WHERE d.delivery_status = 'DELIVERED'
GROUP BY r.city, dp.vehicle_type
HAVING COUNT(d.delivery_id) >= 1
ORDER BY completed_deliveries DESC;


-- ----------------------------------------------------------------------------
-- QUERY 4: Inventory Stockout Alert (Subquery + Low Stock Threshold)
-- ----------------------------------------------------------------------------
SELECT 
    r.name AS restaurant_name,
    m.item_name,
    m.price,
    i.available_stock,
    i.reserved_stock,
    CASE 
        WHEN i.available_stock = 0 THEN 'OUT_OF_STOCK'
        WHEN i.available_stock <= 5 THEN 'CRITICAL_LOW'
        ELSE 'SUFFICIENT'
    END AS stock_status
FROM inventory i
JOIN menu_items m ON i.item_id = m.item_id
JOIN restaurants r ON m.restaurant_id = r.restaurant_id
WHERE i.available_stock <= 5
ORDER BY i.available_stock ASC;


-- ----------------------------------------------------------------------------
-- QUERY 5: AI-Based Personalization & Cosine Vector Similarity Ranker
-- Calculates 5D vector dot product & normalized similarity between User & Dish Embeddings
-- ----------------------------------------------------------------------------
WITH vector_math AS (
    SELECT 
        u.user_id,
        u.full_name AS customer_name,
        m.item_id,
        m.item_name,
        r.name AS restaurant_name,
        m.price,
        m.dish_type,
        -- Vector Dot Product: (u1*v1 + u2*v2 + u3*v3 + u4*v4 + u5*v5)
        (ue.spice_level * ie.spiciness + 
         ue.health_score * ie.healthiness + 
         ue.price_sensitivity * ie.price_point + 
         ue.vegan_weight * ie.vegan_rating + 
         ue.asian_preference * ie.asian_fusion) AS dot_product,
        -- Vector Norms
        SQRT(ue.spice_level*ue.spice_level + ue.health_score*ue.health_score + ue.price_sensitivity*ue.price_sensitivity + ue.vegan_weight*ue.vegan_weight + ue.asian_preference*ue.asian_preference) AS u_norm,
        SQRT(ie.spiciness*ie.spiciness + ie.healthiness*ie.healthiness + ie.price_point*ie.price_point + ie.vegan_rating*ie.vegan_rating + ie.asian_fusion*ie.asian_fusion) AS i_norm
    FROM user_embeddings ue
    JOIN users u ON ue.user_id = u.user_id
    CROSS JOIN item_embeddings ie
    JOIN menu_items m ON ie.item_id = m.item_id
    JOIN restaurants r ON m.restaurant_id = r.restaurant_id
    WHERE ue.user_id = 1 AND m.is_available = 1
),
cosine_scores AS (
    SELECT 
        customer_name,
        item_name,
        restaurant_name,
        price,
        dish_type,
        ROUND((dot_product / (u_norm * i_norm)) * 100, 2) AS ai_match_percentage
    FROM vector_math
)
SELECT 
    customer_name,
    item_name,
    restaurant_name,
    price,
    dish_type,
    ai_match_percentage || '%' AS personalization_match
FROM cosine_scores
ORDER BY ai_match_percentage DESC
LIMIT 5;

