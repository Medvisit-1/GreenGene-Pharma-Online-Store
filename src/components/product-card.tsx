import Link from "next/link";
import { formatPrice, parseImages } from "@/lib/utils";
import { QuickAddButton } from "@/components/quick-add-button";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  images: string;
  stock: number;
  brand?: string | null;
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const images = parseImages(product.images);
  const cover = images[0];
  const onSale =
    product.compareAtPrice != null && product.compareAtPrice > product.price;
  const outOfStock = product.stock <= 0;

  return (
    <div className="animate-fade-in-up group flex flex-col">
      {/* Transparent image — sits directly on the page background */}
      <Link href={`/products/${product.slug}`} className="relative block aspect-square">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl bg-surface">
            <span className="text-5xl font-black text-brand-300">
              {product.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {onSale && (
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-brand-800 shadow-sm">
              Sale
            </span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-brand-800 shadow-sm">
              Sold out
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-3 text-center">
        {product.brand && (
          <span className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-brand-500">
            {product.brand}
          </span>
        )}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-semibold leading-snug text-brand-800 group-hover:text-brand-600">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <span className="text-base font-bold text-brand-700">
            {formatPrice(product.price)}
          </span>
          {onSale && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>
        <div className="mt-3">
          <QuickAddButton
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: cover,
              stock: product.stock,
            }}
          />
        </div>
      </div>
    </div>
  );
}
