/**
 * Product page extras: "How to use", "Warnings & precautions" and FAQs.
 * Pure helpers (no database) so they can be tested and used anywhere.
 */

export type Faq = { q: string; a: string };

/** FAQs are typed as blocks separated by a blank line: first line the question, the rest the answer. */
export function parseFaqs(text: string | null | undefined): Faq[] {
  return (text ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((l) => l.trim()).filter(Boolean))
    .filter((lines) => lines.length >= 2)
    .map(([q, ...a]) => ({
      q: q.replace(/^Q[:.)]\s*/i, ""),
      a: a.join("\n").replace(/^A[:.)]\s*/i, ""),
    }));
}

const USE_HEADING = /^(?:💊\s*)?(suggested use|how to use|how to take it|directions(?: for use)?|dosage|usage|recommended use)\s*:\s*(.*)$/i;
const WARNING_LINE = /^\s*(⚠️?|⚠)\s*/u;
const clean = (l: string) => l.replace(WARNING_LINE, "").replace(/^(warnings?|cautions?|precautions?)\s*:\s*/i, "").trim();

/**
 * Split an existing description into { description, howToUse, warnings }:
 * the "Suggested Use / How to use / Dosage" section and any ⚠ warning lines
 * are moved out; everything else stays in the description.
 */
export function splitDescription(description: string): { description: string; howToUse: string; warnings: string } {
  const lines = description.replace(/\r\n?/g, "\n").split("\n");
  const keep: string[] = [];
  const use: string[] = [];
  const warn: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.trim().match(USE_HEADING);
    if (m && !use.length) {
      if (m[2]) use.push(m[2].trim());
      // Take the following lines up to the next blank line
      while (i + 1 < lines.length && lines[i + 1].trim() !== "") {
        const next = lines[++i].trim();
        if (WARNING_LINE.test(next)) warn.push(clean(next));
        else use.push(next);
      }
      continue;
    }
    if (WARNING_LINE.test(line)) {
      warn.push(clean(line));
      continue;
    }
    keep.push(line);
  }
  return {
    description: keep.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    howToUse: use.join("\n").trim(),
    warnings: warn.join("\n").trim(),
  };
}
