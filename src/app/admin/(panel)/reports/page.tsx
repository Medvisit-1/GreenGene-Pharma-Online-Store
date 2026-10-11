import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { PERIODS, salesReport, type Period } from "@/lib/reports";
import { cn, formatPrice } from "@/lib/utils";
import { RevenueChart } from "@/components/admin/revenue-chart";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sales report" };

const METHOD_LABELS: Record<string, string> = { yoco: "Yoco", bobpay: "Bob Pay", paystack: "Paystack", paypal: "PayPal", other: "Other / manual" };

export default async function SalesReport({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const period = (PERIODS.some((x) => x.id === p) ? p : "30d") as Period;
  const r = await salesReport(period);
  const label = PERIODS.find((x) => x.id === period)!.label.toLowerCase();
  const vs = r.previous ? (period === "ytd" ? "same time last year" : "previous period") : null;
  const topRevenue = r.bestSellers[0]?.revenue ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales report</h1>
          <p className="text-sm text-muted-foreground">Paid orders only, by the date they were paid (South African time).</p>
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Period">
          {PERIODS.map((x) => (
            <Link
              key={x.id}
              href={x.id === "30d" ? "/admin/reports" : `/admin/reports?p=${x.id}`}
              aria-current={x.id === period ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                x.id === period ? "border-brand-600 bg-brand-600 text-white" : "border-border bg-white hover:bg-muted"
              )}
            >
              {x.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Revenue" value={formatPrice(r.summary.revenue)} now={r.summary.revenue} before={r.previous?.revenue} vs={vs} />
        <Tile label="Orders" value={String(r.summary.orders)} now={r.summary.orders} before={r.previous?.orders} vs={vs} />
        <Tile label="Average order" value={r.summary.orders ? formatPrice(r.summary.aov) : "—"} now={r.summary.aov} before={r.previous?.aov} vs={vs} />
        <Tile label="Units sold" value={String(r.summary.units)} now={r.summary.units} before={r.previous?.units} vs={vs} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Tile
          label="Customers who bought"
          value={String(r.buyers)}
          note={r.buyers ? `${r.newCustomers} new · ${r.returningCustomers} returning` : undefined}
        />
        <Tile label="Discounts given" value={formatPrice(r.discounts)} note={r.codes.length ? `${r.codes.reduce((n, c) => n + c.uses, 0)} orders used a code` : undefined} />
        <Tile label="Refunds" value={r.refunds.count ? formatPrice(r.refunds.amount) : "None"} note={r.refunds.count ? `${r.refunds.count} order${r.refunds.count === 1 ? "" : "s"}` : undefined} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-bold">Revenue by month</h2>
        <p className="mb-4 text-xs text-muted-foreground">Last 12 months · hover a column for details</p>
        <RevenueChart months={r.monthly} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-bold">Best sellers — {label}</h2>
          <p className="text-xs text-muted-foreground">Product value before order discounts and delivery</p>
        </div>
        {r.bestSellers.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
              <tr>
                <th className="px-5 py-2.5">Product</th>
                <th className="px-3 py-2.5 text-right">Units</th>
                <th className="px-5 py-2.5 text-right">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {r.bestSellers.map((b) => (
                <tr key={b.productId ?? b.name}>
                  <td className="px-5 py-2.5">
                    <div className="font-medium">{b.name.split(/ [-—–(]/)[0]}</div>
                    <div className="mt-1 h-1.5 max-w-xs rounded-full bg-brand-50" aria-hidden>
                      <div className="h-full rounded-full" style={{ width: `${(b.revenue / topRevenue) * 100}%`, background: "#22805a" }} />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{b.units}</td>
                  <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{formatPrice(b.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-4 font-bold">Top customers — {label}</h2>
          {r.topCustomers.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No sales in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {r.topCustomers.map((c) => (
                  <tr key={c.email}>
                    <td className="px-5 py-2.5">
                      {c.id ? (
                        <Link href={`/admin/customers/${c.id}`} className="font-medium text-brand-700 hover:underline">{c.name || c.email}</Link>
                      ) : (
                        c.email
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.orders} order{c.orders === 1 ? "" : "s"}</td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{formatPrice(c.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            <h2 className="border-b border-border px-5 py-4 font-bold">Payment methods</h2>
            {r.methods.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No sales in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {r.methods.map((m) => (
                    <tr key={m.id}>
                      <td className="px-5 py-2.5 font-medium">{METHOD_LABELS[m.id] ?? m.id}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{m.orders} order{m.orders === 1 ? "" : "s"}</td>
                      <td className="px-5 py-2.5 text-right font-semibold tabular-nums">{formatPrice(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            <h2 className="border-b border-border px-5 py-4 font-bold">Discount codes used</h2>
            {r.codes.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No codes used in this period.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border">
                  {r.codes.map((c) => (
                    <tr key={c.code}>
                      <td className="px-5 py-2.5 font-mono text-xs font-semibold">{c.code}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.uses} use{c.uses === 1 ? "" : "s"}</td>
                      <td className="px-5 py-2.5 text-right tabular-nums">−{formatPrice(c.discount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** Stat tile: value, optional change vs the previous period (arrow + sign, never colour alone). */
function Tile({ label, value, now, before, vs, note }: { label: string; value: string; now?: number; before?: number; vs?: string | null; note?: string }) {
  let delta: { pct: number; dir: "up" | "down" | "flat" } | null = null;
  if (vs && now !== undefined && before !== undefined) {
    if (before === 0) delta = now === 0 ? { pct: 0, dir: "flat" } : null;
    else {
      const pct = Math.round(((now - before) / before) * 100);
      delta = { pct, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
    }
  }
  const Icon = delta?.dir === "up" ? ArrowUpRight : delta?.dir === "down" ? ArrowDownRight : Minus;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold text-brand-800">{value}</div>
      {delta && (
        <div className={cn("mt-1 inline-flex items-center gap-1 text-xs font-semibold", delta.dir === "up" ? "text-brand-700" : delta.dir === "down" ? "text-red-700" : "text-muted-foreground")}>
          <Icon className="h-3.5 w-3.5" />
          {delta.pct > 0 ? "+" : ""}{delta.pct}% <span className="font-normal text-muted-foreground">vs {vs}</span>
        </div>
      )}
      {vs && now !== undefined && before === 0 && now > 0 && (
        <div className="mt-1 text-xs text-muted-foreground">Nothing in the {vs}</div>
      )}
      {note && <div className="mt-1 text-xs text-muted-foreground">{note}</div>}
    </div>
  );
}
