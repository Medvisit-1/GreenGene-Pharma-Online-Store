import { NextResponse } from "next/server";
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isAuthed } from "@/lib/auth";
import { normalizeImage, RASTER_EXT } from "@/lib/image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin maintenance: re-normalize every image already in /public/uploads
 * (trim margins + cap size) in place. Idempotent — re-running an already
 * trimmed image is a no-op. Filenames are unchanged so product image URLs
 * keep working.
 */
export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return NextResponse.json({ processed: 0, results: [], note: "no uploads dir" });
  }

  const results: Array<Record<string, unknown>> = [];
  for (const f of files) {
    const ext = (f.split(".").pop() || "").toLowerCase();
    if (!RASTER_EXT.includes(ext)) continue;
    const full = path.join(dir, f);
    try {
      const buf = await readFile(full);
      const before = await sharp(buf).metadata();
      const out = await normalizeImage(buf, ext);
      await writeFile(full, out);
      const after = await sharp(out).metadata();
      const size = (await stat(full)).size;
      results.push({
        file: f,
        before: `${before.width}x${before.height}`,
        after: `${after.width}x${after.height}`,
        kb: Math.round(size / 1024),
      });
    } catch (e) {
      results.push({ file: f, error: String(e) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
