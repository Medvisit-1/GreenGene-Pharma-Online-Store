import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";
import { describeDiscount, describeRequirement, ensureDefaultRewards } from "@/lib/rewards";
import { getBusinessIdentity, h, LEGAL_UPDATED } from "@/lib/legal";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rewards Terms & Conditions" };

export default async function RewardsTermsPage() {
  const id = await getBusinessIdentity();
  let rows = "";
  try {
    await ensureDefaultRewards();
    const rewards = await prisma.reward.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    rows = rewards
      .map(
        (r) => `<tr>
          <td>${h(r.title)}</td>
          <td>${h(describeRequirement(r))}</td>
          <td>${h(describeDiscount(r))}</td>
          <td>${r.minSpend > 0 ? h(formatPrice(r.minSpend)) : "None"}</td>
          <td>${r.validDays > 0 ? `${r.validDays} days from claiming` : "No expiry"}</td>
        </tr>`
      )
      .join("");
  } catch {
    rows = "";
  }

  const html = `
<p>These terms govern the GreenGene Rewards programme (the <strong>"Programme"</strong>) operated by ${h(id.legalName)}${id.regNo ? ` (registration number ${h(id.regNo)})` : ""} (<strong>"we"</strong>, <strong>"us"</strong>). They apply together with our <a href="/terms-of-service">Terms of Service</a> and <a href="/privacy-policy">Privacy Policy</a>. By creating an account or claiming a reward you agree to them.</p>

<h2>1. Joining</h2>
<ul>
  <li>The Programme is free. There is no fee to join and rewards cannot be bought.</li>
  <li>It is open to natural persons aged 18 or older who have a GreenGene Pharma customer account. Rewards can only be used on orders delivered within South Africa.</li>
  <li>One account per person. Accounts, rewards and reward codes are personal and may not be sold, transferred or shared.</li>
</ul>

<h2>2. Current rewards</h2>
<p>The rewards currently on offer are listed below. Each reward can be claimed in the Rewards section of your account once you have met its requirement.</p>
${rows ? `<table><thead><tr><th>Reward</th><th>How you earn it</th><th>You get</th><th>Minimum spend</th><th>Code valid for</th></tr></thead><tbody>${rows}</tbody></table>` : "<p>There are no rewards on offer at the moment.</p>"}

<h2>3. How rewards are earned</h2>
<h3>Order milestones</h3>
<p>Only orders that have been <strong>paid</strong> count. Orders that are unpaid, cancelled or refunded do not count, and a refund after a milestone was reached may mean the milestone is no longer met. Orders are counted against the email address of your account.</p>
<h3>Product reviews</h3>
<p>You can earn a reward for an honest review of a product you have <strong>bought and paid for</strong>, once per product. <strong>The reward is the same whatever rating you give and whatever you say</strong> — positive, negative or neutral. We do not edit the opinion expressed in a review. We only moderate reviews to remove content that is unlawful, offensive, contains personal information, or is not about the product, and a review removed for those reasons does not earn a reward. Reviews that earned a reward are not otherwise distinguished from other reviews; our product pages explain that reviewers may receive a reward.</p>
<h3>Refer a friend</h3>
<ul>
  <li>Share your personal referral link or code. You earn the reward when a friend places their <strong>first paid order</strong> using your link or code.</li>
  <li>The friend must be a new customer: an email address with no earlier paid order, which is not yours, and a delivery address and phone number that are not yours. Self-referrals, referrals within the same household and orders that are later refunded do not qualify.</li>
  <li>You earn one reward per qualifying friend. There is no limit on the number of friends, but we may cap or review unusual referral activity.</li>
  <li>Only share your link with people you know. You must not send unsolicited bulk messages (spam), post your link on coupon or voucher websites, or pay for advertising using our name.</li>
  <li>To protect your friend's privacy we only show you how many friends have ordered — never their details. Your friend sees your first name only.</li>
</ul>
<h3>Birthday</h3>
<p>Add your birthday in your account details. The birthday reward can be claimed once per calendar year, during your birthday month (South African time). Your birthday can only be set once; contact us if it needs correcting.</p>
<h3>Newsletter</h3>
<p>The newsletter reward can be claimed once per person after subscribing. You may unsubscribe at any time; this does not cancel a code you have already claimed.</p>

<h2>4. Reward codes</h2>
<ul>
  <li>Claiming a reward creates a <strong>single-use</strong> discount code, linked to your account email address. It only works on an order placed with that email address.</li>
  <li>Codes have <strong>no cash value</strong>, cannot be exchanged for cash or credit, and cannot be replaced if they expire unused.</li>
  <li>Percentage and rand-value discounts apply to the product subtotal; a free-shipping reward removes the delivery fee. Only <strong>one</strong> discount code can be used per order.</li>
  <li>A minimum spend and an expiry date may apply, as shown in the table above and with each code. Codes expire at the end of their validity period.</li>
  <li>If an order on which you used a code is cancelled or refunded, the code is not automatically reissued; contact us and we will consider it fairly.</li>
</ul>

<h2>5. Changes to, or ending, the Programme</h2>
<p>We may change these terms, the rewards on offer or their requirements, or end the Programme. We will give at least 20 business days' notice on this page and by email before a change that reduces your benefits takes effect, unless the change is required by law or to prevent fraud. <strong>Codes you have already claimed will be honoured until their expiry date.</strong></p>

<h2>6. Fair use and fraud</h2>
<p>We may withhold or cancel rewards and codes, or suspend an account, where we reasonably believe the Programme is being abused — for example through fake accounts, self-referrals, fraudulent orders or chargebacks. We will tell you why, and you may respond.</p>

<h2>7. Your personal information</h2>
<p>We use your order history, reviews, birthday, newsletter preference and referral activity to run the Programme, as explained in our <a href="/privacy-policy">Privacy Policy</a>.</p>

<h2>8. Questions and complaints</h2>
<p>Contact us at <a href="mailto:${h(id.email)}">${h(id.email)}</a>${id.phone ? ` or ${h(id.phone)}` : ""}. If we cannot resolve a complaint, you may contact the Consumer Goods and Services Ombud (<a href="https://www.cgso.org.za" target="_blank" rel="noopener noreferrer">www.cgso.org.za</a>) or the National Consumer Commission. These terms are governed by the laws of the Republic of South Africa, and nothing in them limits your rights under the Consumer Protection Act.</p>
`;

  return <LegalLayout title="Rewards Terms & Conditions" updated={LEGAL_UPDATED} html={html} />;
}
