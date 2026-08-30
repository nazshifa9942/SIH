# SIH26006 Backend (Phase 1)

Node.js + Express + Prisma + PostgreSQL foundation for the Intelligent Freight Forecasting and Vessel Chartering Recommendation System.

Phase 1 covers project setup, database schema, authentication, and API foundation only. Cargo, vessel, forecast, recommendation, ML, and optimization APIs belong to later phases.

## Prerequisites

- Node.js 18+
- PostgreSQL 16 (local install or Docker)

## Local setup

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Set `DATABASE_URL` and a strong `JWT_SECRET` in `.env`.

3. Install dependencies:

```bash
npm install
```

4. Start PostgreSQL, then run migrations:

```bash
npx prisma migrate deploy
npx prisma generate
```

5. Start the API:

```bash
npm run dev
```

The server listens on `PORT` (default `3000`).

Health check: `GET http://localhost:3000/api/health`

## Docker (backend + PostgreSQL)

From this `backend/` directory:

```bash
docker compose up --build
```

This starts PostgreSQL and the API. The API runs `prisma migrate deploy` on startup.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port |
| `NODE_ENV` | `development`, `test`, or `production` |
| `DATABASE_URL` | PostgreSQL connection string for Prisma |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Token lifetime (for example `24h`) |
| `CORS_ORIGIN` | Allowed browser origin |
| `LOG_LEVEL` | Winston log level |

Do not commit a real `.env` file.

## Phase 1 APIs

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (Bearer JWT)
- `GET /api/health`

Send `Authorization: Bearer <token>` for protected routes.

## Tests

```bash
npm test
```

Tests mock Prisma so they do not require a running database.

## Docs

`/docs` at the repository root is the source of truth. Read it before changing architecture, schema, or API contracts.
