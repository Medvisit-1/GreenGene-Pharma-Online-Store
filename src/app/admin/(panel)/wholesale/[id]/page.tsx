import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { getSettings } from "@/lib/settings";
import { setQuotationStatus, sendQuotation, deleteQuotation } from "@/app/admin/actions";
import { PrintButton } from "@/components/admin/print-button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import {
  parseQuoteLines,
  parseTierTable,
  safeJson,
  tierRange,
  type CompanyDetails,
} from "@/lib/wholesale";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-amber-100 text-amber-700",
  accepted: "bg-brand-100 text-brand-700",
  declined: "bg-red-100 text-red-700",
};

function StatusButton({
  id,
  status,
  current,
  children,
}: {
  id: string;
  status: string;
  current: string;
  children: React.ReactNode;
}) {
  const active = current === status;
  return (
    <form action={setQuotationStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
          active ? "border-brand-600 bg-brand-50 text-brand-700" : "border-border hover:bg-muted"
        }`}
      >
        {children}
      </button>
    </form>
  );
}

export default async function QuotationView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; senterror?: string }>;
}) {
  const { id } = await params;
  const { sent, senterror } = await searchParams;
  const [q, s] = await Promise.all([
    prisma.quotation.findUnique({ where: { id } }),
    getSettings(),
  ]);
  if (!q) notFound();
  const rrpMarginPct = parseInt(s.wholesaleRrpMarginPct, 10) || 20;

  const items = parseQuoteLines(q.items);
  const tiers = parseTierTable(q.tierTable);
  const company = safeJson<CompanyDetails>(q.companyDetails, {} as CompanyDetails);
  const companyName = company.name || "GreenGene Pharma";

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <Link href="/admin/wholesale" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" /> Back to wholesale
        </Link>
      </div>

      {sent && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 print:hidden">
          <CheckCircle2 className="h-4 w-4" /> Quotation emailed to {q.customerEmail}.
        </p>
      )}
      {senterror && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 print:hidden">
          <AlertTriangle className="h-4 w-4" /> Could not send the email. Check the customer email and try again.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <form action={sendQuotation}>
          <input type="hidden" name="id" value={q.id} />
          <button className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            <Send className="h-4 w-4" /> {q.sentAt ? "Resend to customer" : "Send to customer"}
          </button>
        </form>
        <StatusButton id={q.id} status="accepted" current={q.status}>
          <CheckCircle2 className="h-4 w-4" /> Accepted
        </StatusButton>
        <StatusButton id={q.id} status="declined" current={q.status}>
          <XCircle className="h-4 w-4" /> Declined
        </StatusButton>
        <PrintButton />
        <form action={deleteQuotation} className="ml-auto">
          <input type="hidden" name="id" value={q.id} />
          <ConfirmSubmit
            message={`Delete quotation ${q.number}? This cannot be undone.`}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete
          </ConfirmSubmit>
        </form>
      </div>

      {/* Printable quotation */}
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
            <div className="text-2xl font-extrabold leading-tight tracking-tight text-brand-800">WHOLESALE</div>
            <div className="text-2xl font-extrabold leading-tight tracking-tight text-brand-800">QUOTATION</div>
            <div className="mt-1 text-muted-foreground"># {q.number}</div>
            <div className="mt-2 text-sm">Date: {new Date(q.issueDate).toLocaleDateString("en-ZA", { dateStyle: "long" })}</div>
            {q.validUntil && <div className="text-sm">Valid until: {new Date(q.validUntil).toLocaleDateString("en-ZA", { dateStyle: "long" })}</div>}
            <span className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[q.status] ?? STATUS_STYLES.draft}`}>
              {q.status}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-muted/60 p-4 text-sm">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Prepared for</div>
          <div className="font-semibold">{q.customerCompany || q.customerName}</div>
          {q.customerCompany && <div className="text-muted-foreground">{q.customerName}</div>}
          <div className="text-muted-foreground">{q.customerEmail}</div>
          {q.customerAddress && <div className="text-muted-foreground">{q.customerAddress}</div>}
        </div>

        {q.bonusBuyQty && q.bonusFreeQty ? (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
            <span className="text-2xl">🎁</span>
            <div>
              <div className="text-sm font-bold text-brand-800">Bonus offer</div>
              <div className="text-sm text-brand-700">
                Buy {q.bonusBuyQty}, get {q.bonusFreeQty} free
              </div>
            </div>
          </div>
        ) : null}

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="py-2">Product</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-center">Discount</th>
              <th className="py-2 text-right">Wholesale</th>
              <th className="py-2 text-right">RRP</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((l, idx) => (
              <tr key={idx} className="border-b border-border">
                <td className="py-2.5">{l.name}</td>
                <td className="py-2.5 text-center tabular-nums">{l.quantity}</td>
                <td className="py-2.5 text-center tabular-nums">
                  {l.tierPercent > 0 ? (
                    <span className="font-semibold text-brand-700">−{l.tierPercent}%</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2.5 text-right tabular-nums">{formatPrice(l.unitPrice)}</td>
                <td className="py-2.5 text-right tabular-nums text-muted-foreground">
                  {l.rrp != null ? formatPrice(l.rrp) : "—"}
                </td>
                <td className="py-2.5 text-right tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr className="border-t-2 border-border">
                <td className="py-2 text-base font-bold text-brand-800">Order total</td>
                <td className="py-2 text-right text-base font-bold tabular-nums text-brand-800">{formatPrice(q.subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {tiers.length > 0 && (
          <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
            <div className="mb-2 text-sm font-bold text-brand-800">Volume discount tiers</div>
            <table className="w-full text-sm">
              <tbody>
                {tiers.map((t, i) => (
                  <tr key={i} className="border-b border-brand-100 last:border-0">
                    <td className="py-1.5 text-muted-foreground">{tierRange(t)}</td>
                    <td className="py-1.5 text-right font-semibold text-brand-700">{t.discountPercent}%*</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted-foreground">
              The more units you order, the lower your per-unit cost — order into a higher tier to unlock a bigger discount.
            </p>
            <p className="mt-2 text-xs italic text-muted-foreground">
              * The discounted {rrpMarginPct}% is below the selling price on online platforms,
              exclusive of delivery costs — this gives you an idea of your profit margin / mark-up.
              RRP is suggestive but you may change it according to your market needs.
            </p>
          </div>
        )}

        {q.notes && <p className="mt-6 whitespace-pre-wrap text-sm text-muted-foreground">{q.notes}</p>}
      </div>
    </div>
  );
}
