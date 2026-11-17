"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductImg } from "@/components/night/pic";

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50">
        <span className="text-7xl font-black text-brand-300">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* square stage + contain: the whole bottle and its label always show, never cropped */}
      <div className="gg-stage relative aspect-square overflow-hidden rounded-2xl">
        <ProductImg
          key={images[active]}
          src={images[active]}
          alt={active === 0 ? name : `${name}, image ${active + 1}`}
          size={900}
          sizes="(max-width: 1024px) 100vw, 560px"
          eager={active === 0}
          className="h-full w-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="flex flex-wrap gap-3" role="group" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-pressed={active === i}
              className={cn(
                "gg-thumb h-20 w-20 overflow-hidden rounded-xl border-2 p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                active === i ? "border-brand-500" : "border-border hover:border-brand-300"
              )}
            >
              <ProductImg src={src} alt="" size={160} sizes="80px" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
