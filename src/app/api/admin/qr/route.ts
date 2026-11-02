import { NextRequest } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

const APP_URL = process.env.APP_URL || "https://www.greengenepharma.co.za";

/**
 * Generates a QR code that points at a product's public page, for printing on
 * the product label. e.g. /api/admin/qr?slug=estrogene&format=svg&download=1
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get("slug") || "").trim();
  const format = searchParams.get("format") === "svg" ? "svg" : "png";
  const download = searchParams.get("download") === "1";
  const size = Math.min(
    2048,
    Math.max(120, parseInt(searchParams.get("size") || "512", 10) || 512)
  );

  if (!slug) return new Response("Missing slug", { status: 400 });

  const target = `${APP_URL.replace(/\/$/, "")}/products/${slug}`;
  const opts = {
    errorCorrectionLevel: "M" as const,
    margin: 2,
    width: size,
    color: { dark: "#000000", light: "#ffffff" },
  };

  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (download)
    headers["Content-Disposition"] = `attachment; filename="${slug}-qr.${format}"`;

  if (format === "svg") {
    const svg = await QRCode.toString(target, { ...opts, type: "svg" });
    return new Response(svg, {
      headers: { ...headers, "Content-Type": "image/svg+xml" },
    });
  }

  const buf = await QRCode.toBuffer(target, { ...opts, type: "png" });
  return new Response(new Uint8Array(buf), {
    headers: { ...headers, "Content-Type": "image/png" },
  });
}
