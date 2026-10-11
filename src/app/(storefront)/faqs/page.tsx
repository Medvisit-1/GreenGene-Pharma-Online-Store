import { CircleHelp } from "lucide-react";
import { faqSections, fillTokens } from "@/lib/faqs";
import { getSettings } from "@/lib/settings";
import { FaqBrowser, type FaqGroup } from "@/components/faq-browser";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Frequently asked questions",
  description: "Answers about ordering, delivery, payment, returns, your account and our natural health products.",
};

export default async function FaqsPage() {
  const [sections, settings] = await Promise.all([faqSections(), getSettings()]);
  const groups: FaqGroup[] = sections.map((s) => ({
    name: s.name,
    anchor: s.anchor,
    faqs: s.faqs.map((f) => ({ id: f.id, q: f.question, a: fillTokens(f.answer, settings) })),
  }));

  // Lets Google show these questions in search results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") },
      }))
    ),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="mb-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <CircleHelp className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Frequently asked questions</h1>
        <p className="mt-2 text-muted-foreground">Ordering, delivery, returns, your account and our products — answered.</p>
      </header>
      <FaqBrowser groups={groups} contactEmail={settings.contactEmail} />
    </div>
  );
}
