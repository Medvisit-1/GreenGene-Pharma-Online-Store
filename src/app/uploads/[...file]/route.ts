import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Serve user-uploaded images from the (Railway) volume at runtime.
// `next start` only serves files that existed in /public at BUILD time, so
// files written to the volume after build are invisible to the static layer —
// this route reads them straight off disk instead.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const { file } = await params;
  // Reject path-traversal attempts; only allow plain filename segments.
  const safe = (file ?? []).filter(
    (s) => s && !s.includes("..") && !s.includes("/") && !s.includes("\\")
  );
  if (!safe.length) return new NextResponse("Not found", { status: 404 });

  const full = path.join(process.cwd(), "public", "uploads", ...safe);
  try {
    const data = await readFile(full);
    const ext = (safe[safe.length - 1].split(".").pop() || "").toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
