"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { requestLoginLink, type LoginState } from "@/app/(storefront)/account/actions";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLoginLink, {
    status: "idle",
  });

  if (state.status === "sent") {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-plum-600 to-grape text-white shadow-md shadow-plum-700/25">
          <MailCheck className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-brand-800">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a sign-in link to <strong className="text-foreground">{state.email}</strong>. It
          works once and expires in 15 minutes.
        </p>
        <p className="mt-4 text-xs text-muted-foreground">
          Can&apos;t find it? Check your spam folder, or{" "}
          <a href="/account" className="font-semibold text-plum-700 hover:underline">try again</a>.
        </p>
      </div>
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
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100"
        />
      </div>
      {state.status === "error" && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.message}</p>
      )}
      <Button type="submit" size="lg" variant="plum" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Email me a sign-in link"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        No password needed. New here? Enter your email — we&apos;ll create your account and link
        any previous orders automatically.
      </p>
    </form>
  );
}
