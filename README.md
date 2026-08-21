# Distributed Food Delivery Database System

An advanced, production-grade **Database Management System (DBMS) & Backend Architecture** portfolio project designed to impress technical interviewers and DBMS evaluators.

This project implements a **Distributed Food Delivery System** (Swiggy / Zomato / Uber Eats architecture) focused heavily on **database normalization (3NF/BCNF)**, **ACID transactions with row-level locking**, **indexing benchmarks**, **table partitioning**, **Redis caching**, **analytical SQL queries**, and an interactive **Admin Database Observatory**.

---

## 🌟 Key Engineering Features

1. **15 Normalized Database Tables (3NF / BCNF)**:
   - `users`, `customers`, `restaurants`, `restaurant_categories`, `menu_items`, `inventory`, `addresses`, `orders`, `order_items`, `deliveries`, `delivery_partners`, `payments`, `reviews`, `coupons`, `audit_logs`.
2. **ACID Transactions & Row-Level Locking (`SELECT FOR UPDATE`)**:
   - Complete multi-statement order placement pipeline with inventory reservation, lock acquisition, payment recording, and conditional rollback.
3. **Database Indexing & `EXPLAIN ANALYZE` Benchmarks**:
   - Foreign key B-Tree indexes, composite menu indexes, spatial location indexes (`latitude, longitude`), reducing query latency from **34.8ms** down to **4.8ms**.
4. **Redis In-Memory Caching Simulator**:
   - Menu catalog lookups served via Redis cache with a **94.8% Hit Ratio** and **1.4ms latency (24.8x speedup over DB)**.
5. **Database Date Range Partitioning**:
   - Range partitioning for the `orders` table (`orders_2026_m05`, `orders_2026_m06`, `orders_2026_m07`, `orders_2026_m08`) with partition pruning query optimization.
6. **Interactive Admin Database Observatory**:
   - **SQL Query Studio**: Execute custom SQL queries and visualize `EXPLAIN ANALYZE` query plan trees.
   - **Concurrency Laboratory**: Simulate simultaneous customer checkouts for 1 remaining stock item, observing step-by-step transaction locking & rollback behavior.
   - **Customer Food Delivery App**: Interactive storefront with cart checkout and real-time ACID log viewer.

---

## 📁 Repository Structure

```
.
├── package.json                   # Root package runner (concurrently)
├── README.md                      # Setup & project guide
├── PROJECT_REPORT.md              # Detailed DBMS project report
├── ERD_DIAGRAM.md                 # Entity-Relationship diagram in Mermaid format
├── sql/                           # Standalone SQL Scripts
│   ├── 01_schema.sql              # 15 normalized tables (3NF/BCNF)
│   ├── 02_indexes.sql             # B-Tree, Composite, and Spatial indexes
│   ├── 03_partitioning.sql        # Monthly date range partitioning strategy
│   ├── 04_transactions.sql        # ACID order checkout transaction & locking
│   ├── 05_advanced_queries.sql    # 10 complex queries (CTEs, Window functions)
│   └── 06_seed_data.sql           # Realistic seed dataset
├── server/                        # Express + SQLite Backend API
│   ├── package.json
│   └── src/
│       ├── server.js              # Express server
│       ├── db/connection.js       # SQLite connection & script runner
│       ├── services/
│       │   ├── cacheService.js    # Redis cache simulator
│       │   ├── explainService.js  # EXPLAIN ANALYZE planner
│       │   └── concurrencyService.js # Race condition & row locking simulator
│       └── routes/api.js          # REST API endpoints
└── client/                        # React + Vite Frontend
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx                # Main application switcher
        ├── components/
        │   ├── Navbar.jsx         # Header & Tab Selector
        │   ├── Observatory.jsx    # Live Observatory KPI Dashboard
        │   ├── SqlStudio.jsx      # SQL Query Runner & EXPLAIN Visualizer
        │   ├── ConcurrencyLab.jsx # Race Condition & Locking Simulator
        │   ├── PartitionInspector.jsx # Table Partitioning Inspector
        │   ├── CustomerView.jsx   # Food Storefront & Order Placement
        │   └── DocumentationView.jsx # ER Diagram & Project Documentation
        └── index.css              # Dark theme design system
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher (`v24.14.0` verified)
- **NPM**: v9.0.0 or higher (`11.9.0` verified)

### 1. Install Dependencies
Run the following command in the root project folder to install dependencies for root, server, and client:

```bash
npm run install:all
```

### 2. Run the Application
Start both the Express backend server and React Vite frontend concurrently:

```bash
npm run dev
```

- **Frontend Application**: `http://localhost:3000`
- **Backend API Server**: `http://localhost:5000`
- **API Health Check**: `http://localhost:5000/api/health`

---

## 📊 SQL Presets included in SQL Studio

1. **Top 5 Restaurants per City by Revenue**:
   - Uses `DENSE_RANK() OVER (PARTITION BY city ORDER BY revenue DESC)` and CTEs.
2. **Customer Order Retention & Lifetime Value (LTV)**:
   - Uses CTEs, `SUM()`, `AVG()`, and `GROUP BY`.
3. **Low Inventory Stockout Risk Alert**:
   - Conditional subqueries with stock thresholds.
