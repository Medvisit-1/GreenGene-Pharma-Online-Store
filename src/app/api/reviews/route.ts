import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { productId, author, rating, title, body: text, email } = body ?? {};
  const ratingNum = Number(rating);

  if (!productId || !author || !text) {
    return NextResponse.json({ error: "Please fill in your name and review." }, { status: 400 });
  }
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return NextResponse.json({ error: "Please choose a rating from 1 to 5." }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  // Signed-in customers' reviews are tied to their account email (powers the review reward).
  const customer = await getCurrentCustomer();
  const reviewEmail = customer?.email ?? (email ? String(email).trim().toLowerCase().slice(0, 120) : null);

  await prisma.review.create({
    data: {
      productId,
      author: String(author).slice(0, 80),
      email: reviewEmail,
      rating: ratingNum,
      title: title ? String(title).slice(0, 120) : null,
      body: String(text).slice(0, 2000),
      status: "pending",
    },
  });

  return NextResponse.json({ ok: true });
}
