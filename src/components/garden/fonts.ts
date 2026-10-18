import { Cormorant_Garamond, Dancing_Script, Jost } from "next/font/google";

// Storefront "Rewards Garden" theme: serif headings, clean body, handwritten accents.
export const serif = Cormorant_Garamond({
  variable: "--font-g-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const body = Jost({
  variable: "--font-g-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const script = Dancing_Script({
  variable: "--font-g-script",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const gardenFonts = `${serif.variable} ${body.variable} ${script.variable}`;
