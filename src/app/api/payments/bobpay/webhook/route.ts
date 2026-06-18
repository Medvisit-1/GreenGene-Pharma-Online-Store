import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Bob Pay posts payment status here (notify_url). We verify the MD5 signature
 * using the account passphrase, then mark the order paid.
 * Docs: signature = md5( key=value&… joined + "&passphrase=<passphrase>" ).
 */
function verifySignature(d: Record<string, unknown>): boolean {
  const passphrase = process.env.BOBPAY_PASSPHRASE;
  if (!passphrase) return true; // not configured (dev) — accept
  if (!d.signature) return false;

  const enc = (v: unknown) => encodeURIComponent(String(v ?? ""));
  const amount = typeof d.amount === "number" ? d.amount.toFixed(2) : String(d.amount);
  const pairs = [
    `recipient_account_code=${enc(d.recipient_account_code)}`,
    `custom_payment_id=${enc(d.custom_payment_id)}`,
    `email=${enc(d.email)}`,
    `mobile_number=${enc(d.mobile_number)}`,
    `amount=${amount}`,
    `item_name=${enc(d.item_name)}`,
    `item_description=${enc(d.item_description)}`,
    `notify_url=${enc(d.notify_url)}`,
    `success_url=${enc(d.success_url)}`,
    `pending_url=${enc(d.pending_url)}`,
    `cancel_url=${enc(d.cancel_url)}`,
  ];
  const signatureString = `${pairs.join("&")}&passphrase=${passphrase}`;
  const calc = crypto.createHash("md5").update(signatureString).digest("hex");
  return calc === d.signature;
}

export async function POST(req: Request) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  if (!verifySignature(data)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const orderNumber = String(data.custom_payment_id ?? "");
  const status = String(data.status ?? "").toLowerCase();
  const paymentStatus =
    typeof data.payment === "object" && data.payment
      ? String((data.payment as Record<string, unknown>).status ?? "").toLowerCase()
      : "";

  const isPaid = status === "paid" || paymentStatus === "complete";

  if (orderNumber && isPaid) {
    await prisma.order.updateMany({
      where: { orderNumber },
      data: {
        paymentStatus: "paid",
        status: "processing",
        paymentRef: String(data.short_reference ?? data.uuid ?? data.id ?? ""),
      },
    });
  }

  return NextResponse.json({ received: true });
}
