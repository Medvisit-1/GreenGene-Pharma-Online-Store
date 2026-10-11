import { getSettings, type SiteSettings } from "@/lib/settings";

export type BusinessIdentity = {
  legalName: string;
  tradingName: string;
  regNo: string;
  vatNo: string;
  address: string;
  email: string;
  phone: string;
  infoOfficer: string;
  website: string;
};

/** The store's legal identity, from admin settings (Invoicing business details + Settings). */
export function businessIdentity(s: SiteSettings): BusinessIdentity {
  return {
    legalName: s.invoiceCompanyName || "GreenGene Pharma",
    tradingName: "GreenGene Pharma",
    regNo: s.invoiceRegNo,
    vatNo: s.invoiceVatNo,
    address: s.invoiceCompanyAddress || s.contactAddress,
    email: s.invoiceCompanyEmail || s.contactEmail,
    phone: s.invoiceCompanyPhone || s.contactPhone,
    infoOfficer: s.legalInfoOfficer,
    website: "www.greengenepharma.co.za",
  };
}

export async function getBusinessIdentity() {
  return businessIdentity(await getSettings());
}

/** Escape a settings value for safe use inside legal-page HTML. */
export function h(s: string) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

export const LEGAL_UPDATED = "11 October 2026";
