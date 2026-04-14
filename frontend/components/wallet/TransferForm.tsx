"use client";

import { useState, type FormEvent } from "react";
import type { Account } from "@/lib/wallet/api";
import { walletErrorMessage } from "@/lib/wallet/errors";

export type TransferFormProps = {
  fromAccountId: string;
  currency: string;
  accounts: Account[];
  onSubmit: (input: { toAccountId: string; amount: string }) => unknown;
  loading: boolean;
  error: unknown | null;
  disabled?: boolean;
};

export function TransferForm({
  fromAccountId,
  currency,
  accounts,
  onSubmit,
  loading,
  error,
  disabled,

}: TransferFormProps) {
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = (e: FormEvent): undefined => {
    e.preventDefault();
    if (loading || disabled || !fromAccountId) return undefined;
    setAmount("")
    onSubmit({ toAccountId: toAccountId.trim(), amount: amount.trim() });
    return undefined;
  };

  const submitBlocked =
    loading || disabled || !fromAccountId || !toAccountId.trim() || !amount.trim();

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        Transfer
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor="recipient-id"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Recipient account ID
          </label>
          <select
            id="recipient-id"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            disabled={loading || disabled || !fromAccountId}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-200 focus:border-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800 dark:focus:border-zinc-500"
          >
            <option value="" disabled>
              Select recipient…
            </option>
            {accounts
              .filter((acc) => acc.id !== fromAccountId)
              .map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.id})
                </option>
              ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="amount"
            className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
          >
            Amount ({currency})
          </label>
          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading || disabled || !fromAccountId}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm tabular-nums text-zinc-900 outline-none ring-zinc-200 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800 dark:focus:border-zinc-500"
          />
        </div>
      </div>

      {error ? (
        <div
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
          role="alert"
        >
          {walletErrorMessage(error)}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitBlocked}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {loading ? "Sending…" : "Send transfer"}
      </button>
    </form>
  );
}
