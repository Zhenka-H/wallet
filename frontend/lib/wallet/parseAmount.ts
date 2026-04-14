/**
 * Ledger amounts use a signed string convention: negative = debit, positive = credit.
 */
export function parseSignedAmount(amount: string): number {
  const n = Number.parseFloat(amount.trim());
  return Number.isFinite(n) ? n : 0;
}

export function isCredit(amount: string): boolean {
  return parseSignedAmount(amount) > 0;
}
