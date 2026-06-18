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
};

export const DEFAULT_SETTINGS: SiteSettings = {
  contactPhone: "+27 (0)11 000 0000",
  contactEmail: "info@greengenepharma.co.za",
  contactAddress: "Johannesburg, South Africa",
  contactHours: "Mon–Fri: 8am – 6pm · Sat: 8am – 1pm",
  announcement: "Welcome to GreenGene Pharma · Empower Your Wellness, Live Better",
  shippingFlat: "6500",
  freeShippingThreshold: "75000",
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
  const rows = await prisma.setting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...map } as SiteSettings;
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
