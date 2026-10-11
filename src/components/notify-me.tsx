"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** "Email me when it's back in stock" — shown on sold-out products. */
export function NotifyMe({ productId, email: initialEmail }: { productId: string; email: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError("");
    const res = await fetch("/api/stock-alert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, email }),
    }).catch(() => null);
    if (res?.ok) {
      setState("done");
    } else {
      const d = await res?.json().catch(() => ({}));
      setError(d?.error ?? "Something went wrong — please try again.");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <p id="notify" className="mt-4 flex items-start gap-2 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        {`Done! We'll email ${email} once, as soon as it's back in stock.`}
      </p>
    );
  }

  return (
    <form id="notify" onSubmit={submit} className="mt-4 rounded-2xl border border-border bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Bell className="h-4 w-4 text-brand-600" /> Get an email when it&apos;s back
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="notifyEmail"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-label="Your email"
          className="h-11 flex-1 rounded-full border border-border bg-white px-4 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <Button type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Saving…" : "Notify me"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
        We&apos;ll use your email only for this one alert — it doesn&apos;t sign you up to marketing.{" "}
        <a href="/privacy-policy" className="underline">Privacy Policy</a>.
      </p>
    </form>
  );
}
