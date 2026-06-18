"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const count = items.reduce((n, i) => n + i.quantity, 0);

  // Close on Escape; lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className={cn(
          "fixed inset-0 z-50 bg-brand-900/40 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden
      />

      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5 text-brand-600" />
            Your cart {count > 0 && <span className="text-muted-foreground">({count})</span>}
          </h2>
          <button onClick={close} aria-label="Close cart" className="rounded-full p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-brand-50 p-5">
              <ShoppingBag className="h-8 w-8 text-brand-400" />
            </div>
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Link href="/products" onClick={close}>
              <Button>Browse products</Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 rounded-xl border border-border bg-white p-3">
                  <Link href={`/products/${item.slug}`} onClick={close} className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image} alt={item.name} className="h-full w-full object-contain" />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/products/${item.slug}`} onClick={close} className="line-clamp-2 text-xs font-semibold hover:text-brand-700">
                      {item.name}
                    </Link>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-border">
                        <button onClick={() => setQuantity(item.productId, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-l-full hover:bg-muted" aria-label="Decrease">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                        <button onClick={() => setQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} className="flex h-7 w-7 items-center justify-center rounded-r-full hover:bg-muted disabled:opacity-40" aria-label="Increase">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-brand-700">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.productId)} className="self-start rounded-full p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-base font-bold text-brand-700">{formatPrice(subtotal)}</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">Shipping calculated at checkout.</p>
              <Link href="/checkout" onClick={close} className="block">
                <Button size="lg" className="w-full">Checkout <ArrowRight className="h-4 w-4" /></Button>
              </Link>
              <Link href="/cart" onClick={close} className="mt-2 block text-center text-sm text-muted-foreground hover:text-brand-700">
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
