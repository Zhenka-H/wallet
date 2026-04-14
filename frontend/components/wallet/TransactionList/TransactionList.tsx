import type { Transaction } from "@/lib/wallet/api";
import { formatLedgerLine } from "@/lib/wallet/formatMoney";
import { walletErrorMessage } from "@/lib/wallet/errors";
import styles from "./TransactionList.module.css";

export type TransactionListProps = {
  transactions: Transaction[] | undefined;
  loading: boolean;
  error: unknown | null;
  /** Shown when data is revalidating after a mutation (keeps list visible). */
  isRefreshing?: boolean;
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function TransactionList({
  transactions,
  loading,
  error,
  isRefreshing,
}: TransactionListProps) {
  const showSkeleton = loading && (!transactions || transactions.length === 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Recent activity
        </h2>
        {isRefreshing && transactions?.length ? (
          <span
            className={styles.refreshBadge}
            aria-live="polite"
          >
            Updating…
          </span>
        ) : null}
      </div>

      {error ? (
        <p className={styles.errorMessage} role="alert">
          {walletErrorMessage(error)}
        </p>
      ) : null}

      {showSkeleton ? (
        <ul className={styles.skeletonList}>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className={styles.skeletonItem}>
              <div className={styles.skeletonBarLarge} />
              <div className={styles.skeletonBarSmall} />
            </li>
          ))}
        </ul>
      ) : !transactions?.length ? (
        <p className={styles.emptyState}>
          No transactions yet.
        </p>
      ) : (
        <ul className={styles.list}>
          {transactions.map((tx) => {
            const { text, variant } = formatLedgerLine(tx.amount, tx.currency);
            return (
              <li
                key={tx.id}
                className={styles.item}
              >
                <div className="min-w-0 flex-1">
                  <p className={styles.itemDescription}>
                    {tx.description ?? "Ledger entry"}
                  </p>
                  <p className={styles.itemMeta}>
                    {formatWhen(tx.created_at)}
                    {tx.status ? (
                      <span className={styles.statusBadge}>
                        {tx.status}
                      </span>
                    ) : null}
                  </p>
                </div>
                <p
                  className={`${styles.amount} ${
                    variant === "credit" ? styles.amountCredit : styles.amountDebit
                  }`}
                >
                  {text}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
