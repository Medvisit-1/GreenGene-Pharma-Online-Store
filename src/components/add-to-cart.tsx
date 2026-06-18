"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
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
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.open);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
      },
      qty
    );
    setAdded(true);
    toast.success(`Added to cart`, { description: product.name });
    openCart();
    setTimeout(() => setAdded(false), 1800);
  };

  if (outOfStock) {
    return (
      <Button disabled variant="outline" size="lg" className="w-full">
        Out of stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex items-center rounded-full border border-border">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="flex h-12 w-12 items-center justify-center rounded-l-full text-foreground/70 hover:bg-muted"
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-10 text-center text-sm font-semibold">{qty}</span>
        <button
          onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
          className="flex h-12 w-12 items-center justify-center rounded-r-full text-foreground/70 hover:bg-muted"
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <Button onClick={handleAdd} size="lg" className="flex-1">
        {added ? (
          <>
            <Check className="h-5 w-5" /> Added to cart
          </>
        ) : (
          <>
            <ShoppingBag className="h-5 w-5" /> Add to cart
          </>
        )}
      </Button>
    </div>
  );
}
