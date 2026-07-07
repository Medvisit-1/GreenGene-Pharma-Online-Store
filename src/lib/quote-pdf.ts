import "server-only";
import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatPrice } from "@/lib/utils";
import {
  parseQuoteLines,
  parseTierTable,
  safeJson,
  tierRange,
  type CompanyDetails,
} from "@/lib/wholesale";

export type QuotationRecord = {
  number: string;
  customerName: string;
  customerCompany: string | null;
  customerEmail: string;
  customerAddress: string | null;
  status: string;
  issueDate: Date;
  validUntil: Date | null;
  items: string;
  subtotal: number;
  bonusBuyQty: number | null;
  bonusFreeQty: number | null;
  companyDetails: string;
  tierTable: string;
  notes: string | null;
};

const DARK = "#104536";
const MUTED = "#6b7c73";
const LINE = "#dfe6e1";
const SOFT = "#f4f6f4";
const ACCENT = "#155640";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-ZA", { dateStyle: "long" });
}

/** Render a wholesale quotation to a PDF Buffer (A4). */
export async function renderQuotationPdf(q: QuotationRecord): Promise<Buffer> {
  const items = parseQuoteLines(q.items);
  const tiers = parseTierTable(q.tierTable);
  const company = safeJson<CompanyDetails>(q.companyDetails, {} as CompanyDetails);
  const companyName = company.name || "GreenGene Pharma";

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const L = 50;
  const R = 545;
  const W = R - L;

  // ---- Header ----
  let leftY = 50;
  try {
    const logo = readFileSync(path.join(process.cwd(), "public", "logo.png"));
    doc.image(logo, L, 46, { height: 34 });
    leftY = 90;
  } catch {
    leftY = 50;
  }
  doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text(companyName, L, leftY, { width: 280 });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  ([
    company.address,
    company.regNo ? `Reg. No: ${company.regNo}` : "",
    company.vatNo ? `VAT No: ${company.vatNo}` : "",
    company.email,
    company.phone,
  ].filter(Boolean) as string[]).forEach((ln) => doc.text(ln, L, undefined, { width: 280 }));

  doc.font("Helvetica-Bold").fontSize(20).fillColor(DARK).text("WHOLESALE", 300, 50, { width: 245, align: "right" });
  doc.text("QUOTATION", 300, 72, { width: 245, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(`# ${q.number}`, 300, 98, { width: 245, align: "right" });
  doc.fillColor("#333").fontSize(9).text(`Date: ${fmtDate(q.issueDate)}`, 300, 114, { width: 245, align: "right" });
  if (q.validUntil) doc.text(`Valid until: ${fmtDate(q.validUntil)}`, 300, undefined, { width: 245, align: "right" });

  // ---- Prepared for ----
  let y = Math.max(doc.y, 150) + 14;
  const boxH = q.customerAddress ? 72 : 58;
  doc.roundedRect(L, y, W, boxH, 6).fill(SOFT);
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("PREPARED FOR", L + 12, y + 10);
  const who = q.customerCompany ? `${q.customerCompany}` : q.customerName;
  doc.fillColor("#222").font("Helvetica-Bold").fontSize(11).text(who, L + 12, y + 22, { width: W - 24 });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  if (q.customerCompany) doc.text(q.customerName, L + 12, y + 37, { width: W - 24 });
  doc.text(q.customerEmail, L + 12, undefined, { width: W - 24 });
  if (q.customerAddress) doc.text(q.customerAddress, L + 12, undefined, { width: W - 24 });
  y += boxH + 16;

  // ---- Bonus offer ----
  if (q.bonusBuyQty && q.bonusFreeQty) {
    doc.roundedRect(L, y, W, 30, 6).fill("#eef7e3");
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text("Bonus offer", L + 12, y + 6);
    doc.fillColor(ACCENT).font("Helvetica-Bold").fontSize(10).text(
      `Buy ${q.bonusBuyQty}, get ${q.bonusFreeQty} free`,
      L + 12, y + 18, { width: W - 24 }
    );
    y += 44;
  }

  // ---- Items table ----
  const cDesc = L, wDesc = 215;
  const cQty = 275, wQty = 45;
  const cUnit = 325, wUnit = 75;
  const cRrp = 405, wRrp = 60;
  const cAmt = 470, wAmt = 75;

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(MUTED);
  doc.text("PRODUCT", cDesc, y, { width: wDesc });
  doc.text("QTY", cQty, y, { width: wQty, align: "center" });
  doc.text("WHOLESALE", cUnit, y, { width: wUnit, align: "right" });
  doc.text("RRP", cRrp, y, { width: wRrp, align: "right" });
  doc.text("AMOUNT", cAmt, y, { width: wAmt, align: "right" });
  y += 14;
  doc.moveTo(L, y).lineTo(R, y).lineWidth(1.4).strokeColor(LINE).stroke();
  y += 8;

  doc.font("Helvetica").fontSize(10).fillColor("#222");
  for (const it of items) {
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
    const nameH = doc.heightOfString(it.name, { width: wDesc });
    doc.fillColor("#222").text(it.name, cDesc, y, { width: wDesc });
    doc.text(String(it.quantity), cQty, y, { width: wQty, align: "center" });
    doc.text(formatPrice(it.unitPrice), cUnit, y, { width: wUnit, align: "right" });
    doc.fillColor(MUTED).text(it.rrp != null ? formatPrice(it.rrp) : "—", cRrp, y, { width: wRrp, align: "right" });
    doc.fillColor("#222").text(formatPrice(it.unitPrice * it.quantity), cAmt, y, { width: wAmt, align: "right" });
    const rowH = Math.max(nameH, 14);
    y += rowH + 8;
    doc.moveTo(L, y - 4).lineTo(R, y - 4).lineWidth(0.5).strokeColor(LINE).stroke();
  }

  // ---- Total ----
  y += 6;
  doc.font("Helvetica-Bold").fontSize(12).fillColor(DARK).text("Order total", 360, y, { width: 90 });
  doc.fillColor(DARK).text(formatPrice(q.subtotal), 465, y, { width: wAmt, align: "right" });
  y += 26;

  // ---- Tier explanation ----
  if (tiers.length) {
    if (y + 40 + tiers.length * 18 > 780) {
      doc.addPage();
      y = 50;
    }
    doc.roundedRect(L, y, W, 26 + tiers.length * 18, 6).fill(SOFT);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text("Volume discount tiers", L + 12, y + 9);
    let ty = y + 27;
    doc.fontSize(9);
    for (const t of tiers) {
      doc.font("Helvetica").fillColor(MUTED).text(tierRange(t), L + 12, ty, { width: 200 });
      doc.font("Helvetica-Bold").fillColor(ACCENT).text(`${t.discountPercent}%*`, L + 220, ty, { width: W - 232 });
      ty += 18;
    }
    y += 26 + tiers.length * 18;
    doc.fillColor(MUTED).font("Helvetica").fontSize(8.5).text(
      "The more units you order, the lower your per-unit cost. Order into a higher tier to unlock a bigger discount.",
      L, y + 6, { width: W }
    );
    y += 20;
    doc.font("Helvetica-Oblique").fontSize(8).fillColor(MUTED).text(
      "* The recommended retail price (RRP) is approximately 20% below the average selling price on online platforms (excluding delivery fees) — this gives you an idea of your profit margin / mark-up.",
      L, y, { width: W }
    );
    y += 22;
  }

  // ---- Notes ----
  if (q.notes) {
    if (y + 40 > 800) {
      doc.addPage();
      y = 50;
    }
    y += 6;
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(q.notes, L, y, { width: W });
  }

  // ---- Footer ----
  doc.font("Helvetica").fontSize(8).fillColor("#aab4ad");
  doc.text("GreenGene Pharma · Empower Your Wellness, Live Better", L, 812, { width: W, align: "center" });

  doc.end();
  return done;
}
