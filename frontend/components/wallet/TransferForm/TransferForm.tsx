"use client";

import { useState, type FormEvent } from "react";
import type { Account } from "@/lib/wallet/api";
import { walletErrorMessage } from "@/lib/wallet/errors";
import styles from "./TransferForm.module.css";

export type TransferFormProps = {
  fromAccountId: string;
  currency: string;
  accounts: Account[];
  onSubmit: (input: { toAccountId: string; amount: string }) => Promise<unknown>;
  loading: boolean;
  error: unknown | null;
  resetError?: () => undefined;
  disabled?: boolean;
};

export function TransferForm({
  fromAccountId,
  currency,
  accounts,
  onSubmit,
  loading,
  error,
  resetError,
  disabled,
}: TransferFormProps) {
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;
    inputValue = inputValue.replace(",", ".");

    if (inputValue === "") {
      setAmount("");
      return;
    }

    if (inputValue.startsWith(".")) {
      inputValue = "0" + inputValue;
    }

    const isValidAmount = /^\d+(\.\d{0,2})?$/.test(inputValue);

    if (isValidAmount) {
      setAmount(inputValue);

      if (error) {
        resetError?.();
      }
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (
      loading ||
      disabled ||
      !fromAccountId ||
      !toAccountId.trim() ||
      !amount.trim()
    ) {
      return;
    }

    resetError?.();

    try {
      const cleanAmount = amount.trim().replace(",", ".");

      await onSubmit({
        toAccountId: toAccountId.trim(),
        amount: cleanAmount,
      });

      setToAccountId("");
      setAmount("");
    } catch (err) {
      console.log(err)
    }
  };

  const submitBlocked =
    loading ||
    disabled ||
    !fromAccountId ||
    !toAccountId.trim() ||
    !amount.trim();

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <h2 className={styles.title}>Transfer</h2>

      <div className={styles.grid}>
        <div className={styles.fullWidthField}>
          <label htmlFor="recipient-id" className={styles.label}>
            Recipient account ID
          </label>

          <select
            id="recipient-id"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            disabled={loading || disabled || !fromAccountId}
            className={styles.select}
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

        <div className={styles.field}>
          <label htmlFor="amount" className={styles.label}>
            Amount ({currency})
          </label>

          <input
            id="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
            disabled={loading || disabled || !fromAccountId}
            className={styles.input}
          />
        </div>
      </div>

      {error ? (
        <div className={styles.errorContainer} role="alert">
          {walletErrorMessage(error)}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitBlocked}
        className={styles.submitButton}
      >
        {loading ? "Sending…" : "Send transfer"}
      </button>
    </form>
  );
}