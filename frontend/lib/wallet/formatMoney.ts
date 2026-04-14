import { isCredit, parseSignedAmount } from "./parseAmount";

export function formatLedgerLine(amount: string, currency: string): {
  text: string;
  variant: "credit" | "debit";
} {
  const n = parseSignedAmount(amount);
  const credit = isCredit(amount);
  const abs = Math.abs(n);
  const code = currency.trim() === "" ? "USD" : currency.trim();
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: code,
  }).format(abs);
  const sign = credit ? "+" : "−";
  return {
    text: `${sign}${formatted}`,
    variant: credit ? "credit" : "debit",
  };
}
