"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Method = { id: string; label: string; description?: string };

/** Pay for an existing unpaid order (after a failed attempt, or from the reminder email). */
export function PayNow({ orderNumber, total, methods }: { orderNumber: string; total: number; methods: Method[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pay = async (method: string) => {
    setBusy(method);
    setError("");
    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, method }),
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }
      setError(data.error ?? "Could not start payment. Please try another method.");
    } catch {
      setError("Network error. Please try again.");
    }
    setBusy(null);
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-amber-900">
        <CreditCard className="h-5 w-5" /> Complete your payment — {formatPrice(total)}
      </h2>
      <p className="mt-1 text-sm text-amber-900/80">Your order is saved. Choose how you&apos;d like to pay:</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pay(m.id)}
            disabled={!!busy}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy === m.id && <Loader2 className="h-4 w-4 animate-spin" />}
            Pay with {m.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </section>
  );
}
