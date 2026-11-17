import type { Metadata, Viewport } from "next";
import "./globals.css";

// Fonts: the storefront loads its two self-hosted files (src/components/gh/fonts.ts) and the
// admin panel loads its own, so the root layout no longer pulls extra Google font files onto every page.

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

// One theme-color meta; the storefront's inline mode script updates it to match light/dark.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F6F0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
