import type { SiteSettings } from "@/lib/settings";

/** A quantity band and the discount applied to the wholesale base unit cost. */
export type WholesaleTier = {
  minQty: number;
  maxQty: number | null; // null = no upper bound
  discountPercent: number;
};

export type QuoteLine = {
  name: string;
  quantity: number;
  tierPercent: number; // discount applied to this line
  basePrice: number; // wholesale base unit cost, cents
  unitPrice: number; // discounted unit cost, cents
  rrp: number | null; // recommended retail price, cents
};

export type CompanyDetails = {
  name: string;
  regNo: string;
  vatNo: string;
  address: string;
  email: string;
  phone: string;
};

const int = (v: string | number | undefined, fallback = 0) => {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
};

/** Build the ordered tier table from site settings. */
export function tiersFromSettings(s: SiteSettings): WholesaleTier[] {
  const t1Max = Math.max(1, int(s.wholesaleTier1Max, 50));
  const t2Max = Math.max(t1Max + 1, int(s.wholesaleTier2Max, 100));
  return [
    { minQty: 1, maxQty: t1Max, discountPercent: int(s.wholesaleTier1Pct, 10) },
    { minQty: t1Max + 1, maxQty: t2Max, discountPercent: int(s.wholesaleTier2Pct, 15) },
    { minQty: t2Max + 1, maxQty: null, discountPercent: int(s.wholesaleTier3Pct, 30) },
  ];
}

/** Human label for a tier's quantity band, e.g. "1–50 units" or "201+ units". */
export function tierRange(t: WholesaleTier): string {
  return t.maxQty === null ? `${t.minQty}+ units` : `${t.minQty}–${t.maxQty} units`;
}

/** Find the tier a given quantity falls into. */
export function tierForQty(qty: number, tiers: WholesaleTier[]): WholesaleTier {
  const q = Math.max(0, Math.floor(qty || 0));
  return (
    tiers.find((t) => q >= t.minQty && (t.maxQty === null || q <= t.maxQty)) ??
    tiers[tiers.length - 1]
  );
}

/** Discounted unit cost (cents) for a base price + quantity, rounded to the nearest cent. */
export function discountedUnit(base: number, qty: number, tiers: WholesaleTier[]): number {
  const pct = tierForQty(qty, tiers).discountPercent;
  return Math.round((Math.round(base) * (100 - pct)) / 100);
}

/** Compute a single priced quote line from a product's base cost + quantity. */
export function computeLine(
  input: { name: string; basePrice: number; rrp?: number | null; quantity: number },
  tiers: WholesaleTier[]
): QuoteLine {
  const quantity = Math.max(0, Math.floor(input.quantity || 0));
  const tier = tierForQty(quantity, tiers);
  return {
    name: input.name,
    quantity,
    tierPercent: tier.discountPercent,
    basePrice: Math.round(input.basePrice) || 0,
    unitPrice: discountedUnit(input.basePrice, quantity, tiers),
    rrp: input.rrp != null ? Math.round(input.rrp) : null,
  };
}

/** Subtotal (cents) across priced lines. */
export function quoteSubtotal(lines: QuoteLine[]): number {
  return lines.reduce((n, l) => n + Math.round(l.unitPrice) * (Number(l.quantity) || 0), 0);
}

export function companyFromSettings(s: SiteSettings): CompanyDetails {
  return {
    name: s.invoiceCompanyName,
    regNo: s.invoiceRegNo,
    vatNo: s.invoiceVatNo,
    address: s.invoiceCompanyAddress,
    email: s.invoiceCompanyEmail,
    phone: s.invoiceCompanyPhone,
  };
}

export function parseQuoteLines(raw: string | null | undefined): QuoteLine[] {
  try {
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .map((l) => ({
        name: String(l.name ?? "").trim(),
        quantity: Number(l.quantity) || 0,
        tierPercent: Number(l.tierPercent) || 0,
        basePrice: Math.round(Number(l.basePrice) || 0),
        unitPrice: Math.round(Number(l.unitPrice) || 0),
        rrp: l.rrp != null ? Math.round(Number(l.rrp) || 0) : null,
      }))
      .filter((l) => l.name && l.quantity > 0);
  } catch {
    return [];
  }
}

export function parseTierTable(raw: string | null | undefined): WholesaleTier[] {
  try {
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.map((t) => ({
      minQty: Number(t.minQty) || 0,
      maxQty: t.maxQty == null ? null : Number(t.maxQty),
      discountPercent: Number(t.discountPercent) || 0,
    }));
  } catch {
    return [];
  }
}

export function safeJson<T>(raw: string | null | undefined, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
