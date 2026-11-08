import Image from "next/image";

/**
 * Product photo that is resized and converted by Next's image optimizer
 * (the stored uploads are large PNGs). Store-CDN images (full URLs) are not on
 * the optimizer's allow-list, so they fall back to a lazy plain <img>.
 */
export function ProductImg({
  src,
  alt,
  sizes = "(max-width: 700px) 45vw, 280px",
  eager = false,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  eager?: boolean;
  className?: string;
}) {
  if (!src.startsWith("/")) {
    // eslint-disable-next-line @next/next/no-img-element -- remote CDN image, not optimizable here
    return <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" className={className} />;
  }
  return eager ? (
    <Image src={src} alt={alt} width={560} height={560} sizes={sizes} preload className={className} />
  ) : (
    <Image src={src} alt={alt} width={560} height={560} sizes={sizes} loading="lazy" className={className} />
  );
}
