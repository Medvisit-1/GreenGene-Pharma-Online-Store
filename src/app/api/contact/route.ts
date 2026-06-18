import { NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";

export const runtime = "nodejs";

// Receives contact-form submissions and emails them to the store inbox.
// Email is sent in the background so the form responds instantly.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    void sendContactMessage(body).catch((e) =>
      console.error("[contact] email failed:", (e as Error).message)
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
