import "server-only";
import crypto from "node:crypto";
import type { Order } from "@prisma/client";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { isAuthed } from "@/lib/auth";

/**
 * POPIA: an order number alone must not reveal who ordered what or where it's
 * going. Full order details are shown only to the customer (signed in, or via
 * the private link in their emails / payment redirect) and to admins.
 */
// Same default as APP_URL in lib/email.ts (not imported, to avoid a circular import)
const APP_URL = process.env.APP_URL || "https://greengene-store-production.up.railway.app";

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

export function orderToken(orderNumber: string) {
  return crypto.createHmac("sha256", secret()).update(`order:${orderNumber}`).digest("base64url").slice(0, 24);
}

/** Private link to an order page, e.g. orderUrl("GG-ABC123", "paid=1"). */
export function orderUrl(orderNumber: string, query = "", path = "") {
  return `${APP_URL}/orders/${orderNumber}${path}?t=${orderToken(orderNumber)}${query ? `&${query}` : ""}`;
}

function tokenOk(orderNumber: string, token?: string | null) {
  if (!token) return false;
  const expected = orderToken(orderNumber);
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Can the current visitor see this order's personal details? */
export async function canViewOrder(order: Pick<Order, "orderNumber" | "email" | "customerId">, token?: string | null) {
  if (tokenOk(order.orderNumber, token)) return true;
  const customer = await getCurrentCustomer();
  if (customer && (customer.id === order.customerId || customer.email === order.email.toLowerCase())) return true;
  return isAuthed();
}
