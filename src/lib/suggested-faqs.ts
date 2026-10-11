/**
 * Suggested product FAQs, used once by the admin "Add suggested FAQs" tool to
 * fill products that have none. After that, every answer is plain text the
 * admin can edit on the product form.
 *
 * Wording rules (SAHPRA / CPA): no promise that a product treats, cures or is
 * safe for a disease; health questions are routed to the information pack and
 * the customer's own doctor or pharmacist.
 *
 * Format: blocks separated by a blank line — question on the first line, answer below.
 */

type Faq = [question: string, answer: string];

/** Hormone-related formulas get an explicit hormone-sensitive caution. */
const HORMONE = /estrogene|estrolean|gynoshield|fertilitygene|mangene|anabolean/i;

function shortName(name: string) {
  return PRODUCT_FAQS.find((p) => p.match.test(name))?.label ?? name.split(/ [-—–(]/)[0].trim();
}

/** The generalised "I have a health condition" answer, for any product. */
export function healthConditionFaq(name: string, contactEmail: string): Faq {
  const n = shortName(name);
  const hormone = HORMONE.test(name)
    ? " This is especially important with hormone-sensitive conditions (such as some cancers), or if you use hormone treatment, because some of the plant ingredients can act on the body's hormones."
    : "";
  return [
    `I have a health condition or take medication. Can I use ${n}?`,
    `Thank you for checking first — it's the right thing to do. ${n} is made from natural, plant-based ingredients, but natural doesn't automatically mean it suits everyone: some herbs can interact with medicines or may not be right with certain conditions.${hormone} For more information on ${n}, please email us at ${contactEmail} and we'll send you the full information pack, which you can share with your doctor or healthcare practitioner so they can advise you.`,
  ];
}

/** Questions specific to each product in the range (matched on the product name). */
const PRODUCT_FAQS: { match: RegExp; label: string; men?: boolean; faqs: Faq[] }[] = [
  {
    match: /^soul\b/i,
    label: "Soul",
    faqs: [
      ["How long before I notice a difference?", "Everyone is different. Most people take Soul every day for at least 4–6 weeks to judge how it works for them."],
      ["Can I take Soul with antidepressants or anxiety medication?", "Please don't combine them without your doctor's advice. Some herbs can interact with these medicines. Never stop prescribed medication on your own."],
      ["Who can I talk to if I'm struggling?", "If you're struggling with your mood, please reach out to your doctor, or call the SADAG helpline on 0800 567 567. You don't have to manage it alone."],
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
    men: true,
    faqs: [
      ["Can women take AnaboLean?", "AnaboLean is formulated for adult men. Women may prefer EstroLean, which is designed for women's fitness and wellness."],
      ["Does it work without training?", "AnaboLean is designed to support a training routine with good nutrition and sleep — not to replace them. Results vary from person to person."],
    ],
  },
  {
    match: /^fertilitygene\b/i,
    label: "FertilityGene",
    men: true,
    faqs: [
      ["How long should I take FertilityGene?", "Sperm takes roughly 2–3 months to develop, so most men take it daily for at least 3 months to judge how it works for them."],
      ["Is FertilityGene for men or women?", "It's formulated for men's reproductive health. Couples trying to conceive should also see their doctor together for advice."],
    ],
  },
  {
    match: /^mangene\b/i,
    label: "ManGene",
    men: true,
    faqs: [
      ["Can I take ManGene with blood-pressure, heart or erectile-dysfunction medication?", "Please don't without your doctor's advice. Ingredients like L-arginine and ginkgo can affect blood flow and may interact with these medicines."],
      ["How long before I notice a difference?", "Results vary. Take it consistently as directed for a few weeks to judge how it works for you."],
    ],
  },
  {
    match: /^gynoshield\b/i,
    label: "GynoShield",
    men: true,
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

/** The full suggested FAQ text for a product (generic questions + any product-specific ones). */
export function suggestedFaqs(product: { name: string; isCombo?: boolean }, contactEmail: string): string {
  const n = shortName(product.name);
  const entry = PRODUCT_FAQS.find((p) => p.match.test(product.name));
  const specific = entry?.faqs ?? [
    ["How long before I notice a difference?", `Everyone is different. Take ${n} consistently as directed for a few weeks to judge how it works for you.`],
  ];
  // "One pack" and "combine products" don't fit creams or combo bundles
  const isTopical = /cream|gel|serum|lotion|\bml\b/i.test(product.name) || !!product.isCombo;
  const faqs: Faq[] = [
    ...specific,
    healthConditionFaq(product.name, contactEmail),
    ...(entry?.men
      ? []
      : ([["Can I use it while pregnant or breastfeeding?", `Please don't use ${n} while pregnant or breastfeeding unless your doctor advises it.`]] as Faq[])),
    ...(isTopical
      ? []
      : ([
          ["Can I combine it with other GreenGene products?", "Many customers do — see our combos. Some ingredients (such as ashwagandha) appear in more than one formula, so check the total daily amount and ask your pharmacist if you're unsure."],
          ["How long does one pack last?", "At the usual dose, one pack is a one-month supply — check the How to use section for your dose."],
        ] as Faq[])),
    ["Is it registered with SAHPRA?", "Our products are made in a SAHPRA-approved facility. As a complementary medicine it has not been evaluated by SAHPRA for its quality, safety or intended use — see the note at the bottom of this page."],
  ];
  return faqs.map(([q, a]) => `${q}\n${a}`).join("\n\n");
}
