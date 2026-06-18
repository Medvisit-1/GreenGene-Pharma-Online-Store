import { NextResponse } from "next/server";
import { getShippingConfig } from "@/lib/settings";

// Public: lets the client cart/checkout display the current shipping rules.
// The checkout API always recomputes shipping server-side, so this is display-only.
export async function GET() {
  const config = await getShippingConfig();
  return NextResponse.json(config);
}
