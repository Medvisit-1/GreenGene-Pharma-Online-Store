import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { getBusinessIdentity, h, LEGAL_UPDATED } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Refund Policy" };

export default async function RefundPolicyPage() {
  const id = await getBusinessIdentity();
  const html = `
<p>This policy explains how to return a product, cancel an order or get a refund. <strong>Nothing in it limits your rights under the Consumer Protection Act, 2008 (CPA) or the Electronic Communications and Transactions Act, 2002 (ECTA).</strong></p>

<h2>1. Cancelling an order</h2>
<p>The provision of goods and services by GreenGene Pharma is subject to availability. You can cancel an order at any time before it is dispatched — email us with your order number and we will refund you in full.</p>

<h2>2. Seven-day cooling-off period</h2>
<p>Under section 44 of ECTA you may cancel an online purchase within <strong>seven (7) days</strong> of receiving the goods, without giving a reason and without penalty (subject to the exceptions in section 42 of ECTA). The only cost to you is the direct cost of returning the goods to us. To protect the health of other customers, we ask that products are returned unopened and in their original sealed packaging where possible; this does not reduce your statutory rights.</p>

<h2>3. Our 7-day satisfaction guarantee</h2>
<p>All products are sold with a 7 day satisfaction guarantee. Unopened, sealed products can be returned within seven (7) days for a refund, though return shipping costs are the customer's responsibility. If you have opened a product and are unhappy with it, let us know — we will pass your feedback to the supplier and work with you on a fair outcome. This guarantee is in addition to your rights for defective goods in section 5.</p>

<h2>4. Damaged in transit or wrong product</h2>
<ul>
  <li><strong>Damaged items:</strong> please notify us within two (2) working days of receiving damaged or broken items, with photos if possible, so that we can claim from the courier. We will arrange either a replacement or a full refund at our expense.</li>
  <li><strong>Wrong product:</strong> please contact us within one (1) working day of receiving an incorrect item. If a picking error occurred, we will exchange the wrong product for the correct one at no cost to you.</li>
</ul>
<p>These timeframes help us resolve problems quickly; if you contact us later, your rights in section 5 still apply.</p>

<h2>5. Defective goods — six-month warranty</h2>
<p>Under section 56 of the CPA, every product carries an implied warranty of quality for <strong>six (6) months</strong> after delivery. If a product is defective, unsafe or not as described — and you have used it as directed — you may return it at our risk and expense, and choose whether you would like it replaced or your money refunded.</p>

<h2>6. How to return a product</h2>
<ol>
  <li>Email <a href="mailto:${h(id.email)}">${h(id.email)}</a> with your order number, the product and the reason.</li>
  <li>We will reply with the return address and arrangements (we arrange collection for damaged, wrong or defective items).</li>
  <li>Once we receive and check the return, we will refund you.</li>
</ol>

<h2>7. Refunds</h2>
<p>Refunds are paid to the original payment method within <strong>30 days</strong> of us receiving the returned goods (or of your cancellation, if the goods were not dispatched). Delivery fees are refunded where the return is because of our error, a defect or a cancellation before dispatch.</p>

<h2>8. Contact</h2>
<p>For any returns or refund queries, email us at <a href="mailto:${h(id.email)}">${h(id.email)}</a>${id.phone ? ` or call ${h(id.phone)}` : ""}.</p>
`;
  return <LegalLayout title="Refund Policy" updated={LEGAL_UPDATED} html={html} />;
}
