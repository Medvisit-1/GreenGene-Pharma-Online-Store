import Link from "next/link";
import { Plus, CheckCircle2, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { saveInvoiceSettings } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invoicing" };

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ settings?: string }>;
}) {
  const { settings } = await searchParams;
  const [invoices, s] = await Promise.all([
    prisma.invoice.findMany({ orderBy: { createdAt: "desc" } }),
    getSettings(),
  ]);

  const unpaidTotal = invoices
    .filter((i) => i.status !== "paid")
    .reduce((n, i) => n + i.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoicing</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {invoices.length} invoice{invoices.length === 1 ? "" : "s"} ·{" "}
            <span className="font-medium text-amber-700">{formatPrice(unpaidTotal)} outstanding</span>
          </p>
        </div>
        <Link href="/admin/invoices/new">
          <Button size="lg"><Plus className="h-4 w-4" /> New invoice</Button>
        </Link>
      </div>

      {settings && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> Business &amp; banking details saved.
        </p>
      )}

      {/* Invoice history */}
      {invoices.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No invoices yet. Click <strong>New invoice</strong> to create your first one.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
              <tr>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((i) => (
                <tr key={i.id} className="hover:bg-brand-50/40">
                  <td className="px-4 py-3 font-semibold text-brand-700">
                    <Link href={`/admin/invoices/${i.id}`} className="inline-flex items-center gap-2 hover:underline">
                      <FileText className="h-4 w-4" /> {i.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {i.customerName}
                    {i.sentAt && <span className="ml-2 text-[11px] text-brand-600">· sent</span>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(i.issueDate).toLocaleDateString("en-ZA", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${i.status === "paid" ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"}`}>
                      {i.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">{formatPrice(i.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Business & banking details */}
      <form action={saveInvoiceSettings} className="space-y-5">
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 font-bold">Your business details</h2>
          <p className="mb-4 text-xs text-muted-foreground">Shown at the top of every invoice.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Company name</label>
              <input name="invoiceCompanyName" defaultValue={s.invoiceCompanyName} className={input} />
            </div>
            <div>
              <label className={label}>Registration number</label>
              <input name="invoiceRegNo" defaultValue={s.invoiceRegNo} className={input} />
            </div>
            <div>
              <label className={label}>VAT number</label>
              <input name="invoiceVatNo" defaultValue={s.invoiceVatNo} className={input} />
            </div>
            <div>
              <label className={label}>Phone</label>
              <input name="invoiceCompanyPhone" defaultValue={s.invoiceCompanyPhone} className={input} />
            </div>
            <div>
              <label className={label}>Email</label>
              <input name="invoiceCompanyEmail" defaultValue={s.invoiceCompanyEmail} className={input} />
            </div>
            <div>
              <label className={label}>Default VAT rate (%)</label>
              <input name="invoiceDefaultTaxRate" inputMode="numeric" defaultValue={s.invoiceDefaultTaxRate} className={input} />
            </div>
            <div className="sm:col-span-2">
              <label className={label}>Address</label>
              <input name="invoiceCompanyAddress" defaultValue={s.invoiceCompanyAddress} className={input} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 font-bold">Banking details</h2>
          <p className="mb-4 text-xs text-muted-foreground">Shown at the bottom of every invoice so customers can pay.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label}>Bank</label>
              <input name="invoiceBankName" defaultValue={s.invoiceBankName} className={input} />
            </div>
            <div>
              <label className={label}>Account name</label>
              <input name="invoiceBankAccountName" defaultValue={s.invoiceBankAccountName} className={input} />
            </div>
            <div>
              <label className={label}>Account number</label>
              <input name="invoiceBankAccountNumber" defaultValue={s.invoiceBankAccountNumber} className={input} />
            </div>
            <div>
              <label className={label}>Branch code</label>
              <input name="invoiceBankBranchCode" defaultValue={s.invoiceBankBranchCode} className={input} />
            </div>
            <div>
              <label className={label}>Account type</label>
              <input name="invoiceBankAccountType" defaultValue={s.invoiceBankAccountType} className={input} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <label className={label}>Default invoice notes / payment terms</label>
          <textarea name="invoiceDefaultNotes" rows={2} defaultValue={s.invoiceDefaultNotes} className={input} />
        </div>

        <Button type="submit" size="lg">Save business details</Button>
      </form>
    </div>
  );
}
