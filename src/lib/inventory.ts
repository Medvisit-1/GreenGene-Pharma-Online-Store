import "server-only";
import { prisma } from "@/lib/prisma";
import { geneflowEnabled, sendOrderEvent, type GeneflowTopic } from "@/lib/geneflow-webhook";

/**
 * Deduct stock (and count promo usage) for an order — exactly once.
 *
 * Called only when an order first transitions to PAID. The atomic
 * `updateMany({ stockDeducted: false } -> true)` claim guarantees this runs a
 * single time even if payment is confirmed via both the return redirect AND a
 * webhook (or the admin marking it paid).
 */
export async function finalizePaidOrder(orderId: string): Promise<void> {
  const claim = await prisma.order.updateMany({
    where: { id: orderId, stockDeducted: false },
    data: { stockDeducted: true, paidAt: new Date() },
  });
  if (claim.count !== 1) return; // already deducted by another path

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  // The stock feed now lists this order's lines: tell GeneFlow straight away (not awaited, never throws).
  void sendOrderEvent("order.paid", order);

  await Promise.all([
    ...order.items
      .filter((i) => i.productId)
      .map((i) =>
        prisma.product
          .update({ where: { id: i.productId! }, data: { stock: { decrement: i.quantity } } })
          .catch(() => {})
      ),
    order.discountCode
      ? prisma.promotion
          .update({ where: { code: order.discountCode }, data: { usageCount: { increment: 1 } } })
          .catch(() => {})
      : Promise.resolve(),
  ]);

  // Update the customer's rewards (milestones, referrals) and tell them what they unlocked.
  const { afterOrderPaid } = await import("@/lib/rewards");
  await afterOrderPaid(order.id);
}

/**
 * Tell GeneFlow that a paid order was refunded or cancelled (bottles back). Fire and forget:
 * never throws, never delays the caller, and does nothing (not even a DB read) when the feature is off.
 */
export function notifyGeneflowReversal(topic: Exclude<GeneflowTopic, "order.paid">, orderId: string): void {
  if (!geneflowEnabled()) return;
  void prisma.order
    .findUnique({ where: { id: orderId }, include: { items: true } })
    .then((order) => (order ? sendOrderEvent(topic, order) : false))
    .catch(() => console.warn(`[geneflow] could not load the order for ${topic}`));
}
