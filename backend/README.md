# Mini Wallet System

A robust, production-grade financial ledger system built with **NestJS** and **TypeORM**. This system implements a double-entry accounting architecture to ensure transactional integrity, atomicity, and strict idempotency for all financial transfers.

## 🚀 Features

- **Double-Entry Ledger**: Every transaction is recorded as balanced debit and credit entries, ensuring the "books" always balance.
- **Atomic Transfers**: Uses database transactions to ensure that both sides of a transfer succeed or fail together.
- **Race Condition Protection**: Implements `pESSIMISTIC_WRITE` row-level locking on accounts during transfers to prevent balance discrepancies in high-concurrency environments.
- **Idempotency**: All transfer requests require a unique `transactionId` (UUID) to prevent duplicate processing of the same request.
- **Dynamic Balance Calculation**: Balances are calculated in real-time by aggregating ledger entries, eliminating the risk of "stale" balance fields in the accounts table.
- **Automated Testing**: 100% logic coverage with strictly typed Jest unit tests.

---

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Testing**: Jest
- **Language**: TypeScript (Strict mode)

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)
- npm or yarn

### 1. Clone the repository
```bash
git clone <repository-url>
cd wallet
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Configuration
Create a `.env` file in the `backend` directory (refer to `src/config/ormconfig.ts` for expected variables):
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=wallet_db
```

### 4. Run Migrations
```bash
npm run migration:run
```

---

## 🏃 Running the Project

### Backend
```bash
npm run start:dev
```
The server will start at `http://localhost:3000`.

### Frontend
```bash
cd ../frontend
# Note: Frontend implementation is currently a placeholder
npm install
npm run dev
```

### Running Tests
```bash
npm run test
```

---

## 📖 API Documentation

### Accounts

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/accounts` | Create a new user account. |
| `GET` | `/accounts/:id` | Fetch account details. |
| `GET` | `/accounts/:id/balance` | Get dynamically calculated balance. |
| `GET` | `/accounts/:id/transactions` | Fetch full ledger history for an account. |

### Transfers

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/transfers` | Execute a transfer between two accounts. |

**Request Body Example (`POST /transfers`):**
```json
{
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "fromAcId": "uuid-1",
  "toAcId": "uuid-2",
  "amount": 150.00
}
```

---

## 🏛️ Design Decisions

1.  **Double-Entry over Simple Balance**: Instead of simply updating a `balance` column, we record every movement in a `ledger_entries` table. This provides a full audit trail and makes the system much harder to corrupt.
2.  **Pessimistic Locking**: In financial systems, consistency is more important than raw throughput. We chose `pessimistic_write` locks to ensure that no two transfers can manipulate the same account balance simultaneously.
3.  **Client-Side Idempotency Keys**: We require the client to provide a `transactionId`. This allows the client to safely retry a request (e.g., after a network timeout) without fear of charging the user twice.
4.  **Global Exception Interception**: A custom `GlobalExceptionFilter` was built to map low-level database errors (like Postgres unique constraint violations) into meaningful HTTP responses (409 Conflict), keeping the API clean.

---

## ⚖️ Trade-offs

-   **Performance vs. Consistency**: By using row-level locking and real-time SUM queries for balances, we traded off some read/write performance for absolute data accuracy. For a massive scale, read-model caching (e.g., Redis) would be added.
-   **UUIDs vs. Integers**: We use UUIDs for all primary keys. This makes horizontal scaling (sharding) easier but increases storage space slightly and makes index browsing a bit slower than sequential IDs.
-   **Simplified Frontend**: The current focus was on building a "bulletproof" backend logic, resulting in a minimal frontend implementation for this iteration.

---

## 📜 License
MIT
