import Link from "next/link";
import { Package, ShoppingCart, Banknote, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [products, orders, paidAgg, pendingReviews, recentOrders, lowStock] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "paid" },
      }),
      prisma.review.count({ where: { status: "pending" } }),
      prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      prisma.product.findMany({
        where: { active: true, stock: { lte: 5 } },
        orderBy: { stock: "asc" },
        take: 5,
      }),
    ]);

  const revenue = paidAgg._sum.total ?? 0;

  const cards = [
    { label: "Products", value: products, icon: Package, href: "/admin/products" },
    { label: "Orders", value: orders, icon: ShoppingCart, href: "/admin/orders" },
    { label: "Revenue (paid)", value: formatPrice(revenue), icon: Banknote, href: "/admin/orders" },
    { label: "Pending reviews", value: pendingReviews, icon: Star, href: "/admin/reviews" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className="h-5 w-5 text-brand-500" />
            </div>
            <p className="mt-2 text-2xl font-extrabold text-brand-700">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-brand-700 hover:underline">View all</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between py-3 text-sm hover:text-brand-700">
                    <span className="font-medium">{o.orderNumber}</span>
                    <span className="text-muted-foreground">{o.email}</span>
                    <span className="font-semibold">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-bold">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well stocked.</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center justify-between py-3 text-sm hover:text-brand-700">
                    <span className="line-clamp-1 font-medium">{p.name}</span>
                    <span className={p.stock === 0 ? "font-semibold text-red-600" : "font-semibold text-amber-600"}>
                      {p.stock} left
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
