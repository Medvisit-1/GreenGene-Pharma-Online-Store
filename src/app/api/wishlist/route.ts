import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

/** The signed-in customer's saved product ids. */
export async function GET() {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ signedIn: false, ids: [] });
  const rows = await prisma.wishlistItem.findMany({
    where: { customerId: customer.id },
    select: { productId: true },
  });
  return NextResponse.json({ signedIn: true, ids: rows.map((r) => r.productId) });
}

/** Save or un-save a product: { productId, saved: boolean }. */
export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Please sign in to save products." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const product = productId ? await prisma.product.findUnique({ where: { id: productId }, select: { id: true } }) : null;
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  if (body?.saved === false) {
    await prisma.wishlistItem.deleteMany({ where: { customerId: customer.id, productId } });
    return NextResponse.json({ saved: false });
  }
  const count = await prisma.wishlistItem.count({ where: { customerId: customer.id } });
  if (count >= 200) return NextResponse.json({ error: "Your wishlist is full." }, { status: 400 });
  await prisma.wishlistItem.upsert({
    where: { customerId_productId: { customerId: customer.id, productId } },
    create: { customerId: customer.id, productId },
    update: {},
  });
  return NextResponse.json({ saved: true });
}
