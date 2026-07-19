import Link from "next/link";
import type { Category, Product } from "@prisma/client";
import { parseImages } from "@/lib/utils";
import { saveProduct } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "@/components/admin/image-uploader";
import { WholesalePricingFields } from "@/components/admin/wholesale-pricing-fields";
import type { WholesaleTier } from "@/lib/wholesale";

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

export function ProductForm({
  product,
  categories,
  wholesaleTiers,
  defaultCombo = false,
}: {
  product?: Product | null;
  categories: Category[];
  wholesaleTiers: WholesaleTier[];
  defaultCombo?: boolean;
}) {
  const images = parseImages(product?.images);
  const combo = product?.isCombo ?? defaultCombo;

  return (
    <form action={saveProduct} className="max-w-3xl space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-4">
          <div>
            <label className={label}>Product name *</label>
            <input name="name" required defaultValue={product?.name ?? ""} className={input} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Slug (URL) — leave blank to auto-generate</label>
              <input name="slug" defaultValue={product?.slug ?? ""} className={input} />
            </div>
            <div>
              <label className={label}>Brand</label>
              <input name="brand" defaultValue={product?.brand ?? "GreenGene Pharma"} className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Short description</label>
            <input name="shortDescription" defaultValue={product?.shortDescription ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Full description</label>
            <textarea name="description" rows={8} defaultValue={product?.description ?? ""} className={input} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Price (R) *</label>
            <input
              name="price"
              required
              inputMode="decimal"
              defaultValue={product ? (product.price / 100).toFixed(2) : ""}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Compare-at price (R)</label>
            <input
              name="compareAtPrice"
              inputMode="decimal"
              defaultValue={product?.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : ""}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Stock</label>
            <input name="stock" type="number" defaultValue={product?.stock ?? 0} className={input} />
          </div>
          <div>
            <label className={label}>SKU</label>
            <input name="sku" defaultValue={product?.sku ?? ""} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Category</label>
            <select name="categoryId" defaultValue={product?.categoryId ?? ""} className={input}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!combo && (
        <WholesalePricingFields
          initialUnitCost={product?.unitCost ? (product.unitCost / 100).toFixed(2) : ""}
          initialRrp={product?.rrp ? (product.rrp / 100).toFixed(2) : ""}
          tiers={wholesaleTiers}
        />
      )}

      <div className="rounded-2xl border border-border bg-surface p-6">
        <h3 className="mb-1 font-bold">Also available on</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Paste this product&apos;s link on each marketplace. Filled-in ones show as
          clickable logos at the bottom of the product page. Leave blank to hide.
        </p>
        <div className="grid gap-4">
          <div>
            <label className={label}>Takealot link</label>
            <input name="takealotUrl" type="url" placeholder="https://www.takealot.com/..." defaultValue={product?.takealotUrl ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Amazon link</label>
            <input name="amazonUrl" type="url" placeholder="https://www.amazon.com/..." defaultValue={product?.amazonUrl ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>BobShop link</label>
            <input name="bobshopUrl" type="url" placeholder="https://www.bobshop.co.za/..." defaultValue={product?.bobshopUrl ?? ""} className={input} />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6">
        <label className={label}>Product images</label>
        <ImageUploader initial={images} />
        <p className="mt-2 text-xs text-muted-foreground">
          The first image is the main product photo. Hover an image to set it as
          main or remove it.
        </p>

        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="featured" defaultChecked={product?.featured ?? false} className="h-4 w-4 accent-brand-600" />
            Featured product
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="h-4 w-4 accent-brand-600" />
            Active (visible in store)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="isCombo" defaultChecked={product?.isCombo ?? defaultCombo} className="h-4 w-4 accent-brand-600" />
            Combo product (show under Combos)
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="lg">{product ? "Save changes" : "Create product"}</Button>
        <Link href="/admin/products"><Button type="button" variant="outline" size="lg">Cancel</Button></Link>
      </div>
    </form>
  );
}
