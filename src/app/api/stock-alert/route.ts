import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Register a one-off "back in stock" email for a sold-out product. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 120);
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const product = productId
    ? await prisma.product.findUnique({ where: { id: productId }, select: { id: true, active: true } })
    : null;
  if (!product?.active) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  // Cap open alerts per email so the form can't be used to flood an inbox
  const open = await prisma.stockAlert.count({ where: { email, notifiedAt: null } });
  if (open >= 20) return NextResponse.json({ error: "You already have lots of alerts waiting." }, { status: 429 });

  await prisma.stockAlert.upsert({
    where: { productId_email: { productId, email } },
    create: { productId, email },
    update: { notifiedAt: null, createdAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
