import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { getSettings } from "@/lib/settings";

export async function SiteFooter() {
  const settings = await getSettings();
  return (
    <footer className="mt-20 bg-header text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo height={48} />
          <p className="max-w-xs text-sm text-white/70">
            Dedicated to providing you and your family with the finest selection
            of natural health products — empowering your journey to holistic
            well-being.
          </p>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-accent">
            Shop
          </h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link href="/products" className="hover:text-white">All Products</Link></li>
            <li><Link href="/promotions" className="hover:text-white">Promotions</Link></li>
            <li><Link href="/products?featured=1" className="hover:text-white">Featured</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-accent">
            Company
          </h4>
          <ul className="space-y-2.5 text-sm text-white/70">
            <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            <li><Link href="/account" className="hover:text-white">My Account</Link></li>
            <li><Link href="/shipping" className="hover:text-white">Shipping &amp; Returns</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-accent">
            Get in touch
          </h4>
          <ul className="space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 text-accent" /> {settings.contactPhone}
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 text-accent" /> {settings.contactEmail}
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 text-accent" /> {settings.contactAddress}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-white/60 sm:flex-row">
          <p>© {new Date().getFullYear()} GreenGene Pharma. All rights reserved.</p>
          <p>Prices in South African Rand (ZAR).</p>
        </div>
      </div>
    </footer>
  );
}
