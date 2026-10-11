import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseImages } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ReorderClient } from "@/components/reorder-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Buy again", robots: { index: false } };

type Search = Promise<{ items?: string }>;

/**
 * "Buy again" / refill landing page. `?items=<productId>:<qty>,...` puts those
 * products (at today's price and stock) into the cart, then opens the cart.
 */
export default async function ReorderPage({ searchParams }: { searchParams: Search }) {
  const { items = "" } = await searchParams;
  const wanted = new Map<string, number>();
  for (const part of items.split(",").slice(0, 30)) {
    const [id, q] = part.split(":");
    const qty = Math.max(1, Math.min(20, parseInt(q, 10) || 1));
    if (id && /^[a-z0-9]{8,40}$/i.test(id)) wanted.set(id, (wanted.get(id) ?? 0) + qty);
  }
  const products = wanted.size
    ? await prisma.product.findMany({ where: { id: { in: [...wanted.keys()] } } })
    : [];

  const available = products
    .filter((p) => p.active && p.stock > 0)
    .map((p) => ({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: parseImages(p.images)[0],
      stock: p.stock,
      quantity: Math.min(wanted.get(p.id) ?? 1, p.stock),
    }));
  const unavailable = products
    .filter((p) => !p.active || p.stock <= 0)
    .map((p) => ({ id: p.id, name: p.name, slug: p.slug, active: p.active }));

  if (!available.length && !unavailable.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Nothing to add</h1>
        <p className="mt-2 text-muted-foreground">We couldn&apos;t find those products any more.</p>
        <Link href="/products" className="mt-6 inline-block"><Button>Browse our range</Button></Link>
      </div>
    );
  }

  return <ReorderClient available={available} unavailable={unavailable} />;
}
