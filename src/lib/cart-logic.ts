// Pure cart rules shared by the cart store (src/lib/cart-store.ts) and unit-tested in
// tests/cart-logic.test.mjs. No imports, so Node's test runner can load this file directly.

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  price: number; // cents
  image?: string;
  quantity: number;
  stock: number;
};

export type NewLine = Omit<CartLine, "quantity">;

/** Whole number between 1 and stock (0 when nothing is in stock). */
export function clampQty(qty: number, stock: number): number {
  const s = Math.max(0, Math.floor(Number.isFinite(stock) ? stock : 0));
  const q = Math.floor(Number.isFinite(qty) ? qty : 1);
  return Math.min(Math.max(1, q), s);
}

/** "Add to cart": adds qty on top of what is already in the cart, never above stock. */
export function addLine(items: CartLine[], item: NewLine, qty = 1): CartLine[] {
  if (item.stock <= 0) return items;
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    return items.map((i) =>
      i.productId === item.productId ? { ...i, ...item, quantity: clampQty(i.quantity + qty, item.stock) } : i
    );
  }
  return [...items, { ...item, quantity: clampQty(qty, item.stock) }];
}

/**
 * "Buy now": makes sure the cart holds at least the chosen quantity of this product, then the
 * shopper goes straight to checkout. Pressing it twice (or after Add to cart) never doubles the
 * amount; the rest of the cart is left as it is.
 */
export function buyNowLines(items: CartLine[], item: NewLine, qty = 1): CartLine[] {
  if (item.stock <= 0) return items;
  const want = clampQty(qty, item.stock);
  const existing = items.find((i) => i.productId === item.productId);
  if (existing) {
    return items.map((i) =>
      i.productId === item.productId ? { ...i, ...item, quantity: clampQty(Math.max(i.quantity, want), item.stock) } : i
    );
  }
  return [...items, { ...item, quantity: want }];
}

/** Sets a line's quantity (capped at stock); 0 or less removes it. */
export function setLineQty(items: CartLine[], productId: string, qty: number): CartLine[] {
  return items
    .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(Math.floor(qty), i.stock)) } : i))
    .filter((i) => i.quantity > 0);
}

export function itemCount(items: CartLine[]): number {
  return items.reduce((n, i) => n + i.quantity, 0);
}

/** Subtotal in cents. */
export function subtotalCents(items: CartLine[]): number {
  return items.reduce((n, i) => n + i.price * i.quantity, 0);
}
