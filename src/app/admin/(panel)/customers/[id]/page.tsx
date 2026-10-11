import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Cake, Heart, Star, Bell, Ticket } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCustomerRewards, referralStats } from "@/lib/rewards";
import { parseAddress } from "@/lib/customers";
import { formatPrice } from "@/lib/utils";
import { Tag } from "@/components/admin/tag";

export const dynamic = "force-dynamic";
export const metadata = { title: "Customer" };

const fmt = (d: Date | null | undefined, time = false) =>
  d
    ? d.toLocaleString("en-ZA", { dateStyle: "medium", ...(time ? { timeStyle: "short" } : {}), timeZone: "Africa/Johannesburg" })
    : "—";

export default async function AdminCustomer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  const [orders, rewards, referrals, wishlist, reviews, alerts] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [{ customerId: customer.id }, { email: customer.email }] },
      include: { _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getCustomerRewards(customer).catch(() => null),
    referralStats(customer.id).catch(() => null),
    prisma.wishlistItem.findMany({ where: { customerId: customer.id }, include: { product: true }, orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ where: { email: customer.email }, include: { product: true }, orderBy: { createdAt: "desc" } }),
    prisma.stockAlert.findMany({ where: { email: customer.email, notifiedAt: null }, include: { product: true } }),
  ]);

  const paid = orders.filter((o) => o.paymentStatus === "paid");
  const spent = paid.reduce((n, o) => n + o.total, 0);
  const addr = parseAddress(customer.shippingDetails);
  const addrLine = [addr.line1, addr.line2, addr.suburb, addr.city, addr.province, addr.postalCode].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name || customer.email}</h1>
          <p className="text-sm text-muted-foreground">Customer since {fmt(customer.createdAt)}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {paid.length > 1 && <Tag tone="green">Repeat customer</Tag>}
            {customer.newsletter && <Tag tone="plum">Newsletter since {fmt(customer.newsletterAt)}</Tag>}
            {customer.remindersOptOut && <Tag tone="gray">Reminders off</Tag>}
            {customer.lastLoginAt ? <Tag tone="gray">Last sign-in {fmt(customer.lastLoginAt)}</Tag> : <Tag tone="gray">Never signed in</Tag>}
            {customer.deletionRequestedAt && <Tag tone="red">Deletion requested {fmt(customer.deletionRequestedAt)}</Tag>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <Mini label="Paid orders" value={String(paid.length)} />
          <Mini label="Total spent" value={formatPrice(spent)} />
          <Mini label="Average order" value={paid.length ? formatPrice(Math.round(spent / paid.length)) : "—"} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="space-y-3 rounded-2xl border border-border bg-surface p-5 text-sm">
          <h2 className="font-bold">Contact &amp; delivery</h2>
          <Line icon={Mail}><a href={`mailto:${customer.email}`} className="text-brand-700 hover:underline">{customer.email}</a></Line>
          <Line icon={Phone}>{customer.phone || "—"}</Line>
          <Line icon={MapPin}>{addrLine || "No saved address"}</Line>
          <Line icon={Cake}>{customer.birthday ? customer.birthday.toLocaleDateString("en-ZA", { day: "numeric", month: "long", timeZone: "UTC" }) : "Birthday not set"}</Line>
          {customer.referralCode && (
            <Line icon={Ticket}>
              Referral code <strong>{customer.referralCode}</strong>
              {referrals ? ` · ${referrals.friendsOrdered} friend${referrals.friendsOrdered === 1 ? "" : "s"} ordered` : ""}
            </Line>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-surface lg:col-span-2">
          <h2 className="border-b border-border px-5 py-4 font-bold">Orders ({orders.length})</h2>
          {orders.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-2.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{fmt(o.createdAt, true)}</td>
                    <td className="px-3 py-2.5">{o._count.items} item{o._count.items === 1 ? "" : "s"}</td>
                    <td className="px-3 py-2.5">
                      <Tag tone={o.paymentStatus === "paid" ? "green" : o.paymentStatus === "refunded" ? "gray" : "amber"}>{o.paymentStatus}</Tag>{" "}
                      {o.paymentStatus === "paid" && <Tag tone={o.status === "fulfilled" ? "green" : "amber"}>{o.status}</Tag>}
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold">{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Ticket className="h-4 w-4 text-brand-600" /> Reward codes</h2>
          {!rewards?.codes.length ? (
            <p className="text-muted-foreground">None claimed.</p>
          ) : (
            <ul className="space-y-2">
              {rewards.codes.map((c) => (
                <li key={c.code} className="flex flex-wrap items-center justify-between gap-2">
                  <span><strong>{c.code}</strong> · {c.discount}</span>
                  <Tag tone={c.used ? "gray" : c.expired ? "red" : "green"}>{c.used ? "Used" : c.expired ? "Expired" : "Active"}</Tag>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Heart className="h-4 w-4 text-rose-500" /> Wishlist &amp; alerts</h2>
          {wishlist.length === 0 && alerts.length === 0 ? (
            <p className="text-muted-foreground">Nothing saved.</p>
          ) : (
            <ul className="space-y-1.5">
              {wishlist.map((w) => (
                <li key={w.id}>❤ {w.product.name.split(/ [-—–(]/)[0]}</li>
              ))}
              {alerts.map((a) => (
                <li key={a.id} className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" /> Waiting for {a.product.name.split(/ [-—–(]/)[0]}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><Star className="h-4 w-4 text-amber-500" /> Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews.</p>
          ) : (
            <ul className="space-y-1.5">
              {reviews.map((r) => (
                <li key={r.id}>
                  {"★".repeat(r.rating)} {r.product.name.split(/ [-—–(]/)[0]}{" "}
                  <Tag tone={r.status === "approved" ? "green" : r.status === "pending" ? "amber" : "gray"}>{r.status}</Tag>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Line({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3">
      <div className="text-lg font-bold text-brand-800">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
