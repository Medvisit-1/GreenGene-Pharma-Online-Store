import "server-only";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CustomerRow = Customer & {
  paidOrders: number;
  spent: number; // cents
  lastOrderAt: Date | null;
};

export type CustomerFilter = "all" | "buyers" | "subscribers" | "no-orders";
export type CustomerSort = "newest" | "spent" | "orders" | "recent";

/** Every customer with their paid-order count, total spent and last order (by email). */
export async function customerRows(opts: { q?: string; filter?: CustomerFilter; sort?: CustomerSort } = {}): Promise<CustomerRow[]> {
  const q = opts.q?.trim();
  const [customers, stats] = await Promise.all([
    prisma.customer.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : undefined,
    }),
    prisma.order.groupBy({
      by: ["email"],
      where: { paymentStatus: "paid" },
      _count: { _all: true },
      _sum: { total: true },
      _max: { createdAt: true },
    }),
  ]);
  const byEmail = new Map(stats.map((s) => [s.email.toLowerCase(), s]));
  let rows: CustomerRow[] = customers.map((c) => {
    const s = byEmail.get(c.email.toLowerCase());
    return { ...c, paidOrders: s?._count._all ?? 0, spent: s?._sum.total ?? 0, lastOrderAt: s?._max.createdAt ?? null };
  });

  if (opts.filter === "buyers") rows = rows.filter((r) => r.paidOrders > 0);
  if (opts.filter === "subscribers") rows = rows.filter((r) => r.newsletter);
  if (opts.filter === "no-orders") rows = rows.filter((r) => r.paidOrders === 0);

  const t = (d: Date | null) => d?.getTime() ?? 0;
  const sorters: Record<CustomerSort, (a: CustomerRow, b: CustomerRow) => number> = {
    newest: (a, b) => t(b.createdAt) - t(a.createdAt),
    spent: (a, b) => b.spent - a.spent || b.paidOrders - a.paidOrders,
    orders: (a, b) => b.paidOrders - a.paidOrders || b.spent - a.spent,
    recent: (a, b) => t(b.lastOrderAt) - t(a.lastOrderAt),
  };
  return rows.sort(sorters[opts.sort ?? "newest"]);
}

export function parseAddress(json: string | null | undefined): Record<string, string> {
  try {
    return JSON.parse(json || "{}");
  } catch {
    return {};
  }
}
