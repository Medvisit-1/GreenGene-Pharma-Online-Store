import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { getBusinessIdentity, h, LEGAL_UPDATED } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPolicyPage() {
  const id = await getBusinessIdentity();

  const html = `
<p>This policy explains how ${h(id.legalName)} (<strong>"GreenGene Pharma"</strong>, <strong>"we"</strong>) collects, uses, shares and protects your personal information when you visit ${h(id.website)}, create an account or buy from us, in line with the Protection of Personal Information Act, 2013 (<strong>POPIA</strong>).</p>

<h2>1. Who is responsible for your information</h2>
<table><tbody>
  <tr><th>Responsible party</th><td>${h(id.legalName)}${id.regNo ? ` (registration number ${h(id.regNo)})` : ""}</td></tr>
  <tr><th>Address</th><td>${h(id.address)}</td></tr>
  <tr><th>Information Officer</th><td>${id.infoOfficer ? `${h(id.infoOfficer)} — ` : ""}<a href="mailto:${h(id.email)}">${h(id.email)}</a>${id.phone ? `, ${h(id.phone)}` : ""}</td></tr>
</tbody></table>

<h2>2. What we collect</h2>
<ul>
  <li><strong>Contact and delivery details</strong> — your name, email address, phone number and delivery address, when you order, create an account or contact us.</li>
  <li><strong>Order information</strong> — what you bought, prices, discounts, delivery details, any order notes, and the payment status and reference from the payment provider. <strong>We never receive or store your card details</strong>; payments are processed by the payment gateway.</li>
  <li><strong>Account information</strong> — if you create an account: your saved details, and, if you choose to add them, your birthday (day and month) and newsletter preference. We do not use passwords: you sign in with a one-time code sent to your email, which we keep only in scrambled form for 10 minutes.</li>
  <li><strong>Rewards information</strong> — rewards you have earned and claimed, your reward codes, your referral code, and whether an order was placed through someone's referral link or code.</li>
  <li><strong>Reviews and messages</strong> — the name, email, rating and text of reviews you submit, and messages you send us.</li>
  <li><strong>Technical information</strong> — the essential cookies listed in section 7, and standard server logs (such as IP address and browser type) kept by our hosting provider for security.</li>
</ul>
<p>We do not use advertising trackers, social-media pixels or third-party analytics on this website.</p>

<h2>3. Why we use it</h2>
<ul>
  <li><strong>To process and deliver your orders</strong>, send order and delivery emails, and handle returns — necessary to perform our contract with you.</li>
  <li><strong>To run your account and the rewards programme</strong>, including milestones, review and referral rewards, and your birthday reward — at your request when you use these features.</li>
  <li><strong>To send our newsletter</strong> — <strong>only if you have opted in</strong>. You can unsubscribe at any time using the link in every newsletter email or in your account.</li>
  <li><strong>To keep our store secure</strong> and prevent fraud and abuse — our legitimate interest.</li>
  <li><strong>To meet legal obligations</strong>, such as keeping tax and accounting records.</li>
</ul>
<p>We do not sell your personal information. Where we would like to use your information for a new purpose, we will ask for your consent first where the law requires it.</p>

<h2>4. Who we share it with</h2>
<p>We share only what is needed, with service providers ("operators") who must keep it confidential and secure:</p>
<ul>
  <li><strong>Payment gateways</strong> (such as Yoco, Bob Pay and Paystack) — to take your payment.</li>
  <li><strong>Couriers and our fulfilment platform</strong> (Bob Go and its courier partners) — your name, phone number and delivery address, to deliver your order.</li>
  <li><strong>Email delivery provider</strong> (Brevo) — your email address and the content of our emails to you.</li>
  <li><strong>Hosting provider</strong> (Railway) — which hosts our website and database.</li>
  <li><strong>Authorities</strong> — where the law requires it.</li>
</ul>
<p>If you were referred by a friend, the friend who referred you only sees how many people they referred who placed an order — not your name or any other details. If you refer someone, they see only your first name.</p>

<h2>5. Information stored outside South Africa</h2>
<p>Some of our service providers, including our hosting and email providers, store information on servers outside South Africa (for example in the United States and the European Union). We use providers that are bound by data-protection laws, agreements or binding rules that give your information a level of protection substantially similar to POPIA, as required by section 72 of POPIA.</p>

<h2>6. How long we keep it</h2>
<ul>
  <li>Order and invoice records: for at least five years, as required by tax law.</li>
  <li>Account, rewards and newsletter information: for as long as your account is active, or until you ask us to delete it.</li>
  <li>Sign-in codes: 10 minutes. Reviews: while they are published.</li>
</ul>

<h2>7. Cookies and browser storage</h2>
<p>We only use cookies and storage that make the website work. They do not track you across other websites.</p>
<table><thead><tr><th>Name</th><th>Purpose</th><th>How long</th></tr></thead><tbody>
  <tr><td>gg_customer</td><td>Keeps you signed in to your account</td><td>30 days, or until you sign out</td></tr>
  <tr><td>gg_ref</td><td>Remembers which friend's referral link you used</td><td>30 days</td></tr>
  <tr><td>gg_ref_banner_hidden</td><td>Remembers that you closed the referral welcome banner</td><td>Until you close your browser</td></tr>
  <tr><td>greengene-cart (browser storage)</td><td>Remembers the contents of your cart</td><td>Until you clear it or check out</td></tr>
  <tr><td>greengene-customer (browser storage)</td><td>Saves your checkout details on your device, only if you tick "Save my details"</td><td>Until you untick it or clear your browser</td></tr>
</tbody></table>
<p>You can block or delete cookies in your browser settings, but parts of the website (such as signing in) will not work without them.</p>

<h2>8. Your rights</h2>
<p>Under POPIA you have the right to:</p>
<ul>
  <li>ask what personal information we hold about you, and get a copy of it — signed-in customers can download their data from <a href="/account?tab=details">My account → My details</a>;</li>
  <li>ask us to correct or update it — most details can be edited in your account;</li>
  <li>ask us to delete it, or object to how we use it — you can request deletion from your account, or email us (we may need to keep some records, such as invoices, where the law requires);</li>
  <li>withdraw your consent to marketing at any time; and</li>
  <li>complain to the Information Regulator.</li>
</ul>
<p>To exercise these rights, contact our Information Officer at <a href="mailto:${h(id.email)}">${h(id.email)}</a>. We may need to confirm your identity first.</p>

<h2>9. Security</h2>
<p>We protect your information with measures such as encrypted connections (HTTPS), signed sign-in sessions, scrambled sign-in codes, access controls and reputable service providers. No system is completely secure, but if a breach affects your information we will notify you and the Information Regulator as POPIA requires.</p>

<h2>10. Children</h2>
<p>Our website and products are intended for adults. We do not knowingly collect personal information from anyone under 18.</p>

<h2>11. Complaints</h2>
<p>If you are unhappy with how we handle your information, please contact us first. You may also lodge a complaint with the <strong>Information Regulator (South Africa)</strong>: <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer">inforegulator.org.za</a> · <a href="mailto:POPIAComplaints@inforegulator.org.za">POPIAComplaints@inforegulator.org.za</a>.</p>

<h2>12. Changes to this policy</h2>
<p>We may update this policy from time to time. The latest version will always be on this page, with the date it was last updated.</p>
`;

  return <LegalLayout title="Privacy Policy" updated={LEGAL_UPDATED} html={html} />;
}
