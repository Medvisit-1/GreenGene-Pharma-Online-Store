"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NewReleaseCard } from "@/lib/new-release";

export function NewReleaseCarousel({
  heading,
  cards,
}: {
  heading: string;
  cards: NewReleaseCard[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: -1 | 1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Just launched</p>
          <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
        </div>
        {cards.length > 1 && (
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous"
              className="rounded-full border border-border bg-white p-2 text-brand-700 shadow-sm hover:bg-brand-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" onClick={() => scrollBy(1)} aria-label="Next"
              className="rounded-full border border-border bg-white p-2 text-brand-700 shadow-sm hover:bg-brand-50">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((c, i) => {
          const link = c.buttonLink || "/products";
          return (
            <article
              key={i}
              data-card
              className="flex w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-sm sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
            >
              <Link href={link} className="block aspect-[4/3] overflow-hidden bg-white">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.image} alt={c.title} className="h-full w-full object-contain p-4 transition-transform duration-500 hover:scale-[1.04]" />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </Link>
              <div className="flex flex-1 flex-col p-6">
                {c.title && <h3 className="text-xl font-semibold tracking-tight">{c.title}</h3>}
                {c.text && <p className="mt-2 flex-1 text-sm text-muted-foreground">{c.text}</p>}
                {c.buttonLabel && (
                  <Link href={link} className="mt-5 inline-block">
                    <Button size="lg">
                      {c.buttonLabel} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
