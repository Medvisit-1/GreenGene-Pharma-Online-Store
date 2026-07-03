import PDFDocument from "pdfkit";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DARK = "#104536", MUTED = "#6b7c73", LINE = "#dfe6e1", SOFT = "#f4f6f4";
const fp = (c) => "R " + (c / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fd = (d) => new Date(d).toLocaleDateString("en-ZA", { dateStyle: "long" });

const inv = {
  number: "INV-0007",
  customerName: "Luyanda Khaba",
  customerEmail: "khabaluyanda7@gmail.com",
  customerAddress: "315 Main Road, Queensburgh, Durban South, 4093",
  status: "unpaid",
  issueDate: new Date("2026-07-01"),
  dueDate: new Date("2026-07-15"),
  taxRate: 15,
  subtotal: 75000, taxAmount: 11250, total: 86250,
  notes: "Thank you for your business. Please use the invoice number as your payment reference.",
};
const items = [
  { description: "Zenax — Natural Mind & Stress Support Formula (60 Capsules - One Month Supply)", quantity: 1, unitPrice: 25000 },
  { description: "Estrogene – Ultimate Hormonal Support for Women (60 Capsules)", quantity: 2, unitPrice: 25000 },
];
const company = { name: "GreenGene Pharma", regNo: "2021/123456/07", vatNo: "4123456789", address: "Duncan Drive, Westville, 3629, South Africa", email: "info@greengenepharma.co.za", phone: "+27 11 000 0000" };
const bank = { bankName: "FNB", accountName: "GreenGene Pharma", accountNumber: "62812345678", branchCode: "250655", accountType: "Current / Cheque" };
const companyName = company.name;
const paid = inv.status === "paid";

const doc = new PDFDocument({ size: "A4", margin: 50 });
const chunks = [];
doc.on("data", (c) => chunks.push(c));
doc.on("end", () => { writeFileSync("/tmp/test-invoice.pdf", Buffer.concat(chunks)); console.log("wrote /tmp/test-invoice.pdf"); });

const L = 50, R = 545, W = R - L;
let leftY = 50;
try { doc.image(readFileSync(path.join(process.cwd(), "public", "logo.png")), L, 46, { height: 34 }); leftY = 90; } catch { leftY = 50; }
doc.font("Helvetica-Bold").fontSize(13).fillColor(DARK).text(companyName, L, leftY, { width: 280 });
doc.font("Helvetica").fontSize(9).fillColor(MUTED);
[company.address, `Reg. No: ${company.regNo}`, `VAT No: ${company.vatNo}`, company.email, company.phone].filter(Boolean).forEach((ln) => doc.text(ln, L, undefined, { width: 280 }));
doc.font("Helvetica-Bold").fontSize(22).fillColor(DARK).text("INVOICE", 320, 50, { width: 225, align: "right" });
doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(`# ${inv.number}`, 320, 78, { width: 225, align: "right" });
doc.fillColor("#333").fontSize(9).text(`Date: ${fd(inv.issueDate)}`, 320, 94, { width: 225, align: "right" });
if (inv.dueDate) doc.text(`Due: ${fd(inv.dueDate)}`, 320, undefined, { width: 225, align: "right" });
const bw = 58, bh = 18, bx = R - bw, by = 118;
doc.roundedRect(bx, by, bw, bh, 9).fill(paid ? "#d9f0e0" : "#fdecec");
doc.fillColor(paid ? "#1c6b40" : "#b3261e").font("Helvetica-Bold").fontSize(9).text(paid ? "PAID" : "UNPAID", bx, by + 5, { width: bw, align: "center" });

let y = Math.max(doc.y, 150) + 14;
doc.roundedRect(L, y, W, 58, 6).fill(SOFT);
doc.fillColor(MUTED).font("Helvetica").fontSize(8).text("BILLED TO", L + 12, y + 10);
doc.fillColor("#222").font("Helvetica-Bold").fontSize(11).text(inv.customerName, L + 12, y + 22, { width: W - 24 });
doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(inv.customerEmail, L + 12, y + 37, { width: W - 24 });
if (inv.customerAddress) doc.text(inv.customerAddress, L + 12, undefined, { width: W - 24 });
y += 74;

const cDesc = L, wDesc = 250, cQty = 305, wQty = 45, cUnit = 360, wUnit = 90, cAmt = 460, wAmt = 85;
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
  const h = Math.max(doc.heightOfString(it.description, { width: wDesc }), 12);
  doc.fillColor("#222").text(it.description, cDesc, y, { width: wDesc });
  doc.text(String(it.quantity), cQty, y, { width: wQty, align: "center" });
  doc.text(fp(it.unitPrice), cUnit, y, { width: wUnit, align: "right" });
  doc.text(fp(it.unitPrice * it.quantity), cAmt, y, { width: wAmt, align: "right" });
  y += h + 8;
  doc.moveTo(L, y - 4).lineTo(R, y - 4).lineWidth(0.5).strokeColor(LINE).stroke();
}
y += 6;
const trow = (label, val, bold = false) => {
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 10).fillColor(bold ? DARK : MUTED);
  doc.text(label, 360, y, { width: 90 });
  doc.fillColor(bold ? DARK : "#222").text(val, 460, y, { width: 85, align: "right" });
  y += bold ? 20 : 16;
};
trow("Subtotal", fp(inv.subtotal));
if (inv.taxRate > 0) trow(`VAT (${inv.taxRate}%)`, fp(inv.taxAmount));
doc.moveTo(360, y).lineTo(R, y).lineWidth(1.4).strokeColor(LINE).stroke();
y += 6;
trow("Total", fp(inv.total), true);

const bankRows = [["Bank", bank.bankName], ["Account name", bank.accountName], ["Account number", bank.accountNumber], ["Branch code", bank.branchCode], ["Account type", bank.accountType], ["Reference", `${companyName} #${inv.number}`]].filter((r) => r[1]);
y += 14;
const boxH = 26 + bankRows.length * 15;
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
if (inv.notes) { y += 14; doc.font("Helvetica").fontSize(9).fillColor(MUTED).text(inv.notes, L, y, { width: W }); }
doc.font("Helvetica").fontSize(8).fillColor("#aab4ad").text("GreenGene Pharma · Empower Your Wellness, Live Better", L, 812, { width: W, align: "center" });
doc.end();
