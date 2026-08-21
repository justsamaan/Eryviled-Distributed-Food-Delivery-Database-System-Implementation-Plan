import React, { useState } from 'react';
import { Terminal, Play, Cpu, CheckCircle, AlertTriangle, GitCommit } from 'lucide-react';

export default function SqlStudio() {
  const PRESET_QUERIES = [
    {
      title: "Top 5 Restaurants by City Revenue",
      tag: "Window Function (DENSE_RANK)",
      sql: `WITH restaurant_revenue AS (
  SELECT 
    r.city,
    r.name AS restaurant_name,
    rc.category_name,
    COUNT(o.order_id) AS total_orders,
    SUM(o.total_amount) AS total_revenue
  FROM restaurants r
  JOIN restaurant_categories rc ON r.category_id = rc.category_id
  JOIN orders o ON r.restaurant_id = o.restaurant_id
  WHERE o.order_status = 'DELIVERED'
  GROUP BY r.city, r.restaurant_id, r.name, rc.category_name
)
SELECT 
  city,
  restaurant_name,
  category_name,
  total_orders,
  ROUND(total_revenue, 2) AS total_revenue,
  DENSE_RANK() OVER (PARTITION BY city ORDER BY total_revenue DESC) AS revenue_rank
FROM restaurant_revenue
ORDER BY city, revenue_rank;`
    },
    {
      title: "Customer Order Retention & LTV",
      tag: "CTE + Aggregations",
      sql: `WITH customer_summary AS (
  SELECT 
    u.full_name,
    u.email,
    c.membership_tier,
    COUNT(o.order_id) AS order_count,
    SUM(o.total_amount) AS lifetime_spend
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
  ROUND(lifetime_spend / order_count, 2) AS avg_order_value
FROM customer_summary
ORDER BY lifetime_spend DESC;`
    },
    {
      title: "Low Inventory Stockout Alert",
      tag: "Subquery + Threshold",
      sql: `SELECT 
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
ORDER BY i.available_stock ASC;`
    }
  ];

  const [activeQueryIndex, setActiveQueryIndex] = useState(0);
  const [customSql, setCustomSql] = useState(PRESET_QUERIES[0].sql);
  const [explainResult, setExplainResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelectPreset = (index) => {
    setActiveQueryIndex(index);
    setCustomSql(PRESET_QUERIES[index].sql);
    setExplainResult(null);
  };

  const handleRunQuery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sql/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: customSql })
      });
      const data = await res.json();
      setExplainResult(data);
    } catch (err) {
      console.error('Error running EXPLAIN ANALYZE:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Title */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Terminal size={24} color="#3b82f6" />
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>SQL Studio & EXPLAIN ANALYZE Visualizer</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Test complex SQL queries, inspect B-Tree index scans vs sequential scans, and compare execution plan timings.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Query Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto' }}>
        {PRESET_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(idx)}
            className="glass-card"
            style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              borderColor: activeQueryIndex === idx ? '#3b82f6' : 'var(--border-color)',
              background: activeQueryIndex === idx ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-card)',
              textAlign: 'left'
            }}
          >
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: activeQueryIndex === idx ? '#60a5fa' : 'var(--text-primary)' }}>
              {q.title}
            </p>
            <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginTop: '0.35rem' }}>
              {q.tag}
            </span>
          </button>
        ))}
      </div>

      {/* Editor & Execute Action Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>SQL QUERY EDITOR</span>
          <button onClick={handleRunQuery} className="btn btn-primary" disabled={loading}>
            <Play size={16} />
            <span>{loading ? 'Executing Query...' : 'Run & EXPLAIN ANALYZE'}</span>
          </button>
        </div>

        <textarea
          value={customSql}
          onChange={(e) => setCustomSql(e.target.value)}
          rows={10}
          style={{
            width: '100%',
            backgroundColor: '#030712',
            color: '#38bdf8',
            fontFamily: 'Fira Code, monospace',
            fontSize: '0.9rem',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            outline: 'none',
            resize: 'vertical'
          }}
        />
      </div>

      {/* EXPLAIN ANALYZE Performance & Plan Tree Output */}
      {explainResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Query Performance Summary Bar */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>INDEXED LATENCY</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                  {explainResult.actualExecutionTimeMs} ms
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UNINDEXED BASELINE</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>
                  {explainResult.unindexedTimeMs} ms
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SPEEDUP IMPROVEMENT</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>
                  {explainResult.speedupPercent}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>EXECUTION SCAN TYPE</p>
                <span className={`badge ${explainResult.usesIndex ? 'badge-emerald' : 'badge-amber'}`} style={{ marginTop: '0.35rem' }}>
                  {explainResult.usesIndex ? 'B-Tree Index Scan' : 'Full Table Scan'}
                </span>
              </div>
            </div>
          </div>

          {/* EXPLAIN Execution Tree Nodes */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GitCommit size={18} color="#3b82f6" />
              <span>Query Execution Plan Tree</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {explainResult.explainPlanTree.map((node, idx) => (
                <div key={idx} style={{ padding: '0.85rem', background: '#030712', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                      ↳ {node.nodeType}
                    </span>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {node.detail}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <p>Estimated Cost: <span style={{ color: '#fbbf24' }}>{node.totalCost}</span></p>
                    <p>Rows Returned: <span style={{ color: '#34d399' }}>{node.actualRows}</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Returned Data Table */}
          <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.85rem' }}>
              Query Results ({explainResult.rowsCount} Rows)
            </h3>
            {explainResult.data.length > 0 ? (
              <table className="custom-table">
                <thead>
                  <tr>
                    {Object.keys(explainResult.data[0]).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {explainResult.data.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {Object.values(row).map((val, cIdx) => (
                        <td key={cIdx}>{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No data returned.</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
