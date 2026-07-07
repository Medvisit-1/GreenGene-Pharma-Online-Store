"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { type WholesaleTier, discountedUnit, tierRange } from "@/lib/wholesale";

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

/**
 * Editable Unit cost (admin determined) + RRP, plus a live preview of the
 * wholesale price at each volume tier (calculated by deducting the tier %
 * from the unit cost).
 */
export function WholesalePricingFields({
  initialUnitCost,
  initialRrp,
  tiers,
}: {
  initialUnitCost: string; // rands, e.g. "100.00" or ""
  initialRrp: string;
  tiers: WholesaleTier[];
}) {
  const [unitCost, setUnitCost] = useState(initialUnitCost);
  const cents = Math.round((parseFloat(unitCost) || 0) * 100);

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="mb-1 font-bold">Wholesale pricing</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        The unit cost is the base price GreenGene sets. On a wholesale quotation, the customer&apos;s
        price is calculated by deducting the volume tier discount from this unit cost. The
        recommended retail price is shown to resellers as guidance.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Unit cost — admin determined (R)</label>
          <input
            name="unitCost"
            inputMode="decimal"
            placeholder="0.00"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
            className={input}
          />
        </div>
        <div>
          <label className={label}>Recommended retail price (R)</label>
          <input name="rrp" inputMode="decimal" placeholder="0.00" defaultValue={initialRrp} className={input} />
        </div>
      </div>

      {tiers.length > 0 && (
        <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
          <div className="mb-2 text-sm font-semibold text-brand-800">
            Wholesale price by volume {cents > 0 ? "" : "(enter a unit cost to preview)"}
          </div>
          <div className="flex flex-wrap gap-3">
            {tiers.map((t, i) => (
              <div key={i} className="rounded-lg border border-brand-200 bg-white px-4 py-2 text-center">
                <div className="text-xs font-medium text-muted-foreground">{tierRange(t)}</div>
                <div className="text-lg font-bold text-brand-700">
                  {cents > 0 ? formatPrice(discountedUnit(cents, t.minQty, tiers)) : "—"}
                </div>
                <div className="text-[11px] text-brand-600">−{t.discountPercent}% off cost</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
