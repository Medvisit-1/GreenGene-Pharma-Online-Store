import Link from "next/link";
import { MailX, CheckCircle2 } from "lucide-react";
import { verifyUnsubscribe } from "@/lib/newsletter";
import { confirmUnsubscribe } from "../../newsletter-actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unsubscribe", robots: { index: false } };

// Needs a button press (not just a link visit) so email scanners that
// pre-open links can't unsubscribe people by accident.
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; t?: string; k?: string; done?: string; invalid?: string }>;
}) {
  const { e = "", t = "", k, done, invalid } = await searchParams;
  const reminders = k === "reminders";
  const valid = !done && !invalid && e && t && verifyUnsubscribe(e, t, reminders ? "reminders" : "newsletter");
  const what = reminders ? "refill and saved-cart reminder emails" : "newsletter emails";

  return (
    <div className="mx-auto flex max-w-7xl justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        {done ? (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-brand-600" />
            <h1 className="mt-4 text-2xl font-bold text-brand-800">You&apos;re unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You won&apos;t receive {what} any more. Order emails still arrive as normal.
            </p>
          </>
        ) : valid ? (
          <>
            <MailX className="mx-auto h-10 w-10 text-brand-600" />
            <h1 className="mt-4 text-2xl font-bold text-brand-800">Unsubscribe?</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Stop {what} to <strong className="text-foreground">{e}</strong>.
            </p>
            <form action={confirmUnsubscribe} className="mt-6">
              <input type="hidden" name="e" value={e} />
              <input type="hidden" name="t" value={t} />
              {reminders && <input type="hidden" name="k" value="reminders" />}
              <Button type="submit" size="lg" className="w-full">Unsubscribe me</Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-brand-800">Link not valid</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please use the unsubscribe link from one of our emails, or change your email preferences
              under My details in your account.
            </p>
          </>
        )}
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:underline">
          Back to the shop
        </Link>
      </div>
    </div>
  );
}
