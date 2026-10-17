"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
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

const MORE = [
  { href: "/account", label: "My account" },
  { href: "/account?tab=wishlist", label: "Wishlist" },
  { href: "/faqs", label: "FAQs" },
  { href: "/contact", label: "Contact" },
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
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const openCart = useCart((s) => s.open);
  const { cart, saved } = useHeaderCounts(signedIn);

  return (
    <>
      <div className="gg-announce">
        {announcement ?? "Welcome to GreenGene Pharma · Empower Your Wellness, Live Better"}
      </div>
      <header className="gg-header">
        <div className="gg-wrap gg-header-row">
          <Logo height={46} priority className="shrink-0" />

          <nav className="gg-tabs" aria-label="Main">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className={cn(isActive(pathname, item.href) && "on")}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="gg-hicons">
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search products" className="gg-hicon">
              <Search className="h-5 w-5" />
            </button>
            <Link href="/account" aria-label="My account" className="gg-hicon gg-sm-up">
              <User className="h-5 w-5" />
            </Link>
            <Link href="/account?tab=wishlist" aria-label={saved ? `Wishlist (${saved} saved)` : "Wishlist"} title="Wishlist" className="gg-hicon">
              <Heart className="h-5 w-5" />
              {saved > 0 && <span className="gg-dot">{saved}</span>}
            </Link>
            <button type="button" onClick={openCart} aria-label="View cart" className="gg-hicon">
              <ShoppingBag className="h-5 w-5" />
              {cart > 0 && <span className="gg-dot">{cart}</span>}
            </button>
            <button type="button" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className="gg-hicon gg-only-m">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className={cn("gg-mobile-menu gg-only-m", open ? "max-h-[32rem]" : "max-h-0")}>
          <nav className="gg-wrap grid gap-1 pb-4" aria-label="Menu">
            {[...NAV, ...MORE].map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </header>
    </>
  );
}

/** Thumb-reach navigation for phones and tablets. */
export function BottomNav({ signedIn }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const openCart = useCart((s) => s.open);
  const { cart, saved } = useHeaderCounts(signedIn);
  return (
    <nav className="gg-bottomnav" aria-label="Quick links">
      <Link href="/" className={cn(pathname === "/" && "on")}><GIcon name="home" size={22} />Home</Link>
      <Link href="/products" className={cn(pathname.startsWith("/products") && "on")}><GIcon name="leaf" size={22} />Shop</Link>
      <Link href="/account?tab=wishlist">
        <GIcon name="heart" size={22} />Saved
        {saved > 0 && <span className="gg-dot">{saved}</span>}
      </Link>
      <Link href="/account?tab=rewards"><GIcon name="gift" size={22} />Rewards</Link>
      <button type="button" onClick={openCart}>
        <GIcon name="bag" size={22} />Cart
        {cart > 0 && <span className="gg-dot">{cart}</span>}
      </button>
    </nav>
  );
}
