const { query, execute } = require('../db/connection');

// Calculates Cosine Similarity between two N-dimensional numerical arrays
function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generates dynamic AI match recommendations for a given customer
async function getAiRecommendationsForCustomer(customerId = 1, customPreferences = null) {
  const startTime = performance.now();

  let userVector = [0.5, 0.5, 0.5, 0.0, 0.5];
  let spiceLevel = 0.5, healthScore = 0.5, priceSensitivity = 0.5, veganWeight = 0.0, asianPreference = 0.5;

  if (customPreferences) {
    spiceLevel = Number(customPreferences.spiceLevel ?? 0.5);
    healthScore = Number(customPreferences.healthScore ?? 0.5);
    priceSensitivity = Number(customPreferences.priceSensitivity ?? 0.5);
    veganWeight = Number(customPreferences.veganWeight ?? 0.0);
    asianPreference = Number(customPreferences.asianPreference ?? 0.5);
    userVector = [spiceLevel, healthScore, priceSensitivity, veganWeight, asianPreference];
  } else {
    const userRes = await query('SELECT * FROM user_embeddings WHERE user_id = ?', [customerId]);
    if (userRes.rows.length > 0) {
      const u = userRes.rows[0];
      spiceLevel = u.spice_level;
      healthScore = u.health_score;
      priceSensitivity = u.price_sensitivity;
      veganWeight = u.vegan_weight;
      asianPreference = u.asian_preference;
      userVector = [spiceLevel, healthScore, priceSensitivity, veganWeight, asianPreference];
    }
  }

  // Fetch items with their 5D feature vectors
  const itemsRes = await query(`
    SELECT m.item_id, m.item_name, m.description, m.price, m.dish_type, r.name as restaurant_name, r.city, ie.spiciness, ie.healthiness, ie.price_point, ie.vegan_rating, ie.asian_fusion
    FROM menu_items m
    JOIN item_embeddings ie ON m.item_id = ie.item_id
    JOIN restaurants r ON m.restaurant_id = r.restaurant_id
    WHERE m.is_available = 1
  `);

  const recommendations = itemsRes.rows.map(item => {
    const itemVector = [item.spiciness, item.healthiness, item.price_point, item.vegan_rating, item.asian_fusion];
    const rawSimilarity = calculateCosineSimilarity(userVector, itemVector);
    const matchPercentage = Number((rawSimilarity * 100).toFixed(1));

    // Dynamic reasoning tag generator
    let reasoning = [];
    if (userVector[0] > 0.6 && item.spiciness > 0.6) reasoning.push('Spicy Flavor Match');
    if (userVector[1] > 0.6 && item.healthiness > 0.6) reasoning.push('High Nutritive Value');
    if (userVector[3] > 0.5 && item.vegan_rating > 0.8) reasoning.push('Strict Vegan Certified');
    if (userVector[4] > 0.6 && item.asian_fusion > 0.7) reasoning.push('Asian Cuisine Preference');
    if (reasoning.length === 0) reasoning.push('Top Preference Vector Alignment');

    return {
      ...item,
      itemVector,
      matchPercentage,
      reasoningTag: `${matchPercentage}% Match (${reasoning.join(' • ')})`,
    };
  });

  // Sort descending by match percentage
  recommendations.sort((a, b) => b.matchPercentage - a.matchPercentage);

  const endTime = performance.now();
  const latencyMs = Number((endTime - startTime).toFixed(2));

  return {
    customerId,
    userVector: { spiceLevel, healthScore, priceSensitivity, veganWeight, asianPreference },
    latencyMs,
    algorithm: '5D_COSINE_VECTOR_SIMILARITY',
    topRecommendations: recommendations.slice(0, 6)
  };
}

module.exports = {
  calculateCosineSimilarity,
  getAiRecommendationsForCustomer
};
