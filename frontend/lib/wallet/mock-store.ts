import type { Account, Balance, Transaction } from "./api";

type Store = {
  accounts: Account[];
  balanceByAccount: Record<string, { available: string; pending?: string }>;
  transactionsByAccount: Record<string, Transaction[]>;
};

const initial: Store = {
  accounts: [
    { id: "acc_checking", name: "Checking", currency: "USD" },
    { id: "acc_savings", name: "Savings", currency: "USD" },
  ],
  balanceByAccount: {
    acc_checking: { available: "1284.52", pending: "0.00" },
    acc_savings: { available: "5020.00" },
  },
  transactionsByAccount: {
    acc_checking: [
      {
        id: "tx_1",
        account_id: "acc_checking",
        amount: "-45.20",
        currency: "USD",
        status: "posted",
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        description: "Coffee & supplies",
      },
      {
        id: "tx_2",
        account_id: "acc_checking",
        amount: "1200.00",
        currency: "USD",
        status: "posted",
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        description: "Payroll deposit",
      },
      {
        id: "tx_3",
        account_id: "acc_checking",
        amount: "-9.99",
        currency: "USD",
        status: "posted",
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        description: "Subscription",
      },
    ],
    acc_savings: [
      {
        id: "tx_s1",
        account_id: "acc_savings",
        amount: "250.00",
        currency: "USD",
        status: "posted",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        description: "Interest credit",
      },
    ],
  },
};

let store: Store = structuredClone(initial);

const processedTransferIds = new Set<string>();

export function getMockAccounts(): Account[] {
  return store.accounts;
}

/** Adds an account with zero balance and empty transaction history (mock API only). */
export function createMockAccount(name: string): Account {
  const trimmed = name.trim();
  const id = `acc_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const account: Account = { id, name: trimmed, currency: "USD" };
  store.accounts.push(account);
  store.balanceByAccount[id] = { available: "0.00", pending: "0.00" };
  store.transactionsByAccount[id] = [];
  return account;
}

export function getMockBalance(accountId: string): Balance | null {
  const row = store.balanceByAccount[accountId];
  if (!row) return null;
  const acc = store.accounts.find((a) => a.id === accountId);
  return {
    account_id: accountId,
    currency: acc?.currency ?? "USD",
    available: row.available,
    pending: row.pending,
  };
}

export function getMockTransactions(
  accountId: string,
  limit: number
): { items: Transaction[]; next_cursor?: string } {
  const items = [...(store.transactionsByAccount[accountId] ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return { items: items.slice(0, limit) };
}

function roundMoney(n: number): string {
  return n.toFixed(2);
}

export function applyMockTransfer(input: {
  from_account_id: string;
  to_account_id: string;
  amount: string;
  currency: string;
  transaction_id: string;
}): { ok: true } | { ok: false; message: string } {
  if (processedTransferIds.has(input.transaction_id)) {
    return { ok: true };
  }

  const amt = Number.parseFloat(input.amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    return { ok: false, message: "Amount must be a positive number." };
  }

  const from = store.balanceByAccount[input.from_account_id];
  const to = store.balanceByAccount[input.to_account_id];
  if (!from || !to) {
    return { ok: false, message: "Account not found." };
  }

  const fromAvail = Number.parseFloat(from.available);
  if (!Number.isFinite(fromAvail) || fromAvail < amt) {
    return { ok: false, message: "Insufficient funds." };
  }

  const toAvail = Number.parseFloat(to.available);

  from.available = roundMoney(fromAvail - amt);
  to.available = roundMoney(toAvail + amt);

  const now = new Date().toISOString();
  const debit: Transaction = {
    id: `${input.transaction_id}_out`,
    account_id: input.from_account_id,
    amount: (-amt).toFixed(2),
    currency: input.currency,
    status: "posted",
    created_at: now,
    description: `Transfer to ${input.to_account_id}`,
  };
  const credit: Transaction = {
    id: `${input.transaction_id}_in`,
    account_id: input.to_account_id,
    amount: amt.toFixed(2),
    currency: input.currency,
    status: "posted",
    created_at: now,
    description: `Transfer from ${input.from_account_id}`,
  };

  if (!store.transactionsByAccount[input.from_account_id]) {
    store.transactionsByAccount[input.from_account_id] = [];
  }
  if (!store.transactionsByAccount[input.to_account_id]) {
    store.transactionsByAccount[input.to_account_id] = [];
  }
  store.transactionsByAccount[input.from_account_id].unshift(debit);
  store.transactionsByAccount[input.to_account_id].unshift(credit);

  processedTransferIds.add(input.transaction_id);
  return { ok: true };
}

export function resetMockStore(): undefined {
  store = structuredClone(initial);
  processedTransferIds.clear();
  return undefined;
}
