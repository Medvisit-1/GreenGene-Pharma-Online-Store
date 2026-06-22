import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { confirmPaystackPayment } from "@/lib/payments";

export const runtime = "nodejs";

/**
 * Paystack signs each webhook with HMAC-SHA512 of the raw body using your
 * secret key, sent in the `x-paystack-signature` header. On `charge.success`
 * we re-verify the transaction (inside confirmPaystackPayment) before marking
 * the order paid — never trust the webhook body alone.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Paystack not configured" }, { status: 503 });
  }

  const signature = req.headers.get("x-paystack-signature") ?? "";
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (event?.event === "charge.success") {
    const reference = String(event?.data?.reference ?? "");
    if (reference) {
      const order = await prisma.order.findUnique({ where: { orderNumber: reference } });
      if (order && order.paymentStatus !== "paid") {
        await confirmPaystackPayment(order);
      }
      console.log(
        `[paystack webhook] charge.success ref=${reference} order=${order?.id ?? "none"}`
      );
    }
  }

  return NextResponse.json({ received: true });
}
