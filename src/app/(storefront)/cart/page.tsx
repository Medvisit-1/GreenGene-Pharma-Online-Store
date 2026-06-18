"use client";

import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { shippingFor, FLAT_SHIPPING, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { useEffect, useState } from "react";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [ship, setShip] = useState({ flat: FLAT_SHIPPING, threshold: FREE_SHIPPING_THRESHOLD });
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  useEffect(() => {
    setMounted(true);
    fetch("/api/shipping").then((r) => r.json()).then(setShip).catch(() => {});
  }, []);

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
  const shipping = shippingFor(subtotal, ship.flat, ship.threshold);
  const total = subtotal + shipping;
  const remainingForFree = ship.threshold - subtotal;

  if (!mounted) return <div className="mx-auto max-w-7xl px-4 py-20" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center">
        <div className="rounded-full bg-brand-50 p-6">
          <ShoppingBag className="h-10 w-10 text-brand-400" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/products" className="mt-6">
          <Button size="lg">Start shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Your Cart</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <Link
                href={`/products/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-50"
              >
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-brand-300">
                    {item.name.charAt(0)}
                  </div>
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${item.slug}`}
                  className="line-clamp-2 text-sm font-semibold hover:text-brand-700"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPrice(item.price)} each
                </p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-border">
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-l-full hover:bg-muted"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.productId, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-8 w-8 items-center justify-center rounded-r-full hover:bg-muted disabled:opacity-40"
                      aria-label="Increase"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-brand-700">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => removeItem(item.productId)}
                className="self-start rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold">Order summary</h2>

          {remainingForFree > 0 && (
            <div className="mt-4 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
              Add <strong>{formatPrice(remainingForFree)}</strong> more for free delivery!
            </div>
          )}

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-medium">
                {shipping === 0 ? "Free" : formatPrice(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-brand-700">{formatPrice(total)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="mt-5 block">
            <Button size="lg" className="w-full">
              Checkout <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link
            href="/products"
            className="mt-3 block text-center text-sm text-muted-foreground hover:text-brand-700"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
