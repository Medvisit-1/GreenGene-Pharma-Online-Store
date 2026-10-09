import { NextResponse } from "next/server";
import { evaluateDiscount } from "@/lib/orders";
import { getCurrentCustomer } from "@/lib/customer-auth";

// GET /api/promo?code=WELCOME10&subtotal=12999&email=you@example.com
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") ?? "";
  const subtotal = parseInt(searchParams.get("subtotal") ?? "0", 10) || 0;
  // Reward codes are locked to an email: use the one typed at checkout, else the signed-in account.
  const email = searchParams.get("email") || (await getCurrentCustomer())?.email || null;
  const result = await evaluateDiscount(code, subtotal, email);
  return NextResponse.json(result);
}
