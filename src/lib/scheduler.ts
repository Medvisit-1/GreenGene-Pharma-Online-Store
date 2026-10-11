import "server-only";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { parseImages, reorderHref } from "@/lib/utils";
import { sendBackInStock, sendCartReminder, sendPaymentReminder, sendRefillReminder, type EmailProduct } from "@/lib/email";
import { orderUrl } from "@/lib/order-access";
import { getEnabledMethods } from "@/lib/payments";
import { unsubscribeUrl } from "@/lib/newsletter";
import { nextArticle, sendArticleCampaign } from "@/lib/wellness";

/**
 * Timed jobs: the automated newsletter, refill reminders, back-in-stock alerts
 * and saved-cart reminders. Runs every few minutes (see src/instrumentation.ts)
 * and can also be triggered via /api/cron/run.
 *
 * Every email is "claimed" in the database before it's sent, so a job that runs
 * twice (or on two servers at once) never emails anyone twice.
 */

const DAY = 864e5;
const HOUR = 36e5;
const REFILL_LEAD_DAYS = 5; // remind this many days before a supply runs out
const REFILL_WINDOW_DAYS = 7; // ...and give up if we're more than a week late
const CART_MIN_AGE = 2 * HOUR;
const CART_MAX_AGE = 48 * HOUR;
const PAY_MIN_AGE = 1 * HOUR; // give people time to finish paying first
const PAY_MAX_AGE = 24 * HOUR;

/** Current time in South Africa (UTC+2, no daylight saving). */
export function sastNow(now = new Date()) {
  const t = new Date(now.getTime() + 2 * HOUR);
  return { weekday: t.getUTCDay(), hour: t.getUTCHours(), date: t.toISOString().slice(0, 10) };
}

export type JobReport = Record<string, string>;

let running = false;

export async function runScheduledJobs(now = new Date()): Promise<JobReport> {
  if (running) return { skipped: "already running" };
  running = true;
  const report: JobReport = {};
  const jobs: [string, () => Promise<string>][] = [
    ["newsletter", () => newsletterJob(now)],
    ["stockAlerts", () => stockAlertJob()],
    ["refills", () => refillJob(now)],
    ["carts", () => cartJob(now)],
    ["payments", () => paymentJob(now)],
  ];
  try {
    for (const [name, job] of jobs) {
      try {
        report[name] = await job();
      } catch (e) {
        report[name] = `error: ${(e as Error).message}`;
        console.error(`[scheduler] ${name} failed:`, e);
      }
    }
  } finally {
    running = false;
  }
  return report;
}

/* ---------------- Wellness newsletter ---------------- */

export function newsletterSlotDue(
  s: { newsletterAutoEnabled: string; newsletterDays: string; newsletterHour: string },
  now = new Date()
): string | null {
  if (s.newsletterAutoEnabled !== "1") return null;
  const days = s.newsletterDays.split(",").map((d) => parseInt(d, 10)).filter((d) => d >= 0 && d <= 6);
  const hour = Math.min(23, Math.max(0, parseInt(s.newsletterHour, 10) || 0));
  const t = sastNow(now);
  if (!days.includes(t.weekday) || t.hour < hour) return null;
  return t.date;
}

async function newsletterJob(now: Date) {
  const slot = newsletterSlotDue(await getSettings(), now);
  if (!slot) return "not due";
  if (await prisma.newsletterCampaign.findUnique({ where: { slot } })) return `already sent for ${slot}`;
  const article = await nextArticle();
  if (!article) return "no published articles";
  const res = await sendArticleCampaign(article, slot);
  return res ? `sent "${article.title}" to ${res.sent} (${res.failed} failed)` : `already sent for ${slot}`;
}

/* ---------------- Back in stock ---------------- */

async function stockAlertJob() {
  const alerts = await prisma.stockAlert.findMany({
    where: { notifiedAt: null, product: { active: true, stock: { gt: 0 } } },
    include: { product: true },
    take: 200,
  });
  let sent = 0;
  for (const a of alerts) {
    const claim = await prisma.stockAlert.updateMany({ where: { id: a.id, notifiedAt: null }, data: { notifiedAt: new Date() } });
    if (claim.count !== 1) continue;
    const ok = await sendBackInStock(a.email, {
      name: a.product.name,
      slug: a.product.slug,
      price: a.product.price,
      image: parseImages(a.product.images)[0] ?? null,
    }).catch(() => false);
    if (ok) sent++;
  }
  return `${sent} sent`;
}

/* ---------------- Refill reminders ---------------- */

async function refillJob(now: Date) {
  const s = await getSettings();
  if (s.refillRemindersEnabled !== "1") return "off";
  const defaultDays = Math.max(7, parseInt(s.refillDefaultDays, 10) || 30);

  // Paid orders recent enough that a supply could be running out now
  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: "paid",
      createdAt: { gt: new Date(now.getTime() - 400 * DAY) },
      items: { some: { refillReminderAt: null, productId: { not: null } } },
    },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "asc" },
  });

  type Due = { itemId: string; product: NonNullable<(typeof orders)[number]["items"][number]["product"]>; quantity: number };
  const dueByEmail = new Map<string, Due[]>();
  const handled: string[] = []; // items we'll never remind about (too late, re-ordered, product gone)

  for (const o of orders) {
    const start = (o.paidAt ?? o.createdAt).getTime();
    for (const it of o.items) {
      if (it.refillReminderAt || !it.product) continue;
      const days = (it.product.supplyDays ?? defaultDays) * it.quantity;
      const due = start + (days - REFILL_LEAD_DAYS) * DAY;
      if (now.getTime() < due) continue; // not yet
      if (now.getTime() > due + REFILL_WINDOW_DAYS * DAY || !it.product.active) {
        handled.push(it.id);
        continue;
      }
      const list = dueByEmail.get(o.email) ?? [];
      list.push({ itemId: it.id, product: it.product, quantity: it.quantity });
      dueByEmail.set(o.email, list);
    }
  }
  if (handled.length) {
    await prisma.orderItem.updateMany({ where: { id: { in: handled }, refillReminderAt: null }, data: { refillReminderAt: now } });
  }

  let sent = 0;
  for (const [email, due] of dueByEmail) {
    const customer = await prisma.customer.findUnique({ where: { email } });
    const optedOut = !customer || customer.remindersOptOut || !!customer.deletionRequestedAt;

    // Skip products they've already bought again since (any order newer than the due one)
    const fresh: Due[] = [];
    for (const d of due) {
      const item = await prisma.orderItem.findUnique({ where: { id: d.itemId }, include: { order: true } });
      const reordered = item
        ? await prisma.orderItem.count({
            where: {
              productId: d.product.id,
              order: { email, createdAt: { gt: item.order.createdAt }, paymentStatus: { in: ["paid", "unpaid"] } },
            },
          })
        : 1;
      if (!reordered) fresh.push(d);
    }

    // Claim every due line first (so nothing is ever sent twice), then email what we claimed
    const claimed: Due[] = [];
    for (const d of due) {
      const c = await prisma.orderItem.updateMany({ where: { id: d.itemId, refillReminderAt: null }, data: { refillReminderAt: now } });
      if (c.count === 1 && fresh.includes(d)) claimed.push(d);
    }
    if (optedOut || !claimed.length) continue;

    // One line per product (several orders of the same product → one line)
    const byProduct = new Map<string, Due>();
    for (const d of claimed) {
      const prev = byProduct.get(d.product.id);
      byProduct.set(d.product.id, prev ? { ...prev, quantity: Math.max(prev.quantity, d.quantity) } : d);
    }
    const lines = [...byProduct.values()];
    const items: EmailProduct[] = lines.map((d) => ({
      name: d.product.name,
      slug: d.product.slug,
      price: d.product.price,
      image: parseImages(d.product.images)[0] ?? null,
      quantity: d.quantity,
    }));
    const ok = await sendRefillReminder({
      to: email,
      name: customer!.name,
      items,
      reorderUrl: reorderHref(lines.map((d) => ({ productId: d.product.id, quantity: d.quantity })))!,
      optOutUrl: unsubscribeUrl(email, "reminders"),
    }).catch(() => false);
    if (ok) sent++;
  }
  return `${sent} sent`;
}

/* ---------------- Saved-cart reminders ---------------- */

async function cartJob(now: Date) {
  const s = await getSettings();
  if (s.cartRemindersEnabled !== "1") return "off";
  const carts = await prisma.savedCart.findMany({
    where: {
      reminderSentAt: null,
      updatedAt: { lt: new Date(now.getTime() - CART_MIN_AGE), gt: new Date(now.getTime() - CART_MAX_AGE) },
      customer: { remindersOptOut: false, deletionRequestedAt: null },
    },
    include: { customer: true },
    take: 200,
  });

  let sent = 0;
  for (const cart of carts) {
    const c = cart.customer;
    // POPIA: only people who agreed to marketing, or existing customers (s69(3))
    const existingCustomer = await prisma.order.count({ where: { email: c.email, paymentStatus: "paid" } });
    if (!c.newsletter && !existingCustomer) continue;
    // Already ordered since the cart was saved?
    const ordered = await prisma.order.count({ where: { email: c.email, createdAt: { gt: new Date(cart.updatedAt.getTime() - HOUR) } } });

    const claim = await prisma.savedCart.updateMany({
      where: { id: cart.id, reminderSentAt: null, updatedAt: cart.updatedAt },
      data: { reminderSentAt: now },
    });
    if (claim.count !== 1 || ordered) continue;

    let lines: { productId: string; quantity: number }[] = [];
    try {
      lines = JSON.parse(cart.items);
    } catch {
      continue;
    }
    const products = await prisma.product.findMany({
      where: { id: { in: lines.map((l) => l.productId) }, active: true, stock: { gt: 0 } },
    });
    const available = lines
      .map((l) => ({ l, p: products.find((p) => p.id === l.productId) }))
      .filter((x): x is { l: (typeof lines)[number]; p: (typeof products)[number] } => !!x.p)
      .map(({ l, p }) => ({ product: p, quantity: Math.min(l.quantity, p.stock) }));
    if (!available.length) continue;

    const ok = await sendCartReminder({
      to: c.email,
      name: c.name,
      items: available.map(({ product: p, quantity }) => ({
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: parseImages(p.images)[0] ?? null,
        quantity,
      })),
      reorderUrl: reorderHref(available.map((a) => ({ productId: a.product.id, quantity: a.quantity })))!,
      optOutUrl: unsubscribeUrl(c.email, "reminders"),
    }).catch(() => false);
    if (ok) sent++;
  }
  return `${sent} sent`;
}

/* ---------------- "Complete your payment" reminders ---------------- */

async function paymentJob(now: Date) {
  const s = await getSettings();
  if (s.paymentRemindersEnabled !== "1") return "off";
  if (!(await getEnabledMethods()).length) return "no payment gateways active";

  const orders = await prisma.order.findMany({
    where: {
      paymentStatus: { in: ["unpaid", "failed"] },
      paymentReminderAt: null,
      total: { gt: 0 },
      createdAt: { lt: new Date(now.getTime() - PAY_MIN_AGE), gt: new Date(now.getTime() - PAY_MAX_AGE) },
    },
    include: { items: { include: { product: true } }, customer: true },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  let sent = 0;
  for (const o of orders) {
    // Claim first, so nobody is ever reminded twice about the same order
    const claim = await prisma.order.updateMany({ where: { id: o.id, paymentReminderAt: null }, data: { paymentReminderAt: now } });
    if (claim.count !== 1) continue;

    // Skip if they've placed another order since (paid or a newer attempt), or opted out
    const newer = await prisma.order.count({ where: { email: o.email, createdAt: { gt: o.createdAt } } });
    if (newer || o.customer?.remindersOptOut || o.customer?.deletionRequestedAt) continue;

    const ok = await sendPaymentReminder({
      to: o.email,
      name: o.customer?.name ?? null,
      orderNumber: o.orderNumber,
      total: o.total,
      items: o.items.map((i) => ({
        name: i.name,
        slug: i.product?.slug ?? "",
        price: i.price,
        image: i.image ?? (i.product ? parseImages(i.product.images)[0] : null) ?? null,
        quantity: i.quantity,
      })),
      payUrl: orderUrl(o.orderNumber),
      optOutUrl: unsubscribeUrl(o.email, "reminders"),
    }).catch(() => false);
    if (ok) sent++;
  }
  return `${sent} sent`;
}

/** The next `n` scheduled send times (as SAST "YYYY-MM-DD" + hour), skipping today's if already sent. */
export function upcomingSlots(
  s: { newsletterDays: string; newsletterHour: string },
  n: number,
  sentToday: boolean,
  now = new Date()
): { date: string; label: string }[] {
  const days = s.newsletterDays.split(",").map((d) => parseInt(d, 10)).filter((d) => d >= 0 && d <= 6);
  if (!days.length) return [];
  const hour = Math.min(23, Math.max(0, parseInt(s.newsletterHour, 10) || 0));
  const out: { date: string; label: string }[] = [];
  const today = sastNow(now);
  for (let i = 0; out.length < n && i < 60; i++) {
    const t = new Date(now.getTime() + 2 * HOUR + i * DAY);
    const date = t.toISOString().slice(0, 10);
    if (!days.includes(t.getUTCDay())) continue;
    if (date === today.date && sentToday) continue;
    const label = `${t.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}, ${String(hour).padStart(2, "0")}:00`;
    out.push({ date, label: date === today.date && today.hour >= hour ? `${label} (sending shortly)` : label });
  }
  return out;
}
