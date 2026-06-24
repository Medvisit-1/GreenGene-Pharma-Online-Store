import { Toaster } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { MarqueeBar } from "@/components/marquee-bar";
import { getSettings } from "@/lib/settings";

// Storefront reads live settings from the DB, so render at request time
// (not at build, where the database isn't reachable).
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-full flex-col">
      {settings.marqueeEnabled === "1" && (
        <MarqueeBar text={settings.marqueeText} speed={Number(settings.marqueeSpeed)} />
      )}
      <SiteHeader announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CartDrawer />
      <Toaster position="bottom-right" richColors closeButton />
    </div>
  );
}
