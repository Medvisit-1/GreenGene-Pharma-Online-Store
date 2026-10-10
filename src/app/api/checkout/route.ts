import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { REF_COOKIE, resolveReferrer } from "@/lib/rewards";
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
  newsletter?: boolean;
  referralCode?: string;
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
    await buildOrderTotals(body.items, body.discountCode, body.email);

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "None of the items are available" },
      { status: 400 }
    );
  }

  // Single-use codes (e.g. reward codes) are only counted as used once an order
  // is paid, so also block reuse while another recent order with it awaits payment.
  if (discount.valid && discount.code) {
    const promo = await prisma.promotion.findUnique({ where: { code: discount.code } });
    if (promo?.usageLimit != null) {
      const pending = await prisma.order.count({
        where: {
          discountCode: promo.code,
          paymentStatus: "unpaid",
          createdAt: { gt: new Date(Date.now() - 30 * 60_000) },
        },
      });
      if (promo.usageCount + pending >= promo.usageLimit) {
        return NextResponse.json(
          { error: `The code ${promo.code} is already being used on another order that's awaiting payment. Please complete that order, or try again in 30 minutes.` },
          { status: 409 }
        );
      }
    }
  }

  // Refer-a-friend: credit the referrer only for a genuinely new customer.
  // The code shown at checkout (auto-filled from the link, or typed in after
  // switching devices) wins; the link cookie is the fallback.
  const referrerId = await resolveReferrer(body.referralCode || (await cookies()).get(REF_COOKIE)?.value, {
    email: body.email,
    phone: body.phone,
    address: body.address,
  });

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
      referrerId,
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

  if (body.newsletter) {
    const { subscribe } = await import("@/lib/newsletter");
    await subscribe(body.email, body.name).catch(() => false);
  }

  return NextResponse.json({ orderNumber: order.orderNumber, total });
}
