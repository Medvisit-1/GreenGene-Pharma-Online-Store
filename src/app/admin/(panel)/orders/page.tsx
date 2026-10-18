import { CheckCheck, Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OrderRow } from "@/components/admin/order-row";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { fulfillAllPaid } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ fulfilled?: string }> }) {
  const { fulfilled } = await searchParams;
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
        <div className="flex flex-wrap gap-2">
        {paidToShip > 0 ? (
          <form action={fulfillAllPaid}>
            <ConfirmSubmit
              message={`Mark all ${paidToShip} paid order${paidToShip === 1 ? "" : "s"} as fulfilled? Each customer will get a "your order is on its way" email.`}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <CheckCheck className="h-4 w-4" /> Mark all as fulfilled ({paidToShip})
            </ConfirmSubmit>
          </form>
        ) : (
          <Button disabled>
            <CheckCheck className="h-4 w-4" /> Mark all as fulfilled
          </Button>
        )}
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
      </div>

      {fulfilled !== undefined && (
        <p role="status" className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          {fulfilled === "0"
            ? "There were no paid orders waiting to be fulfilled."
            : `${fulfilled} order${fulfilled === "1" ? "" : "s"} marked as fulfilled — customers have been emailed.`}
        </p>
      )}

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
                <th className="px-2 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={{
                    id: o.id,
                    orderNumber: o.orderNumber,
                    email: o.email,
                    createdLabel: o.createdAt.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" }),
                    itemCount: o._count.items,
                    status: o.status,
                    paymentStatus: o.paymentStatus,
                    totalLabel: formatPrice(o.total),
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
