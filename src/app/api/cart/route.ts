import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

/** Save the signed-in customer's cart (for the one-off saved-cart reminder). */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return new NextResponse(null, { status: 204 });
  const body = await req.json().catch(() => null);
  const raw: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 50) : [];
  const items = raw
    .map((i) => i as { productId?: unknown; quantity?: unknown })
    .filter((i) => typeof i.productId === "string" && Number.isInteger(i.quantity) && (i.quantity as number) > 0)
    .map((i) => ({ productId: String(i.productId).slice(0, 40), quantity: Math.min(99, i.quantity as number) }));

  if (!items.length) {
    await prisma.savedCart.deleteMany({ where: { customerId: customer.id } });
    return NextResponse.json({ ok: true });
  }

  const json = JSON.stringify(items);
  const existing = await prisma.savedCart.findUnique({ where: { customerId: customer.id } });
  // At most one reminder a week, even if the cart keeps changing
  const weekAgo = new Date(Date.now() - 7 * 864e5);
  const resetReminder = !!existing?.reminderSentAt && existing.reminderSentAt < weekAgo && existing.items !== json;
  await prisma.savedCart.upsert({
    where: { customerId: customer.id },
    create: { customerId: customer.id, items: json },
    update: { items: json, ...(resetReminder ? { reminderSentAt: null } : {}) },
  });
  return NextResponse.json({ ok: true });
}
