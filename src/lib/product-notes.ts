import "server-only";
import { prisma } from "@/lib/prisma";
import { importantNote, type LabelStatement } from "@/lib/label-statements";

/** Per-product "Important" note overrides, stored in the Setting table as `productNote:<product id>`. */
export const NOTE_MAX = 1500;
const key = (productId: string) => `productNote:${productId}`;

export function cleanNoteText(v: unknown): string {
  return String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, NOTE_MAX);
}

/** The saved override for one product (empty fields mean "use the default"), or null. */
export async function getProductNoteOverride(productId: string): Promise<LabelStatement | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: key(productId) } });
    if (!row?.value) return null;
    let statement = "";
    let warning = "";
    try {
      const j = JSON.parse(row.value);
      statement = cleanNoteText(j?.statement);
      warning = cleanNoteText(j?.warning);
    } catch {
      statement = cleanNoteText(row.value); // plain text
    }
    if (!statement && !warning) return null;
    return { statement: statement || undefined, warning: warning || undefined };
  } catch {
    return null;
  }
}

export async function saveProductNoteOverride(productId: string, note: { statement: string; warning: string }) {
  const statement = cleanNoteText(note.statement);
  const warning = cleanNoteText(note.warning);
  if (!statement && !warning) return clearProductNoteOverride(productId);
  const value = JSON.stringify({ statement, warning });
  await prisma.setting.upsert({
    where: { key: key(productId) },
    create: { key: key(productId), value },
    update: { value },
  });
}

export async function clearProductNoteOverride(productId: string) {
  await prisma.setting.deleteMany({ where: { key: key(productId) } });
}

/** Effective note: override fields where set, else the existing default (label statement, else store-wide). */
export async function effectiveProductNote(
  product: { id: string; slug: string },
  fallback: string | null | undefined,
): Promise<LabelStatement | null> {
  const base = importantNote(product.slug, fallback);
  const o = await getProductNoteOverride(product.id);
  if (!o) return base;
  const statement = o.statement ?? base?.statement;
  const warning = o.warning ?? base?.warning;
  if (!statement && !warning) return null;
  return { statement, warning };
}
