// Storefront colour themes. Five base colours drive the whole shop; every
// tint, shade and gradient is derived from them in CSS (see garden.css).

export type ThemeColors = {
  primary: string; // headings, rewards card, buttons, footer (plum)
  accent: string; // highlights, progress, badges (gold)
  secondary: string; // offer slide, refill card, leaves (forest)
  background: string; // page background (cream)
  ink: string; // body text
  /** Leaf branches (defaults to the second colour when a theme doesn't set it) */
  foliage?: string;
};

export type ThemePreset = { id: string; name: string; mood: string; colors: ThemeColors };

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "evergreen",
    name: "Evergreen",
    mood: "Deep green with cream and charcoal — matches the logo, neutral for everyone",
    colors: { primary: "#1f4a36", accent: "#c6a15b", secondary: "#2b302d", background: "#f3efe6", ink: "#232826", foliage: "#2f6b47" },
  },
  {
    id: "garden",
    name: "Rewards Garden",
    mood: "Plum, gold & forest on warm cream — the rewards ad look",
    colors: { primary: "#5c1a3b", accent: "#e3bd78", secondary: "#24543a", background: "#f3ebe1", ink: "#2d1724" },
  },
  {
    id: "apothecary",
    name: "Forest Apothecary",
    mood: "Deep botanical green with brass and cinnamon",
    colors: { primary: "#1f4a35", accent: "#d9b26a", secondary: "#7a3b22", background: "#f1ede3", ink: "#1b2a22" },
  },
  {
    id: "rose",
    name: "Rose & Sage",
    mood: "Soft dusty rose with sage — gentle and feminine",
    colors: { primary: "#8c3557", accent: "#e8b4a0", secondary: "#56755f", background: "#f8eeec", ink: "#3a2229" },
  },
  {
    id: "midnight",
    name: "Midnight Botanical",
    mood: "Inky navy, champagne gold and evergreen",
    colors: { primary: "#1e2a4a", accent: "#e0c38a", secondary: "#2c5a48", background: "#f1eee8", ink: "#1a1f2e" },
  },
  {
    id: "classic",
    name: "Classic GreenGene",
    mood: "The original brand: forest green with lime",
    colors: { primary: "#0c382b", accent: "#8cc63f", secondary: "#155640", background: "#ebe6dc", ink: "#103a2b" },
  },
  {
    id: "citrus",
    name: "Sunrise Citrus",
    mood: "Warm terracotta and saffron — energetic",
    colors: { primary: "#8a3a1c", accent: "#f0b53c", secondary: "#3d6b4a", background: "#f7efe4", ink: "#2e1d14" },
  },
];

export const DEFAULT_THEME = THEME_PRESETS[0];

/**
 * Category accents: Women's Health keeps the plum look, Men's Health gets
 * charcoal with green and gold. Everything else uses the shop theme.
 */
export type Accent = "women" | "men";
export function accentFor(p: { name: string; category?: { slug: string; name?: string } | null }): Accent | null {
  const cat = `${p.category?.slug ?? ""} ${p.category?.name ?? ""}`.toLowerCase();
  if (/women|female/.test(cat)) return "women";
  if (/\bmen|male/.test(cat)) return "men";
  const name = p.name.toLowerCase();
  if (/\bfor her\b|\bwomen|estrogene|estrolean|gynoshield|fertilitygene/.test(name)) return "women";
  if (/\bfor him\b|\bmen\b|anabolean|mangene|testosterone/.test(name)) return "men";
  return null;
}
export const accentClass = (a: Accent | null) => (a ? `gg-accent-${a}` : "");

const HEX = /^#[0-9a-f]{6}$/i;

/** The saved theme (preset or custom colours), always valid. */
export function resolveTheme(preset: string | undefined, custom: string | undefined): { id: string; colors: ThemeColors } {
  const p = THEME_PRESETS.find((t) => t.id === preset);
  if (p) return { id: p.id, colors: p.colors };
  if (preset === "custom" && custom) {
    try {
      const c = JSON.parse(custom) as Partial<ThemeColors>;
      const colors = { ...DEFAULT_THEME.colors };
      for (const k of Object.keys(colors) as (keyof ThemeColors)[]) if (c[k] && HEX.test(c[k]!)) colors[k] = c[k]!.toLowerCase();
      return { id: "custom", colors };
    } catch {
      /* fall through to the default */
    }
  }
  return { id: DEFAULT_THEME.id, colors: DEFAULT_THEME.colors };
}

/** The admin's theme: its own choice, or the shop's when it hasn't picked one. */
export function resolveAdminTheme(s: { themePreset: string; themeCustom: string; adminThemePreset: string; adminThemeCustom: string }) {
  return s.adminThemePreset ? resolveTheme(s.adminThemePreset, s.adminThemeCustom) : resolveTheme(s.themePreset, s.themeCustom);
}

/** CSS custom properties for the storefront wrapper. */
export function themeStyle(colors: ThemeColors): Record<string, string> {
  return {
    "--g-primary": colors.primary,
    "--g-accent": colors.accent,
    "--g-secondary": colors.secondary,
    "--g-bg": colors.background,
    "--g-ink": colors.ink,
    ...(colors.foliage ? { "--g-foliage": colors.foliage } : {}),
  };
}
