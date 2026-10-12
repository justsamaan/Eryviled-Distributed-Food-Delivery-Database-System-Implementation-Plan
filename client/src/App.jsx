import React, { useEffect, useState } from 'react';
import {
  Activity, BookOpen, BrainCircuit, Database, Layers, LockKeyhole,
  Search, ShoppingBag, Sparkles, Terminal, Utensils, ChevronRight
} from 'lucide-react';
import Observatory from './components/Observatory';
import SqlStudio from './components/SqlStudio';
import ConcurrencyLab from './components/ConcurrencyLab';
import PartitionInspector from './components/PartitionInspector';
import CustomerView from './components/CustomerView';
import AiSentimentHub from './components/AiSentimentHub';
import DocumentationView from './components/DocumentationView';
import AiRecommendationLab from './components/AiRecommendationLab';


// All React modules share one configurable backend URL. The setting is local to this browser.
const getConfiguredApiBase = () => {
  try { return String(window.localStorage.getItem('eryviledApiBase') || import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\\/+$/, ''); }
  catch { return String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\\/+$/, ''); }
};
if (typeof window !== 'undefined' && !window.__eryviledFetchPatched) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const base = getConfiguredApiBase();
    if (base && typeof input === 'string' && input.startsWith('/api/')) input = base + input;
    return originalFetch(input, init);
  };
  window.__eryviledFetchPatched = true;
}

const navigation = [
  { group: 'EXPERIENCE', items: [
    { id: 'storefrontPreview', label: 'Customer storefront', icon: ShoppingBag, description: 'Browse food and place orders' },
    { id: 'customerApp', label: 'DBMS customer app', icon: Utensils, description: 'Transaction-backed ordering' },
  ]},
  { group: 'DATABASE SYSTEMS', items: [
    { id: 'observatory', label: 'Admin observatory', icon: Database, description: 'Metrics, cache and system health' },
    { id: 'sqlStudio', label: 'Query optimizer & SQL', icon: Terminal, description: 'SQL Studio, EXPLAIN and indexes' },
    { id: 'concurrencyLab', label: 'Concurrency lab', icon: LockKeyhole, description: 'Locks, races and ACID behaviour' },
    { id: 'partitioning', label: 'Partition inspector', icon: Layers, description: 'Range partitioning and scale' },
  ]},
  { group: 'ARTIFICIAL INTELLIGENCE', items: [
    { id: 'aiStudio', label: 'AI studio', icon: Sparkles, description: 'NLP-to-SQL, ETA and recommendations' },
    { id: 'aiHub', label: 'AI intelligence hub', icon: BrainCircuit, description: 'Customer sentiment analytics' },
  ]},
  { group: 'REFERENCE', items: [
    { id: 'documentation', label: 'ERD & documentation', icon: BookOpen, description: 'Schema and project architecture' },
  ]},
];
const allItems = navigation.flatMap(group => group.items);

export default function App() {
  const [activeTab, setActiveTab] = useState('storefrontPreview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiBase, setApiBase] = useState(() => getConfiguredApiBase());
  const [apiDraft, setApiDraft] = useState(() => getConfiguredApiBase());
  const [apiMessage, setApiMessage] = useState('');
  const isStorefront = activeTab === 'storefrontPreview';
  const saveApiBase = () => {
    const value = apiDraft.trim().replace(/\\/+$/, '');
    try { window.localStorage.setItem('eryviledApiBase', value); } catch {}
    window.ERYVILED_API_BASE = value;
    setApiBase(value);
    setApiMessage(value ? 'Backend URL saved for this browser.' : 'Backend URL cleared. Relative API requests will be used.');
    window.setTimeout(() => setApiMessage(''), 4000);
  };
  const activeItem = allItems.find(item => item.id === activeTab) || allItems[0];

  useEffect(() => {
    const handleStorefrontNavigation = (event) => {
      if (event.data?.type === 'eryviled:navigate' && allItems.some(item => item.id === event.data.tab)) {
        setActiveTab(event.data.tab);
        setSidebarOpen(false);
      }
    };
    window.addEventListener('message', handleStorefrontNavigation);
    return () => window.removeEventListener('message', handleStorefrontNavigation);
  }, []);

  if (isStorefront) {
    return (
      <iframe
        title="Eryviled customer storefront"
        src={`${import.meta.env.BASE_URL}eryviled-storefront-preview.html?apiBase=${encodeURIComponent(apiBase)}`}
        style={{ display: 'block', width: '100%', height: '100vh', minHeight: '650px', border: 0, background: '#f8f7f2' }}
      />
    );
  }

  return (
    <div className="ery-app">
      {sidebarOpen && <button className="ery-mobile-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`ery-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <button className="ery-brand" onClick={() => { setActiveTab('storefrontPreview'); setSidebarOpen(false); }} aria-label="Return to Eryviled storefront">
          <span className="ery-brand-mark">e<span>.</span></span>
          <span className="ery-brand-word">eryviled<small>FOOD, DATA & INTELLIGENCE</small></span>
        </button>
        <div className="ery-side-kicker">WORKSPACE</div>
        <nav className="ery-navigation" aria-label="Eryviled workspace">
          {navigation.map(group => (
            <section className="ery-nav-group" key={group.group}>
              <div className="ery-nav-heading">{group.group}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={`ery-nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}>
                    <Icon size={17} strokeWidth={1.8} />
                    <span className="ery-nav-copy"><b>{item.label}</b><small>{item.description}</small></span>
                    {activeTab === item.id && <ChevronRight size={15} className="ery-nav-chevron" />}
                  </button>
                );
              })}
            </section>
          ))}
        </nav>
        <div className="ery-sidebar-bottom">
          <div className="ery-project-note"><span className="ery-note-icon"><Activity size={17} /></span><div><b>One connected project</b><small>Customer UI · DBMS · AI tools</small></div></div>
          <div className="ery-profile"><span className="ery-avatar">E</span><span><b>Eryviled workspace</b><small>Database systems portfolio</small></span><span className="ery-status-dot" /></div>
        </div>
      </aside>

      <div className="ery-main">
        <header className="ery-topbar">
          <button className="ery-menu-toggle" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><span /><span /><span /></button>
          <div className="ery-breadcrumb"><span>ERYVILED</span><span className="ery-breadcrumb-slash">/</span><b>{activeItem.label}</b></div>
          <div className="ery-topbar-actions">
            <form className="ery-api-config" onSubmit={event => { event.preventDefault(); saveApiBase(); }}>
              <label htmlFor="ery-api-base">API</label>
              <input id="ery-api-base" value={apiDraft} onChange={event => setApiDraft(event.target.value)} placeholder="https://your-backend.example.com" aria-label="Backend API base URL" />
              <button type="submit">Save</button>
            </form>
            <span className="ery-live-indicator"><i /> {apiBase ? 'BACKEND CONFIGURED' : 'BACKEND NOT SET'}</span>
            <button className="ery-home-button" onClick={() => setActiveTab('storefrontPreview')}><ShoppingBag size={15} /> Customer UI</button>
          </div>
        </header>
        <main className="ery-content">{apiMessage && <div className="ery-api-message" role="status">{apiMessage}</div>}
          <div className="ery-page-heading">
            <div><div className="ery-page-eyebrow"><span /> {activeItem.description}</div><h1>{activeItem.label}<span>.</span></h1><p>All your customer experience, database engineering and AI features in one workspace.</p></div>
            <div className="ery-page-index">{String(allItems.findIndex(item => item.id === activeTab) + 1).padStart(2, '0')} <span>/ {String(allItems.length).padStart(2, '0')}</span></div>
          </div>
          <section className="module-surface" key={activeTab}>
            {activeTab === 'observatory' && <Observatory />}
            {activeTab === 'aiStudio' && <AiRecommendationLab />}
            {activeTab === 'sqlStudio' && <SqlStudio />}
            {activeTab === 'concurrencyLab' && <ConcurrencyLab />}
            {activeTab === 'partitioning' && <PartitionInspector />}
            {activeTab === 'customerApp' && <CustomerView />}
            {activeTab === 'aiHub' && <AiSentimentHub />}
            {activeTab === 'documentation' && <DocumentationView />}
          </section>
          <footer className="ery-footer"><span>ERYVILED</span> · Distributed Food Delivery Database System <span className="ery-footer-dot">•</span> Every tool, one workspace</footer>
        </main>
      </div>
    </div>
  );
}
