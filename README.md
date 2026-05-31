# Escrow Marketplace

[English](#english) · [ภาษาไทย](#ภาษาไทย)

---

<a name="english"></a>
## English

A full-stack escrow payment platform where funds are held by a neutral third party until the buyer confirms receipt. Built as a portfolio project to demonstrate backend engineering skills: atomic state machines, row-level locking, idempotency, and scheduled job recovery.

**Live demo:** _(deploy URL here)_

### Features

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

### Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI · SQLAlchemy 2.x (sync) · Alembic · PostgreSQL 16 |
| Auth | JWT (python-jose) · bcrypt |
| Scheduler | APScheduler 3.x BackgroundScheduler |
| Frontend | React 18 · Vite · TypeScript · TailwindCSS |
| HTTP client | Axios |
| Deployment | Docker Compose · nginx (reverse proxy + static files) |

### Deal State Machine

```
CREATED ──► LOCKED ──► PAID ──► DONE
              │
              ▼
           EXPIRED   (APScheduler DateTrigger)

CREATED / LOCKED ──► CANCELLED
```

Every transition uses `SELECT ... FOR UPDATE` to prevent concurrent mutations.

### Quick Start

**Prerequisites:** Docker & Docker Compose

```bash
git clone https://github.com/PuPeepPuPeep/escrow-marketplace.git
cd escrow-marketplace
cp .env.example .env
# Edit .env — set POSTGRES_PASSWORD and SECRET_KEY at minimum
docker compose up --build
```

| URL | Description |
|---|---|
| http://localhost | Frontend |
| http://localhost/api/docs | Swagger UI |

**Create an admin account** — register normally, then promote via psql:
```bash
psql -h 127.0.0.1 -U escrow -d escrow \
  -c "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"
```

### Local Development (hot-reload)

```bash
# Terminal 1 — DB + Backend (auto-reloads on .py changes)
docker compose up db backend

# Terminal 2 — Frontend (Vite HMR)
cd frontend && npm run dev
```

### Running Tests

```bash
cd backend
docker compose up db -d
TEST_DATABASE_URL=postgresql://escrow:escrow@localhost:5432/escrow_test pytest tests/
```

Key test cases:
- `test_accept_twice_race_condition` — two concurrent accepts, only one succeeds
- `test_pay_idempotency` — double payment attempt is rejected at the DB level
- `test_wallet_reconciliation` — balance always equals sum of credit transactions

### What's Mocked

| Component | How it's mocked |
|---|---|
| Slip verification | `POST /mock/slip-verify` — 90% VERIFIED, or `force_result` param for tests |
| Bank transfer | Admin exports CSV; actual transfer is manual |
| Escrow bank account | Static values from env config |
| Email / LINE Notify | Notification rows inserted to DB only |
| Slip image | URL string stored, no actual file upload |

---

<a name="ภาษาไทย"></a>
## ภาษาไทย

แพลตฟอร์ม escrow payment แบบ full-stack ที่เงินจะถูกพักไว้กับตัวกลาง (escrow) จนกว่าผู้ซื้อจะยืนยันว่าได้รับสินค้าแล้วจึงปล่อยเงินให้ผู้ขาย สร้างเพื่อเป็น portfolio project สำหรับแสดงทักษะ backend engineering: atomic state machine, row-level locking, idempotency และ scheduler crash recovery

**Live demo:** _(ใส่ URL ที่นี่)_

### ฟีเจอร์

**ฝั่งผู้ใช้ (Buyer / Seller)**
- ผู้ใช้ทุกคนสามารถเป็นทั้งผู้ขาย (สร้างดีล) และผู้ซื้อ (รับดีล) ได้ในบัญชีเดียว
- ลิงก์ดีลแชร์ได้ — ใครมีลิงก์ก็สามารถดูและกดรับดีลได้
- มี countdown timer ต่อดีล — ถ้าหมดเวลาระบบยกเลิกอัตโนมัติ
- Mock การตรวจสลิป (สำเร็จ 90% หรือกำหนด force result สำหรับ testing)

**ฝั่ง Admin**
- ดู list ดีลทั้งหมดในระบบ
- ยกเลิกดีลที่ถูกล็อกได้ (เช่น กรณีพิพาท)
- จัดการคำขอถอนเงิน พร้อม export CSV

**ความถูกต้องและความปลอดภัย**
- `SELECT FOR UPDATE` ป้องกัน race condition กรณีมีคนกด Accept พร้อมกัน
- Partial unique index บน `payments(deal_id) WHERE verify_status = 'VERIFIED'` ป้องกัน double payment ระดับ DB
- เงินทุกช่องเก็บเป็น `NUMERIC(12,2)` — ไม่ใช้ float เด็ดขาด
- ยอดเงินใน wallet และ transaction log อัปเดตพร้อมกันใน commit เดียวเสมอ
- Scheduler crash recovery: ดีลที่หมดเวลาแล้วจะถูกปิดอัตโนมัติเมื่อ server รีสตาร์ต

### Tech Stack

| Layer | เทคโนโลยี |
|---|---|
| Backend | FastAPI · SQLAlchemy 2.x (sync) · Alembic · PostgreSQL 16 |
| Auth | JWT (python-jose) · bcrypt |
| Scheduler | APScheduler 3.x BackgroundScheduler |
| Frontend | React 18 · Vite · TypeScript · TailwindCSS |
| HTTP client | Axios |
| Deployment | Docker Compose · nginx (reverse proxy + static files) |

### State Machine ของดีล

```
CREATED ──► LOCKED ──► PAID ──► DONE
              │
              ▼
           EXPIRED   (APScheduler DateTrigger)

CREATED / LOCKED ──► CANCELLED
```

ทุก transition ใช้ `SELECT ... FOR UPDATE` ป้องกันการแก้ไขพร้อมกัน

### เริ่มใช้งาน

**สิ่งที่ต้องมี:** Docker & Docker Compose

```bash
git clone https://github.com/PuPeepPuPeep/escrow-marketplace.git
cd escrow-marketplace
cp .env.example .env
# แก้ .env — อย่างน้อยต้องตั้ง POSTGRES_PASSWORD และ SECRET_KEY
docker compose up --build
```

| URL | คำอธิบาย |
|---|---|
| http://localhost | หน้าเว็บ |
| http://localhost/api/docs | Swagger UI |

**สร้าง Admin** — สมัครสมาชิกปกติ แล้วเพิ่มสิทธิ์ผ่าน psql:
```bash
psql -h 127.0.0.1 -U escrow -d escrow \
  -c "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"
```

### พัฒนาแบบ hot-reload

```bash
# Terminal 1 — DB + Backend (reload อัตโนมัติเมื่อแก้ไฟล์ .py)
docker compose up db backend

# Terminal 2 — Frontend (Vite HMR)
cd frontend && npm run dev
```

### รัน Tests

```bash
cd backend
docker compose up db -d
TEST_DATABASE_URL=postgresql://escrow:escrow@localhost:5432/escrow_test pytest tests/
```

Test cases สำคัญ:
- `test_accept_twice_race_condition` — กด Accept พร้อมกัน 2 request สำเร็จแค่ 1 อัน
- `test_pay_idempotency` — ส่ง payment ซ้ำถูก reject ระดับ DB
- `test_wallet_reconciliation` — ยอดเงินต้องเท่ากับผลรวม transaction เสมอ

### สิ่งที่ใช้ Mock

| ส่วนงาน | Mock ไว้อย่างไร |
|---|---|
| ตรวจสลิป | `POST /mock/slip-verify` — 90% VERIFIED หรือกำหนด `force_result` สำหรับ test |
| โอนเงินจริง | Admin export CSV แล้วโอนเอง |
| บัญชี escrow | ค่าคงที่จาก env config |
| Email / LINE Notify | บันทึกแถวลง DB เท่านั้น |
| รูปสลิป | เก็บเป็น URL string ไม่มี file upload จริง |

### โครงสร้างโปรเจค

```
escrow-marketplace/
├── backend/
│   ├── app/
│   │   ├── routers/        # Route handlers บาง (auth, deals, wallet, admin, mock)
│   │   ├── services/       # Business logic (deal_service, wallet_service, ...)
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── dependencies.py # get_db, get_current_user, require_admin, require_user
│   │   ├── config.py       # pydantic-settings (อ่านจาก .env)
│   │   └── security.py     # bcrypt + JWT
│   ├── alembic/            # Database migrations
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/            # Axios wrappers พร้อม TypeScript types
│       ├── components/     # Header, DealStatusBadge, CountdownTimer, Pagination
│       ├── context/        # AuthContext (JWT ใน localStorage)
│       ├── hooks/          # useDealPolling (polling 5 วินาที + manual refetch)
│       └── pages/          # หนึ่งไฟล์ต่อหนึ่งหน้า
├── nginx/
│   └── nginx.conf          # /api/* → backend, /* → frontend
└── docker-compose.yml
```
