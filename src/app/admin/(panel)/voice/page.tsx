import Link from "next/link";
import { Bell, Check, Heart, Inbox, Mail, RotateCcw, Search, ShoppingBag, Star, Trash2, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { short } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { BarList } from "@/components/admin/charts";
import { clearSearches, deleteMessage, setMessageHandled } from "@/app/admin/voice-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer voice" };

const DAY = 864e5;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);

function Card({ title, icon: Icon, note, children, id, className }: { title: string; icon: typeof Inbox; note?: string; children: React.ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-6 rounded-2xl border border-border bg-surface p-5", className)}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-[color:var(--g-plum3)]/50 text-[color:var(--g-plum3)]"><Icon className="h-4.5 w-4.5" /></span>
        <div>
          <h2>{title}</h2>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const when = (d: Date) =>
  d.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" });

export default async function VoicePage() {
  const since = daysAgo(90);
  const [messages, reviews, ratingGroups, searches, alerts, wishes, carts, signups, products] = await Promise.all([
    prisma.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 40 }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { product: { select: { name: true } } } }),
    prisma.review.groupBy({ by: ["rating"], where: { status: "approved" }, _count: { _all: true } }),
    prisma.searchQuery.findMany({ where: { createdAt: { gte: since } }, select: { term: true, results: true } }),
    prisma.stockAlert.groupBy({ by: ["productId"], where: { notifiedAt: null }, _count: { _all: true } }),
    prisma.wishlistItem.groupBy({ by: ["productId"], _count: { _all: true } }),
    prisma.savedCart.findMany({ where: { updatedAt: { lt: daysAgo(1) } }, select: { items: true } }),
    prisma.customer.findMany({ where: { newsletter: true }, orderBy: { newsletterAt: { sort: "desc", nulls: "last" } }, take: 8, select: { email: true, name: true, newsletterAt: true } }),
    prisma.product.findMany({ select: { id: true, name: true, stock: true } }),
  ]);
  const productName = new Map(products.map((p) => [p.id, short(p.name)]));
  const stock = new Map(products.map((p) => [p.id, p.stock]));
  const unread = messages.filter((m) => !m.handled).length;

  // Reviews
  const totalRatings = ratingGroups.reduce((n, g) => n + g._count._all, 0);
  const avg = totalRatings ? ratingGroups.reduce((n, g) => n + g.rating * g._count._all, 0) / totalRatings : 0;

  // Searches
  const termCount = new Map<string, { n: number; zero: number }>();
  for (const s of searches) {
    const row = termCount.get(s.term) ?? { n: 0, zero: 0 };
    row.n++;
    if (s.results === 0) row.zero++;
    termCount.set(s.term, row);
  }
  const topTerms = [...termCount.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 10);
  const zeroTerms = [...termCount.entries()].filter(([, v]) => v.zero > 0).sort((a, b) => b[1].zero - a[1].zero).slice(0, 10);

  // Abandoned saved carts: which products are left behind
  const left = new Map<string, number>();
  let cartCount = 0;
  for (const c of carts) {
    try {
      const items = JSON.parse(c.items) as { productId: string; quantity: number }[];
      if (!items.length) continue;
      cartCount++;
      for (const i of items) left.set(i.productId, (left.get(i.productId) ?? 0) + (i.quantity || 1));
    } catch {
      /* ignore a malformed cart */
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Customer voice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything customers tell you, directly or through what they do: messages, reviews, searches, wishes and carts.
        </p>
      </div>

      {/* Inbox */}
      <Card title="Messages" icon={Inbox} note={unread ? `${unread} new · from the contact form` : "From the contact form — all caught up"}>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No messages yet. New contact-form messages appear here (they are still emailed to you too).</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={cn("rounded-2xl p-4", m.handled ? "bg-white/60 opacity-75" : "bg-white shadow-sm ring-1 ring-[color:var(--g-plum3)]/20")}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {!m.handled && <span className="rounded-full bg-[color:var(--g-plum)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">New</span>}
                  <strong>{m.name}</strong>
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "your message to GreenGene Pharma"}`)}`} className="text-sm text-[color:var(--g-plum3)] hover:underline">{m.email}</a>
                  {m.phone && <span className="text-sm text-muted-foreground">{m.phone}</span>}
                  <span className="ml-auto text-xs text-muted-foreground">{when(m.createdAt)}</span>
                </div>
                {m.subject && <p className="mt-1 text-sm font-semibold">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-line text-sm text-foreground/85">{m.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "your message to GreenGene Pharma"}`)}`} className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--g-plum)] px-3 py-1.5 text-xs font-semibold text-white">
                    <Mail className="h-3.5 w-3.5" /> Reply
                  </a>
                  <form action={setMessageHandled}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="handled" value={m.handled ? "0" : "1"} />
                    <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold">
                      {m.handled ? <><RotateCcw className="h-3.5 w-3.5" /> Mark as new</> : <><Check className="h-3.5 w-3.5" /> Mark handled</>}
                    </button>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50" aria-label={`Delete message from ${m.name}`}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reviews */}
        <Card title="Reviews" icon={Star} note={totalRatings ? `${avg.toFixed(1)} average from ${totalRatings} published reviews` : "No published reviews yet"}>
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((r) => {
              const n = ratingGroups.find((g) => g.rating === r)?._count._all ?? 0;
              return (
                <div key={r} className="flex items-center gap-3 text-sm">
                  <span className="w-8 shrink-0 tabular-nums">{r}★</span>
                  <span className="h-2 flex-1 rounded-full bg-black/[0.05]">
                    <span className="block h-2 rounded-full bg-[color:var(--g-chart)]" style={{ width: `${totalRatings ? (n / totalRatings) * 100 : 0}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right tabular-nums text-muted-foreground">{n}</span>
                </div>
              );
            })}
          </div>
          <ul className="mt-4 divide-y divide-border">
            {reviews.map((r) => (
              <li key={r.id} className="py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[#a8761c]">{"★".repeat(r.rating)}<span className="text-black/15">{"★".repeat(5 - r.rating)}</span></span>
                  <span className="font-medium">{r.author}</span>
                  <span className="text-muted-foreground">on {short(r.product.name)}</span>
                  {r.status === "pending" && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Waiting</span>}
                </div>
                <p className="mt-0.5 line-clamp-2 text-foreground/80">{r.title ? `${r.title} — ` : ""}{r.body}</p>
              </li>
            ))}
          </ul>
          <Link href="/admin/reviews" className="mt-2 inline-block text-sm font-semibold text-[color:var(--g-plum3)] hover:underline">Moderate reviews →</Link>
        </Card>

        {/* Searches */}
        <Card title="What people search for" icon={Search} note={`${searches.length} searches in the last 90 days`}>
          <BarList rows={topTerms.map(([t, v]) => ({ label: `“${t}”`, value: v.n, display: `${v.n}×` }))} empty="No searches yet — they appear as shoppers use the search box." />
          {zeroTerms.length > 0 && (
            <div className="mt-5 rounded-2xl bg-[color:var(--g-gold-soft)] p-4">
              <p className="text-sm font-semibold text-[color:var(--g-gold-ink)]">Searched for but not found</p>
              <p className="mb-2 text-xs text-[color:var(--g-gold-ink)]/80">Possible new products, or words to add to existing product descriptions.</p>
              <div className="flex flex-wrap gap-1.5">
                {zeroTerms.map(([t, v]) => (
                  <span key={t} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium">{t} <span className="text-muted-foreground">×{v.zero}</span></span>
                ))}
              </div>
            </div>
          )}
          {searches.length > 0 && (
            <form action={clearSearches} className="mt-3">
              <button className="text-xs font-semibold text-muted-foreground hover:text-red-700">Clear search history</button>
            </form>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card id="demand" title="Waiting for stock" icon={Bell} note="Shoppers asked to be emailed when back in stock">
          <BarList
            rows={alerts.sort((a, b) => b._count._all - a._count._all).map((a) => ({
              label: productName.get(a.productId) ?? "Removed product",
              value: a._count._all,
              display: `${a._count._all} waiting`,
              sub: (stock.get(a.productId) ?? 0) > 0 ? "in stock again" : "out of stock",
            }))}
            empty="Nobody is waiting on stock."
          />
        </Card>
        <Card title="Most wished for" icon={Heart} note="Saved to wishlists">
          <BarList
            rows={wishes.sort((a, b) => b._count._all - a._count._all).slice(0, 8).map((w) => ({ label: productName.get(w.productId) ?? "Removed product", value: w._count._all, display: `${w._count._all}♥` }))}
            empty="No wishlist saves yet."
          />
        </Card>
        <Card title="Left in carts" icon={ShoppingBag} note={`${cartCount} signed-in cart${cartCount === 1 ? "" : "s"} not checked out for a day or more`}>
          <BarList
            rows={[...left.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([pid, n]) => ({ label: productName.get(pid) ?? "Removed product", value: n, display: `${n}` }))}
            empty="No abandoned carts."
          />
        </Card>
      </div>

      <Card title="Newest newsletter subscribers" icon={UserPlus}>
        {signups.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscribers yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {signups.map((s) => (
              <li key={s.email} className="rounded-2xl bg-white px-4 py-3 text-sm">
                <p className="truncate font-medium">{s.name || s.email}</p>
                {s.name && <p className="truncate text-xs text-muted-foreground">{s.email}</p>}
                {s.newsletterAt && <p className="text-xs text-muted-foreground">{when(s.newsletterAt)}</p>}
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/newsletter" className="mt-3 inline-block text-sm font-semibold text-[color:var(--g-plum3)] hover:underline">Newsletter →</Link>
      </Card>
    </div>
  );
}
