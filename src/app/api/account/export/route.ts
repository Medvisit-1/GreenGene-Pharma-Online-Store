import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// POPIA right of access: a signed-in customer downloads the personal information we hold about them.
export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return new Response("Please sign in first.", { status: 401 });

  const [orders, reviews, claims] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [{ customerId: customer.id }, { email: customer.email }] },
      include: { items: { select: { name: true, quantity: true, price: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { email: { equals: customer.email, mode: "insensitive" } },
      select: { author: true, rating: true, title: true, body: true, status: true, createdAt: true, product: { select: { name: true } } },
    }),
    prisma.rewardClaim.findMany({
      where: { customerId: customer.id },
      select: { code: true, createdAt: true, reward: { select: { title: true } } },
    }),
  ]);
  const json = (v: string) => {
    try {
      return JSON.parse(v || "{}");
    } catch {
      return {};
    }
  };
  const cents = (n: number) => (n / 100).toFixed(2);

  const data = {
    exportedAt: new Date().toISOString(),
    note: "Personal information GreenGene Pharma holds about you. Amounts are in ZAR.",
    profile: {
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      savedDeliveryAddress: json(customer.shippingDetails),
      birthday: customer.birthday ? customer.birthday.toISOString().slice(5, 10) : null,
      newsletter: customer.newsletter,
      newsletterConsentAt: customer.newsletterAt,
      referralCode: customer.referralCode,
      accountCreatedAt: customer.createdAt,
      lastSignInAt: customer.lastLoginAt,
      deletionRequestedAt: customer.deletionRequestedAt,
    },
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      placedAt: o.createdAt,
      paymentStatus: o.paymentStatus,
      fulfilment: o.status,
      email: o.email,
      phone: o.phone,
      deliveryAddress: json(o.shippingAddress),
      notes: o.notes,
      items: o.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: cents(i.price) })),
      subtotal: cents(o.subtotal),
      discount: cents(o.discount),
      discountCode: o.discountCode,
      shipping: cents(o.shipping),
      total: cents(o.total),
      trackingNumber: o.trackingNumber,
    })),
    reviews: reviews.map((r) => ({
      product: r.product.name,
      author: r.author,
      rating: r.rating,
      title: r.title,
      review: r.body,
      status: r.status,
      submittedAt: r.createdAt,
    })),
    rewardClaims: claims.map((c) => ({ reward: c.reward.title, code: c.code, claimedAt: c.createdAt })),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="greengene-my-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}
