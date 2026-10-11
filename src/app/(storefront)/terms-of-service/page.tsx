import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { getBusinessIdentity, h, LEGAL_UPDATED } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const id = await getBusinessIdentity();

  const html = `
<p>These terms apply to your use of ${h(id.website)} and to every order you place with us. Please read them, together with our <a href="/refund-policy">Refund Policy</a>, <a href="/shipping-policy">Shipping Policy</a>, <a href="/privacy-policy">Privacy Policy</a> and, if you use our rewards, the <a href="/rewards-terms">Rewards Terms &amp; Conditions</a>. Clauses that limit our liability or place obligations on you are shown in <strong>bold</strong>.</p>

<h2>1. Who we are</h2>
<p>As required by section 43 of the Electronic Communications and Transactions Act, 2002:</p>
<table><tbody>
  <tr><th>Business name</th><td>${h(id.legalName)}${id.legalName !== id.tradingName ? `, trading as ${h(id.tradingName)}` : ""}</td></tr>
  ${id.regNo ? `<tr><th>Registration number</th><td>${h(id.regNo)}</td></tr>` : ""}
  ${id.vatNo ? `<tr><th>VAT number</th><td>${h(id.vatNo)}</td></tr>` : ""}
  <tr><th>Physical address (also our address for legal notices)</th><td>${h(id.address)}</td></tr>
  ${id.phone ? `<tr><th>Telephone</th><td>${h(id.phone)}</td></tr>` : ""}
  <tr><th>Email</th><td><a href="mailto:${h(id.email)}">${h(id.email)}</a></td></tr>
  <tr><th>Website</th><td>${h(id.website)}</td></tr>
  <tr><th>Self-regulatory body / code of conduct</th><td>We do not currently subscribe to an industry code of conduct.</td></tr>
</tbody></table>

<h2>2. Our products</h2>
<p>GreenGene Pharma sells natural health and wellness products. Each product page describes the product, its ingredients and how to use it. Product images are for illustration; packaging may vary.</p>
<p><strong>Information on this website is not medical advice.</strong> Our products are not intended to diagnose, treat, cure or prevent any disease. Read the label before use, do not exceed the recommended dose, and consult a healthcare practitioner before use if you are pregnant or breastfeeding, taking medication or have a medical condition.</p>

<h2>3. Accounts</h2>
<p>You can check out as a guest or create a free account. You sign in with a one-time code sent to your email address, so <strong>keep access to your email account secure</strong> — anyone who can read your email can sign in to your account. You must be 18 or older to create an account or place an order.</p>

<h2>4. Prices and payment</h2>
<ul>
  <li>All prices are in South African Rand (ZAR) and include VAT where applicable. Delivery charges and any discounts are shown at checkout before you pay.</li>
  <li>Payment is made through secure third-party payment gateways (such as Yoco, Bob Pay or Paystack). We do not see or store your full card details.</li>
  <li>If a product is listed at an obviously incorrect price because of an error, we will tell you before dispatch and you may either pay the correct price or cancel for a full refund.</li>
</ul>

<h2>5. Placing an order and the agreement of sale</h2>
<p>Before you pay, the checkout lets you review your order, correct any mistakes and withdraw. An agreement of sale between GreenGene Pharma and a customer is only valid once payment has been made and the company receives proof of payment. Up until this point all goods remain the property of GreenGene Pharma. We confirm successful orders by email. All products are subject to availability; if we cannot supply an item you have paid for, we will tell you and refund you in full within 30 days.</p>

<h2>6. Delivery</h2>
<p>We deliver within South Africa as described in our <a href="/shipping-policy">Shipping Policy</a>. Unless we agree otherwise, we will deliver within 30 days of your order; if we cannot, you may cancel and we will refund you in full.</p>

<h2>7. Cooling-off, returns and defective goods</h2>
<p>You may cancel an online purchase within <strong>seven (7) days</strong> of receiving the goods without giving a reason, as provided for in section 44 of the Electronic Communications and Transactions Act (subject to the exceptions in section 42). The only charge to you is the direct cost of returning the goods, and we will refund you within 30 days. Goods that are defective or not as described are covered by the Consumer Protection Act for six months. Details are in our <a href="/refund-policy">Refund Policy</a>.</p>

<h2>8. Promotions, discount codes and rewards</h2>
<p>Promotions are valid while stocks last and for the period stated. Only one discount code may be used per order. Discount codes have no cash value. Rewards are governed by the <a href="/rewards-terms">Rewards Terms &amp; Conditions</a>.</p>

<h2>9. Reviews</h2>
<p>Reviews must be honest, about the product, and must not be offensive or unlawful. We publish reviews regardless of their rating; we only remove those that break these rules. Verified buyers may receive a reward for reviewing a product they bought — the reward never depends on the rating given.</p>

<h2>10. Statement on advertising compliance</h2>
<p>GreenGene Pharma may modify wording in promotional content to maintain compliance with social media advertising policies and to prevent potential account restrictions. However, products displayed on our official website accurately represent what customers will receive. We remain dedicated to transparency, good faith, and quality standards.</p>

<h2>11. Liability</h2>
<p><strong>To the extent the law allows, we are not liable for indirect or consequential loss arising from the use of our website or products, or for loss caused by using a product other than as directed on its label.</strong> Nothing in these terms limits or excludes any right you have under the Consumer Protection Act, 2008, or any liability that cannot lawfully be limited.</p>

<h2>12. Your personal information</h2>
<p>We handle your personal information in line with the Protection of Personal Information Act, 2013, as explained in our <a href="/privacy-policy">Privacy Policy</a>.</p>

<h2>13. Complaints and disputes</h2>
<p>Please contact us first at <a href="mailto:${h(id.email)}">${h(id.email)}</a> — we aim to respond within 5 business days. If we cannot resolve your complaint, you may refer it to the Consumer Goods and Services Ombud (<a href="https://www.cgso.org.za" target="_blank" rel="noopener noreferrer">www.cgso.org.za</a>) or the National Consumer Commission (<a href="https://www.thencc.gov.za" target="_blank" rel="noopener noreferrer">www.thencc.gov.za</a>). These terms are governed by the laws of the Republic of South Africa.</p>

<h2>14. Changes to these terms</h2>
<p>We may update these terms from time to time. The version on this page at the time you place an order applies to that order.</p>
`;

  return <LegalLayout title="Terms of Service" updated={LEGAL_UPDATED} html={html} />;
}
