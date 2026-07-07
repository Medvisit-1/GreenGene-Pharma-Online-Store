import Link from "next/link";
import { Plus, CheckCircle2, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { saveWholesaleSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { tiersFromSettings, tierRange } from "@/lib/wholesale";

export const dynamic = "force-dynamic";
export const metadata = { title: "Wholesale" };

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-amber-100 text-amber-700",
  accepted: "bg-brand-100 text-brand-700",
  declined: "bg-red-100 text-red-700",
};

export default async function WholesalePage({
  searchParams,
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const { settings } = await searchParams;
  const [quotes, s] = await Promise.all([
    prisma.quotation.findMany({ orderBy: { createdAt: "desc" } }),
    getSettings(),
  ]);
  const tiers = tiersFromSettings(s);

  const acceptedTotal = quotes
    .filter((q) => q.status === "accepted")
    .reduce((n, q) => n + q.subtotal, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wholesale</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotes.length} quotation{quotes.length === 1 ? "" : "s"} ·{" "}
            <span className="font-medium text-brand-700">{formatPrice(acceptedTotal)} accepted</span>
          </p>
        </div>
        <Link href="/admin/wholesale/new">
          <Button size="lg"><Plus className="h-4 w-4" /> New quotation</Button>
        </Link>
      </div>

      {settings && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> Wholesale tiers saved.
        </p>
      )}

      {/* Tier summary */}
      <div className="flex flex-wrap gap-3">
        {tiers.map((t, i) => (
          <div key={i} className="rounded-2xl border border-brand-200 bg-brand-50/60 px-5 py-4 text-center">
            <div className="text-sm font-semibold text-brand-800">{tierRange(t)}</div>
            <div className="text-2xl font-bold text-brand-600">{t.discountPercent}%</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">off unit cost</div>
          </div>
        ))}
      </div>

      {/* Quotation history */}
      {quotes.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No quotations yet. Click <strong>New quotation</strong> to create your first wholesale quote.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
              <tr>
                <th className="px-4 py-3">Quotation</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {quotes.map((q) => (
                <tr key={q.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-semibold text-brand-700">
                    <Link href={`/admin/wholesale/${q.id}`} className="inline-flex items-center gap-2 hover:underline">
                      <FileText className="h-4 w-4" /> {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {q.customerCompany || q.customerName}
                    {q.sentAt && <span className="ml-2 text-[11px] text-brand-600">· sent</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(q.issueDate).toLocaleDateString("en-ZA", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[q.status] ?? STATUS_STYLES.draft}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPrice(q.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tier configuration */}
      <form action={saveWholesaleSettings} className="space-y-5">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 font-bold">Volume discount tiers</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Discounts are applied to each product&apos;s wholesale unit cost. Tier 1 starts at 1 unit;
            each tier runs up to its cap, and the final tier covers everything above.
          </p>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Tier 1 — up to (units)</label>
                <input name="wholesaleTier1Max" inputMode="numeric" defaultValue={s.wholesaleTier1Max} className={input} />
              </div>
              <div>
                <label className={label}>Tier 1 — discount (%)</label>
                <input name="wholesaleTier1Pct" inputMode="numeric" defaultValue={s.wholesaleTier1Pct} className={input} />
              </div>
              <div>
                <label className={label}>Tier 2 — up to (units)</label>
                <input name="wholesaleTier2Max" inputMode="numeric" defaultValue={s.wholesaleTier2Max} className={input} />
              </div>
              <div>
                <label className={label}>Tier 2 — discount (%)</label>
                <input name="wholesaleTier2Pct" inputMode="numeric" defaultValue={s.wholesaleTier2Pct} className={input} />
              </div>
              <div>
                <label className={label}>Tier 3 — above tier 2 (%)</label>
                <input name="wholesaleTier3Pct" inputMode="numeric" defaultValue={s.wholesaleTier3Pct} className={input} />
              </div>
              <div>
                <label className={label}>Quote validity (days)</label>
                <input name="wholesaleValidityDays" inputMode="numeric" defaultValue={s.wholesaleValidityDays} className={input} />
              </div>
              <div>
                <label className={label}>RRP margin note (%)</label>
                <input name="wholesaleRrpMarginPct" inputMode="numeric" defaultValue={s.wholesaleRrpMarginPct} className={input} />
                <p className="mt-1 text-xs text-muted-foreground">
                  Footnote on the quotation: the RRP sits this % below the online platform selling price (excluding delivery).
                </p>
              </div>
            </div>
            <div>
              <label className={label}>Intro / default notes on the quotation</label>
              <textarea name="wholesaleIntro" rows={3} defaultValue={s.wholesaleIntro} className={input} />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Your business details come from the <Link href="/admin/invoices" className="font-medium text-brand-700 hover:underline">Invoicing</Link> page and appear on every quotation.
          </p>
        </div>

        <Button type="submit" size="lg">Save wholesale settings</Button>
      </form>
    </div>
  );
}
