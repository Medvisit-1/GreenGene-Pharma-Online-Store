/**
 * Back-label statements, copied word for word from each product's label image on the store.
 * Shown in the "Important" note on the product page. Products not listed here fall back to
 * the store-wide "productDisclaimer" setting (the note the store showed before).
 *
 * LABEL TYPO: every printed label says "indented" where it should say "intended".
 * It is reproduced exactly as printed. To correct it on the site, change this one word.
 */
const INTENDED = "indented"; // label typo: indented (should be intended)

const CATEGORY = "Category D 33.7 Complementary Medicine – Western Herbal - Combination";
/** Wording used on the EstroLean, Soul and AnaboLean labels. */
const NOT_EVALUATED_A = `This medicine has not been evaluated by SAHPRA. This medicine is not ${INTENDED} to diagnose, treat or prevent any disease.`;
/** Wording used on the Estrogene and Zenax labels. */
const NOT_EVALUATED_B = `This medicine has not been evaluated by SAHPRA and is not ${INTENDED} to diagnose, treat or prevent any disease.`;

export type LabelStatement = {
  /** the discipline / regulatory statement as printed */
  statement?: string;
  /** the warning or precautions line as printed */
  warning?: string;
};

export const LABEL_STATEMENTS: Record<string, LabelStatement> = {
  "estrolean-fast-slimming-fitness-support-for-women": {
    statement: `${CATEGORY}. ${NOT_EVALUATED_A}`,
    warning: "Discontinue if you experience allergic reactions. Consult with your health professional if pregnant or breastfeeding.",
  },
  "estrogene-ultimate-hormonal-support-for-women": {
    statement: `${CATEGORY}. ${NOT_EVALUATED_B}`,
    warning: "Not suitable for pregnant or lactating women. Discontinue if you experience allergic reactions.",
  },
  "zenax-natural-mind-stress-support-formula": {
    statement: `${CATEGORY}. ${NOT_EVALUATED_B}`,
    warning:
      "Not suitable for pregnant or lactating women. Discontinue if you experience allergic reactions. High doses may cause drowsiness. Avoid operating vehicles or heavy machinery after use.",
  },
  "soul-natural-formula-for-stress-depression-anxiety-emotional-balance": {
    statement: `${CATEGORY}. ${NOT_EVALUATED_A}`,
    warning: "Discontinue if you experience any allergic reactions.",
  },
  "anabolean-testosterone-booster-anabolic-support": {
    // printed without a full stop after "Combination" and after the warning
    statement: `${CATEGORY} ${NOT_EVALUATED_A}`,
    warning: "Discontinue if you experience any allergic reactions",
  },
  "glowgene-skin-cream-antioxidant-anti-pigment-youthful-glow": {
    // cosmetic: the label has no discipline statement, so the store-wide note is shown with these precautions
    warning:
      "Store in cool dry place away from direct sunlight. Conduct patch test first for sensitivity or allergic reactions. Discontinue use if it irritates the skin or causes redness.",
  },
};

/** The "Important" note for a product: its label statement, else the store-wide note. */
export function importantNote(slug: string, fallback: string | null | undefined): LabelStatement | null {
  const label = LABEL_STATEMENTS[slug];
  const statement = label?.statement ?? (fallback || undefined);
  const warning = label?.warning;
  if (!statement && !warning) return null;
  return { statement, warning };
}
