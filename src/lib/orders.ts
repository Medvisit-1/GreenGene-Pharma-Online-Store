import { prisma } from "@/lib/prisma";
import { shippingFor } from "@/lib/constants";
import { getShippingConfig } from "@/lib/settings";

export type CheckoutItemInput = { productId: string; quantity: number };

export type DiscountResult = {
  valid: boolean;
  code?: string;
  amount: number; // cents discounted
  message?: string;
  freeShipping?: boolean;
};

/** Generate a human-readable, unique order number like GG-7K3F2A. */
export function generateOrderNumber(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GG-${rand}`;
}

/**
 * Validate a promo code against a given subtotal (cents). Pure server logic.
 * `email` is required for codes locked to a customer (reward codes).
 */
export async function evaluateDiscount(
  code: string | undefined | null,
  subtotal: number,
  email?: string | null
): Promise<DiscountResult> {
  if (!code) return { valid: false, amount: 0 };
  const promo = await prisma.promotion.findUnique({
    where: { code: code.trim().toUpperCase() },
  });
  if (!promo || !promo.active)
    return { valid: false, amount: 0, message: "Invalid or expired code" };

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now)
    return { valid: false, amount: 0, message: "This code isn't active yet" };
  if (promo.endsAt && promo.endsAt < now)
    return { valid: false, amount: 0, message: "This code has expired" };
  if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit)
    return {
      valid: false,
      amount: 0,
      message: promo.source === "reward" ? "This reward code has already been used" : "This code has reached its limit",
    };
  if (promo.customerEmail) {
    const who = (email ?? "").trim().toLowerCase();
    if (!who)
      return { valid: false, amount: 0, message: "Enter your email above (or sign in) to use this reward code" };
    if (who !== promo.customerEmail.toLowerCase())
      return { valid: false, amount: 0, message: "This reward code belongs to a different account email" };
  }
  if (subtotal < promo.minSpend)
    return {
      valid: false,
      amount: 0,
      message: `Spend at least ${(promo.minSpend / 100).toFixed(2)} to use this code`,
    };

  let amount: number;
  if (promo.type === "freeship") {
    // Discount equals the shipping that would otherwise be charged.
    const { flat, threshold } = await getShippingConfig();
    amount = shippingFor(subtotal, flat, threshold);
  } else if (promo.type === "percent") {
    amount = Math.round((subtotal * promo.value) / 100);
  } else {
    amount = Math.min(promo.value, subtotal);
  }

  return { valid: true, code: promo.code, amount, freeShipping: promo.type === "freeship" };
}

/**
 * Recompute an order server-side from product IDs + quantities, using DB prices
 * (never trust client prices). Returns line items and computed totals.
 */
export async function buildOrderTotals(
  items: CheckoutItemInput[],
  discountCode?: string,
  email?: string
) {
  const ids = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, active: true },
  });

  const lineItems = items
    .map((i) => {
      const p = products.find((pr) => pr.id === i.productId);
      if (!p) return null;
      const qty = Math.max(1, Math.min(i.quantity, p.stock));
      const images: string[] = (() => {
        try {
          return JSON.parse(p.images);
        } catch {
          return [];
        }
      })();
      return {
        productId: p.id,
        name: p.name,
        image: images[0] ?? null,
        price: p.price,
        quantity: qty,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const subtotal = lineItems.reduce((n, i) => n + i.price * i.quantity, 0);
  const discount = await evaluateDiscount(discountCode, subtotal, email);
  const { flat, threshold } = await getShippingConfig();
  const shipping = shippingFor(subtotal, flat, threshold);
  // A free-shipping code's discount offsets shipping, so it never reduces the goods total.
  const goodsDiscount = discount.freeShipping ? 0 : discount.amount;
  const total = Math.max(0, subtotal - goodsDiscount) + shipping - (discount.freeShipping ? discount.amount : 0);

  return { lineItems, subtotal, discount, shipping, total };
}
