import "server-only";
import { prisma } from "@/lib/prisma";

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
    data: { stockDeducted: true },
  });
  if (claim.count !== 1) return; // already deducted by another path

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

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
}
