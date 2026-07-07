import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { tiersFromSettings } from "@/lib/wholesale";
import { WholesaleQuoteForm } from "@/components/admin/wholesale-quote-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New wholesale quotation" };

export default async function NewQuotationPage() {
  const [s, savedCustomers, shopProducts] = await Promise.all([
    getSettings(),
    prisma.customer.findMany({ orderBy: { name: "asc" }, take: 500 }),
    prisma.product.findMany({
      where: { active: true },
      select: { name: true, price: true, wholesalePrice: true, rrp: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const customers = savedCustomers.map((c) => ({
    name: c.name ?? "",
    email: c.email,
    address: c.address ?? "",
  }));
  // Fall back to the retail price as the wholesale base when none is set yet.
  const products = shopProducts.map((p) => ({
    name: p.name,
    wholesalePrice: p.wholesalePrice ?? p.price,
    rrp: p.rrp ?? p.price,
  }));
  const tiers = tiersFromSettings(s);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <Link href="/admin/wholesale" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to wholesale
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New wholesale quotation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your business details and the discount tiers are added automatically — manage them on the
          Wholesale &amp; Invoicing pages.
        </p>
      </div>
      <WholesaleQuoteForm today={today} tiers={tiers} customers={customers} products={products} />
    </div>
  );
}
