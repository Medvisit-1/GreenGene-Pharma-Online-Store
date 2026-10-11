import { NextResponse } from "next/server";
import { sendContactMessage } from "@/lib/email";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

// Receives contact-form submissions and emails them to the store inbox.
// Email is sent in the background so the form responds instantly.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  // Honeypot: a hidden field people never see. Bots fill it — pretend it worked.
  if (str(body.website, 200)) return NextResponse.json({ ok: true });

  const msg = {
    name: str(body.name, 80),
    email: str(body.email, 120).toLowerCase(),
    phone: str(body.phone, 30),
    subject: str(body.subject, 150),
    message: str(body.message, 5000),
  };
  if (!msg.name) return NextResponse.json({ ok: false, error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(msg.email)) return NextResponse.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  if (msg.message.length < 2) return NextResponse.json({ ok: false, error: "Please write a message." }, { status: 400 });

  if (!rateLimit(`contact:ip:${clientIp(req)}`, 5, 10 * 60_000) || !rateLimit(`contact:email:${msg.email}`, 3, 10 * 60_000)) {
    return NextResponse.json(
      { ok: false, error: "You've sent a few messages already — please wait a few minutes, or email us directly." },
      { status: 429 }
    );
  }

  void sendContactMessage(msg).catch((e) =>
    console.error("[contact] email failed:", (e as Error).message)
  );
  return NextResponse.json({ ok: true });
}
