import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, CheckCircle2, RotateCcw, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { setInvoiceStatus, sendInvoice, deleteInvoice } from "@/app/admin/actions";
import { PrintButton } from "@/components/admin/print-button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { parseLines, safeJson, type CompanyDetails, type BankDetails } from "@/lib/invoice";

export const dynamic = "force-dynamic";

export default async function InvoiceView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; senterror?: string }>;
}) {
  const { id } = await params;
  const { sent, senterror } = await searchParams;
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) notFound();

  const items = parseLines(inv.items);
  const company = safeJson<CompanyDetails>(inv.companyDetails, {} as CompanyDetails);
  const bank = safeJson<BankDetails>(inv.bankDetails, {} as BankDetails);
  const paid = inv.status === "paid";

  const companyName = company.name || "GreenGene Pharma";
  const bankRows = [
    ["Bank", bank.bankName],
    ["Account name", bank.accountName],
    ["Account number", bank.accountNumber],
    ["Branch code", bank.branchCode],
    ["Account type", bank.accountType],
    ["Reference", `${companyName} #${inv.number}`],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-5">
      {/* Toolbar (hidden when printing) */}
      <div className="print:hidden">
        <Link href="/admin/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Back to invoices
        </Link>
      </div>

      {sent && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 print:hidden">
          <CheckCircle2 className="h-4 w-4" /> Invoice emailed to {inv.customerEmail}.
        </p>
      )}
      {senterror && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 print:hidden">
          <AlertTriangle className="h-4 w-4" /> Could not send the email. Check the customer email and try again.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <form action={sendInvoice}>
          <input type="hidden" name="id" value={inv.id} />
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <Send className="h-4 w-4" /> {inv.sentAt ? "Resend to customer" : "Send to customer"}
          </button>
        </form>
        <form action={setInvoiceStatus}>
          <input type="hidden" name="id" value={inv.id} />
          <input type="hidden" name="status" value={paid ? "unpaid" : "paid"} />
          <button className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            {paid ? <><RotateCcw className="h-4 w-4" /> Mark unpaid</> : <><CheckCircle2 className="h-4 w-4" /> Mark paid</>}
          </button>
        </form>
        <PrintButton />
        <form action={deleteInvoice} className="ml-auto">
          <input type="hidden" name="id" value={inv.id} />
          <ConfirmSubmit
            message={`Delete invoice ${inv.number}? This cannot be undone.`}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </ConfirmSubmit>
        </form>
      </div>

      {/* Printable invoice */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-8 shadow-sm print:border-0 print:shadow-none sm:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="text-sm leading-relaxed">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="GreenGene Pharma" className="mb-3 h-11 w-auto" />
            <div className="text-lg font-bold text-brand-800">{companyName}</div>
            {company.address && <div className="text-muted-foreground">{company.address}</div>}
            {company.regNo && <div className="text-muted-foreground">Reg. No: {company.regNo}</div>}
            {company.vatNo && <div className="text-muted-foreground">VAT No: {company.vatNo}</div>}
            {company.email && <div className="text-muted-foreground">{company.email}</div>}
            {company.phone && <div className="text-muted-foreground">{company.phone}</div>}
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold tracking-tight text-brand-800">INVOICE</div>
            <div className="text-muted-foreground"># {inv.number}</div>
            <div className="mt-2 text-sm">Date: {new Date(inv.issueDate).toLocaleDateString("en-ZA", { dateStyle: "long" })}</div>
            {inv.dueDate && <div className="text-sm">Due: {new Date(inv.dueDate).toLocaleDateString("en-ZA", { dateStyle: "long" })}</div>}
            <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold ${paid ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>
              {paid ? "PAID" : "UNPAID"}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-muted/60 p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Billed to</div>
          <div className="font-semibold">{inv.customerName}</div>
          <div className="text-muted-foreground">{inv.customerEmail}</div>
          {inv.customerAddress && <div className="text-muted-foreground">{inv.customerAddress}</div>}
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2">Description</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l, idx) => (
              <tr key={idx} className="border-b border-border">
                <td className="py-2.5">{l.description}</td>
                <td className="py-2.5 text-center tabular-nums">{l.quantity}</td>
                <td className="py-2.5 text-right tabular-nums">{formatPrice(l.unitPrice)}</td>
                <td className="py-2.5 text-right tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-muted-foreground">Subtotal</td>
                <td className="py-1 text-right tabular-nums">{formatPrice(inv.subtotal)}</td>
              </tr>
              {inv.taxRate > 0 && (
                <tr>
                  <td className="py-1 text-muted-foreground">VAT ({inv.taxRate}%)</td>
                  <td className="py-1 text-right tabular-nums">{formatPrice(inv.taxAmount)}</td>
                </tr>
              )}
              <tr className="border-t-2 border-border">
                <td className="py-2 text-base font-bold text-brand-800">Total</td>
                <td className="py-2 text-right text-base font-bold tabular-nums text-brand-800">{formatPrice(inv.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {bankRows.length > 0 && (
          <div className="mt-8 rounded-xl bg-muted/60 p-4">
            <div className="mb-2 text-sm font-bold text-brand-800">Banking details</div>
            <table className="text-sm">
              <tbody>
                {bankRows.map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-0.5 pr-4 text-muted-foreground">{k}</td>
                    <td className="py-0.5 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {inv.notes && <p className="mt-6 text-sm text-muted-foreground">{inv.notes}</p>}
      </div>
    </div>
  );
}
