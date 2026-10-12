import React, { useEffect, useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('storefrontPreview');
  const isStorefront = activeTab === 'storefrontPreview';

  useEffect(() => {
    const handleStorefrontNavigation = (event) => {
      if (event.data?.type === 'eryviled:navigate' && event.data.tab) {
        setActiveTab(event.data.tab);
      }
    };
    window.addEventListener('message', handleStorefrontNavigation);
    return () => window.removeEventListener('message', handleStorefrontNavigation);
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)' }}>
      {!isStorefront && <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />}
      <main style={{
        flex: 1,
        maxWidth: isStorefront ? 'none' : '1400px',
        width: '100%',
        margin: '0 auto',
        padding: isStorefront ? 0 : '1.75rem 1.5rem',
        minHeight: isStorefront ? '100vh' : undefined
      }}>
        {activeTab === 'observatory' && <Observatory />}
        {activeTab === 'aiStudio' && <AiRecommendationLab />}
        {activeTab === 'sqlStudio' && <SqlStudio />}
        {activeTab === 'concurrencyLab' && <ConcurrencyLab />}
        {activeTab === 'partitioning' && <PartitionInspector />}
        {activeTab === 'customerApp' && <CustomerView />}
        {activeTab === 'storefrontPreview' && (
          <iframe
            title="Eryviled customer storefront"
            src={`${import.meta.env.BASE_URL}eryviled-storefront-preview.html`}
            style={{ display: 'block', width: '100%', height: '100vh', minHeight: '650px', border: 0, background: '#f8f7f2' }}
          />
        )}
        {activeTab === 'aiHub' && <AiSentimentHub />}
        {activeTab === 'documentation' && <DocumentationView />}
      </main>
      {!isStorefront && (
        <footer style={{ borderTop: '1px solid var(--border-color)', padding: '1.25rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          AI-Powered Distributed Food Delivery Database System • DBMS & Backend Portfolio Project (2026)
        </footer>
      )}
    </div>
  );
}
