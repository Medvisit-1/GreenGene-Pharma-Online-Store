import { NextResponse } from "next/server";
import { getEnabledMethods } from "@/lib/payments";

// Always reflect the admin's current gateway toggles — never serve a cached list.
export const dynamic = "force-dynamic";

// Public: lets the checkout UI render the available payment options.
export async function GET() {
  return NextResponse.json(
    { methods: await getEnabledMethods() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
