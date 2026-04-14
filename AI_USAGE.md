# AI Usage & Collaborative Development

This project was developed through a collaboration between a human engineer and an AI coding assistant. This document summarizes the AI's prompts and contributions, as well as the critical human validation steps performed.

## 🤖 AI Prompt Summary & Contributions

### Backend Development
The AI was utilized for:
- **Unit & Integration Testing**: Generating comprehensive test suites for ledger logic and API endpoints.
- **Documentation**: Generating the initial project README and technical specifications.
- **Exception Handling**: Implementing a global exception filter to handle database constraints, HTTP exceptions, and internal errors gracefully.

#### Prompt 0: Global Exception Handling
> Act as a senior NestJS engineer. Update the `GlobalExceptionFilter` to handle all possible error scenarios, including:
> - `HttpException` (preserving status and message).
> - TypeORM `QueryFailedError` (mapping PostgreSQL codes like 23505, 23503, etc., to descriptive HTTP states).
> - General runtime `Error` (mapping to 500 Internal Server Error).
>
> Ensure the response format is consistent (statusCode, timestamp, path, message, codeError) and that every error is appropriately logged using the `LoggerService`.

### Frontend Development
The following specific prompts were used to drive the frontend implementation:

#### Prompt 1: API Integration & Idempotency
> Act as a senior frontend engineer. I am building a React/Next.js dashboard for a financial app. Write a custom hook (e.g., useWallet) or utilize React Query/SWR to handle the API calls for: fetching accounts, getting a balance, getting transaction history, and submitting a transfer. 
>
> Ensure the transfer function generates a unique UUID on the client side to send as the transaction_id to ensure idempotency if the user double-clicks the submit button. Include loading and error states for all operations.

#### Prompt 2: UI Component Generation
> Generate functional React components for a Mini Wallet Dashboard using Tailwind CSS for minimal, clean styling.
>
> Include:
> - An Account Selector (dropdown).
> - A Balance Display (handle loading states cleanly).
> - A Transfer Form (inputs for recipient account ID and amount). It must disable the submit button while loading and display API error messages clearly.
> - A Transaction List displaying recent ledger entries, using green for credits and red for debits.
>
> Keep the components modular and separate the UI from the API logic.

#### Prompt 3: Wiring UI to Backend
> Act as a senior frontend engineer. I have already built the static UI components for my financial dashboard (Account Selector, Balance Display, Transfer Form, Transaction List). However, they currently have no connection to the backend.
>
> I need you to wire these components up to my existing REST API.
>
> Endpoints:
> - `GET /accounts/:id/balance`
> - `GET /accounts/:id/transactions`
> - `POST /transfers` (Body requires: from_account_id, to_account_id, amount, and transaction_id)
>
> Requirements:
> - **State Management**: Use React Query/SWR to handle fetching data whenever account_id changes.
> - **Idempotency (CRITICAL)**: Generate a unique UUID on the client side (crypto.randomUUID()) for every transfer.
> - **UI Feedback**: Disable submit button during inflight requests and display backend errors (422, 404) clearly.
> - **Revalidation**: Immediately re-fetch balance and transactions upon successful transfer.

#### Prompt 4: Component Testing
> Create component tests (using React Testing Library) to verify:
> - The transfer button is disabled while a transaction is pending.
> - Error messages from the API (like 'Insufficient Funds') are displayed to the user.
> - The transaction list correctly highlights debits vs. credits.
>
> Please provide the test files and update my package.json with the necessary test scripts.


---

## 👨‍💻 Human Review & Validation

A project of this nature requires rigorous human oversight, particularly around financial logic and concurrency. The following areas were manually reviewed and validated by the user:

### Transaction Logic & Race Conditions
- **Locking Scope**: Validated that the `pessimistic_write` locks in the backend are acquired in a consistent order to prevent deadlocks.
- **Atomic Operations**: Confirmed that the ledger entries and account checks are strictly contained within a single database transaction.

### Idempotency & Frontend Integration
- **Hook Integrity**: Ensured that the React hooks correctly handle and persist the idempotency tokens safely until the request lifecycle is complete.
- **User Feedback**: Manually verified that error states (like "Insufficient Funds") are caught correctly and presented predictably to the end-user.


---

## Conclusion
The AI served as an efficient accelerator for boilerplate, component structure, and test generation, while the human engineer maintained ownership of the security, consistency, and architectural integrity of the financial system.
