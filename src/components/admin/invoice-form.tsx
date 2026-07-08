"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createInvoice } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

const input =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

type Line = { description: string; quantity: string; unitPrice: string };
export type SavedCustomer = { name: string; email: string; address: string };
export type ShopProduct = { name: string; price: number }; // price in cents

const TERMS: { value: string; label: string; days: number | null }[] = [
  { value: "receipt", label: "Due on receipt", days: 0 },
  { value: "net7", label: "Net 7 days", days: 7 },
  { value: "net14", label: "Net 14 days", days: 14 },
  { value: "net30", label: "Net 30 days", days: 30 },
  { value: "net60", label: "Net 60 days", days: 60 },
  { value: "custom", label: "Custom date", days: null },
];

/** Add n days to a "YYYY-MM-DD" string, TZ-safe. */
function addDays(dateStr: string, n: number): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

export function InvoiceForm({
  defaultTaxRate,
  defaultPaymentTerms,
  today,
  customers = [],
  products = [],
}: {
  defaultTaxRate: string;
  defaultPaymentTerms: string;
  today: string;
  customers?: SavedCustomer[];
  products?: ShopProduct[];
}) {
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const defRate = parseFloat(defaultTaxRate) || 0;
  const [vatOn, setVatOn] = useState(defRate > 0);
  const [taxRate, setTaxRate] = useState(defRate > 0 ? defaultTaxRate : "15");
  const [cust, setCust] = useState<SavedCustomer>({ name: "", email: "", address: "" });

  const initialTerm = TERMS.find((t) => t.label === defaultPaymentTerms) ?? TERMS[0];
  const [issueDate, setIssueDate] = useState(today);
  const [termValue, setTermValue] = useState(initialTerm.value);
  const [dueDate, setDueDate] = useState(
    initialTerm.days != null ? addDays(today, initialTerm.days) : ""
  );
  const currentTerm = TERMS.find((t) => t.value === termValue) ?? TERMS[0];
  const isCustom = currentTerm.value === "custom";
  const onTermChange = (v: string) => {
    setTermValue(v);
    const t = TERMS.find((x) => x.value === v)!;
    if (t.days != null) setDueDate(addDays(issueDate, t.days));
  };
  const onIssueChange = (v: string) => {
    setIssueDate(v);
    if (currentTerm.days != null) setDueDate(addDays(v, currentTerm.days));
  };

  const pickCustomer = (email: string) => {
    const c = customers.find((x) => x.email === email);
    if (c) setCust({ name: c.name, email: c.email, address: c.address });
  };

  const cents = (v: string) => Math.round((parseFloat(v) || 0) * 100);
  const lineTotal = (l: Line) => cents(l.unitPrice) * (parseInt(l.quantity, 10) || 0);
  const subtotal = lines.reduce((n, l) => n + lineTotal(l), 0);
  const effRate = vatOn ? parseFloat(taxRate) || 0 : 0;
  const taxAmount = Math.round((subtotal * effRate) / 100);
  const total = subtotal + taxAmount;

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  // Picking/typing a product name auto-fills its price (still editable after)
  const onDescChange = (i: number, val: string) => {
    const p = products.find((pr) => pr.name === val);
    setLine(i, p ? { description: val, unitPrice: (p.price / 100).toFixed(2) } : { description: val });
  };
  const addLine = () =>
    setLines((ls) => [...ls, { description: "", quantity: "1", unitPrice: "" }]);
  const removeLine = (i: number) =>
    setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  // Serialised for the server action (prices in cents)
  const itemsJson = JSON.stringify(
    lines
      .filter((l) => l.description.trim() && (parseInt(l.quantity, 10) || 0) > 0)
      .map((l) => ({
        description: l.description.trim(),
        quantity: parseInt(l.quantity, 10) || 0,
        unitPrice: cents(l.unitPrice),
      }))
  );

  return (
    <form action={createInvoice} className="space-y-5">
      <input type="hidden" name="items" value={itemsJson} />
      <input type="hidden" name="taxRate" value={String(effRate)} />
      {products.length > 0 && (
        <datalist id="invoice-products">
          {products.map((p) => (
            <option key={p.name} value={p.name} />
          ))}
        </datalist>
      )}

      {/* Customer */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-bold">Bill to</h2>
        {customers.length > 0 && (
          <div className="mb-4">
            <label className={label}>Use a saved customer</label>
            <select
              defaultValue=""
              onChange={(e) => pickCustomer(e.target.value)}
              className={input}
            >
              <option value="">— New customer / type below —</option>
              {customers.map((c) => (
                <option key={c.email} value={c.email}>
                  {c.name ? `${c.name} · ${c.email}` : c.email}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Customer name *</label>
            <input
              name="customerName"
              required
              value={cust.name}
              onChange={(e) => setCust((c) => ({ ...c, name: e.target.value }))}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Customer email *</label>
            <input
              name="customerEmail"
              type="email"
              required
              value={cust.email}
              onChange={(e) => setCust((c) => ({ ...c, email: e.target.value }))}
              className={input}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Customer address (optional)</label>
            <input
              name="customerAddress"
              value={cust.address}
              onChange={(e) => setCust((c) => ({ ...c, address: e.target.value }))}
              className={input}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label}>Issue date</label>
            <input
              name="issueDate"
              type="date"
              value={issueDate}
              onChange={(e) => onIssueChange(e.target.value)}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Payment terms</label>
            <select value={termValue} onChange={(e) => onTermChange(e.target.value)} className={input}>
              {TERMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input type="hidden" name="paymentTerms" value={isCustom ? "" : currentTerm.label} />
          </div>
          <div>
            <label className={label}>Due date {isCustom ? "" : "(auto)"}</label>
            <input
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              readOnly={!isCustom}
              className={`${input} ${!isCustom ? "bg-muted/50 text-muted-foreground" : ""}`}
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-bold">Items</h2>
        <div className="hidden gap-3 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[1fr_80px_120px_120px_36px]">
          <span>Description</span><span>Qty</span><span>Unit price (R)</span><span className="text-right">Amount</span><span />
        </div>
        <div className="space-y-3">
          {lines.map((l, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_80px_120px_120px_36px] sm:items-center">
              <input
                placeholder="Pick a product or type a custom item"
                list="invoice-products"
                value={l.description}
                onChange={(e) => onDescChange(i, e.target.value)}
                className={input}
              />
              <input
                inputMode="numeric"
                value={l.quantity}
                onChange={(e) => setLine(i, { quantity: e.target.value })}
                className={input}
              />
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={l.unitPrice}
                onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                className={input}
              />
              <div className="px-1 text-right text-sm font-medium tabular-nums">
                {formatPrice(lineTotal(l))}
              </div>
              <button
                type="button"
                onClick={() => removeLine(i)}
                className="justify-self-end rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                title="Remove line"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> Add item
        </button>

        {/* Tax / VAT */}
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
          <label className="flex cursor-pointer items-center gap-2.5">
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                checked={vatOn}
                onChange={(e) => setVatOn(e.target.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-5" />
            </span>
            <span className="text-sm font-medium">Charge VAT / Tax</span>
          </label>
          {vatOn && (
            <>
              <div className="flex items-center gap-1">
                <input
                  inputMode="decimal"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-20 rounded-lg border border-border bg-white px-3 py-1.5 text-center text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <button type="button" onClick={() => setTaxRate("15")} className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted">
                15%
              </button>
              <span className="ml-auto text-xs text-muted-foreground">SA VAT is 15%</span>
            </>
          )}
        </div>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-muted-foreground">Subtotal</td>
                <td className="py-1 text-right tabular-nums">{formatPrice(subtotal)}</td>
              </tr>
              {effRate > 0 && (
                <tr>
                  <td className="py-1 text-muted-foreground">VAT ({effRate}%)</td>
                  <td className="py-1 text-right tabular-nums">{formatPrice(taxAmount)}</td>
                </tr>
              )}
              <tr className="border-t border-border">
                <td className="py-2 font-bold">Total</td>
                <td className="py-2 text-right text-base font-bold tabular-nums">{formatPrice(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <label className={label}>Notes / payment terms</label>
        <textarea name="notes" rows={3} className={input} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" size="lg">Create invoice</Button>
      </div>
    </form>
  );
}
