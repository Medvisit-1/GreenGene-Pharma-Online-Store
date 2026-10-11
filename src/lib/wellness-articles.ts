/**
 * Starter library for the automated wellness newsletter and the /wellness pages.
 * Seeded into the NewsletterArticle table the first time it's needed; after that
 * the admin can edit, add, unpublish or reorder articles in Admin → Newsletter.
 *
 * Writing rules (SAHPRA / CPA): describe what research suggests, never promise
 * results, never claim to diagnose, treat, cure or prevent a disease, and always
 * point people to a healthcare practitioner.
 *
 * Body format: paragraphs separated by a blank line, "## " for a sub-heading and
 * "- " for bullet points.
 */
export type ArticleSeed = {
  slug: string;
  title: string;
  subject: string;
  excerpt: string;
  body: string;
  productKeywords: string;
};

export const WELLNESS_ARTICLES: ArticleSeed[] = [
  {
    slug: "green-tea-and-belly-fat",
    title: "Green tea and belly fat: what the research really says",
    subject: "🍵 Can green tea help with belly fat? The honest answer",
    excerpt:
      "Green tea is one of the most studied plants for weight management. Here's what it can (and can't) do for your waistline.",
    productKeywords: "green tea, garcinia",
    body: `Green tea has been part of daily life in Asia for centuries, and today it's one of the most researched natural ingredients for weight management. The interest comes from two compounds that work together: catechins (especially one called EGCG) and a small, natural amount of caffeine.

## How it may work
- Catechins and caffeine may gently increase thermogenesis — the amount of energy (kilojoules) your body burns as heat.
- Some studies suggest green tea may increase fat oxidation, particularly during exercise, meaning the body may use a little more fat for fuel.
- A few clinical trials using catechin-rich green tea drinks over about 12 weeks reported small reductions in waist circumference and abdominal (visceral) fat compared with a placebo drink.

## The honest picture
Reviews of these studies generally find the effect is modest — think of green tea as a helpful teammate, not a magic solution. The people who see the best results are those who combine it with a balanced diet, regular movement and good sleep. Results also vary between people; regular coffee drinkers may notice less effect because they're already used to caffeine.

## Getting the most from green tea
- Enjoy 2–3 cups a day, ideally between meals.
- Pair it with a daily walk or workout — the research suggests the combination matters.
- Skip the sugar and honey, which quickly cancel out the benefit.
- If you're sensitive to caffeine, avoid it late in the day so it doesn't disturb your sleep.

## A note on safety
Very high doses of concentrated green tea extract have been linked to rare liver problems, so stick to the dose on the label and don't double up on several green tea products. If you're pregnant, breastfeeding, have a liver condition or take medication, check with your healthcare practitioner first.

In our range, green tea extract is one of the ingredients in EstroLean, alongside other botanicals, as part of a women's fitness and wellness routine.`,
  },
  {
    slug: "ashwagandha-stress-adaptogen",
    title: "Ashwagandha: the ancient adaptogen for modern stress",
    subject: "🌿 Feeling stretched thin? Meet ashwagandha",
    excerpt:
      "Used in Ayurveda for over 3,000 years, ashwagandha is now one of the most studied herbs for everyday stress and sleep.",
    productKeywords: "ashwagandha",
    body: `Ashwagandha (Withania somnifera) is a small shrub whose root has been used in Ayurvedic tradition for thousands of years. It's known as an "adaptogen" — a plant traditionally used to help the body adapt to everyday stress.

## What the studies suggest
- Several randomised, placebo-controlled studies in adults found that ashwagandha root extract, taken for 6–8 weeks, was associated with lower self-reported stress and lower cortisol (the "stress hormone") levels.
- Some trials also reported improvements in sleep quality and in how rested people felt on waking.
- In men, a few small studies suggest it may support healthy testosterone levels and strength gains when combined with resistance training.

## Why it shows up in so many formulas
Because ashwagandha seems to support the body's overall stress response, it pairs naturally with ingredients for focus, mood, sleep, hormonal balance and performance. That's why you'll find it in several of our formulas — each combining it with different supporting botanicals.

## Tips for using ashwagandha
- Be patient: most studies measured benefits after 6–8 weeks of daily use.
- Take it at the same time every day; many people prefer the evening.
- Keep up the basics — sleep, sunlight, movement and connection all help your stress response too.

## Who should be careful
Ashwagandha isn't recommended during pregnancy or breastfeeding. Speak to your healthcare practitioner first if you have a thyroid or autoimmune condition, or take sedatives, thyroid medication, blood-pressure or blood-sugar medication.`,
  },
  {
    slug: "l-theanine-calm-focus",
    title: "L-theanine: calm focus without the drowsiness",
    subject: "🧘 The tea compound for calm, clear focus",
    excerpt:
      "Ever wondered why a cup of tea feels calmer than coffee? Meet L-theanine, the amino acid behind 'relaxed alertness'.",
    productKeywords: "theanine",
    body: `L-theanine is an amino acid found naturally in tea leaves. It's a big part of why a cup of tea can feel calm and focused at the same time — a state researchers sometimes call "relaxed alertness".

## What the research suggests
- Studies measuring brain activity show L-theanine may increase alpha waves, which are associated with a calm but alert state of mind.
- Small clinical trials suggest it may help people feel less stressed during demanding tasks.
- Combined with caffeine, L-theanine has been studied for attention and task-switching — it may take the "edge" off caffeine while supporting focus.
- Some research suggests it may support sleep quality, not by making you drowsy, but by helping you relax.

## Why people like it
Unlike many calming ingredients, L-theanine is generally described as non-drowsy, so many people use it during the day — at work, while studying or before a big presentation.

## Simple ways to support calm focus
- Work in focused blocks of 25–50 minutes with short breaks.
- Step outside for daylight in the morning.
- Swap your third coffee for a green tea.
- Put your phone in another room during deep-work time.

L-theanine is one of the ingredients in Zenax and ADHD Zen+, alongside other botanicals for calm and focus. As always, chat to your healthcare practitioner before starting any supplement, especially for children or if you take medication.`,
  },
  {
    slug: "magnesium-sleep-and-stress",
    title: "Magnesium: the mineral your stressed body may be missing",
    subject: "😴 Sleep, stress and the mineral most of us overlook",
    excerpt:
      "Magnesium is involved in over 300 processes in the body — including relaxing your muscles and nervous system.",
    productKeywords: "magnesium",
    body: `Magnesium is an essential mineral involved in more than 300 enzyme reactions in the body, including energy production, muscle function and the nervous system. Yet surveys suggest many people don't get enough from their diet, and stress may increase how much the body uses.

## Why magnesium matters for calm and sleep
- It helps regulate the nervous system and muscle relaxation.
- It plays a role in producing melatonin, the hormone that signals it's time to sleep.
- Some studies, particularly in older adults with low magnesium intake, suggest supplementation may support sleep quality.

## Not all magnesium is the same
Magnesium glycinate (magnesium bound to the amino acid glycine) is often chosen because it's well absorbed and generally gentle on the stomach. Glycine itself has been studied for its role in sleep.

## Food sources
- Pumpkin seeds, almonds and cashews
- Leafy greens such as spinach
- Legumes — beans, lentils and chickpeas
- Wholegrains and oats
- Dark chocolate (yes, really — in moderation!)

## An evening wind-down routine
- Dim the lights an hour before bed.
- Keep screens out of the bedroom.
- Try a warm shower or bath.
- Go to bed and wake up at roughly the same time every day.

Magnesium glycinate is one of the ingredients in Zenax. If you have kidney problems or take antibiotics, osteoporosis or heart medication, ask your healthcare practitioner before taking magnesium supplements.`,
  },
  {
    slug: "lions-mane-brain-health",
    title: "Lion's Mane: the mushroom that's caught science's attention",
    subject: "🍄 The mushroom researchers are studying for brain health",
    excerpt:
      "With its shaggy white 'mane', this mushroom is a favourite in traditional Asian practice — and an emerging area of brain research.",
    productKeywords: "lion",
    body: `Lion's Mane (Hericium erinaceus) is an edible mushroom with long, shaggy spines that look a little like a lion's mane. It has a long history of use in traditional Chinese and Japanese practice, and in recent years it has become one of the most talked-about natural ingredients for the brain.

## What makes it interesting
Lion's Mane contains compounds called hericenones and erinacines. In laboratory and animal studies, these compounds have been shown to stimulate nerve growth factor (NGF) — a protein involved in the growth and maintenance of nerve cells.

## What human studies suggest
- A small study in older adults with mild memory concerns found that those taking Lion's Mane for 16 weeks scored better on a cognitive test than the placebo group — though the benefit faded after they stopped.
- Other small studies have looked at mood, and suggest it may support feelings of wellbeing.

Human research is still early and the studies are small, so we'd describe Lion's Mane as promising rather than proven.

## Everyday habits for a sharper mind
- Move your body — exercise is one of the best-supported habits for brain health.
- Keep learning: a new language, instrument or hobby.
- Protect your sleep; it's when the brain clears out waste.
- Eat oily fish, nuts, berries and leafy greens.
- Stay social — conversation is a brain workout.

Lion's Mane Plus combines Lion's Mane with ashwagandha and ginkgo biloba. People with mushroom allergies should avoid it, and anyone on blood-thinning medication should check with a healthcare practitioner first.`,
  },
  {
    slug: "curcumin-and-piperine",
    title: "Turmeric's secret partner: why curcumin needs black pepper",
    subject: "🌶️ Why turmeric works better with black pepper",
    excerpt:
      "Curcumin is a well-studied compound — but on its own, the body absorbs very little of it. Here's the clever fix.",
    productKeywords: "curcumin, piperine, black pepper",
    body: `Turmeric gives curry its golden colour, and its most studied compound, curcumin, has been researched in thousands of studies for its antioxidant properties and its role in the body's natural inflammatory response.

## The absorption problem
On its own, curcumin is poorly absorbed — much of it passes through the body before it can be used. That's where black pepper comes in.

## Enter piperine
Piperine is the compound that gives black pepper its bite. A frequently cited study found that taking piperine with curcumin increased curcumin levels in the blood by up to 2,000% compared with curcumin alone. That's why you'll often see the two paired together, and why piperine appears in several formulas to support the absorption of other botanicals.

## What curcumin may support
- Antioxidant activity, helping the body manage oxidative stress
- Joint comfort after exercise, according to some small studies
- Metabolic health — some studies have looked at curcumin alongside diet and exercise in weight management, with modest results

## Cooking with turmeric
- Add turmeric and a crack of black pepper to soups, curries and roast vegetables.
- Cook it with a little healthy fat (like olive oil), since curcumin is fat-soluble.
- Try a "golden milk": warm milk, turmeric, black pepper, cinnamon and a little honey.

Curcumin and piperine appear in EstroLean, and piperine is included in several of our formulas to support absorption. Curcumin may interact with blood thinners, diabetes medication and some other medicines, so check with your healthcare practitioner if you take any, or if you have gallbladder problems.`,
  },
  {
    slug: "maca-energy-and-vitality",
    title: "Maca: the Peruvian root for energy and vitality",
    subject: "⚡ The Andean root grown 4,000 m above sea level",
    excerpt:
      "Grown high in the Andes, maca has been used for centuries to support stamina, mood and libido.",
    productKeywords: "maca",
    body: `Maca (Lepidium meyenii) is a root vegetable related to broccoli and cabbage. It grows in the harsh conditions of the Peruvian Andes, more than 4,000 metres above sea level, and has been used there as a food and traditional tonic for centuries.

## What the research suggests
- Several small clinical studies suggest maca may support libido (sexual desire) in both men and women.
- Some studies in women going through menopause reported improvements in mood and in symptoms such as hot flushes, though the evidence is limited.
- People often report feeling more energetic, and some studies have looked at its role in mood and wellbeing.

Interestingly, maca doesn't appear to work by changing hormone levels directly — researchers are still exploring how it works.

## Different colours, different roots
Maca comes in yellow, red and black varieties. Research is ongoing into whether they have different effects, with black maca most often studied in men and red maca in women.

## How to enjoy maca
- Its malty, nutty flavour works well in smoothies, oats and baking.
- Like many botanicals, it may take several weeks of regular use to notice a difference.

Maca is one of the ingredients in AnaboLean, FertilityGene, ManGene and EstroLean. If you have a thyroid condition or a hormone-sensitive condition, or you're pregnant or breastfeeding, speak to your healthcare practitioner before using it.`,
  },
  {
    slug: "tongkat-ali-and-tribulus",
    title: "Tongkat Ali and Tribulus: traditional herbs for men's vitality",
    subject: "💪 Two traditional herbs for men's energy and vitality",
    excerpt:
      "From the rainforests of Southeast Asia to the Mediterranean, these two plants have long been used to support male vitality.",
    productKeywords: "tongkat, tribulus",
    body: `Men's natural testosterone levels gradually decline from around their 30s, and stress, poor sleep and weight gain can all play a part too. Two plants that are often used to support male vitality are Tongkat Ali and Tribulus terrestris.

## Tongkat Ali (Eurycoma longifolia)
Also called "Malaysian ginseng", this rainforest shrub has been used traditionally in Southeast Asia. Small clinical studies suggest it may support healthy testosterone levels in men with low levels, as well as mood, stress and energy. Some studies also looked at its role in muscle strength alongside exercise.

## Tribulus terrestris
Tribulus is a flowering plant found in warm regions around the world. The research on testosterone is mixed, but some studies suggest it may support libido and sexual wellbeing.

## The foundations matter most
Research consistently shows these lifestyle habits have a big impact on male hormonal health:
- Sleep 7–9 hours — testosterone is largely produced during sleep.
- Lift weights or do resistance training 2–3 times a week.
- Keep a healthy waistline; excess belly fat is linked with lower testosterone.
- Get enough zinc, vitamin D and healthy fats in your diet.
- Manage stress and limit alcohol.

Tongkat Ali appears in AnaboLean and GynoShield, and Tribulus in AnaboLean and FertilityGene. These products aren't suitable for women who are pregnant or breastfeeding, and men with a hormone-sensitive condition, heart condition or who take medication should consult a healthcare practitioner first.`,
  },
  {
    slug: "menopause-black-cohosh-red-clover",
    title: "Navigating menopause naturally: black cohosh and red clover",
    subject: "🌸 Hot flushes and mood swings? Natural support for menopause",
    excerpt:
      "Menopause is a natural transition, but the symptoms can be tough. Here are two botanicals women have used for generations.",
    productKeywords: "black cohosh, red clover",
    body: `Menopause is a natural stage of life, but the shift in hormones can bring hot flushes, night sweats, disturbed sleep and mood changes. Many women look for gentle, natural support alongside advice from their doctor.

## Black cohosh
Black cohosh (Actaea racemosa) is a North American plant traditionally used by Indigenous peoples for women's health. It's one of the most studied herbs for menopause. Some clinical trials suggest it may help ease hot flushes and night sweats, although results across studies are mixed.

## Red clover
Red clover is rich in isoflavones — plant compounds with a structure similar to oestrogen (sometimes called phytoestrogens). Some studies suggest red clover isoflavones may modestly reduce how often hot flushes happen.

## Lifestyle tips that may help
- Dress in layers and keep your bedroom cool.
- Identify your triggers — spicy food, alcohol and caffeine are common ones.
- Stay active; strength training also supports bone health, which matters more after menopause.
- Try slow, paced breathing when a hot flush starts.
- Prioritise calcium, vitamin D and protein in your diet.

Black cohosh and red clover are ingredients in Estrogene. Women with a history of hormone-sensitive conditions (such as breast cancer), liver problems, or who take hormone therapy or blood thinners should speak to their healthcare practitioner first. Not for use during pregnancy or breastfeeding.`,
  },
  {
    slug: "rhodiola-and-bacopa-focus",
    title: "Rhodiola and Brahmi: two herbs for mental stamina",
    subject: "🧠 Brain fog? Two herbs studied for mental stamina",
    excerpt:
      "One grows in the Arctic, the other in Indian wetlands. Both have been studied for focus, memory and mental fatigue.",
    productKeywords: "rhodiola, brahmi, bacopa",
    body: `Long days, busy minds and too much screen time can leave us feeling mentally drained. Two botanicals that have been studied for mental performance are Rhodiola rosea and Brahmi (Bacopa monnieri).

## Rhodiola: for mental fatigue
Rhodiola grows in cold, mountainous regions of Europe and Asia and is known as an adaptogen. Some studies suggest it may help reduce mental fatigue and support performance during stressful periods — such as exam time or night shifts.

## Brahmi: for memory
Brahmi is a creeping herb used for centuries in Ayurveda. Several clinical trials suggest it may support memory and the speed of learning new information. The catch: it works slowly — most studies measured effects after 8–12 weeks of daily use.

## Habits for better focus
- Single-task: close the tabs you don't need.
- Use the "two-minute rule" — if it takes less than two minutes, do it now.
- Drink water; even mild dehydration can affect concentration.
- Get outside for a 10-minute walk when your focus fades.

Rhodiola and Brahmi are ingredients in ADHD Zen+. Ask your healthcare practitioner before use if you take antidepressants, thyroid medication or other prescription medicines, and before giving any supplement to a child.`,
  },
  {
    slug: "passionflower-and-lemon-balm",
    title: "Passionflower and lemon balm: nature's calming duo",
    subject: "🌼 Two gentle herbs for calmer days and better nights",
    excerpt:
      "Traditionally used in calming teas for generations, these two herbs are now being studied for everyday tension and restlessness.",
    productKeywords: "passionflower, lemon balm",
    body: `Long before supplements, people turned to calming herbal teas at the end of a long day. Two of the most popular were passionflower and lemon balm.

## Passionflower
Passionflower (Passiflora incarnata) is a climbing vine with striking purple flowers. It's thought to support levels of GABA, a brain messenger that helps calm nerve activity. Some small studies suggest it may help with feelings of nervousness and with sleep quality.

## Lemon balm
Lemon balm (Melissa officinalis) is a lemon-scented member of the mint family. Small clinical studies suggest it may support calmness and mood, and it has traditionally been combined with other calming herbs for restlessness and sleep.

## Make your own calming ritual
- Brew a cup of caffeine-free herbal tea after dinner.
- Try "box breathing": breathe in for 4, hold for 4, out for 4, hold for 4.
- Write down tomorrow's to-do list before bed to clear your mind.
- Spend a few minutes outdoors, noticing what you can see and hear.

Passionflower appears in Soul and ADHD Zen+, and lemon balm in Soul. These herbs may cause drowsiness in some people, so avoid driving if affected, and don't combine them with sedatives or alcohol. Consult your healthcare practitioner if you're pregnant, breastfeeding or take medication.

If you're struggling with your mood for more than two weeks, please reach out to your doctor — or SADAG on 0800 567 567. You don't have to manage it alone.`,
  },
  {
    slug: "healthy-waistline-habits",
    title: "7 everyday habits for a healthier waistline",
    subject: "🥗 7 small habits that add up to a healthier waistline",
    excerpt:
      "There's no magic pill for belly fat — but these seven simple, evidence-based habits make a real difference over time.",
    productKeywords: "green tea, garcinia, slimming",
    body: `Belly fat — particularly the deeper "visceral" fat around the organs — is linked to metabolic health, so a healthy waistline is about more than how your jeans fit. The good news: small, consistent changes add up.

## 1. Prioritise protein
Protein helps you feel full and supports muscle while you lose fat. Include eggs, beans, fish, chicken, yoghurt or lentils at every meal.

## 2. Fill up on fibre
Vegetables, legumes, oats and fruit slow digestion and keep you satisfied. Studies link higher soluble fibre intake with less visceral fat over time.

## 3. Cut back on sugary drinks
Fizzy drinks, energy drinks and sweetened coffees add up quickly. Swap them for water, sparkling water with lemon, or unsweetened green tea.

## 4. Walk more
A daily brisk walk of 30 minutes is one of the simplest ways to support fat loss — especially after meals.

## 5. Add strength training
Building muscle increases the energy you use at rest. Two or three sessions a week is a great start — bodyweight exercises count.

## 6. Sleep 7–9 hours
Short sleep is linked to increased appetite and weight gain. Protect your bedtime like an appointment.

## 7. Manage stress
Ongoing stress raises cortisol, which is associated with fat storage around the middle. Walks, breathing exercises and time with friends all help.

## Where supplements fit in
Supplements can complement — never replace — these habits. Green tea extract and Garcinia cambogia are among the ingredients in EstroLean, designed to be used alongside a balanced diet and exercise. Individual results vary. Speak to your healthcare practitioner before starting any weight-management product, especially if you have a medical condition or take medication.`,
  },
  {
    slug: "ginkgo-memory-and-circulation",
    title: "Ginkgo biloba: wisdom from the world's oldest tree",
    subject: "🍃 The 200-million-year-old tree studied for memory",
    excerpt:
      "Ginkgo trees have existed for over 200 million years. Their fan-shaped leaves are now one of the most popular herbal extracts in the world.",
    productKeywords: "ginkgo",
    body: `The ginkgo tree is often called a "living fossil" — it has existed for more than 200 million years, and some individual trees are over 1,000 years old. Extracts of its fan-shaped leaves are among the most widely used herbal supplements in the world.

## How it may work
Ginkgo leaf extract contains flavonoids and terpenoids, which have antioxidant properties. Research suggests it may support healthy blood flow, including to the brain and extremities.

## What the studies suggest
- Some studies suggest ginkgo may support memory and mental processing, particularly in older adults, though results have been mixed.
- Because of its role in circulation, it has also been studied for men's sexual wellbeing.

## Everyday ways to support healthy circulation
- Move every hour if you sit for long periods.
- Stay hydrated.
- Don't smoke — it's one of the biggest risks to blood vessels.
- Eat colourful fruit and vegetables rich in flavonoids, like berries, citrus and onions.

Ginkgo biloba appears in Lion's Mane Plus and ManGene. Ginkgo can increase the risk of bleeding, so stop taking it before surgery and don't combine it with blood thinners, aspirin or anti-inflammatory medication without your doctor's advice. Not recommended during pregnancy or for people with epilepsy.`,
  },
  {
    slug: "tea-tree-and-acne",
    title: "Clear skin, naturally: tea tree oil, zinc and salicylic acid",
    subject: "✨ The natural ingredients dermatologists talk about for breakouts",
    excerpt:
      "Breakouts aren't only a teenage problem. Here's how three well-known ingredients may help keep skin clear.",
    productKeywords: "tea tree, salicylic, acne",
    body: `Acne happens when pores get blocked by oil and dead skin cells, and bacteria multiply inside them. Hormones, stress and genetics all play a role — which is why adults get breakouts too.

## Tea tree oil
Tea tree oil comes from the leaves of the Australian Melaleuca alternifolia tree. It has natural antibacterial properties. In a well-known study, a 5% tea tree oil gel reduced the number of acne spots compared with a placebo gel, and it tended to cause less dryness than some conventional products, though it worked more slowly.

## Salicylic acid
Salicylic acid is a beta-hydroxy acid (BHA) that's oil-soluble, meaning it can get into pores to help loosen the dead skin and oil that clog them. It's one of the most widely used ingredients for blemish-prone skin.

## Zinc
Zinc may help regulate oil production and calm redness, and it's commonly included in products for blemish-prone skin.

## A simple routine for blemish-prone skin
- Cleanse twice a day with a gentle cleanser — no harsh scrubbing.
- Apply treatment products to clean, dry skin.
- Use a light, non-comedogenic moisturiser.
- Wear sunscreen every day.
- Don't pick or squeeze spots — it can lead to scarring.
- Change your pillowcase often and clean your phone screen.

These ingredients are found in ClarifyX-24. Do a patch test first, avoid the eyes and broken skin, and stop if irritation occurs. If you have severe, painful or scarring acne, see a doctor or dermatologist.`,
  },
  {
    slug: "shilajit-and-stinging-nettle",
    title: "Shilajit and stinging nettle: two unusual ingredients for men",
    subject: "⛰️ The mineral-rich resin from the Himalayas",
    excerpt:
      "One seeps from Himalayan rocks, the other is a garden 'weed'. Both have a long history in men's wellness.",
    productKeywords: "shilajit, nettle",
    body: `Some of the most interesting natural ingredients come from surprising places. Shilajit and stinging nettle are two of them.

## Shilajit
Shilajit is a sticky, tar-like resin that seeps from rocks in high mountain ranges like the Himalayas. It forms over centuries from decomposed plant matter and is rich in fulvic acid and minerals. It's a cornerstone of Ayurvedic tradition, where it's valued as a rejuvenating tonic. Small clinical studies suggest it may support energy levels and healthy testosterone levels in men.

## Stinging nettle
Yes — the plant that stings when you brush against it! Nettle root has been studied for men's health, particularly for supporting urinary comfort in ageing men. It's also been researched for its role in how hormones are bound in the blood.

## Men's wellness checklist
- Book an annual check-up, including blood pressure, cholesterol and blood sugar.
- Over 40? Ask your doctor about prostate health checks.
- Keep your waistline in check — it's linked to hormonal health.
- Sleep, strength training and stress management are your best natural boosters.

Shilajit is an ingredient in AnaboLean and GynoShield, and stinging nettle in GynoShield. Only choose purified shilajit from a trusted source. If you have a heart, blood-pressure or prostate condition, or take medication, speak to your healthcare practitioner first.`,
  },
  {
    slug: "flaxseed-and-plant-oestrogens",
    title: "Flaxseed and aniseed: plant power for women's hormonal balance",
    subject: "🌾 Phytoestrogens explained — and why women love flaxseed",
    excerpt:
      "What are phytoestrogens, and why do they matter for women's hormonal wellness? A simple guide.",
    productKeywords: "flax, anis, pimpinella",
    body: `Phytoestrogens are natural plant compounds with a structure similar to the hormone oestrogen. They're much weaker than the body's own oestrogen, and researchers believe they may help support hormonal balance during life stages like perimenopause and menopause.

## Flaxseed
Flaxseed is the richest dietary source of lignans, a type of phytoestrogen. It's also packed with fibre and omega-3 fatty acids. Some studies suggest flaxseed may support heart health and healthy cholesterol levels, and it has been studied for menopause symptoms with mixed results.

## Aniseed (Pimpinella anisum)
Aniseed has a liquorice-like flavour and has been used traditionally in women's health. A few small studies suggest it may help reduce hot flushes in menopausal women.

## How to add flaxseed to your diet
- Choose ground flaxseed — whole seeds can pass through the body undigested.
- Sprinkle 1–2 tablespoons on oats, yoghurt or salads.
- Add it to smoothies or use it in baking.
- Store it in the fridge to keep it fresh.
- Drink plenty of water, as it's high in fibre.

Flaxseed and Pimpinella anisum appear in Estrogene, and Pimpinella anisum in EstroLean. Women with a hormone-sensitive condition, or who are pregnant, breastfeeding or taking hormonal medication, should consult their healthcare practitioner first.`,
  },
  {
    slug: "tulsi-holy-basil",
    title: "Tulsi (holy basil): the 'queen of herbs'",
    subject: "🌱 Why holy basil is called the 'queen of herbs'",
    excerpt:
      "In India, tulsi is grown in many homes and considered sacred. Here's why it's earned a place in modern wellness.",
    productKeywords: "tulsi, holy basil",
    body: `Tulsi, also known as holy basil (Ocimum tenuiflorum), is a fragrant plant that's grown in many homes in India and revered in Ayurveda as the "queen of herbs". Like ashwagandha, it's considered an adaptogen.

## What the research suggests
- Small clinical studies suggest tulsi may support the body's response to everyday stress and help with feelings of tension.
- It's rich in antioxidants such as eugenol.
- Some studies have explored its role in supporting healthy blood sugar as part of a balanced diet.

## Enjoying tulsi
Tulsi tea has a warm, peppery, slightly clove-like flavour. A cup in the afternoon makes a lovely caffeine-free ritual — a moment to pause, breathe and reset.

## Five-minute stress resets
- Step away from your screen and stretch.
- Drink a glass of water slowly.
- Message someone you care about.
- Write down three things you're grateful for.
- Take ten slow breaths, making each out-breath longer than the in-breath.

Tulsi is an ingredient in Zenax. Avoid it if you're pregnant or trying to conceive, and speak to your healthcare practitioner if you take blood thinners, diabetes medication or are having surgery.`,
  },
];
