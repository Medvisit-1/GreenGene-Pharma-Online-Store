import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Read-only feed for the GreenGene Stock tracker (separate app on Netlify).
 *
 * GET /api/stock-feed?since=<ISO date>
 * Header: Authorization: Bearer <STOCK_FEED_KEY>
 *
 * Returns products (with stock) and paid order lines since `since`.
 * Never returns customer details. Changes nothing.
 */
export const dynamic = "force-dynamic";

function keyMatches(given: string, expected: string) {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  const expected = process.env.STOCK_FEED_KEY ?? "";
  // Feature is off until a strong key is configured
  if (expected.length < 32) return new Response("Not found", { status: 404 });

  const ip = clientIp(req);
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!keyMatches(given, expected)) {
    // Slow down guessing: 10 bad attempts per IP per 15 minutes
    if (!rateLimit(`stock-feed:${ip}`, 10, 15 * 60_000)) return new Response("Too many requests", { status: 429 });
    return new Response("Unauthorized", { status: 401 });
  }

  // Order lines window: from `since`, at most 400 days back
  const sinceParam = new URL(req.url).searchParams.get("since");
  const floor = new Date(Date.now() - 400 * 864e5);
  let since = sinceParam ? new Date(sinceParam) : floor;
  if (isNaN(since.getTime()) || since < floor) since = floor;

  const [products, lines] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true, name: true, sku: true, price: true, stock: true, active: true,
        description: true, howToUse: true,
        category: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.orderItem.findMany({
      where: { order: { stockDeducted: true, paidAt: { gte: since } } },
      select: {
        id: true, productId: true, quantity: true, price: true, name: true,
        order: { select: { orderNumber: true, paidAt: true } },
      },
      orderBy: { order: { paidAt: "asc" } },
      take: 5000,
    }),
  ]);

  return Response.json(
    {
      generatedAt: new Date().toISOString(),
      products: products.map((p) => ({
        id: p.id, name: p.name, sku: p.sku, price: p.price, stock: p.stock, active: p.active,
        category: p.category?.name ?? null, description: p.description, howToUse: p.howToUse,
      })),
      lines: lines.map((l) => ({
        id: l.id, productId: l.productId, quantity: l.quantity, price: l.price, name: l.name,
        orderNumber: l.order.orderNumber, paidAt: l.order.paidAt,
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
