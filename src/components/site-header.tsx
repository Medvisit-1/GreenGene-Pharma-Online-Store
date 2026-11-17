"use client";

import { ModeChooser, ModeToggle } from "@/components/night/mode";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Heart, LayoutGrid, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { SearchOverlay } from "@/components/search-overlay";
import { GIcon } from "@/components/garden/art";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/combos", label: "Combos" },
  { href: "/promotions", label: "Offers" },
  { href: "/wellness", label: "Wellness" },
  { href: "/account?tab=rewards", label: "Rewards" },
];

function isActive(pathname: string, href: string) {
  const path = href.split("?")[0];
  return path === "/" ? pathname === "/" : pathname.startsWith(path) && !href.includes("?");
}

/** True after hydration (the cart count lives in the browser). */
const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

function useHeaderCounts(signedIn?: boolean) {
  const mounted = useMounted();
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const loadWishlist = useWishlist((s) => s.load);
  const saved = useWishlist((s) => (s.signedIn ? s.ids.length : 0));
  useEffect(() => loadWishlist(signedIn), [loadWishlist, signedIn]);
  return { cart: mounted ? count : 0, saved };
}

export function SiteHeader({ announcement, signedIn }: { announcement?: string; signedIn?: boolean }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const openCart = useCart((s) => s.open);
  const { cart, saved } = useHeaderCounts(signedIn);

  return (
    <>
      {/* Desktop: full header with tabs. Phones and tablets: a slim bar (logo, search, cart);
          the menu lives in the bottom tab bar (BottomNav). */}
      <header className="gg-header">
        <div className="gg-wrap gg-header-row">
          <Logo height={46} className="shrink-0" />

          <nav className="gg-tabs" aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={cn(isActive(pathname, item.href) && "on")} aria-current={isActive(pathname, item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="gg-hicons">
            <ModeToggle className="gg-hicon gg-d-only" />
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search products" className="gg-hicon">
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>
            <Link href="/account" aria-label="My account" title="Sign in / My account" className="gg-hicon gg-d-only">
              <User className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link href="/account?tab=wishlist" aria-label={saved ? `Wishlist (${saved} saved)` : "Wishlist"} title="Wishlist" className="gg-hicon gg-d-only">
              <Heart className="h-5 w-5" aria-hidden="true" />
              {saved > 0 && <span className="gg-dot">{saved}</span>}
            </Link>
            <button type="button" onClick={openCart} aria-label={cart ? `View cart (${cart} items)` : "View cart"} className="gg-hicon">
              <ShoppingBag className="h-5 w-5" aria-hidden="true" />
              {cart > 0 && <span className="gg-dot">{cart}</span>}
            </button>
          </div>
        </div>

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>
    </>
  );
}

/** Menu items that live in the phone "More" sheet (everything not in the tab bar itself). */
const SHEET = [
  { href: "/combos", label: "Combos" },
  { href: "/promotions", label: "Offers" },
  { href: "/wellness", label: "Wellness" },
  { href: "/account?tab=wishlist", label: "Wishlist" },
  { href: "/faqs", label: "FAQs" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

/** The one phone/tablet navigation: a bottom tab bar (hidden from 1024px, where the header tabs show). */
export function BottomNav({ signedIn }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const { saved } = useHeaderCounts(signedIn);
  const [tab, setTab] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreBtn = useRef<HTMLButtonElement>(null);

  // the account page switches tabs with ?tab=..., which only the browser knows after hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the query string after navigation
    setTab(new URLSearchParams(window.location.search).get("tab") ?? "");
    setMoreOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMoreOpen(false);
        moreBtn.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    sheetRef.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  const onAccount = pathname.startsWith("/account") || pathname.startsWith("/orders");
  const rewardsOn = (pathname.startsWith("/account") && tab === "rewards") || pathname.startsWith("/rewards");
  const accountOn = onAccount && tab !== "rewards" && tab !== "wishlist";
  const moreOn =
    moreOpen ||
    SHEET.some((i) => !i.href.includes("?") && pathname.startsWith(i.href)) ||
    (pathname.startsWith("/account") && tab === "wishlist");

  const items = [
    { href: "/", label: "Home", icon: <GIcon name="home" size={22} />, on: pathname === "/" },
    { href: "/products", label: "Shop", icon: <GIcon name="leaf" size={22} />, on: pathname.startsWith("/products") },
    { href: "/account?tab=rewards", label: "Rewards", icon: <GIcon name="gift" size={22} />, on: rewardsOn },
    { href: "/account", label: "Account", icon: <User className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden="true" />, on: accountOn },
  ];

  return (
    <>
      <nav className="gg-bottomnav" aria-label="Main">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className={cn(i.on && !moreOpen && "on")} aria-current={i.on && !moreOpen ? "page" : undefined} onClick={() => setMoreOpen(false)}>
            {i.icon}
            <span>{i.label}</span>
          </Link>
        ))}
        <button
          ref={moreBtn}
          type="button"
          className={cn(moreOn && "on")}
          aria-expanded={moreOpen}
          aria-controls="gg-more-sheet"
          onClick={() => setMoreOpen((v) => !v)}
        >
          {moreOpen ? <X className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden="true" /> : <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden="true" />}
          <span>More</span>
          {saved > 0 && !moreOpen && <span className="gg-dot" aria-hidden="true">{saved}</span>}
        </button>
      </nav>

      {moreOpen && (
        <>
          <button type="button" className="gg-sheet-scrim" aria-label="Close menu" tabIndex={-1} onClick={() => setMoreOpen(false)} />
          <div id="gg-more-sheet" ref={sheetRef} className="gg-sheet" role="dialog" aria-modal="true" aria-label="More">
            <nav aria-label="More pages" className="gg-sheet-links">
              {SHEET.map((i) => (
                <Link key={i.href} href={i.href} onClick={() => setMoreOpen(false)}>
                  {i.label}
                  {i.label === "Wishlist" && saved > 0 && <span className="gg-sheet-count">{saved}</span>}
                </Link>
              ))}
            </nav>
            <div className="gg-sheet-theme">
              <span id="gg-theme-label">Theme</span>
              <ModeChooser />
            </div>
          </div>
        </>
      )}
    </>
  );
}
