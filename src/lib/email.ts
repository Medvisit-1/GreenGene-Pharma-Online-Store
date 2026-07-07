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

type MailArgs = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: { filename: string; content: Buffer }[];
};

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
async function sendViaBrevoApi({ to, subject, html, replyTo, attachments }: MailArgs): Promise<boolean | null> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
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
        ...(attachments?.length
          ? { attachment: attachments.map((a) => ({ name: a.filename, content: a.content.toString("base64") })) }
          : {}),
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

export async function sendMail({ to, subject, html, replyTo, attachments }: MailArgs): Promise<boolean> {
  // 1) Brevo HTTP API (HTTPS) — used when BREVO_API_KEY is set.
  const viaApi = await sendViaBrevoApi({ to, subject, html, replyTo, attachments });
  if (viaApi !== null) return viaApi;

  // 2) Fallback: SMTP (only works if the host allows outbound SMTP ports).
  const t = transport();
  if (!t) {
    console.log(`[email] not configured — skipped "${subject}" to ${to}`);
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@greengenepharma.co.za";
  try {
    await t.sendMail({ from, to, subject, html, replyTo, attachments });
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

/* ---------- Invoice ---------- */
function esc(s: string): string {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}

/**
 * Render + email an invoice to the customer from info@greengenepharma.co.za.
 * Returns true if the email was accepted for delivery.
 */
export async function sendInvoiceEmail(invoiceId: string): Promise<boolean> {
  const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
  if (!inv) return false;

  type Line = { description: string; quantity: number; unitPrice: number };
  type Company = { name?: string; regNo?: string; vatNo?: string; address?: string; email?: string; phone?: string };
  type Bank = { bankName?: string; accountName?: string; accountNumber?: string; branchCode?: string; accountType?: string };
  const items: Line[] = JSON.parse(inv.items || "[]");
  const company: Company = JSON.parse(inv.companyDetails || "{}");
  const bank: Bank = JSON.parse(inv.bankDetails || "{}");

  const rows = items
    .map(
      (l) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(l.description)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${l.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(l.unitPrice)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(l.unitPrice * l.quantity)}</td>
      </tr>`
    )
    .join("");

  const companyName = company.name || "GreenGene Pharma";
  const bankRows = [
    ["Bank", bank.bankName],
    ["Account name", bank.accountName],
    ["Account number", bank.accountNumber],
    ["Branch code", bank.branchCode],
    ["Account type", bank.accountType],
    ["Reference", `${companyName} #${inv.number}`],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#6b7c73">${k}</td><td style="padding:2px 0;font-weight:600">${esc(String(v))}</td></tr>`)
    .join("");

  const issue = new Date(inv.issueDate).toLocaleDateString("en-ZA", { dateStyle: "long" });
  const due = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-ZA", { dateStyle: "long" }) : "";

  const body = `
    <table style="width:100%;font-size:13px;margin-bottom:16px"><tr>
      <td style="vertical-align:top">
        <img src="${APP_URL}/logo.png" alt="GreenGene Pharma" style="height:38px;width:auto;display:block;margin-bottom:10px"/>
        <strong style="font-size:15px;color:#104536">${esc(companyName)}</strong><br/>
        ${company.address ? esc(company.address) + "<br/>" : ""}
        ${company.regNo ? "Reg. No: " + esc(company.regNo) + "<br/>" : ""}
        ${company.vatNo ? "VAT No: " + esc(company.vatNo) + "<br/>" : ""}
        ${company.email ? esc(company.email) + "<br/>" : ""}
        ${company.phone ? esc(company.phone) : ""}
      </td>
      <td style="vertical-align:top;text-align:right">
        <div style="font-size:20px;font-weight:800;color:#104536">INVOICE</div>
        <div style="color:#6b7c73"># ${esc(inv.number)}</div>
        <div style="margin-top:6px">Date: ${issue}</div>
        ${due ? `<div>Due: ${due}</div>` : ""}
        <div style="margin-top:6px;display:inline-block;padding:3px 10px;border-radius:999px;font-weight:700;font-size:12px;${inv.status === "paid" ? "background:#d9f0e0;color:#1c6b40" : "background:#fdecec;color:#b3261e"}">${inv.status === "paid" ? "PAID" : "UNPAID"}</div>
      </td>
    </tr></table>

    <div style="background:#f6f8f6;border-radius:10px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#6b7c73;font-size:12px">Billed to</div>
      <strong>${esc(inv.customerName)}</strong><br/>
      <span style="color:#4a5a51;font-size:13px">${esc(inv.customerEmail)}</span>
      ${inv.customerAddress ? `<br/><span style="color:#4a5a51;font-size:13px">${esc(inv.customerAddress)}</span>` : ""}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="color:#6b7c73;text-align:left">
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1">Description</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:center">Qty</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:right">Unit</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:right">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <table style="width:100%;font-size:14px;margin-top:10px"><tr><td></td><td style="width:200px">
      <table style="width:100%">
        <tr><td style="padding:3px 0;color:#6b7c73">Subtotal</td><td style="padding:3px 0;text-align:right">${formatPrice(inv.subtotal)}</td></tr>
        ${inv.taxRate ? `<tr><td style="padding:3px 0;color:#6b7c73">VAT (${inv.taxRate}%)</td><td style="padding:3px 0;text-align:right">${formatPrice(inv.taxAmount)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;border-top:2px solid #dfe6e1;font-weight:800;color:#104536">Total</td><td style="padding:6px 0;border-top:2px solid #dfe6e1;text-align:right;font-weight:800;color:#104536">${formatPrice(inv.total)}</td></tr>
      </table>
    </td></tr></table>

    ${bankRows ? `<div style="margin-top:18px;background:#f6f8f6;border-radius:10px;padding:12px 14px">
      <div style="font-weight:700;color:#104536;margin-bottom:6px">Banking details</div>
      <table style="font-size:13px">${bankRows}</table>
    </div>` : ""}

    ${inv.notes ? `<p style="margin-top:16px;color:#4a5a51;font-size:13px">${esc(inv.notes)}</p>` : ""}
  `;

  // Generate a PDF copy to attach (best-effort — email still sends if this fails)
  let attachments: { filename: string; content: Buffer }[] | undefined;
  try {
    const { renderInvoicePdf } = await import("@/lib/invoice-pdf");
    const pdf = await renderInvoicePdf(inv);
    attachments = [{ filename: `Invoice-${inv.number}.pdf`, content: pdf }];
  } catch (e) {
    console.error("[invoice] PDF generation failed:", (e as Error).message);
  }

  const ok = await sendMail({
    to: inv.customerEmail,
    subject: `Invoice ${inv.number} from ${companyName}`,
    html: layout(`Invoice ${inv.number}`, body),
    replyTo: company.email || undefined,
    attachments,
  });
  if (ok) {
    await prisma.invoice.update({ where: { id: inv.id }, data: { sentAt: new Date() } }).catch(() => {});
  }
  return ok;
}

/* ---------- Wholesale quotation ---------- */

/**
 * Render + email a wholesale quotation (elegant HTML + PDF attachment) to the
 * customer. Returns true if the email was accepted for delivery.
 */
export async function sendQuotationEmail(quoteId: string): Promise<boolean> {
  const q = await prisma.quotation.findUnique({ where: { id: quoteId } });
  if (!q) return false;

  type Line = { name: string; quantity: number; tierPercent: number; basePrice: number; unitPrice: number; rrp: number | null };
  type Tier = { minQty: number; maxQty: number | null; discountPercent: number };
  type Company = { name?: string; regNo?: string; vatNo?: string; address?: string; email?: string; phone?: string };
  const items: Line[] = JSON.parse(q.items || "[]");
  const tiers: Tier[] = JSON.parse(q.tierTable || "[]");
  const company: Company = JSON.parse(q.companyDetails || "{}");
  const companyName = company.name || "GreenGene Pharma";
  const settings = await getSettings();
  const rrpMarginPct = parseInt(settings.wholesaleRrpMarginPct, 10) || 20;

  const rows = items
    .map(
      (l) => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(l.name)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${l.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${
          l.tierPercent > 0 ? `<span style="color:#155640;font-weight:700">−${l.tierPercent}%</span>` : "—"
        }</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(l.unitPrice)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#6b7c73">${
          l.rrp != null ? formatPrice(l.rrp) : "—"
        }</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(l.unitPrice * l.quantity)}</td>
      </tr>`
    )
    .join("");

  const tierRangeLabel = (t: Tier) =>
    t.maxQty === null ? `${t.minQty}+ units` : `${t.minQty}–${t.maxQty} units`;
  const tierRows = tiers
    .map(
      (t) => `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #e6ede8;color:#4a5a51">${tierRangeLabel(t)}</td>
        <td style="padding:6px 0;border-bottom:1px solid #e6ede8;text-align:right;font-weight:700;color:#155640">${t.discountPercent}%*</td>
      </tr>`
    )
    .join("");

  const issue = new Date(q.issueDate).toLocaleDateString("en-ZA", { dateStyle: "long" });
  const valid = q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-ZA", { dateStyle: "long" }) : "";

  const bonusHtml =
    q.bonusBuyQty && q.bonusFreeQty
      ? `<div style="margin-bottom:14px;background:#eef7e3;border:1px solid #cfe6ab;border-radius:10px;padding:12px 14px">
          <span style="font-size:18px">🎁</span>
          <strong style="color:#104536"> Bonus offer:</strong>
          <span style="color:#155640;font-weight:700">Buy ${q.bonusBuyQty}, get ${q.bonusFreeQty} free</span>
        </div>`
      : "";

  const body = `
    <table style="width:100%;font-size:13px;margin-bottom:16px"><tr>
      <td style="vertical-align:top">
        <img src="${APP_URL}/logo.png" alt="GreenGene Pharma" style="height:38px;width:auto;display:block;margin-bottom:10px"/>
        <strong style="font-size:15px;color:#104536">${esc(companyName)}</strong><br/>
        ${company.address ? esc(company.address) + "<br/>" : ""}
        ${company.regNo ? "Reg. No: " + esc(company.regNo) + "<br/>" : ""}
        ${company.vatNo ? "VAT No: " + esc(company.vatNo) + "<br/>" : ""}
        ${company.email ? esc(company.email) + "<br/>" : ""}
        ${company.phone ? esc(company.phone) : ""}
      </td>
      <td style="vertical-align:top;text-align:right">
        <div style="font-size:18px;font-weight:800;color:#104536;line-height:1.15">WHOLESALE<br/>QUOTATION</div>
        <div style="color:#6b7c73;margin-top:4px"># ${esc(q.number)}</div>
        <div style="margin-top:6px">Date: ${issue}</div>
        ${valid ? `<div>Valid until: ${valid}</div>` : ""}
      </td>
    </tr></table>

    <div style="background:#f6f8f6;border-radius:10px;padding:12px 14px;margin-bottom:14px">
      <div style="color:#6b7c73;font-size:12px">Prepared for</div>
      <strong>${esc(q.customerCompany || q.customerName)}</strong><br/>
      ${q.customerCompany ? `<span style="color:#4a5a51;font-size:13px">${esc(q.customerName)}</span><br/>` : ""}
      <span style="color:#4a5a51;font-size:13px">${esc(q.customerEmail)}</span>
      ${q.customerAddress ? `<br/><span style="color:#4a5a51;font-size:13px">${esc(q.customerAddress)}</span>` : ""}
    </div>

    ${bonusHtml}

    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="color:#6b7c73;text-align:left">
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1">Product</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:center">Qty</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:center">Discount</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:right">Wholesale</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:right">RRP</th>
        <th style="padding:6px 0;border-bottom:2px solid #dfe6e1;text-align:right">Amount</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <table style="width:100%;font-size:14px;margin-top:10px"><tr><td></td><td style="width:220px">
      <table style="width:100%">
        <tr><td style="padding:6px 0;border-top:2px solid #dfe6e1;font-weight:800;color:#104536">Order total</td><td style="padding:6px 0;border-top:2px solid #dfe6e1;text-align:right;font-weight:800;color:#104536">${formatPrice(q.subtotal)}</td></tr>
      </table>
    </td></tr></table>

    ${
      tierRows
        ? `<div style="margin-top:18px;background:#eef4ef;border:1px solid #d7e5db;border-radius:10px;padding:14px 16px">
      <div style="font-weight:700;color:#104536;margin-bottom:8px">Volume discount tiers</div>
      <table style="width:100%;font-size:13px">${tierRows}</table>
      <p style="margin:10px 0 0;color:#4a5a51;font-size:12px">The more units you order, the lower your per-unit cost — order into a higher tier to unlock a bigger discount.</p>
      <p style="margin:8px 0 0;color:#6b7c73;font-size:11px;font-style:italic">* The discounted ${rrpMarginPct}% is below the selling price on online platforms, exclusive of delivery costs — this gives you an idea of your profit margin / mark-up. RRP is suggestive but you may change it according to your market needs.</p>
    </div>`
        : ""
    }

    ${q.notes ? `<p style="margin-top:16px;color:#4a5a51;font-size:13px;white-space:pre-wrap">${esc(q.notes)}</p>` : ""}

    <p style="margin-top:18px;color:#4a5a51;font-size:13px">To place an order or discuss your requirements, simply reply to this email${
      company.phone ? ` or call us on ${esc(company.phone)}` : ""
    }.</p>
  `;

  // Generate a PDF copy to attach (best-effort — email still sends if this fails)
  let attachments: { filename: string; content: Buffer }[] | undefined;
  try {
    const { renderQuotationPdf } = await import("@/lib/quote-pdf");
    const pdf = await renderQuotationPdf({ ...q, rrpMarginPct });
    attachments = [{ filename: `Wholesale-Quotation-${q.number}.pdf`, content: pdf }];
  } catch (e) {
    console.error("[quotation] PDF generation failed:", (e as Error).message);
  }

  const ok = await sendMail({
    to: q.customerEmail,
    subject: `Wholesale quotation ${q.number} from ${companyName}`,
    html: layout(`Wholesale quotation ${q.number}`, body),
    replyTo: company.email || undefined,
    attachments,
  });
  if (ok) {
    await prisma.quotation
      .update({ where: { id: q.id }, data: { sentAt: new Date(), status: q.status === "draft" ? "sent" : q.status } })
      .catch(() => {});
  }
  return ok;
}
