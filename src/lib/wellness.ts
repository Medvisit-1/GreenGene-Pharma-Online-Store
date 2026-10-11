import "server-only";
import type { NewsletterArticle, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";
import { WELLNESS_ARTICLES } from "@/lib/wellness-articles";
import { sendArticleEmail, type EmailProduct } from "@/lib/email";
import { unsubscribeUrl } from "@/lib/newsletter";

let seeded = false;

/** Load the starter articles the first time (never overwrites the admin's edits). */
export async function ensureArticles() {
  if (seeded) return;
  const count = await prisma.newsletterArticle.count();
  if (count === 0) {
    await prisma.newsletterArticle.createMany({
      data: WELLNESS_ARTICLES.map((a, i) => ({ ...a, sortOrder: i })),
      skipDuplicates: true,
    });
  }
  seeded = true;
}

export function keywordsOf(a: Pick<NewsletterArticle, "productKeywords">) {
  return a.productKeywords
    .split(",")
    .map((k) => k.trim())
    .filter((k) => k.length >= 3)
    .slice(0, 8);
}

/** Active products whose name or description mentions one of the article's keywords. */
export async function productsForArticle(
  a: Pick<NewsletterArticle, "productKeywords">,
  limit = 3
): Promise<Product[]> {
  const kws = keywordsOf(a);
  if (!kws.length) return [];
  const found = await prisma.product.findMany({
    where: {
      active: true,
      OR: kws.flatMap((k) => [
        { name: { contains: k, mode: "insensitive" as const } },
        { shortDescription: { contains: k, mode: "insensitive" as const } },
        { description: { contains: k, mode: "insensitive" as const } },
      ]),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    take: 12,
  });
  // In-stock first, then name matches before description matches
  const score = (p: Product) =>
    (p.stock > 0 ? 0 : 10) + (kws.some((k) => p.name.toLowerCase().includes(k.toLowerCase())) ? 0 : 1);
  return found.sort((x, y) => score(x) - score(y)).slice(0, limit);
}

export function toEmailProduct(p: Product): EmailProduct {
  return { name: p.name, slug: p.slug, price: p.price, image: parseImages(p.images)[0] ?? null };
}

/** The next article in the rotation: least-sent first, then oldest send, then admin order. */
export async function nextArticle(): Promise<NewsletterArticle | null> {
  await ensureArticles();
  return prisma.newsletterArticle.findFirst({
    where: { published: true },
    orderBy: [{ timesSent: "asc" }, { lastSentAt: { sort: "asc", nulls: "first" } }, { sortOrder: "asc" }],
  });
}

/** Upcoming issues in rotation order (for the admin schedule preview). */
export async function upcomingArticles(n: number): Promise<NewsletterArticle[]> {
  await ensureArticles();
  return prisma.newsletterArticle.findMany({
    where: { published: true },
    orderBy: [{ timesSent: "asc" }, { lastSentAt: { sort: "asc", nulls: "first" } }, { sortOrder: "asc" }],
    take: n,
  });
}

/**
 * Send one article to every subscriber and record it as a campaign.
 * With a `slot` (e.g. "2026-10-13"), the unique slot guarantees that issue
 * is only ever sent once, even if several servers run the scheduler.
 */
export async function sendArticleCampaign(
  article: NewsletterArticle,
  slot?: string
): Promise<{ sent: number; failed: number } | null> {
  let campaign;
  try {
    campaign = await prisma.newsletterCampaign.create({
      data: {
        subject: article.subject,
        heading: article.title,
        body: article.excerpt,
        buttonLabel: "Read the article",
        buttonLink: `/wellness/${article.slug}`,
        slot: slot ?? null,
        articleId: article.id,
      },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return null; // this slot was already sent
    throw e;
  }

  const products = (await productsForArticle(article)).map(toEmailProduct);
  const subscribers = await prisma.customer.findMany({
    where: { newsletter: true, deletionRequestedAt: null },
    select: { email: true },
  });
  let sent = 0;
  let failed = 0;
  const queue = [...subscribers];
  const worker = async () => {
    for (let s = queue.shift(); s; s = queue.shift()) {
      const ok = await sendArticleEmail(article, products, s.email, unsubscribeUrl(s.email)).catch(() => false);
      if (ok) sent++;
      else failed++;
    }
  };
  await Promise.all(Array.from({ length: 5 }, worker));

  await Promise.all([
    prisma.newsletterCampaign.update({ where: { id: campaign.id }, data: { sentCount: sent, failedCount: failed } }),
    prisma.newsletterArticle.update({
      where: { id: article.id },
      data: { timesSent: { increment: 1 }, lastSentAt: new Date() },
    }),
  ]);
  return { sent, failed };
}
