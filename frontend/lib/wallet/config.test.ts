import { describe, expect, it } from "vitest";
import { resolveWalletApiBaseUrl } from "./config";

describe("resolveWalletApiBaseUrl", () => {
  it("strips trailing slash", () => {
    expect(resolveWalletApiBaseUrl("http://localhost:4000/")).toBe(
      "http://localhost:4000"
    );
  });

  it("returns empty for undefined or blank", () => {
    expect(resolveWalletApiBaseUrl(undefined)).toBe("");
    expect(resolveWalletApiBaseUrl("")).toBe("");
    expect(resolveWalletApiBaseUrl("   ")).toBe("");
  });
});
