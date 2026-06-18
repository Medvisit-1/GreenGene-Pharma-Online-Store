"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";

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

export function QuickAddButton({ product }: Props) {
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.open);
  const [added, setAdded] = useState(false);

  if (product.stock <= 0) {
    return (
      <Button variant="outline" size="sm" disabled className="w-full">
        Sold out
      </Button>
    );
  }

  const add = () => {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        stock: product.stock,
      },
      1
    );
    toast.success("Added to cart", { description: product.name });
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Button onClick={add} variant="secondary" size="sm" className="w-full">
      {added ? (
        <><Check className="h-4 w-4" /> Added</>
      ) : (
        <><ShoppingBag className="h-4 w-4" /> Add to cart</>
      )}
    </Button>
  );
}
