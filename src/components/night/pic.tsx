import Image from "next/image";

/** Local uploads and the Shopify CDN go through Next's image optimizer (AVIF/WebP, resized). */
export function canOptimize(src: string) {
  return src.startsWith("/") || src.startsWith("https://cdn.shopify.com/");
}

/**
 * Product photo, resized and converted by Next's image optimizer (the stored uploads are
 * large PNGs). Always square with object-contain, so bottles are never cropped.
 * Any other remote host falls back to a lazy plain <img> with fixed dimensions.
 */
export function ProductImg({
  src,
  alt,
  sizes = "(max-width: 700px) 45vw, 280px",
  eager = false,
  above = false,
  size = 560,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  /** preload + high priority: only the one hero image of a page */
  eager?: boolean;
  /** in the first screen but not the hero: load straight away, no preload */
  above?: boolean;
  size?: number;
  className?: string;
}) {
  if (!canOptimize(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- unknown remote host, not on the optimizer allow-list
      <img src={src} alt={alt} width={size} height={size} loading={eager || above ? "eager" : "lazy"} decoding="async" className={className} />
    );
  }
  return eager ? (
    <Image src={src} alt={alt} width={size} height={size} sizes={sizes} preload className={className} />
  ) : (
    <Image src={src} alt={alt} width={size} height={size} sizes={sizes} loading={above ? "eager" : "lazy"} className={className} />
  );
}
