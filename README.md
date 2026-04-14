# Mini Wallet System

A production-grade, full-stack financial application implementing a robust **Double-Entry Ledger Architecture**. This project is designed for high consistency, transactional integrity, and absolute data accuracy in financial transfers.

## 🏛️ System Design & Architecture

### Ledger-Based Accounting
Unlike simplistic wallet implementations that store a `balance` column in the users' table, this system utilizes a **double-entry ledger**. 

- **Single Source of Truth**: The "balance" is never a static value; it is dynamically derived by aggregating the history of all transactions.
- **Auditability**: Every movement of funds is recorded as a pair of debit and credit entries, providing an immutable audit trail.
- **Data Integrity**: Using a ledger prevents the "stale data" or "phantom balance" issues common in systems that use simple increments/decrements.

### Critical Constraints & Hardening

- **Atomicity (ACID Compliance)**: All transfers are wrapped in database transactions. Both the debit (withdrawal) and credit (deposit) must succeed together, or the entire operation is rolled back.
- **Idempotency**: Every transfer request requires a client-side generated UUID (`transactionId`). The system enforces a unique constraint on this ID within the ledger, preventing duplicate charges even if the request is retried due to network issues.
- **Strict Consistency**: During transfers, the system implements **Pessimistic Write Locking** on the participating account records. This ensures that no two concurrent transfers can manipulate the same account balance simultaneously, eliminating race conditions.
- **Decimal Arithmetic**: All monetary values are processed using `decimal.js` to avoid floating-point inaccuracies inherent in standard binary arithmetic.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Logic**: Strict Ledger Architecture, Pessimistic Locking

### Frontend
- **Framework**: Next.js 16 (React 19)
- **State Management**: React Query (TanStack Query)
- **Styling**: Vanilla CSS + Tailwind for layout
- **Testing**: Vitest + React Testing Library

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+)

### 1. Backend Setup
```bash
cd backend
npm install
```

**Environment Configuration:**
Create a `.env` file in the `backend` directory:
```env
PG_DATABASE_HOST=localhost
PG_PORT=5432
PG_USERNAME=postgres
PG_PASSWORD=your_password
PG_DATABASE=wallet
```

**Run Migrations:**
```bash
npm run migration:up
```

**Start the Service:**
```bash
npm run start:local
```
The API will be available at `http://localhost:3000`.

### 2. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
The UI will be available at `http://localhost:4000` (or the port specified in `scripts/next-with-port.mjs`).

---

## 📖 API Documentation

### Transfers
`POST /transfers`
Executes a fund transfer with strict idempotency.

**Request Body:**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "fromAcId": "uuid-sender",
  "toAcId": "uuid-recipient",
  "amount": 150.00
}
```

**Response (Success):**
```json
{
  "isSuccess": true,
  "transactionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Accounts & Balances
- `GET /accounts`: List all registered accounts.
- `GET /accounts/:id/balance`: Fetch current derived balance.
- `GET /accounts/:id/transactions`: Fetch full history for an account.

---

## 🧪 Testing

### Frontend Tests
Executed using Vitest and React Testing Library:
```bash
cd frontend
npm test
```
- Verifies UI states (pending buttons, error displays).
- Verifies ledger highlighting (Debit vs. Credit colors).

---

## 📜 License
MIT
