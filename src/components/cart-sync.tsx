"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";

/**
 * For signed-in customers: keep a copy of the cart on the server so we can send
 * one friendly reminder if it's left behind. Only changes are sent (never the
 * initial page load), so opening the site on another device can't wipe it.
 */
export function CartSync() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useCart.subscribe((state, prev) => {
      if (state.items === prev.items) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const items = useCart.getState().items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
        fetch("/api/cart", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items }),
          keepalive: true,
        }).catch(() => {});
      }, 1500);
    });
    return () => {
      clearTimeout(timer);
      unsub();
    };
  }, []);
  return null;
}
