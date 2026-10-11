import { cn, formatPrice } from "@/lib/utils";

type Month = { key: string; label: string; revenue: number; orders: number };

// Brand green step that passes the chart colour checks (lightness, chroma, ≥3:1 vs surface)
const BAR = "#22805a";

/** Round an axis maximum up to a clean value (1, 2, 2.5, 5 × 10ⁿ per step). */
function niceScale(max: number, steps = 4) {
  if (max <= 0) return { top: steps * 100_00, step: 100_00 }; // R100 steps when empty
  const raw = max / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return { top: step * Math.ceil(max / step), step };
}

/** Compact rand axis label: R0, R2.5K, R1.2M (input in cents). */
function compact(cents: number) {
  const r = cents / 100;
  if (r >= 1e6) return `R${+(r / 1e6).toFixed(1)}M`;
  if (r >= 1e3) return `R${+(r / 1e3).toFixed(1)}K`;
  return `R${Math.round(r)}`;
}

/**
 * Single-series column chart (no legend needed — the title names it).
 * Server-rendered; hover or keyboard-focus a column for its value. A table view sits below.
 */
export function RevenueChart({ months }: { months: Month[] }) {
  const max = Math.max(...months.map((m) => m.revenue));
  const { top, step } = niceScale(max);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const peak = max > 0 ? months.findIndex((m) => m.revenue === max) : -1;
  const H = 200;

  return (
    <figure>
      <div className="flex gap-2">
        {/* Y axis */}
        <div className="relative w-12 shrink-0 text-right text-[11px] text-muted-foreground" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
              {compact(t)}
            </span>
          ))}
        </div>
        {/* Plot */}
        <div className="relative flex-1" style={{ height: H }}>
          {ticks.map((t) => (
            <div key={t} aria-hidden className="absolute inset-x-0 border-t border-black/[0.07]" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <ul className="absolute inset-0 flex items-end">
            {months.map((m, i) => {
              const h = (m.revenue / top) * 100;
              const label = `${m.label}: ${formatPrice(m.revenue)} from ${m.orders} order${m.orders === 1 ? "" : "s"}`;
              return (
                <li key={m.key} className="group relative flex h-full flex-1 items-end justify-center">
                  {/* Hit target spans the whole column, wider than the bar */}
                  <span tabIndex={0} aria-label={label} className="absolute inset-0 z-10 cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-brand-300" />
                  {i === peak && (
                    <span className="absolute z-0 -translate-y-1 whitespace-nowrap text-[11px] font-semibold text-foreground" style={{ bottom: `${h}%` }}>
                      {compact(m.revenue)}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="block w-full max-w-6 rounded-t-[4px] transition-opacity group-hover:opacity-80"
                    style={{ height: `${h}%`, minHeight: m.revenue > 0 ? 2 : 0, background: BAR }}
                  />
                  {/* Tooltip */}
                  <span
                    role="tooltip"
                    className={cn(
                      "pointer-events-none absolute bottom-full z-20 mb-1 hidden whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-xs text-background shadow-md group-hover:block group-focus-within:block",
                      // Keep the tooltip inside the chart at both ends
                      i < 2 ? "left-0" : i > months.length - 3 ? "right-0" : "left-1/2 -translate-x-1/2"
                    )}
                  >
                    <strong>{m.label}</strong> · {formatPrice(m.revenue)} · {m.orders} order{m.orders === 1 ? "" : "s"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* X axis */}
      <div className="ml-14 mt-1.5 flex text-[11px] text-muted-foreground">
        {months.map((m) => (
          <span key={m.key} className="flex-1 text-center">{m.label}</span>
        ))}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-xs font-semibold text-brand-700">Show as table</summary>
        <table className="mt-2 w-full max-w-md text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="py-1">Month</th><th className="py-1 text-right">Orders</th><th className="py-1 text-right">Revenue</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {months.map((m) => (
              <tr key={m.key}>
                <td className="py-1">{m.key}</td>
                <td className="py-1 text-right tabular-nums">{m.orders}</td>
                <td className="py-1 text-right tabular-nums">{formatPrice(m.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
