"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Star,
  CreditCard,
  Settings,
  LayoutTemplate,
  FileText,
  Boxes,
  Gift,
  Mail,
  Users,
  BarChart3,
  CircleHelp,
  TrendingUp,
  MessagesSquare,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Package; exact?: boolean; badge?: "reviews" | "voice" | "fulfil" };

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/insights", label: "Insights & trends", icon: TrendingUp },
      { href: "/admin/voice", label: "Customer voice", icon: MessagesSquare, badge: "voice" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ShoppingCart, badge: "fulfil" },
      { href: "/admin/customers", label: "Customers", icon: Users },
      { href: "/admin/reports", label: "Sales report", icon: BarChart3 },
      { href: "/admin/invoices", label: "Invoicing", icon: FileText },
      { href: "/admin/wholesale", label: "Wholesale", icon: Boxes },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { href: "/admin/products", label: "Products", icon: Package },
      { href: "/admin/reviews", label: "Reviews", icon: Star, badge: "reviews" },
      { href: "/admin/faqs", label: "FAQs", icon: CircleHelp },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/promotions", label: "Promotions", icon: Tag },
      { href: "/admin/rewards", label: "Rewards", icon: Gift },
      { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    ],
  },
  {
    title: "Store",
    items: [
      { href: "/admin/front-shop", label: "Homepage", icon: LayoutTemplate },
      { href: "/admin/appearance", label: "Appearance", icon: Palette },
      { href: "/admin/payments", label: "Payment gateways", icon: CreditCard },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export type NavCounts = { reviews: number; voice: number; fulfil: number };

export function AdminNav({ counts, compact = false }: { counts: NavCounts; compact?: boolean }) {
  const pathname = usePathname();

  const link = (l: Item) => {
    const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
    const n = l.badge ? counts[l.badge] : 0;
    return (
      <Link key={l.href} href={l.href} className={cn(active && "on")} aria-current={active ? "page" : undefined}>
        <l.icon className="h-4 w-4 shrink-0" />
        {l.label}
        {n > 0 && <span className="badge">{n}</span>}
      </Link>
    );
  };

  if (compact) {
    return <nav className="gg-side-nav" aria-label="Admin">{GROUPS.flatMap((g) => g.items).map(link)}</nav>;
  }

  return (
    <nav className="gg-side-nav" aria-label="Admin">
      {GROUPS.map((g) => (
        <div key={g.title} className="mb-2">
          <p className="mb-0.5 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-[color:var(--g-gold)]/80">{g.title}</p>
          <div className="grid gap-0.5">{g.items.map(link)}</div>
        </div>
      ))}
    </nav>
  );
}
