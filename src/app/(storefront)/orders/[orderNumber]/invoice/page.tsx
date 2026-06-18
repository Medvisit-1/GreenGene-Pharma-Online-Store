import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

type Params = Promise<{ orderNumber: string }>;

export default async function InvoicePage({ params }: { params: Params }) {
  const { orderNumber } = await params;
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });
  if (!order) notFound();

  const address = JSON.parse(order.shippingAddress || "{}");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Toolbar (hidden when printing) */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/orders/${order.orderNumber}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to order
        </Link>
        <PrintButton />
      </div>

      {/* Invoice document */}
      <div className="rounded-2xl border border-border bg-white p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b border-border pb-6">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="GreenGene Pharma" className="h-14 w-auto" />
            <p className="mt-3 text-xs text-muted-foreground">
              Johannesburg, South Africa
              <br />
              info@greengenepharma.co.za · +27 (0)11 000 0000
            </p>
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-semibold tracking-tight">INVOICE</h1>
            <p className="mt-1 text-sm font-semibold">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 py-6">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Bill to
            </p>
            <p className="text-sm">
              {address.line1}
              {address.line2 ? `, ${address.line2}` : ""}
              <br />
              {address.suburb ? <>{address.suburb}<br /></> : null}
              {address.city}, {address.province} {address.postalCode}
              <br />
              {address.country}
              <br />
              {order.email}
              {order.phone ? ` · ${order.phone}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Payment status
            </p>
            <p className="text-sm font-semibold capitalize">{order.paymentStatus}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">
              Order status
            </p>
            <p className="text-sm font-semibold capitalize">{order.status}</p>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-border">
                <td className="py-3 pr-2">{i.name}</td>
                <td className="py-3 text-center">{i.quantity}</td>
                <td className="py-3 text-right">{formatPrice(i.price)}</td>
                <td className="py-3 text-right font-medium">
                  {formatPrice(i.price * i.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 w-64 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-brand-600">
              <span>Discount{order.discountCode ? ` (${order.discountCode})` : ""}</span>
              <span>−{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
            <span>Total</span>
            <span className="text-brand-700">{formatPrice(order.total)}</span>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Thank you for shopping with GreenGene Pharma. This invoice was generated
          electronically and is valid without a signature.
        </p>
      </div>
    </div>
  );
}
