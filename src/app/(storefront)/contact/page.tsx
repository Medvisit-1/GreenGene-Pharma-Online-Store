import type { Metadata } from "next";
import { Mail, MapPin, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/contact-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the GreenGene Pharma team.",
};

export default async function ContactPage() {
  const s = await getSettings();
  const cards = [
    { icon: Mail, title: "Email us", lines: [s.contactEmail] },
    { icon: MapPin, title: "Visit us", lines: [s.contactAddress] },
    { icon: Clock, title: "Hours", lines: s.contactHours.split(" · ") },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Contact Us</h1>
        <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
          Questions about a product, an order, or your health? Our friendly team is here to help.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-4">
          {cards.map((c) => (
            <div key={c.title} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
              <div className="rounded-xl bg-brand-50 p-3 text-brand-600">
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{c.title}</p>
                {c.lines.map((l) => (
                  <p key={l} className="text-sm text-muted-foreground">{l}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
