import { NextResponse } from "next/server";

// Public, harmless deployment marker: open /api/version in a browser to see
// which build the live site is running. Update BUILD_TAG when useful.
const BUILD_TAG = "2026-09-23-bobgo-v2";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { build: BUILD_TAG },
    { headers: { "Cache-Control": "no-store" } }
  );
}
