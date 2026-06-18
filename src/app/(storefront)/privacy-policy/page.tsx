import type { Metadata } from "next";
import { LegalLayout } from "@/components/legal-layout";

export const metadata: Metadata = { title: "Privacy Policy" };

const html = `
<p>This Privacy Policy describes how GreenGene Pharma (the "Site", "we", "us", or "our") collects, uses, and discloses your personal information when you visit, use our services, or make a purchase from www.greengenepharma.co.za (the "Site") or otherwise communicate with us regarding the Site (collectively, the "Services"). For purposes of this Privacy Policy, "you" and "your" means you as the user of the Services, whether you are a customer, website visitor, or another individual whose information we have collected pursuant to this Privacy Policy.</p>
<p>Please read this Privacy Policy carefully. By using and accessing any of the Services, you agree to the collection, use, and disclosure of your information as described in this Privacy Policy. If you do not agree to this Privacy Policy, please do not use or access any of the Services.</p>

<h2>Changes to This Privacy Policy</h2>
<p>We may update this Privacy Policy from time to time, including to reflect changes to our practices or for other operational, legal, or regulatory reasons. We will post the revised Privacy Policy on the Site, update the "Last updated" date and take any other steps required by applicable law.</p>

<h2>How We Collect and Use Your Personal Information</h2>
<p>To provide the Services, we collect personal information about you from a variety of sources, as set out below. The information that we collect and use varies depending on how you interact with us.</p>
<p>In addition to the specific uses set out below, we may use information we collect about you to communicate with you, provide or improve the Services, comply with any applicable legal obligations, enforce any applicable terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.</p>

<h3>What Personal Information We Collect</h3>
<p>The types of personal information we obtain about you depends on how you interact with our Site and use our Services. When we use the term "personal information", we are referring to information that identifies, relates to, describes or can be associated with you.</p>

<h3>Information We Collect Directly from You</h3>
<ul>
  <li><strong>Contact details</strong> including your name, address, phone number, and email.</li>
  <li><strong>Order information</strong> including your name, billing address, shipping address, payment confirmation, email address, and phone number.</li>
  <li><strong>Account information</strong> including your username, password, security questions and other information used for account security purposes.</li>
  <li><strong>Shopping information</strong> including the items you view, put in your cart, or purchases.</li>
  <li><strong>Customer support information</strong> including the information you choose to include in communications with us.</li>
</ul>

<h3>Information We Collect about Your Usage</h3>
<p>We may also automatically collect certain information about your interaction with the Services ("Usage Data"). To do this, we may use cookies, pixels and similar technologies ("Cookies"). Usage Data may include information about how you access and use our Site and your account, including device information, browser information, information about your network connection, your IP address and other information regarding your interaction with the Services.</p>

<h3>Information We Obtain from Third Parties</h3>
<p>We may obtain information about you from third parties, including from vendors and service providers who may collect information on our behalf, such as companies who support our Site and Services and our payment processors, who collect payment information to process your payment in order to fulfill your orders.</p>

<h3>How We Use Your Personal Information</h3>
<ul>
  <li><strong>Providing Products and Services.</strong> To process your payments, fulfill your orders, send notifications related to your account and purchases, manage your account, arrange shipping, and facilitate returns and exchanges.</li>
  <li><strong>Marketing and Advertising.</strong> To send marketing and promotional communications and to show you advertisements for products or services.</li>
  <li><strong>Security and Fraud Prevention.</strong> To detect, investigate or take action regarding possible fraudulent, illegal or malicious activity.</li>
  <li><strong>Communicating with You and Service Improvement.</strong> To provide you with customer support and improve our Services.</li>
</ul>

<h2>Cookies</h2>
<p>Like many websites, we use Cookies on our Site. We use Cookies to power and improve our Site and our Services (including to remember your actions and preferences), to run analytics and better understand user interaction with the Services. Most browsers automatically accept Cookies by default, but you can choose to set your browser to remove or reject Cookies. Removing or blocking Cookies can negatively impact your user experience and may cause some of the Services to work incorrectly or no longer be available.</p>

<h2>How We Disclose Personal Information</h2>
<p>In certain circumstances, we may disclose your personal information to third parties for contract fulfillment purposes, legitimate purposes and other reasons subject to this Privacy Policy. Such circumstances may include:</p>
<ul>
  <li>With vendors or other third parties who perform services on our behalf (e.g., IT management, payment processing, data analytics, customer support, cloud storage, fulfillment and shipping).</li>
  <li>With business and marketing partners to provide services and advertise to you.</li>
  <li>When you direct, request us or otherwise consent to our disclosure of certain information to third parties.</li>
  <li>With our affiliates or otherwise within our corporate group.</li>
  <li>In connection with a business transaction, to comply with legal obligations, to enforce terms of service, and to protect or defend the Services, our rights, and the rights of our users or others.</li>
</ul>

<h2>Third Party Websites and Links</h2>
<p>Our Site may provide links to websites or other online platforms operated by third parties. If you follow links to sites not affiliated or controlled by us, you should review their privacy and security policies. We do not guarantee and are not responsible for the privacy or security of such sites.</p>

<h2>Children's Data</h2>
<p>The Services are not intended to be used by children, and we do not knowingly collect any personal information about children. If you are the parent or guardian of a child who has provided us with their personal information, you may contact us using the contact details set out below to request that it be deleted.</p>

<h2>Security and Retention of Your Information</h2>
<p>Please be aware that no security measures are perfect or impenetrable, and we cannot guarantee "perfect security." How long we retain your personal information depends on different factors, such as whether we need the information to maintain your account, to provide the Services, comply with legal obligations, resolve disputes or enforce other applicable contracts and policies.</p>

<h2>Your Rights</h2>
<p>Depending on where you live, you may have some or all of the following rights in relation to your personal information: the right to access/know, to delete, to correct, to portability, to restrict processing, to withdraw consent, to appeal, and to manage communication preferences. You may exercise any of these rights where indicated on our Site or by contacting us using the contact details provided below. We will not discriminate against you for exercising any of these rights.</p>

<h2>Complaints</h2>
<p>If you have complaints about how we process your personal information, please contact us using the contact details provided below. If you are not satisfied with our response, depending on where you live you may have the right to appeal our decision or lodge your complaint with your local data protection authority.</p>

<h2>Contact</h2>
<p>Should you have any questions about our privacy practices or this Privacy Policy, or if you would like to exercise any of the rights available to you, please email us at <a href="mailto:info@greengenepharma.co.za">info@greengenepharma.co.za</a> or contact us at Duncan Drive, Westville, Westville, NL, 3629, ZA.</p>
`;

export default function PrivacyPolicyPage() {
  return <LegalLayout title="Privacy Policy" updated="9 May 2026" html={html} />;
}
