import { NextResponse } from "next/server";
import { evaluateDiscount } from "@/lib/orders";

// GET /api/promo?code=WELCOME10&subtotal=12999
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") ?? "";
  const subtotal = parseInt(searchParams.get("subtotal") ?? "0", 10) || 0;
  const result = await evaluateDiscount(code, subtotal);
  return NextResponse.json(result);
}
