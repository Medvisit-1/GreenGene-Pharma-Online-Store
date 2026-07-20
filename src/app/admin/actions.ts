"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { updateSettings, getSettings } from "@/lib/settings";
import { parseNewReleaseCards } from "@/lib/new-release";
import { GATEWAYS, saveGatewayStates } from "@/lib/payments";
import {
  computeTotals,
  parseLines,
  companyFromSettings,
  bankFromSettings,
} from "@/lib/invoice";
import {
  tiersFromSettings,
  parseQuoteLines,
  quoteSubtotal,
  companyFromSettings as wholesaleCompanyFromSettings,
} from "@/lib/wholesale";
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
    unitCost: formData.get("unitCost") ? randsToCents(formData.get("unitCost")) : null,
    rrp: formData.get("rrp") ? randsToCents(formData.get("rrp")) : null,
    sku: String(formData.get("sku") ?? "") || null,
    stock: parseInt(String(formData.get("stock") ?? "0"), 10) || 0,
    brand: String(formData.get("brand") ?? "") || null,
    takealotUrl: String(formData.get("takealotUrl") ?? "").trim() || null,
    amazonUrl: String(formData.get("amazonUrl") ?? "").trim() || null,
    bobshopUrl: String(formData.get("bobshopUrl") ?? "").trim() || null,
    categoryId: String(formData.get("categoryId") ?? "") || null,
    images: parseImageLines(formData.get("images")),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    isCombo: formData.get("isCombo") === "on",
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
  const paymentStatus = String(formData.get("paymentStatus") ?? "unpaid");
  await prisma.order.update({ where: { id }, data: { paymentStatus } });
  // If the admin marks it paid, deduct stock (idempotent — runs once)
  if (paymentStatus === "paid") {
    const { finalizePaidOrder } = await import("@/lib/inventory");
    await finalizePaidOrder(id);
  }
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
    ctaHeading: g("ctaHeading"),
    ctaSubheading: g("ctaSubheading"),
    ctaButtonLabel: g("ctaButtonLabel"),
    ctaButtonLink: g("ctaButtonLink"),
    newReleaseEnabled: formData.get("newReleaseEnabled") === "on" ? "1" : "0",
    newReleaseHeading: g("newReleaseHeading"),
    newReleaseCards: JSON.stringify(parseNewReleaseCards(g("newReleaseCards"))),
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

/* ---------------- Invoicing ---------------- */

async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.invoice.count();
  return `INV-${String(count + 1).padStart(4, "0")}`;
}

export async function saveInvoiceSettings(formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? "");
  await updateSettings({
    invoiceCompanyName: g("invoiceCompanyName"),
    invoiceRegNo: g("invoiceRegNo"),
    invoiceVatNo: g("invoiceVatNo"),
    invoiceCompanyAddress: g("invoiceCompanyAddress"),
    invoiceCompanyEmail: g("invoiceCompanyEmail"),
    invoiceCompanyPhone: g("invoiceCompanyPhone"),
    invoiceBankName: g("invoiceBankName"),
    invoiceBankAccountName: g("invoiceBankAccountName"),
    invoiceBankAccountNumber: g("invoiceBankAccountNumber"),
    invoiceBankBranchCode: g("invoiceBankBranchCode"),
    invoiceBankAccountType: g("invoiceBankAccountType"),
    invoiceDefaultNotes: g("invoiceDefaultNotes"),
    invoiceDefaultTaxRate: String(parseInt(g("invoiceDefaultTaxRate"), 10) || 0),
    invoiceDefaultPaymentTerms: g("invoiceDefaultPaymentTerms") || "Due on receipt",
  });
  redirect("/admin/invoices?settings=1");
}

export async function createInvoice(formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  const lines = parseLines(g("items"));
  if (!g("customerName") || !g("customerEmail") || !lines.length) {
    redirect("/admin/invoices/new?error=1");
  }
  const taxRate = parseInt(g("taxRate"), 10) || 0;
  const { subtotal, taxAmount, total } = computeTotals(lines, taxRate);

  const settings = await getSettings();
  const number = await nextInvoiceNumber();
  const dueRaw = g("dueDate");

  const inv = await prisma.invoice.create({
    data: {
      number,
      customerName: g("customerName"),
      customerEmail: g("customerEmail"),
      customerAddress: g("customerAddress") || null,
      status: "unpaid",
      issueDate: g("issueDate") ? new Date(g("issueDate")) : new Date(),
      dueDate: dueRaw ? new Date(dueRaw) : null,
      paymentTerms: g("paymentTerms") || null,
      items: JSON.stringify(lines),
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: g("notes") || null,
      companyDetails: JSON.stringify(companyFromSettings(settings)),
      bankDetails: JSON.stringify(bankFromSettings(settings)),
    },
  });

  // Remember this customer for future invoices
  await prisma.customer
    .upsert({
      where: { email: g("customerEmail") },
      create: {
        email: g("customerEmail"),
        name: g("customerName") || null,
        address: g("customerAddress") || null,
      },
      update: {
        name: g("customerName") || undefined,
        ...(g("customerAddress") ? { address: g("customerAddress") } : {}),
      },
    })
    .catch(() => {});

  revalidatePath("/admin/invoices");
  redirect(`/admin/invoices/${inv.id}`);
}

export async function setInvoiceStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) === "paid" ? "paid" : "unpaid";
  await prisma.invoice.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/invoices/${id}`);
  revalidatePath("/admin/invoices");
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/admin/invoices");
  redirect("/admin/invoices");
}

export async function sendInvoice(formData: FormData) {
  const id = String(formData.get("id"));
  const { sendInvoiceEmail } = await import("@/lib/email");
  const ok = await sendInvoiceEmail(id);
  revalidatePath(`/admin/invoices/${id}`);
  redirect(`/admin/invoices/${id}?${ok ? "sent=1" : "senterror=1"}`);
}

/* ---------------- Wholesale quotations ---------------- */

async function nextQuotationNumber(): Promise<string> {
  const count = await prisma.quotation.count();
  return `WQ-${String(count + 1).padStart(4, "0")}`;
}

export async function saveWholesaleSettings(formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? "");
  const posInt = (k: string, fallback: number) => {
    const n = parseInt(g(k), 10);
    return String(Number.isFinite(n) && n > 0 ? n : fallback);
  };
  const pct = (k: string) => {
    const n = parseInt(g(k), 10);
    return String(Math.min(100, Math.max(0, Number.isFinite(n) ? n : 0)));
  };
  await updateSettings({
    wholesaleTier1Max: posInt("wholesaleTier1Max", 50),
    wholesaleTier1Pct: pct("wholesaleTier1Pct"),
    wholesaleTier2Max: posInt("wholesaleTier2Max", 100),
    wholesaleTier2Pct: pct("wholesaleTier2Pct"),
    wholesaleTier3Pct: pct("wholesaleTier3Pct"),
    wholesaleValidityDays: posInt("wholesaleValidityDays", 30),
    wholesaleRrpMarginPct: pct("wholesaleRrpMarginPct"),
    wholesaleIntro: g("wholesaleIntro"),
  });
  redirect("/admin/wholesale?settings=1");
}

export async function createQuotation(formData: FormData) {
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  const lines = parseQuoteLines(g("items"));
  if (!g("customerName") || !g("customerEmail") || !lines.length) {
    redirect("/admin/wholesale/new?error=1");
  }
  const subtotal = quoteSubtotal(lines);
  const settings = await getSettings();
  const tiers = tiersFromSettings(settings);
  const number = await nextQuotationNumber();

  const bonusBuyQty = Math.max(0, parseInt(g("bonusBuyQty"), 10) || 0);
  const bonusFreeQty = Math.max(0, parseInt(g("bonusFreeQty"), 10) || 0);
  const bonusActive = bonusBuyQty > 0 && bonusFreeQty > 0;

  const issueDate = g("issueDate") ? new Date(g("issueDate")) : new Date();
  let validUntil: Date | null = g("validUntil") ? new Date(g("validUntil")) : null;
  if (!validUntil) {
    const days = parseInt(settings.wholesaleValidityDays, 10) || 0;
    if (days > 0) {
      validUntil = new Date(issueDate);
      validUntil.setDate(validUntil.getDate() + days);
    }
  }

  const quote = await prisma.quotation.create({
    data: {
      number,
      customerName: g("customerName"),
      customerCompany: g("customerCompany") || null,
      customerEmail: g("customerEmail"),
      customerAddress: g("customerAddress") || null,
      status: "draft",
      issueDate,
      validUntil,
      items: JSON.stringify(lines),
      subtotal,
      bonusBuyQty: bonusActive ? bonusBuyQty : null,
      bonusFreeQty: bonusActive ? bonusFreeQty : null,
      companyDetails: JSON.stringify(wholesaleCompanyFromSettings(settings)),
      tierTable: JSON.stringify(tiers),
      notes: g("notes") || settings.wholesaleIntro || null,
    },
  });

  // Remember this customer for future quotations / invoices
  await prisma.customer
    .upsert({
      where: { email: g("customerEmail") },
      create: {
        email: g("customerEmail"),
        name: g("customerName") || null,
        address: g("customerAddress") || null,
      },
      update: {
        name: g("customerName") || undefined,
        ...(g("customerAddress") ? { address: g("customerAddress") } : {}),
      },
    })
    .catch(() => {});

  revalidatePath("/admin/wholesale");
  redirect(`/admin/wholesale/${quote.id}`);
}

export async function setQuotationStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const raw = String(formData.get("status"));
  const status = ["draft", "sent", "accepted", "declined"].includes(raw) ? raw : "draft";
  await prisma.quotation.update({ where: { id }, data: { status } });
  revalidatePath(`/admin/wholesale/${id}`);
  revalidatePath("/admin/wholesale");
}

export async function deleteQuotation(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.quotation.delete({ where: { id } });
  revalidatePath("/admin/wholesale");
  redirect("/admin/wholesale");
}

export async function sendQuotation(formData: FormData) {
  const id = String(formData.get("id"));
  const { sendQuotationEmail } = await import("@/lib/email");
  const ok = await sendQuotationEmail(id);
  revalidatePath(`/admin/wholesale/${id}`);
  redirect(`/admin/wholesale/${id}?${ok ? "sent=1" : "senterror=1"}`);
}
