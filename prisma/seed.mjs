import { PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const CDN = "https://cdn.shopify.com/s/files/1/0633/0581/0006/files/";

const categories = [
  {
    name: "Mind & Mood Support",
    slug: "mind-mood",
    description:
      "Natural formulas for calm focus, emotional balance, memory and restful sleep.",
    image: "/categories/mind-mood.jpg",
    sortOrder: 1,
  },
  {
    name: "Men's Health & Performance",
    slug: "mens-health",
    description:
      "Testosterone, fertility, vitality and performance support for men.",
    image: "/categories/mens-health.jpg",
    sortOrder: 2,
  },
  {
    name: "Women's Health & Hormones",
    slug: "womens-health",
    description:
      "Hormonal balance, menopause relief, fitness and wellness for women.",
    image: "/categories/womens-health.jpg",
    sortOrder: 3,
  },
  {
    name: "Skin Care",
    slug: "skin-care",
    description: "Targeted, natural skin care for a clear, healthy complexion.",
    image: "/categories/skin-care.jpg",
    sortOrder: 4,
  },
];

const products = [
  {
    name: "Soul - Natural Formula for Stress, Depression, Anxiety & Emotional Balance (60 Capsules - One Month Supply)",
    cat: "mind-mood",
    price: 19900,
    stock: 60,
    featured: true,
    images: [CDN + "New_mock_up_front_view.png"],
    short: "Natural formula for calmness, mental clarity & emotional balance.",
    desc: `SOUL – The Ultimate Formula for Calmness & Mental Clarity

SOUL by GreenGene Pharma is a scientifically crafted, all-in-one natural supplement designed to promote mental clarity, emotional balance, and stress relief. This high-potency, adaptogenic formula is made from premium natural ingredients known to enhance neurotransmitters like dopamine, serotonin, and GABA while reducing anxiety, stress, and racing thoughts.

Key Benefits:
• Promotes Calmness & Mental Clarity – Enhances focus and relaxation without causing drowsiness.
• Reduces Stress, Anxiety & Depression – Supports emotional well-being and a positive mood.
• Enhances Neurotransmitters – Increases dopamine, serotonin, and GABA for a balanced and happy mindset.
• Helps with Panic Attacks & Overthinking – Supports anger management and emotional stability.
• Improves Sleep Quality – Aids in relaxation and restful sleep without sedating effects.
• Supports Digestive Health – Helps with stress-induced digestive issues like IBS and nervous stomach.
• Rich in Antioxidants & Adaptogens – Protects against oxidative stress and promotes resilience to stress.

Premium Ingredients & Their Benefits:
🌿 Ashwagandha (400mg) – A powerful adaptogen that helps the body adapt to stress and regulate cortisol levels, reducing symptoms of anxiety, depression and chronic stress while supporting brain function and memory.
🌿 Passionflower (500mg) – Rich in flavonoids and alkaloids that increase GABA levels in the brain, calming the nervous system and promoting deep, restful sleep.
🌿 Mucuna Pruriens (500mg) – A natural source of L-DOPA, a precursor to dopamine, helping combat low mood and mental fatigue while enhancing motivation and focus.
🌿 Lemon Balm (500mg) – Known for its calming properties, reducing nervousness and irritability and supporting better sleep quality.
🌿 Ocimum Sanctum (Holy Basil, 300mg) – A powerful adaptogen that lowers cortisol, enhances mental clarity and provides anti-inflammatory, neuroprotective effects.
🌿 Piperine (2.5mg) – Enhances the bioavailability and absorption of all active ingredients.

💯 100% Natural | High Potency | Non-Drowsy | Safe for Daily Use

💊 Dosage & Directions:
• Adults (18 years & older): Take 2 capsules daily.
• For best results: Use consistently as a daily supplement.

⚠️ Warnings: Discontinue use if allergic reactions occur. Store at or below 25°C and keep out of reach of children.`,
  },
  {
    name: "Zenax — Natural Mind & Stress Support Formula (60 Capsules - One Month Supply)",
    cat: "mind-mood",
    price: 25000,
    stock: 0,
    featured: true,
    images: [CDN + "Front_face_74bbb5c9-b7e7-49c1-80b5-135745c989e1.png"],
    short: "Natural mind & stress support — calm, focus and restful sleep.",
    desc: `Zenax is a premium natural supplement formulated to support mental calm, emotional balance, and restful sleep. Combining five clinically studied, plant-based ingredients, Zenax targets the root causes of stress, anxiety, racing thoughts, and poor sleep — helping you feel grounded, focused, and emotionally resilient every day.

Whether you struggle with daily stress, an overactive mind, irritability, or restless nights, Zenax provides gentle, non-habit forming support that works with your body — not against it.

Key Benefits:
• Calms racing thoughts and reduces anxiety, nervous tension, and stress-triggered irritability and anger
• May assist with ADHD-related symptoms & overwhelm
• Regulates cortisol levels for a balanced stress response and long-term emotional resilience
• Supports emotional balance, lifts low mood, and promotes a consistently positive mental state
• Promotes deep, restful sleep by relaxing the nervous system and quieting an overactive mind
• Five clinically studied, non-habit forming natural ingredients working together for whole-mind calm

Ingredients:
L-Theanine (500mg) – Promotes alpha brain wave activity for relaxed focus, reduces anxiety and supports sleep onset.
Ashwagandha (250mg, std. 5% Withanolides) – Clinically shown to reduce cortisol and perceived stress and improve mood.
Magnesium Glycinate (250mg) – The most bioavailable, gentle form of magnesium; relaxes the nervous system and supports GABA and serotonin activity.
Valerian Root (250mg, std. 40% Lignans) – Increases GABA availability for a calming, sedative effect; eases stress-induced sleep disruption.
Holy Basil / Tulsi (500mg) – An "adaptogen of the mind" that regulates cortisol and calms anger and irritability.

Suggested Use:
• Adults (18+): Take 1–2 capsules daily with water. Do not exceed 6 capsules in one day.
• Children (9+): Take 1 capsule daily in the evening only.
• For best results: use consistently for a minimum of 4–6 weeks.

Quiet the noise. Free your mind. Zenax — Natural Mind & Stress Support Formula.

Disclaimer: Zenax is a food supplement. It is not intended to diagnose, treat, cure, or prevent any disease. Always consult your healthcare provider before starting any new supplement.`,
  },
  {
    name: "ADHD Zen+ Ultimate ADHD Support for Kids and Adults (60 Capsules)",
    cat: "mind-mood",
    price: 24500,
    stock: 0,
    featured: false,
    images: [CDN + "ChatGPT_Image_Dec_30_2025_01_05_36_PM.png"],
    short: "Non-drowsy calm focus & emotional balance for kids and adults.",
    desc: `ADHD Zen+
Calm Focus • Emotional Balance • Daily Cognitive Support • Non-Drowsy Formula

ADHD Zen+ is a next-generation, non-drowsy cognitive support formula designed to promote calm focus, emotional regulation, and mental clarity—without stimulants or harsh neurological push. It works through multiple complementary pathways to gently support attention, stress resilience, and mental balance throughout the day, making it suitable for both adults and children.

What Makes ADHD Zen+ Different:
✅ Calm focus, not nervous energy
✅ Non-stimulant and non-drowsy
✅ No dopamine forcing or rebound effects
✅ Suitable for daily, long-term use
✅ Gentle enough for children
✅ Supports emotional regulation and mental balance

Ingredients & Their Benefits:
💧 L-Theanine (100mg) – Promotes relaxed alertness and calm focus via alpha brain wave activity.
🌿 Bacopa Monnieri / Brahmi (500mg) – Traditionally used to support memory, learning and attention.
🌸 Passionflower (300mg) – Supports emotional calm and reduces restlessness and racing thoughts.
⚡ Rhodiola Rosea (300mg) – An adaptogen that supports mental stamina and focus during stress.
🌱 Ashwagandha (400mg) – Supports stress and cortisol balance, emotional regulation and resilience.

Suggested Use:
👤 Adults: 2 capsules daily with food.
🧒 Children (6+ years): 1 capsule daily, preferably in the morning or early afternoon.

Free from stimulants, artificial colours or flavours, and habit-forming ingredients. Always consult a healthcare professional if your child is on medication or has a medical condition.`,
  },
  {
    name: "Lion's Mane Plus - Mental Clarity, Memory & Stress Relief (60 Capsules - One Month Supply)",
    cat: "mind-mood",
    price: 19900,
    stock: 0,
    featured: true,
    images: [CDN + "LionsManemockFrontview.png"],
    short: "Focus, memory & clarity — Lion's Mane, Ashwagandha & Ginkgo Biloba.",
    desc: `🧠 Lion's Mane Plus – Focus | Memory | Mental Clarity | Stress Relief

Unlock Your Mental Edge — Naturally! Lion's Mane Plus is a premium natural brain-boosting supplement, expertly formulated with a powerful trio: Lion's Mane mushroom, Ashwagandha, and Ginkgo Biloba. Designed to enhance memory, sharpen focus, and reduce stress, this blend supports your daily mental performance and long-term cognitive wellness.

Key Active Ingredients & Their Benefits:
🦁 Lion's Mane Mushroom (400mg) – The "smart mushroom". Stimulates nerve growth factor (NGF) for brain cell repair, improves memory, focus and learning, and supports mood and emotional balance.
🌿 Ashwagandha Root (200mg) – The ancient adaptogen. Anti-stress and calming, balances cortisol, enhances mental resilience and supports energy and sleep quality.
🍃 Ginkgo Biloba Leaf (50mg) – The brain's circulation booster. Increases blood flow to the brain, improving alertness, mental processing and short-term memory.

Who Should Use It?
Students, professionals under pressure, older adults seeking memory support, and anyone experiencing brain fog, forgetfulness or mental fatigue.

How to Take It:
• Serving size: 2 capsules per day, with water in the morning or with breakfast.
• Consistent use over 3–6 weeks delivers best results.

60 capsules (1-month supply) · Halal certified · 100% natural · No artificial fillers · Non-GMO.

⚠️ Avoid during pregnancy or breastfeeding unless advised by a healthcare professional. Store below 25°C, out of direct sunlight.`,
  },
  {
    name: "AnaboLean - Testosterone Booster & Anabolic Support (90 Capsules - One Month Supply)",
    cat: "mens-health",
    price: 26000,
    compareAtPrice: 32500,
    stock: 45,
    featured: true,
    images: [
      CDN + "Frontside_86932be4-ebf7-4f97-83a9-03f566ae31f5.png",
      CDN + "Ingredientsside_e465f112-d0c9-409f-ae16-cf1f93124430.png",
      CDN + "Descriptionside_c7d40c2a-f6e5-4dd3-b84b-c9d12045224e.png",
    ],
    short: "Natural testosterone booster & anabolic muscle support.",
    desc: `ANABOLEAN – Unleash Your Strength, Elevate Your Performance! 💪
The Most Comprehensive Formula in the Market!

ANABOLEAN is a high-potency natural anabolic supplement designed to boost testosterone levels, enhance muscle growth, and improve overall performance. Formulated with powerful herbal extracts and amino acids, it supports strength, stamina, endurance, and recovery—making it the perfect companion for athletes, bodybuilders, and fitness enthusiasts.

Key Benefits:
✔ Boosts Testosterone Production – Increases muscle-building potential, strength and performance.
✔ Accelerates Muscle Growth & Recovery – Supports protein synthesis and muscle repair.
✔ Enhances Stamina, Endurance & Vitality – Improves physical and mental energy levels.
✔ Supports Blood Circulation & Heart Health – Improves oxygen and nutrient delivery to muscles.
✔ Adaptogenic & Stress-Reducing – Reduces cortisol, helping prevent muscle breakdown.
✔ 100% Natural & Safe Formula – No synthetic additives or harmful chemicals.

Key Ingredients:
🔹 Tribulus Terrestris – A well-known testosterone booster for strength, muscle mass and libido.
🔹 Tongkat Ali (Longjack) – Enhances testosterone production, energy and endurance.
🔹 Ashwagandha – A potent adaptogen for stress reduction, strength and recovery.
🔹 Shilajit – A natural energy booster and rejuvenator for stamina and vitality.
🔹 Maca Root – Increases stamina, endurance and overall vitality.
🔹 L-Arginine – Improves blood circulation and nitric oxide production for better muscle pumps.
🔹 Piperine – Enhances nutrient absorption for maximum benefit.

💊 90 Capsules | High Potency Formula | 100% Natural
🔥 Elevate Your Strength, Energy & Performance with ANABOLEAN!`,
  },
  {
    name: "FertilityGene - 60 Capsules (One Month Supply)",
    cat: "mens-health",
    price: 42500,
    stock: 0,
    featured: false,
    images: [CDN + "mock_up_fertiltiy_gene.png"],
    short: "All-in-one herbal support for male fertility & reproductive vitality.",
    desc: `FertilityGene is a scientifically crafted, all-in-one herbal fertility supplement designed to naturally enhance male reproductive health. With a powerful blend of clinically studied ingredients, this formula supports testosterone production, sperm health, and overall reproductive vitality.

Key Benefits:
✔ Boosts Natural Testosterone Levels – Supports hormonal balance, energy and performance.
✔ Improves Sperm Count, Quality & Motility – Enhances male fertility and reproductive function.
✔ Revitalizes Reproductive Health – Promotes overall sexual wellness and stamina.
✔ Increases Strength & Endurance – Supports energy, muscle recovery and well-being.

Potent Herbal Ingredients:
🔹 Tribulus Terrestris (500mg, 60% Saponins) – A natural testosterone booster that enhances libido and stamina.
🔹 Ashwagandha (400mg, 5% Withanolides) – Reduces stress and supports testosterone production and fertility.
🔹 Mucuna Pruriens (400mg, 18% L-DOPA) – Boosts dopamine, enhances mood and supports sperm health.
🔹 Maca Root (500mg, 0.3% Macamides) – Increases libido, sperm production and energy levels.
🔹 Arginine (400mg, 99% Arginine AKG) – Enhances blood flow, sperm motility and endurance.
🔹 Piperine (50mg, 5% Extract) – Enhances nutrient absorption for better effectiveness.

Dosage & Directions:
• Take 2 capsules daily in the morning.
• Use regularly to maintain optimal reproductive health.
• Storage: Keep below 25°C, away from sunlight.`,
  },
  {
    name: "ManGene - Ultimate Sexual Enhancer for Men (90 Capsules - One Month Supply)",
    cat: "mens-health",
    price: 29900,
    stock: 0,
    featured: true,
    images: [CDN + "Frontside.png"],
    short: "Ultimate male performance, stamina & confidence enhancer.",
    desc: `ManGene – Maximum Performance, Fuller & Confidence

ManGene is a next-generation male vitality formula designed to help you perform better, last longer, and feel bigger—physically, mentally, and intimately. Crafted with potent herbal extracts and performance ingredients, it fuels your masculine energy from the inside out.

Why You'll Love ManGene:
🔥 Reignite Your Libido & Sexual Desire – Experience a stronger, more consistent drive.
💪 Boost Testosterone & Sperm Count – Support natural hormone balance and reproductive health.
⏳ Delay Premature Ejaculation – Enjoy greater stamina and performance control.
💥 Enhance Size, Firmness & Blood Flow – Promotes stronger, fuller erections with improved circulation.
🧠 Sharpen Focus & Energy – Power through your day with clarity and endurance.
🛡️ Daily Vitality & Stress Support – Reduce stress, increase confidence, and feel unstoppable.

Ingredients (each 3-capsule serving delivers a 1950mg blend):
🌿 Horny Goat Weed (500mg, 60% saponins) – Supports arousal, blood flow and firmer erections.
🌱 Mucuna Pruriens / L-DOPA (500mg, 18%) – Boosts dopamine, mood, libido and testosterone.
🥔 Maca Root (500mg, 0.3% macamides) – Enhances energy, sexual stamina and virility.
🌾 Safed Musli (300mg, 20–50% saponins) – Improves ejaculation control and libido.
💥 L-Arginine AKG (100mg, 99%) – Boosts nitric oxide and blood flow for performance.
🍃 Ginkgo Biloba (50mg, 24% flavonoids) – Enhances mental clarity and circulation.

✅ 100% Natural | 🛡️ High Potency | 🇿🇦 South African
90 Capsules per Bottle (1-Month Supply) · SAHPRA Category D 33.7 (Western Herbal Combination).

How to Use (men 18+): Take 3 capsules in the morning with water or juice. Optional: an extra dose one hour before intimacy. Do not exceed 6 capsules a day.`,
  },
  {
    name: "GynoShield - 60 Capsules (One Month Supply)",
    cat: "mens-health",
    price: 39900,
    stock: 0,
    featured: false,
    images: [CDN + "mock_up_gynogene.png"],
    short: "Natural anti-gynecomastia & hormonal balance formula for men.",
    desc: `GynoShield – Anti-Gynecomastia & Hormonal Balance Formula

GynoShield by GreenGene Pharma is scientifically formulated to block gynecomastia development and support its reduction by acting as a natural aromatase inhibitor. This formula helps regulate estrogen levels, boost free testosterone, and optimize androgen balance in men—an ideal natural alternative to pharmaceutical estrogen blockers.

Key Benefits:
• Reduces Gynecomastia (Male Breast Enlargement) – Helps block estrogen conversion.
• Regulates Estrogen & Supports Hormonal Balance – Naturally lowers high estrogen from aromatization.
• Boosts Free Testosterone Levels – Frees bound testosterone, enhancing male hormone function.
• Supports Athletes & Bodybuilders – Useful during training cycles and hormonal fluctuations.
• Promotes Leaner, Masculine Physique – Aids muscle hardening, fat loss and recomposition.
• 100% Natural Anti-Aromatase Support – A non-steroidal alternative to synthetic estrogen blockers.

Premium Ingredients:
• Chrysin (500mg) – A powerful aromatase inhibitor that reduces estrogen conversion.
• Stinging Nettle Root (200mg) – Binds to SHBG, increasing free testosterone.
• Tongkat Ali (100mg) – Boosts testosterone production and reduces cortisol.
• Ashwagandha (200mg) – Reduces stress-induced estrogen elevation and improves vitality.
• Shilajit (200mg) – Increases testosterone, endurance and energy.
• Piperine (50mg) – Enhances absorption and bioavailability.

Dosage: Adults (18+) take 2 capsules daily in the morning (up to 4 for advanced estrogen control).
⚠ Not recommended for individuals under 18, or those with hormone-related medical conditions.`,
  },
  {
    name: "Estrogene – Ultimate Hormonal Support for Women (60 Capsules - One Month Supply)",
    cat: "womens-health",
    price: 25000,
    compareAtPrice: 29900,
    stock: 50,
    featured: true,
    images: [CDN + "Estrogene_mock_up_front_side_a0e04420-fd1f-4034-99a1-6837d62a039a.png"],
    short: "Ultimate hormonal support & menopause relief for women.",
    desc: `🌸 Estrogene – Ultimate Hormonal Support for Women 🌸

Estrogene is a scientifically formulated herbal supplement designed to support hormonal balance in women. It combines powerful phytoestrogens, adaptogens, and antioxidants to naturally regulate estrogen levels and enhance overall well-being.

Who Can Use Estrogene?
✔️ Women experiencing menopause symptoms (hot flashes, mood swings, night sweats, vaginal dryness).
✔️ Those suffering from irregular menstruation or PCOS.
✔️ Women looking to enhance fertility and regulate hormonal imbalances.
✔️ Individuals seeking anti-aging benefits for skin elasticity, bone health and vitality.
✔️ Women dealing with stress, anxiety and poor sleep due to hormonal fluctuations.

Key Benefits:
🔹 Boosts Estrogen Levels – Maintains a balanced hormonal system.
🔹 Relieves Menopause Symptoms – Supports mood stability and hot flash relief.
🔹 Regulates Menstrual Cycles & PCOS – Assists fertility and hormone regulation.
🔹 Enhances Skin & Bone Health – Promotes skin elasticity and bone density.
🔹 Reduces Stress & Anxiety – Adaptogens improve sleep, mood and energy.

Powerful Ingredients:
🌿 Red Clover (100mg) – A plant-based estrogen that balances hormones and strengthens bones.
🌿 Black Cohosh (100mg) – Alleviates hot flashes, night sweats and mood swings.
🌿 Ashwagandha (200mg) – An adaptogen that combats stress, fatigue and hormonal imbalance.
🌿 Pimpinella Anisum (100mg) – Supports menstrual health, digestion and hormonal stability.
🌿 Linum Usitatissimum / Flaxseed (500mg) – A potent phytoestrogen for estrogen balance, heart health and skin elasticity.

Dosage: Adults (18+) take 2 capsules daily in the morning.
⚠️ Not suitable for pregnant or lactating women. Discontinue use if allergic reactions occur.`,
  },
  {
    name: "EstroLean - Fast Slimming & Fitness Support for Women (60 Capsules - One Month Supply)",
    cat: "womens-health",
    price: 25000,
    stock: 60,
    featured: true,
    images: [CDN + "Frontside_d0155ed1-3a32-455b-97d6-c37d813e6987.png"],
    short: "Triple-action slimming, fitness & hormonal support for women.",
    desc: `EstroLean – Triple-Action Slimming, Fitness & Hormonal Support for Women
The Only 100% Natural Formula That Targets 3 Core Fat-Loss Mechanisms

EstroLean isn't just another slimming supplement — it's a scientifically inspired holistic fat-loss solution created for the female body. Most weight-loss products rely on only one mechanism (usually just fat burning). EstroLean works through three synchronized mechanisms.

1. Appetite Control & Metabolic Fat Burning – Reduces cravings, supports calorie control, boosts metabolic fat-burning and enhances daily energy.
2. Cortisol Balance for Lower Belly Fat – Supports healthy cortisol levels to reduce stress-related cravings and abdominal fat.
3. Female Hormonal Harmony – Gentle phyto-compounds support feminine hormonal balance, body composition, workout performance and vitality.

Why EstroLean Is Unique:
✔ Triple-mechanism slimming formula (Appetite + Cortisol + Hormonal balance)
✔ 100% natural ingredients—no stimulants, no harsh chemicals
✔ Works with the female body, not against it
✔ Visible results in as little as 2 weeks
✔ High potency 1800mg formula

Ingredients:
🌿 Garcinia Cambogia – Supports appetite control and metabolic fat burning.
🌱 Ashwagandha Extract – Promotes stress and cortisol balance.
🌿 Maca Root – Supports hormonal balance, mood, vitality and well-being.
🌸 Red Clover – Natural phytoestrogens for feminine hormonal support.
💪 L-Arginine – Supports circulation, workout performance and muscle toning.
🍵 Green Tea + Caffeine + Curcumin + Piperine Blend – A thermogenic fat-burning complex with enhanced absorption.

Dosage: 18+ take 2 capsules daily in the morning (may increase up to 4 per day if needed).
EstroLean works best alongside healthy eating, regular movement and good hydration.`,
  },
  {
    name: "ClarifyX-24 - Fast Acting Acne Cream (100ml)",
    cat: "skin-care",
    price: 22500,
    stock: 0,
    featured: false,
    images: [CDN + "mockdesignClarifyX-24Tube.png"],
    short: "Fast-acting natural acne cream — visible results in 24 hours.",
    desc: `ClarifyX-24 – Fast-Acting Acne Cream

ClarifyX-24 is a powerful yet gentle acne treatment formulated for acne-prone and sensitive skin. Enriched with natural ingredients, antioxidants and anti-aging properties, it provides visible results in just 24 hours. This fast-acting cream helps reduce breakouts, soothe irritation, unclog pores and promote a clear, healthy complexion—all while being gentle on sensitive skin.

Key Ingredients & Their Benefits:
• Zinc Oxide (5%) – Anti-inflammatory and antibacterial; controls excess oil, reduces redness and speeds healing of acne scars.
• Carrot Seed Oil (5%) – Rich in antioxidants and vitamin A; promotes skin cell regeneration and fades scars.
• White Willow Bark Extract (2%) – A natural source of salicylic acid that gently exfoliates and unclogs pores.
• Liquorice Root Extract (2%) – Brightens skin, reduces redness and evens out tone for post-acne hyperpigmentation.
• Tea Tree Oil (0.5%) – A potent antibacterial that fights acne-causing bacteria and prevents future breakouts.
• Aloe Vera (5%) – Deeply hydrating and soothing; calms irritation and protects against premature aging.

Key Benefits:
✔ Fast-acting formula – visible improvements in just 24 hours.
✔ Soothes and heals acne-prone skin.
✔ Gentle yet effective – free from harsh chemicals.
✔ Anti-aging and skin repair.
✔ Controls oil and prevents future breakouts.
✔ 100% natural and dermatologist-friendly.

How to Use: Apply a small amount to affected areas or the entire face in the evening before bed and gently massage until absorbed. Wash off in the morning.`,
  },
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding GreenGene Pharma catalog…");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promotion.deleteMany();

  const catMap = {};
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    catMap[c.slug] = created.id;
  }

  for (const p of products) {
    const slug = slugify(p.name.split("(")[0]);
    await prisma.product.create({
      data: {
        name: p.name,
        slug,
        description: p.desc,
        shortDescription: p.short,
        price: p.price,
        compareAtPrice: p.compareAtPrice ?? null,
        sku: "GG-" + randomUUID().slice(0, 8).toUpperCase(),
        stock: p.stock,
        images: JSON.stringify(p.images),
        brand: "GreenGene Pharma",
        featured: p.featured ?? false,
        active: true,
        categoryId: catMap[p.cat],
      },
    });
  }

  await prisma.promotion.createMany({
    data: [
      { code: "WELCOME10", type: "percent", value: 10, active: true, minSpend: 0 },
      { code: "WELLNESS50", type: "fixed", value: 5000, active: true, minSpend: 50000 },
    ],
  });

  console.log(
    `Done: ${categories.length} categories, ${products.length} products, 2 promotions.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
