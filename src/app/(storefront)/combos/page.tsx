import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getRatingMap } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Combos",
  description: "Save more with GreenGene Pharma combo deals.",
};

export default async function CombosPage() {
  const combos = await prisma.product.findMany({
    where: { active: true, isCombo: true },
    orderBy: { createdAt: "desc" },
  });

  const ratings = await getRatingMap(combos.map((p) => p.id));
  const withRatings = combos.map((p) => ({
    ...p,
    rating: ratings.get(p.id)?.avg,
    reviewCount: ratings.get(p.id)?.count,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <nav className="mb-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span className="px-1.5">/</span>
          <span className="text-foreground">Combos</span>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight">Combos</h1>
        <p className="mt-1 text-muted-foreground">
          Bundled deals — pair the perfect products and save more.
        </p>
      </div>

      {withRatings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
          No combos available right now — check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {withRatings.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
