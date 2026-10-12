import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Database, FileText, ArrowRight, CheckCircle2, MessageSquare, 
  Send, BrainCircuit, Activity, Sliders, Flame, HeartPulse, DollarSign, 
  ShieldAlert, RefreshCw, BarChart2, Zap, Clock, CloudRain, Car, Bike, AlertTriangle
} from 'lucide-react';

export default function AiRecommendationLab() {
  const [activeSubTab, setActiveSubTab] = useState('pipeline'); // 'pipeline' | 'dataset' | 'prediction' | 'vector'

  // --- SUB-TAB 1: DATASET & PREPROCESSING STATE ---
  const [datasetStats, setDatasetStats] = useState(null);
  const [preprocessInput, setPreprocessInput] = useState({
    delivery_distance_km: 7.2,
    prep_time_minutes: 18.5,
    num_items: 3,
    weather_condition: 'Rainy',
    traffic_density: 'High',
    vehicle_type: 'Scooter'
  });
  const [preprocessResult, setPreprocessResult] = useState(null);

  // --- SUB-TAB 2: NLP TO SQL CHATBOT STATE ---
  const [chatPrompt, setChatPrompt] = useState('Show me delayed orders during rainy or stormy weather');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatPipelineResult, setChatPipelineResult] = useState(null);

  // --- SUB-TAB 3: PREDICTION STATE ---
  const [predictParams, setPredictParams] = useState({
    distance_km: 6.5,
    prep_time_min: 16.0,
    num_items: 2,
    weather: 'Clear',
    traffic: 'Medium',
    vehicle: 'Bike'
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictLoading, setPredictLoading] = useState(false);

  // --- SUB-TAB 4: 5D VECTOR STATE ---
  const [vectorPrefs, setVectorPrefs] = useState({
    spiceLevel: 0.85,
    healthScore: 0.40,
    priceSensitivity: 0.70,
    veganWeight: 0.10,
    asianPreference: 0.30
  });
  const [vectorResult, setVectorResult] = useState(null);

  // Initial data loading
  useEffect(() => {
    fetchDatasetStats();
    handleRunChatbot(chatPrompt);
    handlePredict(predictParams);
    fetchVectorRecommendations();
  }, []);

  const fetchDatasetStats = async () => {
    try {
      const res = await fetch('/api/ai/dataset-stats');
      const data = await res.json();
      setDatasetStats(data);
      // Run initial preprocessing test
      handlePreprocess(preprocessInput);
    } catch (err) {
      console.error('Failed to load dataset stats:', err);
    }
  };

  const handlePreprocess = async (input) => {
    try {
      const res = await fetch('/api/ai/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      setPreprocessResult(data);
    } catch (err) {
      console.error('Failed to run preprocessing:', err);
    }
  };

  const handleRunChatbot = async (promptToRun) => {
    const q = promptToRun || chatPrompt;
    setChatLoading(true);
    try {
      const res = await fetch('/api/ai/nlp-to-sql-chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q })
      });
      const data = await res.json();
      setChatPipelineResult(data);
    } catch (err) {
      console.error('Failed to run NLP-to-SQL chatbot:', err);
    } finally {
      setChatLoading(false);
    }
  };

  const handlePredict = async (params) => {
    const p = params || predictParams;
    setPredictLoading(true);
    try {
      const res = await fetch('/api/ai/predict-eta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      setPredictionResult(data);
    } catch (err) {
      console.error('Failed to run prediction:', err);
    } finally {
      setPredictLoading(false);
    }
  };

  const fetchVectorRecommendations = async (prefs = vectorPrefs) => {
    try {
      const queryParams = new URLSearchParams(prefs).toString();
      const res = await fetch(`/api/ai-recommendations?customerId=1&${queryParams}`);
      const data = await res.json();
      setVectorResult(data);
    } catch (err) {
      console.error('Failed to load vector recommendations:', err);
    }
  };

  const presetQueries = [
    "Show me delayed orders during rainy or stormy weather",
    "Find top rated Italian pizza orders above 4 stars",
    "Show fastest fulfilled orders under 30 minutes",
    "High value luxury order baskets exceeding $65"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.18) 0%, rgba(59, 130, 246, 0.15) 100%)', borderColor: '#a855f7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles style={{ color: '#c084fc', width: 28, height: 28 }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#f3e8ff' }}>
                AI Delivery Intelligence & NLP Studio
              </h2>
            </div>
            <p style={{ margin: '0.4rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              End-to-End AI Architecture: Input Dataset • 4-Stage Pre-processing • NLP-to-SQL RAG Chatbot • Predictive ETA Engine
            </p>
          </div>

          {/* Sub-Tab Navigation Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.4)', padding: '0.35rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setActiveSubTab('pipeline')}
              className={`nav-tab ${activeSubTab === 'pipeline' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <MessageSquare size={14} /> Step 2: NLP Chatbot Pipeline
            </button>
            <button
              onClick={() => setActiveSubTab('prediction')}
              className={`nav-tab ${activeSubTab === 'prediction' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <Zap size={14} /> Step 3: ETA Predictor
            </button>
            <button
              onClick={() => setActiveSubTab('dataset')}
              className={`nav-tab ${activeSubTab === 'dataset' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <Database size={14} /> Step 1: Dataset & Pre-processing
            </button>
            <button
              onClick={() => setActiveSubTab('vector')}
              className={`nav-tab ${activeSubTab === 'vector' ? 'active' : ''}`}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            >
              <Sliders size={14} /> 5D Vector Recommender
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STEP 2 - NLP TO QUERY -> OUTPUT -> CHATBOT -> OUTPUT           */}
      {/* ========================================================================= */}
      {activeSubTab === 'pipeline' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Query Input Box & Presets */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <BrainCircuit size={16} /> NATURAL LANGUAGE QUERY INPUT
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Teacher Pipeline Step 2: Input → Convert to Query → DB Output → Chatbot → Final Output
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <input
                type="text"
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunChatbot()}
                placeholder="Ask anything (e.g., 'Show me delayed orders during heavy storms')..."
                style={{
                  flex: 1,
                  background: '#030712',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => handleRunChatbot()} 
                className="btn btn-primary"
                disabled={chatLoading}
                style={{ padding: '0.75rem 1.25rem' }}
              >
                {chatLoading ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Execute Pipeline</span>
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Presets:</span>
              {presetQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => { setChatPrompt(q); handleRunChatbot(q); }}
                  style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    color: '#93c5fd',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* 5-Stage Live Pipeline Flowchart Visualizer */}
          {chatPipelineResult && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                <div className="glass-card" style={{ borderColor: '#60a5fa' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>1. USER PROMPT INPUT</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#93c5fd', marginTop: '0.25rem' }}>
                    "{chatPipelineResult.pipelineSteps.step1_input.rawUserQuery}"
                  </p>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem', marginTop: '0.5rem' }}>
                    {chatPipelineResult.pipelineSteps.step1_input.detectedIntent}
                  </span>
                </div>

                <div className="glass-card" style={{ borderColor: '#a855f7' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>2. CONVERTED SQL QUERY</span>
                  <p style={{ fontSize: '0.75rem', fontFamily: 'Fira Code, monospace', color: '#c084fc', marginTop: '0.25rem' }}>
                    {chatPipelineResult.pipelineSteps.step2_convertedQuery.sqlQuery.substring(0, 70)}...
                  </p>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem', marginTop: '0.5rem' }}>
                    {chatPipelineResult.pipelineSteps.step2_convertedQuery.executionTimeMs} ms Latency
                  </span>
                </div>

                <div className="glass-card" style={{ borderColor: '#34d399' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>3. QUERY OUTPUT RECORDS</span>
                  <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.1rem' }}>
                    {chatPipelineResult.pipelineSteps.step3_queryOutput.recordCount} Rows Returned
                  </p>
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem', marginTop: '0.5rem' }}>
                    Dataset Schema Match
                  </span>
                </div>

                <div className="glass-card" style={{ borderColor: '#f59e0b' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>4. CHATBOT RAG INGESTION</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fcd34d', marginTop: '0.25rem' }}>
                    Contextual Prompt Injected
                  </p>
                  <span className="badge badge-amber" style={{ fontSize: '0.65rem', marginTop: '0.5rem' }}>
                    {chatPipelineResult.pipelineSteps.step4_chatbotInput.inputContextTokens} Context Tokens
                  </span>
                </div>

                <div className="glass-card" style={{ borderColor: '#38bdf8' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>5. FINAL CHATBOT OUTPUT</span>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8', marginTop: '0.25rem' }}>
                    Synthesized Intelligence
                  </p>
                  <span className="badge badge-blue" style={{ fontSize: '0.65rem', marginTop: '0.5rem' }}>
                    Total: {chatPipelineResult.totalLatencyMs} ms
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown Panels */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem' }}>
                
                {/* Stage 5: Conversational Chatbot Synthesis */}
                <div className="glass-panel" style={{ padding: '1.25rem', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={18} />
                    <span>AI Chatbot Conversational Response (Final Output)</span>
                  </h3>

                  <div style={{ background: '#030712', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.875rem', lineHeight: '1.6', whiteSpace: 'pre-line', color: '#f8fafc' }}>
                    {chatPipelineResult.pipelineSteps.step5_chatbotOutput.conversationalResponse}
                  </div>

                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>ACTIONABLE FLEET RECOMMENDATIONS:</span>
                    <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                      {chatPipelineResult.pipelineSteps.step5_chatbotOutput.actionableRecommendations.map((rec, rIdx) => (
                        <li key={rIdx} style={{ marginBottom: '0.25rem' }}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Stage 2 & 3: Generated SQL & Records */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#c084fc', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={18} />
                    <span>Converted SQL Query & Retrieved Rows</span>
                  </h3>

                  <div className="code-block" style={{ marginBottom: '1rem', fontSize: '0.75rem', maxHeight: '110px' }}>
                    <pre>{chatPipelineResult.pipelineSteps.step2_convertedQuery.sqlQuery}</pre>
                  </div>

                  <div style={{ overflowX: 'auto', maxHeight: '180px' }}>
                    <table className="custom-table" style={{ fontSize: '0.75rem', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Restaurant</th>
                          <th>Dist (km)</th>
                          <th>Weather</th>
                          <th>Time (min)</th>
                          <th>Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chatPipelineResult.pipelineSteps.step3_queryOutput.records.map((r, rIdx) => (
                          <tr key={rIdx}>
                            <td>#{r.order_id}</td>
                            <td>{r.restaurant_name}</td>
                            <td>{r.delivery_distance_km}</td>
                            <td>{r.weather_condition}</td>
                            <td style={{ fontWeight: 700, color: r.is_delayed ? '#f87171' : '#34d399' }}>{r.delivery_time_minutes}</td>
                            <td>⭐ {r.customer_rating}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: STEP 3 - PREDICTION OR OUTPUT (ETA REGRESSOR & DELAY RISK)      */}
      {/* ========================================================================= */}
      {activeSubTab === 'prediction' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: '1.5rem' }}>
            
            {/* Input Feature Tuners */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sliders size={18} color="#3b82f6" />
                <span>Feature Input Sliders (Step 3 Model Inputs)</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Distance */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Delivery Distance (km)</span>
                    <strong style={{ color: '#60a5fa' }}>{predictParams.distance_km} km</strong>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="15.0"
                    step="0.5"
                    value={predictParams.distance_km}
                    onChange={(e) => {
                      const updated = { ...predictParams, distance_km: parseFloat(e.target.value) };
                      setPredictParams(updated);
                      handlePredict(updated);
                    }}
                    style={{ width: '100%', accentColor: '#3b82f6' }}
                  />
                </div>

                {/* Prep Time */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kitchen Prep Time (min)</span>
                    <strong style={{ color: '#34d399' }}>{predictParams.prep_time_min} min</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={predictParams.prep_time_min}
                    onChange={(e) => {
                      const updated = { ...predictParams, prep_time_min: parseFloat(e.target.value) };
                      setPredictParams(updated);
                      handlePredict(updated);
                    }}
                    style={{ width: '100%', accentColor: '#10b981' }}
                  />
                </div>

                {/* Weather & Traffic Selectors */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>WEATHER</label>
                    <select
                      value={predictParams.weather}
                      onChange={(e) => {
                        const updated = { ...predictParams, weather: e.target.value };
                        setPredictParams(updated);
                        handlePredict(updated);
                      }}
                      style={{ width: '100%', padding: '0.5rem', background: '#030712', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      <option value="Clear">Clear (1.0x)</option>
                      <option value="Rainy">Rainy (1.30x)</option>
                      <option value="Foggy">Foggy (1.18x)</option>
                      <option value="Stormy">Stormy (1.70x)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TRAFFIC DENSITY</label>
                    <select
                      value={predictParams.traffic}
                      onChange={(e) => {
                        const updated = { ...predictParams, traffic: e.target.value };
                        setPredictParams(updated);
                        handlePredict(updated);
                      }}
                      style={{ width: '100%', padding: '0.5rem', background: '#030712', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      <option value="Low">Low (1.0x)</option>
                      <option value="Medium">Medium (1.25x)</option>
                      <option value="High">High (1.65x)</option>
                      <option value="Jam">Gridlock Jam (2.20x)</option>
                    </select>
                  </div>
                </div>

                {/* Vehicle & Items */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>COURIER VEHICLE</label>
                    <select
                      value={predictParams.vehicle}
                      onChange={(e) => {
                        const updated = { ...predictParams, vehicle: e.target.value };
                        setPredictParams(updated);
                        handlePredict(updated);
                      }}
                      style={{ width: '100%', padding: '0.5rem', background: '#030712', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    >
                      <option value="Bike">Bicycle (20 km/h)</option>
                      <option value="Scooter">Scooter (25 km/h)</option>
                      <option value="Electric_Bicycle">E-Bike (18 km/h)</option>
                      <option value="Car">Car (22 km/h)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>BASKET ITEMS</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={predictParams.num_items}
                      onChange={(e) => {
                        const updated = { ...predictParams, num_items: parseInt(e.target.value) || 1 };
                        setPredictParams(updated);
                        handlePredict(updated);
                      }}
                      style={{ width: '100%', padding: '0.5rem', background: '#030712', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', marginTop: '0.25rem' }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Prediction Output & Explainability Dashboard */}
            {predictionResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {/* Main Prediction Card */}
                <div className="glass-panel" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>PREDICTED TOTAL ETA</span>
                      <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8', margin: '0.2rem 0' }}>
                        {predictionResult.prediction.predictedDeliveryTimeMinutes} <span style={{ fontSize: '1.2rem', fontWeight: 500 }}>mins</span>
                      </h2>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: predictionResult.prediction.riskColor, fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                        {predictionResult.prediction.delayRiskLevel}
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                        Delay Risk Probability: <strong>{predictionResult.prediction.delayProbabilityPct}%</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature Contribution Breakdown (Explainable AI) */}
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BarChart2 size={16} /> Feature Importance & Delay Breakdown (Minutes)
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Kitchen Preparation</span>
                      <strong>{predictionResult.featureBreakdown.kitchenPreparationMinutes} min</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Baseline Transit Travel</span>
                      <strong>{predictionResult.featureBreakdown.pureTransitTravelMinutes} min</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: predictionResult.featureBreakdown.trafficCongestionDelayMinutes > 0 ? '#fbbf24' : 'var(--text-secondary)' }}>
                      <span>Traffic Congestion Impact</span>
                      <strong>+{predictionResult.featureBreakdown.trafficCongestionDelayMinutes} min</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: predictionResult.featureBreakdown.weatherPrecipitationPenaltyMinutes > 0 ? '#f87171' : 'var(--text-secondary)' }}>
                      <span>Weather Penalty (Rain/Storm)</span>
                      <strong>+{predictionResult.featureBreakdown.weatherPrecipitationPenaltyMinutes} min</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Courier Handover & Parking</span>
                      <strong>+{predictionResult.featureBreakdown.driverHandoverMinutes} min</strong>
                    </div>
                  </div>
                </div>

                {/* Model Training Evaluation Metrics Card */}
                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>MODEL EVALUATION METRICS (500 Records)</span>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                        Algorithm: {predictionResult.modelMetrics.algorithm}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MAE</span>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#34d399' }}>{predictionResult.modelMetrics.maeMinutes} min</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RMSE</span>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#60a5fa' }}>{predictionResult.modelMetrics.rmseMinutes} min</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>R² SCORE</span>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: '#c084fc' }}>{predictionResult.modelMetrics.r2Score}</div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DATASET SPECIFICATION & STEP 1 PRE-PROCESSING                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'dataset' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Summary Cards */}
          {datasetStats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div className="glass-card">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATASET SOURCE FILE</span>
                <h3 style={{ fontSize: '1.2rem', color: '#38bdf8', margin: '0.3rem 0 0 0' }}>
                  food_delivery_dataset.csv
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>500 Tabular Records</p>
              </div>

              <div className="glass-card">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVG DELIVERY DURATION</span>
                <h3 style={{ fontSize: '1.2rem', color: '#34d399', margin: '0.3rem 0 0 0' }}>
                  {datasetStats.summary.avgDeliveryTimeMin} mins
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Distance: {datasetStats.summary.avgDistanceKm} km</p>
              </div>

              <div className="glass-card">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DELAY RATE</span>
                <h3 style={{ fontSize: '1.2rem', color: '#f87171', margin: '0.3rem 0 0 0' }}>
                  {datasetStats.summary.delayedPercentage}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{datasetStats.summary.delayedOrders} delayed orders</p>
              </div>

              <div className="glass-card">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AVERAGE BASKET SIZE</span>
                <h3 style={{ fontSize: '1.2rem', color: '#fbbf24', margin: '0.3rem 0 0 0' }}>
                  ${datasetStats.summary.avgOrderValueUsd}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Multi-item orders</p>
              </div>
            </div>
          )}

          {/* 4-Stage Pre-processing Visualizer */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="#a855f7" />
              <span>Step 1: 4-Stage Data Preprocessing Pipeline</span>
            </h3>

            {preprocessResult && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {preprocessResult.stages.map((st, sIdx) => (
                  <div key={sIdx} className="glass-card" style={{ padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c084fc' }}>{st.step}</span>
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>{st.status}</span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{st.detail}</p>
                  </div>
                ))}
              </div>
            )}

            {preprocessResult && (
              <div style={{ background: '#030712', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCALED NUMERICAL FEATURE VECTOR:</span>
                <p style={{ fontFamily: 'Fira Code, monospace', fontSize: '0.85rem', color: '#38bdf8', marginTop: '0.3rem' }}>
                  {JSON.stringify(preprocessResult.transformedVector)}
                </p>
              </div>
            )}
          </div>

          {/* Data Dictionary */}
          {datasetStats && (
            <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="#38bdf8" />
                <span>Dataset Data Dictionary & Attributes</span>
              </h3>

              <table className="custom-table" style={{ fontSize: '0.8rem' }}>
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Role in Pipeline</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {datasetStats.dataDictionary.map((col, idx) => (
                    <tr key={idx}>
                      <td><code style={{ color: '#38bdf8' }}>{col.column}</code></td>
                      <td>{col.type}</td>
                      <td><span className="badge badge-blue">{col.role}</span></td>
                      <td>{col.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: 5D VECTOR COSINE SIMILARITY RECOMMENDER                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'vector' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
          
          {/* Sliders */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={18} color="#a855f7" />
              <span>Customer Vector Weights</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#f87171' }}><Flame size={14} /> Spiciness Tolerance</span>
                  <strong>{(vectorPrefs.spiceLevel * 100).toFixed(0)}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vectorPrefs.spiceLevel}
                  onChange={(e) => {
                    const u = { ...vectorPrefs, spiceLevel: parseFloat(e.target.value) };
                    setVectorPrefs(u);
                    fetchVectorRecommendations(u);
                  }}
                  style={{ width: '100%', accentColor: '#ef4444' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#34d399' }}><HeartPulse size={14} /> Health & Organic Focus</span>
                  <strong>{(vectorPrefs.healthScore * 100).toFixed(0)}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vectorPrefs.healthScore}
                  onChange={(e) => {
                    const u = { ...vectorPrefs, healthScore: parseFloat(e.target.value) };
                    setVectorPrefs(u);
                    fetchVectorRecommendations(u);
                  }}
                  style={{ width: '100%', accentColor: '#10b981' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#fbbf24' }}><DollarSign size={14} /> Budget Sensitivity</span>
                  <strong>{(vectorPrefs.priceSensitivity * 100).toFixed(0)}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vectorPrefs.priceSensitivity}
                  onChange={(e) => {
                    const u = { ...vectorPrefs, priceSensitivity: parseFloat(e.target.value) };
                    setVectorPrefs(u);
                    fetchVectorRecommendations(u);
                  }}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#a78bfa' }}>Asian Fusion Affinity</span>
                  <strong>{(vectorPrefs.asianPreference * 100).toFixed(0)}%</strong>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={vectorPrefs.asianPreference}
                  onChange={(e) => {
                    const u = { ...vectorPrefs, asianPreference: parseFloat(e.target.value) };
                    setVectorPrefs(u);
                    fetchVectorRecommendations(u);
                  }}
                  style={{ width: '100%', accentColor: '#8b5cf6' }}
                />
              </div>
            </div>
          </div>

          {/* Recommended Items Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#f3e8ff' }}>
              Top Personalized Dishes (Cosine Similarity Match)
            </h3>

            {vectorResult && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                {vectorResult.topRecommendations.map((item, idx) => (
                  <div key={idx} className="glass-card" style={{ position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ fontSize: '0.95rem', margin: 0 }}>{item.item_name}</h4>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {item.matchPercentage}% Match
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0' }}>
                      {item.restaurant_name} • ${item.price.toFixed(2)}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      {item.description}
                    </p>
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.7rem', color: '#38bdf8' }}>
                      {item.reasoningTag}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
