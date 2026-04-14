import { NextResponse } from "next/server";
import { applyMockTransfer } from "@/lib/wallet/mock-store";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    from_account_id?: string;
    to_account_id?: string;
    amount?: string;
    currency?: string;
    transaction_id?: string;
  };

  const from_account_id = body.from_account_id ?? "";
  const to_account_id = body.to_account_id ?? "";
  const amount = body.amount ?? "";
  const currency = body.currency ?? "USD";
  const transaction_id = body.transaction_id ?? "";

  if (!from_account_id || !to_account_id || !amount || !transaction_id) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 }
    );
  }

  if (from_account_id === to_account_id) {
    return NextResponse.json(
      { message: "Cannot transfer to the same account." },
      { status: 400 }
    );
  }

  const result = applyMockTransfer({
    from_account_id,
    to_account_id,
    amount,
    currency,
    transaction_id,
  });

  if (!result.ok) {
    const status =
      result.message === "Insufficient funds."
        ? 422
        : result.message === "Account not found."
          ? 404
          : 400;
    return NextResponse.json({ message: result.message }, { status });
  }

  return NextResponse.json({
    transaction_id,
    status: "completed",
  });
}
