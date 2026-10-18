import { Suspense } from "react";
import Image from "next/image";
import { Toaster } from "sonner";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { AdminToast } from "@/components/admin/admin-toast";
import { GardenDefs, Sprig } from "@/components/garden/art";
import { gardenFonts } from "@/components/garden/fonts";
import { logoutAction } from "@/app/admin/actions";
import { getSettings } from "@/lib/settings";
import { resolveAdminTheme, themeStyle } from "@/lib/themes";
import "@/components/garden/tokens.css";
import "../admin.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Admin", template: "%s · GreenGene Admin" },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  const [settings, reviews, voice, fulfil] = await Promise.all([
    getSettings(),
    prisma.review.count({ where: { status: "pending" } }),
    prisma.contactMessage.count({ where: { handled: false } }).catch(() => 0),
    prisma.order.count({ where: { paymentStatus: "paid", status: "unfulfilled" } }),
  ]);
  const counts = { reviews, voice, fulfil };

  return (
    // The admin's colour theme (Admin → Appearance): its own, or the shop's
    <div
      className={`gg-admin ${gardenFonts} flex min-h-screen`}
      style={themeStyle(resolveAdminTheme(settings).colors) as React.CSSProperties}
    >
      <GardenDefs />
      {/* Sidebar */}
      <aside className="gg-side hidden md:flex print:hidden!">
        <div className="gg-side-logo">
          <Image src="/logo.png" alt="GreenGene Pharma" width={1547} height={756} className="h-10 w-auto" priority />
        </div>
        <AdminNav counts={counts} />
        <form action={logoutAction} className="relative z-10 mt-2 border-t border-white/10 pt-2">
          <button>
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
        <Sprig kind="plum" style={{ right: -40, bottom: -40, width: 150, transform: "rotate(-14deg)" }} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="gg-admin-top md:hidden print:hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <span className="rounded-2xl bg-[color:var(--g-cream)] px-3 py-1.5">
              <Image src="/logo.png" alt="GreenGene Pharma" width={1547} height={756} className="h-7 w-auto" />
            </span>
            <form action={logoutAction}>
              <button className="rounded-full p-2 text-white/80 hover:bg-white/10" aria-label="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          </div>
          <AdminNav counts={counts} compact />
        </header>

        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-8 print:p-0">{children}</main>
      </div>

      <Toaster position="bottom-right" richColors closeButton />
      <Suspense>
        <AdminToast />
      </Suspense>
    </div>
  );
}
