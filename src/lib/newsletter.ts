import "server-only";
import crypto from "node:crypto";
import type { NewsletterCampaign } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appUrl, sendNewsletterEmail, sendNewsletterWelcome } from "@/lib/email";

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

export type OptOutKind = "newsletter" | "reminders";

function unsubToken(email: string, kind: OptOutKind = "newsletter") {
  // The newsletter keeps its original purpose string so links in old emails stay valid
  const purpose = kind === "reminders" ? "reminders" : "unsubscribe";
  return crypto
    .createHmac("sha256", secret())
    .update(`${purpose}:${email.toLowerCase()}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Personal one-click-safe opt-out link included in every newsletter / reminder email. */
export function unsubscribeUrl(email: string, kind: OptOutKind = "newsletter") {
  return `${appUrl()}/newsletter/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email, kind)}${kind === "reminders" ? "&k=reminders" : ""}`;
}

export function verifyUnsubscribe(email: string, token: string, kind: OptOutKind = "newsletter") {
  const expected = unsubToken(email, kind);
  return (
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  );
}

/** Stop refill and saved-cart reminder emails. */
export async function optOutOfReminders(email: string) {
  await prisma.customer.updateMany({
    where: { email: email.trim().toLowerCase() },
    data: { remindersOptOut: true },
  });
}

/**
 * Opt an email in to the newsletter (creating a customer record if new) and
 * send the welcome email the first time. Returns whether they were newly added.
 */
export async function subscribe(rawEmail: string, name?: string | null): Promise<boolean> {
  const email = rawEmail.trim().toLowerCase();
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing?.newsletter) return false;

  await prisma.customer.upsert({
    where: { email },
    create: { email, name: name || null, newsletter: true, newsletterAt: new Date() },
    update: { newsletter: true, newsletterAt: new Date() },
  });
  await sendNewsletterWelcome(email, unsubscribeUrl(email)).catch(() => false);
  return true;
}

export async function unsubscribe(email: string) {
  await prisma.customer.updateMany({
    where: { email: email.trim().toLowerCase() },
    data: { newsletter: false },
  });
}

/** Send a campaign to every current subscriber (5 at a time). */
export async function sendCampaign(campaign: NewsletterCampaign): Promise<{ sent: number; failed: number }> {
  const subscribers = await prisma.customer.findMany({
    where: { newsletter: true },
    select: { email: true },
  });
  let sent = 0;
  let failed = 0;
  const queue = [...subscribers];
  const worker = async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const ok = await sendNewsletterEmail(campaign, s.email, unsubscribeUrl(s.email)).catch(() => false);
      if (ok) sent++;
      else failed++;
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));
  return { sent, failed };
}
