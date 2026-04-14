import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TransactionList } from "./TransactionList";
import type { Transaction } from "@/lib/wallet/api";
import styles from "./TransactionList.module.css";

describe("TransactionList", () => {
  const mockTransactions: Transaction[] = [
    {
      id: "tx_1",
      account_id: "acc_1",
      amount: "100.00", // Credit
      currency: "USD",
      status: "posted",
      created_at: "2026-04-12T10:00:00Z",
      description: "Coffee Refund",
    },
    {
      id: "tx_2",
      account_id: "acc_1",
      amount: "-50.00", // Debit
      currency: "USD",
      status: "posted",
      created_at: "2026-04-12T11:00:00Z",
      description: "Grocery Store",
    },
  ];

  const defaultProps = {
    transactions: mockTransactions,
    loading: false,
    error: null,
  };

  it("highlights credit transactions with positive sign and correct color", () => {
    render(<TransactionList {...defaultProps} />);
    
    const creditAmount = screen.getByText(/\+.*100\.00/);
    expect(creditAmount).toBeInTheDocument();
    expect(creditAmount).toHaveClass(styles.amountCredit);
  });

  it("highlights debit transactions with negative sign and correct color", () => {
    render(<TransactionList {...defaultProps} />);
    
    // The minus sign is \u2212 in formatMoney.ts
    const debitAmount = screen.getByText(/−.*50\.00/);
    expect(debitAmount).toBeInTheDocument();
    expect(debitAmount).toHaveClass(styles.amountDebit);
  });
});
