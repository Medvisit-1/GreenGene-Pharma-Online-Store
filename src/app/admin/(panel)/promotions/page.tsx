import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { savePromotion, deletePromotion } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Promotions" };

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export default async function AdminPromotions() {
  const promos = await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* List */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min spend</th>
                <th className="px-4 py-3">Used</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {promos.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No promo codes yet.</td></tr>
              )}
              {promos.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-bold text-brand-700">{p.code}</td>
                  <td className="px-4 py-3">{p.type === "percent" ? `${p.value}%` : formatPrice(p.value)}</td>
                  <td className="px-4 py-3">{p.minSpend > 0 ? formatPrice(p.minSpend) : "—"}</td>
                  <td className="px-4 py-3">{p.usageCount}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.active ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"}`}>
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deletePromotion}>
                      <input type="hidden" name="id" value={p.id} />
                      <ConfirmSubmit message={`Delete promo code "${p.code}"?`} className="text-xs font-medium text-red-600 hover:underline">
                        Delete
                      </ConfirmSubmit>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create */}
        <aside className="h-fit rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-bold">New promo code</h2>
          <form action={savePromotion} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Code</label>
              <input name="code" required placeholder="WELCOME10" className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Type</label>
              <select name="type" className={input} defaultValue="percent">
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount (R)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Value</label>
              <input name="value" required inputMode="decimal" placeholder="10" className={input} />
              <p className="mt-1 text-xs text-muted-foreground">Percent (e.g. 10) or Rand amount (e.g. 50).</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Minimum spend (R)</label>
              <input name="minSpend" inputMode="decimal" placeholder="0" className={input} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-brand-600" /> Active
            </label>
            <Button type="submit" className="w-full">Create promo</Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
