"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Fades `.gg-reveal` blocks in as they scroll into view (data-delay="0.1" staggers them). */
export function GardenMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>(".gg-reveal:not(.in)")];
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }),
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      if (el.dataset.delay) el.style.transitionDelay = `${el.dataset.delay}s`;
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
