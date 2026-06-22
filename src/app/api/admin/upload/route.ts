import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { isAuthed } from "@/lib/auth";
import { normalizeImage } from "@/lib/image";

export const runtime = "nodejs";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, WEBP, GIF or AVIF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 6 MB)." }, { status: 400 });
  }

  const raw = Buffer.from(await file.arrayBuffer());
  // Trim transparent/solid margins + cap size so all product images render
  // at a consistent visual size on the storefront.
  const buffer = await normalizeImage(raw, ext);
  const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);

  return NextResponse.json({ url: `/uploads/${name}` });
}
