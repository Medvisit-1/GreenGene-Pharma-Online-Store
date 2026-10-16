import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import type { Faq } from "@prisma/client";
import { faqSections } from "@/lib/faqs";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { deleteFaq, moveFaq, saveFaq } from "@/app/admin/faq-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "FAQs" };

const input = "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-400";
const label = "mb-1 block text-xs font-semibold text-muted-foreground";

export default async function AdminFaqs({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const sections = await faqSections({ includeDrafts: true });
  const names = sections.map((s) => s.name);
  const total = sections.reduce((n, s) => n + s.faqs.length, 0);
  const nextOrder = (sections.flatMap((s) => s.faqs).at(-1)?.sortOrder ?? 0) + 10;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FAQs ({total})</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The questions on your public <strong>FAQ page</strong>, grouped into sections. Product pages link to the
            section with the product&apos;s name. Keep health answers general — point people to the information pack.
          </p>
        </div>
        <Link href="/faqs" target="_blank" className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold hover:bg-muted">
          <ExternalLink className="h-4 w-4" /> View FAQ page
        </Link>
      </div>

      {msg && <p role="status" className="rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">{msg}</p>}

      <details className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm">
        <summary className="cursor-pointer font-semibold">Formatting help</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Link to a page on your site: <code>[Shipping Policy](/shipping-policy)</code></li>
          <li>Email addresses become clickable automatically.</li>
          <li>
            These fill in your live settings: <code>{"{contact_email}"}</code>, <code>{"{delivery_fee}"}</code>,{" "}
            <code>{"{free_delivery_from}"}</code>
          </li>
          <li>
            <code>{"{info_pack_links}"}</code> adds download links for every product with an information pack
            (set on each product&apos;s edit page).
          </li>
          <li>Sections appear in the order of their first question. Use the arrows to reorder questions.</li>
        </ul>
      </details>

      <datalist id="faq-sections">
        {names.map((n) => <option key={n} value={n} />)}
      </datalist>

      {sections.map((s) => (
        <section key={s.anchor} className="overflow-hidden rounded-2xl border border-border bg-surface">
          <h2 className="border-b border-border px-5 py-3 font-bold">
            {s.name} <span className="text-sm font-normal text-muted-foreground">({s.faqs.length})</span>
          </h2>
          <ul className="divide-y divide-border">
            {s.faqs.map((f, i) => (
              <li key={f.id} id={`faq-${f.id}`} className="scroll-mt-24 px-5 py-3">
                <details>
                  <summary className="flex cursor-pointer list-none items-center gap-3">
                    <span className={cn("flex-1 text-sm font-medium", !f.published && "text-muted-foreground")}>
                      {f.question}
                      {!f.published && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Hidden</span>}
                    </span>
                    <span className="text-xs font-semibold text-brand-700">Edit ▾</span>
                  </summary>
                  <FaqForm faq={f} />
                  <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3">
                    <form action={moveFaq} className="flex gap-1">
                      <input type="hidden" name="id" value={f.id} />
                      <button name="dir" value="up" disabled={i === 0} aria-label="Move up" className="rounded-lg border border-border bg-white p-1.5 disabled:opacity-40">
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button name="dir" value="down" disabled={i === s.faqs.length - 1} aria-label="Move down" className="rounded-lg border border-border bg-white p-1.5 disabled:opacity-40">
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </form>
                    <form action={deleteFaq} className="ml-auto">
                      <input type="hidden" name="id" value={f.id} />
                      <ConfirmSubmit message="Delete this question?" className="text-sm font-semibold text-red-600 hover:underline">Delete</ConfirmSubmit>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <details id="faq-new" className="rounded-2xl border border-dashed border-brand-300 bg-white px-5 py-4">
        <summary className="cursor-pointer list-none font-semibold text-brand-700">+ Add a question</summary>
        <FaqForm order={nextOrder} />
      </details>
    </div>
  );
}

function FaqForm({ faq, order }: { faq?: Faq; order?: number }) {
  return (
    <form action={saveFaq} className="mt-3 grid gap-3 sm:grid-cols-2">
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <input type="hidden" name="sortOrder" value={faq?.sortOrder ?? order ?? 0} />
      <div>
        <label className={label}>Section</label>
        <input name="section" required list="faq-sections" defaultValue={faq?.section} placeholder="e.g. Ordering & delivery, or a product name" className={input} />
      </div>
      <div className="flex items-end">
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={faq?.published ?? true} className="h-4 w-4 accent-brand-600" /> Show on the FAQ page
        </label>
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Question</label>
        <input name="question" required defaultValue={faq?.question} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Answer</label>
        <textarea name="answer" required rows={4} defaultValue={faq?.answer} className={input} />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">{faq ? "Save" : "Add question"}</Button>
      </div>
    </form>
  );
}
