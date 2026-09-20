-- ============================================================================
-- 07_AI_SEED.SQL: AI-Enhanced Review Data for Sentiment Analysis
-- ============================================================================

INSERT OR IGNORE INTO reviews (review_id, order_id, customer_id, restaurant_id, rating, comment) VALUES
(1, 1, 1, 1, 5, 'The truffle mushroom pizza was absolutely delicious! Best pizza in New York.'),
(2, 2, 2, 2, 2, 'Delivery was extremely slow and the ramen broth arrived cold. Very disappointing.'),
(3, 3, 3, 3, 4, 'Great burger, but the truffle fries were a bit too salty for my taste. Overall good experience.'),
(4, 4, 4, 4, 1, 'The curry was completely wrong, way too spicy and the garlic naan was burned. Terrible food.'),
(5, 5, 5, 5, 5, 'Fresh, healthy, and fast! The grain bowl is my new favorite healthy spot in San Francisco.');

INSERT OR IGNORE INTO ai_review_insights (review_id, sentiment_label, sentiment_score, key_themes) VALUES
(1, 'POSITIVE', 0.9, 'delicious, best pizza'),
(2, 'NEGATIVE', -0.6, 'slow delivery, cold food'),
(3, 'NEUTRAL', 0.1, 'good burger, salty fries'),
(4, 'NEGATIVE', -0.8, 'wrong curry, spicy, burned naan'),
(5, 'POSITIVE', 0.95, 'fresh, healthy, fast');
