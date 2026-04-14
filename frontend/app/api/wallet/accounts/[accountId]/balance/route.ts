import { NextResponse } from "next/server";
import { getMockBalance } from "@/lib/wallet/mock-store";

type RouteParams = { params: Promise<{ accountId: string }> };

export async function GET(_req: Request, ctx: RouteParams) {
  const { accountId } = await ctx.params;
  const balance = getMockBalance(accountId);
  if (!balance) {
    return NextResponse.json({ message: "Account not found." }, { status: 404 });
  }
  return NextResponse.json(balance);
}
