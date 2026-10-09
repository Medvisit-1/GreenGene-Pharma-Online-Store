"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendNewsletterEmail } from "@/lib/email";
import { sendCampaign, unsubscribeUrl } from "@/lib/newsletter";

export type ComposeState = { status: "idle" | "ok" | "error"; message?: string };

function read(formData: FormData) {
  const g = (k: string, max = 200) => String(formData.get(k) ?? "").trim().slice(0, max);
  return {
    subject: g("subject"),
    heading: g("heading") || null,
    body: String(formData.get("body") ?? "").trim().slice(0, 20000),
    imageUrl: g("imageUrl", 500) || null,
    buttonLabel: g("buttonLabel", 60) || null,
    buttonLink: g("buttonLink", 500) || null,
  };
}

function invalid(c: ReturnType<typeof read>): string | null {
  if (!c.subject) return "Please add a subject line.";
  if (!c.body) return "Please write the email text.";
  if (c.buttonLabel && !c.buttonLink) return "Add a link for the button (or remove the button text).";
  return null;
}

export async function sendTestNewsletter(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  await requireAdmin();
  const c = read(formData);
  const problem = invalid(c);
  if (problem) return { status: "error", message: problem };
  const to = String(formData.get("testEmail") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { status: "error", message: "Enter an email to send the test to." };
  const ok = await sendNewsletterEmail(c, to, unsubscribeUrl(to));
  return ok
    ? { status: "ok", message: `Test sent to ${to} — check how it looks before sending to everyone.` }
    : { status: "error", message: "The test email could not be sent. Check your email settings (Brevo)." };
}

export async function sendNewsletterToAll(_prev: ComposeState, formData: FormData): Promise<ComposeState> {
  await requireAdmin();
  const c = read(formData);
  const problem = invalid(c);
  if (problem) return { status: "error", message: problem };
  const count = await prisma.customer.count({ where: { newsletter: true } });
  if (count === 0) return { status: "error", message: "There are no subscribers yet." };

  const campaign = await prisma.newsletterCampaign.create({ data: c });
  const { sent, failed } = await sendCampaign(campaign);
  await prisma.newsletterCampaign.update({
    where: { id: campaign.id },
    data: { sentCount: sent, failedCount: failed },
  });
  revalidatePath("/admin/newsletter");
  return failed === 0
    ? { status: "ok", message: `Sent to ${sent} subscriber${sent === 1 ? "" : "s"}. 🎉` }
    : { status: "error", message: `Sent to ${sent}; ${failed} could not be delivered.` };
}
