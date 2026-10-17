import { Toaster } from "sonner";
import { SiteHeader, BottomNav } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { MarqueeBar } from "@/components/marquee-bar";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/settings";
import { REF_COOKIE, lookupReferral } from "@/lib/rewards";
import { ReferralBanner } from "@/components/referral-banner";
import { REF_BANNER_HIDE_COOKIE } from "@/lib/constants";
import { CUSTOMER_COOKIE } from "@/lib/customer-auth";
import { CartSync } from "@/components/cart-sync";
import { GardenDefs } from "@/components/garden/art";
import { GardenMotion } from "@/components/garden/motion";
import { gardenFonts } from "./fonts";
import "./garden.css";

// Storefront reads live settings from the DB, so render at request time
// (not at build, where the database isn't reachable).
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const [settings, referral] = await Promise.all([
    getSettings(),
    lookupReferral(jar.get(REF_COOKIE)?.value),
  ]);
  const showReferral = referral && jar.get(REF_BANNER_HIDE_COOKIE)?.value !== referral.code;
  return (
    <div className={`gg-theme ${gardenFonts} flex min-h-full flex-col`}>
      <GardenDefs />
      {settings.marqueeEnabled === "1" && (
        <MarqueeBar text={settings.marqueeText} speed={Number(settings.marqueeSpeed)} />
      )}
      {showReferral && <ReferralBanner name={referral.name} code={referral.code} />}
      <SiteHeader announcement={settings.announcement} signedIn={jar.has(CUSTOMER_COOKIE)} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <BottomNav signedIn={jar.has(CUSTOMER_COOKIE)} />
      <GardenMotion />
      <CartDrawer />
      {jar.has(CUSTOMER_COOKIE) && <CartSync />}
      <Toaster position="bottom-right" richColors closeButton mobileOffset={{ bottom: 96 }} />
    </div>
  );
}
