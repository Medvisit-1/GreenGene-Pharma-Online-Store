import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { getSettings } from "@/lib/settings";
import { businessIdentity } from "@/lib/legal";
import { rewardHighlights, shortDiscount } from "@/lib/rewards";
import { Petals, Sprig } from "@/components/garden/art";
import { JoinForm } from "@/components/garden/join-form";

export async function SiteFooter() {
  const [settings, rewards] = await Promise.all([getSettings(), rewardHighlights()]);
  const id = businessIdentity(settings);
  const welcome = rewards?.welcome;
  return (
    <footer className="gg-footer">
      <Petals colors={["var(--g-plum3)", "var(--g-plum-soft)"]} leaf="var(--g-leaf2)" count={12} height={760} />
      <Sprig kind="green" style={{ left: -20, bottom: -30, width: 180, transform: "rotate(10deg)", opacity: 0.6 }} />
      <Sprig kind="plum" style={{ right: -10, top: -20, width: 170, transform: "rotate(190deg)", opacity: 0.8 }} />

      <div className="gg-wrap">
        <div className="band">
          <div>
            <div className="gg-script">Join today.<br />Start saving.</div>
            <p className="mt-2">
              Wellness Notes twice a week
              {welcome ? <>, plus {shortDiscount(welcome)} off when you join.*</> : "."}
            </p>
          </div>
          <JoinForm />
        </div>

        <div className="cols">
          <div>
            <span className="logo-chip"><Logo height={44} /></span>
            <p className="mt-4 max-w-xs text-sm">
              The finest selection of natural health products for you and your family — empowering your journey to
              holistic well-being.
            </p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><Link href="/products">All products</Link></li>
              <li><Link href="/combos">Combos</Link></li>
              <li><Link href="/promotions">Offers</Link></li>
              <li><Link href="/wellness">Wellness Notes</Link></li>
              <li><Link href="/account?tab=rewards">Rewards</Link></li>
            </ul>
          </div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/contact">Contact us</Link></li>
              <li><Link href="/faqs">FAQs</Link></li>
              <li><Link href="/shipping-policy">Shipping policy</Link></li>
              <li><Link href="/refund-policy">Refund policy</Link></li>
              <li><Link href="/privacy-policy">Privacy policy</Link></li>
              <li><Link href="/terms-of-service">Terms of service</Link></li>
              <li><Link href="/rewards-terms">Rewards T&amp;Cs</Link></li>
            </ul>
          </div>
          <div>
            <h4>Get in touch</h4>
            <ul>
              <li className="flex items-center gap-2.5"><Phone className="h-4 w-4 shrink-0 text-[var(--g-gold)]" /> {settings.contactPhone}</li>
              <li className="flex items-center gap-2.5"><Mail className="h-4 w-4 shrink-0 text-[var(--g-gold)]" /> {settings.contactEmail}</li>
              <li className="flex items-start gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--g-gold)]" /> {settings.contactAddress}</li>
            </ul>
          </div>
        </div>

        <div className="legal">
          <p className="text-[11px] leading-relaxed opacity-80">
            Our products are not intended to diagnose, treat, cure or prevent any disease. Information on this
            website is not medical advice — consult your healthcare practitioner before use, especially if you are
            pregnant, breastfeeding, taking medication or have a medical condition.
          </p>
          <div className="row">
            <span>
              © {new Date().getFullYear()} {id.legalName}
              {id.regNo ? ` · Reg. No. ${id.regNo}` : ""}
              {id.vatNo ? ` · VAT No. ${id.vatNo}` : ""} · Prices in ZAR incl. VAT where applicable
            </span>
            {welcome && (
              <span>*Valid for new subscribers. <Link href="/rewards-terms" className="underline">Terms &amp; Conditions apply</Link>.</span>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
