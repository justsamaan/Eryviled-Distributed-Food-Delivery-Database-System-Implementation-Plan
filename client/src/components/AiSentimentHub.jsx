import React, { useState, useEffect } from 'react';
import { BrainCircuit, MessageSquare, TrendingUp, TrendingDown, Minus, Quote, Zap } from 'lucide-react';

export default function AiSentimentHub() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/sentiment-summary')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-center animate-pulse text-blue-400">Loading AI Intelligence Models...</div>;

  const distribution = data?.distribution || [];
  const topKeywords = data?.topKeywords || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <BrainCircuit className="text-blue-400" size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI Customer Intelligence</h1>
          <p className="text-gray-400 text-sm">Natural Language Processing (NLP) Sentiment Analysis & Keyword Extraction</p>
        </div>
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
            <Quote size={16} className="text-blue-400" /> Live AI Inference Log (reviews × ai_review_insights)
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
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-2 text-green-400">POSITIVE</td>
                <td className="py-3 px-2 font-mono text-blue-400">0.90</td>
                <td className="py-3 px-2 text-gray-400 italic">"The truffle mushroom pizza was absolutely delicious! Best pizza in New York."</td>
                <td className="py-3 px-2 text-right text-gray-500">pizza, delicious</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-2 text-red-400">NEGATIVE</td>
                <td className="py-3 px-2 font-mono text-blue-400">-0.60</td>
                <td className="py-3 px-2 text-gray-400 italic">"Delivery was extremely slow and the ramen broth arrived cold. Very disappointing."</td>
                <td className="py-3 px-2 text-right text-gray-500">slow, cold</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="py-3 px-2 text-gray-400">NEUTRAL</td>
                <td className="py-3 px-2 font-mono text-blue-400">0.10</td>
                <td className="py-3 px-2 text-gray-400 italic">"Great burger, but the truffle fries were a bit too salty for my taste."</td>
                <td className="py-3 px-2 text-right text-gray-500">burger, salty</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
