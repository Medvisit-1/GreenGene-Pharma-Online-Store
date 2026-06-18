import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Verify the Yoco webhook signature (Standard Webhooks / Svix scheme):
 * signed content = `${webhook-id}.${webhook-timestamp}.${rawBody}`,
 * HMAC-SHA256 with the base64 secret after the "whsec_" prefix, base64-encoded.
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

/** Fetch the payment from Yoco to confirm its status and map it to our order. */
async function fetchPayment(paymentId: string) {
  const key = process.env.YOCO_SECRET_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://api.yoco.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verify(req, raw)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const eventType = String(event.event_type ?? event.type ?? "");
  const paymentId = String(event.payment_id ?? "");

  // Only act on payment events; confirm with Yoco before trusting anything.
  if (paymentId && /payment/i.test(eventType)) {
    const payment = await fetchPayment(paymentId);
    const status = String(payment?.status ?? "").toLowerCase();
    const orderNumber =
      payment?.external_id ??
      payment?.metadata?.orderNumber ??
      payment?.metadata?.order_number;

    console.log(
      `[yoco webhook] event=${eventType} payment=${paymentId} status=${status} order=${orderNumber}`
    );

    if (orderNumber && status === "approved") {
      await prisma.order.updateMany({
        where: { orderNumber: String(orderNumber) },
        data: { paymentStatus: "paid", status: "processing", paymentRef: paymentId },
      });
    }
  }

  return NextResponse.json({ received: true });
}
