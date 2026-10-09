import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { REF_COOKIE } from "@/lib/rewards";

export const dynamic = "force-dynamic";

// Refer-a-friend link: remember who referred this visitor for 30 days, then
// send them to the shop. The referral is credited when their first order is paid.
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
  const res = NextResponse.redirect(new URL("/?ref=1", req.url));
  try {
    const exists = clean && (await prisma.customer.findUnique({ where: { referralCode: clean }, select: { id: true } }));
    if (exists) {
      res.cookies.set(REF_COOKIE, clean, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 30 * 86400,
      });
    }
  } catch {
    // DB hiccup: still send them to the shop
  }
  return res;
}
