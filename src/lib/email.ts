import "server-only";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/utils";

const APP_URL = process.env.APP_URL || "https://greengene-store-production.up.railway.app";

function transport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587 (STARTTLS)
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // Fail fast instead of hanging if the mail server isn't reachable
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

type MailArgs = { to: string; subject: string; html: string; replyTo?: string };

/** Parse "Name <email>" into sender parts for the Brevo API. */
function senderFrom(): { name: string; email: string } {
  const raw = process.env.SMTP_FROM || "GreenGene Pharma <info@greengenepharma.co.za>";
  const m = raw.match(/^(.*)<(.+)>$/);
  if (m) return { name: m[1].trim().replace(/"/g, "") || "GreenGene Pharma", email: m[2].trim() };
  return { name: "GreenGene Pharma", email: raw.trim() };
}

/**
 * Preferred path: Brevo HTTP API over HTTPS (works from hosts that block SMTP ports).
 * Returns true/false if attempted, or null if not configured (so we can fall back).
 */
async function sendViaBrevoApi({ to, subject, html, replyTo }: MailArgs): Promise<boolean | null> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: senderFrom(),
        to: [{ email: to }],
        subject,
        htmlContent: html,
        ...(replyTo ? { replyTo: { email: replyTo } } : {}),
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      console.error(`[email] Brevo API failed (${res.status}):`, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] Brevo API error:", (e as Error).message);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function sendMail({ to, subject, html, replyTo }: MailArgs): Promise<boolean> {
  // 1) Brevo HTTP API (HTTPS) — used when BREVO_API_KEY is set.
  const viaApi = await sendViaBrevoApi({ to, subject, html, replyTo });
  if (viaApi !== null) return viaApi;

  // 2) Fallback: SMTP (only works if the host allows outbound SMTP ports).
  const t = transport();
  if (!t) {
    console.log(`[email] not configured — skipped "${subject}" to ${to}`);
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@greengenepharma.co.za";
  try {
    await t.sendMail({ from, to, subject, html, replyTo });
    return true;
  } catch (e) {
    console.error("[email] SMTP send failed:", (e as Error).message);
    return false;
  }
}

/* ---------- Shared layout ---------- */
function layout(title: string, body: string) {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#103a2b">
    <div style="background:#0a2c22;padding:18px 24px;border-radius:14px 14px 0 0">
      <span style="color:#fff;font-size:18px;font-weight:700">GreenGene Pharma</span>
    </div>
    <div style="border:1px solid #e3e9e5;border-top:0;border-radius:0 0 14px 14px;padding:24px">
      <h2 style="margin:0 0 12px;font-size:18px;color:#104536">${title}</h2>
      ${body}
    </div>
    <p style="text-align:center;color:#8a978f;font-size:11px;margin-top:14px">GreenGene Pharma · Empower Your Wellness, Live Better</p>
  </div>`;
}

function itemsTable(items: { name: string; quantity: number; price: number }[]) {
  const rows = items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.name}</td>
         <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:center">×${i.quantity}</td>
         <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(i.price * i.quantity)}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:8px 0">${rows}</table>`;
}

/* ---------- Contact form ---------- */
export async function sendContactMessage(d: {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}) {
  const settings = await getSettings();
  const html = layout("New contact message", `
    <p><strong>From:</strong> ${d.name || "—"} (${d.email || "no email"})</p>
    <p><strong>Phone:</strong> ${d.phone || "—"}</p>
    <p><strong>Subject:</strong> ${d.subject || "—"}</p>
    <p style="white-space:pre-wrap;background:#f4f6f5;padding:12px;border-radius:8px">${(d.message || "").replace(/</g, "&lt;")}</p>
  `);
  return sendMail({
    to: settings.contactEmail,
    subject: `New enquiry from ${d.name || "website"}`,
    html,
    replyTo: d.email,
  });
}

/* ---------- Order paid: admin alert + customer confirmation ---------- */
export async function sendOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const settings = await getSettings();
  const addr = JSON.parse(order.shippingAddress || "{}");
  const addrHtml = [addr.line1, addr.line2, addr.suburb, addr.city, addr.province, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(", ");
  const totals = `
    <table style="width:100%;font-size:14px;margin-top:6px">
      <tr><td>Subtotal</td><td style="text-align:right">${formatPrice(order.subtotal)}</td></tr>
      ${order.discount ? `<tr><td>Discount</td><td style="text-align:right">−${formatPrice(order.discount)}</td></tr>` : ""}
      <tr><td>Shipping</td><td style="text-align:right">${order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</td></tr>
      <tr><td style="font-weight:700;padding-top:6px">Total</td><td style="text-align:right;font-weight:700;padding-top:6px">${formatPrice(order.total)}</td></tr>
    </table>`;
  const orderUrl = `${APP_URL}/orders/${order.orderNumber}`;

  // Customer confirmation
  await sendMail({
    to: order.email,
    subject: `Your GreenGene order ${order.orderNumber} is confirmed`,
    html: layout("Thank you for your order! 🎉", `
      <p>We've received your payment and your order is confirmed.</p>
      <p><strong>Order:</strong> ${order.orderNumber}</p>
      ${itemsTable(order.items)}
      ${totals}
      <p style="margin-top:14px"><strong>Delivery to:</strong><br>${addrHtml}</p>
      <p style="margin-top:16px"><a href="${orderUrl}" style="background:#155640;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px">View your order</a></p>
    `),
  });

  // Admin alert
  await sendMail({
    to: settings.contactEmail,
    subject: `🛒 New paid order ${order.orderNumber} — ${formatPrice(order.total)}`,
    html: layout("New paid order", `
      <p><strong>${order.orderNumber}</strong> · ${formatPrice(order.total)} · paid via ${order.paymentMethod ?? "—"}</p>
      <p><strong>Customer:</strong> ${order.email}${order.phone ? ` · ${order.phone}` : ""}</p>
      ${itemsTable(order.items)}
      <p><strong>Delivery:</strong><br>${addrHtml}</p>
      <p style="margin-top:14px"><a href="${APP_URL}/admin/orders/${order.id}" style="background:#155640;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px">Open in admin</a></p>
    `),
  });
}

/* ---------- Fulfilment / shipped update to customer ---------- */
export async function sendOrderShipped(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  const orderUrl = `${APP_URL}/orders/${order.orderNumber}`;
  const tracking = order.trackingNumber
    ? `<p><strong>Tracking number:</strong> ${order.trackingNumber}</p>
       ${order.trackingUrl ? `<p><a href="${order.trackingUrl}">Track your parcel →</a></p>` : ""}`
    : "";
  await sendMail({
    to: order.email,
    subject: `Your GreenGene order ${order.orderNumber} is on its way 📦`,
    html: layout("Your order has been fulfilled", `
      <p>Good news — your order <strong>${order.orderNumber}</strong> has been processed for delivery.</p>
      ${tracking}
      <p style="margin-top:16px"><a href="${orderUrl}" style="background:#155640;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:14px">View your order</a></p>
    `),
  });
}
