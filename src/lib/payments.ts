import "server-only";
import type { Order } from "@prisma/client";

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
        metadata: { orderNumber: order.orderNumber },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.redirectUrl) {
      return { kind: "error", message: data?.message ?? "Could not start Yoco payment." };
    }
    return { kind: "redirect", url: data.redirectUrl };
  } catch {
    return { kind: "error", message: "Could not reach Yoco. Please try again." };
  }
}

/* ---------------- Bob Pay (Payment Links API) ---------------- */
function bobpayHost() {
  return process.env.BOBPAY_API_HOST || "https://api.sandbox.bobpay.co.za";
}

/** Get a bearer token: use BOBPAY_API_KEY directly, or log in with email/password. */
async function bobpayToken(): Promise<string | null> {
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
