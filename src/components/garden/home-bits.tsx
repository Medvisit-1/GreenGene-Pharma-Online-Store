"use client";

import { useState, useSyncExternalStore } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/utils";

// ----- Daily routine tick (remembered on this device for today) -----

const EVENT = "gg-routine";
const keyFor = (id: string) => `gg-routine:${new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" })}:${id}`;
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const readTick = (id: string) => {
  try {
    return localStorage.getItem(keyFor(id)) === "1";
  } catch {
    return false;
  }
};

export function RoutineCheck({ id, name }: { id: string; name: string }) {
  const done = useSyncExternalStore(subscribe, () => readTick(id), () => false);
  const toggle = () => {
    try {
      if (done) localStorage.removeItem(keyFor(id));
      else localStorage.setItem(keyFor(id), "1");
    } catch {
      /* storage unavailable: nothing to remember */
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={done}
      aria-label={done ? `Mark ${name} as not taken today` : `Mark ${name} as taken today`}
      className={cn("gg-check", done && "done")}
    >
      {done && <Check className="h-4 w-4" strokeWidth={3} />}
    </button>
  );
}

// ----- Round "+" add-to-cart on product tiles -----

type AddProps = { product: { id: string; slug: string; name: string; price: number; image?: string; stock: number } };

export function AddPlus({ product }: AddProps) {
  const addItem = useCart((s) => s.addItem);
  const openCart = useCart((s) => s.open);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;
  return (
    <button
      type="button"
      className="gg-plus"
      disabled={soldOut}
      aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
      title={soldOut ? "Sold out" : "Add to cart"}
      onClick={() => {
        const { id, slug, name, price, image, stock } = product;
        addItem({ productId: id, slug, name, price, image, stock }, 1);
        toast.success("Added to cart", { description: product.name });
        openCart();
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
    >
      {added ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
    </button>
  );
}
