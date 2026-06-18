"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { updateSettings } from "@/lib/settings";
import { sendToBobGo } from "@/lib/shipping";
import {
  checkCredentials,
  setSession,
  clearSession,
} from "@/lib/auth";

/* ---------------- Auth ---------------- */

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!checkCredentials(email, password)) {
    redirect("/admin/login?error=1");
  }
  await setSession();
  redirect("/admin");
}

export async function logoutAction() {
  await clearSession();
  redirect("/admin/login");
}

/* ---------------- Helpers ---------------- */

function randsToCents(v: FormDataEntryValue | null): number {
  const n = parseFloat(String(v ?? "0").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function parseImageLines(v: FormDataEntryValue | null): string {
  const list = String(v ?? "")
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return JSON.stringify(list);
}

/* ---------------- Products ---------------- */

export async function saveProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const data = {
    name,
    slug: String(formData.get("slug") ?? "").trim() || slugify(name),
    shortDescription: String(formData.get("shortDescription") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    price: randsToCents(formData.get("price")),
    compareAtPrice: formData.get("compareAtPrice")
      ? randsToCents(formData.get("compareAtPrice"))
      : null,
    sku: String(formData.get("sku") ?? "") || null,
    stock: parseInt(String(formData.get("stock") ?? "0"), 10) || 0,
    brand: String(formData.get("brand") ?? "") || null,
    categoryId: String(formData.get("categoryId") ?? "") || null,
    images: parseImageLines(formData.get("images")),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
  };

  if (id) {
    await prisma.product.update({ where: { id }, data });
  } else {
    await prisma.product.create({ data });
  }
  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
}

/* ---------------- Orders ---------------- */

export async function updateOrder(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.order.update({
    where: { id },
    data: {
      status: String(formData.get("status") ?? "pending"),
      paymentStatus: String(formData.get("paymentStatus") ?? "unpaid"),
    },
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function shipOrder(formData: FormData) {
  const id = String(formData.get("id"));
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) redirect("/admin/orders");
  const result = await sendToBobGo(order!);
  revalidatePath(`/admin/orders/${id}`);
  redirect(
    `/admin/orders/${id}?${result.ok ? "shipped=1" : `shiperror=${encodeURIComponent(result.message)}`}`
  );
}

/* ---------------- Promotions ---------------- */

export async function savePromotion(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "percent");
  const rawValue = parseFloat(String(formData.get("value") ?? "0")) || 0;
  const data = {
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    type,
    value: type === "fixed" ? Math.round(rawValue * 100) : Math.round(rawValue),
    minSpend: randsToCents(formData.get("minSpend")),
    active: formData.get("active") === "on",
  };
  if (id) {
    await prisma.promotion.update({ where: { id }, data });
  } else {
    await prisma.promotion.create({ data });
  }
  revalidatePath("/admin/promotions");
  revalidatePath("/promotions");
  redirect("/admin/promotions?saved=1");
}

export async function deletePromotion(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.promotion.delete({ where: { id } });
  revalidatePath("/admin/promotions");
  revalidatePath("/promotions");
}

/* ---------------- Reviews ---------------- */

export async function setReviewStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  await prisma.review.update({ where: { id }, data: { status } });
  revalidatePath("/admin/reviews");
}

export async function deleteReview(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.review.delete({ where: { id } });
  revalidatePath("/admin/reviews");
}

/* ---------------- Settings ---------------- */

export async function saveSettings(formData: FormData) {
  await updateSettings({
    contactPhone: String(formData.get("contactPhone") ?? ""),
    contactEmail: String(formData.get("contactEmail") ?? ""),
    contactAddress: String(formData.get("contactAddress") ?? ""),
    contactHours: String(formData.get("contactHours") ?? ""),
    announcement: String(formData.get("announcement") ?? ""),
    shippingFlat: String(randsToCents(formData.get("shippingFlat"))),
    freeShippingThreshold: String(randsToCents(formData.get("freeShippingThreshold"))),
  });
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}
