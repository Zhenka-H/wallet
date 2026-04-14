import { beforeEach, describe, expect, it } from "vitest";
import {
  applyMockTransfer,
  createMockAccount,
  getMockAccounts,
  getMockBalance,
  resetMockStore,
} from "./mock-store";

describe("applyMockTransfer", () => {
  beforeEach(() => {
    resetMockStore();
  });

  it("moves balance between known accounts", () => {
    const beforeFrom = getMockBalance("acc_checking")?.available;
    const beforeTo = getMockBalance("acc_savings")?.available;
    expect(beforeFrom).toBeDefined();
    expect(beforeTo).toBeDefined();

    const result = applyMockTransfer({
      from_account_id: "acc_checking",
      to_account_id: "acc_savings",
      amount: "100.00",
      currency: "USD",
      transaction_id: "test-tx-1",
    });
    expect(result).toEqual({ ok: true });

    const afterFrom = Number.parseFloat(getMockBalance("acc_checking")!.available);
    const afterTo = Number.parseFloat(getMockBalance("acc_savings")!.available);
    expect(afterFrom).toBe(Number.parseFloat(beforeFrom!) - 100);
    expect(afterTo).toBe(Number.parseFloat(beforeTo!) + 100);
  });

  it("is idempotent for the same transaction_id", () => {
    const input = {
      from_account_id: "acc_checking",
      to_account_id: "acc_savings",
      amount: "10.00",
      currency: "USD",
      transaction_id: "idem-1",
    };
    expect(applyMockTransfer(input)).toEqual({ ok: true });
    const balanceAfterFirst = getMockBalance("acc_checking")?.available;

    expect(applyMockTransfer(input)).toEqual({ ok: true });
    expect(getMockBalance("acc_checking")?.available).toBe(balanceAfterFirst);
  });

  it("createMockAccount adds an account with zero balance", () => {
    resetMockStore();
    const before = getMockAccounts().length;
    const a = createMockAccount("Rainy day");
    expect(getMockAccounts().length).toBe(before + 1);
    expect(a.name).toBe("Rainy day");
    expect(a.currency).toBe("USD");
    expect(getMockBalance(a.id)?.available).toBe("0.00");
  });

  it("rejects invalid amount", () => {
    const result = applyMockTransfer({
      from_account_id: "acc_checking",
      to_account_id: "acc_savings",
      amount: "-5",
      currency: "USD",
      transaction_id: "bad-amt",
    });
    expect(result).toEqual({
      ok: false,
      message: "Amount must be a positive number.",
    });
  });
});
