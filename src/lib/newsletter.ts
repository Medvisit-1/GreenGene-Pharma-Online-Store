import "server-only";
import crypto from "node:crypto";
import type { NewsletterCampaign } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appUrl, sendNewsletterEmail, sendNewsletterWelcome } from "@/lib/email";

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function unsubToken(email: string) {
  return crypto
    .createHmac("sha256", secret())
    .update(`unsubscribe:${email.toLowerCase()}`)
    .digest("base64url")
    .slice(0, 32);
}

/** Personal one-click-safe unsubscribe link included in every newsletter email. */
export function unsubscribeUrl(email: string) {
  return `${appUrl()}/newsletter/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
}

export function verifyUnsubscribe(email: string, token: string) {
  const expected = unsubToken(email);
  return (
    token.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  );
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
