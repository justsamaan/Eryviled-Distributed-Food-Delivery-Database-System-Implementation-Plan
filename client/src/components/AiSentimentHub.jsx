import React, { useState, useEffect } from 'react';
import apiFetch from '../api.js';
import { BrainCircuit, MessageSquare, TrendingUp, TrendingDown, Minus, Quote, Zap } from 'lucide-react';

export default function AiSentimentHub() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState('The food was fresh and delicious, but delivery was slow.');
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/sentiment-summary');
      const json = await response.json();
      if (!response.ok || !json || json.error) throw new Error(json?.error || 'Could not load sentiment summary');
      setData(json);
      setApiError('');
    } catch (error) {
      setApiError(error.message || 'Could not connect to the AI API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSummary(); }, []);

  if (loading) return <div className="p-10 text-center animate-pulse text-blue-400">Loading AI Intelligence Models...</div>;

  const analyzeReview = async () => {
    if (!reviewText.trim()) return;
    setReviewLoading(true);
    setReviewResult(null);
    try {
      const response = await apiFetch('/api/ai/analyze-review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: reviewText }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Sentiment analysis failed');
      setReviewResult(result);
    } catch (error) {
      setReviewResult({ error: error.message });
    } finally {
      setReviewLoading(false);
    }
  };

  const distribution = data?.distribution || [];
  const topKeywords = data?.topKeywords || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-3 mb-6" style={{ flexWrap: 'wrap' }}>
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <BrainCircuit className="text-blue-400" size={28} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 className="text-2xl font-bold text-white">AI Customer Intelligence</h1>
          <p className="text-gray-400 text-sm">Natural Language Processing (NLP) Sentiment Analysis & Keyword Extraction</p>
        </div>
        <button className="btn" onClick={loadSummary} disabled={loading} style={{ border: '1px solid #e7e5dc', background: '#fffefa', color: '#263328' }}>Refresh review data</button>
      </div>

      {apiError && <div className="glass-panel" style={{ padding: '1rem', color: '#c65345' }}>AI API unavailable: {apiError}. Configure the backend URL in the workspace header and make sure the server is running.</div>}

      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.45rem', fontSize: '1.05rem', color: '#263328' }}>Try sentiment analysis on a review</h3>
        <p style={{ marginBottom: '0.8rem', color: '#72796e', fontSize: '0.8rem' }}>Submits your text to the backend sentiment service and shows its actual prediction and detected themes.</p>
        <form onSubmit={event => { event.preventDefault(); analyzeReview(); }} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <input value={reviewText} onChange={event => setReviewText(event.target.value)} aria-label="Review text" style={{ flex: '1 1 280px', minWidth: 0, padding: '0.75rem', border: '1px solid #deded3', borderRadius: '9px', background: '#fffefa', color: '#263328' }} />
          <button className="btn btn-primary" type="submit" disabled={reviewLoading}>{reviewLoading ? 'Analyzing…' : 'Analyze review'}</button>
        </form>
        {reviewResult && <div role="status" style={{ marginTop: '0.85rem', padding: '0.9rem', borderRadius: '9px', background: '#f2f0e8', color: '#263328' }}>{reviewResult.error ? <span style={{ color: '#c65345' }}>{reviewResult.error}</span> : <><strong>{reviewResult.label}</strong> · Score {reviewResult.score} · Themes: {(reviewResult.themes || []).join(', ') || 'none detected'}<p style={{ color: '#858a7e', fontSize: '0.7rem', marginTop: '0.35rem' }}>Source: {reviewResult.source}</p></>}</div>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sentiment Distribution Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-gray-300 font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" /> Sentiment Distribution
          </h3>
          <div className="space-y-4">
            {distribution.map(item => (
              <div key={item.sentiment_label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{item.sentiment_label}</span>
                  <span className="text-gray-300 font-mono">{item.count} reviews</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      item.sentiment_label === 'POSITIVE' ? 'bg-green-500' :
                      item.sentiment_label === 'NEGATIVE' ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    style={{ width: `${(item.count / distribution.reduce((a, b) => a + b.count, 0)) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Key Themes Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-gray-300 font-semibold mb-4 flex items-center gap-2">
            <Zap size={18} className="text-yellow-400" /> AI Keyword Extraction
          </h3>
          <div className="flex flex-wrap gap-2">
            {topKeywords.map(([word, count]) => (
              <span
                key={word}
                className="px-3 py-1 bg-gray-700/50 border border-gray-600 rounded-full text-xs text-gray-300 flex items-center gap-2"
              >
                {word} <span className="text-blue-400 text-[10px]">{count}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Global Performance Card */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-gray-300 font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-purple-400" /> Platform Insights
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-[10px] text-green-400 uppercase font-bold mb-1">Recommendation</p>
              <p className="text-xs text-gray-300">Customer feedback for "Italian" is 92% positive. Consider expanding delivery fleet in NY.</p>
            </div>
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-[10px] text-red-400 uppercase font-bold mb-1">Stock Alert</p>
              <p className="text-xs text-gray-300">"Spicy" theme correlates with negative reviews regarding delivery times. Monitor heat retention.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Intelligence Log */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30">
          <h3 className="text-gray-300 font-semibold text-sm flex items-center gap-2">
            <Quote size={16} className="text-blue-400" /> Live AI Inference Log (customer reviews analyzed by the backend)
          </h3>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-gray-500 font-mono">
              <tr>
                <th className="pb-3 px-2">SENTIMENT</th>
                <th className="pb-3 px-2">SCORE</th>
                <th className="pb-3 px-2">CUSTOMER REVIEW COMMENT</th>
                <th className="pb-3 px-2 text-right">THEMES</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-gray-800">
              {(data?.reviews || []).length ? data.reviews.map(review => (
                <tr key={review.review_id}>
                  <td className="py-3 px-2" style={{ color: review.sentiment_label === 'POSITIVE' ? '#4c7255' : review.sentiment_label === 'NEGATIVE' ? '#c65345' : '#858a7e' }}>{review.sentiment_label}</td>
                  <td className="py-3 px-2 font-mono" style={{ color: '#4c7255' }}>{Number(review.sentiment_score).toFixed(2)}</td>
                  <td className="py-3 px-2" style={{ color: '#72796e' }}>{review.comment || '—'}</td>
                  <td className="py-3 px-2 text-right" style={{ color: '#858a7e' }}>{(review.key_themes || []).join(', ') || '—'}</td>
                </tr>
              )) : <tr><td colSpan={4} className="py-5 px-2" style={{ color: '#858a7e' }}>No stored customer reviews yet. Add reviews through the database to populate this live log.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
