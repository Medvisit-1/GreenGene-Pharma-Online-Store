import Link from "next/link";
import type { Metadata } from "next";
import { Tag, Copy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Promotions & Deals",
  description: "Save with current discount codes and special offers at GreenGene Pharma.",
};

export default async function PromotionsPage() {
  const [promos, onSale] = await Promise.all([
    prisma.promotion.findMany({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true, compareAtPrice: { not: null } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Banner */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-500 px-8 py-12 text-center text-white">
        <Tag className="mx-auto h-8 w-8" />
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          Promotions & Deals
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-white/85">
          Grab a bargain — use one of our discount codes at checkout and shop our
          current specials below.
        </p>
      </div>

      {/* Discount codes */}
      {promos.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-xl font-bold tracking-tight">Discount codes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 p-5"
              >
                <div>
                  <p className="text-lg font-semibold tracking-wide text-brand-700">
                    {p.code}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {p.type === "percent"
                      ? `${p.value}% off`
                      : `${formatPrice(p.value)} off`}
                    {p.minSpend > 0 && ` orders over ${formatPrice(p.minSpend)}`}
                  </p>
                </div>
                <Copy className="h-5 w-5 text-brand-400" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* On-sale products */}
      <section className="mt-12">
        <h2 className="mb-5 text-xl font-bold tracking-tight">On sale now</h2>
        {onSale.length === 0 ? (
          <p className="text-muted-foreground">No specials right now — check back soon!</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {onSale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
        <div className="mt-8 text-center">
          <Link href="/products" className="text-sm font-semibold text-brand-700 hover:underline">
            Browse all products →
          </Link>
        </div>
      </section>
    </div>
  );
}
