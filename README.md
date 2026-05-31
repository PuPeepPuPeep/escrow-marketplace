# Escrow Marketplace

A full-stack escrow payment platform where funds are held by a neutral third party until the buyer confirms receipt. Built as a portfolio project to demonstrate backend engineering skills: atomic state machines, row-level locking, idempotency, and scheduled job recovery.

**Live demo:** _(deploy URL here)_

---

## Features

**Buyer / Seller flow**
- Any registered user can both create deals (as seller) and accept deals (as buyer)
- Deal link is shareable — anyone with the link can view and accept
- Countdown timer per deal; expired deals are automatically cancelled by the scheduler
- Mock slip verification (90% success rate, or force result for testing)

**Admin**
- View all deals across the platform
- Cancel any locked deal (e.g. dispute resolution)
- Manage withdrawal payouts with CSV export

**Security & correctness**
- `SELECT FOR UPDATE` row-level locking prevents double-acceptance race conditions
- Partial unique index on `payments(deal_id) WHERE verify_status = 'VERIFIED'` guarantees payment idempotency at the DB level
- All money stored as `NUMERIC(12,2)` — no floating-point arithmetic
- Wallet balance and transaction log always updated in the same `db.commit()`
- APScheduler crash recovery: expired deals are detected and closed on startup

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · SQLAlchemy 2.x (sync) · Alembic · PostgreSQL 16 |
| Auth | JWT (python-jose) · bcrypt |
| Scheduler | APScheduler 3.x BackgroundScheduler |
| Frontend | React 18 · Vite · TypeScript · TailwindCSS |
| HTTP client | Axios |
| Deployment | Docker Compose · nginx (reverse proxy + static files) |

---

## Deal State Machine

```
CREATED ──► LOCKED ──► PAID ──► DONE
              │
              ▼
           EXPIRED   (APScheduler DateTrigger)

CREATED / LOCKED ──► CANCELLED
```

Every transition uses `SELECT ... FOR UPDATE` to prevent concurrent mutations.

---

## Quick Start

### Prerequisites
- Docker & Docker Compose

### 1. Clone and configure
```bash
git clone https://github.com/<your-username>/escrow-marketplace.git
cd escrow-marketplace
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and SECRET_KEY at minimum
```

### 2. Run
```bash
docker compose up --build
```

| URL | Description |
|---|---|
| http://localhost | Frontend |
| http://localhost/api/docs | Swagger UI |

### 3. Create an admin account
Register normally, then promote via psql:
```bash
# Expose DB port first (docker-compose.override.yml)
psql -h 127.0.0.1 -U escrow -d escrow \
  -c "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"
```

---

## Local Development (hot-reload)

```bash
# Terminal 1 — DB + Backend (auto-reloads on .py changes)
docker compose up db backend

# Terminal 2 — Frontend (Vite HMR)
cd frontend && npm run dev
```

Requires `docker-compose.override.yml` (gitignored) to expose backend on `localhost:8000`.  
See `.env.example` for the full override config.

---

## Running Tests

Tests require a real PostgreSQL instance (`SELECT FOR UPDATE` is not supported in SQLite).

```bash
cd backend
pip install -r requirements.txt

# Start the test DB
docker compose up db -d

TEST_DATABASE_URL=postgresql://escrow:escrow@localhost:5432/escrow_test pytest tests/
```

Key test cases:
- `test_accept_twice_race_condition` — two concurrent accepts, only one succeeds
- `test_pay_idempotency` — double payment attempt is rejected at the DB level
- `test_wallet_reconciliation` — balance always equals sum of credit transactions

---

## Project Structure

```
escrow-marketplace/
├── backend/
│   ├── app/
│   │   ├── routers/        # Thin route handlers (auth, deals, wallet, admin, mock)
│   │   ├── services/       # Business logic (deal_service, wallet_service, ...)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── dependencies.py # get_db, get_current_user, require_admin, require_user
│   │   ├── config.py       # pydantic-settings (reads .env)
│   │   └── security.py     # bcrypt + JWT
│   ├── alembic/            # Database migrations
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/            # Typed Axios wrappers
│       ├── components/     # Header, DealStatusBadge, CountdownTimer, Pagination
│       ├── context/        # AuthContext (JWT in localStorage)
│       ├── hooks/          # useDealPolling (5s interval + manual refetch)
│       └── pages/          # One file per route
├── nginx/
│   └── nginx.conf          # Reverse proxy: /api/* → backend, /* → frontend
└── docker-compose.yml
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `SECRET_KEY` | — | JWT signing key |
| `GP_FEE_PERCENT` | `3.0` | Platform fee percentage |
| `DEAL_LOCK_DURATION_MINUTES` | `30` | Default countdown after deal accepted |
| `ESCROW_BANK_NAME` | `Kasikorn Bank (KBank)` | Mock escrow account (displayed to buyer) |
| `ESCROW_ACCOUNT_NUMBER` | `123-4-56789-0` | Mock account number |
| `ESCROW_ACCOUNT_NAME` | `Escrow Marketplace Co., Ltd.` | Mock account holder name |

---

## What's Mocked

This is a portfolio project — the following are simulated:

| Component | How it's mocked |
|---|---|
| Slip verification | `POST /mock/slip-verify` — 90% VERIFIED, or `force_result` param for tests |
| Bank transfer | Admin exports CSV; actual transfer is manual |
| Escrow bank account | Static values from env config |
| Email / LINE Notify | Notification rows inserted to DB only |
| Slip image | URL string stored, no actual file upload |
