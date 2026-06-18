import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const statusColor: Record<string, string> = {
  unfulfilled: "bg-amber-100 text-amber-700",
  fulfilled: "bg-brand-100 text-brand-700",
};

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  const paidToShip = orders.filter(
    (o) => o.paymentStatus === "paid" && o.status === "unfulfilled"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Orders ({orders.length})</h1>
        {paidToShip > 0 ? (
          <a href="/api/admin/bobgo-export">
            <Button variant="outline">
              <Download className="h-4 w-4" /> Export paid orders → Bob Go CSV ({paidToShip})
            </Button>
          </a>
        ) : (
          <Button variant="outline" disabled>
            <Download className="h-4 w-4" /> Export paid orders → Bob Go CSV
          </Button>
        )}
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No orders yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date &amp; time</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/admin/orders/${o.id}`} className="hover:text-brand-700">{o.orderNumber}</Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("en-ZA", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Johannesburg",
                    })}
                  </td>
                  <td className="px-4 py-3">{o._count.items}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor[o.status] ?? "bg-gray-100"}`}>{o.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${o.paymentStatus === "paid" ? "bg-brand-100 text-brand-700" : "bg-red-100 text-red-700"}`}>{o.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
