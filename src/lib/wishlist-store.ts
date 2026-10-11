"use client";

import { create } from "zustand";

type WishlistState = {
  status: "idle" | "loading" | "ready";
  signedIn: boolean;
  ids: string[];
  /** Fetch once; `signedIn` (from the server) forces a re-fetch after signing in or out. */
  load: (signedIn?: boolean) => void;
  set: (productId: string, saved: boolean) => Promise<{ ok: boolean; error?: string; signedOut?: boolean }>;
};

/** Shared, lazily-loaded wishlist for every heart button on the page. */
export const useWishlist = create<WishlistState>()((set, get) => ({
  status: "idle",
  signedIn: false,
  ids: [],
  load: (signedIn) => {
    const st = get();
    if (st.status === "loading") return;
    if (st.status === "ready" && (signedIn === undefined || signedIn === st.signedIn)) return;
    set({ status: "loading" });
    fetch("/api/wishlist", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => set({ status: "ready", signedIn: !!d.signedIn, ids: d.ids ?? [] }))
      .catch(() => set({ status: "ready" }));
  },
  set: async (productId, saved) => {
    const before = get().ids;
    set({ ids: saved ? [...new Set([...before, productId])] : before.filter((i) => i !== productId) });
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId, saved }),
      });
      if (!res.ok) {
        set({ ids: before, ...(res.status === 401 ? { signedIn: false, status: "ready" as const } : {}) });
        const d = await res.json().catch(() => ({}));
        return { ok: false, error: d.error, signedOut: res.status === 401 };
      }
      return { ok: true };
    } catch {
      set({ ids: before });
      return { ok: false, error: "Couldn't save — please try again." };
    }
  },
}));
