import { Check, CreditCard, Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type TimelineOrder = {
  createdAt: Date;
  paymentStatus: string;
  status: string;
  paidAt: Date | null;
  shippedAt: Date | null;
  trackingNumber?: string | null;
};

function fmt(d: Date | null) {
  return d
    ? d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" })
    : null;
}

/** Ordered → Paid → Shipped progress for a customer's order. */
export function OrderTimeline({ order, compact = false }: { order: TimelineOrder; compact?: boolean }) {
  if (order.paymentStatus === "refunded" || order.paymentStatus === "failed") {
    return (
      <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
        This order was {order.paymentStatus === "refunded" ? "refunded" : "not paid"}.
      </p>
    );
  }
  const paid = order.paymentStatus === "paid";
  const shipped = order.status === "fulfilled" || !!order.shippedAt || !!order.trackingNumber;
  const steps = [
    { label: "Ordered", icon: ShoppingBag, done: true, date: fmt(order.createdAt) },
    { label: "Paid", icon: CreditCard, done: paid, date: paid ? fmt(order.paidAt) : null },
    { label: "Shipped", icon: Package, done: shipped, date: shipped ? fmt(order.shippedAt) : null },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {steps.map((s, i) => {
        const Icon = s.done ? Check : s.icon;
        return (
          <li key={s.label} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2",
                  s.done ? "bg-brand-500" : "bg-border"
                )}
                style={{ zIndex: 0 }}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid h-7 w-7 place-items-center rounded-full border-2",
                s.done
                  ? "border-brand-500 bg-brand-500 text-white"
                  : i === current
                    ? "border-brand-500 bg-surface text-brand-600"
                    : "border-border bg-surface text-muted-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className={cn("mt-1.5 font-semibold", compact ? "text-[11px]" : "text-xs", s.done ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
              <span className="sr-only">{s.done ? " (done)" : i === current ? " (next)" : ""}</span>
            </span>
            {!compact && s.date && <span className="text-[11px] text-muted-foreground">{s.date}</span>}
          </li>
        );
      })}
    </ol>
  );
}
