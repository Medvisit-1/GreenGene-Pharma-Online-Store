import { prisma } from "@/lib/prisma";

export type Rating = { avg: number; count: number };

/**
 * Average rating + count of APPROVED reviews for a set of products,
 * fetched in a single grouped query. Products with no reviews are absent.
 */
export async function getRatingMap(ids: string[]): Promise<Map<string, Rating>> {
  const map = new Map<string, Rating>();
  if (!ids.length) return map;
  try {
    const grouped = await prisma.review.groupBy({
      by: ["productId"],
      where: { productId: { in: ids }, status: "approved" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    for (const g of grouped) {
      map.set(g.productId, { avg: g._avg.rating ?? 0, count: g._count._all });
    }
  } catch {
    // DB unavailable (build prerender) — return empty map
  }
  return map;
}
