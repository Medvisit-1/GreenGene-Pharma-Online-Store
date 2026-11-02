import { notFound } from "next/navigation";
import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { getSettings } from "@/lib/settings";
import { tiersFromSettings } from "@/lib/wholesale";
import { ensureBundledInfoPacks } from "@/lib/info-packs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

const APP_URL = process.env.APP_URL || "https://www.greengenepharma.co.za";

export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await ensureBundledInfoPacks();
  const [product, categories, s] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getSettings(),
  ]);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Edit product</h1>
        <Link href={`/products/${product.slug}`} target="_blank" className="text-sm font-medium text-brand-700 hover:underline">
          View in store →
        </Link>
      </div>
      <ProductForm product={product} categories={categories} wholesaleTiers={tiersFromSettings(s)} />

      {/* Label QR code */}
      <div className="max-w-3xl rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-1 font-bold">Label QR code</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Scanning this QR opens{" "}
          <span className="font-medium break-all text-brand-700">
            {APP_URL.replace(/\/$/, "")}/products/{product.slug}
          </span>
          . Download it and place it on the label artwork. <strong>SVG</strong> is best for print
          (stays sharp at any size); <strong>PNG</strong> is a high-resolution image.
        </p>
        <div className="flex flex-wrap items-center gap-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/admin/qr?slug=${encodeURIComponent(product.slug)}&format=png&size=320`}
            alt={`QR code for ${product.name}`}
            width={168}
            height={168}
            className="rounded-xl border border-border bg-white p-2"
          />
          <div className="flex flex-col gap-2">
            <a
              href={`/api/admin/qr?slug=${encodeURIComponent(product.slug)}&format=png&size=1200&download=1`}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Download className="h-4 w-4" /> Download PNG (hi-res)
            </a>
            <a
              href={`/api/admin/qr?slug=${encodeURIComponent(product.slug)}&format=svg&download=1`}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4" /> Download SVG (vector)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
