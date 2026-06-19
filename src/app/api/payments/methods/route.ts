import { NextResponse } from "next/server";
import { getEnabledMethods } from "@/lib/payments";

// Public: lets the checkout UI render the available payment options.
export async function GET() {
  return NextResponse.json({ methods: await getEnabledMethods() });
}
