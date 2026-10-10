"use client";

import { useState } from "react";
import { Gift, X } from "lucide-react";
import { REF_BANNER_HIDE_COOKIE } from "@/lib/constants";

/** Welcome bar for visitors who arrived through a friend's referral link. */
export function ReferralBanner({ name, code }: { name: string; code: string }) {
  const [show, setShow] = useState(true);
  if (!show) return null;

  return (
    <div className="relative bg-gradient-to-r from-plum-800 via-plum-700 to-grape text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 pr-12 sm:justify-center">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Gift className="h-4 w-4 text-accent" />
        </span>
        <p className="text-sm leading-snug">
          <strong>Welcome! {name} invited you to GreenGene Pharma.</strong>{" "}
          <span className="text-plum-100">
            Their referral code{" "}
            <span className="rounded bg-white/15 px-1.5 py-0.5 font-mono text-xs font-bold tracking-wider text-white">
              {code}
            </span>{" "}
            is added for you automatically at checkout.
          </span>
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setShow(false);
          // Session cookie: hidden for the rest of this visit.
          document.cookie = `${REF_BANNER_HIDE_COOKIE}=${encodeURIComponent(code)}; path=/; SameSite=Lax`;
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
