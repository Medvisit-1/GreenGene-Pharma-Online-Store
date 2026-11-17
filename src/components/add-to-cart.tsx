"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image?: string;
    stock: number;
  };
};

export function AddToCart({ product }: Props) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const buyNow = useCart((s) => s.buyNow);
  const openCart = useCart((s) => s.open);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [going, setGoing] = useState(false);
  const outOfStock = product.stock <= 0;

  const line = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock,
  };

  const handleAdd = () => {
    addItem(line, qty);
    setAdded(true);
    toast.success(`Added to cart`, { description: product.name });
    openCart();
    setTimeout(() => setAdded(false), 1800);
  };

  const handleBuyNow = () => {
    setGoing(true);
    buyNow(line, qty);
    router.push("/checkout");
  };

  if (outOfStock) {
    return (
      <p className="gg-soldout-note">Resting for now. Leave your email below and we will let you know the moment it is back.</p>
    );
  }

  return (
    <div className="gg-buy flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="gg-qty flex items-center rounded-full border border-border" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="flex h-12 w-12 items-center justify-center rounded-l-full text-foreground/70 hover:bg-muted disabled:opacity-40"
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            disabled={qty >= product.stock}
            className="flex h-12 w-12 items-center justify-center rounded-r-full text-foreground/70 hover:bg-muted disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <span className="text-xs text-muted-foreground max-sm:hidden">Pay securely at checkout</span>
      </div>
      {/* on phones this row sticks above the bottom tab bar while the product details scroll */}
      <div className="gg-buybar grid grid-cols-2 gap-3">
        <Button onClick={handleAdd} size="lg" variant="outline" className="gg-btn-add h-12 w-full">
          {added ? (
            <>
              <Check className="h-5 w-5" aria-hidden="true" /> Added
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Add to Cart
            </>
          )}
        </Button>
        <Button onClick={handleBuyNow} size="lg" className="gg-btn-buy h-12 w-full" disabled={going}>
          <Zap className="h-5 w-5" aria-hidden="true" /> {going ? "Opening…" : "Buy Now"}
        </Button>
      </div>
    </div>
  );
}
