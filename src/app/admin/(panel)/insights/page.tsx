import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { PERIODS, type Period } from "@/lib/reports";
import { WEEKDAYS, insightsData, peakHoursText, short } from "@/lib/insights";
import { cn, formatPrice } from "@/lib/utils";
import { BarList, ColumnChart, DataTable, Heatmap, StackedColumns, compactRand } from "@/components/admin/charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Insights & trends" };

function Card({ title, note, children, className, id }: { title: string; note?: string; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={cn("rounded-2xl border border-border bg-surface p-5", className)}>
      <h2>{title}</h2>
      {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-g-serif)] text-3xl font-semibold leading-none text-[color:var(--g-plum)]">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  const period = (PERIODS.some((x) => x.id === p) ? p : "90d") as Period;
  const d = await insightsData(period);
  const periodLabel = PERIODS.find((x) => x.id === period)!.label.toLowerCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Insights &amp; trends</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Patterns in what sells, when, to whom and where. Paid orders, {periodLabel}, counted on the date each was marked paid (South African time).
          </p>
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Period">
          {PERIODS.map((x) => (
            <Link
              key={x.id}
              href={x.id === "90d" ? "/admin/insights" : `/admin/insights?p=${x.id}`}
              aria-current={x.id === period ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                x.id === period ? "border-[color:var(--g-plum)] bg-[color:var(--g-plum)] text-white" : "border-border bg-white hover:bg-muted"
              )}
            >
              {x.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Headline numbers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revenue" value={formatPrice(d.revenue)} note={`${d.orders} paid order${d.orders === 1 ? "" : "s"} · incl. delivery, after discounts`} />
        <Stat label="Average order" value={d.orders ? formatPrice(d.aov) : "—"} note={`${d.units} units sold`} />
        <Stat label="Repeat customers" value={`${d.customers.repeatRate}%`} note={`of ${d.customers.buyersEver} buyers ever ordered again`} />
        <Stat label="Lifetime value" value={d.customers.buyersEver ? formatPrice(d.customers.lifetimeValue) : "—"} note="average spend per customer, all time" />
      </div>

      {/* Patterns */}
      <section className="relative overflow-hidden rounded-[28px] p-6 text-[color:var(--g-on-primary)]" style={{ background: "radial-gradient(120% 100% at 85% 0%, var(--g-plum-hi) 0%, var(--g-plum) 55%, var(--g-plum-lo) 100%)" }}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-[color:var(--g-gold)]">
          <Lightbulb className="h-4 w-4" /> Patterns we spotted
        </p>
        {d.patterns.length === 0 ? (
          <p className="mt-3 text-sm">Patterns appear here once a few paid orders come in.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {d.patterns.map((x) => (
              <li key={x.title} className="rounded-2xl bg-white/[0.08] p-4">
                <p className="font-[family-name:var(--font-g-serif)] text-xl font-semibold text-white">{x.title}</p>
                <p className="mt-1 text-sm text-[color:var(--g-on-primary)]">{x.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Trend */}
      <Card title={d.trendBy === "day" ? "Revenue per day" : "Revenue per month"} note="Hover a column for revenue and order count.">
        <ColumnChart
          points={d.trend}
          format={compactRand}
          tip={(x) => `${x.label}: ${formatPrice(x.value)} · ${x.count ?? 0} order${x.count === 1 ? "" : "s"}`}
          height={220}
        />
        <DataTable head={[d.trendBy === "day" ? "Day" : "Month", "Revenue", "Orders"]} rows={d.trend.map((x) => [x.label, formatPrice(x.value), x.count ?? 0])} />
      </Card>

      {/* When */}
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="When people buy" note="When orders were marked paid, by day of the week and hour of the day.">
          <Heatmap grid={d.heat} rows={WEEKDAYS} />
        </Card>
        <Card title="Busiest days">
          <BarList rows={WEEKDAYS.map((w, i) => ({ label: w, value: d.byWeekday[i], display: `${d.byWeekday[i]} order${d.byWeekday[i] === 1 ? "" : "s"}` }))} />
          <p className="mt-4 text-xs text-muted-foreground">
            Peak hour: <strong className="text-foreground">{peakHoursText(d.byHour)}</strong>
          </p>
        </Card>
      </div>

      {/* What */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Best sellers" note="By product sales before order discounts.">
          <BarList rows={d.topProducts.map((x) => ({ label: short(x.name), value: x.revenue, display: formatPrice(x.revenue), sub: `${x.units} sold` }))} empty="No sales in this period." />
        </Card>
        <Card title="Sales by category">
          <BarList rows={d.categories.map((x) => ({ label: x.name, value: x.revenue, display: formatPrice(x.revenue) }))} empty="No sales in this period." />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Bought together" note={`${d.basketShare}% of orders had more than one product.`}>
          {d.together.length === 0 ? (
            <p className="text-sm text-muted-foreground">No multi-product orders yet.</p>
          ) : (
            <ul className="space-y-2">
              {d.together.map((x) => (
                <li key={x.a + x.b} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm">
                  <span className="font-medium">{short(x.a)}</span>
                  <span className="text-[color:var(--g-plum3)]">+</span>
                  <span className="font-medium">{short(x.b)}</span>
                  <span className="ml-auto text-muted-foreground">{x.orders} order{x.orders === 1 ? "" : "s"}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Pairs that sell together are good candidates for a combo (Products → Combos).</p>
        </Card>
        <Card title="Where orders go" note="By delivery province.">
          <BarList rows={d.provinces.slice(0, 9).map((x) => ({ label: x.name, value: x.orders, display: String(x.orders), sub: formatPrice(x.revenue) }))} empty="No deliveries in this period." />
        </Card>
      </div>

      {/* Who */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card title="First-time vs returning buyers" note="Paid orders per month, last 12 months.">
          <StackedColumns points={d.newVsReturning.map((m) => ({ key: m.key, label: m.label, a: m.first, b: m.returning }))} names={["First order", "Returning"]} />
          <DataTable head={["Month", "First order", "Returning"]} rows={d.newVsReturning.map((m) => [m.label, m.first, m.returning])} />
        </Card>
        <Card title="Customer loyalty">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Accounts" value={String(d.customers.accounts)} />
            <Stat label="Buyers" value={String(d.customers.buyersEver)} />
            <Stat label="Re-order every" value={d.customers.reorderDays ? `${d.customers.reorderDays}d` : "—"} note="median gap" />
            <Stat label="From repeat orders" value={`${d.customers.repeatRevenueShare}%`} note="of revenue" />
          </div>
        </Card>
      </div>

      {/* Marketing */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Checkout completion" note={`Orders started vs paid, ${periodLabel}.`}>
          <p className="font-[family-name:var(--font-g-serif)] text-5xl font-semibold text-[color:var(--g-plum)]">{d.checkout.rate === null ? "—" : `${d.checkout.rate}%`}</p>
          <p className="mt-1 text-sm text-muted-foreground">{d.checkout.paid} paid of {d.checkout.created} orders placed</p>
          <div className="mt-3 h-2.5 rounded-full bg-black/[0.05]">
            <div className="h-2.5 rounded-full bg-[color:var(--g-chart)]" style={{ width: `${d.checkout.rate ?? 0}%` }} />
          </div>
        </Card>
        <Card title="Discount codes" note="Most used in this period.">
          <BarList rows={d.codes.map((c) => ({ label: c.code, value: c.uses, display: `${c.uses}×`, sub: `${formatPrice(c.discount)} off` }))} empty="No codes used in this period." />
          <p className="mt-3 text-xs text-muted-foreground">Rewards: {d.rewards.claimed} codes claimed, {d.rewards.redeemed} used at checkout.</p>
        </Card>
        <Card title="Newsletter" note={`${d.newsletter.total} current subscribers, by the month they joined · ${d.wishlist} wishlist saves`}>
          <ColumnChart points={d.newsletter.growth} tip={(x) => `${x.label}: ${x.value} subscribers (+${x.count ?? 0})`} height={140} everyNth={3} />
        </Card>
      </div>
    </div>
  );
}
