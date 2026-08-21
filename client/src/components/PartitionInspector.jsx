import React, { useState, useEffect } from 'react';
import { Layers, Database, Filter, CheckCircle, ArrowRight } from 'lucide-react';

export default function PartitionInspector() {
  const [partitions, setPartitions] = useState([]);

  useEffect(() => {
    fetch('/api/observatory/metrics')
      .then(res => res.json())
      .then(data => {
        if (data.partitions) setPartitions(data.partitions);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Layers size={26} color="#8b5cf6" />
          <div>
            <h2 style={{ fontSize: '1.35rem' }}>Table Range Partitioning Inspector</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              High-scalability date range partitioning strategy for <code style={{ color: '#38bdf8' }}>orders</code> table to accelerate queries across millions of rows.
            </p>
          </div>
        </div>
      </div>

      {/* Partition Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {partitions.map((p, idx) => (
          <div key={idx} className="glass-card" style={{ borderColor: p.status === 'ACTIVE' ? '#8b5cf6' : 'var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '1.1rem', color: '#c084fc' }}>{p.partition_name}</h4>
              <span className={`badge ${p.status === 'ACTIVE' ? 'badge-purple' : p.status === 'READ_ONLY' ? 'badge-blue' : 'badge-amber'}`}>
                {p.status}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <p>Parent Table: <strong style={{ color: 'var(--text-primary)' }}>{p.parent_table}</strong></p>
              <p>Start Date: <strong style={{ color: 'var(--text-primary)' }}>{p.range_start.substring(0, 10)}</strong></p>
              <p>End Date: <strong style={{ color: 'var(--text-primary)' }}>{p.range_end.substring(0, 10)}</strong></p>
              <p>Row Count: <strong style={{ color: '#34d399' }}>{p.row_count.toLocaleString()} rows</strong></p>
              <p>Partition Size: <strong style={{ color: '#60a5fa' }}>{p.size_mb} MB</strong></p>
            </div>
          </div>
        ))}
      </div>

      {/* Partition Pruning Demonstration Box */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="#3b82f6" />
          <span>Partition Pruning Query Optimization</span>
        </h3>
        
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          When executing queries with date parameters, PostgreSQL automatically skips searching non-matching partitions, reducing disk I/O by up to 90%.
        </p>

        <div className="code-block" style={{ marginBottom: '1rem' }}>
          <pre>{`EXPLAIN ANALYZE 
SELECT * FROM orders 
WHERE created_at >= '2026-08-01' AND created_at < '2026-09-01';

-- Result: Query planner automatically prunes orders_2026_m05, m06, m07!
-- Scans ONLY orders_2026_m08 partition.`}</pre>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', fontSize: '0.85rem' }}>
          <CheckCircle size={16} />
          <span>Partition Pruning Efficiency: 75% Reduction in Scanned Table Blocks</span>
        </div>
      </div>

    </div>
  );
}
