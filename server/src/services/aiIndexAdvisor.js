function suggestIndexes(sql) {
  const recommendations = [];
  const lowerSql = sql.toLowerCase();

  // Heuristic: Suggest index if joining on ID columns but not indexed
  if (lowerSql.includes('join') && (lowerSql.includes('customer_id') || lowerSql.includes('restaurant_id'))) {
    recommendations.push("CREATE INDEX idx_fk_customer_restaurant ON orders(customer_id, restaurant_id);");
  }

  // Heuristic: Suggest index if filtering on city or status
  if (lowerSql.includes('where') && lowerSql.includes('city')) {
    recommendations.push("CREATE INDEX idx_restaurants_city ON restaurants(city);");
  }

  if (lowerSql.includes('where') && lowerSql.includes('status')) {
    recommendations.push("CREATE INDEX idx_orders_status ON orders(order_status);");
  }

  return recommendations.length > 0 ? recommendations : ["No index optimization required."];
}

module.exports = { suggestIndexes };
