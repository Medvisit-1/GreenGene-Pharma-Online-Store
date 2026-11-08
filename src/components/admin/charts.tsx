import { cn } from "@/lib/utils";

// Chart colours, validated against the admin card surface (var(--g-card)):
// slot 1 plum, slot 2 ochre; both ≥3:1, CVD-separable as a pair.
export const SERIES = ["var(--g-chart)", "#a8761c"] as const;
// Sequential plum ramp, light → dark (magnitude)
const RAMP = ["var(--g-ramp-1)", "var(--g-ramp-2)", "var(--g-ramp-3)", "var(--g-ramp-4)", "var(--g-ramp-5)", "var(--g-ramp-6)", "var(--g-plum)"];

/** Round an axis maximum up to a clean value (1, 2, 2.5, 5 × 10ⁿ per step). */
function niceScale(max: number, steps = 4) {
  if (max <= 0) return { top: steps, step: 1 };
  const raw = max / steps;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  return { top: step * Math.ceil(max / step), step };
}

/** Compact rand label from cents: R0, R2.5K, R1.2M */
export function compactRand(cents: number) {
  const r = cents / 100;
  if (r >= 1e6) return `R${+(r / 1e6).toFixed(1)}M`;
  if (r >= 1e3) return `R${+(r / 1e3).toFixed(1)}K`;
  return `R${Math.round(r)}`;
}

function Tip({ children, align }: { children: React.ReactNode; align: "left" | "right" | "center" }) {
  return (
    <span
      role="tooltip"
      className={cn(
        "pointer-events-none absolute bottom-full z-20 mb-1 hidden whitespace-nowrap rounded-lg bg-[color:var(--g-ink)] px-2.5 py-1.5 text-xs text-white shadow-md group-hover:block group-focus-within:block",
        align === "left" ? "left-0" : align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
      )}
    >
      {children}
    </span>
  );
}

export type ColumnPoint = { key: string; label: string; value: number; count?: number };

/**
 * Single-series column chart: the title names the series, so no legend.
 * Hover or keyboard-focus a column for its value; the peak is labelled directly.
 */
export function ColumnChart({
  points,
  format = (v) => String(v),
  axis = format,
  tip,
  height = 200,
  everyNth,
}: {
  points: ColumnPoint[];
  format?: (v: number) => string;
  axis?: (v: number) => string;
  tip?: (p: ColumnPoint) => string;
  height?: number;
  everyNth?: number;
}) {
  const max = Math.max(0, ...points.map((p) => p.value));
  const { top, step } = niceScale(max);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const peak = max > 0 ? points.findIndex((p) => p.value === max) : -1;
  const nth = everyNth ?? Math.max(1, Math.ceil(points.length / 8));

  return (
    <figure>
      <div className="flex gap-2">
        <div className="relative w-12 shrink-0 text-right text-[11px] text-muted-foreground" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
              {axis(t)}
            </span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }}>
          {ticks.map((t) => (
            <div key={t} aria-hidden className="absolute inset-x-0 border-t border-black/[0.07]" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <ul className="absolute inset-0 flex items-end gap-[2px]">
            {points.map((p, i) => {
              const h = (p.value / top) * 100;
              const text = tip ? tip(p) : `${p.label}: ${format(p.value)}`;
              return (
                <li key={p.key} className="group relative flex h-full min-w-0 flex-1 items-end justify-center">
                  <span tabIndex={0} aria-label={text} className="absolute inset-0 z-10 cursor-default rounded-md outline-none focus-visible:ring-2 focus-visible:ring-plum-300" />
                  {i === peak && (
                    <span className="absolute z-0 -translate-y-1 whitespace-nowrap text-[11px] font-semibold text-foreground" style={{ bottom: `${h}%` }}>
                      {format(p.value)}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="block w-full max-w-7 rounded-t-[4px] transition-opacity group-hover:opacity-75"
                    style={{ height: `${h}%`, minHeight: p.value > 0 ? 2 : 0, background: SERIES[0] }}
                  />
                  <Tip align={i < 2 ? "left" : i > points.length - 3 ? "right" : "center"}>{text}</Tip>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="ml-14 mt-1.5 flex gap-[2px] text-[11px] text-muted-foreground">
        {points.map((p, i) => (
          <span key={p.key} className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center">
            {i % nth === 0 ? p.label : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}

/** Two-series stacked columns (with legend + 2px gap between segments). */
export function StackedColumns({
  points,
  names,
  height = 180,
}: {
  points: { key: string; label: string; a: number; b: number }[];
  names: [string, string];
  height?: number;
}) {
  const max = Math.max(0, ...points.map((p) => p.a + p.b));
  const { top, step } = niceScale(max);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  return (
    <figure>
      <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-hidden>
        {names.map((n, i) => (
          <span key={n} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[i] }} />
            {n}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <div className="relative w-8 shrink-0 text-right text-[11px] text-muted-foreground" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>{t}</span>
          ))}
        </div>
        <div className="relative flex-1" style={{ height }}>
          {ticks.map((t) => (
            <div key={t} aria-hidden className="absolute inset-x-0 border-t border-black/[0.07]" style={{ bottom: `${(t / top) * 100}%` }} />
          ))}
          <ul className="absolute inset-0 flex items-end gap-1">
            {points.map((p, i) => {
              const text = `${p.label}: ${p.a} ${names[0].toLowerCase()}, ${p.b} ${names[1].toLowerCase()}`;
              return (
                <li key={p.key} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <span tabIndex={0} aria-label={text} className="absolute inset-0 z-10 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-plum-300" />
                  {p.b > 0 && <span aria-hidden className="block w-full max-w-7 rounded-t-[4px]" style={{ height: `${(p.b / top) * 100}%`, background: SERIES[1] }} />}
                  {p.a > 0 && (
                    <span aria-hidden className={cn("block w-full max-w-7", p.b > 0 ? "mt-[2px]" : "rounded-t-[4px]")} style={{ height: `${(p.a / top) * 100}%`, background: SERIES[0] }} />
                  )}
                  <Tip align={i < 2 ? "left" : i > points.length - 3 ? "right" : "center"}>{text}</Tip>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className="ml-10 mt-1.5 flex gap-1 text-[11px] text-muted-foreground">
        {points.map((p) => <span key={p.key} className="flex-1 text-center">{p.label}</span>)}
      </div>
    </figure>
  );
}

/** Horizontal bars with the value written at the end (one series, one colour). */
export function BarList({ rows, empty = "No data yet." }: { rows: { label: string; value: number; display: string; sub?: string }[]; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate font-medium" title={r.label}>{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              <strong className="text-foreground">{r.display}</strong>
              {r.sub ? ` · ${r.sub}` : ""}
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/[0.05]">
            <div className="h-2 rounded-full" style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, background: SERIES[0] }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Weekday × hour heatmap on a single-hue ramp. */
export function Heatmap({ grid, rows }: { grid: number[][]; rows: string[] }) {
  const max = Math.max(1, ...grid.flat());
  const step = (v: number) => (v === 0 ? -1 : Math.min(RAMP.length - 1, Math.floor((v / max) * (RAMP.length - 1) + 0.5)));
  return (
    <figure>
      <div className="overflow-x-auto">
        {/* Fixed layout: all 24 hour columns get equal width (auto layout gave the
            unlabelled hours zero width, hiding two-thirds of the day) */}
        <table className="w-full min-w-[560px] table-fixed border-separate" style={{ borderSpacing: 2 }}>
          <colgroup>
            <col style={{ width: 40 }} />
            {Array.from({ length: 24 }, (_, h) => <col key={h} />)}
          </colgroup>
          <thead>
            <tr>
              <th />
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} scope="col" className="text-[10px] font-normal text-muted-foreground">{h % 3 === 0 ? String(h).padStart(2, "0") : ""}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, d) => (
              <tr key={d}>
                <th scope="row" className="pr-1 text-left text-[11px] font-medium text-muted-foreground">{rows[d].slice(0, 3)}</th>
                {row.map((v, h) => {
                  const s = step(v);
                  const text = `${rows[d]} ${String(h).padStart(2, "0")}:00 – ${v} order${v === 1 ? "" : "s"}`;
                  return (
                    <td key={h} className="group relative p-0">
                      <span
                        tabIndex={0}
                        aria-label={text}
                        className="block h-6 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-plum-300"
                        style={{ background: s < 0 ? "rgba(0,0,0,.035)" : RAMP[s] }}
                      />
                      <Tip align={h < 3 ? "left" : h > 20 ? "right" : "center"}>{text}</Tip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        Fewer
        {RAMP.map((c) => <span key={c} className="h-2.5 w-5 rounded-sm" style={{ background: c }} />)}
        More orders
      </figcaption>
    </figure>
  );
}

/** Tiny trend line for KPI tiles (decorative: the number beside it carries the value). */
export function Sparkline({ values, color = "currentColor", height = 36 }: { values: number[]; color?: string; height?: number }) {
  const max = Math.max(1, ...values);
  const w = 120;
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${height - 3 - (v / max) * (height - 6)}`).join(" ");
  return (
    <svg aria-hidden viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-9 w-full" style={{ color }}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** "Show as table" fallback for any chart. */
export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-xs font-semibold text-plum-700">Show as table</summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className="px-3 py-1.5 tabular-nums">{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export const DAY_PARTS = [
  { label: "Night", hours: "12am–6am", from: 0, to: 6 },
  { label: "Morning", hours: "6am–12pm", from: 6, to: 12 },
  { label: "Afternoon", hours: "12pm–6pm", from: 12, to: 18 },
  { label: "Evening", hours: "6pm–12am", from: 18, to: 24 },
] as const;

/**
 * Orders by weekday × part of the day, with the count written in every box and
 * totals for each day and each part of the day. Shading only reinforces the number.
 */
export function WhenTable({ grid, days }: { grid: number[][]; days: string[] }) {
  const cell = grid.map((row) => DAY_PARTS.map((p) => row.slice(p.from, p.to).reduce((a, b) => a + b, 0)));
  const dayTotal = cell.map((r) => r.reduce((a, b) => a + b, 0));
  const partTotal = DAY_PARTS.map((_, j) => cell.reduce((n, r) => n + r[j], 0));
  const total = dayTotal.reduce((a, b) => a + b, 0);
  const max = Math.max(1, ...cell.flat());
  const shade = (v: number) => {
    if (!v) return { background: "rgba(0,0,0,.03)", color: "var(--g-muted, #7c6870)" };
    const s = Math.min(RAMP.length - 1, Math.max(1, Math.round((v / max) * (RAMP.length - 1))));
    return { background: RAMP[s], color: s >= 4 ? "#fff" : "var(--g-ink, #2d1724)" };
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] table-fixed border-separate text-sm" style={{ borderSpacing: 4 }}>
        <colgroup>
          <col style={{ width: 96 }} />
          {DAY_PARTS.map((p) => <col key={p.label} />)}
          <col style={{ width: 70 }} />
        </colgroup>
        <thead>
          <tr>
            <th />
            {DAY_PARTS.map((p) => (
              <th key={p.label} scope="col" className="pb-1 text-center font-semibold">
                {p.label}
                <span className="block text-[11px] font-normal text-muted-foreground">{p.hours}</span>
              </th>
            ))}
            <th scope="col" className="pb-1 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {cell.map((row, d) => (
            <tr key={days[d]}>
              <th scope="row" className="text-left font-medium">{days[d]}</th>
              {row.map((v, j) => (
                <td
                  key={j}
                  data-day={days[d]}
                  data-part={DAY_PARTS[j].label}
                  data-count={v}
                  title={`${days[d]} ${DAY_PARTS[j].label.toLowerCase()} (${DAY_PARTS[j].hours}): ${v} order${v === 1 ? "" : "s"}`}
                  className="h-10 rounded-lg text-center font-semibold tabular-nums"
                  style={shade(v)}
                >
                  {v || "–"}
                </td>
              ))}
              <td className="text-right font-bold tabular-nums" data-day-total={days[d]}>{dayTotal[d]}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row" className="pt-1 text-left font-semibold">Total</th>
            {partTotal.map((v, j) => <td key={j} className="pt-1 text-center font-bold tabular-nums" data-part-total={DAY_PARTS[j].label}>{v}</td>)}
            <td className="pt-1 text-right font-bold tabular-nums" data-grand-total>{total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
