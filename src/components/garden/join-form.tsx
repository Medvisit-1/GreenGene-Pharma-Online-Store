"use client";

import { useActionState, useId } from "react";
import { Loader2 } from "lucide-react";
import { subscribeAction, type SubscribeState } from "@/app/(storefront)/newsletter-actions";

/** Newsletter sign-up in the footer band. Phones: label above, full-width 48px field and button. */
export function JoinForm() {
  const [state, action, pending] = useActionState<SubscribeState, FormData>(subscribeAction, { status: "idle" });
  const id = useId();

  if (state.status === "done" || state.status === "already") {
    return (
      <p className="rounded-2xl bg-white/10 px-5 py-4 text-sm text-white" role="status">
        {state.status === "done"
          ? "You’re subscribed! Check your inbox for a welcome email."
          : "You’re already subscribed. Thank you!"}
      </p>
    );
  }

  return (
    <div className="gg-join">
      <form action={action} className="gg-join-form">
        <label htmlFor={`${id}-email`} className="gg-join-label">Email address</label>
        <div className="gg-join-row">
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            spellCheck={false}
            required
            placeholder="you@example.com"
            aria-describedby={state.status === "error" ? `${id}-err` : undefined}
            aria-invalid={state.status === "error" || undefined}
          />
          <button type="submit" disabled={pending} aria-busy={pending || undefined}>
            {pending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                <span>Joining…</span>
              </>
            ) : (
              "Join Free"
            )}
          </button>
        </div>
      </form>
      <p id={`${id}-err`} className="mt-2 text-xs text-red-200" aria-live="polite">
        {state.status === "error" ? state.message : ""}
      </p>
      <p className="fine">
        By joining you agree to receive marketing emails; unsubscribe anytime. See our{" "}
        <a href="/privacy-policy">Privacy Policy</a>.
      </p>
    </div>
  );
}
