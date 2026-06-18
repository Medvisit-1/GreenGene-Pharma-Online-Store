import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
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

  const where: Prisma.ProductWhereInput = { active: true };
  if (category) where.category = { slug: category };
  if (featured) where.featured = true;
  if (q)
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { brand: { contains: q } },
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

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category, q, sort, featured, ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/products?${s}` : "/products";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
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

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Search */}
          <form action="/products" method="get" className="relative">
            {category && <input type="hidden" name="category" value={category} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search products…"
              className="w-full rounded-full border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </form>

          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-brand-800">
              Categories
            </h3>
            <ul className="space-y-1 text-sm">
              <li>
                <Link
                  href={buildQuery({ category: undefined })}
                  className={`block rounded-lg px-3 py-2 ${
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
                    className={`block rounded-lg px-3 py-2 ${
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
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {products.length} product{products.length === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2 text-sm">
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
                  className={`rounded-full px-3 py-1 ${
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
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
