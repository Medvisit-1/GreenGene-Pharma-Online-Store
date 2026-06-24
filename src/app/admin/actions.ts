"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { updateSettings } from "@/lib/settings";
import { GATEWAYS, saveGatewayStates } from "@/lib/payments";
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

/** Permanently delete an order (its line items cascade away). */
export async function deleteOrder(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/orders");
}

/** Update payment status only (fulfilment is handled separately). */
export async function updateOrder(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.order.update({
    where: { id },
    data: { paymentStatus: String(formData.get("paymentStatus") ?? "unpaid") },
  });
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

/** Mark an order fulfilled / unfulfilled. */
export async function setFulfillment(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) === "fulfilled" ? "fulfilled" : "unfulfilled";
  const existing = await prisma.order.findUnique({ where: { id } });
  await prisma.order.update({ where: { id }, data: { status } });
  // Email the customer when newly fulfilled
  if (status === "fulfilled" && existing?.status !== "fulfilled") {
    const { sendOrderShipped } = await import("@/lib/email");
    await sendOrderShipped(id);
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}

export async function saveTracking(formData: FormData) {
  const id = String(formData.get("id"));
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();
  const trackingUrl = String(formData.get("trackingUrl") ?? "").trim();
  await prisma.order.update({
    where: { id },
    data: {
      trackingNumber: trackingNumber || null,
      trackingUrl: trackingUrl || null,
      // Adding tracking fulfils the order
      ...(trackingNumber ? { status: "fulfilled" } : {}),
    },
  });
  // Notify the customer with their tracking details
  if (trackingNumber) {
    const { sendOrderShipped } = await import("@/lib/email");
    await sendOrderShipped(id);
  }
  revalidatePath(`/admin/orders/${id}`);
  redirect(`/admin/orders/${id}?saved=1`);
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

export async function saveFrontShop(formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? "");
  await updateSettings({
    heroBadge: g("heroBadge"),
    heroHeading: g("heroHeading"),
    heroSubheading: g("heroSubheading"),
    heroPrimaryLabel: g("heroPrimaryLabel"),
    heroPrimaryLink: g("heroPrimaryLink"),
    heroSecondaryLabel: g("heroSecondaryLabel"),
    heroSecondaryLink: g("heroSecondaryLink"),
    heroImage: g("heroImage"),
    feat1Title: g("feat1Title"), feat1Text: g("feat1Text"),
    feat2Title: g("feat2Title"), feat2Text: g("feat2Text"),
    feat3Title: g("feat3Title"), feat3Text: g("feat3Text"),
    feat4Title: g("feat4Title"), feat4Text: g("feat4Text"),
    rqtHeading: g("rqtHeading"),
    rqtBody: g("rqtBody"),
    rqtButtonLabel: g("rqtButtonLabel"),
    rqtButtonLink: g("rqtButtonLink"),
    rqtStat1Key: g("rqtStat1Key"), rqtStat1Val: g("rqtStat1Val"),
    rqtStat2Key: g("rqtStat2Key"), rqtStat2Val: g("rqtStat2Val"),
    rqtStat3Key: g("rqtStat3Key"), rqtStat3Val: g("rqtStat3Val"),
    marqueeEnabled: formData.get("marqueeEnabled") === "on" ? "1" : "0",
    marqueeText: g("marqueeText"),
    marqueeSpeed: String(parseInt(g("marqueeSpeed"), 10) || 30),
  });
  revalidatePath("/", "layout");
  redirect("/admin/front-shop?saved=1");
}

export async function saveGateways(formData: FormData) {
  const active: Record<string, boolean> = {};
  for (const g of GATEWAYS) {
    active[g.id] = formData.get(`gateway_${g.id}`) === "on";
  }
  await saveGatewayStates(active);
  revalidatePath("/", "layout");
  redirect("/admin/payments?saved=1");
}
