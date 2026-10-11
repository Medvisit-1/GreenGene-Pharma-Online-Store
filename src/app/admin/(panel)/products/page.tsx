import Link from "next/link";
import { Plus, Pencil, Layers, Wand2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, parseImages } from "@/lib/utils";
import { deleteProduct, splitProductDescriptions } from "@/app/admin/actions";
import { splitDescription } from "@/lib/product-info";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ split?: string }> }) {
  const { split } = await searchParams;
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });
  // Products whose description still holds a dosage section or ⚠ warnings
  const splittable = products.filter((p) => {
    if (p.howToUse || p.warnings || !p.description) return false;
    const r = splitDescription(p.description);
    return !!(r.howToUse || r.warnings);
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products ({products.length})</h1>
        <div className="flex gap-2">
          <Link href="/admin/products/new?combo=1">
            <Button variant="outline"><Layers className="h-4 w-4" /> Create combo</Button>
          </Link>
          <Link href="/admin/products/new">
            <Button><Plus className="h-4 w-4" /> Add product</Button>
          </Link>
        </div>
      </div>

      {split !== undefined && (
        <p role="status" className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          {split === "0" ? "Nothing to move." : `Done — ${split} product${split === "1" ? "" : "s"} now have their own "How to use" and "Warnings" sections. Open a product to check or edit them.`}
        </p>
      )}

      {splittable > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-brand-300 bg-white px-4 py-3 text-sm">
          <p>
            <strong>{splittable} product{splittable === 1 ? "" : "s"}</strong> have dosage instructions or ⚠ warnings inside
            the description. Move them into the new <em>How to use</em> and <em>Warnings</em> sections on the product page?
          </p>
          <form action={splitProductDescriptions}>
            <ConfirmSubmit
              message={`Move the dosage and warning text of ${splittable} products into their own sections? You can edit each product afterwards.`}
              className="inline-flex h-9 items-center gap-2 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Wand2 className="h-4 w-4" /> Move them now
            </ConfirmSubmit>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => {
              const img = parseImages(p.images)[0];
              return (
                <tr key={p.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                        {img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt="" className="h-full w-full object-contain" />
                        )}
                      </div>
                      <span className="line-clamp-1 max-w-xs font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-medium">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock === 0 ? "text-red-600" : ""}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.active ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"}`}>
                        {p.active ? "Active" : "Hidden"}
                      </span>
                      {p.featured && (
                        <span className="rounded-full bg-accent/30 px-2 py-0.5 text-xs font-semibold text-brand-800">Featured</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}`} className="rounded-lg p-2 hover:bg-brand-100" aria-label="Edit">
                        <Pencil className="h-4 w-4 text-brand-700" />
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <ConfirmSubmit message={`Delete "${p.name}"? This cannot be undone.`} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
                          Delete
                        </ConfirmSubmit>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
