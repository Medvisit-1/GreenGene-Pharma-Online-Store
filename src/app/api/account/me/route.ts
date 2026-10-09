import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { describeDiscount } from "@/lib/rewards";

export const dynamic = "force-dynamic";

// The signed-in customer's checkout pre-fill + usable reward codes. Private (cookie-based).
export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ customer: null }, { headers: { "Cache-Control": "no-store" } });
  }

  let addr: Record<string, string> = {};
  try {
    addr = JSON.parse(customer.shippingDetails || "{}");
  } catch {
    addr = {};
  }

  const claims = await prisma.rewardClaim.findMany({
    where: { customerId: customer.id },
    include: { reward: true },
    orderBy: { createdAt: "asc" },
  });
  const promos = await prisma.promotion.findMany({
    where: { code: { in: claims.map((c) => c.code) } },
  });
  const now = new Date();
  const usable = claims.filter((c) => {
    const p = promos.find((x) => x.code === c.code);
    return (
      p &&
      p.active &&
      (p.usageLimit == null || p.usageCount < p.usageLimit) &&
      (!p.endsAt || p.endsAt > now)
    );
  });

  return NextResponse.json(
    {
      customer: {
        name: customer.name ?? "",
        email: customer.email,
        phone: customer.phone ?? "",
        ...addr,
      },
      rewardCodes: usable.map((c, _, all) => {
        const p = promos.find((x) => x.code === c.code)!;
        const label = `${describeDiscount({ discountType: p.type, discountValue: p.value })} · ${c.reward.title}`;
        // Show the code when two rewards would otherwise look identical.
        const dup = all.filter((o) => o.rewardId === c.rewardId).length > 1;
        return { code: c.code, label: dup ? `${label} (${c.code})` : label };
      }),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
