import { NextResponse } from "next/server";
import {
  getMockAccounts,
  getMockTransactions,
} from "@/lib/wallet/mock-store";

type RouteParams = { params: Promise<{ accountId: string }> };

export async function GET(req: Request, ctx: RouteParams) {
  const { accountId } = await ctx.params;
  const known = getMockAccounts().some((a) => a.id === accountId);
  if (!known) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }

  const url = new URL(req.url);
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw
    ? Math.min(100, Math.max(1, Number.parseInt(limitRaw, 10)))
    : 50;

  const body = getMockTransactions(accountId, limit);
  return NextResponse.json(body);
}
