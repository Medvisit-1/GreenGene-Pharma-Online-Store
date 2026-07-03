import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { InvoiceForm } from "@/components/admin/invoice-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New invoice" };

export default async function NewInvoicePage() {
  const [s, savedCustomers] = await Promise.all([
    getSettings(),
    prisma.customer.findMany({ orderBy: { name: "asc" }, take: 500 }),
  ]);
  const customers = savedCustomers.map((c) => ({
    name: c.name ?? "",
    email: c.email,
    address: c.address ?? "",
  }));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Link href="/admin/invoices" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to invoices
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your business &amp; banking details are added automatically — edit them on the Invoices page.
        </p>
      </div>
      <InvoiceForm defaultTaxRate={s.invoiceDefaultTaxRate} today={today} customers={customers} />
    </div>
  );
}
