import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = { title: "Refund Policy" };

const html = `
<h2>Return and Refunds Policy</h2>

<h3>Availability &amp; Cancellation</h3>
<p>The provision of goods and services by GreenGene Pharma is subject to availability. Orders may be cancelled before payment is processed, or before dispatch after payment is made.</p>

<h3>Damaged Products</h3>
<p>Customers must notify GreenGene Pharma within two (2) working days of receiving damaged or broken items. We will arrange either a replacement or a full refund at our expense.</p>

<h3>Satisfaction Guarantee</h3>
<p>All products are sold with a 7 day satisfaction guarantee. Unopened, sealed products can be returned within seven (7) days for a refund, though return shipping costs are the customer's responsibility. For opened or used products, your feedback is forwarded to the supplier, whose response determines any remedy.</p>

<h3>Wrong Product</h3>
<p>Customers must contact GreenGene Pharma within one (1) working day of receiving an incorrect item. If a picking error occurred, we will exchange the wrong product for the correct one at no cost to the customer.</p>

<h2>Contact</h2>
<p>For any returns or refund queries, email us at <a href="mailto:info@greengenepharma.co.za">info@greengenepharma.co.za</a>.</p>
`;

export default function RefundPolicyPage() {
  return <LegalLayout title="Refund Policy" html={html} />;
}
