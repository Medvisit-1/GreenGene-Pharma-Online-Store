import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const CUSTOMER_COOKIE = "gg_customer";
const SESSION_DAYS = 30;
const LINK_MINUTES = 15;

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(`customer:${value}`).digest("base64url");
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Session cookie value: `<customerId>.<expiry>.<signature>`. */
function createSessionValue(customerId: string): string {
  const exp = String(Date.now() + SESSION_DAYS * 86400_000);
  return `${customerId}.${exp}.${sign(`${customerId}.${exp}`)}`;
}

function readSessionValue(value: string | undefined): string | null {
  if (!value) return null;
  const [id, exp, sig] = value.split(".");
  if (!id || !exp || !sig) return null;
  const expected = sign(`${id}.${exp}`);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  return Number(exp) > Date.now() ? id : null;
}

/** The signed-in customer, or null. */
export async function getCurrentCustomer() {
  const store = await cookies();
  const id = readSessionValue(store.get(CUSTOMER_COOKIE)?.value);
  if (!id) return null;
  try {
    return await prisma.customer.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

export async function setCustomerSession(customerId: string) {
  const store = await cookies();
  store.set(CUSTOMER_COOKIE, createSessionValue(customerId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
}

export async function clearCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_COOKIE);
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
}

/**
 * Create a one-time sign-in token for this email (creating the customer if new).
 * Returns the raw token, or null when rate-limited.
 */
export async function createLoginToken(email: string): Promise<string | null> {
  const customer = await prisma.customer.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  // At most 3 links per customer per 15 minutes.
  const recent = await prisma.customerLoginToken.count({
    where: { customerId: customer.id, createdAt: { gt: new Date(Date.now() - LINK_MINUTES * 60_000) } },
  });
  if (recent >= 3) return null;

  const token = crypto.randomBytes(32).toString("base64url");
  await prisma.customerLoginToken.create({
    data: {
      tokenHash: hashToken(token),
      customerId: customer.id,
      expiresAt: new Date(Date.now() + LINK_MINUTES * 60_000),
    },
  });
  return token;
}

/**
 * Consume a sign-in token. Returns the customer id on success. The atomic
 * `usedAt: null` claim guarantees a link signs in at most once.
 */
export async function consumeLoginToken(token: string): Promise<string | null> {
  if (!token) return null;
  const row = await prisma.customerLoginToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) return null;
  const claim = await prisma.customerLoginToken.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claim.count !== 1) return null;
  await prisma.customer.update({
    where: { id: row.customerId },
    data: { lastLoginAt: new Date() },
  });
  return row.customerId;
}

/** Peek whether a token is still usable (without consuming it). */
export async function loginTokenIsValid(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await prisma.customerLoginToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  return !!row && !row.usedAt && row.expiresAt > new Date();
}
