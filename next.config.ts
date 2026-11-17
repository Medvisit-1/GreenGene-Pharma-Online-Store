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
};

export default nextConfig;
