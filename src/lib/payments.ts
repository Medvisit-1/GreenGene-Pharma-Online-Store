import "server-only";
import type { Order } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PaymentMethodInfo = {
  id: string;
  label: string;
  description: string;
  /** redirect = send customer to a hosted gateway; manual = show instructions */
  kind: "redirect" | "manual";
};

export type InitiateResult =
  | { kind: "redirect"; url: string }
  | { kind: "manual"; message: string }
  | { kind: "error"; message: string };

function appUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

/** Card payment gateways shown at checkout. The customer picks one. */
export function getEnabledMethods(): PaymentMethodInfo[] {
  return [
    {
      id: "yoco",
      label: "Yoco",
      description: "Pay securely by credit or debit card via Yoco.",
      kind: "redirect",
    },
    {
      id: "bobpay",
      label: "Bob Pay",
      description: "Pay securely by card via Bob Pay.",
      kind: "redirect",
    },
  ];
}

/** Begin payment for an order with the chosen method. */
export async function initiatePayment(
  method: string,
  order: Order
): Promise<InitiateResult> {
  switch (method) {
    case "yoco":
      return initiateYoco(order);
    case "bobpay":
      return initiateBobPay(order);
    default:
      return { kind: "error", message: "Unknown payment method." };
  }
}

/* ---------------- Yoco (Online Checkout API) ---------------- */
async function initiateYoco(order: Order): Promise<InitiateResult> {
  const key = process.env.YOCO_SECRET_KEY;
  if (!key) return { kind: "error", message: "Yoco is not configured." };

  try {
    const res = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: order.total, // already in cents
        currency: "ZAR",
        successUrl: `${appUrl()}/orders/${order.orderNumber}?paid=1`,
        cancelUrl: `${appUrl()}/checkout?cancelled=1`,
        failureUrl: `${appUrl()}/orders/${order.orderNumber}?failed=1`,
        // externalId + metadata let us map the webhook/payment back to this order
        externalId: order.orderNumber,
        metadata: { orderNumber: order.orderNumber },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.redirectUrl) {
      return { kind: "error", message: data?.message ?? "Could not start Yoco payment." };
    }
    // Store the Yoco checkout id so we can confirm payment status later.
    if (data.id) {
      await prisma.order.update({ where: { id: order.id }, data: { paymentRef: data.id } }).catch(() => {});
    }
    return { kind: "redirect", url: data.redirectUrl };
  } catch {
    return { kind: "error", message: "Could not reach Yoco. Please try again." };
  }
}

/**
 * Confirm a Yoco payment by polling the checkout status with the secret key
 * (works without webhooks/OAuth). Marks the order paid if completed.
 */
export async function confirmYocoPayment(order: Order): Promise<boolean> {
  const key = process.env.YOCO_SECRET_KEY;
  if (!key || !order.paymentRef) return false;
  try {
    const res = await fetch(`https://payments.yoco.com/api/checkouts/${order.paymentRef}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Only mark paid when Yoco confirms BOTH a completed status AND the exact
    // amount + currency for this order — never based on the redirect alone.
    const completed = String(data.status).toLowerCase() === "completed";
    const amountOk = Number(data.amount) === order.total;
    const currencyOk = String(data.currency).toUpperCase() === "ZAR";
    if (completed && amountOk && currencyOk) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "paid", paymentRef: data.paymentId ?? order.paymentRef },
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* ---------------- Bob Pay (Payment Links API) ---------------- */
export function bobpayHost() {
  return process.env.BOBPAY_API_HOST || "https://api.sandbox.bobpay.co.za";
}

/** Get a bearer token: use BOBPAY_API_KEY directly, or log in with email/password. */
export async function bobpayToken(): Promise<string | null> {
  if (process.env.BOBPAY_API_KEY) return process.env.BOBPAY_API_KEY;
  const email = process.env.BOBPAY_EMAIL;
  const password = process.env.BOBPAY_PASSWORD;
  if (!email || !password) return null;
  try {
    const res = await fetch(`${bobpayHost()}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return data?.access_token ?? data?.token ?? null;
  } catch {
    return null;
  }
}

async function initiateBobPay(order: Order): Promise<InitiateResult> {
  const token = await bobpayToken();
  if (!token) return { kind: "error", message: "Bob Pay is not configured." };

  const body: Record<string, unknown> = {
    custom_payment_id: order.orderNumber,
    email: order.email,
    phone_number: order.phone || "",
    mobile_number: order.phone || "",
    amount: Number((order.total / 100).toFixed(2)), // ZAR (rands), not cents
    item_name: `Order ${order.orderNumber}`,
    item_description: "GreenGene Pharma order",
    notify_url: `${appUrl()}/api/payments/bobpay/webhook`,
    success_url: `${appUrl()}/orders/${order.orderNumber}?paid=1`,
    pending_url: `${appUrl()}/orders/${order.orderNumber}?paid=1`,
    cancel_url: `${appUrl()}/orders/${order.orderNumber}?failed=1`,
    short_url: false,
  };
  if (process.env.BOBPAY_ACCOUNT_CODE) {
    body.recipient_account_code = process.env.BOBPAY_ACCOUNT_CODE;
  }

  try {
    const res = await fetch(`${bobpayHost()}/payments/intents/link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      return { kind: "error", message: data?.message ?? "Could not start Bob Pay payment." };
    }
    return { kind: "redirect", url: data.url };
  } catch {
    return { kind: "error", message: "Could not reach Bob Pay. Please try again." };
  }
}
