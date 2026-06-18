import { CheckCircle2 } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { saveSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

export default async function AdminSettings({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const s = await getSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Store settings</h1>

      {saved && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> Settings saved.
        </p>
      )}

      <form action={saveSettings} className="max-w-2xl space-y-5">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-bold">Announcement bar</h2>
          <div>
            <label className={label}>Top banner text</label>
            <input name="announcement" defaultValue={s.announcement} className={input} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 font-bold">Shipping</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Amounts in Rand (R). Set the free-shipping threshold to 0 to never offer free shipping.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Flat shipping fee (R)</label>
              <input
                name="shippingFlat"
                inputMode="decimal"
                defaultValue={(parseInt(s.shippingFlat, 10) / 100).toFixed(2)}
                className={input}
              />
            </div>
            <div>
              <label className={label}>Free shipping over (R)</label>
              <input
                name="freeShippingThreshold"
                inputMode="decimal"
                defaultValue={(parseInt(s.freeShippingThreshold, 10) / 100).toFixed(2)}
                className={input}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-4 font-bold">Contact details</h2>
          <div className="grid gap-4">
            <div>
              <label className={label}>Phone</label>
              <input name="contactPhone" defaultValue={s.contactPhone} className={input} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input name="contactEmail" type="email" defaultValue={s.contactEmail} className={input} />
            </div>
            <div>
              <label className={label}>Address</label>
              <input name="contactAddress" defaultValue={s.contactAddress} className={input} />
            </div>
            <div>
              <label className={label}>Business hours (separate lines with “ · ”)</label>
              <input name="contactHours" defaultValue={s.contactHours} className={input} />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg">Save settings</Button>
      </form>
    </div>
  );
}
