"use client";

import { useState, type FormEvent } from "react";
import { walletErrorMessage } from "@/lib/wallet/errors";
import type { Account } from "@/lib/wallet/api";
import styles from "./CreateAccountForm.module.css";

export type CreateAccountFormProps = {
  createAccount: (name: string) => Promise<Account | undefined>;
  loading: boolean;
  error: unknown | null;
  resetError: () => undefined;
  /** Called with the new account id when the API returns the created row (mock). */
  onCreated?: (accountId: string) => undefined;
};

export function CreateAccountForm({
  createAccount,
  loading,
  error,
  resetError,
  onCreated,
}: CreateAccountFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    const trimmed = name.trim();
    if (loading || !trimmed) return;
    resetError();
    try {
      const created = await createAccount(trimmed);
      setName("");
      if (created?.id) {
        onCreated?.(created.id);
      }
    } catch {
      /* mutation error surfaced via `error` prop */
    }
  };

  const submitBlocked = loading || !name.trim();

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      className={styles.container}
    >
      <h2 className={styles.title}>
        New account
      </h2>

      <div className={styles.field}>
        <label
          htmlFor="new-account-name"
          className={styles.label}
        >
          Account name
        </label>
        <input
          id="new-account-name"
          type="text"
          autoComplete="off"
          maxLength={128}
          placeholder="e.g. Vacation fund"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) resetError();
          }}
          disabled={loading}
          className={styles.input}
        />
      </div>

      {error ? (
        <div
          className={styles.errorContainer}
          role="alert"
        >
          {walletErrorMessage(error)}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitBlocked}
        className={styles.submitButton}
      >
        {loading ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
