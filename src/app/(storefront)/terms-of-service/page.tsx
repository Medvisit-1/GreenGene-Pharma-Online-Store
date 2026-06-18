import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = { title: "Terms of Service" };

const html = `
<h2>Detailed Description of Goods and/or Services</h2>
<p>GreenGene Pharma is an online store in the organic and natural product industry.</p>

<h2>Agreement of Sale</h2>
<p>An agreement of sale between GreenGene Pharma and a customer is only valid once payment has been made and the company receives proof of payment. Up until this point all goods remain the property of GreenGene Pharma.</p>

<h2>Statement on Advertising Compliance</h2>
<p>GreenGene Pharma may modify wording in promotional content to maintain compliance with social media advertising policies and to prevent potential account restrictions. However, products displayed on our official website accurately represent what customers will receive. We remain dedicated to transparency, good faith, and quality standards.</p>

<h2>Contact</h2>
<p>For questions about these Terms, email us at <a href="mailto:info@greengenepharma.co.za">info@greengenepharma.co.za</a>.</p>
`;

export default function TermsPage() {
  return <LegalLayout title="Terms of Service" html={html} />;
}
