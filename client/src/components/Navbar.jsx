import React from 'react';
import { Database, Terminal, ShieldAlert, Layers, ShoppingBag, BookOpen, Activity } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'observatory', label: 'Admin Observatory', icon: Database },
    { id: 'sqlStudio', label: 'SQL Studio & EXPLAIN', icon: Terminal },
    { id: 'concurrencyLab', label: 'Concurrency Lab', icon: ShieldAlert },
    { id: 'partitioning', label: 'Partition Inspector', icon: Layers },
    { id: 'customerApp', label: 'Food Delivery App', icon: ShoppingBag },
    { id: 'documentation', label: 'ERD & Docs', icon: BookOpen },
  ];

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-color)', borderRadius: 0 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Title & Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)' }}>
            <Database size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="gradient-text">
                Distributed Food Delivery
              </h2>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Activity size={10} /> LIVE ENGINE
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              DBMS Portfolio Engine • 15 Normalized Tables (3NF/BCNF)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-tab ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
