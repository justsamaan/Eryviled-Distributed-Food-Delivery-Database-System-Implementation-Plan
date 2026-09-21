function optimizeQuery(sql) {
  let optimizedSql = sql;
  let explanation = "Query already seems optimized.";

  // Heuristic: Convert * to specific columns if massive query detected
  if (sql.includes('SELECT *')) {
    optimizedSql = sql.replace('SELECT *', 'SELECT order_id, customer_id, total_amount');
    explanation = "Optimized: Avoided SELECT * to reduce I/O overhead on large tables.";
  }

  // Heuristic: Suggest LIMIT if large scan
  if (!sql.includes('LIMIT') && (sql.includes('orders') || sql.includes('inventory'))) {
    optimizedSql += "\nLIMIT 100;";
    explanation = "Optimized: Added LIMIT to prevent excessive result set retrieval.";
  }

  return { optimizedSql, explanation };
}

module.exports = { optimizeQuery };
