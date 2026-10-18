/* eslint-disable @next/next/no-img-element -- product images are remote PNGs on the store CDN */
import Link from "next/link";
import {
  ArrowDownRight, ArrowUpRight, Banknote, Bell, CircleDollarSign, ClipboardList, ExternalLink, Inbox, MessagesSquare,
  PackagePlus, Palette, ShoppingCart, Star, TrendingUp, UserPlus, AlertTriangle, LayoutTemplate,
} from "lucide-react";
import { dashboardData } from "@/lib/insights";
import { greeting } from "@/lib/home";
import { formatPrice, parseImages, cn } from "@/lib/utils";
import { ColumnChart, DataTable, Sparkline, compactRand } from "@/components/admin/charts";
import { Sprig } from "@/components/garden/art";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

function Change({ value }: { value: number | null }) {
  if (value === null) return <span className="sub">No earlier data to compare</span>;
  const up = value >= 0;
  return (
    <span className="sub inline-flex items-center gap-1">
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {up ? "+" : ""}{value}% vs previous 30 days
    </span>
  );
}

const STATUS: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  unpaid: "bg-amber-100 text-amber-800",
  refunded: "bg-slate-200 text-slate-700",
  failed: "bg-red-100 text-red-700",
};

export default async function AdminDashboard() {
  const d = await dashboardData();
  const { kpis, todo } = d;
  const dateLine = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Johannesburg" });

  const todos = [
    { n: todo.toFulfil, label: "paid orders to fulfil", href: "/admin/orders", icon: ClipboardList, tone: "plum" },
    { n: todo.messages, label: "new customer messages", href: "/admin/voice", icon: Inbox, tone: "plum" },
    { n: todo.pendingReviews, label: "reviews waiting for approval", href: "/admin/reviews", icon: Star, tone: "gold" },
    { n: todo.lowStock, label: "products low on stock", href: "/admin/products", icon: AlertTriangle, tone: "gold" },
    { n: todo.waitingAlerts, label: "shoppers waiting for back-in-stock", href: "/admin/voice#demand", icon: Bell, tone: "gold" },
    { n: todo.unpaid, label: "unpaid orders this week", href: "/admin/orders", icon: CircleDollarSign, tone: "muted" },
  ].filter((t) => t.n > 0);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section className="gg-dash-hello">
        <Sprig kind="green" style={{ right: -30, top: -40, width: 140, transform: "rotate(180deg) scaleX(-1)" }} />
        <Sprig kind="plum" className="hidden md:block" style={{ right: 120, bottom: -40, width: 120, transform: "rotate(-10deg)" }} />
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[color:var(--g-plum3)]">{greeting()} · {dateLine}</p>
        <h1 className="mt-2">Welcome back</h1>
        <p className="mt-1 font-[family-name:var(--font-g-script)] text-2xl text-[color:var(--g-leaf)]">here&apos;s how your shop is growing</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/products/new" className="gg-quick"><PackagePlus className="h-4 w-4" /> Add product</Link>
          <Link href="/admin/orders" className="gg-quick"><ShoppingCart className="h-4 w-4" /> Orders</Link>
          <Link href="/admin/insights" className="gg-quick"><TrendingUp className="h-4 w-4" /> Insights</Link>
          <Link href="/admin/front-shop" className="gg-quick"><LayoutTemplate className="h-4 w-4" /> Edit homepage</Link>
          <Link href="/admin/appearance" className="gg-quick"><Palette className="h-4 w-4" /> Colours</Link>
          <Link href="/" target="_blank" className="gg-quick"><ExternalLink className="h-4 w-4" /> View store</Link>
        </div>
      </section>

      {/* KPIs: last 30 days */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/admin/reports" className="gg-dash-tile plum">
          <div className="flex items-center justify-between"><span className="lbl">Revenue · 30 days</span><span className="ic"><Banknote className="h-5 w-5" /></span></div>
          <p className="num">{formatPrice(kpis.revenue.value)}</p>
          <Change value={kpis.revenue.change} />
          <div className="mt-2 text-[color:var(--g-gold)]"><Sparkline values={d.daily.map((p) => p.value)} /></div>
        </Link>
        <Link href="/admin/orders" className="gg-dash-tile">
          <div className="flex items-center justify-between"><span className="lbl text-muted-foreground">Paid orders</span><span className="ic text-[color:var(--g-plum3)]"><ShoppingCart className="h-5 w-5" /></span></div>
          <p className="num text-[color:var(--g-plum)]">{kpis.orders.value}</p>
          <Change value={kpis.orders.change} />
          <div className="mt-2 text-[color:var(--g-plum3)]"><Sparkline values={d.daily.map((p) => p.count)} /></div>
        </Link>
        <Link href="/admin/insights" className="gg-dash-tile forest">
          <div className="flex items-center justify-between"><span className="lbl">Average order</span><span className="ic"><CircleDollarSign className="h-5 w-5" /></span></div>
          <p className="num">{kpis.orders.value ? formatPrice(kpis.aov.value) : "—"}</p>
          <Change value={kpis.aov.change} />
        </Link>
        <Link href="/admin/customers" className="gg-dash-tile">
          <div className="flex items-center justify-between"><span className="lbl text-muted-foreground">New sign-ups</span><span className="ic text-[color:var(--g-plum3)]"><UserPlus className="h-5 w-5" /></span></div>
          <p className="num text-[color:var(--g-plum)]">{kpis.signups.value}</p>
          <Change value={kpis.signups.change} />
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        {/* Revenue chart */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2>Daily revenue</h2>
              <p className="text-xs text-muted-foreground">Paid orders, last 30 days (South African time)</p>
            </div>
            <Link href="/admin/insights" className="text-sm font-semibold text-[color:var(--g-plum3)] hover:underline">Trends →</Link>
          </div>
          <ColumnChart
            points={d.daily}
            format={compactRand}
            tip={(p) => `${p.label}: ${formatPrice(p.value)} · ${p.count ?? 0} order${p.count === 1 ? "" : "s"}`}
            height={190}
          />
          <DataTable head={["Day", "Revenue", "Orders"]} rows={d.daily.map((p) => [p.label, formatPrice(p.value), p.count ?? 0])} />
        </section>

        {/* To do */}
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-1">Needs your attention</h2>
          <p className="mb-4 text-xs text-muted-foreground">Everything waiting on you, in one place.</p>
          {todos.length === 0 ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-6 text-center text-sm font-medium text-emerald-800">All caught up — nothing waiting. 🌿</p>
          ) : (
            <ul className="space-y-2">
              {todos.map((t) => (
                <li key={t.label}>
                  <Link href={t.href} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 transition hover:translate-x-0.5 hover:shadow-sm">
                    <span className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                      t.tone === "plum" ? "bg-[color:var(--g-plum)] text-white" : t.tone === "gold" ? "bg-[color:var(--g-gold-soft)] text-[color:var(--g-gold-ink)]" : "bg-muted text-muted-foreground"
                    )}>
                      <t.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="text-sm"><strong className="text-base">{t.n}</strong> {t.label}</span>
                    <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2>Latest orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-[color:var(--g-plum3)] hover:underline">All orders →</Link>
          </div>
          {d.recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {d.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 text-sm hover:text-[color:var(--g-plum)]">
                    <span className="w-24 shrink-0 font-semibold">{o.orderNumber}</span>
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{o.email}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize", STATUS[o.paymentStatus] ?? "bg-muted")}>{o.paymentStatus}</span>
                    <span className="w-24 shrink-0 text-right font-semibold tabular-nums">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2>Low stock</h2>
            <Link href="/admin/products" className="text-sm font-semibold text-[color:var(--g-plum3)] hover:underline">Products →</Link>
          </div>
          {d.lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well stocked.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {d.lowStock.map((p) => {
                const img = parseImages(p.images)[0];
                return (
                  <li key={p.id}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 hover:shadow-sm">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[color:var(--g-blush)]">
                        {img && <img src={img} alt="" className="max-h-11 max-w-11 object-contain" />}
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-1 text-sm font-medium">{p.name.split(/\s+[-–—]\s+/)[0]}</span>
                        <span className={cn("text-xs font-semibold", p.stock === 0 ? "text-red-600" : "text-amber-700")}>
                          {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <Link href="/admin/voice" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--g-plum3)] hover:underline">
            <MessagesSquare className="h-4 w-4" /> See what customers are asking for →
          </Link>
        </section>
      </div>
    </div>
  );
}
