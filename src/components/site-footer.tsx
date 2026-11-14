import Link from "next/link";
import { Logo } from "@/components/logo";
import { getSettings } from "@/lib/settings";
import { businessIdentity } from "@/lib/legal";
import { rewardHighlights, shortDiscount } from "@/lib/rewards";
import { JoinForm } from "@/components/garden/join-form";

const BRANCH = "M60 215c-30-10-45-35-40-70 30 12 45 35 40 70ZM110 160c-32-6-50-30-50-66 32 8 50 32 50 66ZM165 110c-30-2-52-22-58-56 32 2 54 22 58 56ZM225 66c-28 2-50-12-62-42 30-4 52 12 62 42ZM85 195c8-30 32-48 68-46-8 32-32 48-68 46ZM140 140c6-30 28-50 64-52-6 32-28 50-64 52ZM200 92c2-28 20-48 54-58 0 32-20 52-54 58Z";

/** Rust editorial footer (approved homepage design), shared by every storefront page. */
export async function SiteFooter() {
  const [settings, rewards] = await Promise.all([getSettings(), rewardHighlights()]);
  const id = businessIdentity(settings);
  const welcome = rewards?.welcome;
  const tel = settings.contactPhone?.replace(/[^\d+]/g, "");
  return (
    <footer className="gg-footer">
      <svg className="branch b-tl" viewBox="0 0 300 300" aria-hidden="true"><path d="M10 290C60 200 130 120 290 20" /><path d={BRANCH} /></svg>
      <svg className="branch b-br" viewBox="0 0 300 300" aria-hidden="true"><path d="M10 290C60 200 130 120 290 20" /><path d={BRANCH} /></svg>
      <div className="motes" aria-hidden="true"><i className="cap" /><i className="lf" /><i className="cap" /><i className="lf" /><i className="cap" /><i className="lf" /></div>

      <div className="gg-wrap">
        <div className="band">
          <h2>Join today.<br />Start saving.</h2>
          <div className="join-side">
            <p>Wellness Notes twice a week{welcome ? <>, plus <b>{shortDiscount(welcome)}</b> off when you join.*</> : "."}</p>
            <JoinForm />
          </div>
        </div>

        <div className="cols">
          <div className="foot-brand">
            <Logo height={56} />
            <p>The finest selection of natural health products for you and your family — empowering your journey to holistic well-being.</p>
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
              {settings.contactPhone && <li>{tel ? <a href={`tel:${tel}`}>{settings.contactPhone}</a> : settings.contactPhone}</li>}
              {settings.contactEmail && <li><a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a></li>}
              {settings.contactAddress && <li>{settings.contactAddress}</li>}
            </ul>
          </div>
        </div>

        <p className="disclaimer">
          Our products are not intended to diagnose, treat, cure or prevent any disease. Information on this
          website is not medical advice — consult your healthcare practitioner before use, especially if you are
          pregnant, breastfeeding, taking medication or have a medical condition.
        </p>
        <p className="legal">
          © {new Date().getFullYear()} {id.legalName}
          {id.regNo ? ` · Reg. No. ${id.regNo}` : ""}
          {id.vatNo ? ` · VAT No. ${id.vatNo}` : ""} · Prices in ZAR incl. VAT where applicable
          {welcome && <><br />*Valid for new subscribers. <Link href="/rewards-terms">Terms &amp; Conditions apply</Link>.</>}
        </p>
      </div>
    </footer>
  );
}
