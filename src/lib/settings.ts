import { prisma } from "@/lib/prisma";

export type SiteSettings = {
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactHours: string;
  announcement: string;
  // Shipping amounts stored in cents (ZAR)
  shippingFlat: string;
  freeShippingThreshold: string;

  // ---- Front Shop: homepage hero (editable in admin) ----
  heroBadge: string;
  heroHeading: string;
  heroSubheading: string;
  heroPrimaryLabel: string;
  heroPrimaryLink: string;
  heroSecondaryLabel: string;
  heroSecondaryLink: string;
  heroImage: string;
  // Feature strip (4 cards)
  feat1Title: string; feat1Text: string;
  feat2Title: string; feat2Text: string;
  feat3Title: string; feat3Text: string;
  feat4Title: string; feat4Text: string;
  // "Research, Quality & Trust" section
  rqtHeading: string;
  rqtBody: string; // paragraphs separated by a blank line
  rqtButtonLabel: string;
  rqtButtonLink: string;
  rqtStat1Key: string; rqtStat1Val: string;
  rqtStat2Key: string; rqtStat2Val: string;
  rqtStat3Key: string; rqtStat3Val: string;

  // ---- Floating marquee banner ----
  marqueeEnabled: string; // "1" | "0"
  marqueeText: string;
  marqueeSpeed: string; // seconds per loop
};

export const DEFAULT_SETTINGS: SiteSettings = {
  contactPhone: "+27 (0)11 000 0000",
  contactEmail: "info@greengenepharma.co.za",
  contactAddress: "Johannesburg, South Africa",
  contactHours: "Mon–Fri: 8am – 6pm · Sat: 8am – 1pm",
  announcement: "Welcome to GreenGene Pharma · Empower Your Wellness, Live Better",
  shippingFlat: "6500",
  freeShippingThreshold: "75000",

  heroBadge: "Research · Quality · Trust",
  heroHeading: "Empower Your Wellness, Live Better.",
  heroSubheading:
    "Empowering your journey to holistic well-being with our premium natural health solutions.",
  heroPrimaryLabel: "Shop all products",
  heroPrimaryLink: "/products",
  heroSecondaryLabel: "View promotions",
  heroSecondaryLink: "/promotions",
  heroImage: "",
  feat1Title: "100% Natural", feat1Text: "Premium plant-based formulas",
  feat2Title: "SAHPRA-Approved Facility", feat2Text: "Manufactured to high standards",
  feat3Title: "Research-Backed", feat3Text: "Clinically studied ingredients",
  feat4Title: "Fast Delivery", feat4Text: "Across South Africa",
  rqtHeading: "Research, Quality & Trust",
  rqtBody:
    "GreenGene products are thoughtfully developed by a team of expert researchers, utilising the highest-quality ingredients and showcasing unique, innovative formulations. Each product is backed by rigorous science and research, setting us apart from the rest.\n\nWhat sets us apart is our transparency — our ingredients are fully disclosed with precise dosages clearly stated, and every product is manufactured in a SAHPRA-approved facility under ethical practices.",
  rqtButtonLabel: "Explore our range",
  rqtButtonLink: "/products",
  rqtStat1Key: "100%", rqtStat1Val: "Natural ingredients",
  rqtStat2Key: "Full", rqtStat2Val: "Dosage transparency",
  rqtStat3Key: "SAHPRA", rqtStat3Val: "Approved facility",

  marqueeEnabled: "0",
  marqueeText: "🎉 Free shipping on orders over R1000 · Use code WELCOME10 for 10% off your first order",
  marqueeSpeed: "30",
};

/** Parse shipping settings into cents numbers for calculations. */
export async function getShippingConfig(): Promise<{ flat: number; threshold: number }> {
  const s = await getSettings();
  return {
    flat: parseInt(s.shippingFlat, 10) || 0,
    threshold: parseInt(s.freeShippingThreshold, 10) || 0,
  };
}

export async function getSettings(): Promise<SiteSettings> {
  try {
    const rows = await prisma.setting.findMany();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULT_SETTINGS, ...map } as SiteSettings;
  } catch {
    // DB unavailable (e.g. during build prerender) — fall back to defaults
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(values: Partial<SiteSettings>): Promise<void> {
  await Promise.all(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );
}
