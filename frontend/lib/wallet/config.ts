/**
 * Public env: set in `.env` or `.env.local` (Next.js loads both at build/runtime).
 *
 * - **Empty / unset**: requests use the same origin as the browser (Next.js App Router
 *   handlers under `/api/wallet/*`).
 * - **Set**: full origin of an external wallet API, e.g. `http://localhost:4000`
 *   (no trailing slash). Use `NEXT_PUBLIC_WALLET_API_URL` so the value is available
 *   to client-side `fetch` in the browser.
 *
 * When a base URL is set, paths follow your backend: `GET /accounts`,
 * `POST /accounts`, `GET /accounts/:id/balance`, `GET /accounts/:id/transactions`,
 * and `POST /transfers`.
 */
export function resolveWalletApiBaseUrl(
  value: string | undefined
): string {
  if (value === undefined || value.trim() === "") {
    return "";
  }
  return value.replace(/\/$/, "");
}

function readWalletApiBaseUrlFromEnv(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_WALLET_API_URL ??
    process.env.NEXT_WALLET_API_BASE_URL
  );
}

/** Resolved from `process.env` at module load (see `resolveWalletApiBaseUrl`). */
export const WALLET_API_BASE_URL: string = resolveWalletApiBaseUrl(
  readWalletApiBaseUrlFromEnv()
);

/** When true, `api.ts` calls the external REST paths; otherwise Next.js `/api/wallet/*`. */
export const WALLET_USE_DIRECT_BACKEND: boolean = WALLET_API_BASE_URL.length > 0;
