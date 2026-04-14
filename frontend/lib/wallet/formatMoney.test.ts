import { describe, expect, it } from "vitest";
import { formatLedgerLine } from "./formatMoney";

describe("formatLedgerLine", () => {
  it("marks credits and debits", () => {
    const credit = formatLedgerLine("42.50", "USD");
    expect(credit.variant).toBe("credit");
    expect(credit.text).toMatch(/^\+/);

    const debit = formatLedgerLine("-10", "USD");
    expect(debit.variant).toBe("debit");
    expect(debit.text).toMatch(/^−/);
  });

  it("defaults empty currency to USD", () => {
    const line = formatLedgerLine("5", "");
    expect(line.text).toContain("5");
  });
});
