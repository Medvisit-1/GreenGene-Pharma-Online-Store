"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { updateSettings } from "@/lib/settings";
import { slugify } from "@/lib/utils";
import { sendArticleEmail } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/newsletter";
import { productsForArticle, sendArticleCampaign, toEmailProduct } from "@/lib/wellness";

const PAGE = "/admin/newsletter";

function done(msg: string, anchor = ""): never {
  revalidatePath(PAGE);
  revalidatePath("/wellness");
  redirect(`${PAGE}?msg=${encodeURIComponent(msg)}${anchor}`);
}

const g = (f: FormData, k: string, max = 200) => String(f.get(k) ?? "").trim().slice(0, max);

/** Turn the automated programme on/off and choose the sending days and time. */
export async function saveProgramme(formData: FormData) {
  await requireAdmin();
  const days = formData
    .getAll("days")
    .map((d) => parseInt(String(d), 10))
    .filter((d) => d >= 0 && d <= 6);
  const hour = Math.min(23, Math.max(0, parseInt(g(formData, "hour"), 10) || 8));
  const enabled = formData.get("enabled") === "on";
  if (enabled && !days.length) done("Pick at least one sending day.", "#programme");
  await updateSettings({
    newsletterAutoEnabled: enabled ? "1" : "0",
    newsletterDays: [...new Set(days)].sort().join(","),
    newsletterHour: String(hour),
  });
  done(enabled ? "Automated Wellness Notes are ON." : "Automated Wellness Notes are paused.", "#programme");
}

export async function saveReminderSettings(formData: FormData) {
  await requireAdmin();
  const days = Math.min(365, Math.max(7, parseInt(g(formData, "refillDefaultDays"), 10) || 30));
  await updateSettings({
    refillRemindersEnabled: formData.get("refillRemindersEnabled") === "on" ? "1" : "0",
    refillDefaultDays: String(days),
    cartRemindersEnabled: formData.get("cartRemindersEnabled") === "on" ? "1" : "0",
  });
  done("Reminder settings saved.", "#reminders");
}

export async function saveArticle(formData: FormData) {
  await requireAdmin();
  const id = g(formData, "id", 40);
  const title = g(formData, "title");
  const data = {
    title,
    slug: slugify(g(formData, "slug") || title).slice(0, 80),
    subject: g(formData, "subject") || title,
    excerpt: g(formData, "excerpt", 400),
    body: String(formData.get("body") ?? "").trim().slice(0, 30000),
    productKeywords: g(formData, "productKeywords", 300),
    published: formData.get("published") === "on",
    sortOrder: parseInt(g(formData, "sortOrder"), 10) || 0,
  };
  if (!data.title || !data.body || !data.excerpt) done("An article needs a title, a short intro and body text.", "#articles");
  const clash = await prisma.newsletterArticle.findUnique({ where: { slug: data.slug } });
  if (clash && clash.id !== id) done(`Another article already uses the web address "${data.slug}".`, "#articles");

  if (id) await prisma.newsletterArticle.update({ where: { id }, data });
  else await prisma.newsletterArticle.create({ data });
  done(id ? `Saved "${title}".` : `Added "${title}".`, "#articles");
}

export async function deleteArticle(formData: FormData) {
  await requireAdmin();
  await prisma.newsletterArticle.deleteMany({ where: { id: g(formData, "id", 40) } });
  done("Article deleted.", "#articles");
}

/** Email one article to a single address so the admin can check it. */
export async function testArticle(formData: FormData) {
  await requireAdmin();
  const to = g(formData, "testEmail", 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) done("Enter an email address for the test.", "#articles");
  const a = await prisma.newsletterArticle.findUnique({ where: { id: g(formData, "id", 40) } });
  if (!a) done("Article not found.", "#articles");
  const products = (await productsForArticle(a)).map(toEmailProduct);
  const ok = await sendArticleEmail(a, products, to, unsubscribeUrl(to));
  done(ok ? `Test of "${a.title}" sent to ${to}.` : "The test could not be sent — check your email settings (Brevo).", "#articles");
}

/** Send one article to every subscriber right now (outside the schedule). */
export async function sendArticleNow(formData: FormData) {
  await requireAdmin();
  const a = await prisma.newsletterArticle.findUnique({ where: { id: g(formData, "id", 40) } });
  if (!a) done("Article not found.", "#articles");
  const count = await prisma.customer.count({ where: { newsletter: true, deletionRequestedAt: null } });
  if (!count) done("There are no subscribers yet.", "#articles");
  const res = await sendArticleCampaign(a);
  done(`Sent "${a.title}" to ${res?.sent ?? 0} subscriber${res?.sent === 1 ? "" : "s"}${res?.failed ? ` (${res.failed} failed)` : ""}.`, "#articles");
}
