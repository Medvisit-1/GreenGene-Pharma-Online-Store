import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REF_COOKIE, lookupReferral } from "@/lib/rewards";

export const dynamic = "force-dynamic";

// GET /api/referral          → the referral this browser arrived with (from the link)
// GET /api/referral?code=X   → check a code typed at checkout
export async function GET(req: Request) {
  const typed = new URL(req.url).searchParams.get("code");
  const code = typed ?? (await cookies()).get(REF_COOKIE)?.value;
  const ref = await lookupReferral(code);
  return NextResponse.json(ref ? { valid: true, ...ref } : { valid: false }, {
    headers: { "Cache-Control": "no-store" },
  });
}
