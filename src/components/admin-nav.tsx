"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Star,
  Settings,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/promotions", label: "Promotions", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ pendingReviews = 0 }: { pendingReviews?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/15 text-white"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            )}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
            {l.href === "/admin/reviews" && pendingReviews > 0 && (
              <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-brand-900">
                {pendingReviews}
              </span>
            )}
          </Link>
        );
      })}
      <Link
        href="/"
        target="_blank"
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white"
      >
        <ExternalLink className="h-4 w-4" />
        View store
      </Link>
    </nav>
  );
}
