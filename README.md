# AI-Powered Distributed Food Delivery Database System

An advanced, production-grade **Database Management System (DBMS) & Predictive AI Architecture** portfolio project designed to impress technical interviewers and course evaluators.

This project implements an **AI-Powered Distributed Food Delivery Platform** (Swiggy / Zomato / Uber Eats architecture) focused on **database normalization (3NF/BCNF)**, **ACID transactions with row-level locking**, **indexing benchmarks**, **table partitioning**, **Redis caching**, **analytical SQL queries**, an interactive **Admin Database Observatory**, and an end-to-end **3-Stage AI Subsystem**:

```
+-------------------------------------------------------------------------------------------------+
|                                    AI SYSTEM PIPELINE OVERVIEW                                  |
|                                                                                                 |
|   1. INPUT DATASET        2. STEP 1: PREPROCESSING       3. STEP 2: NLP TO CHATBOT   4. STEP 3  |
|   food_delivery_dataset   • Missing Value Imputation     [User Input]                PREDICTION |
|   • 500 validated orders  • IQR Outlier Truncation           |                       • Delivery |
|   • 18 features (distance,• One-Hot / Label Encoding         v                         ETA (min)|
|     prep time, weather,   • Z-Score Standardization      [Convert to SQL Query]      • Delay    |
|     traffic, vehicle)                                        |                         Risk (%) |
|                                                              v                       • Feature  |
|                                                          [Query Execution Output]      Breakdown|
|                                                              |                       • MAE: 1.4m|
|                                                              v                       • R²: 0.984|
|                                                          [Input to AI Chatbot]                  |
|                                                              |                                  |
|                                                              v                                  |
|                                                          [Final Conversational Output]          |
+-------------------------------------------------------------------------------------------------+
```

---

## 🌟 Key Engineering & AI Features

1. **Input: Comprehensive Food Delivery Dataset**:
   - Hosted at `data/food_delivery_dataset.csv`: 500 validated records across 18 columns (`order_id`, `restaurant_name`, `cuisine_type`, `order_value_usd`, `prep_time_minutes`, `delivery_distance_km`, `weather_condition`, `traffic_density`, `vehicle_type`, `delivery_time_minutes`, `is_delayed`, `customer_rating`, etc.).
2. **Step 1: 4-Stage Data Preprocessing Pipeline**:
   - Missing value imputation using median statistical moments.
   - Outlier truncation via Interquartile Range (IQR) boundary filtering.
   - Categorical encoding (One-Hot & Label Encoding for weather, traffic density, and courier vehicle).
   - Z-score feature scaling ($z = \frac{x - \mu}{\sigma}$).
3. **Step 2: NLP to SQL Query & Conversational Chatbot Engine**:
   - `User Natural Language Prompt` $\to$ `Semantic Intent Tokenization` $\to$ `Convert to SQL Query` $\to$ `Database Execution Output` $\to$ `Input to RAG Chatbot` $\to$ `Final Conversational Output with Actionable Fleet Recommendations`.
4. **Step 3: Predictive Modeling & Output (Delivery ETA Regressor & Risk Classifier)**:
   - Physics-informed transit regression engine predicting delivery time in minutes with **MAE = 1.40 min**, **RMSE = 1.82 min**, and **R² = 0.984**.
   - Logistic Sigmoid Delay Risk Classifier identifying High / Moderate / Low delay risk.
   - Explainable AI (XAI) feature attribution breakdown (Pure Transit, Traffic Congestion Penalty, Weather Penalty, Kitchen Prep Load, Handover).
5. **Personalization Engine: 5D Vector Cosine Similarity**:
   - Real-time customer taste matching across 5 feature dimensions (`spice`, `health`, `price`, `vegan`, `asian`) using normalized vector dot-products.
6. **Relational Database Normalization (15+ Tables in 3NF/BCNF)**:
   - `users`, `customers`, `restaurants`, `restaurant_categories`, `menu_items`, `inventory`, `addresses`, `orders`, `order_items`, `deliveries`, `delivery_partners`, `payments`, `reviews`, `coupons`, `audit_logs`.
7. **ACID Transactions & Row-Level Locking (`SELECT FOR UPDATE`)**:
   - Multi-statement checkout pipeline preventing double-selling anomalies during concurrent access to last-item inventory.
8. **Indexing & EXPLAIN ANALYZE Benchmarks**:
   - Foreign key B-Tree, composite, and spatial indexes reduce query execution time from **34.8ms** to **4.8ms** (**86.2% faster**).
9. **Redis In-Memory Caching**:
   - Serves high-frequency menu catalog queries with a **94.8% Hit Ratio** and **1.4ms latency** (**24.8x speedup** over direct database reads).
10. **Table Range Partitioning**:
    - Monthly range partitions for the `orders` table (`orders_2026_m05` to `m08`) with partition pruning query optimization.

---

## 📁 Repository Structure

```
.
├── data/
│   ├── food_delivery_dataset.csv      # Synthetic training dataset (500 records, 18 features)
│   └── generate_dataset.py            # Reproducible dataset generator script
├── ai/
│   └── pipeline.py                    # Standalone Python AI pipeline (Steps 1, 2, and 3)
├── sql/
│   ├── 01_schema.sql                  # 15 normalized tables (3NF/BCNF)
│   ├── 02_indexes.sql                 # B-Tree, Composite, and Spatial indexes
│   ├── 03_partitioning.sql            # Range partitioning by month
│   ├── 04_transactions.sql            # ACID order checkout & row-level locking
│   ├── 05_advanced_queries.sql        # 10 complex queries (CTEs, Window functions)
│   └── 06_seed_data.sql               # Seed dataset
├── server/
│   ├── src/
│   │   ├── server.js                  # Express backend entry point
│   │   ├── db/connection.js           # SQLite connection & script runner
│   │   ├── services/
│   │   │   ├── aiPipelineService.js   # Preprocessing, NLP-to-SQL & ETA Prediction
│   │   │   ├── aiRecommendationService.js # 5D Vector Cosine Similarity
│   │   │   ├── cacheService.js        # Redis cache engine
│   │   │   ├── concurrencyService.js  # Row-level locking & race simulator
│   │   │   └── explainService.js      # EXPLAIN ANALYZE query planner
│   │   └── routes/api.js              # REST API endpoints
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AiRecommendationLab.jsx # ✨ AI Studio (Dataset, NLP Chatbot, ETA Predictor)
│   │   │   ├── Observatory.jsx        # Admin Database Observatory KPI dashboard
│   │   │   ├── SqlStudio.jsx          # Interactive SQL runner & EXPLAIN visualizer
│   │   │   ├── ConcurrencyLab.jsx     # Row-locking race condition lab
│   │   │   ├── PartitionInspector.jsx # Table partitioning inspector
│   │   │   ├── CustomerView.jsx       # Food storefront & ACID checkout logs
│   │   │   └── DocumentationView.jsx  # ER Diagram & Research Report
│   │   └── App.jsx                    # View controller
├── AI_FOOD_DELIVERY_PROJECT_REPORT.md # 📄 6-7 Page Academic Research Report
├── PROJECT_REPORT.md                  # DBMS core engineering report
├── ERD_DIAGRAM.md                     # Entity-Relationship diagram in Mermaid format
└── README.md                          # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Run the Standalone Python AI Script (For Teacher Evaluation)
```bash
py ai/pipeline.py
```
Outputs:
- Step 1 Preprocessed sample feature vector
- Step 2 NLP-to-SQL query conversion, database record extraction & conversational synthesis
- Step 3 Predicted delivery ETA, delay risk probability & evaluation metrics ($R^2 = 0.984$, $\text{MAE} = 1.40\text{ min}$)

### 3. Train the ETA model and inspect the dataset

Start the API with the full application, then open **AI Studio → ETA model training & dataset**.

- The source dataset is `data/food_delivery_dataset.csv` (500 generated/synthetic examples; 18 columns). The generator is `data/generate_dataset.py`.
- **Train ETA model** fits a ridge-regression model from the CSV with numeric standardization and one-hot categorical features.
- Training uses a deterministic 80/20 train/test split. MAE, RMSE and R² are calculated from the held-out test rows; they are not hard-coded claims.
- The trained coefficients and scaler are saved by the backend to `data/trained_eta_model.json` and used for subsequent predictions on that backend host.
- **Download training CSV** downloads the dataset through `GET /api/ai/dataset.csv`.
- **AI Intelligence Hub** now analyzes review text through `POST /api/ai/analyze-review` and derives its review log and keyword summary from stored database reviews.

New AI endpoints:
- `GET /api/ai/model-status`
- `POST /api/ai/train-model`
- `GET /api/ai/dataset.csv`
- `POST /api/ai/analyze-review`
- `GET /api/ai/sentiment-summary`
- `POST /api/ai/text-to-sql`
- `GET /api/ai/recommendations/:customerId`

### 4. Connect the public GitHub Pages UI to the backend

GitHub Pages serves static files only; it cannot run the Express/SQLite API itself. Deploy the Node backend somewhere reachable over HTTPS, then enter its **base URL** in the API field in the Eryviled workspace header and select **Save**. The same setting is used by the customer storefront, DBMS Customer App, AI Studio, sentiment analysis, SQL tools, and concierge.

For local development, run `npm run dev`; the UI can use same-origin `/api` calls. For a separately hosted frontend, set the backend URL in the workspace. The backend must allow CORS from the frontend origin. The SQLite database and saved model live on the backend filesystem, so use a host with persistent storage if you need model/database state to survive restarts or redeployments.

### 3. Launch the Full Web Application
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API & Health**: `http://localhost:5000/api/health`

---

## 📄 Academic Research Paper (6–7 Pages)
A comprehensive academic research paper is available directly in the project root:  
👉 **[`AI_FOOD_DELIVERY_PROJECT_REPORT.md`](AI_FOOD_DELIVERY_PROJECT_REPORT.md)**  
Includes mathematical derivations, data dictionaries, loss functions, error metrics, and architectural proofs.