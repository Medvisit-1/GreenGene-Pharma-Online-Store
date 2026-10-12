/**
 * Starter content for the store-wide FAQ page (/faqs). It is copied into the
 * database the first time the page is needed; after that the admin edits it in
 * Admin → FAQs.
 *
 * Wording rules (SAHPRA / CPA): never promise that a product treats, cures or is
 * safe for a disease — health questions go to the information pack.
 *
 * Answers may use [link text](/path) for links to our own pages, and these
 * tokens, filled in from the live settings: {contact_email}, {delivery_fee},
 * {free_delivery_from}.
 */

type Faq = [question: string, answer: string];

export const GENERAL_FAQS: { section: string; faqs: Faq[] }[] = [
  {
    section: "Ordering & delivery",
    faqs: [
      ["Where do you deliver?", "We deliver anywhere in South Africa through reputable local courier services."],
      ["How much is delivery?", "Delivery costs {delivery_fee} per order, and it's free on orders of {free_delivery_from} or more. You'll always see the delivery fee in your cart and at checkout before you pay. See our [Shipping Policy](/shipping-policy)."],
      ["How long will my order take?", "Once your payment is received, orders are processed within 1–2 working days. Delivery then usually takes a few working days, depending on where you are."],
      ["How do I track my order?", "We email you tracking details as soon as your order is on its way. You can also follow your order's progress under [My account](/account?tab=orders)."],
      ["Can I change or cancel my order?", "Yes — any time before it's dispatched. Email us at {contact_email} with your order number and we'll refund you in full."],
    ],
  },
  {
    section: "Payment",
    faqs: [
      ["How can I pay?", "You pay securely online through our payment partners. The payment options available to you are shown at checkout, and your card details are entered on the payment partner's secure page — we never see them."],
      ["My payment didn't go through. What now?", "No money is taken when a payment fails, and your order is saved. Use the link in your order email, or sign in to [My account](/account?tab=orders), to try again."],
      ["Do your prices include VAT?", "All prices are in South African Rand (ZAR) and include VAT where applicable. Delivery is shown separately at checkout."],
    ],
  },
  {
    section: "Returns & refunds",
    faqs: [
      ["Can I return a product?", "Yes. Unopened products in their original sealed packaging can be returned within 7 days of receiving them for a refund (return postage is for your account). See our [Refund Policy](/refund-policy) for the details and your rights."],
      ["My parcel arrived damaged, or I received the wrong product.", "Sorry about that! Please let us know within 2 working days for damaged items (1 working day for a wrong item), with photos if possible, at {contact_email}. We'll replace it or refund you at our cost."],
      ["How long do refunds take?", "Refunds are paid back to your original payment method within 30 days of us receiving the returned product."],
    ],
  },
  {
    section: "Your account & rewards",
    faqs: [
      ["Do I need an account to order?", "No, you can check out as a guest. With a free account you can track your orders, keep a wishlist, buy again in one click and earn rewards."],
      ["How do I sign in? I don't have a password.", "There's no password to remember. Enter your email address on the [sign-in page](/account) and we'll email you a 6-digit code."],
      ["How do rewards work?", "Members earn discount codes for things like order milestones, reviews, referring friends, their birthday and joining our newsletter. See [your rewards](/account?tab=rewards). [Rewards T&Cs](/rewards-terms) apply."],
      ["How do I stop marketing emails?", "Every newsletter has an unsubscribe link, or you can change your email preferences under My details in [your account](/account?tab=details)."],
    ],
  },
  {
    section: "Our products & your health",
    faqs: [
      ["I have a health condition or take medication. Can I use your products?", "For health-related questions, please email us at {contact_email} and we'll send you the full information pack on the product you're interested in."],
      ["Are your products natural?", "Our formulas are made from natural, plant-based ingredients, and every ingredient and its dose is listed on the product page."],
      ["How long before I notice a difference?", "Everyone is different. Most of our formulas are designed to be taken consistently for several weeks — see the product sections below for guidance on each one."],
      ["Can I use your products while pregnant or breastfeeding?", "Please don't use our products while pregnant or breastfeeding unless your doctor advises it."],
      ["Can I combine different GreenGene products?", "Many customers do — see our [combos](/combos). Some ingredients (such as ashwagandha) appear in more than one formula, so check the total daily amount and ask your pharmacist if you're unsure."],
      ["How long does one pack last?", "At the usual dose, most of our capsule packs are a one-month supply. Each product's How to use section shows the dose."],
      ["Are your products registered with SAHPRA?", "Our products are made in a SAHPRA-approved facility. As complementary medicines they have not been evaluated by SAHPRA for their quality, safety or intended use."],
    ],
  },
];

/** Product-specific questions (matched on the product name); each becomes its own section. */
export const PRODUCT_FAQS: { match: RegExp; label: string; faqs: Faq[] }[] = [
  {
    match: /^soul\b/i,
    label: "Soul",
    faqs: [
      ["How long before I notice a difference?", "Everyone is different. Most people take Soul every day for at least 4–6 weeks to judge how it works for them."],
      ["Can I take Soul with antidepressants or anxiety medication?", "Please don't combine them without your doctor's advice. Some herbs can interact with these medicines. Never stop prescribed medication on your own."],
    ],
  },
  {
    match: /^zenax\b/i,
    label: "Zenax",
    faqs: [
      ["How long before I notice a difference?", "Some people feel calmer within the first weeks, but for best results take Zenax consistently for at least 4–6 weeks."],
      ["Will Zenax make me drowsy during the day?", "Zenax is non-habit forming, and L-theanine is known for relaxed alertness rather than drowsiness. Ingredients like valerian and magnesium are relaxing, though, so if you feel sleepy, take it in the evening and don't drive until you know how it affects you."],
      ["Can children take Zenax?", "Children aged 9 and older may take 1 capsule in the evening only. Please check with your child's doctor first, especially if they take any medication."],
    ],
  },
  {
    match: /^adhd zen/i,
    label: "ADHD Zen+",
    faqs: [
      ["Is ADHD Zen+ a stimulant?", "No. It's free from stimulants, artificial colours and flavours, and habit-forming ingredients."],
      ["Can it be taken with prescribed ADHD medication?", "Please don't combine them without your doctor's advice, and never stop or change prescribed medication on your own."],
      ["How long before I notice a difference?", "Ingredients like Brahmi work gradually. Most people take it daily for 8–12 weeks to judge how it works for them or their child."],
    ],
  },
  {
    match: /^lion'?s mane/i,
    label: "Lion's Mane Plus",
    faqs: [
      ["When is the best time to take it?", "In the morning or with breakfast, with water."],
      ["How long before I notice a difference?", "Take it consistently — most people judge it after 3–6 weeks of daily use."],
      ["Is Lion's Mane Plus halal?", "Yes, it is halal certified. It's also free from artificial fillers and is non-GMO."],
      ["I'm allergic to mushrooms. Can I take it?", "No — Lion's Mane is a mushroom, so please avoid this product if you have a mushroom allergy."],
    ],
  },
  {
    match: /^anabolean\b/i,
    label: "AnaboLean",
    faqs: [
      ["Can women take AnaboLean?", "AnaboLean is formulated for adult men. Women may prefer EstroLean, which is designed for women's fitness and wellness."],
      ["Does it work without training?", "AnaboLean is designed to support a training routine with good nutrition and sleep — not to replace them. Results vary from person to person."],
    ],
  },
  {
    match: /^fertilitygene\b/i,
    label: "FertilityGene",
    faqs: [
      ["How long should I take FertilityGene?", "Sperm takes roughly 2–3 months to develop, so most men take it daily for at least 3 months to judge how it works for them."],
      ["Is FertilityGene for men or women?", "It's formulated for men's reproductive health. Couples trying to conceive should also see their doctor together for advice."],
    ],
  },
  {
    match: /^mangene\b/i,
    label: "ManGene",
    faqs: [
      ["Can I take ManGene with blood-pressure, heart or erectile-dysfunction medication?", "Please don't without your doctor's advice. Ingredients like L-arginine and ginkgo can affect blood flow and may interact with these medicines."],
      ["How long before I notice a difference?", "Results vary. Take it consistently as directed for a few weeks to judge how it works for you."],
    ],
  },
  {
    match: /^gynoshield\b/i,
    label: "GynoShield",
    faqs: [
      ["How long before I notice a difference?", "Results vary. Take it consistently as directed — most men judge it after 6–8 weeks of daily use."],
      ["Who should not take GynoShield?", "It isn't recommended for anyone under 18, or for people with hormone-related medical conditions unless their doctor advises it."],
    ],
  },
  {
    match: /^estrogene\b/i,
    label: "Estrogene",
    faqs: [
      ["Is Estrogene hormone replacement therapy (HRT)?", "No. Estrogene contains plant ingredients — black cohosh, red clover, flaxseed and aniseed — not hormones. Please don't stop or swap prescribed HRT without speaking to your doctor."],
      ["How long before I notice a difference?", "Everyone is different. Most women take it daily for at least 4–8 weeks to judge how it works for them."],
    ],
  },
  {
    match: /^estrolean\b/i,
    label: "EstroLean",
    faqs: [
      ["Will EstroLean help me lose weight on its own?", "EstroLean is designed to support a balanced diet and regular exercise, not replace them. Results vary from person to person."],
      ["Does EstroLean contain caffeine?", "Yes — it contains green tea and caffeine. If you're sensitive to caffeine, take it in the morning and go easy on coffee and energy drinks."],
    ],
  },
  {
    match: /^clarifyx/i,
    label: "ClarifyX-24",
    faqs: [
      ["Can I use it on sensitive skin?", "Do a patch test first: apply a little on the inside of your arm or behind your ear and wait 24 hours. Stop using it if irritation occurs."],
      ["Can I use it with other acne products?", "Avoid using it at the same time as other strong exfoliants or acne treatments (such as other salicylic acid or retinoid products), as this can irritate your skin."],
      ["How quickly will I see results?", "Some people notice a difference quickly, but results vary. Use it every evening and give it a few weeks; see a doctor or dermatologist for severe or painful acne."],
    ],
  },
];

/** The FAQ section name for a product (its short name), if it has one in our starter content. */
export function productFaqLabel(name: string): string | null {
  return PRODUCT_FAQS.find((p) => p.match.test(name))?.label ?? null;
}

/** Questions every product section used to repeat — now answered once in the general sections. */
export const GENERIC_QUESTION = /^(i have a health condition|can i use it while pregnant|can i combine it|how long does one pack|is it registered with sahpra)/i;
