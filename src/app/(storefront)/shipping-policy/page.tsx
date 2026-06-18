import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = { title: "Shipping Policy" };

const html = `
<h2>Shipping / Delivery Policy</h2>
<p>Subject to availability and receipt of payment, orders will be processed within 1–2 working days.</p>
<p>All orders are dispatched via reputable local delivery service providers. A delivery being delayed is not grounds for return or refund.</p>
<p>You accept that, in order for us to prove delivery of an order, we do not have to prove that you personally received the goods, but rather that any person at the delivery address signed for the delivery.</p>

<h2>Contact</h2>
<p>For any delivery queries, email us at <a href="mailto:info@greengenepharma.co.za">info@greengenepharma.co.za</a>.</p>
`;

export default function ShippingPolicyPage() {
  return <LegalLayout title="Shipping Policy" html={html} />;
}
