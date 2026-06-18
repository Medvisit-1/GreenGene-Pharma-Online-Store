import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { bobpayHost, bobpayToken } from "@/lib/payments";

export const runtime = "nodejs";

/** MD5 signature check (per Bob Pay docs). One accepted verification path. */
function md5Ok(d: Record<string, unknown>): boolean {
  const passphrase = process.env.BOBPAY_PASSPHRASE;
  if (!passphrase || !d.signature) return false;
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
  const calc = crypto
    .createHash("md5")
    .update(`${pairs.join("&")}&passphrase=${passphrase}`)
    .digest("hex");
  return calc === d.signature;
}

/** Confirm authenticity directly with Bob Pay (their recommended validation step). */
async function validatedByBobPay(raw: string): Promise<boolean> {
  const token = await bobpayToken();
  if (!token) return false;
  try {
    const res = await fetch(`${bobpayHost()}/payments/intents/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: raw,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const raw = await req.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const orderNumber = String(data.custom_payment_id ?? "");
  const status = String(data.status ?? "").toLowerCase();
  const payStatus =
    typeof data.payment === "object" && data.payment
      ? String((data.payment as Record<string, unknown>).status ?? "").toLowerCase()
      : "";
  const isPaid = status === "paid" || payStatus === "complete";

  const signatureOk = md5Ok(data);
  const verified = signatureOk || (await validatedByBobPay(raw));

  console.log(
    `[bobpay webhook] order=${orderNumber} status=${status}/${payStatus} md5Ok=${signatureOk} verified=${verified}`
  );

  if (!verified) {
    return NextResponse.json({ error: "Unverified" }, { status: 401 });
  }

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
