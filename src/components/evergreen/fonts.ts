import { Instrument_Serif, Inter } from "next/font/google";

// Evergreen Night homepage: editorial serif display + clean UI sans.
export const gxSerif = Instrument_Serif({ variable: "--gx-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
export const gxSans = Inter({ variable: "--gx-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
export const gxFonts = `${gxSerif.variable} ${gxSans.variable}`;
