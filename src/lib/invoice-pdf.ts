import "server-only";
import PDFDocument from "pdfkit";
import { readFileSync } from "node:fs";
import path from "node:path";
import { formatPrice } from "@/lib/utils";
import { parseLines, safeJson, type CompanyDetails, type BankDetails } from "@/lib/invoice";

export type InvoiceRecord = {
  number: string;
  customerName: string;
  customerEmail: string;
  customerAddress: string | null;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  items: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  companyDetails: string;
  bankDetails: string;
};

const DARK = "#104536";
const MUTED = "#6b7c73";
const LINE = "#dfe6e1";
const SOFT = "#f4f6f4";

function fmtDate(d: Date) {
  return new Date(d).toLocaleDateString("en-ZA", { dateStyle: "long" });
}

/** Render an invoice to a PDF Buffer (A4). */
export async function renderInvoicePdf(inv: InvoiceRecord): Promise<Buffer> {
  const items = parseLines(inv.items);
  const company = safeJson<CompanyDetails>(inv.companyDetails, {} as CompanyDetails);
  const bank = safeJson<BankDetails>(inv.bankDetails, {} as BankDetails);
  const companyName = company.name || "GreenGene Pharma";
  const paid = inv.status === "paid";

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const L = 50; // left margin
  const R = 545; // right edge
  const W = R - L;

  // ---- Header: logo + company (left), INVOICE meta (right) ----
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
  const companyLines = [
    company.address,
    company.regNo ? `Reg. No: ${company.regNo}` : "",
    company.vatNo ? `VAT No: ${company.vatNo}` : "",
    company.email,
    company.phone,
  ].filter(Boolean) as string[];
  companyLines.forEach((ln) => doc.text(ln, L, undefined, { width: 280 }));

  // Right meta
  doc.font("Helvetica-Bold").fontSize(22).fillColor(DARK).text("INVOICE", 320, 50, { width: 225, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(`# ${inv.number}`, 320, 78, { width: 225, align: "right" });
  doc.fillColor("#333").fontSize(9).text(`Date: ${fmtDate(inv.issueDate)}`, 320, 94, { width: 225, align: "right" });
  if (inv.dueDate) doc.text(`Due: ${fmtDate(inv.dueDate)}`, 320, undefined, { width: 225, align: "right" });

  // Status badge (right)
  const badge = paid ? "PAID" : "UNPAID";
  const bw = 58, bh = 18, bx = R - bw, by = 118;
  doc.roundedRect(bx, by, bw, bh, 9).fill(paid ? "#d9f0e0" : "#fdecec");
  doc.fillColor(paid ? "#1c6b40" : "#b3261e").font("Helvetica-Bold").fontSize(9).text(badge, bx, by + 5, { width: bw, align: "center" });

  // ---- Bill to ----
  let y = Math.max(doc.y, 150) + 14;
  doc.roundedRect(L, y, W, 58, 6).fill(SOFT);
  doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("BILLED TO", L + 12, y + 10);
  doc.fillColor("#222").font("Helvetica-Bold").fontSize(11).text(inv.customerName, L + 12, y + 22, { width: W - 24 });
  doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(inv.customerEmail, L + 12, y + 37, { width: W - 24 });
  if (inv.customerAddress) doc.text(inv.customerAddress, L + 12, undefined, { width: W - 24 });
  y += 74;

  // ---- Items table ----
  const cDesc = L, wDesc = 250;
  const cQty = 305, wQty = 45;
  const cUnit = 360, wUnit = 90;
  const cAmt = 460, wAmt = 85;

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(MUTED);
  doc.text("DESCRIPTION", cDesc, y, { width: wDesc });
  doc.text("QTY", cQty, y, { width: wQty, align: "center" });
  doc.text("UNIT", cUnit, y, { width: wUnit, align: "right" });
  doc.text("AMOUNT", cAmt, y, { width: wAmt, align: "right" });
  y += 14;
  doc.moveTo(L, y).lineTo(R, y).lineWidth(1.4).strokeColor(LINE).stroke();
  y += 8;

  doc.font("Helvetica").fontSize(10).fillColor("#222");
  for (const it of items) {
    if (y > 720) {
      doc.addPage();
      y = 50;
    }
    const h = Math.max(doc.heightOfString(it.description, { width: wDesc }), 12);
    doc.fillColor("#222").text(it.description, cDesc, y, { width: wDesc });
    doc.text(String(it.quantity), cQty, y, { width: wQty, align: "center" });
    doc.text(formatPrice(it.unitPrice), cUnit, y, { width: wUnit, align: "right" });
    doc.text(formatPrice(it.unitPrice * it.quantity), cAmt, y, { width: wAmt, align: "right" });
    y += h + 8;
    doc.moveTo(L, y - 4).lineTo(R, y - 4).lineWidth(0.5).strokeColor(LINE).stroke();
  }

  // ---- Totals ----
  y += 6;
  const tLabelX = 360, tValX = 460, tValW = 85;
  const totalsRow = (label: string, val: string, bold = false) => {
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor(bold ? DARK : MUTED);
    doc.text(label, tLabelX, y, { width: 90 });
    doc.fillColor(bold ? DARK : "#222").text(val, tValX, y, { width: tValW, align: "right" });
    y += bold ? 20 : 16;
  };
  totalsRow("Subtotal", formatPrice(inv.subtotal));
  if (inv.taxRate > 0) totalsRow(`VAT (${inv.taxRate}%)`, formatPrice(inv.taxAmount));
  doc.moveTo(tLabelX, y).lineTo(R, y).lineWidth(1.4).strokeColor(LINE).stroke();
  y += 6;
  totalsRow("Total", formatPrice(inv.total), true);

  // ---- Banking details ----
  const bankRows: [string, string][] = ([
    ["Bank", bank.bankName],
    ["Account name", bank.accountName],
    ["Account number", bank.accountNumber],
    ["Branch code", bank.branchCode],
    ["Account type", bank.accountType],
    ["Reference", `${companyName} #${inv.number}`],
  ] as [string, string | undefined][]).filter((r): r is [string, string] => Boolean(r[1]));

  if (bankRows.length) {
    y += 14;
    const boxH = 26 + bankRows.length * 15;
    if (y + boxH > 800) { doc.addPage(); y = 50; }
    doc.roundedRect(L, y, W, boxH, 6).fill(SOFT);
    doc.fillColor(DARK).font("Helvetica-Bold").fontSize(10).text("Banking details", L + 12, y + 10);
    let by2 = y + 28;
    doc.fontSize(9);
    for (const [k, v] of bankRows) {
      doc.font("Helvetica").fillColor(MUTED).text(k, L + 12, by2, { width: 110 });
      doc.font("Helvetica-Bold").fillColor("#222").text(v, L + 130, by2, { width: W - 142 });
      by2 += 15;
    }
    y += boxH;
  }

  // ---- Notes ----
  if (inv.notes) {
    y += 14;
    doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(inv.notes, L, y, { width: W });
  }

  // ---- Footer ----
  doc.font("Helvetica").fontSize(8).fillColor("#aab4ad");
  doc.text("GreenGene Pharma · Empower Your Wellness, Live Better", L, 812, { width: W, align: "center" });

  doc.end();
  return done;
}
