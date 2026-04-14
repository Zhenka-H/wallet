import {
  WALLET_API_BASE_URL,
  WALLET_USE_DIRECT_BACKEND,
} from "./config";

/**
 * Wallet REST client. See `lib/wallet/config.ts` and your `.env` file.
 */
const API_BASE = WALLET_API_BASE_URL;
const DIRECT = WALLET_USE_DIRECT_BACKEND;

const DEFAULT_CURRENCY = "USD";

/**
 * Nest `Response.returnData` wraps payloads as `{ data, metadata, status, message }`.
 * Next.js mock routes return the payload directly.
 */
function unwrapResponseData<T>(raw: unknown): T {
  if (
    raw !== null &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    "data" in raw
  ) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

function normalizeAccountRow(row: unknown): Account | null {
  if (row === null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = o.id;
  const name = o.name;
  if (typeof id !== "string" || typeof name !== "string") return null;
  const currency =
    typeof o.currency === "string" && o.currency ? o.currency : DEFAULT_CURRENCY;
  return { id, name, currency };
}

function mapLedgerRowToTransaction(
  row: unknown,
  fallbackCurrency: string
): Transaction | null {
  if (row === null || typeof row !== "object") return null;
  const o = row as Record<string, unknown>;
  const id = o.id;
  const accountRaw = o.accountId ?? o.account_id;
  if (typeof id !== "string" || typeof accountRaw !== "string") return null;

  let amountStr: string;
  if (typeof o.amount === "number" && Number.isFinite(o.amount)) {
    amountStr = String(o.amount);
  } else if (typeof o.amount === "string") {
    amountStr = o.amount;
  } else {
    amountStr = "0";
  }

  const ts = o.timestamp ?? o.created_at ?? o.createdAt;
  let created_at: string;
  if (ts instanceof Date) {
    created_at = ts.toISOString();
  } else if (typeof ts === "string") {
    created_at = ts;
  } else {
    created_at = "";
  }

  return {
    id,
    account_id: accountRaw,
    amount: amountStr,
    currency:
      typeof o.currency === "string" && o.currency ? o.currency : fallbackCurrency,
    status: typeof o.status === "string" ? o.status : "posted",
    created_at,
    description:
      typeof o.description === "string" ? o.description : undefined,
  };
}

function messageFromErrorBody(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) return data.trim();
  if (typeof data !== "object" || data === null) return fallback;

  const o = data as Record<string, unknown>;

  if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
  if (typeof o.error === "string" && o.error.trim()) return o.error.trim();

  if (typeof o.detail === "string" && o.detail.trim()) return o.detail.trim();
  if (Array.isArray(o.detail) && o.detail.length > 0) {
    const first = o.detail[0];
    if (typeof first === "string") return first;
    if (
      typeof first === "object" &&
      first !== null &&
      "msg" in first &&
      typeof (first as { msg: unknown }).msg === "string"
    ) {
      return (first as { msg: string }).msg;
    }
  }

  return fallback;
}

export class WalletApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "WalletApiError";
  }
}

async function walletFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const text = await res.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const fallback = res.statusText || "Request failed";
    throw new WalletApiError(
      messageFromErrorBody(data, fallback),
      res.status,
      data
    );
  }

  return data as T;
}

export type Account = {
  id: string;
  name: string;
  currency: string;
};

export type Balance = {
  account_id: string;
  currency: string;
  available: string;
  pending?: string;
};

export type Transaction = {
  id: string;
  account_id: string;
  amount: string;
  currency: string;
  status: string;
  created_at: string;
  description?: string;
};

export type TransferPayload = {
  from_account_id: string;
  to_account_id: string;
  amount: string;
  currency: string;
  memo?: string;
};

export type TransferRequestBody = TransferPayload & {
  transaction_id: string;
};

export type TransferResult = {
  transaction_id: string;
  status: string;
};

export type CreateAccountInput = {
  name: string;
};

/**
 * Creates an account. Returns the new account when the mock API includes it in the
 * response; the Nest API currently returns only `{ isSuccess: true }`, so this is
 * `undefined` there until the list is refetched.
 */
export async function createAccount(
  input: CreateAccountInput
): Promise<Account | undefined> {
  const name = input.name.trim();
  if (!name) {
    throw new WalletApiError("Name is required.", 400);
  }
  if (name.length > 128) {
    throw new WalletApiError("Name must be at most 128 characters.", 400);
  }

  const path = DIRECT ? "/accounts" : "/api/wallet/accounts";
  const raw = await walletFetch<unknown>(path, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  if (DIRECT) {
    const inner = unwrapResponseData<unknown>(raw);
    const row =
      inner && typeof inner === "object" && "id" in inner ? inner : undefined;
    return normalizeAccountRow(row) ?? undefined;
  }

  if (
    raw !== null &&
    typeof raw === "object" &&
    "account" in raw &&
    (raw as { account: unknown }).account
  ) {
    return normalizeAccountRow((raw as { account: unknown }).account) ?? undefined;
  }

  return undefined;
}

export async function fetchAccounts(): Promise<Account[]> {
  const path = DIRECT ? "/accounts" : "/api/wallet/accounts";
  const raw = await walletFetch<unknown>(path);
  const inner = DIRECT ? unwrapResponseData<unknown>(raw) : raw;
  const list = Array.isArray(inner) ? inner : [];
  const mapped = list
    .map(normalizeAccountRow)
    .filter((a): a is Account => a !== null);
  return mapped;
}

export async function fetchBalance(accountId: string): Promise<Balance> {
  const id = encodeURIComponent(accountId);
  const path = DIRECT
    ? `/accounts/${id}/balance`
    : `/api/wallet/accounts/${id}/balance`;
  const raw = await walletFetch<unknown>(path);
  const inner = DIRECT ? unwrapResponseData<unknown>(raw) : raw;

  if (
    inner !== null &&
    typeof inner === "object" &&
    "balance" in inner &&
    typeof (inner as { balance: unknown }).balance === "number"
  ) {
    const b = (inner as { balance: number }).balance;
    return {
      account_id: accountId,
      currency: DEFAULT_CURRENCY,
      available: String(b),
    };
  }

  return inner as Balance;
}

export async function fetchTransactions(
  accountId: string,
  options?: { limit?: number; cursor?: string }
): Promise<{ items: Transaction[]; next_cursor?: string }> {
  const params = new URLSearchParams();
  if (options?.limit != null) params.set("limit", String(options.limit));
  if (options?.cursor) params.set("cursor", options.cursor);
  const q = params.toString();
  const id = encodeURIComponent(accountId);
  const base = DIRECT
    ? `/accounts/${id}/transactions`
    : `/api/wallet/accounts/${id}/transactions`;
  const path = `${base}${q ? `?${q}` : ""}`;
  const raw = await walletFetch<unknown>(path);
  const inner = DIRECT ? unwrapResponseData<unknown>(raw) : raw;

  if (
    inner !== null &&
    typeof inner === "object" &&
    "items" in inner &&
    Array.isArray((inner as { items: unknown }).items)
  ) {
    return inner as { items: Transaction[]; next_cursor?: string };
  }

  const rows = Array.isArray(inner) ? inner : [];
  const items = rows
    .map((row) => mapLedgerRowToTransaction(row, DEFAULT_CURRENCY))
    .filter((t): t is Transaction => t !== null);

  return { items };
}

export async function submitTransfer(
  body: TransferRequestBody
): Promise<TransferResult> {
  const path = DIRECT ? "/transfers" : "/api/wallet/transfers";

  if (DIRECT) {
    const amount = Number.parseFloat(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new WalletApiError("Amount must be a positive number.", 400);
    }
    const raw = await walletFetch<unknown>(path, {
      method: "POST",
      body: JSON.stringify({
        transactionId: body.transaction_id,
        fromAcId: body.from_account_id,
        toAcId: body.to_account_id,
        amount,
      }),
    });
    const r = raw as { isSuccess?: boolean; transactionId?: string };
    if (typeof r.transactionId === "string") {
      return {
        transaction_id: r.transactionId,
        status: r.isSuccess ? "completed" : "pending",
      };
    }
    throw new WalletApiError("Unexpected transfer response.", 500, raw);
  }

  return walletFetch<TransferResult>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
