import React, { useState } from 'react';
import { ShieldAlert, Play, Lock, Unlock, CheckCircle, AlertTriangle, UserCheck, UserX, RefreshCw } from 'lucide-react';

export default function ConcurrencyLab() {
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/concurrency/simulate', { method: 'POST' });
      const data = await res.json();
      setSimulationResult(data);
    } catch (err) {
      console.error('Failed to run concurrency simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldAlert size={26} color="#f43f5e" />
            <div>
              <h2 style={{ fontSize: '1.35rem' }}>Concurrency & Race Condition Laboratory</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Demonstrating Row-Level Locking (<code style={{ color: '#38bdf8' }}>SELECT ... FOR UPDATE</code>), SERIALIZABLE isolation, and preventing double-booking anomalies.
              </p>
            </div>
          </div>
          <button onClick={handleSimulate} className="btn btn-rose" disabled={loading}>
            <Play size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Executing Concurrent Threads...' : 'Simulate Simultaneous Checkout'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Diagram & Explanation Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        
        {/* Customer 1 Thread Box */}
        <div className="glass-card" style={{ borderColor: 'rgba(59, 130, 246, 0.3)', background: 'rgba(59, 130, 246, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <UserCheck size={20} color="#60a5fa" />
            <h4 style={{ fontSize: '1rem', color: '#60a5fa' }}>THREAD-1: Alex Morgan</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Attempts to purchase Pepperoni Pizza (Last 1 unit remaining in inventory) at <strong>14:00:00.001</strong>.
          </p>
          <span className="badge badge-blue">Acquires Exclusive Row Lock</span>
        </div>

        {/* Customer 2 Thread Box */}
        <div className="glass-card" style={{ borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <UserX size={20} color="#f87171" />
            <h4 style={{ fontSize: '1rem', color: '#f87171' }}>THREAD-2: Sarah Chen</h4>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
            Attempts to purchase Pepperoni Pizza at the exact same millisecond <strong>14:00:00.001</strong>.
          </p>
          <span className="badge badge-rose">Blocked & Safely Rolled Back</span>
        </div>

      </div>

      {/* Real-time Lock Execution Timeline Logs */}
      {simulationResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Winner / Loser Result Card */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TRANSACTION ISOLATION RESULT</p>
                <h3 style={{ fontSize: '1.2rem', color: '#34d399', margin: '0.25rem 0' }}>
                  Winner: {simulationResult.winner}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#f87171' }}>
                  Rolled Back: {simulationResult.loser}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-emerald">Available Stock: {simulationResult.inventoryAfter.available_stock}</span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  Reserved Stock: {simulationResult.inventoryAfter.reserved_stock}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Terminal Logs */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} color="#fbbf24" />
              <span>Step-by-Step Row-Lock Execution Timeline</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {simulationResult.logs.map((log, idx) => (
                <div key={idx} style={{ padding: '0.75rem 1rem', background: '#030712', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '90px' }}>
                    {log.time}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '170px', color: log.thread.includes('THREAD-1') ? '#60a5fa' : log.thread.includes('THREAD-2') ? '#f87171' : '#fbbf24' }}>
                    [{log.thread}]
                  </span>
                  <span style={{ fontSize: '0.85rem', color: log.status === 'ERROR' || log.status === 'ROLLBACK' ? '#f87171' : log.status === 'SUCCESS' || log.status === 'COMMIT' ? '#34d399' : 'var(--text-primary)' }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
