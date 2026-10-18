import "server-only";
import { prisma } from "@/lib/prisma";
import { periodRange, saDayStart, type Period } from "@/lib/reports";

const DAY = 864e5;
const SAST = 2 * 36e5; // South Africa is UTC+2 all year
const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Day-of-week (0 = Monday) and hour in South African time. */
function saParts(d: Date) {
  const sa = new Date(d.getTime() + SAST);
  return { weekday: (sa.getUTCDay() + 6) % 7, hour: sa.getUTCHours(), day: sa.toISOString().slice(0, 10), month: sa.toISOString().slice(0, 7) };
}

/** Orders count on the day the customer placed them (see reports.ts). */
const paidDate = (o: { createdAt: Date }) => o.createdAt;

async function paidOrders() {
  return prisma.order.findMany({
    where: { paymentStatus: "paid" },
    select: {
      id: true, email: true, total: true, discount: true, discountCode: true, shippingAddress: true,
      createdAt: true, paidAt: true,
      items: { select: { productId: true, name: true, price: true, quantity: true } },
    },
  });
}
type PaidOrder = Awaited<ReturnType<typeof paidOrders>>[number];

export type Point = { key: string; label: string; value: number; count: number };

/** One bucket per day for the last `days` days (SA dates), oldest first. */
function dailyBuckets(days: number, now: Date): Point[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() + SAST - (days - 1 - i) * DAY);
    const key = d.toISOString().slice(0, 10);
    return { key, label: d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" }), value: 0, count: 0 };
  });
}

/** One bucket per calendar month for the last `months` months, oldest first. */
function monthlyBuckets(months: number, now: Date): Point[] {
  const sa = new Date(now.getTime() + SAST);
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(sa.getUTCFullYear(), sa.getUTCMonth() - (months - 1 - i), 1));
    return {
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-ZA", { month: "short", year: i === 0 || d.getUTCMonth() === 0 ? "2-digit" : undefined, timeZone: "UTC" }),
      value: 0,
      count: 0,
    };
  });
}

function fill(points: Point[], orders: PaidOrder[], by: "day" | "month") {
  const map = new Map(points.map((p) => [p.key, p]));
  for (const o of orders) {
    const p = map.get(saParts(paidDate(o))[by]);
    if (p) {
      p.value += o.total;
      p.count++;
    }
  }
  return points;
}

const pct = (now: number, before: number) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function dashboardData(now = new Date()) {
  // Last 30 SA calendar days (today included), matching the chart's 30 columns
  const from = saDayStart(now, 29);
  const prevFrom = new Date(from.getTime() - 30 * DAY);
  const [orders, signups, prevSignups, toFulfil, unpaid, pendingReviews, lowStock, waitingAlerts, messages, recent] = await Promise.all([
    paidOrders(),
    prisma.customer.count({ where: { createdAt: { gte: from } } }),
    prisma.customer.count({ where: { createdAt: { gte: prevFrom, lt: from } } }),
    prisma.order.count({ where: { paymentStatus: "paid", status: "unfulfilled" } }),
    prisma.order.count({ where: { paymentStatus: "unpaid", createdAt: { gte: new Date(now.getTime() - 7 * DAY) } } }),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.product.findMany({ where: { active: true, stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 6 }),
    prisma.stockAlert.count({ where: { notifiedAt: null } }),
    prisma.contactMessage.count({ where: { handled: false } }).catch(() => 0),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
  ]);
  const cur = orders.filter((o) => paidDate(o) >= from);
  const prev = orders.filter((o) => paidDate(o) >= prevFrom && paidDate(o) < from);
  const revenue = cur.reduce((n, o) => n + o.total, 0);
  const prevRevenue = prev.reduce((n, o) => n + o.total, 0);
  const aov = cur.length ? Math.round(revenue / cur.length) : 0;
  const prevAov = prev.length ? Math.round(prevRevenue / prev.length) : 0;
  const daily = fill(dailyBuckets(30, now), cur, "day");

  return {
    kpis: {
      revenue: { value: revenue, change: pct(revenue, prevRevenue) },
      orders: { value: cur.length, change: pct(cur.length, prev.length) },
      aov: { value: aov, change: pct(aov, prevAov) },
      signups: { value: signups, change: pct(signups, prevSignups) },
    },
    daily,
    todo: { toFulfil, unpaid, pendingReviews, lowStock: lowStock.length, waitingAlerts, messages },
    lowStock,
    recent,
  };
}

// ---------------------------------------------------------------------------
// Insights: trends & patterns
// ---------------------------------------------------------------------------

export async function insightsData(period: Period, now = new Date()) {
  const { from } = periodRange(period, now);
  const [all, products, subscribers, customers, createdOrders, rewardPromos, wishlist] = await Promise.all([
    paidOrders(),
    prisma.product.findMany({ select: { id: true, name: true, categoryId: true, category: { select: { name: true } } } }),
    prisma.customer.findMany({ where: { newsletter: true }, select: { newsletterAt: true, createdAt: true } }),
    prisma.customer.count(),
    prisma.order.groupBy({ by: ["paymentStatus"], where: from ? { createdAt: { gte: from } } : {}, _count: { _all: true } }),
    prisma.promotion.aggregate({ where: { source: "reward" }, _count: { _all: true }, _sum: { usageCount: true } }),
    prisma.wishlistItem.count(),
  ]);
  const inRange = all.filter((o) => !from || paidDate(o) >= from);
  const productBy = new Map(products.map((p) => [p.id, p]));

  // Trend: daily for short periods, monthly otherwise
  const daily = period === "30d" || period === "90d";
  const trend = daily
    ? fill(dailyBuckets(period === "30d" ? 30 : 90, now), inRange, "day")
    : fill(monthlyBuckets(period === "12m" ? 12 : period === "ytd" ? new Date(now.getTime() + SAST).getUTCMonth() + 1 : Math.max(12, monthsSpan(all, now)), now), inRange, "month");

  // When do people buy? weekday × hour (SA time)
  const heat = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  const byWeekday = Array(7).fill(0) as number[];
  const byHour = Array(24).fill(0) as number[];
  for (const o of inRange) {
    const { weekday, hour } = saParts(paidDate(o));
    heat[weekday][hour]++;
    byWeekday[weekday]++;
    byHour[hour]++;
  }

  // Products, categories and baskets
  const prod = new Map<string, { name: string; units: number; revenue: number }>();
  const cats = new Map<string, number>();
  const pairs = new Map<string, number>();
  let multiItem = 0;
  for (const o of inRange) {
    const ids = new Set<string>();
    for (const i of o.items) {
      const key = i.productId ?? i.name;
      const p = i.productId ? productBy.get(i.productId) : undefined;
      const row = prod.get(key) ?? { name: p?.name ?? i.name, units: 0, revenue: 0 };
      row.units += i.quantity;
      row.revenue += i.price * i.quantity;
      prod.set(key, row);
      const cat = p?.category?.name ?? "Uncategorised";
      cats.set(cat, (cats.get(cat) ?? 0) + i.price * i.quantity);
      ids.add(key);
    }
    if (ids.size > 1) multiItem++;
    const list = [...ids].sort();
    for (let a = 0; a < list.length; a++)
      for (let b = a + 1; b < list.length; b++) {
        const k = `${list[a]}|${list[b]}`;
        pairs.set(k, (pairs.get(k) ?? 0) + 1);
      }
  }
  const nameOf = (key: string) => prod.get(key)?.name ?? productBy.get(key)?.name ?? key;
  const topProducts = [...prod.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const categories = [...cats.entries()].map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  const together = [...pairs.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([k, n]) => ({ a: nameOf(k.split("|")[0]), b: nameOf(k.split("|")[1]), orders: n }));

  // Customers: loyalty, repeat buying, lifetime value
  const byEmail = new Map<string, Date[]>();
  const spend = new Map<string, number>();
  for (const o of all) {
    const e = o.email.toLowerCase();
    (byEmail.get(e) ?? byEmail.set(e, []).get(e)!).push(paidDate(o));
    spend.set(e, (spend.get(e) ?? 0) + o.total);
  }
  const buyersEver = byEmail.size;
  const repeaters = [...byEmail.values()].filter((d) => d.length > 1).length;
  const gaps: number[] = [];
  for (const dates of byEmail.values()) {
    dates.sort((a, b) => a.getTime() - b.getTime());
    for (let i = 1; i < dates.length; i++) gaps.push((dates[i].getTime() - dates[i - 1].getTime()) / DAY);
  }
  const firstOrder = new Map([...byEmail.entries()].map(([e, d]) => [e, d[0].getTime()]));
  const repeatRevenue = inRange.filter((o) => paidDate(o).getTime() > firstOrder.get(o.email.toLowerCase())!).reduce((n, o) => n + o.total, 0);
  const revenue = inRange.reduce((n, o) => n + o.total, 0);

  // New vs returning buyers per month (last 12 months)
  const months = monthlyBuckets(12, now).map((m) => ({ key: m.key, label: m.label, first: 0, returning: 0 }));
  const monthBy = new Map(months.map((m) => [m.key, m]));
  for (const o of all) {
    const m = monthBy.get(saParts(paidDate(o)).month);
    if (!m) continue;
    if (paidDate(o).getTime() === firstOrder.get(o.email.toLowerCase())) m.first++;
    else m.returning++;
  }

  // Where orders go
  const provinces = new Map<string, { orders: number; revenue: number }>();
  for (const o of inRange) {
    let prov = "Not given";
    try {
      const a = JSON.parse(o.shippingAddress || "{}") as Record<string, string>;
      prov = (a.province || a.state || "").trim() || "Not given";
    } catch {
      /* keep "Not given" */
    }
    const row = provinces.get(prov) ?? { orders: 0, revenue: 0 };
    row.orders++;
    row.revenue += o.total;
    provinces.set(prov, row);
  }

  // Checkout completion and discounts
  const created = createdOrders.reduce((n, g) => n + g._count._all, 0);
  // Refunded orders were paid too; they count as completed checkouts
  const paid = createdOrders.filter((g) => g.paymentStatus === "paid" || g.paymentStatus === "refunded").reduce((n, g) => n + g._count._all, 0);
  const codes = new Map<string, { uses: number; discount: number }>();
  for (const o of inRange)
    if (o.discountCode) {
      const c = codes.get(o.discountCode) ?? { uses: 0, discount: 0 };
      c.uses++;
      c.discount += o.discount;
      codes.set(o.discountCode, c);
    }

  // Newsletter growth (cumulative subscribers at each month end)
  const growth = monthlyBuckets(12, now);
  const joined = subscribers.map((s) => saParts(s.newsletterAt ?? s.createdAt).month);
  for (const g of growth) {
    g.value = joined.filter((m) => m <= g.key).length; // subscribed by the end of that month
    g.count = joined.filter((m) => m === g.key).length; // joined that month
  }

  // Plain-English patterns
  const productSales = [...prod.values()].reduce((n, r) => n + r.revenue, 0);
  const patterns: { title: string; text: string }[] = [];
  if (inRange.length) {
    const top = Math.max(...byWeekday);
    const days = WEEKDAYS.filter((_, i) => byWeekday[i] === top);
    const dayList = days.length === 1 ? days[0] : `${days.slice(0, -1).join(", ")} and ${days.at(-1)} (tied)`;
    const share = `${Math.round((top / inRange.length) * 100)}%`;
    patterns.push({
      title: days.length === 1 ? "Busiest day" : "Busiest days",
      text: `${dayList} — ${top} of ${inRange.length} orders${days.length === 1 ? "" : " each"} (${share}).`,
    });
    patterns.push({ title: "Peak time", text: `${peakHoursText(byHour)} is when most orders are placed. Schedule emails and posts just before it.` });
    if (topProducts[0]) patterns.push({ title: "Best seller", text: `${short(topProducts[0].name)} — ${Math.round((topProducts[0].revenue / Math.max(1, productSales)) * 100)}% of product sales.` });
    if (together[0]) patterns.push({ title: "Bought together", text: `${short(together[0].a)} + ${short(together[0].b)} (${together[0].orders} order${together[0].orders === 1 ? "" : "s"}). A combo or bundle offer could work well.` });
    patterns.push({ title: "Loyal customers", text: `${Math.round((repeatRevenue / Math.max(1, revenue)) * 100)}% of revenue in this period came from repeat orders.` });
    const topProv = [...provinces.entries()].filter(([k]) => k !== "Not given").sort((a, b) => b[1].orders - a[1].orders)[0];
    if (topProv) patterns.push({ title: "Top region", text: `${topProv[0]} — ${topProv[1].orders} order${topProv[1].orders === 1 ? "" : "s"}.` });
    if (gaps.length) patterns.push({ title: "Re-order rhythm", text: `Returning customers re-order about every ${Math.round(median(gaps))} days. Refill reminders should land a few days before that.` });
  }

  return {
    revenue,
    orders: inRange.length,
    aov: inRange.length ? Math.round(revenue / inRange.length) : 0,
    units: inRange.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0),
    trend,
    trendBy: daily ? ("day" as const) : ("month" as const),
    heat,
    byWeekday,
    byHour,
    topProducts,
    categories,
    together,
    basketShare: inRange.length ? Math.round((multiItem / inRange.length) * 100) : 0,
    customers: {
      accounts: customers,
      buyersEver,
      repeatRate: buyersEver ? Math.round((repeaters / buyersEver) * 100) : 0,
      reorderDays: gaps.length ? Math.round(median(gaps)) : null,
      lifetimeValue: buyersEver ? Math.round([...spend.values()].reduce((a, b) => a + b, 0) / buyersEver) : 0,
      repeatRevenueShare: revenue ? Math.round((repeatRevenue / revenue) * 100) : 0,
    },
    newVsReturning: months,
    provinces: [...provinces.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.orders - a.orders),
    checkout: { created, paid, rate: created ? Math.round((paid / created) * 100) : null },
    codes: [...codes.entries()].map(([code, v]) => ({ code, ...v })).sort((a, b) => b.uses - a.uses).slice(0, 8),
    rewards: { claimed: rewardPromos._count._all, redeemed: rewardPromos._sum.usageCount ?? 0 },
    newsletter: { total: subscribers.length, growth },
    wishlist,
    patterns,
  };
}

function monthsSpan(all: PaidOrder[], now: Date) {
  if (!all.length) return 12;
  const first = Math.min(...all.map((o) => paidDate(o).getTime()));
  return Math.min(36, Math.ceil((now.getTime() - first) / (30.4 * DAY)) + 1);
}
function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
/** "20:00–21:00 (5 orders)", or the tied hours: "08:00 and 20:00 (3 orders each)". */
export function peakHoursText(byHour: number[]) {
  const max = Math.max(...byHour);
  if (max === 0) return "—";
  const peaks = byHour.map((n, h) => (n === max ? h : -1)).filter((h) => h >= 0);
  const n = `${max} order${max === 1 ? "" : "s"}`;
  if (peaks.length === 1) return `${hourLabel(peaks[0])}–${hourLabel((peaks[0] + 1) % 24)} (${n})`;
  const list = peaks.slice(0, 3).map(hourLabel);
  return `${list.slice(0, -1).join(", ")} and ${list.at(-1)}${peaks.length > 3 ? " and others" : ""} (${n} each)`;
}

export function hourLabel(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}
/** "Zenax — Natural Mind… (60 Capsules)" → "Zenax"; long names without a dash are trimmed. */
export function short(name: string) {
  const s = name.split(/\s+[-–—]\s+/)[0].replace(/\s*\([^)]*\)/g, "").trim();
  return s.length > 32 ? `${s.slice(0, 30).trimEnd()}…` : s;
}
export { WEEKDAYS };
