import React, { useState, useEffect } from 'react';
import apiFetch, { getApiBase } from '../api.js';
import { 
  Sparkles, Database, FileText, ArrowRight, CheckCircle2, MessageSquare, 
  Send, BrainCircuit, Activity, Sliders, Flame, HeartPulse, DollarSign, 
  ShieldAlert, RefreshCw, BarChart2, Zap, Clock, CloudRain, Car, Bike, AlertTriangle
} from 'lucide-react';


let localDatasetCache = null;
const LOCAL_MODEL_KEY = 'eryviledLocalEtaModel';
const CSV_FIELDS = ['order_id','customer_id','restaurant_id','restaurant_name','cuisine_type','order_value_usd','num_items','prep_time_minutes','delivery_distance_km','weather_condition','traffic_density','vehicle_type','driver_experience_years','time_of_day','delivery_time_minutes','is_delayed','customer_rating','customer_review'];
function parseCsvRows(text) {
  const rows=[]; let row=[],field='',quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'&&quoted&&text[i+1]==='"'){field+='"';i++;}else if(ch==='"')quoted=!quoted;else if(ch===','&&!quoted){row.push(field);field='';}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(v=>v!==''))rows.push(row);row=[];field='';}else field+=ch;}
  if(field!==''||row.length){row.push(field);rows.push(row);}
  return rows.slice(1).map(values=>Object.fromEntries(CSV_FIELDS.map((key,index)=>[key,values[index]??'']))).map(r=>({...r,order_id:Number(r.order_id),customer_id:Number(r.customer_id),restaurant_id:Number(r.restaurant_id),order_value_usd:Number(r.order_value_usd),num_items:Number(r.num_items),prep_time_minutes:Number(r.prep_time_minutes),delivery_distance_km:Number(r.delivery_distance_km),driver_experience_years:Number(r.driver_experience_years),delivery_time_minutes:Number(r.delivery_time_minutes),is_delayed:Number(r.is_delayed),customer_rating:Number(r.customer_rating)})).filter(r=>Number.isFinite(r.delivery_time_minutes));
}
async function loadLocalDataset(){
  if(localDatasetCache)return localDatasetCache;
  const response=await fetch(import.meta.env.BASE_URL+'data/food_delivery_dataset.csv');
  if(!response.ok)throw new Error('Bundled training dataset could not be loaded (HTTP '+response.status+').');
  const rows=parseCsvRows(await response.text());if(rows.length<30)throw new Error('Bundled training dataset has too few valid rows.');
  localDatasetCache=rows;return rows;
}
function localDatasetSummary(rows){
  const avg=key=>rows.reduce((sum,r)=>sum+(Number(r[key])||0),0)/rows.length,weather={},traffic={};
  rows.forEach(r=>{weather[r.weather_condition]=(weather[r.weather_condition]||0)+1;traffic[r.traffic_density]=(traffic[r.traffic_density]||0)+1;});
  const delayed=rows.filter(r=>r.is_delayed===1).length;
  return {totalRecords:rows.length,summary:{avgDistanceKm:Number(avg('delivery_distance_km').toFixed(2)),avgDeliveryTimeMin:Number(avg('delivery_time_minutes').toFixed(2)),avgOrderValueUsd:Number(avg('order_value_usd').toFixed(2)),delayedOrders:delayed,delayedPercentage:(delayed/rows.length*100).toFixed(1)+'%'},distributions:{weather,traffic},sampleRows:rows.slice(0,10),dataDictionary:[{column:'order_id',type:'Integer',description:'Unique order identifier',role:'Key'},{column:'restaurant_name',type:'Categorical',description:'Restaurant fulfilling the order',role:'Feature'},{column:'cuisine_type',type:'Categorical',description:'Restaurant cuisine',role:'Feature'},{column:'delivery_distance_km',type:'Float',description:'Delivery distance in kilometres',role:'Feature'},{column:'prep_time_minutes',type:'Float',description:'Kitchen preparation duration',role:'Feature'},{column:'weather_condition',type:'Categorical',description:'Weather during delivery',role:'Feature'},{column:'traffic_density',type:'Categorical',description:'Traffic density',role:'Feature'},{column:'delivery_time_minutes',type:'Float',description:'Observed delivery duration',role:'Target'}]};
}
function localPreprocess(input){
  input=input||{};const distance=Math.max(.5,Math.min(20,Number(input.delivery_distance_km)||5)),prep=Math.max(5,Math.min(45,Number(input.prep_time_minutes)||15)),items=Math.max(1,Number(input.num_items)||2),weather=input.weather_condition||'Clear',traffic=input.traffic_density||'Medium',vehicle=input.vehicle_type||'Bike';
  const wm={Clear:0,Rainy:1,Foggy:2,Stormy:3},tm={Low:0,Medium:1,High:2,Jam:3},vm={Bike:0,Scooter:1,Electric_Bicycle:2,Car:3};
  return {rawInput:{distance,prepTime:prep,items,weather,traffic,vehicle},stages:[{step:'Stage 1: Validation & Imputation',status:'PASSED',detail:'Inputs validated; safe defaults applied.'},{step:'Stage 2: Outlier Truncation & Cleaning',status:'PASSED',detail:'Distance and preparation time clipped to demo bounds.'},{step:'Stage 3: Categorical Encoding',status:'COMPLETED',detail:'Weather, traffic and vehicle categories encoded.'},{step:'Stage 4: Feature Scaling',status:'COMPLETED',detail:'Numeric features standardized using dataset reference statistics.'}],transformedVector:{distance_z:Number(((distance-6.84)/3.65).toFixed(3)),prep_time_z:Number(((prep-19.32)/5.82).toFixed(3)),num_items:items,weather_code:wm[weather]??0,traffic_code:tm[traffic]??1,vehicle_code:vm[vehicle]??0}};
}
const MODEL_NUMERIC=['delivery_distance_km','prep_time_minutes','num_items','driver_experience_years'];
const MODEL_CATEGORIES={weather_condition:['Rainy','Foggy','Stormy'],traffic_density:['Medium','High','Jam'],vehicle_type:['Scooter','Electric_Bicycle','Car']};
function modelFeatures(row,scaler){return [1,...MODEL_NUMERIC.map(key=>(Number(row[key]||0)-scaler[key].mean)/scaler[key].std),...Object.entries(MODEL_CATEGORIES).flatMap(([key,values])=>values.map(value=>row[key]===value?1:0))];}
function solveLinearSystem(matrix,vector){
  const a=matrix.map((row,i)=>[...row,vector[i]]),n=vector.length;
  for(let col=0;col<n;col++){let pivot=col;for(let r=col+1;r<n;r++)if(Math.abs(a[r][col])>Math.abs(a[pivot][col]))pivot=r;if(Math.abs(a[pivot][col])<1e-10)continue;[a[col],a[pivot]]=[a[pivot],a[col]];const divisor=a[col][col];for(let j=col;j<=n;j++)a[col][j]/=divisor;for(let r=0;r<n;r++){if(r===col)continue;const factor=a[r][col];for(let j=col;j<=n;j++)a[r][j]-=factor*a[col][j];}}
  return a.map(row=>Number.isFinite(row[n])?row[n]:0);
}
function trainLocalEtaModel(rows){
  const train=rows.filter((_,i)=>i%5!==0),test=rows.filter((_,i)=>i%5===0),scaler={};
  MODEL_NUMERIC.forEach(key=>{const vals=train.map(r=>Number(r[key])||0),mean=vals.reduce((a,b)=>a+b,0)/vals.length,variance=vals.reduce((a,v)=>a+(v-mean)**2,0)/vals.length;scaler[key]={mean,std:Math.sqrt(variance)||1};});
  const xs=train.map(r=>modelFeatures(r,scaler)),ys=train.map(r=>r.delivery_time_minutes),width=xs[0].length,xtx=Array.from({length:width},()=>Array(width).fill(0)),xty=Array(width).fill(0);
  xs.forEach((x,i)=>{for(let a=0;a<width;a++){xty[a]+=x[a]*ys[i];for(let b=0;b<width;b++)xtx[a][b]+=x[a]*x[b];}});for(let i=1;i<width;i++)xtx[i][i]+=.01;
  const coefficients=solveLinearSystem(xtx,xty),predict=r=>Math.max(1,modelFeatures(r,scaler).reduce((sum,v,i)=>sum+v*coefficients[i],0)),errors=test.map(r=>r.delivery_time_minutes-predict(r)),mae=errors.reduce((a,e)=>a+Math.abs(e),0)/errors.length,rmse=Math.sqrt(errors.reduce((a,e)=>a+e*e,0)/errors.length),meanY=test.reduce((a,r)=>a+r.delivery_time_minutes,0)/test.length,total=test.reduce((a,r)=>a+(r.delivery_time_minutes-meanY)**2,0),residual=errors.reduce((a,e)=>a+e*e,0);
  const model={algorithm:'Browser-trained ridge regression (standardized features)',coefficients,scaler,sampleCount:rows.length,trainCount:train.length,testCount:test.length,trainedAt:new Date().toISOString(),metrics:{maeMinutes:Number(mae.toFixed(2)),rmseMinutes:Number(rmse.toFixed(2)),r2Score:Number((1-residual/(total||1)).toFixed(3))}};
  try{localStorage.setItem(LOCAL_MODEL_KEY,JSON.stringify(model));}catch{}return model;
}
function getLocalModel(){try{return JSON.parse(localStorage.getItem(LOCAL_MODEL_KEY)||'null');}catch{return null;}}
function localModelStatus(rows){const model=getLocalModel();return model?{trained:true,localMode:true,datasetRowsAvailable:rows?.length||model.sampleCount,trainedAt:model.trainedAt,testCount:model.testCount,metrics:model.metrics,algorithm:model.algorithm}:{trained:false,localMode:true,datasetRowsAvailable:rows?.length||500,note:'No browser-trained model yet. Select Train ETA model to fit one on the bundled dataset.'};}
function localPredict(params,rows){
  params=params||{};const record={delivery_distance_km:Number(params.distance_km??params.delivery_distance_km??5),prep_time_minutes:Number(params.prep_time_min??params.prep_time_minutes??18),num_items:Number(params.num_items??2),driver_experience_years:Number(params.driver_experience_years??2),weather_condition:params.weather_condition||params.weather||'Clear',traffic_density:params.traffic_density||params.traffic||'Medium',vehicle_type:params.vehicle_type||params.vehicle||'Bike'},model=getLocalModel();
  let minutes,algorithm,metrics;if(model?.coefficients?.length){minutes=modelFeatures(record,model.scaler).reduce((sum,v,i)=>sum+v*model.coefficients[i],0);algorithm=model.algorithm;metrics={...model.metrics,algorithm:model.algorithm,trained:true,trainingDatasetSize:model.sampleCount};}else{const speed={Bike:20,Scooter:25,Electric_Bicycle:18,Car:22}[record.vehicle_type]||20,traffic={Low:1,Medium:1.25,High:1.65,Jam:2.2}[record.traffic_density]||1.25,weather={Clear:1,Rainy:1.3,Foggy:1.18,Stormy:1.7}[record.weather_condition]||1;minutes=record.prep_time_minutes+record.delivery_distance_km/speed*60*traffic*weather;algorithm='Physics baseline (browser model not trained yet)';metrics={algorithm,maeMinutes:null,rmseMinutes:null,r2Score:null,trainingDatasetSize:0,trained:false,note:'Train the ETA model to replace this baseline.'};}
  minutes=Number(Math.max(1,minutes).toFixed(1));const probability=Number((100/(1+Math.exp(-.12*(minutes-42)))).toFixed(1)),risk=probability>65?'High Risk':probability>35?'Moderate Risk':'Low Risk',trafficFactor={Low:0,Medium:.25,High:.65,Jam:1.2}[record.traffic_density]||.25,weatherFactor={Clear:0,Rainy:1.3,Foggy:.7,Stormy:2.2}[record.weather_condition]||0,speed={Bike:20,Scooter:25,Electric_Bicycle:18,Car:22}[record.vehicle_type]||20,transit=Number((record.delivery_distance_km/speed*60).toFixed(1));
  return {prediction:{predictedDeliveryTimeMinutes:minutes,delayProbabilityPct:probability,delayRiskLevel:risk,riskColor:risk==='High Risk'?'#c65345':risk==='Moderate Risk'?'#f36b3f':'#4c7255'},featureBreakdown:{kitchenPreparationMinutes:record.prep_time_minutes,pureTransitTravelMinutes:transit,trafficCongestionDelayMinutes:Number((transit*trafficFactor).toFixed(1)),weatherPrecipitationPenaltyMinutes:Number(weatherFactor.toFixed(1)),driverHandoverMinutes:3},modelMetrics:metrics};
}
async function localChatbot(prompt,rows){
  const q=(prompt||'').toLowerCase();let records,sql,intent;
  if(/delay|late|storm|rain/.test(q)){intent='Weather & Congestion Delivery Delay Analysis';records=rows.filter(r=>(['Rainy','Stormy'].includes(r.weather_condition)||['High','Jam'].includes(r.traffic_density))&&r.is_delayed===1).sort((a,b)=>b.delivery_time_minutes-a.delivery_time_minutes).slice(0,5);sql="SELECT order_id, restaurant_name, cuisine_type, delivery_distance_km, weather_condition, traffic_density, delivery_time_minutes, is_delayed FROM orders_dataset WHERE (weather_condition IN ('Rainy','Stormy') OR traffic_density IN ('High','Jam')) AND is_delayed = 1 ORDER BY delivery_time_minutes DESC LIMIT 5;";}
  else if(/italian|pizza/.test(q)){intent='Italian Cuisine Performance & Top Rated Orders';records=rows.filter(r=>r.cuisine_type==='Italian'&&r.customer_rating>=4).slice(0,5);sql="SELECT order_id, restaurant_name, cuisine_type, order_value_usd, delivery_time_minutes, customer_rating FROM orders_dataset WHERE cuisine_type = 'Italian' AND customer_rating >= 4 ORDER BY order_value_usd DESC LIMIT 5;";}
  else if(/fast|quick|under 30|speed/.test(q)){intent='Fast Delivery SLA & Short Distance Fulfillment';records=rows.filter(r=>r.delivery_time_minutes<=30).sort((a,b)=>a.delivery_time_minutes-b.delivery_time_minutes).slice(0,5);sql='SELECT order_id, restaurant_name, delivery_distance_km, vehicle_type, delivery_time_minutes, customer_rating FROM orders_dataset WHERE delivery_time_minutes <= 30 ORDER BY delivery_time_minutes ASC LIMIT 5;';}
  else if(/revenue|expensive|high value|spend/.test(q)){intent='High Basket Size & Premium Order Segments';records=rows.filter(r=>r.order_value_usd>=65).sort((a,b)=>b.order_value_usd-a.order_value_usd).slice(0,5);sql='SELECT order_id, restaurant_name, cuisine_type, order_value_usd, num_items, customer_rating FROM orders_dataset WHERE order_value_usd >= 65 ORDER BY order_value_usd DESC LIMIT 5;';}
  else{intent='General Multi-Entity Logistics Inspection';records=rows.slice(0,5);sql='SELECT order_id, restaurant_name, cuisine_type, delivery_distance_km, delivery_time_minutes, customer_rating FROM orders_dataset ORDER BY order_id ASC LIMIT 5;';}
  const response='Local dataset analysis for: "'+prompt+'". Found '+records.length+' matching records from the bundled '+rows.length+'-row delivery dataset. '+(records.length?'Average delivery time in these rows: '+(records.reduce((a,r)=>a+r.delivery_time_minutes,0)/records.length).toFixed(1)+' minutes.':'Try a broader query to find matching records.');
  return {pipelineSteps:{step1_input:{rawUserQuery:prompt,extractedTokens:q.split(/\s+/).filter(t=>t.length>2),detectedIntent:intent},step2_convertedQuery:{sqlQuery:sql,queryEngine:'Browser CSV query',executionTimeMs:1},step3_queryOutput:{recordCount:records.length,records,status:'SUCCESS'},step4_chatbotInput:{promptTemplate:'Local dataset context synthesis',inputContextTokens:records.length*18},step5_chatbotOutput:{conversationalResponse:response,actionableRecommendations:['Compare delivery ETAs with traffic and weather conditions.','Train the ETA model and review its held-out test metrics.','Treat results as a demonstration over the bundled sample dataset.']}},totalLatencyMs:2};
}
async function localVectorRecommendations(prefs){
  const response=await fetch(import.meta.env.BASE_URL+'data/restaurant-menu-catalog.json');if(!response.ok)throw new Error('Demo menu catalog unavailable');const catalog=await response.json();
  const items=catalog.restaurants.flatMap(r=>r.menu.map(m=>({...m,restaurant_name:r.name,description:m.description,price:Number(m.price),vegan:m.dish_type==='VEGAN',asian:/Japanese|Asian/.test(r.cuisine)})));
  return {topRecommendations:items.map(item=>{let score=.5;if(Number(prefs.veganWeight||0)>.5&&item.vegan)score+=.3;if(Number(prefs.asianPreference||0)>.5&&item.asian)score+=.25;if(Number(prefs.priceSensitivity||0)>.6)score+=Math.max(0,.2-item.price/100);return {...item,matchPercentage:Math.min(99,Math.round(score*100)),reasoningTag:item.vegan?'Plant-forward menu match':'Cuisine and budget preference match'};}).sort((a,b)=>b.matchPercentage-a.matchPercentage).slice(0,6)};
}

export default function AiRecommendationLab() {
  const [activeSubTab, setActiveSubTab] = useState('pipeline'); // 'pipeline' | 'dataset' | 'prediction' | 'vector'

  // --- SUB-TAB 1: DATASET & PREPROCESSING STATE ---
  const [datasetStats, setDatasetStats] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainingMessage, setTrainingMessage] = useState('');
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
    refreshModelStatus();
    handleRunChatbot(chatPrompt);
    handlePredict(predictParams);
    fetchVectorRecommendations();
  }, []);

  const refreshModelStatus = async () => {
    try {
      const response = await apiFetch('/api/ai/model-status');
      if (!response.ok) throw new Error('Could not read model status (' + response.status + ')');
      setModelStatus(await response.json());
    } catch (error) {
      try { const rows = await loadLocalDataset(); setModelStatus(localModelStatus(rows)); }
      catch { setModelStatus({ trained: false, localMode: true, datasetRowsAvailable: 0, note: 'Bundled dataset could not be loaded. Check that the deployed frontend includes /data/food_delivery_dataset.csv.' }); }
    }
  };

  const handleTrainModel = async () => {
    setTraining(true);
    setTrainingMessage('');
    try {
      const response = await apiFetch('/api/ai/train-model', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Training failed.');
      setModelStatus(result);
      setTrainingMessage('Training complete. Metrics below were calculated on a held-out test split.');
      handlePredict(predictParams);
    } catch (error) {
      try { const rows = await loadLocalDataset(); const model = trainLocalEtaModel(rows); setModelStatus({ trained: true, localMode: true, datasetRowsAvailable: rows.length, trainedAt: model.trainedAt, testCount: model.testCount, metrics: model.metrics, algorithm: model.algorithm }); setTrainingMessage('Local browser training complete on '+model.trainCount+' rows; evaluated on '+model.testCount+' held-out rows. The model is saved in this browser only.'); setPredictionResult(localPredict(predictParams, rows)); }
      catch (localError) { setTrainingMessage('Training failed: '+localError.message); }
    } finally { setTraining(false); }
  };

  const fetchDatasetStats = async () => {
    try {
      const res = await apiFetch('/api/ai/dataset-stats');
      const data = await res.json();
      setDatasetStats(data);
      // Run initial preprocessing test
      handlePreprocess(preprocessInput);
    } catch (err) {
      try { const rows = await loadLocalDataset(); setDatasetStats(localDatasetSummary(rows)); setModelStatus(localModelStatus(rows)); setPreprocessResult(localPreprocess(preprocessInput)); }
      catch (localError) { console.error('Failed to load bundled dataset:', localError); }
    }
  };

  const handlePreprocess = async (input) => {
    try {
      const res = await apiFetch('/api/ai/preprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });
      const data = await res.json();
      setPreprocessResult(data);
    } catch (err) { setPreprocessResult(localPreprocess(input)); }
  };

  const handleRunChatbot = async (promptToRun) => {
    const q = promptToRun || chatPrompt;
    setChatLoading(true);
    try {
      const res = await apiFetch('/api/ai/nlp-to-sql-chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q })
      });
      const data = await res.json();
      setChatPipelineResult(data);
    } catch (err) {
      try { setChatPipelineResult(await localChatbot(q, await loadLocalDataset())); }
      catch (localError) { console.error('Local NLP demo failed:', localError); }
    } finally { setChatLoading(false); }
  };

  const handlePredict = async (params) => {
    const p = params || predictParams;
    setPredictLoading(true);
    try {
      const res = await apiFetch('/api/ai/predict-eta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      });
      const data = await res.json();
      setPredictionResult(data);
    } catch (err) {
      try { setPredictionResult(localPredict(p, await loadLocalDataset())); }
      catch (localError) { setPredictionResult(localPredict(p, [])); console.error('Local ETA demo:', localError); }
    } finally { setPredictLoading(false); }
  };

  const fetchVectorRecommendations = async (prefs = vectorPrefs) => {
    try {
      const queryParams = new URLSearchParams(prefs).toString();
      const res = await apiFetch(`/api/ai-recommendations?customerId=1&${queryParams}`);
      const data = await res.json();
      setVectorResult(data);
    } catch (err) {
      try { setVectorResult(await localVectorRecommendations(prefs)); }
      catch (localError) { console.error('Local recommendations unavailable:', localError); }
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
      
      {!getApiBase() && <div role="status" className="glass-panel" style={{padding:'0.85rem 1rem',borderColor:'rgba(245,158,11,.35)',background:'rgba(245,158,11,.07)'}}><strong style={{color:'#d97706'}}>Local demo mode</strong><p style={{margin:'0.3rem 0 0',fontSize:'0.82rem',color:'var(--text-secondary)'}}>No backend URL is configured. The bundled dataset, browser-based ETA training, prediction, preprocessing and demo recommendations work locally; database-backed features and shared model persistence still require a deployed Eryviled backend URL in the workspace header.</p></div>}

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

      <div className="glass-panel" style={{ padding: '1.25rem', marginTop: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '220px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Database size={18} color="#4c7255" />
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>ETA model training & dataset</h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>
              Train a ridge-regression model from the repository CSV. The API fits the model, evaluates it on a held-out split, saves the coefficients on the backend host, and uses those coefficients for subsequent ETA predictions.
            </p>
            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={handleTrainModel} disabled={training} style={{ opacity: training ? 0.65 : 1 }}>
                <RefreshCw size={15} className={training ? 'animate-spin' : ''} /> {training ? 'Training model…' : modelStatus?.trained ? 'Retrain ETA model' : 'Train ETA model'}
              </button>
              <button className="btn" onClick={() => { refreshModelStatus(); fetchDatasetStats(); }} style={{ border: '1px solid var(--border-color)', background: '#f0efe7', color: '#263328' }}>Refresh API & dataset</button>
              <button className="btn" disabled={!modelStatus?.datasetRowsAvailable} onClick={() => { const base = getApiBase(); if (!base) { setTrainingMessage('Set and verify your deployed backend URL in the workspace header before downloading the dataset.'); return; } window.open(base + '/api/ai/dataset.csv', '_blank', 'noopener,noreferrer'); }} style={{ border: '1px solid var(--border-color)', background: '#f0efe7', color: '#263328' }}>
                <FileText size={15} /> Download training CSV
              </button>
            </div>
            {trainingMessage && <p role="status" style={{ fontSize: '0.8rem', marginTop: '0.75rem', color: trainingMessage.startsWith('Training complete') ? '#4c7255' : '#c65345' }}>{trainingMessage}</p>}
            {modelStatus?.error && <p style={{ fontSize: '0.75rem', color: '#c65345', marginTop: '0.5rem' }}>API status unavailable: {modelStatus.error}</p>}
          </div>
          <div style={{ minWidth: '190px', borderRadius: '11px', padding: '1rem', background: '#f2f0e8', border: '1px solid #e7e5dc' }}>
            <span className="badge" style={{ background: modelStatus?.trained ? '#e1eddb' : '#f4e8d7', color: modelStatus?.trained ? '#35543a' : '#895a2b' }}>{modelStatus?.trained ? 'MODEL TRAINED' : 'MODEL NOT TRAINED'}</span>
            <p style={{ fontSize: '0.76rem', color: '#72796e', marginTop: '0.7rem' }}>Dataset records</p>
            <strong style={{ fontSize: '1.65rem', color: '#263328' }}>{modelStatus?.datasetRowsAvailable ?? datasetStats?.totalRecords ?? '—'}</strong>
            {modelStatus?.trained && <><p style={{ fontSize: '0.76rem', color: '#72796e', marginTop: '0.55rem' }}>Held-out MAE / RMSE</p><strong style={{ color: '#263328' }}>{modelStatus.metrics?.maeMinutes} / {modelStatus.metrics?.rmseMinutes} min</strong><p style={{ fontSize: '0.76rem', color: '#72796e', marginTop: '0.45rem' }}>R² {modelStatus.metrics?.r2Score} · {modelStatus.testCount} test rows</p><p style={{ fontSize: '0.68rem', color: '#8c9185', marginTop: '0.35rem' }}>Trained {modelStatus.trainedAt ? new Date(modelStatus.trainedAt).toLocaleString() : '—'}</p></>}
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
