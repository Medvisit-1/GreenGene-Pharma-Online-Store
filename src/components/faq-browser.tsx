"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = { id: string; q: string; a: string };
export type FaqGroup = { name: string; anchor: string; faqs: FaqItem[] };

/** Answer text → React: [text](/path) becomes a link to our own page, emails become mailto links. */
function Answer({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(\/[^)\s]*\)|[\w.+-]+@[\w-]+\.[\w.-]*\w)/g);
  return (
    <>
      {parts.map((p, i) => {
        const link = p.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
        if (link && /\.pdf$/i.test(link[2])) {
          return <a key={i} href={link[2]} download className="font-semibold text-brand-700 underline">{link[1]}</a>;
        }
        if (link) return <Link key={i} href={link[2]} className="font-semibold text-brand-700 underline">{link[1]}</Link>;
        if (/^[\w.+-]+@[\w-]+\.[\w.-]*\w$/.test(p)) return <a key={i} href={`mailto:${p}`} className="font-semibold text-brand-700 underline">{p}</a>;
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

const plain = (s: string) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").toLowerCase();

/** Searchable, sectioned FAQ list. */
export function FaqBrowser({ groups, contactEmail }: { groups: FaqGroup[]; contactEmail: string }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const shown = useMemo(() => {
    if (!q) return groups;
    const words = q.split(/\s+/);
    return groups
      .map((g) => ({
        ...g,
        faqs: g.faqs.filter((f) => {
          const hay = `${g.name} ${f.q} ${plain(f.a)}`.toLowerCase();
          return words.every((w) => hay.includes(w));
        }),
      }))
      .filter((g) => g.faqs.length);
  }, [groups, q]);
  const count = shown.reduce((n, g) => n + g.faqs.length, 0);

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions — e.g. delivery, refund, Estrogene"
          aria-label="Search the FAQs"
          className="h-13 w-full rounded-full border border-border bg-white pl-12 pr-12 text-sm shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {!q && (
        <nav aria-label="FAQ sections" className="mt-5 flex flex-wrap gap-2">
          {groups.map((g) => (
            <a key={g.anchor} href={`#${g.anchor}`} className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-800 hover:border-brand-300 hover:bg-brand-50">
              {g.name}
            </a>
          ))}
        </nav>
      )}
      {q && (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          {count ? `${count} question${count === 1 ? "" : "s"} found` : "No questions match your search."}
        </p>
      )}

      <div className="mt-8 space-y-10">
        {shown.map((g) => (
          <section key={g.anchor} id={g.anchor} className="scroll-mt-32">
            <h2 className="mb-3 text-xl font-semibold tracking-tight text-brand-800">{g.name}</h2>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {g.faqs.map((f) => (
                <details key={f.id} open={!!q} className="group">
                  <summary className="flex cursor-pointer list-none items-start gap-3 px-5 py-4 font-semibold text-foreground hover:bg-muted/50 [&::-webkit-details-marker]:hidden">
                    <span className="flex-1">{f.q}</span>
                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-foreground/80">
                    <Answer text={f.a} />
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className={cn("mt-12 rounded-3xl bg-gradient-to-br from-brand-800 to-brand-600 p-8 text-center text-white", q && !count && "mt-6")}>
        <h2 className="text-xl font-semibold">Still have a question?</h2>
        <p className="mt-1 text-sm text-brand-50/90">We&apos;re happy to help — we usually reply within one working day.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">Contact us</Link>
          <a href={`mailto:${contactEmail}`} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/10">{contactEmail}</a>
        </div>
      </div>
    </div>
  );
}
