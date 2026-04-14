import { NextResponse } from "next/server";
import {
  createMockAccount,
  getMockAccounts,
} from "@/lib/wallet/mock-store";

export async function GET() {
  return NextResponse.json(getMockAccounts());
}

export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 128) {
    return NextResponse.json(
      { message: "Name must be 1–128 characters." },
      { status: 400 }
    );
  }
  const account = createMockAccount(name);
  return NextResponse.json({ account }, { status: 201 });
}
