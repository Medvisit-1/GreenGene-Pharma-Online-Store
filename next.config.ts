import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its bundled font metrics from disk at runtime — keep it out of
  // the webpack bundle so those files resolve from node_modules.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
