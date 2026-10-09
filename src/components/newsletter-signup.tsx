"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeAction, type SubscribeState } from "@/app/(storefront)/newsletter-actions";

export function NewsletterSignup() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribeAction, { status: "idle" });

  if (state.status === "done" || state.status === "already") {
    return (
      <p className="rounded-xl bg-white/10 px-4 py-3 text-sm text-white">
        {state.status === "done"
          ? "🎉 You're subscribed! Check your inbox for a welcome email."
          : "You're already subscribed — thank you!"}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="Your email"
          aria-label="Email address"
          className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-brand-900 hover:brightness-105 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
        </button>
      </div>
      {state.status === "error" && <p className="text-xs text-red-300">{state.message}</p>}
      <p className="text-xs text-white/50">News, launches & member offers. Unsubscribe anytime.</p>
    </form>
  );
}
