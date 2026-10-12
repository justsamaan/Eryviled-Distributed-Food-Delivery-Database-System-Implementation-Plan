import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Observatory from './components/Observatory';
import SqlStudio from './components/SqlStudio';
import ConcurrencyLab from './components/ConcurrencyLab';
import PartitionInspector from './components/PartitionInspector';
import CustomerView from './components/CustomerView';
import AiSentimentHub from './components/AiSentimentHub';
import DocumentationView from './components/DocumentationView';
import AiRecommendationLab from './components/AiRecommendationLab';

export default function App() {
  const [activeTab, setActiveTab] = useState('observatory');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      {/* Sticky Header Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main style={{ flex: 1, maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.75rem 1.5rem' }}>
        {activeTab === 'observatory' && <Observatory />}
        {activeTab === 'aiStudio' && <AiRecommendationLab />}
        {activeTab === 'sqlStudio' && <SqlStudio />}
        {activeTab === 'concurrencyLab' && <ConcurrencyLab />}
        {activeTab === 'partitioning' && <PartitionInspector />}
        {activeTab === 'customerApp' && <CustomerView />}
        {activeTab === 'storefrontPreview' && (
          <section style={{ width: '100%', margin: '-1.75rem -1.5rem', width: 'calc(100% + 3rem)' }}>
            <iframe
              title="Eryviled storefront UI preview"
              src="/eryviled-storefront-preview.html"
              style={{ display: 'block', width: '100%', height: 'calc(100vh - 92px)', minHeight: '720px', border: 0, background: '#fff' }}
            />
          </section>
        )}
        {activeTab === 'aiHub' && <AiSentimentHub />}
        {activeTab === 'documentation' && <DocumentationView />}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        AI-Powered Distributed Food Delivery Database System • DBMS & Backend Portfolio Project (2026)
      </footer>
    </div>
  );
}

