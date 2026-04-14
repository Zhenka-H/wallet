import type { Balance } from "@/lib/wallet/api";
import { walletErrorMessage } from "@/lib/wallet/errors";
import styles from "./BalanceDisplay.module.css";

export type BalanceDisplayProps = {
  balance: Balance | undefined;
  loading: boolean;
  error: unknown | null;
  isRefreshing?: boolean;
};

function formatAvailable(amount: string, currency: string) {
  const n = Number.parseFloat(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "USD",
  }).format(n);
}

export function BalanceDisplay({
  balance,
  loading,
  error,
  isRefreshing,
}: BalanceDisplayProps) {
  const showSkeleton = loading && !balance;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <p className={styles.label}>
            Available balance
          </p>
          {showSkeleton ? (
            <div
              className={styles.skeleton}
              aria-hidden
            />
          ) : error && !balance ? (
            <p className={styles.errorMessage} role="alert">
              {walletErrorMessage(error)}
            </p>
          ) : balance ? (
            <p className={styles.balance}>
              {formatAvailable(balance.available, balance.currency)}
            </p>
          ) : (
            <p className={styles.placeholder}>Select an account to view balance.</p>
          )}
          {balance?.pending && Number.parseFloat(balance.pending) !== 0 ? (
            <p className={styles.pending}>
              Pending:{" "}
              <span className={styles.pendingAmount}>
                {formatAvailable(balance.pending, balance.currency)}
              </span>
            </p>
          ) : null}
        </div>
        {isRefreshing && balance ? (
          <span
            className={styles.refreshBadge}
            aria-live="polite"
          >
            Updating…
          </span>
        ) : null}
      </div>
    </div>
  );
}
