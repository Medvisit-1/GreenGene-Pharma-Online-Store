"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createQuotation } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import {
  type WholesaleTier,
  type QuoteLine,
  computeLine,
  quoteSubtotal,
  tierForQty,
  tierRange,
} from "@/lib/wholesale";

const input =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

type Line = { name: string; quantity: string; unitCost: string; rrp: string };
export type SavedCustomer = { name: string; email: string; address: string };
export type WholesaleProduct = { name: string; unitCost: number; rrp: number | null }; // cents

export function WholesaleQuoteForm({
  today,
  tiers,
  customers = [],
  products = [],
}: {
  today: string;
  tiers: WholesaleTier[];
  customers?: SavedCustomer[];
  products?: WholesaleProduct[];
}) {
  const [lines, setLines] = useState<Line[]>([
    { name: "", quantity: "1", unitCost: "", rrp: "" },
  ]);
  const [cust, setCust] = useState({ name: "", company: "", email: "", address: "" });
  const [bonusBuy, setBonusBuy] = useState("");
  const [bonusFree, setBonusFree] = useState("");

  const cents = (v: string) => Math.round((parseFloat(v) || 0) * 100);
  const qtyOf = (l: Line) => parseInt(l.quantity, 10) || 0;

  const priced: QuoteLine[] = lines
    .filter((l) => l.name.trim() && qtyOf(l) > 0)
    .map((l) =>
      computeLine(
        { name: l.name.trim(), basePrice: cents(l.unitCost), rrp: l.rrp ? cents(l.rrp) : null, quantity: qtyOf(l) },
        tiers
      )
    );
  const subtotal = quoteSubtotal(priced);

  const setLine = (i: number, patch: Partial<Line>) =>
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  // Picking/typing a product name auto-fills its wholesale cost + RRP (still editable)
  const onNameChange = (i: number, val: string) => {
    const p = products.find((pr) => pr.name === val);
    setLine(
      i,
      p
        ? {
            name: val,
            unitCost: (p.unitCost / 100).toFixed(2),
            rrp: p.rrp != null ? (p.rrp / 100).toFixed(2) : "",
          }
        : { name: val }
    );
  };
  const addLine = () =>
    setLines((ls) => [...ls, { name: "", quantity: "1", unitCost: "", rrp: "" }]);
  const removeLine = (i: number) =>
    setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const pickCustomer = (email: string) => {
    const c = customers.find((x) => x.email === email);
    if (c) setCust((prev) => ({ ...prev, name: c.name, email: c.email, address: c.address }));
  };

  // Per-line derived values for the live table
  const rowInfo = (l: Line) => {
    const q = qtyOf(l);
    const base = cents(l.unitCost);
    const tier = tierForQty(q, tiers);
    const unit = q > 0 ? computeLine({ name: l.name, basePrice: base, quantity: q }, tiers).unitPrice : base;
    return { q, unit, pct: tier.discountPercent, amount: unit * q };
  };

  const itemsJson = JSON.stringify(priced);

  return (
    <form action={createQuotation} className="space-y-5">
      <input type="hidden" name="items" value={itemsJson} />
      {products.length > 0 && (
        <datalist id="wholesale-products">
          {products.map((p) => (
            <option key={p.name} value={p.name} />
          ))}
        </datalist>
      )}

      {/* Customer */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-4 font-bold">Wholesale customer</h2>
        {customers.length > 0 && (
          <div className="mb-4">
            <label className={label}>Use a saved customer</label>
            <select defaultValue="" onChange={(e) => pickCustomer(e.target.value)} className={input}>
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
            <label className={label}>Contact name *</label>
            <input
              name="customerName"
              required
              value={cust.name}
              onChange={(e) => setCust((c) => ({ ...c, name: e.target.value }))}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Business / company name</label>
            <input
              name="customerCompany"
              value={cust.company}
              onChange={(e) => setCust((c) => ({ ...c, company: e.target.value }))}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Email *</label>
            <input
              name="customerEmail"
              type="email"
              required
              value={cust.email}
              onChange={(e) => setCust((c) => ({ ...c, email: e.target.value }))}
              className={input}
            />
          </div>
          <div>
            <label className={label}>Address (optional)</label>
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
            <label className={label}>Valid until (optional)</label>
            <input name="validUntil" type="date" className={input} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-1 font-bold">Products</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Pick a product to auto-fill its unit cost &amp; RRP, then set the quantity — the wholesale
          price (unit cost minus the volume discount) is calculated automatically.
        </p>
        <div className="hidden gap-3 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid lg:grid-cols-[1fr_70px_110px_110px_150px_36px]">
          <span>Product</span>
          <span>Qty</span>
          <span>Unit cost (R)</span>
          <span>RRP (R)</span>
          <span className="text-right">Wholesale / Amount</span>
          <span />
        </div>
        <div className="space-y-3">
          {lines.map((l, i) => {
            const info = rowInfo(l);
            return (
              <div key={i} className="grid gap-2 lg:grid-cols-[1fr_70px_110px_110px_150px_36px] lg:items-center">
                <input
                  placeholder="Pick a product or type a custom item"
                  list="wholesale-products"
                  value={l.name}
                  onChange={(e) => onNameChange(i, e.target.value)}
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
                  value={l.unitCost}
                  onChange={(e) => setLine(i, { unitCost: e.target.value })}
                  className={input}
                />
                <input
                  inputMode="decimal"
                  placeholder="0.00"
                  value={l.rrp}
                  onChange={(e) => setLine(i, { rrp: e.target.value })}
                  className={input}
                />
                <div className="px-1 text-right text-sm tabular-nums">
                  <div className="font-medium">
                    {formatPrice(info.unit)}
                    {info.pct > 0 && info.q > 0 && (
                      <span className="ml-1 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                        −{info.pct}%
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatPrice(info.amount)}</div>
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
            );
          })}
        </div>
        <button
          type="button"
          onClick={addLine}
          className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <table className="w-full max-w-xs text-sm">
            <tbody>
              <tr className="border-t border-border">
                <td className="py-2 font-bold">Order total</td>
                <td className="py-2 text-right text-base font-bold tabular-nums">{formatPrice(subtotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus offer */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="mb-1 font-bold">Bonus offer</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Optional free-stock incentive shown on the quotation, e.g. “Buy 100, get 10 free”. Leave at
          zero to hide it.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className={label}>Buy (units)</label>
            <input
              name="bonusBuyQty"
              inputMode="numeric"
              placeholder="0"
              value={bonusBuy}
              onChange={(e) => setBonusBuy(e.target.value)}
              className="w-32 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className={label}>Get free (units)</label>
            <input
              name="bonusFreeQty"
              inputMode="numeric"
              placeholder="0"
              value={bonusFree}
              onChange={(e) => setBonusFree(e.target.value)}
              className="w-32 rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          {(parseInt(bonusBuy, 10) || 0) > 0 && (parseInt(bonusFree, 10) || 0) > 0 && (
            <div className="rounded-xl bg-accent/15 px-4 py-2.5 text-sm font-semibold text-brand-800">
              🎁 Buy {parseInt(bonusBuy, 10)}, get {parseInt(bonusFree, 10)} free
            </div>
          )}
        </div>
      </div>

      {/* Tier reference */}
      <div className="rounded-2xl border border-border bg-brand-50/60 p-6">
        <h2 className="mb-1 font-bold text-brand-800">Volume discount tiers</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          This table is included on the quotation so customers can see how ordering more lowers
          their per-unit cost. Edit the percentages on the Wholesale page.
        </p>
        <div className="flex flex-wrap gap-3">
          {tiers.map((t, i) => (
            <div key={i} className="rounded-xl border border-brand-200 bg-white px-4 py-3 text-center">
              <div className="text-sm font-semibold text-brand-800">{tierRange(t)}</div>
              <div className="text-2xl font-bold text-brand-600">{t.discountPercent}%</div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">off unit cost</div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <label className={label}>Notes / terms (optional)</label>
        <textarea name="notes" rows={3} className={input} />
      </div>

      <Button type="submit" size="lg">Create quotation</Button>
    </form>
  );
}
