import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Truck, ShieldCheck, RotateCcw, Check, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages } from "@/lib/utils";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCart } from "@/components/add-to-cart";
import { ProductCard } from "@/components/product-card";
import { MarketplaceLinks } from "@/components/marketplace-links";
import { Stars } from "@/components/stars";
import { ReviewForm } from "@/components/review-form";
import { getRatingMap } from "@/lib/reviews";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product || !product.active) notFound();

  const images = parseImages(product.images);
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;

  const related = await prisma.product.findMany({
    where: {
      active: true,
      categoryId: product.categoryId,
      id: { not: product.id },
    },
    take: 4,
  });

  const relatedRatings = await getRatingMap(related.map((p) => p.id));
  const relatedWithRatings = related.map((p) => ({
    ...p,
    rating: relatedRatings.get(p.id)?.avg,
    reviewCount: relatedRatings.get(p.id)?.count,
  }));

  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "approved" },
    orderBy: { createdAt: "desc" },
  });
  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((n, r) => n + r.rating, 0) / reviewCount
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-brand-700">Home</Link>
        <span className="px-1.5">/</span>
        <Link href="/products" className="hover:text-brand-700">Products</Link>
        {product.category && (
          <>
            <span className="px-1.5">/</span>
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-brand-700"
            >
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={images} name={product.name} />

        <div>
          {product.brand && (
            <span className="text-sm font-semibold uppercase tracking-wide text-brand-500">
              {product.brand}
            </span>
          )}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {product.name}
          </h1>

          {reviewCount > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm">
              <Stars rating={avgRating} />
              <span className="text-muted-foreground">
                {avgRating.toFixed(1)} · {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </span>
            </a>
          )}

          <div className="mt-4 flex items-center gap-3">
            <span className="text-3xl font-semibold text-brand-700">
              {formatPrice(product.price)}
            </span>
            {onSale && (
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            {onSale && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-brand-900">
                Save {formatPrice(product.compareAtPrice! - product.price)}
              </span>
            )}
          </div>

          <p className="mt-2 text-sm">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-brand-600">
                <Check className="h-4 w-4" /> In stock
                {product.stock <= 10 && ` — only ${product.stock} left`}
              </span>
            ) : (
              <span className="font-medium text-red-600">Out of stock</span>
            )}
          </p>

          {product.shortDescription && (
            <p className="mt-5 text-foreground/80">{product.shortDescription}</p>
          )}

          <div className="mt-7">
            <AddToCart
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: images[0],
                stock: product.stock,
              }}
            />
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 rounded-2xl border border-border p-4 sm:grid-cols-3">
            {[
              { icon: Truck, text: "Fast nationwide delivery" },
              { icon: ShieldCheck, text: "Genuine products" },
              { icon: RotateCcw, text: "Easy returns" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-2 text-xs text-muted-foreground">
                <f.icon className="h-4 w-4 shrink-0 text-brand-600" />
                {f.text}
              </div>
            ))}
          </div>

          {product.description && (
            <div className="mt-8">
              <h2 className="mb-2 text-lg font-bold">Description</h2>
              <p className="whitespace-pre-line leading-relaxed text-foreground/80">
                {product.description}
              </p>
            </div>
          )}

          {product.sku && (
            <p className="mt-6 text-xs text-muted-foreground">SKU: {product.sku}</p>
          )}
        </div>
      </div>

      {/* Also available at (marketplace links) */}
      <MarketplaceLinks
        takealotUrl={product.takealotUrl}
        amazonUrl={product.amazonUrl}
        bobshopUrl={product.bobshopUrl}
      />

      {/* Reviews */}
      <section id="reviews" className="mt-16 scroll-mt-24">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">Customer reviews</h2>
          {reviewCount > 0 && (
            <div className="flex items-center gap-2">
              <Stars rating={avgRating} size={20} />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} out of 5 · {reviewCount} review{reviewCount === 1 ? "" : "s"}
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            {reviewCount === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-surface p-5">
                  <div className="flex items-center justify-between">
                    <Stars rating={r.rating} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-ZA")}
                    </span>
                  </div>
                  {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
                  <p className="mt-1 text-sm text-foreground/80">{r.body}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-xs font-medium text-brand-700">— {r.author}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <ReviewForm productId={product.id} />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedWithRatings.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
