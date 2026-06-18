import type { Metadata } from "next";
import { Instrument_Sans, Syne } from "next/font/google";
import "./globals.css";

// Body / UI — matches the GreenGene Shopify store
const instrumentSans = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

// Headings / display — matches the GreenGene Shopify store
const syne = Syne({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "GreenGene Pharma — Empower Your Wellness, Live Better",
    template: "%s · GreenGene Pharma",
  },
  description:
    "Premium natural health supplements from GreenGene Pharma — empowering your journey to holistic well-being. Research-backed, fully transparent formulas, delivered across South Africa.",
  keywords: [
    "natural supplements",
    "South Africa",
    "wellness",
    "testosterone",
    "hormonal balance",
    "stress relief",
    "GreenGene Pharma",
  ],
  openGraph: {
    title: "GreenGene Pharma",
    description: "Trusted South African online pharmacy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSans.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
