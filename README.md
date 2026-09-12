# NavSetu – Intelligent Freight Forecasting & Vessel Chartering Decision-Support System (SIH 2026)

NavSetu is an intelligent freight forecasting and vessel chartering decision-support platform built for SIH 2026 (PS ID: SIH26006). Replace this overview with your finalized wording before submission.

## 1. Project Information

- **Project Title:** NavSetu – Intelligent Freight Forecasting & Vessel Chartering Decision-Support System
- **PS ID:** SIH26006
- **PS Title:** Intelligent freight forecasting and vessel chartering recommendation system
- **Category:** Software
- **Theme:** Transport & Logistics (Maritime)

## 2. Problem Statement

Maritime procurement teams must decide when to charter vessels and at what cost, but freight rates, fuel prices, port congestion and vessel availability change constantly. Manual analysis of these signals is slow, inconsistent and prone to costly chartering mistakes.

## 3. Proposed Solution

NavSetu brings freight forecasting, vessel feasibility, cost estimation, port risk and contract analysis into a single decision workflow. A cargo request is passed through forecast → cost → risk → optimization steps, and the system prescribes a chartering decision (`CHARTER_NOW`, `WAIT`, or `EVALUATE`) with an explanation and estimated total cost.

## 4. Key Features

- Freight rate forecasting (XGBoost model with economic, fuel and congestion features)
- Vessel registry, availability and tracking with a live maritime map
- Voyage cost estimation and optimization (OR-Tools based trip allocation)
- Port risk assessment and congestion metrics
- What-if scenario simulation
- Chartering recommendation engine with confidence and explanation
- Alerts feed and market analytics dashboards

## 5. Technology Stack

- Frontend: React 19, Vite, Tailwind CSS 4, Leaflet, Recharts
- Backend: Node.js, Express, Prisma, PostgreSQL
- Machine Learning: Python, XGBoost / scikit-learn, FastAPI
- Optimization: Google OR-Tools, Pydantic, FastAPI
- Deployment: Docker / docker compose

## 6. Architecture

See [docs/architecture.md](docs/architecture.md).

```text
User (browser)
  |
  v
React Frontend (Vite, :5173)
  |
  v
Node.js/Express API (:3000)
  |-----------> PostgreSQL (Prisma ORM)
  |
  +----> Freight Forecasting ML service (Python/FastAPI)
  +----> Optimization service (OR-Tools/FastAPI)
  |
  v
Recommendation / decision output
```

## 7. Repository Structure

```text
SIH/
├── README.md
├── SUBMISSION_GUIDE.md
├── submission/
│   ├── PRESENTATION.md
│   └── DEMO.md
├── backend/          # Node.js/Express API + Prisma schema
├── frontend/         # React/Vite web app
├── ml/               # Python ML services (forecasting, optimization)
├── docs/             # Architecture / technical documentation
├── assets/
│   └── screenshots/  # Product screenshots
├── requirements.txt
├── .gitignore
└── LICENSE
```

### What goes where?

| Item | Location |
|---|---|
| Source code | `backend/`, `frontend/`, `ml/` (normal project folders) |
| Architecture / technical documentation | `docs/` |
| Project screenshots | `assets/screenshots/` |
| Final PPT / presentation | `submission/` |
| Demo video link | `submission/DEMO.md` |
| Project overview | `README.md` |

## 8. Final Presentation

Keep the final SIH presentation in the repository whenever the file size allows it. See [submission/PRESENTATION.md](submission/PRESENTATION.md) for the required format. If the PPT is too large for GitHub, put an accessible Google Drive/OneDrive viewer link there instead.

## 9. Demo Video

A demo video is **optional**, but recommended. Add the YouTube/Google Drive link in [submission/DEMO.md](submission/DEMO.md).

## 10. Screenshots / Prototype Photos

Important screenshots are stored in `assets/screenshots/`. See [assets/screenshots/README.md](assets/screenshots/README.md) for naming conventions.

## 11. Installation

Prerequisites: Node.js 18+, PostgreSQL 16, Python 3.10+.

**Backend API**

```bash
cd backend
npm install
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npx prisma migrate deploy
npx prisma generate
```

**Frontend**

```bash
cd frontend
npm install
```

**ML services (optional, for full forecasting/optimization)**

```bash
pip install -r requirements.txt
```

## 12. Run

```bash
# Backend (port 3000, health check at GET /api/health)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev

# Docker alternative (backend + PostgreSQL)
cd backend && docker compose up --build
```

## 13. Future Scope

- Live AIS vessel tracking integration
- Ensemble/Transformer-based freight models
- Multi-voyage portfolio optimization
- Mobile-responsive PWA and role-based notification digests

## Important

Before submission, make sure the repository is accessible to reviewers. Do **not** upload passwords, API keys, access tokens, `.env` files containing secrets, or other confidential credentials.

