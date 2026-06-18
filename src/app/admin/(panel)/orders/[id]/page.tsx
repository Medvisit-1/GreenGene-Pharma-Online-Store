import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { updateOrder } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded", "failed"];
const sel = "rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();
  const address = JSON.parse(order.shippingAddress || "{}");

  return (
    <div className="space-y-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{order.orderNumber}</h1>
        <Link href={`/orders/${order.orderNumber}/invoice`} target="_blank">
          <Button variant="outline"><FileText className="h-4 w-4" /> Invoice</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Items */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3 font-bold">Items</h2>
            <ul className="divide-y divide-border">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white">
                    {i.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={i.image} alt="" className="h-full w-full object-contain" />
                    )}
                  </div>
                  <span className="flex-1">{i.name}</span>
                  <span className="text-muted-foreground">×{i.quantity}</span>
                  <span className="w-20 text-right font-medium">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-brand-600"><dt>Discount {order.discountCode ? `(${order.discountCode})` : ""}</dt><dd>−{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-muted-foreground">Shipping</dt><dd>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold"><dt>Total</dt><dd className="text-brand-700">{formatPrice(order.total)}</dd></div>
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-5 text-sm">
            <h2 className="mb-2 font-bold">Customer & delivery</h2>
            <p className="text-muted-foreground">
              {order.email}{order.phone ? ` · ${order.phone}` : ""}<br />
              {address.line1}{address.line2 ? `, ${address.line2}` : ""}<br />
              {address.city}, {address.province} {address.postalCode}<br />
              {address.country}
            </p>
            {order.notes && <p className="mt-3"><span className="font-medium">Notes:</span> {order.notes}</p>}
          </section>
        </div>

        {/* Status update */}
        <aside className="h-fit rounded-2xl border border-border bg-surface p-5">
          <h2 className="mb-4 font-bold">Update order</h2>
          <form action={updateOrder} className="space-y-4">
            <input type="hidden" name="id" value={order.id} />
            <div>
              <label className="mb-1.5 block text-sm font-medium">Order status</label>
              <select name="status" defaultValue={order.status} className={`${sel} w-full capitalize`}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Payment status</label>
              <select name="paymentStatus" defaultValue={order.paymentStatus} className={`${sel} w-full capitalize`}>
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <Button type="submit" className="w-full">Save</Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
