import { NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";

export const runtime = "nodejs";

// Receives contact-form submissions and emails them to the store inbox.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    await sendContactMessage(body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
