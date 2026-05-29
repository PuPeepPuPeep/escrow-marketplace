# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Escrow Marketplace portfolio project — a web app that acts as a payment escrow between buyers and sellers. Money is held until the buyer confirms receipt, then released to the seller's wallet.

**Stack:** FastAPI + PostgreSQL + React (Vite) + TailwindCSS, deployed via Docker Compose on AWS EC2 behind nginx.

---

## Commands

### Run (Docker — primary)
```bash
docker compose up --build          # full stack
docker compose down -v             # stop + wipe DB volume (use when changing migrations)
```

### Backend (local dev)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 --root-path /api
```

### Frontend (local dev)
```bash
cd frontend
npm install
npm run dev        # Vite dev server on :5173, proxies /api → localhost:8000
npm run build
npx tsc --noEmit   # type check only
```

### Database migrations
```bash
cd backend
alembic upgrade head              # apply all migrations
alembic revision --autogenerate -m "description"   # generate from model changes
alembic downgrade -1              # roll back one step
```

### Tests
```bash
cd backend
# requires a running PostgreSQL — default: postgresql://escrow:escrow@localhost:5432/escrow_test
pytest tests/
pytest tests/test_deals.py::test_accept_twice_race_condition   # single test
TEST_DATABASE_URL=postgresql://... pytest tests/   # override DB URL
```

> **Tests must use real PostgreSQL** — SQLite does not support `SELECT FOR UPDATE`.

---

## Architecture

### Request flow (production)
```
Browser → nginx:80
  /api/* → strip /api → backend:8000 (FastAPI)
  /*     → frontend:80 (nginx serving React static build)
```

The backend runs with `--root-path /api` so Swagger UI at `/api/docs` generates correct URLs.

### Backend layout

```
backend/app/
  main.py          — FastAPI app factory, lifespan (starts/stops APScheduler)
  config.py        — pydantic-settings (reads .env)
  database.py      — SQLAlchemy engine + SessionLocal + Base
  security.py      — bcrypt password hashing, JWT encode/decode
  dependencies.py  — get_db, get_current_user, require_role(*roles)
  models/          — SQLAlchemy ORM models (one file per table)
  schemas/         — Pydantic request/response schemas
  routers/         — FastAPI route handlers (thin — call services)
  services/        — Business logic (deal_service, wallet_service, etc.)
```

**Routers are thin.** They validate input, call a service function, catch `ValueError` → `HTTPException(400)`. All state transitions live in `services/`.

### Deal state machine (`services/deal_service.py`)

```
CREATED → LOCKED → PAID → DONE
            ↓
          EXPIRED        (APScheduler fires at expires_at)
CREATED/LOCKED → CANCELLED
```

Every transition uses `SELECT ... FOR UPDATE` to prevent race conditions:
```python
deal = db.execute(select(Deal).where(...).with_for_update()).scalar_one_or_none()
# guard: check current status before mutating
```

**Startup crash recovery:** `recover_expired_deals()` runs at startup (called from `scheduler_service.start_scheduler()`). It queries all `LOCKED` deals where `expires_at < now` and expires them, handling any jobs that were missed while the server was down.

### Money integrity rules

- All money columns are `NUMERIC(12, 2)` in PostgreSQL — never `float`.
- Python always uses `Decimal`, never `float`, for arithmetic on money values.
- `wallet.balance` must equal `SUM(wallet_transactions.amount WHERE type='CREDIT') - SUM(...WITHDRAW)` at all times — enforced by always writing a `WalletTransaction` row in the same DB commit as any balance change.
- The `confirm_deal` function locks both `Deal` and `Wallet` rows **in the same transaction** before crediting:
  ```python
  deal  = db.execute(select(Deal).where(...).with_for_update()).scalar_one()
  wallet = db.execute(select(Wallet).where(...).with_for_update()).scalar_one()
  # mutate both, then single db.commit()
  ```

### Idempotency (payment verification)

`payments` table has a **partial unique index**:
```sql
CREATE UNIQUE INDEX uix_payments_deal_verified ON payments(deal_id)
WHERE verify_status = 'VERIFIED'
```
A second attempt to verify the same deal raises `IntegrityError` at the DB level regardless of application logic. The service layer also checks for an existing `VERIFIED` row before inserting.

### Dependency injection pattern

Three standard dependencies used across all routers:
- `get_db` — yields a `Session`, closes on exit
- `get_current_user` — decodes JWT → returns `User` ORM object
- `require_role("seller", "admin")` — calls `get_current_user` internally, raises 403 if role doesn't match

### Scheduler

`APScheduler BackgroundScheduler` (sync, no Redis needed). A `DateTrigger` job is scheduled per deal after it's locked. The job (`expire_deal_job`) opens its **own** DB session (it runs in a background thread outside the request lifecycle).

### Mock endpoints

`POST /mock/slip-verify` — returns `VERIFIED` 90% of the time or based on `force_result` param. Used in tests with `force_result: "VERIFIED"` to make tests deterministic. The `pay_deal` router calls `mock_verify()` directly rather than making an HTTP call.

### Frontend architecture

```
src/
  api/           — typed axios wrappers (auth.ts, deals.ts, wallet.ts, admin.ts)
  context/       — AuthContext (JWT token in localStorage, user object)
  hooks/         — useDealPolling (setInterval 5s refetch — no WebSocket)
  components/    — DealStatusBadge, CountdownTimer
  pages/         — one file per route
  types/index.ts — shared TypeScript interfaces (Deal, Wallet, etc.)
```

`api/client.ts` is the single axios instance. It reads the token from `localStorage` and injects `Authorization: Bearer` on every request. `VITE_API_URL` env var sets the base URL (defaults to `/api`).

---

## Key constraints to preserve

- **Never use `float` for money** — use `Decimal` in Python and `NUMERIC(12,2)` in migrations.
- **State transitions must go through `services/deal_service.py`** — never mutate `deal.status` directly in a router.
- **Every wallet balance change requires a matching `WalletTransaction` row** in the same `db.commit()`.
- **Migrations must not call `enum.create()` manually** before `op.create_table` — SQLAlchemy creates ENUM types automatically on table creation, a manual pre-create causes `DuplicateObject` error.
- **Tests need real PostgreSQL** — `SELECT FOR UPDATE` is not supported in SQLite.

---

## Environment variables (`.env`)

```
POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD   — passed to postgres container
DATABASE_URL        — used by backend (e.g. postgresql://escrow:pass@db:5432/escrow)
SECRET_KEY          — JWT signing key
ACCESS_TOKEN_EXPIRE_MINUTES
GP_FEE_PERCENT      — default GP fee (default 3.0)
DEAL_LOCK_DURATION_MINUTES  — default countdown (default 30)
```

Copy `.env.example` → `.env` before first run.
