import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getSettings } from "@/lib/settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader announcement={settings.announcement} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
