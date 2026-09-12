# System Architecture

## High-level flow

```text
User (browser)
  |
  v
React Frontend (Vite, Tailwind, Leaflet)
  |
  v
Node.js / Express REST API (JWT auth, role-based access)
  |-------------------> PostgreSQL (Prisma ORM)
  |
  +----> Freight Forecasting ML service (Python / FastAPI, XGBoost)
  +----> Voyage Optimization service (Python / FastAPI, OR-Tools)
  |
  v
Decision engine (cost -> risk -> recommendation)
  |
  v
Chartering recommendation: CHARTER_NOW / WAIT / EVALUATE
```

## Components

### Frontend (`frontend/`)
React 19 + Vite single-page app. Handles authentication, cargo workspace (forecast → cost → risk → optimization → recommendation steps), vessel/port management, alerts, market analytics and a live maritime map (Leaflet).

### Backend API (`backend/`)
Node.js + Express service with Prisma as the PostgreSQL ORM. Exposes REST APIs under `/api` for auth, cargo, vessels, ports, forecasts, cost, risk, contract, optimization, recommendations, what-if scenarios and alerts. Follows a `routes → validators → controllers → services → integrations` layering.

### Freight Forecasting ML (`ml/freight_forecasting/`)
Python service (FastAPI) that serves an XGBoost freight-rate model trained on commodity prices, economic indicators, marine fuel prices, port congestion and vessel availability data. Artifacts: `models/freight_rate_model.joblib`, training pipeline in `src/`, metrics in `reports/metrics.json`.

### Optimization service (`ml/optimization/`)
Python service (FastAPI + Google OR-Tools) that computes optimal trip allocation, vessel selection, cost minimization and port turnaround feasibility.

### Database
PostgreSQL stores users, vessels, ports, cargo requests, forecasts, scenarios, recommendations and alerts (schema in `backend/prisma/schema.prisma`).

## Deployment

The backend ships with a `Dockerfile` and `docker-compose.yml` that bring up PostgreSQL 16 and the API (migrations applied on startup). The frontend is deployed as a static build (Vercel config included).
