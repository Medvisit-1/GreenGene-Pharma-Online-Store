import Link from "next/link";
import { Download, Search, Users, ShoppingBag, Mail, Banknote } from "lucide-react";
import { customerRows, type CustomerFilter, type CustomerSort } from "@/lib/customers";
import { cn, formatPrice } from "@/lib/utils";
import { Tag } from "@/components/admin/tag";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customers" };

const PER_PAGE = 50;
const FILTERS: { id: CustomerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "buyers", label: "Have ordered" },
  { id: "subscribers", label: "Newsletter" },
  { id: "no-orders", label: "No orders yet" },
];
const SORTS: { id: CustomerSort; label: string }[] = [
  { id: "newest", label: "Newest" },
  { id: "spent", label: "Top spenders" },
  { id: "orders", label: "Most orders" },
  { id: "recent", label: "Recent order" },
];

type Search = Promise<{ q?: string; filter?: string; sort?: string; page?: string }>;

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString("en-ZA", { dateStyle: "medium", timeZone: "Africa/Johannesburg" }) : "—";

export default async function AdminCustomers({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const filter = (FILTERS.some((f) => f.id === sp.filter) ? sp.filter : "all") as CustomerFilter;
  const sort = (SORTS.some((s) => s.id === sp.sort) ? sp.sort : "newest") as CustomerSort;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

  const [rows, everyone] = await Promise.all([customerRows({ q, filter, sort }), customerRows()]);
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const buyers = everyone.filter((r) => r.paidOrders > 0);
  const repeat = buyers.filter((r) => r.paidOrders > 1).length;
  const totalSpent = buyers.reduce((n, r) => n + r.spent, 0);

  const link = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, filter, sort, page: 1, ...over };
    for (const [k, v] of Object.entries(merged)) {
      if (v === undefined || v === "" || (k === "filter" && v === "all") || (k === "sort" && v === "newest") || (k === "page" && v === 1)) continue;
      p.set(k, String(v));
    }
    const s = p.toString();
    return `/admin/customers${s ? `?${s}` : ""}`;
  };
  const exportHref = `/api/admin/customers/export?${new URLSearchParams({ q, filter, sort }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Customers ({everyone.length})</h1>
        <a
          href={exportHref}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold hover:bg-muted"
        >
          <Download className="h-4 w-4" /> Download CSV{q || filter !== "all" ? " (filtered)" : ""}
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Customers" value={String(everyone.length)} />
        <Stat icon={ShoppingBag} label="Have ordered" value={`${buyers.length}${buyers.length ? ` · ${repeat} came back` : ""}`} />
        <Stat icon={Mail} label="Newsletter subscribers" value={String(everyone.filter((r) => r.newsletter).length)} />
        <Stat icon={Banknote} label="Average spend per buyer" value={buyers.length ? formatPrice(Math.round(totalSpent / buyers.length)) : "—"} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/customers" className="relative min-w-60 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or phone"
            aria-label="Search customers"
            className="h-10 w-full rounded-full border border-border bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-400"
          />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
        </form>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <Link
              key={f.id}
              href={link({ filter: f.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                filter === f.id ? "border-brand-600 bg-brand-600 text-white" : "border-border bg-white hover:bg-muted"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Joined</th>
              <SortTh label="Orders" id="orders" sort={sort} href={link({ sort: "orders" })} />
              <SortTh label="Spent" id="spent" sort={sort} href={link({ sort: "spent" })} />
              <SortTh label="Last order" id="recent" sort={sort} href={link({ sort: "recent" })} />
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">No customers match.</td>
              </tr>
            )}
            {shown.map((c) => (
              <tr key={c.id} className="hover:bg-brand-50/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="font-semibold text-brand-800 hover:underline">
                    {c.name || c.email}
                  </Link>
                  {c.name && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  {c.phone && <div className="text-xs text-muted-foreground">{c.phone}</div>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(c.createdAt)}</td>
                <td className="px-4 py-3">{c.paidOrders}</td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold">{c.spent ? formatPrice(c.spent) : "—"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{fmtDate(c.lastOrderAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.paidOrders > 1 && <Tag tone="green">Repeat</Tag>}
                    {c.newsletter && <Tag tone="plum">Newsletter</Tag>}
                    {c.lastLoginAt && <Tag tone="gray">Account</Tag>}
                    {c.deletionRequestedAt && <Tag tone="red">Deletion requested</Tag>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 && <Link href={link({ page: page - 1 })} className="font-semibold text-brand-700 hover:underline">← Previous</Link>}
          <span className="text-muted-foreground">Page {page} of {pages}</span>
          {page < pages && <Link href={link({ page: page + 1 })} className="font-semibold text-brand-700 hover:underline">Next →</Link>}
        </div>
      )}
    </div>
  );
}

function SortTh({ label, id, sort, href }: { label: string; id: CustomerSort; sort: CustomerSort; href: string }) {
  return (
    <th className="px-4 py-3">
      <Link href={href} className={cn("hover:underline", sort === id && "text-brand-600 underline")}>
        {label}{sort === id ? " ↓" : ""}
      </Link>
    </th>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <Icon className="h-5 w-5 text-brand-600" />
      <div className="mt-2 text-2xl font-bold text-brand-800">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
