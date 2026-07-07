import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { getSettings } from "@/lib/settings";
import { tiersFromSettings } from "@/lib/wholesale";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProduct() {
  const [categories, s] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getSettings(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add product</h1>
      <ProductForm categories={categories} wholesaleTiers={tiersFromSettings(s)} />
    </div>
  );
}
