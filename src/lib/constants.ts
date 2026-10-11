// Shared commerce constants (amounts in cents, ZAR).
// These are fallback defaults; live values come from admin settings.
export const FREE_SHIPPING_THRESHOLD = 75000; // R750
export const FLAT_SHIPPING = 6500; // R65

/**
 * Compute shipping for a subtotal (cents).
 * @param flat flat shipping fee in cents
 * @param threshold free-shipping threshold in cents (0 = never free)
 */
export function shippingFor(
  subtotalCents: number,
  flat: number = FLAT_SHIPPING,
  threshold: number = FREE_SHIPPING_THRESHOLD
): number {
  if (subtotalCents <= 0) return 0;
  if (threshold > 0 && subtotalCents >= threshold) return 0;
  return flat;
}

export const SA_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

/** Cookie set when a visitor closes the referral welcome banner (read by the server, so no flash). */
export const REF_BANNER_HIDE_COOKIE = "gg_ref_banner_hidden";

/** Shown under every wellness article (web + email). */
export const WELLNESS_DISCLAIMER =
  "This article is for general information only and is not medical advice. Our products are not intended to diagnose, treat, cure or prevent any disease, and individual results vary. Speak to your doctor or pharmacist before starting a supplement, especially if you are pregnant or breastfeeding, take medication or have a medical condition.";

/** Parse an article body into blocks: paragraphs, "## " headings and "- " bullet lists. */
export type ArticleBlock = { type: "p" | "h"; text: string } | { type: "ul"; items: string[] };
export function parseArticleBody(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  for (const chunk of body.replace(/\r\n?/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) blocks.push({ type: "p", text: para.join(" ") });
      if (list.length) blocks.push({ type: "ul", items: list });
      para = [];
      list = [];
    };
    for (const line of lines) {
      if (line.startsWith("## ")) {
        flush();
        blocks.push({ type: "h", text: line.slice(3) });
      } else if (/^[-•*] /.test(line)) {
        if (para.length) { blocks.push({ type: "p", text: para.join(" ") }); para = []; }
        list.push(line.slice(2));
      } else {
        if (list.length) { blocks.push({ type: "ul", items: list }); list = []; }
        para.push(line);
      }
    }
    flush();
  }
  return blocks;
}

/**
 * Newsletter teaser of an article: its opening paragraph plus the first list of
 * points (max 4) with that list's heading. The full article lives on /wellness.
 */
export function articleTeaser(body: string): { intro: string | null; heading: string | null; points: string[] } {
  const blocks = parseArticleBody(body);
  const intro = blocks.find((b) => b.type === "p");
  const listAt = blocks.findIndex((b) => b.type === "ul");
  const list = listAt >= 0 ? blocks[listAt] : null;
  const before = listAt > 0 ? blocks[listAt - 1] : null;
  return {
    intro: intro && intro.type === "p" ? intro.text : null,
    heading: before && before.type === "h" ? before.text : null,
    points: list && list.type === "ul" ? list.items.slice(0, 4) : [],
  };
}
