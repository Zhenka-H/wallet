import { describe, expect, it } from "vitest";
import { WalletApiError } from "./api";
import { walletErrorMessage } from "./errors";

describe("walletErrorMessage", () => {
  it("reads WalletApiError message", () => {
    const err = new WalletApiError("Insufficient funds.", 400);
    expect(walletErrorMessage(err)).toBe("Insufficient funds.");
  });

  it("falls back using status when WalletApiError message is empty", () => {
    expect(walletErrorMessage(new WalletApiError("", 404))).toBe(
      "Account not found."
    );
    expect(walletErrorMessage(new WalletApiError("", 422))).toBe(
      "This transfer could not be completed."
    );
  });

  it("reads generic Error", () => {
    expect(walletErrorMessage(new Error("oops"))).toBe("oops");
  });

  it("stringifies unknown values", () => {
    expect(walletErrorMessage("plain")).toBe("plain");
    expect(walletErrorMessage(404)).toBe("Something went wrong.");
  });
});
