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

export function InvoiceForm({
  defaultTaxRate,
  today,
  customers = [],
}: {
  defaultTaxRate: string;
  today: string;
  customers?: SavedCustomer[];
}) {
  const [lines, setLines] = useState<Line[]>([
    { description: "", quantity: "1", unitPrice: "" },
  ]);
  const [taxRate, setTaxRate] = useState(defaultTaxRate || "0");
  const [cust, setCust] = useState<SavedCustomer>({ name: "", email: "", address: "" });

  const pickCustomer = (email: string) => {
    const c = customers.find((x) => x.email === email);
    if (c) setCust({ name: c.name, email: c.email, address: c.address });
  };

  const cents = (v: string) => Math.round((parseFloat(v) || 0) * 100);
  const lineTotal = (l: Line) => cents(l.unitPrice) * (parseInt(l.quantity, 10) || 0);
  const subtotal = lines.reduce((n, l) => n + lineTotal(l), 0);
  const taxAmount = Math.round((subtotal * (parseFloat(taxRate) || 0)) / 100);
  const total = subtotal + taxAmount;

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
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
      <input type="hidden" name="taxRate" value={taxRate} />

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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Issue date</label>
            <input name="issueDate" type="date" defaultValue={today} className={input} />
          </div>
          <div>
            <label className={label}>Due date (optional)</label>
            <input name="dueDate" type="date" className={input} />
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
                placeholder="Item description"
                value={l.description}
                onChange={(e) => setLine(i, { description: e.target.value })}
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

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr>
                <td className="py-1 text-muted-foreground">Subtotal</td>
                <td className="py-1 text-right tabular-nums">{formatPrice(subtotal)}</td>
              </tr>
              <tr>
                <td className="py-1 text-muted-foreground">
                  VAT
                  <input
                    inputMode="numeric"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="mx-1 w-12 rounded-md border border-border px-1.5 py-0.5 text-center text-xs"
                  />
                  %
                </td>
                <td className="py-1 text-right tabular-nums">{formatPrice(taxAmount)}</td>
              </tr>
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
