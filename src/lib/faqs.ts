import "server-only";
import type { Faq } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SiteSettings } from "@/lib/settings";
import { formatPrice, slugify } from "@/lib/utils";
import { parseFaqs } from "@/lib/product-info";
import { GENERAL_FAQS, GENERIC_QUESTION, PRODUCT_FAQS } from "@/lib/faq-content";

let seeded = false;

/**
 * Fill the FAQ page the first time it's needed: the general sections, then one
 * section per product in the range. If the admin already wrote FAQs on a
 * product (the old per-product field), those are kept instead of ours.
 */
export async function ensureFaqs() {
  if (seeded) return;
  if ((await prisma.faq.count()) === 0) {
    const rows: { section: string; question: string; answer: string; sortOrder: number }[] = [];
    let order = 0;
    for (const g of GENERAL_FAQS) {
      for (const [question, answer] of g.faqs) rows.push({ section: g.section, question, answer, sortOrder: order++ });
    }
    const products = await prisma.product.findMany({
      where: { active: true, isCombo: false },
      orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
      select: { name: true, faqs: true },
    });
    const done = new Set<string>();
    for (const p of products) {
      const entry = PRODUCT_FAQS.find((e) => e.match.test(p.name));
      if (!entry || done.has(entry.label)) continue;
      done.add(entry.label);
      const own = parseFaqs(p.faqs).filter((f) => !GENERIC_QUESTION.test(f.q));
      const faqs: [string, string][] = own.length ? own.map((f) => [f.q, f.a]) : entry.faqs;
      for (const [question, answer] of faqs) rows.push({ section: entry.label, question, answer, sortOrder: order++ });
    }
    await prisma.faq.createMany({ data: rows });
  }
  seeded = true;
}

export type FaqSection = { name: string; anchor: string; faqs: Faq[] };

/** FAQs grouped into sections, in the admin's order. */
export async function faqSections(opts: { includeDrafts?: boolean } = {}): Promise<FaqSection[]> {
  await ensureFaqs();
  const all = await prisma.faq.findMany({
    where: opts.includeDrafts ? undefined : { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const sections: FaqSection[] = [];
  for (const f of all) {
    let s = sections.find((x) => x.name === f.section);
    if (!s) sections.push((s = { name: f.section, anchor: slugify(f.section), faqs: [] }));
    s.faqs.push(f);
  }
  return sections;
}

/** Replace {contact_email}, {delivery_fee} and {free_delivery_from} with live values. */
export function fillTokens(text: string, s: SiteSettings) {
  const flat = parseInt(s.shippingFlat, 10) || 0;
  const free = parseInt(s.freeShippingThreshold, 10) || 0;
  return text
    .replace(/\{contact_email\}/g, s.contactEmail)
    .replace(/\{delivery_fee\}/g, flat ? formatPrice(flat) : "nothing")
    .replace(/\{free_delivery_from\}/g, free ? formatPrice(free) : formatPrice(0));
}
