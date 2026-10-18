import "server-only";
import { prisma } from "@/lib/prisma";

export type Period = "30d" | "90d" | "12m" | "ytd" | "all";
export const PERIODS: { id: Period; label: string }[] = [
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "12m", label: "Last 12 months" },
  { id: "ytd", label: "This year" },
  { id: "all", label: "All time" },
];

const DAY = 864e5;
const SAST = 2 * 36e5; // South Africa is UTC+2 all year

/** Midnight (South African time) at the start of the SA calendar day `daysBack` days before `now`. */
export function saDayStart(now: Date, daysBack = 0): Date {
  const sa = new Date(now.getTime() + SAST);
  return new Date(Date.UTC(sa.getUTCFullYear(), sa.getUTCMonth(), sa.getUTCDate() - daysBack) - SAST);
}

/**
 * Period start (and the matching previous period, for comparison). Periods are
 * whole South African calendar days / months, so a "last 30 days" chart and its
 * totals always cover exactly the same orders.
 */
export function periodRange(p: Period, now = new Date()): { from: Date | null; prevFrom: Date | null; prevTo: Date | null } {
  const t = now.getTime();
  if (p === "all") return { from: null, prevFrom: null, prevTo: null };
  if (p === "30d" || p === "90d") {
    const n = p === "30d" ? 30 : 90;
    const from = saDayStart(now, n - 1);
    return { from, prevFrom: new Date(from.getTime() - n * DAY), prevTo: from };
  }
  if (p === "12m") {
    const sa = new Date(t + SAST);
    const from = new Date(Date.UTC(sa.getUTCFullYear(), sa.getUTCMonth() - 11, 1) - SAST);
    return { from, prevFrom: new Date(Date.UTC(sa.getUTCFullYear(), sa.getUTCMonth() - 23, 1) - SAST), prevTo: from };
  }
  if (p === "ytd") {
    const y = new Date(t + SAST).getUTCFullYear();
    const from = new Date(Date.UTC(y, 0, 1) - SAST);
    const len = t - from.getTime();
    return { from, prevFrom: new Date(Date.UTC(y - 1, 0, 1) - SAST), prevTo: new Date(Date.UTC(y - 1, 0, 1) - SAST + len) };
  }
  return { from: null, prevFrom: null, prevTo: null };
}

type PaidOrder = Awaited<ReturnType<typeof loadPaidOrders>>[number];

async function loadPaidOrders() {
  return prisma.order.findMany({
    where: { paymentStatus: "paid" },
    select: {
      id: true, email: true, total: true, discount: true, discountCode: true, paymentMethod: true,
      createdAt: true, paidAt: true,
      items: { select: { productId: true, name: true, price: true, quantity: true } },
    },
  });
}

/**
 * Reports count an order on the day the customer placed it. (paidAt is when the
 * payment was confirmed — for EFT/manual payments that is when someone clicked
 * "paid" in the admin, which would bunch orders onto that day.)
 */
const paidDate = (o: { createdAt: Date }) => o.createdAt;

function summarise(orders: PaidOrder[]) {
  const revenue = orders.reduce((n, o) => n + o.total, 0);
  const units = orders.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0);
  return { revenue, orders: orders.length, units, aov: orders.length ? Math.round(revenue / orders.length) : 0 };
}

export async function salesReport(p: Period, now = new Date()) {
  const { from, prevFrom, prevTo } = periodRange(p, now);
  const all = await loadPaidOrders();
  const inRange = (o: PaidOrder, a: Date | null, b: Date | null) => {
    const d = paidDate(o).getTime();
    return (!a || d >= a.getTime()) && (!b || d < b.getTime());
  };
  const current = all.filter((o) => inRange(o, from, null));
  const previous = prevFrom ? all.filter((o) => inRange(o, prevFrom, prevTo)) : null;

  // New vs returning: was this the customer's first ever paid order?
  const firstPaid = new Map<string, number>();
  for (const o of all) {
    const e = o.email.toLowerCase();
    const d = paidDate(o).getTime();
    if (!firstPaid.has(e) || d < firstPaid.get(e)!) firstPaid.set(e, d);
  }
  const newCustomers = new Set(
    current.filter((o) => firstPaid.get(o.email.toLowerCase()) === paidDate(o).getTime()).map((o) => o.email.toLowerCase())
  ).size;
  const buyers = new Set(current.map((o) => o.email.toLowerCase())).size;

  // Best sellers (line value before order-level discounts)
  const products = new Map<string, { name: string; productId: string | null; units: number; revenue: number }>();
  for (const o of current) {
    for (const i of o.items) {
      const key = i.productId ?? i.name;
      const row = products.get(key) ?? { name: i.name, productId: i.productId, units: 0, revenue: 0 };
      row.units += i.quantity;
      row.revenue += i.price * i.quantity;
      products.set(key, row);
    }
  }
  const productIds = [...products.values()].map((r) => r.productId).filter((x): x is string => !!x);
  const names = new Map(
    (await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } })).map((p) => [p.id, p.name])
  );
  const bestSellers = [...products.values()]
    .map((r) => ({ ...r, name: (r.productId && names.get(r.productId)) || r.name }))
    .sort((a, b) => b.revenue - a.revenue);

  // Top customers
  const custMap = new Map<string, { email: string; orders: number; revenue: number }>();
  for (const o of current) {
    const e = o.email.toLowerCase();
    const row = custMap.get(e) ?? { email: e, orders: 0, revenue: 0 };
    row.orders++;
    row.revenue += o.total;
    custMap.set(e, row);
  }
  const topEmails = [...custMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const custIds = new Map(
    (await prisma.customer.findMany({ where: { email: { in: topEmails.map((c) => c.email) } }, select: { id: true, email: true, name: true } })).map((c) => [c.email, c])
  );
  const topCustomers = topEmails.map((c) => ({ ...c, id: custIds.get(c.email)?.id ?? null, name: custIds.get(c.email)?.name ?? null }));

  // Payment methods & discount codes
  const methods = new Map<string, { orders: number; revenue: number }>();
  const codes = new Map<string, { uses: number; discount: number }>();
  for (const o of current) {
    const m = methods.get(o.paymentMethod ?? "other") ?? { orders: 0, revenue: 0 };
    m.orders++;
    m.revenue += o.total;
    methods.set(o.paymentMethod ?? "other", m);
    if (o.discountCode) {
      const c = codes.get(o.discountCode) ?? { uses: 0, discount: 0 };
      c.uses++;
      c.discount += o.discount;
      codes.set(o.discountCode, c);
    }
  }

  const refunds = await prisma.order.aggregate({
    where: { paymentStatus: "refunded", ...(from ? { createdAt: { gte: from } } : {}) },
    _count: { _all: true },
    _sum: { total: true },
  });

  // Last 12 calendar months (SA time), always — the trend view
  const monthly: { key: string; label: string; revenue: number; orders: number }[] = [];
  const nowSa = new Date(now.getTime() + SAST);
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(nowSa.getUTCFullYear(), nowSa.getUTCMonth() - i, 1));
    monthly.push({
      key: d.toISOString().slice(0, 7),
      label: d.toLocaleDateString("en-ZA", { month: "short", year: i === 11 || d.getUTCMonth() === 0 ? "2-digit" : undefined, timeZone: "UTC" }),
      revenue: 0,
      orders: 0,
    });
  }
  const byKey = new Map(monthly.map((m) => [m.key, m]));
  for (const o of all) {
    const m = byKey.get(new Date(paidDate(o).getTime() + SAST).toISOString().slice(0, 7));
    if (m) {
      m.revenue += o.total;
      m.orders++;
    }
  }

  return {
    summary: summarise(current),
    previous: previous ? summarise(previous) : null,
    discounts: current.reduce((n, o) => n + o.discount, 0),
    buyers,
    newCustomers,
    returningCustomers: buyers - newCustomers,
    bestSellers,
    topCustomers,
    methods: [...methods.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue),
    codes: [...codes.entries()].map(([code, v]) => ({ code, ...v })).sort((a, b) => b.uses - a.uses),
    refunds: { count: refunds._count._all, amount: refunds._sum.total ?? 0 },
    monthly,
  };
}
