import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { MarqueeBar } from "@/components/marquee-bar";
import { cookies } from "next/headers";
import { getSettings } from "@/lib/settings";
import { REF_COOKIE, lookupReferral } from "@/lib/rewards";
import { ReferralBanner } from "@/components/referral-banner";
import { REF_BANNER_HIDE_COOKIE } from "@/lib/constants";

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
    <div className="flex min-h-full flex-col">
      {settings.marqueeEnabled === "1" && (
        <MarqueeBar text={settings.marqueeText} speed={Number(settings.marqueeSpeed)} />
      )}
      {showReferral && <ReferralBanner name={referral.name} code={referral.code} />}
      <SiteHeader announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
