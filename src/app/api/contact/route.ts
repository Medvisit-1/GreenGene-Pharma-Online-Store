import { NextResponse } from "next/server";

// Receives contact-form submissions. For now this logs to the server;
// later it can email the team or persist to a ContactMessage table.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[contact] new message:", body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
