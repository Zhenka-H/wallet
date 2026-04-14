import { WalletApiError } from "./api";

export function walletErrorMessage(error: unknown): string {
  if (error instanceof WalletApiError) {
    const msg = error.message.trim();
    if (msg) return msg;
    if (error.status === 404) return "Account not found.";
    if (error.status === 422) return "This transfer could not be completed.";
    return "Request failed.";
  }
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong.";
}
