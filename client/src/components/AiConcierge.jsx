import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, ShoppingCart, Star, MessageSquare } from 'lucide-react';

export default function AiConcierge({ customerId = 1 }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [chatLog, setChatLog] = useState([
    { role: 'ai', text: "Hello! I'm your AI Food Concierge. I can recommend personalized dishes or find specific food for you. What are you craving today?" }
  ]);

  useEffect(() => {
    fetch(`/api/ai/recommendations/${customerId}`)
      .then(res => res.json())
      .then(json => {
        setRecommendations(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [customerId]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt;
    setPrompt('');
    setChatLog(prev => [...prev, { role: 'user', text: userText }]);

    try {
      const res = await fetch('/api/ai/text-to-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await res.json();

      setChatLog(prev => [...prev, {
        role: 'ai',
        text: data.explanation || "I found some results matching your request!",
        results: data.rows?.slice(0, 3)
      }]);
    } catch (err) {
      setChatLog(prev => [...prev, { role: 'ai', text: "I'm sorry, I encountered an error processing that request." }]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      {/* Personalized Recommendations */}
      <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Sparkles className="text-yellow-400" size={20} />
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">AI For You</h2>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-24 bg-gray-700/50 rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map(item => (
              <div key={item.item_id} className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 flex gap-4 hover:border-blue-500/50 transition-colors group">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-100">{item.item_name}</h3>
                    <span className="text-blue-400 font-mono text-sm">${item.price}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{item.restaurant_name} • {item.dish_type}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-[10px] text-blue-400 rounded uppercase font-bold tracking-tighter">
                      {item.ai_match_score}% Match
                    </span>
                    <button className="p-1.5 bg-blue-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ShoppingCart size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Food Concierge Chat */}
      <div className="bg-gray-900/80 border border-blue-900/30 rounded-2xl flex flex-col h-[400px]">
        <div className="p-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Food Concierge</h3>
            <p className="text-[10px] text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online • Neural Engine Active
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
          {chatLog.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-gray-800 text-gray-300 rounded-tl-none border border-gray-700'
              }`}>
                {msg.text}

                {msg.results && (
                  <div className="mt-3 space-y-2">
                    {msg.results.map((res, idx) => (
                      <div key={idx} className="p-2 bg-gray-900/50 rounded-lg border border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-[10px] text-white">{res.item_name || res.name}</p>
                          <p className="text-[9px] text-gray-500">{res.city || res.restaurant_name}</p>
                        </div>
                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleAsk} className="p-4 border-t border-gray-800 flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Try 'Suggest spicy vegetarian food'..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          />
          <button type="submit" className="p-2 bg-blue-600 rounded-xl text-white">
            <MessageSquare size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
