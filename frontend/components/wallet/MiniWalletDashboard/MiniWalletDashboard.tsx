"use client";

import { useMemo, useState } from "react";
import type { Account } from "@/lib/wallet/api";
import { useWallet } from "@/hooks/useWallet";
import { AccountSelector } from "@/components/wallet/AccountSelector";
import { BalanceDisplay } from "@/components/wallet/BalanceDisplay";
import { CreateAccountForm } from "@/components/wallet/CreateAccountForm";
import { TransferForm } from "@/components/wallet/TransferForm";
import { TransactionList } from "@/components/wallet/TransactionList";
import styles from "./MiniWalletDashboard.module.css";

const NO_ACCOUNTS: Account[] = [];

export function MiniWalletDashboard() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);

  const wallet = useWallet({
    accountId: selectedId,
    transactionsLimit: 25,
  });

  const accounts = Array.isArray(wallet.accounts)
    ? wallet.accounts
    : NO_ACCOUNTS;

  const displayAccountId =
    selectedId ?? wallet.resolvedAccountId ?? "";

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === displayAccountId),
    [accounts, displayAccountId]
  );

  const currency = selectedAccount?.currency ?? "USD";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          Mini Wallet
        </h1>
        <p className={styles.subtitle}>
          Accounts, balance, transfers, and recent ledger entries.
        </p>
      </header>

      <div className={styles.content}>
        <CreateAccountForm
          createAccount={wallet.createAccountAsync}
          loading={wallet.createAccountLoading}
          error={wallet.createAccountError}
          resetError={wallet.resetCreateAccount}
          onCreated={(id): undefined => {
            setSelectedId(id);
            return undefined;
          }}
        />

        <AccountSelector
          accounts={accounts}
          value={displayAccountId}
          onChange={(id): undefined => {
            setSelectedId(id);
            return undefined;
          }}
          loading={wallet.accountsLoading}
          error={wallet.accountsError}
        />

        <BalanceDisplay
          balance={wallet.balance}
          loading={Boolean(displayAccountId) && wallet.balanceLoading}
          error={wallet.balanceError}
          isRefreshing={
            Boolean(displayAccountId) &&
            wallet.isFetchingBalance &&
            !wallet.balanceLoading
          }
        />

        <TransferForm
          fromAccountId={displayAccountId}
          currency={currency}
          accounts={accounts}
          onSubmit={({ toAccountId, amount }) => {
            return wallet.transferAsync({
              from_account_id: displayAccountId,
              to_account_id: toAccountId,
              amount,
              currency,
            });
          }}
          loading={wallet.transferLoading}
          error={wallet.transferError}
          disabled={!displayAccountId}
        />

        <TransactionList
          transactions={wallet.transactions}
          loading={Boolean(displayAccountId) && wallet.transactionsLoading}
          error={wallet.transactionsError}
          isRefreshing={
            Boolean(displayAccountId) &&
            wallet.isFetchingTransactions &&
            !wallet.transactionsLoading
          }
        />
      </div>
    </div>
  );
}
