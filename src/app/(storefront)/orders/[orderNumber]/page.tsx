import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, Package, Clock, XCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PaymentPoller } from "@/components/payment-poller";

export const dynamic = "force-dynamic";

type Params = Promise<{ orderNumber: string }>;
type Search = Promise<{ new?: string; paid?: string; failed?: string }>;

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { orderNumber } = await params;
  const { new: isNew, paid, failed } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const address = JSON.parse(order.shippingAddress || "{}");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {failed ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <XCircle className="h-16 w-16 text-red-500" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Payment unsuccessful</h1>
          <p className="mt-2 text-muted-foreground">
            We couldn&apos;t complete payment for order <strong>{order.orderNumber}</strong>.
          </p>
          <Link href="/checkout" className="mt-5">
            <Button>Try again</Button>
          </Link>
        </div>
      ) : order.paymentStatus === "paid" ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-brand-500" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Payment received!</h1>
          <p className="mt-2 text-muted-foreground">
            Thank you — order <strong>{order.orderNumber}</strong> is paid and being prepared. A
            confirmation has been sent to {order.email}.
          </p>
        </div>
      ) : paid ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <PaymentPoller />
          <Clock className="h-16 w-16 text-amber-500" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Confirming your payment…</h1>
          <p className="mt-2 text-muted-foreground">
            Thanks! We&apos;re confirming payment for order <strong>{order.orderNumber}</strong>.
            This page will show as paid once your gateway confirms (usually within a minute).
          </p>
        </div>
      ) : isNew ? (
        <div className="mb-8 flex flex-col items-center text-center">
          <CheckCircle2 className="h-16 w-16 text-brand-500" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Thank you for your order!
          </h1>
          <p className="mt-2 text-muted-foreground">
            We&apos;ve received order <strong>{order.orderNumber}</strong>. A
            confirmation has been sent to {order.email}.
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-brand-50/50 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Order</p>
            <p className="text-lg font-bold text-brand-800">{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge label={order.status} />
            <StatusBadge label={order.paymentStatus} payment />
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-bold">Delivery to</h3>
            <p className="text-sm text-muted-foreground">
              {order.email}
              {order.phone ? ` · ${order.phone}` : ""}
              <br />
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.city}, {address.province} {address.postalCode}
              <br />
              {address.country}
            </p>
          </div>
          <div className="sm:text-right">
            <h3 className="mb-1 text-sm font-bold">Placed</h3>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleString("en-ZA")}
            </p>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <Package className="h-4 w-4 text-brand-600" /> Items
          </h3>
          <ul className="divide-y divide-border">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  {i.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="flex-1 text-sm">{i.name}</span>
                <span className="text-sm text-muted-foreground">×{i.quantity}</span>
                <span className="w-24 text-right text-sm font-semibold">
                  {formatPrice(i.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <dl className="space-y-2 border-t border-border bg-muted/40 px-6 py-4 text-sm">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          {order.discount > 0 && (
            <Row
              label={`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`}
              value={`−${formatPrice(order.discount)}`}
              accent
            />
          )}
          <Row label="Shipping" value={order.shipping === 0 ? "Free" : formatPrice(order.shipping)} />
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="text-brand-700">{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={`/orders/${order.orderNumber}/invoice`}>
          <Button variant="secondary" size="lg">
            <FileText className="h-4 w-4" /> View / print invoice
          </Button>
        </Link>
        <Link href="/products">
          <Button size="lg">Continue shopping</Button>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? "text-brand-600" : ""}`}>
      <dt className={accent ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function StatusBadge({ label, payment }: { label: string; payment?: boolean }) {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-brand-100 text-brand-700",
    unpaid: "bg-red-100 text-red-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-brand-100 text-brand-700",
    cancelled: "bg-gray-200 text-gray-600",
    refunded: "bg-gray-200 text-gray-600",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[label] ?? "bg-gray-100 text-gray-600"}`}>
      {payment ? "Payment: " : ""}{label}
    </span>
  );
}
