import type { SiteSettings } from "@/lib/settings";

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number; // cents
};

export type CompanyDetails = {
  name: string;
  regNo: string;
  vatNo: string;
  address: string;
  email: string;
  phone: string;
};

export type BankDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
};

/** Compute money totals (in cents) for a set of line items + tax %. */
export function computeTotals(lines: InvoiceLine[], taxRate: number) {
  const subtotal = lines.reduce(
    (n, l) => n + Math.round(l.unitPrice) * (Number(l.quantity) || 0),
    0
  );
  const taxAmount = Math.round((subtotal * (Number(taxRate) || 0)) / 100);
  return { subtotal, taxAmount, total: subtotal + taxAmount };
}

/** Pull the current business + banking details out of site settings. */
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

export function bankFromSettings(s: SiteSettings): BankDetails {
  return {
    bankName: s.invoiceBankName,
    accountName: s.invoiceBankAccountName,
    accountNumber: s.invoiceBankAccountNumber,
    branchCode: s.invoiceBankBranchCode,
    accountType: s.invoiceBankAccountType,
  };
}

export function parseLines(raw: string | null | undefined): InvoiceLine[] {
  try {
    const arr = JSON.parse(raw || "[]");
    if (!Array.isArray(arr)) return [];
    return arr
      .map((l) => ({
        description: String(l.description ?? "").trim(),
        quantity: Number(l.quantity) || 0,
        unitPrice: Math.round(Number(l.unitPrice) || 0),
      }))
      .filter((l) => l.description && l.quantity > 0);
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
