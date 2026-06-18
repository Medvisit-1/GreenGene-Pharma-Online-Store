"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock, Tag, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { shippingFor, SA_PROVINCES, FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type Discount = { valid: boolean; code?: string; amount: number; message?: string };

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [discount, setDiscount] = useState<Discount | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [applying, setApplying] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  type PayMethod = { id: string; label: string; description: string };
  const [methods, setMethods] = useState<PayMethod[]>([]);
  const [payMethod, setPayMethod] = useState<string>("");

  const [ship, setShip] = useState({ flat: FLAT_SHIPPING, threshold: FREE_SHIPPING_THRESHOLD });
  useEffect(() => {
    setMounted(true);
    fetch("/api/shipping").then((r) => r.json()).then(setShip).catch(() => {});
    fetch("/api/payments/methods")
      .then((r) => r.json())
      .then((d) => {
        setMethods(d.methods ?? []);
        if (d.methods?.[0]) setPayMethod(d.methods[0].id);
      })
      .catch(() => {});
  }, []);

  const subtotal = useMemo(
    () => items.reduce((n, i) => n + i.price * i.quantity, 0),
    [items]
  );
  const shipping = shippingFor(subtotal, ship.flat, ship.threshold);
  const discountAmount = discount?.valid ? discount.amount : 0;
  const total = Math.max(0, subtotal - discountAmount) + shipping;

  async function applyCode() {
    if (!codeInput.trim()) return;
    setApplying(true);
    const res = await fetch(
      `/api/promo?code=${encodeURIComponent(codeInput)}&subtotal=${subtotal}`
    );
    const data: Discount = await res.json();
    setDiscount(data);
    setApplying(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!payMethod) {
      setError("Please choose a payment method.");
      return;
    }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      email: String(fd.get("email")),
      phone: String(fd.get("phone")),
      address: {
        line1: String(fd.get("line1")),
        line2: String(fd.get("line2")),
        city: String(fd.get("city")),
        province: String(fd.get("province")),
        postalCode: String(fd.get("postalCode")),
      },
      notes: String(fd.get("notes") || ""),
      discountCode: discount?.valid ? discount.code : undefined,
      paymentMethod: payMethod,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    try {
      // 1. Create the order
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      // 2. Start payment with the chosen gateway and redirect there
      const pay = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: data.orderNumber, method: payMethod }),
      });
      const payData = await pay.json();
      if (pay.ok && payData.redirectUrl) {
        clear();
        window.location.href = payData.redirectUrl;
        return;
      }
      setError(payData.error ?? "Could not start payment. Please try another method.");
      setSubmitting(false);
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (!mounted) return <div className="mx-auto max-w-7xl px-4 py-20" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold">Your cart is empty</h1>
        <Link href="/products" className="mt-6 inline-block">
          <Button size="lg">Start shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: details */}
        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Contact details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Phone" name="phone" type="tel" required />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Street address" name="line1" required />
              </div>
              <div className="sm:col-span-2">
                <Field label="Apartment, suite, etc. (optional)" name="line2" />
              </div>
              <Field label="City / Town" name="city" required />
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Province <span className="text-brand-600">*</span>
                </label>
                <select
                  name="province"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="" disabled>Select province</option>
                  {SA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <Field label="Postal code" name="postalCode" required />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Order notes (optional)</h2>
            <textarea
              name="notes"
              rows={3}
              placeholder="Delivery instructions, etc."
              className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-1 text-lg font-bold">Payment</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Choose how you&apos;d like to pay. You&apos;ll be securely redirected to
              complete your card payment.
            </p>
            <div className="space-y-3">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    payMethod === m.id
                      ? "border-brand-500 bg-brand-50"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={m.id}
                    checked={payMethod === m.id}
                    onChange={() => setPayMethod(m.id)}
                    className="mt-1 h-4 w-4 accent-brand-600"
                  />
                  <span>
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Right: summary */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Your order</h2>

          <ul className="mt-4 space-y-3">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-50">
                  {i.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={i.image} alt={i.name} className="h-full w-full object-cover" />
                  )}
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {i.quantity}
                  </span>
                </div>
                <span className="line-clamp-2 flex-1 text-xs">{i.name}</span>
                <span className="text-xs font-semibold">
                  {formatPrice(i.price * i.quantity)}
                </span>
              </li>
            ))}
          </ul>

          {/* Promo */}
          <div className="mt-5">
            {discount?.valid ? (
              <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-sm">
                <span className="inline-flex items-center gap-1.5 font-semibold text-brand-700">
                  <Tag className="h-4 w-4" /> {discount.code}
                </span>
                <button
                  type="button"
                  onClick={() => { setDiscount(null); setCodeInput(""); }}
                  className="text-muted-foreground hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Promo code"
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  <Button type="button" variant="secondary" onClick={applyCode} disabled={applying}>
                    {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {discount && !discount.valid && discount.message && (
                  <p className="mt-1.5 text-xs text-red-600">{discount.message}</p>
                )}
              </div>
            )}
          </div>

          <dl className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-brand-600">
                <dt>Discount</dt>
                <dd className="font-medium">−{formatPrice(discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium">{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-brand-700">{formatPrice(total)}</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <Button type="submit" size="lg" disabled={submitting} className="mt-5 w-full">
            {submitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Redirecting to payment…</>
            ) : (
              <><Lock className="h-4 w-4" /> Pay {formatPrice(total)}</>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Secure payment · you&apos;ll be redirected to your chosen gateway.
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-brand-600">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
