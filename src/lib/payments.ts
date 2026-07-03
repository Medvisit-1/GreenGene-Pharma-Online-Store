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

export type GatewayMeta = PaymentMethodInfo & {
  /** path to a logo under /public, shown at checkout */
  logo?: string;
  /** whether the store has a working integration for this gateway */
  implemented: boolean;
  /** which env var(s) enable it — shown to the admin when not configured */
  envHint: string;
};

/** Every payment gateway the store knows about. Admin toggles which are active. */
export const GATEWAYS: GatewayMeta[] = [
  {
    id: "yoco",
    label: "Yoco",
    description: "Pay securely by credit or debit card via Yoco.",
    kind: "redirect",
    logo: "/payment/yoco.svg",
    implemented: true,
    envHint: "YOCO_SECRET_KEY",
  },
  {
    id: "bobpay",
    label: "Bob Pay",
    description: "Pay securely by card via Bob Pay.",
    kind: "redirect",
    logo: "/payment/bobpay.svg",
    implemented: true,
    envHint: "BOBPAY_API_KEY (or BOBPAY_EMAIL + BOBPAY_PASSWORD)",
  },
  {
    id: "paystack",
    label: "Paystack",
    description: "Pay by card, EFT or mobile money via Paystack.",
    kind: "redirect",
    logo: "/payment/paystack.svg",
    implemented: true,
    envHint: "PAYSTACK_SECRET_KEY",
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "Pay with your PayPal account or a card via PayPal.",
    kind: "redirect",
    logo: "/payment/paypal.svg",
    implemented: false,
    envHint: "PAYPAL_CLIENT_ID + PAYPAL_SECRET",
  },
];

/** Default on/off state before an admin has saved any preference. */
const DEFAULT_ACTIVE: Record<string, boolean> = {
  yoco: true,
  bobpay: true,
  paystack: false,
  paypal: false,
};

/** Whether a gateway has the API credentials it needs to actually run. */
export function gatewayConfigured(id: string): boolean {
  switch (id) {
    case "yoco":
      return !!process.env.YOCO_SECRET_KEY;
    case "bobpay":
      return !!(
        process.env.BOBPAY_API_KEY ||
        (process.env.BOBPAY_EMAIL && process.env.BOBPAY_PASSWORD)
      );
    case "paystack":
      return !!process.env.PAYSTACK_SECRET_KEY;
    case "paypal":
      return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET);
    default:
      return false;
  }
}

/** Read each gateway's active flag from settings (key: `gateway_<id>`). */
async function gatewayActiveMap(): Promise<Record<string, boolean>> {
  const map = { ...DEFAULT_ACTIVE };
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: GATEWAYS.map((g) => `gateway_${g.id}`) } },
    });
    for (const r of rows) map[r.key.replace("gateway_", "")] = r.value === "1";
  } catch {
    // DB unavailable (build prerender) — fall back to defaults
  }
  return map;
}

export type GatewayStatus = GatewayMeta & { active: boolean; configured: boolean };

/** Full status of every gateway, for the admin Payment Gateways page. */
export async function getGatewayStatuses(): Promise<GatewayStatus[]> {
  const active = await gatewayActiveMap();
  return GATEWAYS.map((g) => ({
    ...g,
    active: !!active[g.id],
    configured: gatewayConfigured(g.id),
  }));
}

/** Persist the admin's active/inactive choices. */
export async function saveGatewayStates(active: Record<string, boolean>): Promise<void> {
  await Promise.all(
    GATEWAYS.map((g) =>
      prisma.setting.upsert({
        where: { key: `gateway_${g.id}` },
        create: { key: `gateway_${g.id}`, value: active[g.id] ? "1" : "0" },
        update: { value: active[g.id] ? "1" : "0" },
      })
    )
  );
}

/**
 * Card payment gateways shown at checkout. The customer picks one.
 * Only gateways that are active AND have a working, configured integration appear.
 */
export async function getEnabledMethods(): Promise<PaymentMethodInfo[]> {
  const active = await gatewayActiveMap();
  return GATEWAYS.filter(
    (g) => active[g.id] && g.implemented && gatewayConfigured(g.id)
  ).map(({ id, label, description, kind }) => ({ id, label, description, kind }));
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
    case "paystack":
      return initiatePaystack(order);
    default:
      return { kind: "error", message: "Unknown payment method." };
  }
}

/** Confirm an order's payment with whichever gateway it used. */
export async function confirmPayment(order: Order): Promise<boolean> {
  if (order.paymentStatus === "paid") return true;
  switch (order.paymentMethod) {
    case "yoco":
      return confirmYocoPayment(order);
    case "paystack":
      return confirmPaystackPayment(order);
    default:
      return false;
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
      // Deduct stock + send confirmation (both only run on the paid transition)
      const { finalizePaidOrder } = await import("@/lib/inventory");
      await finalizePaidOrder(order.id);
      const { sendOrderConfirmation } = await import("@/lib/email");
      await sendOrderConfirmation(order.id);
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

/* ---------------- Paystack (Transaction API) ---------------- */
async function initiatePaystack(order: Order): Promise<InitiateResult> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) return { kind: "error", message: "Paystack is not configured." };

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: order.email,
        amount: order.total, // subunit (cents), same as we store
        currency: "ZAR",
        reference: order.orderNumber,
        callback_url: `${appUrl()}/orders/${order.orderNumber}?paid=1`,
        metadata: { orderNumber: order.orderNumber },
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.data?.authorization_url) {
      return { kind: "error", message: data?.message ?? "Could not start Paystack payment." };
    }
    if (data.data.reference) {
      await prisma.order
        .update({ where: { id: order.id }, data: { paymentRef: data.data.reference } })
        .catch(() => {});
    }
    return { kind: "redirect", url: data.data.authorization_url };
  } catch {
    return { kind: "error", message: "Could not reach Paystack. Please try again." };
  }
}

/**
 * Confirm a Paystack payment by verifying the transaction with the secret key.
 * Marks the order paid only when status is success AND amount + currency match.
 */
export async function confirmPaystackPayment(order: Order): Promise<boolean> {
  if (order.paymentStatus === "paid") return true; // already confirmed — don't re-email
  const key = process.env.PAYSTACK_SECRET_KEY;
  const ref = order.paymentRef || order.orderNumber;
  if (!key || !ref) return false;
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`,
      { headers: { Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    const t = data?.data;
    const ok =
      t &&
      String(t.status).toLowerCase() === "success" &&
      Number(t.amount) === order.total &&
      String(t.currency).toUpperCase() === "ZAR";
    if (ok) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: "paid" },
      });
      const { finalizePaidOrder } = await import("@/lib/inventory");
      await finalizePaidOrder(order.id);
      const { sendOrderConfirmation } = await import("@/lib/email");
      await sendOrderConfirmation(order.id);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
