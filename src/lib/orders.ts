import { prisma } from "@/lib/prisma";
import { shippingFor } from "@/lib/constants";
import { getShippingConfig } from "@/lib/settings";

export type CheckoutItemInput = { productId: string; quantity: number };

export type DiscountResult = {
  valid: boolean;
  code?: string;
  amount: number; // cents discounted
  message?: string;
};

/** Generate a human-readable, unique order number like GG-7K3F2A. */
export function generateOrderNumber(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GG-${rand}`;
}

/** Validate a promo code against a given subtotal (cents). Pure server logic. */
export async function evaluateDiscount(
  code: string | undefined | null,
  subtotal: number
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
    return { valid: false, amount: 0, message: "This code has reached its limit" };
  if (subtotal < promo.minSpend)
    return {
      valid: false,
      amount: 0,
      message: `Spend at least ${(promo.minSpend / 100).toFixed(2)} to use this code`,
    };

  const amount =
    promo.type === "percent"
      ? Math.round((subtotal * promo.value) / 100)
      : Math.min(promo.value, subtotal);

  return { valid: true, code: promo.code, amount };
}

/**
 * Recompute an order server-side from product IDs + quantities, using DB prices
 * (never trust client prices). Returns line items and computed totals.
 */
export async function buildOrderTotals(
  items: CheckoutItemInput[],
  discountCode?: string
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
  const discount = await evaluateDiscount(discountCode, subtotal);
  const { flat, threshold } = await getShippingConfig();
  const shipping = shippingFor(subtotal, flat, threshold);
  const total = Math.max(0, subtotal - discount.amount) + shipping;

  return { lineItems, subtotal, discount, shipping, total };
}
