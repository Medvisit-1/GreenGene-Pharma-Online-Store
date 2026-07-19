import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/admin/product-form";
import { getSettings } from "@/lib/settings";
import { tiersFromSettings } from "@/lib/wholesale";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProduct({
  searchParams,
}: {
  searchParams: Promise<{ combo?: string }>;
}) {
  const { combo } = await searchParams;
  const isCombo = combo === "1";
  const [categories, s] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    getSettings(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {isCombo ? "Create a combo" : "Add product"}
      </h1>
      {isCombo && (
        <p className="-mt-4 text-sm text-muted-foreground">
          A combo is a normal product that appears under the <strong>Combos</strong> section —
          same fields, the &ldquo;Combo product&rdquo; box is already ticked for you.
        </p>
      )}
      <ProductForm
        categories={categories}
        wholesaleTiers={tiersFromSettings(s)}
        defaultCombo={isCombo}
      />
    </div>
  );
}
