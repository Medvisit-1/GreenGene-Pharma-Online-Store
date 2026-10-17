// Decorative pieces for the "Rewards Garden" storefront theme: outline icons in
// circles, leaf sprigs that flutter, and falling petals. All server-renderable.

const ICONS = {
  mail: <><path d="M4 7h16v11H4z" /><path d="m4 8 8 6 8-6" /></>,
  people: <><circle cx="9" cy="9" r="3" /><circle cx="16.5" cy="10" r="2.4" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 19a4 4 0 0 1 7 0" /></>,
  star: <path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z" />,
  ticket: <><path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 1 0-4V5H4z" /><path d="M9 5v14" strokeDasharray="2 2" /></>,
  percent: <><path d="M5 19 19 5" /><circle cx="7" cy="7" r="2" /><circle cx="17" cy="17" r="2" /></>,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  leaf: <><path d="M5 19C5 9 11 5 20 4c-1 9-5 15-15 15z" /><path d="M5 19 14 10" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  flower: <><circle cx="12" cy="12" r="2.5" /><path d="M12 9.5C10 5 14 5 12 9.5ZM14.5 12c4.5-2 4.5 2 0 0ZM12 14.5c2 4.5-2 4.5 0 0ZM9.5 12c-4.5 2-4.5-2 0 0Z" /></>,
  bolt: <path d="M13 3 5 14h6l-1 7 8-11h-6z" />,
  drop: <path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z" />,
  gift: <><path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" /><path d="M12 7C10 3 6 4 7.5 6.5 8.5 7.5 12 7 12 7Zm0 0c2-4 6-3 4.5-.5C15.5 7.5 12 7 12 7Z" /></>,
  home: <><path d="M4 11 12 4l8 7" /><path d="M6 10v10h12V10" /></>,
  bag: <><path d="M5 8h14l-1 12H6z" /><path d="M9 8a3 3 0 0 1 6 0" /></>,
} as const;

export type GIconName = keyof typeof ICONS;

export function GIcon({ name, size = 18, className }: { name: GIconName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      {ICONS[name]}
    </svg>
  );
}

/** Gradient fills the sprigs share. Rendered once in the storefront layout. */
export function GardenDefs() {
  return (
    <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="gg-sprig-plum" x1="0" x2="1"><stop offset="0" stopColor="#7a2a55" /><stop offset="1" stopColor="#a64274" /></linearGradient>
        <linearGradient id="gg-sprig-green" x1="0" x2="1"><stop offset="0" stopColor="#24543a" /><stop offset="1" stopColor="#3b8a5b" /></linearGradient>
      </defs>
    </svg>
  );
}

const LEAVES = [[38, 160, -118], [48, 150, -22], [64, 120, -132], [76, 110, -32], [94, 80, -142], [106, 70, -42], [124, 42, -84]];

/** A curved stem with alternating leaves that flutter, like the rewards ad. */
export function Sprig({ kind, className, style }: { kind: "plum" | "green"; className?: string; style?: React.CSSProperties }) {
  return (
    <div aria-hidden className={`gg-sprig ${className ?? ""}`} style={style}>
      <svg viewBox="0 0 160 200">
        <path d="M24 196 C 52 154, 86 112, 132 30" stroke={kind === "plum" ? "#7a2a55" : "#24543a"} strokeWidth="3" fill="none" strokeLinecap="round" />
        {LEAVES.map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path className="gg-lf" style={{ animationDelay: `${-i * 0.6}s` }}
              d="M0 0 C 10 -13, 34 -14, 46 0 C 34 14, 10 13, 0 0Z" fill={`url(#gg-sprig-${kind})`} />
          </g>
        ))}
      </svg>
    </div>
  );
}

// Deterministic "random" so server and browser render the same petals.
const rand = (i: number, salt: number) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Petals (and the odd leaf) drifting down behind a card. */
export function Petals({ colors, leaf, count = 14, height = 420 }: { colors: string[]; leaf?: string; count?: number; height?: number }) {
  return (
    <div aria-hidden className="gg-petals">
      {Array.from({ length: count }, (_, i) => {
        const isLeaf = !!leaf && i % 3 === 0;
        const style = {
          left: `${(rand(i, 1) * 100).toFixed(1)}%`,
          scale: (0.6 + rand(i, 2) * 0.9).toFixed(2),
          "--h": `${height}px`,
          "--dur": `${(9 + rand(i, 3) * 9).toFixed(1)}s`,
          "--delay": `${(-rand(i, 4) * 18).toFixed(1)}s`,
          "--drift": `${Math.round(-80 + rand(i, 5) * 160)}px`,
          "--rot": `${Math.round(rand(i, 6) * 540 - 270)}deg`,
          "--fl": `${(1.4 + rand(i, 7) * 1.6).toFixed(1)}s`,
        } as React.CSSProperties;
        return (
          <span key={i} className="gg-petal" style={style}>
            {isLeaf ? (
              <svg width="20" height="20" viewBox="0 0 20 20"><path d="M2 18 C4 8 10 3 18 2 C17 10 12 16 2 18Z" fill={leaf} opacity=".85" /></svg>
            ) : (
              <svg width="18" height="22" viewBox="0 0 18 22"><path d="M9 21 C2 15 0 8 4 3 C6 1 8 2 9 4 C10 2 12 1 14 3 C18 8 16 15 9 21Z" fill={colors[i % colors.length]} opacity=".9" /></svg>
            )}
          </span>
        );
      })}
    </div>
  );
}

/** The bouncing gift box with a lid that pops and sparkles. */
export function GiftBox({ className }: { className?: string }) {
  return (
    <svg className={`gg-gift ${className ?? ""}`} viewBox="0 0 100 100" aria-hidden>
      <g className="gg-gift-box"><rect x="18" y="46" width="64" height="46" rx="5" fill="#8e3263" /><rect x="45" y="46" width="10" height="46" fill="#2f6b47" /></g>
      <g className="gg-gift-lid"><rect x="12" y="34" width="76" height="16" rx="4" fill="#a64274" /><rect x="45" y="34" width="10" height="16" fill="#3b8a5b" /><path d="M50 34 C40 18 24 22 32 32 C36 36 46 35 50 34 Z M50 34 C60 18 76 22 68 32 C64 36 54 35 50 34 Z" fill="#3b8a5b" /></g>
      <g fill="#e3bd78"><path className="gg-spark" d="M30 18 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" /><path className="gg-spark" d="M72 10 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" /><path className="gg-spark" d="M84 30 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" /><path className="gg-spark" d="M14 26 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2z" /></g>
    </svg>
  );
}
