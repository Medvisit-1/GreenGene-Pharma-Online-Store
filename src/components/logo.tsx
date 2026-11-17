import Link from "next/link";
import { cn } from "@/lib/utils";
import "./logo.css";

/* The real GreenGene Pharma logo (public/logo-contrast.png, 1547 x 756), split once into three
   transparent layers so each part can be coloured and moved on its own (about 16 KB together):
   the helix + cross mark, the "Green Gene" lettering and the green "Pharma". */
const W = 480;
const H = 235;

/**
 * Live logo: the helix mark grows in once and then breathes gently a few times, and a soft light
 * sweeps across the lettering. Transform/opacity only (GPU), fixed box (no layout shift), and
 * fully still under prefers-reduced-motion. Lettering turns light on dark grounds.
 */
export function Logo({
  className,
  height = 44,
  animated = true,
}: {
  className?: string;
  height?: number;
  /** @deprecated kept for older callers; the layers are tiny and always load eagerly */
  priority?: boolean;
  animated?: boolean;
}) {
  const width = Math.round((height * W) / H);
  return (
    <Link
      href="/"
      aria-label="GreenGene Pharma, home"
      className={cn("gg-logo", animated && "is-live", className)}
      style={{ width, height }}
      translate="no"
    >
      {/* eslint-disable @next/next/no-img-element -- three tiny pre-sized layers, stacked */}
      <img className="l-word" src="/brand/logo-word.webp" alt="GreenGene Pharma" width={W} height={H} decoding="async" fetchPriority="high" />
      <img className="l-pharma" src="/brand/logo-pharma.webp" alt="" width={W} height={H} decoding="async" />
      <span className="l-mark" aria-hidden="true">
        <img src="/brand/logo-mark.webp" alt="" width={W} height={H} decoding="async" />
      </span>
      {/* eslint-enable @next/next/no-img-element */}
      {animated && <span className="l-shine" aria-hidden="true" />}
    </Link>
  );
}
