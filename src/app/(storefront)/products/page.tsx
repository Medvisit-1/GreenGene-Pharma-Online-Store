import Link from "next/link";
import { after } from "next/server";
import { accentClass, accentFor } from "@/lib/themes";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getRatingMap } from "@/lib/reviews";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse all GreenGene Pharma products.",
};

type SearchParams = Promise<{
  category?: string;
  q?: string;
  sort?: string;
  featured?: string;
}>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { category, q, sort, featured } = await searchParams;

  // Combos live under their own /combos section, not the general product grid
  const where: Prisma.ProductWhereInput = { active: true, isCombo: false };
  if (category) where.category = { slug: category };
  if (featured) where.featured = true;
  if (q)
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { contains: q, mode: "insensitive" } },
    ];

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price-asc"
      ? { price: "asc" }
      : sort === "price-desc"
        ? { price: "desc" }
        : sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [products, categories, activeCategory] = await Promise.all([
    prisma.product.findMany({ where, orderBy }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    category
      ? prisma.category.findUnique({ where: { slug: category } })
      : Promise.resolve(null),
  ]);

  // Remember what people search for (Admin → Customer voice). Only the first
  // results page, not re-sorts or category clicks within a search.
  const term = q?.trim().toLowerCase().slice(0, 80);
  if (term && !sort && !category) {
    after(() => prisma.searchQuery.create({ data: { term, results: products.length } }).catch(() => {}));
  }

  const ratings = await getRatingMap(products.map((p) => p.id));
  const productsWithRatings = products.map((p) => ({
    ...p,
    rating: ratings.get(p.id)?.avg,
    reviewCount: ratings.get(p.id)?.count,
  }));

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category, q, sort, featured, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className={`mx-auto max-w-7xl px-4 py-10 ${activeCategory ? accentClass(accentFor({ name: "", category: activeCategory })) : ""}`}>
      {/* Heading */}
      <div className="mb-8">
        <nav className="mb-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-brand-700">Home</Link>
          <span className="px-1.5">/</span>
          <span className="text-foreground">
            {activeCategory ? activeCategory.name : "All Products"}
          </span>
        </nav>
        <h1 className="text-3xl font-semibold tracking-tight">
          {activeCategory ? activeCategory.name : featured ? "Featured Products" : "All Products"}
        </h1>
        {activeCategory?.description && (
          <p className="mt-1 text-muted-foreground">{activeCategory.description}</p>
        )}
      </div>

      {/* minmax(0,1fr): long rows (sort chips) can no longer push the column past the right edge on phones */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
        {/* Sidebar */}
        <aside className="min-w-0 space-y-5 lg:space-y-6">
          {/* Search */}
          <form action="/products" method="get" className="relative">
            {category && <input type="hidden" name="category" value={category} />}
            <input
              type="search"
              aria-label="Search products"
              enterKeyHint="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search products…"
              className="h-12 w-full rounded-full border border-border bg-white px-4 text-base outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 lg:h-11 lg:text-sm"
            />
          </form>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-800 max-lg:sr-only">
              Categories
            </h3>
            {/* phones: one row of swipeable category chips; desktop: the sidebar list */}
            <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 text-sm [scrollbar-width:none] lg:mx-0 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
              <li>
                <Link
                  href={buildQuery({ category: undefined })}
                  className={`flex min-h-11 items-center whitespace-nowrap rounded-full border border-border px-4 lg:block lg:min-h-0 lg:rounded-lg lg:border-0 lg:px-3 lg:py-2 ${
                    !category ? "bg-brand-50 font-semibold text-brand-700" : "hover:bg-muted"
                  }`}
                >
                  All Products
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={buildQuery({ category: c.slug })}
                    className={`flex min-h-11 items-center whitespace-nowrap rounded-full border border-border px-4 lg:block lg:min-h-0 lg:rounded-lg lg:border-0 lg:px-3 lg:py-2 ${
                      category === c.slug
                        ? "bg-brand-50 font-semibold text-brand-700"
                        : "hover:bg-muted"
                    }`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
              {products.length} product{products.length === 1 ? "" : "s"}
            </p>
            <div className="-mx-4 flex max-w-[calc(100%+2rem)] items-center gap-2 overflow-x-auto px-4 text-sm [scrollbar-width:none] sm:mx-0 sm:max-w-none sm:px-0">
              <span className="text-muted-foreground">Sort:</span>
              {[
                { key: "", label: "Newest" },
                { key: "price-asc", label: "Price ↑" },
                { key: "price-desc", label: "Price ↓" },
                { key: "name", label: "A–Z" },
              ].map((s) => (
                <Link
                  key={s.key}
                  href={buildQuery({ sort: s.key || undefined })}
                  className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 lg:min-h-9 ${
                    (sort ?? "") === s.key
                      ? "bg-brand-600 text-white"
                      : "border border-border hover:bg-muted"
                  }`}
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">
              No products found. Try a different search or category.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {productsWithRatings.map((p, i) => (
                <ProductCard key={p.id} product={p} above={i < 2} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
