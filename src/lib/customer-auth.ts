import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export const CUSTOMER_COOKIE = "gg_customer";
const SESSION_DAYS = 30;
const SEND_WINDOW_MINUTES = 15; // rate-limit window for sending codes

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(`customer:${value}`).digest("base64url");
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

const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;

/** Keyed hash: a 6-digit code is guessable offline, so a plain hash isn't enough. */
function hashCode(customerId: string, code: string) {
  return crypto.createHmac("sha256", secret()).update(`login:${customerId}:${code}`).digest("hex");
}

/**
 * Create a 6-digit sign-in code for this email (creating the customer if new).
 * Returns the code, or null when rate-limited (max 3 codes per 15 minutes).
 */
export async function createLoginCode(email: string): Promise<string | null> {
  const customer = await prisma.customer.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  const recent = await prisma.customerLoginToken.count({
    where: { customerId: customer.id, createdAt: { gt: new Date(Date.now() - SEND_WINDOW_MINUTES * 60_000) } },
  });
  if (recent >= 3) return null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    try {
      await prisma.customerLoginToken.create({
        data: {
          tokenHash: hashCode(customer.id, code),
          customerId: customer.id,
          expiresAt: new Date(Date.now() + CODE_MINUTES * 60_000),
        },
      });
      return code;
    } catch {
      // the same code was issued to this customer moments ago — draw another
    }
  }
  return null;
}

export type CodeCheck =
  | { ok: true; customerId: string }
  | { ok: false; reason: "invalid" | "expired" | "locked" };

/**
 * Check a sign-in code. Any of the customer's live codes is accepted (so a
 * delayed first email still works). Every wrong guess counts against all live
 * codes; after 5 they are burned and a new code must be requested.
 */
export async function verifyLoginCode(email: string, rawCode: string): Promise<CodeCheck> {
  const code = rawCode.replace(/\D/g, "");
  const customer = await prisma.customer.findUnique({ where: { email } });
  if (!customer) return { ok: false, reason: "expired" };

  const live = await prisma.customerLoginToken.findMany({
    where: { customerId: customer.id, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (live.length === 0) return { ok: false, reason: "expired" };
  if (live.every((t) => t.attempts >= MAX_ATTEMPTS)) return { ok: false, reason: "locked" };

  const expected = code.length === 6 ? hashCode(customer.id, code) : "";
  const match = live.find(
    (t) =>
      t.attempts < MAX_ATTEMPTS &&
      expected.length === t.tokenHash.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(t.tokenHash))
  );

  if (!match) {
    await prisma.customerLoginToken.updateMany({
      where: { id: { in: live.map((t) => t.id) } },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - (Math.max(...live.map((t) => t.attempts)) + 1);
    return { ok: false, reason: left <= 0 ? "locked" : "invalid" };
  }

  // Atomic claim: a code signs in at most once, and using it retires the others.
  const claim = await prisma.customerLoginToken.updateMany({
    where: { id: match.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claim.count !== 1) return { ok: false, reason: "expired" };
  await prisma.customerLoginToken.updateMany({
    where: { customerId: customer.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.customer.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
  return { ok: true, customerId: customer.id };
}
