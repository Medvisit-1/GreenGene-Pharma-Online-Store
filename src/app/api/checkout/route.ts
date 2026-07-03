import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrderTotals, generateOrderNumber } from "@/lib/orders";

type Body = {
  email: string;
  phone?: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    suburb?: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  };
  items: { productId: string; quantity: number }[];
  discountCode?: string;
  notes?: string;
  paymentMethod?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Basic validation
  if (!body.email || !body.name || !body.address?.line1 || !body.address?.city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!body.items?.length) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }

  // Recompute everything server-side from DB prices
  const { lineItems, subtotal, discount, shipping, total } =
    await buildOrderTotals(body.items, body.discountCode);

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "None of the items are available" },
      { status: 400 }
    );
  }

  // Upsert customer by email
  const customer = await prisma.customer.upsert({
    where: { email: body.email.toLowerCase() },
    create: {
      email: body.email.toLowerCase(),
      name: body.name,
      phone: body.phone,
    },
    update: { name: body.name, phone: body.phone },
  });

  const orderNumber = generateOrderNumber();

  const order = await prisma.order.create({
    data: {
      orderNumber,
      customerId: customer.id,
      email: body.email.toLowerCase(),
      phone: body.phone,
      status: "unfulfilled",
      paymentStatus: "unpaid",
      paymentMethod: body.paymentMethod ?? "pending",
      subtotal,
      shipping,
      discount: discount.amount,
      discountCode: discount.valid ? discount.code : null,
      total,
      shippingAddress: JSON.stringify({ ...body.address, country: body.address.country ?? "South Africa" }),
      notes: body.notes,
      items: {
        create: lineItems.map((i) => ({
          productId: i.productId,
          name: i.name,
          image: i.image,
          price: i.price,
          quantity: i.quantity,
        })),
      },
    },
  });

  // Stock + promo usage are NOT touched here — they are applied only when the
  // order is confirmed paid (see finalizePaidOrder), so failed/abandoned
  // payments never reduce stock.

  return NextResponse.json({ orderNumber: order.orderNumber, total });
}
