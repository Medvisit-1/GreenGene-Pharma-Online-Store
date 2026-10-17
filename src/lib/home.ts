import "server-only";
import type { Customer, NewsletterArticle, Product } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages } from "@/lib/utils";
import { splitDescription } from "@/lib/product-info";
import { getCustomerRewards } from "@/lib/rewards";
import { ensureArticles, productsForArticle } from "@/lib/wellness";

/** "Zenax — Natural Mind & Stress Support Formula (60 Capsules…)" → { name: "Zenax", tagline: "Natural Mind & Stress Support Formula" } */
export function productTitle(full: string): { name: string; tagline: string } {
  const [name, ...rest] = full.split(/\s+[-–—]\s+/);
  return { name: name.trim(), tagline: rest.join(" – ").replace(/\s*\([^)]*\)\s*/g, " ").trim() };
}

/** Whole rands without decimals for headlines ("R260"), otherwise the usual format. */
export function shortPrice(cents: number): string {
  return cents % 100 === 0 ? `R${cents / 100}` : formatPrice(cents);
}

export const firstImage = (p: Pick<Product, "images">) => parseImages(p.images)[0] ?? null;

/** First sentence of the product's directions ("Take 2 capsules daily with water"). */
export function directions(p: Pick<Product, "howToUse" | "description">): string {
  const text = (p.howToUse || splitDescription(p.description ?? "").howToUse).replace(/\s+/g, " ").replace(/^[^\p{L}\p{N}]+/u, "").trim();
  const first = text.split(/(?<=[.!])\s/)[0]?.replace(/[.!]$/, "") ?? "";
  return first.length > 70 ? `${first.slice(0, 67).trimEnd()}…` : first;
}

/** ☀️ / 🌙 when the directions mention a time of day. */
export function timeOfDay(text: string): string {
  if (/morning|breakfast/i.test(text)) return "☀️ Morning · ";
  if (/evening|night|bed/i.test(text)) return "🌙 Evening · ";
  return "";
}

/** "Good morning" in South African time. */
export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-ZA", { timeZone: "Africa/Johannesburg", hour: "numeric", hourCycle: "h23" }).format(new Date())
  );
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** Shorter category labels for the goal circles. */
export function goalLabel(name: string): string {
  const trimmed = name.replace(/\s+Support$/i, "");
  const first = trimmed.split(" & ")[0];
  return first.includes(" ") ? first : trimmed;
}

export type RewardStatus = {
  ready: number;
  paidOrders: number;
  next: { current: number; target: number; discount: string } | null;
  welcome: "available" | "claimed" | "locked" | null;
};

/** Where a signed-in customer stands in the rewards programme. */
export async function rewardStatus(customer: Customer): Promise<RewardStatus | null> {
  try {
    const { rewards, paidOrders } = await getCustomerRewards(customer);
    const ready = rewards.reduce((n, r) => n + (r.status === "available" ? Math.max(1, r.availableCount) : 0), 0);
    const next = rewards
      .filter((r) => r.reward.type === "milestone" && r.status === "locked" && r.progress)
      .sort((a, b) => a.reward.threshold - b.reward.threshold)[0];
    const welcome = rewards.find((r) => r.reward.type === "newsletter");
    return {
      ready,
      paidOrders,
      next: next?.progress ? { ...next.progress, discount: next.discount } : null,
      welcome: welcome?.status ?? null,
    };
  } catch {
    return null;
  }
}

export type RoutineItem = { product: Product; quantity: number };
export type LastOrder = { placedAt: Date; items: RoutineItem[] };

/** The customer's most recent paid order (products still on sale). */
export async function lastPaidOrder(customer: Customer): Promise<LastOrder | null> {
  const order = await prisma.order.findFirst({
    where: { paymentStatus: "paid", OR: [{ customerId: customer.id }, { email: customer.email }] },
    orderBy: [{ paidAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    include: { items: { include: { product: true } } },
  });
  if (!order) return null;
  const items = order.items
    .filter((i) => i.product?.active)
    .map((i) => ({ product: i.product!, quantity: i.quantity }));
  return items.length ? { placedAt: order.paidAt ?? order.createdAt, items } : null;
}

export type Refill = { item: RoutineItem; daysLeft: number; totalDays: number; placedAt: Date };

/** The product from the last order that will run out first. */
export function nextRefill(order: LastOrder, defaultDays: number): Refill | null {
  const now = Date.now();
  let best: Refill | null = null;
  for (const item of order.items) {
    const totalDays = (item.product.supplyDays ?? defaultDays) * item.quantity;
    const daysLeft = Math.ceil((order.placedAt.getTime() + totalDays * 86400_000 - now) / 86400_000);
    if (!best || daysLeft < best.daysLeft) best = { item, daysLeft, totalDays, placedAt: order.placedAt };
  }
  return best;
}

/** The product with the biggest saving against its compare-at price. */
export async function bestOffer(): Promise<Product | null> {
  const discounted = await prisma.product.findMany({
    where: { active: true, stock: { gt: 0 }, compareAtPrice: { not: null } },
  });
  return (
    discounted
      .filter((p) => p.compareAtPrice! > p.price)
      .sort((a, b) => b.compareAtPrice! - b.price - (a.compareAtPrice! - a.price))[0] ?? null
  );
}

/** The most recently sent Wellness Note (or the first in the list) with a matching product. */
export async function featuredArticle(): Promise<{ article: NewsletterArticle; product: Product | null } | null> {
  await ensureArticles();
  const article = await prisma.newsletterArticle.findFirst({
    where: { published: true },
    orderBy: [{ lastSentAt: { sort: "desc", nulls: "last" } }, { sortOrder: "asc" }],
  });
  if (!article) return null;
  const [product] = await productsForArticle(article, 1);
  return { article, product: product ?? null };
}
