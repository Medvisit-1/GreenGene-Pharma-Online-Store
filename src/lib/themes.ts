// Storefront colour themes. Five base colours drive the whole shop; every
// tint, shade and gradient is derived from them in CSS (see garden.css).

export type ThemeColors = {
  primary: string; // headings, rewards card, buttons, footer (plum)
  accent: string; // highlights, progress, badges (gold)
  secondary: string; // offer slide, refill card, leaves (forest)
  background: string; // page background (cream)
  ink: string; // body text
};

export type ThemePreset = { id: string; name: string; mood: string; colors: ThemeColors };

export const THEME_PRESETS: ThemePreset[] = [
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

/** CSS custom properties for the storefront wrapper. */
export function themeStyle(colors: ThemeColors): Record<string, string> {
  return {
    "--g-primary": colors.primary,
    "--g-accent": colors.accent,
    "--g-secondary": colors.secondary,
    "--g-bg": colors.background,
    "--g-ink": colors.ink,
  };
}
