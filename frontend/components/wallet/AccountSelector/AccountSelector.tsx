import type { Account } from "@/lib/wallet/api";
import { walletErrorMessage } from "@/lib/wallet/errors";
import styles from "./AccountSelector.module.css";

export type AccountSelectorProps = {
  accounts: Account[];
  value: string;
  onChange: (accountId: string) => undefined;
  loading: boolean;
  error: unknown | null;
  label?: string;
};

export function AccountSelector({
  accounts,
  value,
  onChange,
  loading,
  error,
  label = "Account",
}: AccountSelectorProps) {
  return (
    <div className={styles.container}>
      <label
        htmlFor="wallet-account"
        className={styles.label}
      >
        {label}
      </label>
      <div className={styles.selectWrapper}>
        <select
          id="wallet-account"
          className={styles.select}
          value={value}
          onChange={(e): undefined => {
            onChange(e.target.value);
            return undefined;
          }}
          disabled={loading || accounts.length === 0}
        >
          {accounts.length === 0 ? (
            <option value="">No accounts</option>
          ) : (
            <>
              <option value="" disabled>
                Select an account
              </option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.currency}
                </option>
              ))}
            </>
          )}
        </select>
        <span
          className={styles.chevron}
          aria-hidden
        >
          ▾
        </span>
      </div>
      {error ? (
        <p className={styles.errorMessage} role="alert">
          {walletErrorMessage(error)}
        </p>
      ) : null}
    </div>
  );
}
