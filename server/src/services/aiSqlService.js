const dbSchema = {
  users: ['user_id', 'email', 'full_name', 'phone_number', 'user_role', 'created_at'],
  customers: ['customer_id', 'membership_tier', 'loyalty_points', 'preferred_payment_method'],
  restaurants: ['restaurant_id', 'owner_id', 'name', 'category_id', 'city', 'street_address', 'latitude', 'longitude', 'rating', 'is_active'],
  menu_items: ['item_id', 'restaurant_id', 'item_name', 'description', 'price', 'dish_type', 'is_available'],
  inventory: ['inventory_id', 'item_id', 'available_stock', 'reserved_stock'],
  orders: ['order_id', 'customer_id', 'restaurant_id', 'delivery_address_id', 'order_status', 'subtotal', 'tax_amount', 'delivery_fee', 'discount_amount', 'total_amount', 'created_at'],
  reviews: ['review_id', 'order_id', 'customer_id', 'restaurant_id', 'rating', 'comment'],
  ai_review_insights: ['insight_id', 'review_id', 'sentiment_label', 'sentiment_score', 'key_themes']
};

const patterns = [
  {
    regex: /(revenue|income|total spend)/i,
    handler: (query, text) => {
      if (/by restaurant/i.test(text) || /per restaurant/i.test(text)) {
        return {
          sql: `SELECT r.name, ROUND(SUM(o.total_amount), 2) as total_revenue
FROM restaurants r
JOIN orders o ON r.restaurant_id = o.restaurant_id
WHERE o.order_status = 'DELIVERED'
GROUP BY r.restaurant_id
ORDER BY total_revenue DESC;`,
          explanation: "AI compiled: Aggregated order total amounts joined with restaurants, filtered by delivered orders, grouped by restaurant ID."
        };
      }
      if (/by city/i.test(text) || /per city/i.test(text)) {
        return {
          sql: `SELECT r.city, ROUND(SUM(o.total_amount), 2) as city_revenue
FROM restaurants r
JOIN orders o ON r.restaurant_id = o.restaurant_id
WHERE o.order_status = 'DELIVERED'
GROUP BY r.city
ORDER BY city_revenue DESC;`,
          explanation: "AI compiled: Aggregated order total amounts joined with restaurants, filtered by delivered orders, grouped by restaurant city."
        };
      }
      return {
        sql: `SELECT ROUND(SUM(total_amount), 2) as total_revenue FROM orders WHERE order_status = 'DELIVERED';`,
        explanation: "AI compiled: Calculated sum of total_amount from orders where status is DELIVERED."
      };
    }
  },
  {
    regex: /(low stock|stock|out of stock|inventory)/i,
    handler: () => {
      return {
        sql: `SELECT m.item_name, r.name as restaurant_name, i.available_stock
FROM inventory i
JOIN menu_items m ON i.item_id = m.item_id
JOIN restaurants r ON m.restaurant_id = r.restaurant_id
WHERE i.available_stock <= 5
ORDER BY i.available_stock ASC;`,
        explanation: "AI compiled: Filtered inventory table where available_stock is 5 or less, joined with menu items and restaurants."
      };
    }
  },
  {
    regex: /(sentiment|reviews|customer ratings|customer comments|feedback)/i,
    handler: (query, text) => {
      if (/positive/i.test(text)) {
        return {
          sql: `SELECT r.comment, r.rating, i.sentiment_score, res.name as restaurant_name
FROM reviews r
JOIN ai_review_insights i ON r.review_id = i.review_id
JOIN restaurants res ON r.restaurant_id = res.restaurant_id
WHERE i.sentiment_label = 'POSITIVE'
ORDER BY i.sentiment_score DESC;`,
          explanation: "AI compiled: Fetched positive customer reviews joined with AI insights and restaurant details."
        };
      }
      if (/negative/i.test(text)) {
        return {
          sql: `SELECT r.comment, r.rating, i.sentiment_score, res.name as restaurant_name
FROM reviews r
JOIN ai_review_insights i ON r.review_id = i.review_id
JOIN restaurants res ON r.restaurant_id = res.restaurant_id
WHERE i.sentiment_label = 'NEGATIVE'
ORDER BY i.sentiment_score ASC;`,
          explanation: "AI compiled: Fetched negative customer reviews joined with AI insights showing low sentiment scores."
        };
      }
      return {
        sql: `SELECT i.sentiment_label, COUNT(*) as review_count, ROUND(AVG(r.rating), 2) as avg_rating
FROM reviews r
JOIN ai_review_insights i ON r.review_id = i.review_id
GROUP BY i.sentiment_label;`,
        explanation: "AI compiled: Aggregated reviews grouped by AI-generated sentiment labels showing counts and average ratings."
      };
    }
  },
  {
    regex: /(customers|users|members)/i,
    handler: (query, text) => {
      if (/platinum/i.test(text) || /vip/i.test(text)) {
        return {
          sql: `SELECT u.full_name, u.email, c.membership_tier, c.loyalty_points
FROM users u
JOIN customers c ON u.user_id = c.customer_id
WHERE c.membership_tier = 'PLATINUM'
ORDER BY c.loyalty_points DESC;`,
          explanation: "AI compiled: Selected users joined with customers where the loyalty membership tier is PLATINUM."
        };
      }
      return {
        sql: `SELECT u.full_name, u.email, c.membership_tier, c.loyalty_points
FROM users u
JOIN customers c ON u.user_id = c.customer_id
ORDER BY c.loyalty_points DESC;`,
        explanation: "AI compiled: Selected customer names and emails ordered by loyalty points descending."
      };
    }
  },
  {
    regex: /(restaurants|cuisine|menu|food)/i,
    handler: (query, text) => {
      if (/top rated/i.test(text) || /best/i.test(text)) {
        return {
          sql: `SELECT name, city, rating FROM restaurants WHERE is_active = 1 ORDER BY rating DESC LIMIT 3;`,
          explanation: "AI compiled: Selected active restaurants ordered by average rating descending."
        };
      }
      if (/italian/i.test(text) || /pizza/i.test(text)) {
        return {
          sql: `SELECT r.name, r.city, r.rating FROM restaurants r
JOIN restaurant_categories c ON r.category_id = c.category_id
WHERE c.category_name LIKE '%Italian%';`,
          explanation: "AI compiled: Filtered restaurants by Italian category name."
        };
      }
      return {
        sql: `SELECT r.name, c.category_name, r.city, r.rating FROM restaurants r
JOIN restaurant_categories c ON r.category_id = c.category_id;`,
        explanation: "AI compiled: Fetched all restaurants joined with their cuisine categories."
      };
    }
  }
];

function translateToSql(prompt) {
  for (const pattern of patterns) {
    if (pattern.regex.test(prompt)) {
      return pattern.handler(pattern.regex, prompt);
    }
  }

  // Fallback default query
  return {
    sql: `SELECT r.name as restaurant, COUNT(o.order_id) as order_count, SUM(o.total_amount) as revenue
FROM restaurants r
LEFT JOIN orders o ON r.restaurant_id = o.restaurant_id
GROUP BY r.restaurant_id;`,
    explanation: "AI compiled fallback: Summarized orders count and revenue generated by restaurant."
  };
}

module.exports = { translateToSql };
