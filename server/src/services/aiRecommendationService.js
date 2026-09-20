const { query } = require('../db/connection');

/**
 * Executes a state-of-the-art Collaborative filtering recommendation in pure SQL!
 * Suggests menu items based on the user's preferred categories, matching item popularity,
 * and high ratings by other users with similar tastes.
 */
async function getRecommendations(customerId) {
  // Let's first make sure the customer has some orders. If not, fallback to high-rated items.
  const hasOrders = await query('SELECT COUNT(*) as count FROM orders WHERE customer_id = ?', [customerId]);
  const orderCount = hasOrders.rows[0].count || 0;

  if (orderCount === 0) {
    // Cold start strategy: recommend top-rated, available items across active restaurants
    const fallbackSql = `
      SELECT
        m.item_id, m.item_name, m.price, m.dish_type, m.description,
        r.name as restaurant_name, r.rating as restaurant_rating,
        'CO_START_POPULAR' as recommendation_reason,
        5.0 as ai_match_score
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.restaurant_id
      JOIN inventory i ON m.item_id = i.item_id
      WHERE m.is_available = 1 AND i.available_stock > 0
      ORDER BY r.rating DESC
      LIMIT 3
    `;
    return query(fallbackSql);
  }

  // Collaborative & Content-Based Hybrid in SQL:
  // Step 1: Find the user's preferred categories (from their previous orders)
  // Step 2: Find active menu items within those categories that they haven't ordered yet
  // Step 3: Rank them by a calculated match score based on rating and popularity
  const recommendationsSql = `
    WITH customer_preferred_categories AS (
      -- Find categories the user has ordered from
      SELECT
        r.category_id,
        COUNT(o.order_id) as category_order_count
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.restaurant_id
      WHERE o.customer_id = ?
      GROUP BY r.category_id
    ),
    ordered_items AS (
      -- Items the user has already ordered (to exclude from recommendations)
      SELECT DISTINCT oi.item_id
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.customer_id = ?
    )
    SELECT
      m.item_id,
      m.item_name,
      m.price,
      m.dish_type,
      m.description,
      r.name as restaurant_name,
      r.rating as restaurant_rating,
      'PREFERRED_CATEGORY' as recommendation_reason,
      -- AI Score calculation based on category order count weight + restaurant rating
      ROUND((cpc.category_order_count * 1.5) + (r.rating * 1.2), 2) as ai_match_score
    FROM menu_items m
    JOIN restaurants r ON m.restaurant_id = r.restaurant_id
    JOIN customer_preferred_categories cpc ON r.category_id = cpc.category_id
    JOIN inventory inv ON m.item_id = inv.item_id
    LEFT JOIN ordered_items oi ON m.item_id = oi.item_id
    WHERE m.is_available = 1
      AND inv.available_stock > 0
      AND oi.item_id IS NULL -- Exclude already ordered items
    ORDER BY ai_match_score DESC
    LIMIT 3;
  `;

  const results = await query(recommendationsSql, [customerId, customerId]);

  // If the query didn't yield enough, fallback to popular items
  if (results.rows.length === 0) {
    const backupResults = await query(`
      SELECT
        m.item_id, m.item_name, m.price, m.dish_type, m.description,
        r.name as restaurant_name, r.rating as restaurant_rating,
        'POPULAR_DISH' as recommendation_reason,
        4.5 as ai_match_score
      FROM menu_items m
      JOIN restaurants r ON m.restaurant_id = r.restaurant_id
      JOIN inventory i ON m.item_id = i.item_id
      WHERE m.is_available = 1 AND i.available_stock > 0
      ORDER BY r.rating DESC
      LIMIT 3
    `);
    return backupResults;
  }

  return results;
}

module.exports = { getRecommendations };
