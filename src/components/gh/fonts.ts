import localFont from "next/font/local";

// GreenGene editorial theme (approved homepage design): Playfair Display serif with italic key words, Inter for UI.
// Self-hosted files, so the build never needs to fetch fonts from Google.
export const ghSerif = localFont({
  variable: "--gh-serif",
  display: "swap",
  // One file only (site budget: two font files in total). Italic key words use the browser's
  // slanted version of this face; ./fonts/playfair-italic.woff2 is kept on disk but no longer loaded.
  src: [{ path: "./fonts/playfair.woff2", weight: "400 700", style: "normal" }],
  fallback: ["Georgia", "serif"],
});

export const ghSans = localFont({
  variable: "--gh-sans",
  display: "swap",
  src: [{ path: "./fonts/inter.woff2", weight: "400 700", style: "normal" }],
  fallback: ["system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

export const ghFonts = `${ghSerif.variable} ${ghSans.variable}`;
