"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { loginAction, type LoginState } from "@/app/(storefront)/account/actions";
import { Button } from "@/components/ui/button";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { step: "email" });

  if (state.step === "code") {
    return (
      <form action={action} className="space-y-4">
        <input type="hidden" name="email" value={state.email ?? ""} />
        <div className="flex items-start gap-2.5 rounded-xl bg-plum-50 px-3.5 py-3 text-left ring-1 ring-plum-100">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-plum-600" />
          <p className="text-sm text-plum-800">
            {state.message ?? "Enter the 6-digit code we emailed to"}{" "}
            {!state.message && <strong className="text-foreground">{state.email}</strong>}
          </p>
        </div>
        <div>
          <label htmlFor="code" className="mb-1.5 block text-sm font-medium">Sign-in code</label>
          <input
            id="code"
            name="code"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]{6,7}"
            maxLength={7}
            placeholder="••••••"
            className={`${field} text-center font-mono text-2xl font-bold tracking-[0.5em] text-plum-800 placeholder:text-plum-200`}
          />
        </div>
        {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <Button type="submit" name="intent" value="verify" size="lg" variant="plum" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & sign in"}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <button type="submit" name="intent" value="resend" formNoValidate disabled={pending} className="font-semibold text-plum-700 hover:underline disabled:opacity-50">
            Send a new code
          </button>
          <button type="submit" name="intent" value="change" formNoValidate disabled={pending} className="text-muted-foreground hover:text-foreground hover:underline disabled:opacity-50">
            Use a different email
          </button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          The code expires in 10 minutes. Can&apos;t see it? Check your spam folder.
        </p>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email}
          placeholder="you@example.com"
          className={field}
        />
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" name="intent" value="send" size="lg" variant="plum" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Email me a sign-in code"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No password needed. New here? Enter your email — we&apos;ll create your account and link any
        previous orders automatically.
      </p>
    </form>
  );
}
