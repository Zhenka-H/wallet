import { describe, expect, it } from "vitest";
import { isCredit, parseSignedAmount } from "./parseAmount";

describe("parseSignedAmount", () => {
  it("parses positive and negative decimals", () => {
    expect(parseSignedAmount("1200.00")).toBe(1200);
    expect(parseSignedAmount("-45.20")).toBe(-45.2);
    expect(parseSignedAmount("  3.5  ")).toBe(3.5);
  });

  it("returns 0 for invalid input", () => {
    expect(parseSignedAmount("not-a-number")).toBe(0);
  });
});

describe("isCredit", () => {
  it("is true only for strictly positive amounts", () => {
    expect(isCredit("10")).toBe(true);
    expect(isCredit("0")).toBe(false);
    expect(isCredit("-1")).toBe(false);
  });
});
