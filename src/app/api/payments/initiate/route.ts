import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initiatePayment, getEnabledMethods } from "@/lib/payments";

// POST { orderNumber, method } -> starts payment for an existing order.
export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { orderNumber, method } = body ?? {};
  if (!orderNumber || !method) {
    return NextResponse.json({ error: "Missing order or method" }, { status: 400 });
  }

  // Only allow gateways the admin has activated (and that are configured).
  const enabled = await getEnabledMethods();
  if (!enabled.some((m) => m.id === method)) {
    return NextResponse.json({ error: "This payment method is unavailable." }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Record the chosen method on the order
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentMethod: method },
  });

  const result = await initiatePayment(method, order);

  if (result.kind === "redirect") {
    return NextResponse.json({ redirectUrl: result.url });
  }
  if (result.kind === "manual") {
    return NextResponse.json({ manual: true, message: result.message });
  }
  return NextResponse.json({ error: result.message }, { status: 400 });
}
