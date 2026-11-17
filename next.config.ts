import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its bundled font metrics from disk at runtime — keep it out of
  // the webpack bundle so those files resolve from node_modules.
  serverExternalPackages: ["pdfkit"],
  images: {
    // AVIF first, WebP as fallback: product PNGs drop from 1-2 MB to tens of KB on phones.
    formats: ["image/avif", "image/webp"],
    // Some older product photos still live on the Shopify CDN; let the optimizer resize those too.
    remotePatterns: [{ protocol: "https", hostname: "cdn.shopify.com" }],
  },
  // Long-lived cache for static files in /public (brand, hero, images). _next/static is already immutable.
  // These file names are not content-hashed: if one is ever replaced, give the new file a new name.
  async headers() {
    const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];
    return ["brand", "hero", "img", "categories", "payment", "intro", "vendor"].map((d) => ({ source: `/${d}/:path*`, headers: immutable }));
  },
};

export default nextConfig;
