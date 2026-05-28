# Portfolio Project Brief — Escrow Marketplace (หลัก) + Ticketing (สำรอง)

> เอกสารนี้สรุปจากงานจริงบน Fastwork Jobboard (หมวด "พัฒนาเว็บไซต์") เพื่อใช้เป็น requirement
> ในการสร้างโปรเจคพอร์ต ตั้งใจให้ feed เข้า Claude Code ต่อได้เลย
>
> **ผู้ทำ:** Jirayut — Junior Full-Stack (Backend-focused)
> **Stack ที่จะใช้:** FastAPI + PostgreSQL + React (Vite) + TailwindCSS, Docker, deploy AWS/Render + Vercel
> **เป้าหมายของโปรเจค:** เติมช่องว่างพอร์ต = ระบบที่มี auth + ธุรกรรม (transaction) + state machine + ความสัมพันธ์หลายเอนทิตี (ของเดิม 2 ตัวเป็น read-only dashboard)

---

## โปรเจคหลัก: Escrow Marketplace + Wallet

### ที่มา (brief ดิบจากผู้ว่าจ้าง)
งบที่เขาตั้ง ฿3,000 / ส่งใน 14 วัน / เขาขอเป็น No-Code/Low-Code (Bubble, FlutterFlow, Glide) + Airtable/Sheets เพื่อประหยัด

> **หมายเหตุการปรับ:** เราจะ **เขียนเองด้วย FastAPI + PostgreSQL + React** แทน low-code
> เพื่อให้เป็นพอร์ตที่โชว์สกิล backend ได้จริง (งบ/เครื่องมือที่เขาระบุไม่เกี่ยวกับเราเพราะเราทำเพื่อพอร์ต ไม่ได้รับงาน)

### เป้าหมายระบบ
Web Application (Mobile First) ทำหน้าที่เป็น **ตัวกลางพักเงิน (escrow)** ระหว่างผู้ซื้อและผู้ขาย
เงินจะถูกพักไว้จนกว่าผู้ซื้อยืนยันรับของ แล้วจึงปล่อยเข้า Wallet ผู้ขาย

### ฟังก์ชันหลัก (MVP)
1. **สร้างห้องดีล** — ผู้ขายสร้างห้อง → ระบบสร้าง Unique Link → ส่งให้ผู้ซื้อ
2. **ล็อกดีลอัตโนมัติ** — เมื่อผู้ซื้อกด "รับดีล" ห้องล็อกทันที และเริ่มนับถอยหลัง 15–30 นาที (ตั้งค่าได้)
3. **ชำระเงิน (ขาเข้า)** — ผู้ซื้ออัปโหลดสลิป → ระบบเรียก Slip Verify เช็คยอดเข้าบัญชี (PromptPay) → เปลี่ยนสถานะเป็น `PAID` อัตโนมัติ
4. **Wallet ผู้ขาย** — เมื่อผู้ซื้อกดยืนยันรับของ (`DONE`) ระบบหักค่าธรรมเนียม (GP %) แล้วเพิ่มยอดเข้า Wallet ผู้ขาย
5. **ถอนเงิน** — ผู้ขายกดแจ้งถอนจาก Wallet → เข้าคิวรอโอน (`WITHDRAW_QUEUED`)
6. **หลังบ้าน (Admin):**
   - แจ้งเตือนทุกสถานะ (รับดีล / เงินเข้า / ส่งของ / แจ้งถอน) — ผ่าน LINE Notify หรือ webhook
   - Dashboard ดูประวัติซื้อขาย + ยอดเงินรวมในระบบ
   - **Export คิวถอนเงินเป็น Excel/CSV** ตามฟอร์แมต Bulk Transfer ของธนาคาร (เช่น K-Biz, SCB Business) เพื่ออัปโหลดโอนทีละหลายบัญชีในคลิกเดียว

### ⚠️ สิ่งที่ต้อง MOCK (อย่าต่อของจริง)
- **Slip Verify API**: ทำเป็น mock endpoint ที่จำลองผล (เช่น สุ่ม/กำหนดเองว่า PAID หรือ FAILED) — ห้ามใช้ credential ธนาคารจริง
- **การโอนเงินจริง / Bulk Transfer**: แค่ generate ไฟล์ CSV ให้ตรง format ตัวอย่างของธนาคาร ไม่ต้องเชื่อมระบบโอนจริง
- Wallet เป็น "ยอดจำลอง" ในระบบ ไม่ใช่เงินจริง

### State Machine (หัวใจของโปรเจค — จุดที่ควรโชว์)
```
CREATED            ผู้ขายสร้างห้อง รอผู้ซื้อ
   │ (ผู้ซื้อกดรับดีล)
   ▼
LOCKED             ล็อกห้อง + เริ่ม countdown 15–30 นาที
   │ ├─ (หมดเวลา ไม่จ่าย) ──▶ EXPIRED
   │ (ผู้ซื้ออัปสลิป + verify ผ่าน)
   ▼
PAID               เงินเข้า escrow แล้ว รอผู้ขายส่งของ
   │ (ผู้ขายกดส่งของ - optional state SHIPPED)
   │ (ผู้ซื้อกดยืนยันรับของ)
   ▼
DONE               หักค่าธรรมเนียม GP → เครดิตเข้า Wallet ผู้ขาย
   │ (ผู้ขายแจ้งถอน)
   ▼
WITHDRAW_QUEUED    อยู่ในคิวรอ admin โอน
   │ (admin export + mark โอนแล้ว)
   ▼
PAID_OUT
```
> ทุก transition ต้องเป็น atomic + กัน race condition (โดยเฉพาะตอน LOCKED และตอนเครดิต Wallet)
> ใช้ DB transaction / row-level lock และตรวจ state ปัจจุบันก่อนเปลี่ยนเสมอ

### โครง Data Model (เริ่มต้น)
- **users** — id, role (buyer/seller/admin), email, password_hash, created_at
- **wallets** — id, user_id (FK seller), balance, updated_at
- **deals** — id, seller_id, buyer_id (nullable จนกว่ารับดีล), title, amount, gp_fee_percent, status (enum ข้างบน), unique_token, locked_at, expires_at, created_at
- **payments** — id, deal_id, slip_image_url, verify_status, verified_amount, verified_at
- **wallet_transactions** — id, wallet_id, deal_id, type (CREDIT/DEBIT/WITHDRAW), amount, balance_after, created_at
- **withdrawals** — id, wallet_id, amount, status (QUEUED/PAID_OUT), bank_account, requested_at, paid_out_at
- **notifications** — id, deal_id, event_type, sent_at (log การยิง LINE)

### โครง API (เริ่มต้น)
```
POST   /auth/register
POST   /auth/login
GET    /me

POST   /deals                      สร้างห้องดีล (seller)
GET    /deals/{token}              ดูห้องผ่าน unique link (public)
POST   /deals/{token}/accept       ผู้ซื้อกดรับดีล → LOCKED + countdown
POST   /deals/{id}/pay             อัปสลิป → เรียก mock verify → PAID
POST   /deals/{id}/confirm         ผู้ซื้อยืนยันรับของ → DONE + เครดิต wallet
POST   /deals/{id}/cancel          ยกเลิก / handle EXPIRED

GET    /wallet                     ยอดคงเหลือ + ประวัติ (seller)
POST   /wallet/withdraw            แจ้งถอน → WITHDRAW_QUEUED

# Admin
GET    /admin/deals                dashboard รายการดีลทั้งหมด
GET    /admin/stats                ยอดรวมในระบบ
GET    /admin/withdrawals/export   export CSV ฟอร์แมต bulk transfer
POST   /admin/withdrawals/{id}/payout  mark โอนแล้ว → PAID_OUT

POST   /mock/slip-verify           mock endpoint จำลองผลตรวจสลิป
```

### จุดที่ควรเน้นเล่าในพอร์ต / interview
- ความถูกต้องของเงิน (money integrity): ยอด wallet ต้อง reconcile กับ wallet_transactions เสมอ
- การกัน race condition ตอนล็อกดีลและตอนเครดิต wallet
- countdown/expiry ที่ทำงานแม้ผู้ใช้ปิดหน้าจอ (ใช้ scheduler — คุณมีประสบการณ์ APScheduler อยู่แล้ว)
- การออกแบบ idempotency ของ verify (กดซ้ำไม่ทำให้เครดิตซ้ำ)

---

## โปรเจคสำรอง: Concert Ticketing System

### ที่มา (brief ดิบ)
งบ ฿50,000 / สัญญารายเดือน-รายปี / brief ผู้ว่าจ้างสั้นมาก เขียนแค่:
1. ขอคนมีประสบการณ์เขียนโปรแกรม
2. ถ้าผลงานใช้ได้จริง จ้างรายปี คุยราคาได้
3. ดูแลระบบหลังบ้าน + อัปเดตโปรแกรมได้ตลอด

### Feature set ที่แท้จริง (สังเคราะห์จากข้อเสนอของฟรีแลนซ์ 12 คนที่ไปแย่งงานนี้)
- เลือกรอบ / โซน / ที่นั่ง
- Payment Gateway หลายช่องทาง (PromptPay QR, บัตรเครดิต, mobile banking) — *พอร์ตให้ mock*
- E-Ticket QR Code ส่งทาง Email + LINE, scan เข้างานได้
- ระบบสมาชิก: สะสมแต้ม, ส่วนลด, ประวัติซื้อบัตร
- Ticket Inventory: จำกัดจำนวน, countdown, sold out แบบ realtime
- Admin Dashboard: ยอดขาย, check-in หน้างาน, export รายงาน
- Notification ก่อนงาน / แจ้งเปลี่ยนแปลง
- Refund / โอนบัตร

### จุดยากที่เป็น "ของอวด" (backend)
- **Seat locking / Soft-hold + timeout** — จองที่นั่งชั่วคราวระหว่างจ่ายเงิน กันคนอื่นแย่ง แล้วปล่อยถ้าจ่ายไม่ทัน
- **กันขายเกิน (overselling)** ตอนคนแย่งซื้อพร้อมกันช่วง peak — ต้องใช้ locking / atomic decrement ที่ถูกต้อง
- **Scalable backend** รองรับ concurrent request สูง

> ต่อยอดได้ดีจากประสบการณ์ "เรียก external API พร้อมกัน" ใน Crypto Arbitrage Scanner
> เก็บไว้เป็นโปรเจคตัวถัดไปถ้าอยากโชว์ concurrency เต็มรูปแบบ

---

## สรุปคำแนะนำ
เริ่มที่ **Escrow Marketplace** ก่อน — brief ครบ ไม่ต้องเดา scope, เป็น state machine + money integrity ที่ตรงสาย backend,
มี concurrency flavor (ล็อกดีล + countdown) ให้โชว์โดยไม่ต้องสเกลใหญ่, และต่อยอดจากพื้น escrow/DeFi ที่มีอยู่
จำส่วนที่ต้อง mock ไว้เสมอ (slip verify / bank transfer = จำลอง ไม่ใช่ของจริง)
