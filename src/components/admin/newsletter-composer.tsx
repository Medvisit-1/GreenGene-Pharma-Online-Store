"use client";

import { useActionState, useState } from "react";
import { Loader2, Send, FlaskConical } from "lucide-react";
import {
  sendNewsletterToAll,
  sendTestNewsletter,
  type ComposeState,
} from "@/app/admin/newsletter-actions";
import { Button } from "@/components/ui/button";

const input =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1 block text-xs font-semibold text-muted-foreground";

export function NewsletterComposer({ subscribers, defaultTestEmail }: { subscribers: number; defaultTestEmail: string }) {
  // Controlled fields so the draft survives sending a test.
  const [f, setF] = useState({
    subject: "", heading: "", body: "", imageUrl: "", buttonLabel: "", buttonLink: "/products", testEmail: defaultTestEmail,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF((v) => ({ ...v, [k]: e.target.value }));

  const [testState, testAction, testing] = useActionState<ComposeState, FormData>(sendTestNewsletter, { status: "idle" });
  const [sendState, sendAction, sending] = useActionState<ComposeState, FormData>(sendNewsletterToAll, { status: "idle" });
  const state = sendState.status !== "idle" ? sendState : testState;

  return (
    <form className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={label}>Subject line *</label>
        <input name="subject" value={f.subject} onChange={set("subject")} placeholder="e.g. New: Zenax is back in stock 🌿" className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Heading inside the email (optional — defaults to the subject)</label>
        <input name="heading" value={f.heading} onChange={set("heading")} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Email text * (leave a blank line between paragraphs)</label>
        <textarea name="body" rows={9} value={f.body} onChange={set("body")} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Image URL (optional — e.g. a product photo link from your store)</label>
        <input name="imageUrl" value={f.imageUrl} onChange={set("imageUrl")} placeholder="https://… or /uploads/…" className={input} />
      </div>
      <div>
        <label className={label}>Button text (optional)</label>
        <input name="buttonLabel" value={f.buttonLabel} onChange={set("buttonLabel")} placeholder="Shop now" className={input} />
      </div>
      <div>
        <label className={label}>Button link</label>
        <input name="buttonLink" value={f.buttonLink} onChange={set("buttonLink")} placeholder="/products" className={input} />
      </div>

      {state.status !== "idle" && (
        <p className={`sm:col-span-2 rounded-xl px-4 py-3 text-sm ${state.status === "ok" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4 sm:col-span-2">
        <div className="min-w-56 flex-1">
          <label className={label}>Send a test to</label>
          <input name="testEmail" type="email" value={f.testEmail} onChange={set("testEmail")} className={input} />
        </div>
        <Button type="submit" formAction={testAction} variant="outline" size="sm" disabled={testing || sending}>
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} Send test
        </Button>
        <Button
          type="submit"
          formAction={sendAction}
          size="sm"
          disabled={testing || sending || subscribers === 0}
          onClick={(e) => {
            if (!confirm(`Send "${f.subject || "(no subject)"}" to ${subscribers} subscriber${subscribers === 1 ? "" : "s"}? This can't be undone.`)) {
              e.preventDefault();
            }
          }}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send to {subscribers} subscriber{subscribers === 1 ? "" : "s"}
        </Button>
      </div>
    </form>
  );
}
