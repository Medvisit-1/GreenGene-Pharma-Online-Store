"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { addLine, buyNowLines, itemCount, setLineQty, subtotalCents, type CartLine } from "./cart-logic";

export type CartItem = CartLine;

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  /** Buy now: ensure at least qty of this item is in the cart (the caller then goes to checkout). */
  buyNow: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addItem: (item, qty = 1) => set((state) => ({ items: addLine(state.items, item, qty) })),
      buyNow: (item, qty = 1) => set((state) => ({ items: buyNowLines(state.items, item, qty), isOpen: false })),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      setQuantity: (productId, qty) => set((state) => ({ items: setLineQty(state.items, productId, qty) })),
      clear: () => set({ items: [] }),
      totalItems: () => itemCount(get().items),
      subtotal: () => subtotalCents(get().items),
    }),
    {
      name: "greengene-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
