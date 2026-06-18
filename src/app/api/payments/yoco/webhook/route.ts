import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Yoco sends webhook events here when a payment completes.
 * Signature scheme is svix-style (id.timestamp.body, HMAC-SHA256 with the
 * base64 secret after the "whsec_" prefix).
 */
function verify(req: Request, raw: string): boolean {
  const secret = process.env.YOCO_WEBHOOK_SECRET;
  if (!secret) return true; // not configured (dev) — accept

  const id = req.headers.get("webhook-id");
  const ts = req.headers.get("webhook-timestamp");
  const sigHeader = req.headers.get("webhook-signature");
  if (!id || !ts || !sigHeader) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const signed = `${id}.${ts}.${raw}`;
  const expected = crypto.createHmac("sha256", key).update(signed).digest("base64");
  // header looks like "v1,<sig> v1,<sig2>"
  return sigHeader.split(" ").some((part) => part.split(",")[1] === expected);
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verify(req, raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const type: string = event?.type ?? "";
  // metadata may be nested under payload depending on event shape
  const orderNumber =
    event?.payload?.metadata?.orderNumber ?? event?.metadata?.orderNumber;

  if (/succeeded/i.test(type) && orderNumber) {
    await prisma.order.updateMany({
      where: { orderNumber },
      data: { paymentStatus: "paid", status: "processing", paymentRef: event?.payload?.id ?? null },
    });
  }

  return NextResponse.json({ received: true });
}
