"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { subscribeAction, type SubscribeState } from "@/app/(storefront)/newsletter-actions";

/** Newsletter sign-up in the plum footer band. */
export function JoinForm() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribeAction, { status: "idle" });

  if (state.status === "done" || state.status === "already") {
    return (
      <p className="rounded-2xl bg-white/10 px-5 py-4 text-sm text-white">
        {state.status === "done"
          ? "🎉 You're subscribed! Check your inbox for a welcome email."
          : "You're already subscribed — thank you!"}
      </p>
    );
  }

  return (
    <div>
      <form action={action}>
        <input name="email" type="email" required placeholder="Your email address" aria-label="Email address" />
        <button type="submit" disabled={pending}>
          {pending ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Join free"}
        </button>
      </form>
      {state.status === "error" && <p className="mt-2 text-xs text-red-200">{state.message}</p>}
      <p className="fine">
        By joining you agree to receive marketing emails; unsubscribe anytime. See our{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </div>
  );
}
