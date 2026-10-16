import "server-only";
import { prisma } from "@/lib/prisma";

/** Information packs shipped with the site (in /public/info-packs). */
const BUNDLED: { match: RegExp; url: string }[] = [
  { match: /^estrogene\b/i, url: "/info-packs/estrogene-information-pack.pdf" },
];

let done = false;

/**
 * One-time: attach the bundled information packs to their products. Runs once
 * per database (remembered in settings), so if the admin later removes or
 * replaces a pack, it is never put back.
 */
export async function ensureBundledInfoPacks() {
  if (done) return;
  done = true;
  try {
    const KEY = "infoPacksSeeded";
    if (await prisma.setting.findUnique({ where: { key: KEY } })) return;
    const products = await prisma.product.findMany({ where: { infoPackUrl: null }, select: { id: true, name: true } });
    for (const p of products) {
      const pack = BUNDLED.find((b) => b.match.test(p.name));
      if (pack) await prisma.product.update({ where: { id: p.id }, data: { infoPackUrl: pack.url } });
    }
    await prisma.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: "1" }, update: {} });
  } catch {
    done = false; // database not ready — try again next time
  }
}
