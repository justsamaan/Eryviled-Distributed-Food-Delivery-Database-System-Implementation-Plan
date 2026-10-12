import React from 'react';
import { Database, Terminal, ShieldAlert, Layers, ShoppingBag, BookOpen, Activity, Sparkles, BrainCircuit } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'observatory', label: 'Admin Observatory', icon: Database },
    { id: 'aiStudio', label: '✨ AI Studio', icon: Sparkles },
    { id: 'sqlStudio', label: 'SQL Studio & EXPLAIN', icon: Terminal },
    { id: 'concurrencyLab', label: 'Concurrency Lab', icon: ShieldAlert },
    { id: 'partitioning', label: 'Partition Inspector', icon: Layers },
    { id: 'customerApp', label: 'Food Delivery App', icon: ShoppingBag },
    { id: 'aiHub', label: 'AI Intelligence Hub', icon: BrainCircuit },
    { id: 'documentation', label: 'ERD & Docs', icon: BookOpen },
  ];

  return (
    <header className="glass-panel" style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-color)', borderRadius: 0 }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Title & Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #a855f7 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)' }}>
            <Sparkles size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }} className="gradient-text">
                AI-Powered Food Delivery DB
              </h2>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Activity size={10} /> AI ENGINE ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              DBMS Portfolio Engine • 18 Normalized Tables & Vector Similarity
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflowX: 'auto' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isAiTab = item.id === 'aiStudio';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-tab ${isActive ? 'active' : ''}`}
                style={isAiTab ? { background: isActive ? 'linear-gradient(135deg, #a855f7, #3b82f6)' : 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: isActive ? '#fff' : '#c084fc' } : {}}
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

