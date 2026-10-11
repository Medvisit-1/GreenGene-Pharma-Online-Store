import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { runScheduledJobs } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

/**
 * Run the timed jobs now. For an external cron service, or to test.
 * Requires the CRON_SECRET env var, sent as "Authorization: Bearer <secret>".
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const ok =
    !!secret &&
    given.length === secret.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(secret));
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await runScheduledJobs());
}
