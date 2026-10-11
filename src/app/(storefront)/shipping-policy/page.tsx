import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { getSettings } from "@/lib/settings";
import { businessIdentity, h, LEGAL_UPDATED } from "@/lib/legal";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shipping Policy" };

export default async function ShippingPolicyPage() {
  const s = await getSettings();
  const id = businessIdentity(s);
  const flat = parseInt(s.shippingFlat, 10) || 0;
  const free = parseInt(s.freeShippingThreshold, 10) || 0;

  const html = `
<h2>1. Where we deliver</h2>
<p>We deliver to addresses within South Africa through reputable local courier services.</p>

<h2>2. Delivery costs</h2>
<p>${flat > 0 ? `Standard delivery costs ${h(formatPrice(flat))} per order` : "Standard delivery is free"}${free > 0 && flat > 0 ? `, and is <strong>free on orders of ${h(formatPrice(free))} or more</strong>` : ""}. The delivery fee is always shown at checkout before you pay.</p>

<h2>3. Processing and delivery times</h2>
<p>Subject to availability and receipt of payment, orders will be processed within 1–2 working days. Once dispatched, delivery usually takes a few working days depending on your location; we will email you tracking details when they are available. If we cannot deliver within 30 days of your order, we will let you know and you may cancel for a full refund.</p>
<p><strong>A delivery that is delayed by the courier is not, on its own, grounds for a return or refund</strong>, but if your order has not arrived when expected, contact us and we will follow it up with the courier.</p>

<h2>4. Proof of delivery</h2>
<p><strong>You accept that, in order for us to prove delivery of an order, we do not have to prove that you personally received the goods, but rather that any person at the delivery address signed for the delivery.</strong> Please make sure the address you give is complete and that someone can receive the parcel.</p>

<h2>5. Damaged or missing parcels</h2>
<p>If your parcel arrives damaged or items are missing, please tell us within two (2) working days so we can claim from the courier — see our <a href="/refund-policy">Refund Policy</a>.</p>

<h2>6. Contact</h2>
<p>For any delivery queries, email us at <a href="mailto:${h(id.email)}">${h(id.email)}</a>${id.phone ? ` or call ${h(id.phone)}` : ""}.</p>
`;
  return <LegalLayout title="Shipping Policy" updated={LEGAL_UPDATED} html={html} />;
}
