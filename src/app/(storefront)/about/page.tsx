import Link from "next/link";
import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { businessIdentity } from "@/lib/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "GreenGene Pharma is a registered South African company, formulating supplements with natural, plant-based ingredients, made in SAHPRA-approved facilities.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const s = await getSettings();
  const id = businessIdentity(s);
  const tel = s.contactPhone?.replace(/[^\d+]/g, "");
  const sections = [
    {
      h: "Who we are",
      p: [
        `${id.legalName} is a South African registered company. We formulate supplements with natural, plant-based ingredients, including phytoestrogens, and sell them through this online store.`,
        "Every order is shipped from South Africa to customers across the country.",
      ],
    },
    {
      h: "How we make our products",
      p: [
        "Our products are made in South Africa, in facilities approved by SAHPRA, the South African Health Products Regulatory Authority.",
        "Our manufacturing partners help keep batch and expiry records for what we sell.",
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">About Us</h1>
      <p className="mt-4 text-lg leading-relaxed text-foreground/85">
        GreenGene Pharma is a registered South African company, formulating supplements with natural, plant-based
        ingredients, including phytoestrogens. Every product is made in facilities approved by SAHPRA, the South
        African Health Products Regulatory Authority, and shipped from South Africa to customers across the country.
      </p>

      {sections.map((x) => (
        <section key={x.h} className="mt-10">
          <h2 className="text-xl font-semibold text-brand-800">{x.h}</h2>
          {x.p.map((t) => (
            <p key={t} className="mt-3 leading-relaxed text-foreground/80">{t}</p>
          ))}
        </section>
      ))}

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-brand-800">A note on our products</h2>
        <p className="mt-3 rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground/80">
          {s.productDisclaimer}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold text-brand-800">Contact</h2>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-brand-600" aria-hidden="true" /><a className="underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></li>
          {s.contactPhone && (
            <li className="flex items-center gap-3"><Phone className="h-5 w-5 text-brand-600" aria-hidden="true" />{tel ? <a className="underline" href={`tel:${tel}`}>{s.contactPhone}</a> : s.contactPhone}</li>
          )}
          <li className="flex items-center gap-3"><MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />Online, South Africa</li>
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">
          Questions? See our <Link href="/faqs" className="font-semibold text-brand-700 underline">FAQs</Link> or{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline">send us a message</Link>.
        </p>
      </section>
    </div>
  );
}
