"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Gift, Loader2, Lock, Tag, Users, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { shippingFor, SA_PROVINCES, FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Button } from "@/components/ui/button";

type Discount = { valid: boolean; code?: string; amount: number; message?: string; freeShipping?: boolean };
type RewardCode = { code: string; label: string };
type Referral = { valid: boolean; code?: string; name?: string };

const PAYMENT_LOGOS: Record<string, { src: string; dark?: boolean }> = {
  yoco: { src: "/payment/yoco.svg" },
  // Bob Pay's wordmark is white, so show it on a dark chip
  bobpay: { src: "/payment/bobpay.svg", dark: true },
  paystack: { src: "/payment/paystack.svg" },
};

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

  // Saved customer details (browser, no login needed)
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [saveDetails, setSaveDetails] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  // Signed-in customer's reward codes (auto-applied, switchable)
  const [rewardCodes, setRewardCodes] = useState<RewardCode[]>([]);
  const [signedIn, setSignedIn] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Refer-a-friend: filled in automatically from the link, or typed in (switched devices)
  const [referral, setReferral] = useState<Referral | null>(null);
  const [refInput, setRefInput] = useState("");
  const [refChecking, setRefChecking] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);
  const autoApplied = useRef(false);

  const [ship, setShip] = useState({ flat: FLAT_SHIPPING, threshold: FREE_SHIPPING_THRESHOLD });
  useEffect(() => {
    let local: Record<string, string> = {};
    try {
      const s = localStorage.getItem("greengene-customer");
      if (s) local = JSON.parse(s);
    } catch {
      /* ignore */
    }
    // Account details (when signed in) win over device-saved ones; render once both are known.
    fetch("/api/account/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.customer) {
          setSignedIn(true);
          const acct = Object.fromEntries(
            Object.entries(d.customer as Record<string, string>).filter(([, v]) => v)
          );
          local = { ...local, ...acct };
          setRewardCodes(d.rewardCodes ?? []);
        }
      })
      .catch(() => {})
      .finally(() => {
        setSaved(local);
        setMounted(true);
      });
    fetch("/api/shipping").then((r) => r.json()).then(setShip).catch(() => {});
    fetch("/api/referral")
      .then((r) => r.json())
      .then((d: Referral) => d.valid && setReferral(d))
      .catch(() => {});
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
  const freeShipping = !!(discount?.valid && discount.freeShipping);
  const discountAmount = discount?.valid && !freeShipping ? discount.amount : 0;
  const shippingDue = freeShipping ? 0 : shipping;
  const total = Math.max(0, subtotal - discountAmount) + shippingDue;

  async function applyCode(code = codeInput) {
    if (!code.trim()) return;
    setApplying(true);
    // Reward codes are locked to an email, so send the one entered in the form.
    const email = String(new FormData(formRef.current ?? undefined).get("email") ?? "");
    const res = await fetch(
      `/api/promo?code=${encodeURIComponent(code)}&subtotal=${subtotal}&email=${encodeURIComponent(email)}`
    );
    const data: Discount = await res.json();
    setDiscount(data);
    setApplying(false);
  }

  // Auto-apply whichever of the customer's reward codes saves them the most.
  useEffect(() => {
    if (!mounted || autoApplied.current || discount || !rewardCodes.length || subtotal <= 0) return;
    autoApplied.current = true;
    const email = String(new FormData(formRef.current ?? undefined).get("email") ?? "");
    Promise.all(
      rewardCodes.map((r) =>
        fetch(`/api/promo?code=${encodeURIComponent(r.code)}&subtotal=${subtotal}&email=${encodeURIComponent(email)}`)
          .then((res) => res.json() as Promise<Discount>)
          .catch(() => null)
      )
    ).then((results) => {
      const best = results
        .filter((d): d is Discount => !!d?.valid)
        .sort((a, b) => b.amount - a.amount)[0];
      if (best) setDiscount((cur) => cur ?? best);
    });
  }, [mounted, rewardCodes, subtotal, discount]);

  async function applyReferral() {
    const code = refInput.trim();
    if (!code) return;
    setRefChecking(true);
    setRefError(null);
    try {
      const d: Referral = await (await fetch(`/api/referral?code=${encodeURIComponent(code)}`)).json();
      if (d.valid) setReferral(d);
      else setRefError("We couldn't find that referral code. Check it with your friend.");
    } catch {
      setRefError("Couldn't check the code. Please try again.");
    }
    setRefChecking(false);
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
        suburb: String(fd.get("suburb")),
        city: String(fd.get("city")),
        province: String(fd.get("province")),
        postalCode: String(fd.get("postalCode")),
      },
      notes: String(fd.get("notes") || ""),
      discountCode: discount?.valid ? discount.code : undefined,
      paymentMethod: payMethod,
      newsletter,
      referralCode: referral?.valid ? referral.code : undefined,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    // Save (or clear) the customer's details on this device
    try {
      if (saveDetails) {
        localStorage.setItem(
          "greengene-customer",
          JSON.stringify({ name: payload.name, email: payload.email, phone: payload.phone, ...payload.address })
        );
      } else {
        localStorage.removeItem("greengene-customer");
      }
    } catch {
      /* ignore */
    }

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

      {!signedIn && (
        <p className="-mt-4 mb-6 text-sm text-muted-foreground">
          Have an account?{" "}
          <Link href="/account" className="font-semibold text-brand-700 hover:underline">Sign in</Link>{" "}
          to fill in your details and use your rewards.
        </p>
      )}
      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: details */}
        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Contact details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" name="name" required defaultValue={saved.name} />
              <Field label="Email" name="email" type="email" required defaultValue={saved.email} />
              <Field label="Phone" name="phone" type="tel" required defaultValue={saved.phone} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-bold">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Street address" name="line1" required defaultValue={saved.line1} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Apartment, suite, etc. (optional)" name="line2" defaultValue={saved.line2} />
              </div>
              <Field label="Suburb" name="suburb" required defaultValue={saved.suburb} />
              <Field label="City / Town" name="city" required defaultValue={saved.city} />
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Province <span className="text-brand-600">*</span>
                </label>
                <select
                  name="province"
                  required
                  defaultValue={saved.province ?? ""}
                  className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="" disabled>Select province</option>
                  {SA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <Field label="Postal code" name="postalCode" required defaultValue={saved.postalCode} />
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={saveDetails}
                onChange={(e) => setSaveDetails(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Save my details on this device for faster checkout next time
            </label>
            <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Email me news, launches and offers (unsubscribe anytime)
            </label>
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
                  <span className="flex-1">
                    <span className="block text-sm font-semibold">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{m.description}</span>
                  </span>
                  {PAYMENT_LOGOS[m.id] && (
                    <span
                      className={`ml-2 flex shrink-0 items-center self-center rounded-lg ${
                        PAYMENT_LOGOS[m.id].dark ? "bg-brand-900 px-2.5 py-1.5" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={PAYMENT_LOGOS[m.id].src}
                        alt={m.label}
                        className="h-5 w-auto"
                      />
                    </span>
                  )}
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

          {/* Refer-a-friend code */}
          <div className="mt-5">
            {referral?.valid ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-plum-200 bg-plum-50 px-3 py-2.5 text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-plum-600" />
                <span className="min-w-0 flex-1 text-plum-800">
                  Invited by <strong>{referral.name}</strong>
                  <span className="ml-1.5 rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wider text-plum-700 ring-1 ring-plum-200">
                    {referral.code}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Remove referral code"
                  onClick={() => { setReferral(null); setRefInput(""); }}
                  className="text-plum-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Referred by a friend? Enter their code
                </div>
                <div className="flex gap-2">
                  <input
                    value={refInput}
                    onChange={(e) => { setRefInput(e.target.value.toUpperCase()); setRefError(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyReferral(); } }}
                    placeholder="Referral code"
                    autoCapitalize="characters"
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 font-mono text-sm uppercase outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100"
                  />
                  <Button type="button" variant="secondary" onClick={applyReferral} disabled={refChecking}>
                    {refChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
                {refError && <p className="mt-1.5 text-xs text-red-600">{refError}</p>}
              </div>
            )}
          </div>

          {/* Signed-in customer's reward codes */}
          {rewardCodes.length > 0 && (
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">
                <Gift className="h-3.5 w-3.5" /> Your rewards
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rewardCodes.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => applyCode(r.code)}
                    className={`rounded-lg border px-2.5 py-1 text-left text-xs font-semibold transition ${
                      discount?.valid && discount.code === r.code
                        ? "border-brand-500 bg-brand-600 text-white"
                        : "border-brand-200 bg-white text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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
                  <Button type="button" variant="secondary" onClick={() => applyCode()} disabled={applying}>
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
              <dd className="font-medium">
                {freeShipping && shipping > 0 ? (
                  <><s className="mr-1.5 text-muted-foreground">{formatPrice(shipping)}</s><span className="text-brand-600">Free</span></>
                ) : shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
