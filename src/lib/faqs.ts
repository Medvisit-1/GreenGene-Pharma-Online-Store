import "server-only";
import type { Faq } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SiteSettings } from "@/lib/settings";
import { formatPrice, slugify } from "@/lib/utils";
import { parseFaqs } from "@/lib/product-info";
import { ensureBundledInfoPacks } from "@/lib/info-packs";
import { GENERAL_FAQS, GENERIC_QUESTION, HEALTH_ANSWER_V1, HEALTH_ANSWER_V2, PRODUCT_FAQS, productFaqLabel } from "@/lib/faq-content";

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
  // One-time: add the download links to the health answer, unless the admin has reworded it
  await prisma.faq.updateMany({ where: { answer: HEALTH_ANSWER_V1 }, data: { answer: HEALTH_ANSWER_V2 } });
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

export type InfoPack = { label: string; url: string };

/** Every active product with a downloadable information pack. */
export async function infoPacks(): Promise<InfoPack[]> {
  await ensureBundledInfoPacks(); // the Estrogene leaflet may not be attached yet on a fresh deploy
  const products = await prisma.product.findMany({
    where: { active: true, infoPackUrl: { not: null } },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    select: { name: true, infoPackUrl: true },
  });
  return products.map((p) => ({ label: productFaqLabel(p.name) ?? p.name.split(/ [-—–(]/)[0].trim(), url: p.infoPackUrl! }));
}

function packLinks(packs: InfoPack[]) {
  if (!packs.length) return "";
  const links = packs.map((p) => `[${p.label} information pack](${p.url})`);
  return packs.length === 1
    ? `You can also download the ${links[0]} right away.`
    : `You can also download these right away: ${links.join(", ")}.`;
}

/** Replace {contact_email}, {delivery_fee}, {free_delivery_from} and {info_pack_links} with live values. */
export function fillTokens(text: string, s: SiteSettings, packs: InfoPack[] = []) {
  const flat = parseInt(s.shippingFlat, 10) || 0;
  const free = parseInt(s.freeShippingThreshold, 10) || 0;
  return text
    .replace(/\{contact_email\}/g, s.contactEmail)
    .replace(/\{delivery_fee\}/g, flat ? formatPrice(flat) : "nothing")
    .replace(/\{free_delivery_from\}/g, free ? formatPrice(free) : formatPrice(0))
    .replace(/\s*\{info_pack_links\}/g, () => (packs.length ? ` ${packLinks(packs)}` : ""));
}
