import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "@/components/admin-nav";
import { logoutAction } from "@/app/admin/actions";

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
  const pendingReviews = await prisma.review.count({ where: { status: "pending" } });

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-header p-4 md:flex">
        <div className="mb-6 px-2 pt-2">
          <Image src="/logo.png" alt="GreenGene Pharma" width={1547} height={756} className="h-9 w-auto" />
        </div>
        <AdminNav pendingReviews={pendingReviews} />
        <form action={logoutAction} className="mt-auto">
          <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </form>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 bg-header px-4 py-3 md:hidden">
          <Image src="/logo.png" alt="GreenGene Pharma" width={1547} height={756} className="h-8 w-auto" />
          <form action={logoutAction}>
            <button className="rounded-lg p-2 text-white/80 hover:bg-white/10">
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </header>
        <div className="md:hidden">
          <div className="overflow-x-auto bg-header px-2 pb-3">
            <div className="min-w-max">
              <AdminNav pendingReviews={pendingReviews} />
            </div>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
