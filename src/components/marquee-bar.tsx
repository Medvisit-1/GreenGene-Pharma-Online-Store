/**
 * Floating announcement marquee — a continuous right-to-left scrolling bar.
 * Rendered at the very top of the storefront when enabled in the admin
 * "Front Shop" page. Hovering pauses the scroll.
 */
export function MarqueeBar({
  text,
  speed = 30,
}: {
  text?: string;
  speed?: number;
}) {
  const clean = (text ?? "").trim();
  if (!clean) return null;

  // Repeat the text a few times per group so short messages still fill the bar.
  const group = (
    <div className="flex shrink-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <span key={i} className="mx-8 inline-flex items-center gap-2">
          {clean}
        </span>
      ))}
    </div>
  );

  const duration = Math.max(8, Number(speed) || 30);

  return (
    <div className="overflow-hidden bg-brand-800 py-2 text-sm font-medium text-white">
      <div
        className="marquee-track animate-marquee flex w-max whitespace-nowrap"
        style={{ animationDuration: `${duration}s` }}
      >
        {group}
        {/* duplicate for a seamless loop (translateX -50%) */}
        <div className="flex shrink-0" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="mx-8 inline-flex items-center gap-2">
              {clean}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
