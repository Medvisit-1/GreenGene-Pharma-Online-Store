"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { SearchOverlay } from "@/components/search-overlay";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/promotions", label: "Promotions" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader({ announcement }: { announcement?: string }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const openCart = useCart((s) => s.open);
  useEffect(() => setMounted(true), []);

  const iconBtn =
    "relative rounded-full p-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white";

  return (
    <header className="sticky top-0 z-40">
      {/* Announcement bar (taupe) */}
      <div className="bg-background text-center text-xs font-medium text-brand-800">
        <div className="mx-auto max-w-7xl px-4 py-2">
          {announcement ?? "Welcome to GreenGene Pharma · Empower Your Wellness, Live Better"}
        </div>
      </div>

      {/* Main bar (black) */}
      <div className="bg-header text-white">
        <div className="mx-auto grid h-20 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
          {/* Left: nav (desktop) / hamburger (mobile) */}
          <div className="flex items-center">
            <nav className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              aria-label="Toggle menu"
              onClick={() => setOpen((v) => !v)}
              className={cn(iconBtn, "md:hidden")}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Center: logo */}
          <div className="flex justify-center">
            <Logo height={52} priority className="shrink-0" />
          </div>

          {/* Right: icons */}
          <div className="flex items-center justify-end gap-1">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search products" className={cn(iconBtn, "hidden sm:inline-flex")}>
              <Search className="h-5 w-5" />
            </button>
            <Link href="/account" aria-label="My account" className={cn(iconBtn, "hidden sm:inline-flex")}>
              <User className="h-5 w-5" />
            </Link>
            <button type="button" onClick={openCart} aria-label="View cart" className={iconBtn}>
              <ShoppingBag className="h-5 w-5" />
              {mounted && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-bold text-brand-900">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={cn(
            "overflow-hidden border-t border-white/10 bg-header md:hidden",
            open ? "max-h-72" : "max-h-0 border-t-0"
          )}
          style={{ transition: "max-height 0.25s ease" }}
        >
          <nav className="flex flex-col gap-1 px-4 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
            >
              My account
            </Link>
          </nav>
        </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
