"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { schedulePromise } from "@/lib/promise";
import {
  createAccount,
  fetchAccounts,
  fetchBalance,
  fetchTransactions,
  submitTransfer,
  type Account,
  type Balance,
  type Transaction,
  type TransferPayload,
  type TransferResult,
} from "@/lib/wallet/api";

export const walletKeys = {
  all: ["wallet"] as const,
  accounts: () => [...walletKeys.all, "accounts"] as const,
  balance: (accountId: string) =>
    [...walletKeys.all, "balance", accountId] as const,
  transactions: (accountId: string, limit?: number) =>
    [...walletKeys.all, "transactions", accountId, limit ?? "default"] as const,
};

export type UseWalletOptions = {
  /**
   * Focus balance and transactions on this account. When omitted, the first
   * account returned from the list is used once accounts are loaded.
   */
  accountId?: string;
  /** Page size for transaction history (default 50). */
  transactionsLimit?: number;
};

export type UseWalletResult = {
  // Accounts
  accounts: Account[] | undefined;
  accountsLoading: boolean;
  accountsError: unknown | null;
  isFetchingAccounts: boolean;
  refetchAccounts: () => undefined;

  // Balance (scoped to accountId)
  balance: Balance | undefined;
  balanceLoading: boolean;
  balanceError: unknown | null;
  isFetchingBalance: boolean;
  refetchBalance: () => undefined;

  // Transactions
  transactions: Transaction[] | undefined;
  transactionsLoading: boolean;
  transactionsError: unknown | null;
  isFetchingTransactions: boolean;
  refetchTransactions: () => undefined;

  // Transfer
  transfer: (payload: TransferPayload) => undefined;
  transferAsync: (payload: TransferPayload) => Promise<TransferResult>;
  transferLoading: boolean;
  transferError: unknown | null;
  transferData: TransferResult | undefined;
  resetTransfer: () => undefined;

  // Create account
  createAccount: (name: string) => undefined;
  createAccountAsync: (name: string) => Promise<Account | undefined>;
  createAccountLoading: boolean;
  createAccountError: unknown | null;
  resetCreateAccount: () => undefined;

  /** Account id used for balance and transaction queries (explicit or first listed). */
  resolvedAccountId: string | undefined;
};

/**
 * Wallet data and mutations with loading/error states.
 * Each transfer submit sends a fresh client-generated `transaction_id` (UUID)
 * for idempotency on the wire.
 */
export function useWallet(options: UseWalletOptions = {}): UseWalletResult {
  const { accountId, transactionsLimit = 50 } = options;
  const queryClient = useQueryClient();

  const accountsQuery = useQuery({
    queryKey: walletKeys.accounts(),
    queryFn: fetchAccounts,
  });

  const accounts = accountsQuery.data;
  const resolvedAccountId = useMemo(() => {
    if (accountId && accounts?.some((a) => a.id === accountId)) {
      return accountId;
    }
    return accounts?.[0]?.id;
  }, [accountId, accounts]);

  const balanceQuery = useQuery({
    queryKey: walletKeys.balance(resolvedAccountId ?? ""),
    queryFn: () => fetchBalance(resolvedAccountId!),
    enabled: Boolean(resolvedAccountId),
  });

  const transactionsQuery = useQuery({
    queryKey: walletKeys.transactions(resolvedAccountId ?? "", transactionsLimit),
    queryFn: () =>
      fetchTransactions(resolvedAccountId!, { limit: transactionsLimit }),
    enabled: Boolean(resolvedAccountId),
  });

  const createAccountMutation = useMutation({
    mutationFn: (name: string) => createAccount({ name }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: walletKeys.accounts() });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async (payload: TransferPayload) => {
      const transaction_id = crypto.randomUUID();
      return submitTransfer({ ...payload, transaction_id });
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: walletKeys.accounts() }),
        queryClient.invalidateQueries({
          queryKey: walletKeys.balance(variables.from_account_id),
        }),
        queryClient.invalidateQueries({
          queryKey: walletKeys.balance(variables.to_account_id),
        }),
        queryClient.invalidateQueries({
          queryKey: [...walletKeys.all, "transactions", variables.from_account_id],
        }),
        queryClient.invalidateQueries({
          queryKey: [...walletKeys.all, "transactions", variables.to_account_id],
        }),
      ]);
    },
  });

  return {
    accounts: accountsQuery.data,
    accountsLoading: accountsQuery.isLoading,
    accountsError: accountsQuery.error ?? null,
    isFetchingAccounts: accountsQuery.isFetching,
    refetchAccounts: (): undefined =>
      schedulePromise(accountsQuery.refetch()),

    balance: balanceQuery.data,
    balanceLoading: balanceQuery.isLoading,
    balanceError: balanceQuery.error ?? null,
    isFetchingBalance: balanceQuery.isFetching,
    refetchBalance: (): undefined =>
      schedulePromise(balanceQuery.refetch()),

    transactions: transactionsQuery.data?.items,
    transactionsLoading: transactionsQuery.isLoading,
    transactionsError: transactionsQuery.error ?? null,
    isFetchingTransactions: transactionsQuery.isFetching,
    refetchTransactions: (): undefined =>
      schedulePromise(transactionsQuery.refetch()),

    transfer: (payload: TransferPayload): undefined => {
      transferMutation.mutate(payload);
      return undefined;
    },
    transferAsync: transferMutation.mutateAsync,
    transferLoading: transferMutation.isPending,
    transferError: transferMutation.error ?? null,
    transferData: transferMutation.data,
    resetTransfer: (): undefined => {
      transferMutation.reset();
      return undefined;
    },

    createAccount: (name: string): undefined => {
      createAccountMutation.mutate(name);
      return undefined;
    },
    createAccountAsync: createAccountMutation.mutateAsync,
    createAccountLoading: createAccountMutation.isPending,
    createAccountError: createAccountMutation.error ?? null,
    resetCreateAccount: (): undefined => {
      createAccountMutation.reset();
      return undefined;
    },

    resolvedAccountId,
  };
}

/** Alias for `useWallet` — same hook, alternate name for data-fetching clarity. */
export const useWalletData = useWallet;
