"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type Slide = { key: string; className: string; label: string; content: React.ReactNode };

const DURATION = 6000;

/** Stories-style banner slider: progress bars, auto-advance, swipe, and count-ups on entry. */
export function HomeSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);
  const n = slides.length;

  const go = useCallback((to: number) => setIndex(((to % n) + n) % n), [n]);

  // Auto-advance (not for people who prefer reduced motion)
  useEffect(() => {
    if (n < 2 || paused || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => go(index + 1), DURATION);
    return () => clearTimeout(t);
  }, [index, paused, n, go]);

  // Count the amounts up each time a slide comes in
  useEffect(() => {
    const slide = root.current?.querySelectorAll<HTMLElement>(".gg-slide")[index];
    if (!slide || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timers = [...slide.querySelectorAll<HTMLElement>("[data-count]")].map((el) => {
      const to = Number(el.dataset.count);
      const prefix = el.dataset.prefix ?? "";
      let v = 0;
      el.textContent = `${prefix}0`;
      const t = setInterval(() => {
        v = Math.min(to, v + Math.ceil(to / 18));
        el.textContent = `${prefix}${v}`;
        if (v >= to) clearInterval(t);
      }, 45);
      return t;
    });
    return () => timers.forEach(clearInterval);
  }, [index]);

  if (!n) return null;

  return (
    <div
      ref={root}
      className={cn("gg-slider", paused && "paused")}
      role="region"
      aria-roledescription="carousel"
      aria-label="This week's offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {n > 1 && (
        <div className="gg-bars">
          {slides.map((s, k) => (
            <button
              key={s.key}
              type="button"
              aria-label={`Show slide ${k + 1}: ${s.label}`}
              aria-current={k === index}
              onClick={() => go(k)}
              className={k < index ? "done" : k === index ? "now" : undefined}
            >
              <i />
            </button>
          ))}
        </div>
      )}

      {slides.map((s, k) => (
        <div
          key={s.key}
          className={cn("gg-slide", s.className, k === index && "active")}
          role="group"
          aria-roledescription="slide"
          aria-label={`${k + 1} of ${n}: ${s.label}`}
          aria-hidden={k !== index}
          inert={k !== index}
        >
          {s.content}
        </div>
      ))}

      {n > 1 && (
        <div className="gg-navbtn">
          <button type="button" aria-label="Previous slide" onClick={() => go(index - 1)}>‹</button>
          <button type="button" aria-label="Next slide" onClick={() => go(index + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
