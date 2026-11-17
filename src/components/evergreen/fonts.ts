import { Instrument_Serif, Inter } from "next/font/google";

// Admin panel fonts (Evergreen look). preload: false, because the bundler puts their CSS in a chunk
// shared with the storefront, and preloading made every shop page download these files too.
export const gxSerif = Instrument_Serif({ variable: "--gx-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"], display: "swap", preload: false });
export const gxSans = Inter({ variable: "--gx-sans", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", preload: false });
export const gxFonts = `${gxSerif.variable} ${gxSans.variable}`;
