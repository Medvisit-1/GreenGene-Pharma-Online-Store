import localFont from "next/font/local";

// GreenGene editorial theme (approved homepage design): Playfair Display serif with italic key words, Inter for UI.
// Self-hosted files, so the build never needs to fetch fonts from Google.
export const ghSerif = localFont({
  variable: "--gh-serif",
  display: "swap",
  src: [
    { path: "./fonts/playfair.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/playfair-italic.woff2", weight: "400 700", style: "italic" },
  ],
  fallback: ["Georgia", "serif"],
});

export const ghSans = localFont({
  variable: "--gh-sans",
  display: "swap",
  src: [{ path: "./fonts/inter.woff2", weight: "400 700", style: "normal" }],
  fallback: ["system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
});

export const ghFonts = `${ghSerif.variable} ${ghSans.variable}`;
