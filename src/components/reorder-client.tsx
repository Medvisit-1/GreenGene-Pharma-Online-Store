"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ShoppingBag } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";

type Props = {
  available: CartItem[];
  unavailable: { id: string; name: string; slug: string; active: boolean }[];
};

/** Adds the reorder items to the cart once, then sends the customer to the cart. */
export function ReorderClient({ available, unavailable }: Props) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const { items, addItem } = useCart.getState();
    for (const it of available) {
      const inCart = items.find((i) => i.productId === it.productId)?.quantity ?? 0;
      // Top the cart up to the reorder quantity rather than doubling it on a refresh
      const add = Math.max(0, it.quantity - inCart);
      if (add > 0) addItem({ ...it }, add);
    }
    if (!unavailable.length) router.replace("/cart");
  }, [available, unavailable, router]);

  if (!unavailable.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 animate-pulse text-brand-500" />
        <p className="mt-3 text-muted-foreground">Adding your products to the cart…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Buy again</h1>
      {available.length > 0 && (
        <p className="mt-2 text-sm text-muted-foreground">
          Added to your cart: {available.map((a) => `${a.name} × ${a.quantity}`).join(", ")}.
        </p>
      )}
      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Not available right now:</p>
        <ul className="mt-2 space-y-1.5">
          {unavailable.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3">
              <span>{u.name}</span>
              {u.active && (
                <Link href={`/products/${u.slug}#notify`} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 hover:underline">
                  <Bell className="h-3.5 w-3.5" /> Notify me
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 flex gap-3">
        {available.length > 0 && <Link href="/cart"><Button>Go to cart</Button></Link>}
        <Link href="/products"><Button variant="outline">Keep shopping</Button></Link>
      </div>
    </div>
  );
}
