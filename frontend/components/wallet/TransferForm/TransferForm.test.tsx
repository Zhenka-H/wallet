import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TransferForm } from "./TransferForm";
import { WalletApiError } from "@/lib/wallet/api";

describe("TransferForm", () => {
  const defaultProps = {
    fromAccountId: "acc_123",
    currency: "USD",
    accounts: [],
    onSubmit: vi.fn(),
    loading: false,
    error: null,
  };

  it("disables the transfer button while a transaction is pending", () => {
    render(<TransferForm {...defaultProps} loading={true} />);
    
    const button = screen.getByRole("button", { name: /sending…/i });
    expect(button).toBeDisabled();
  });

  it("displays error messages from the API", () => {
    const apiError = new WalletApiError("Insufficient Funds", 422);
    render(<TransferForm {...defaultProps} error={apiError} />);
    
    expect(screen.getByText("Insufficient Funds")).toBeInTheDocument();
  });
});
