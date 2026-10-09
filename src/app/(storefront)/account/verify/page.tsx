import Link from "next/link";
import { ShieldCheck, Clock } from "lucide-react";
import { loginTokenIsValid } from "@/lib/customer-auth";
import { confirmLogin } from "../actions";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in", robots: { index: false } };

// The emailed link lands here and asks for one tap to finish signing in. Email
// security scanners "click" links automatically; requiring a POST stops them
// from using up the one-time link before the customer does.
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const valid = await loginTokenIsValid(token);

  return (
    <div className="mx-auto flex max-w-7xl justify-center px-4 py-20">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        {valid ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
              <ShieldCheck className="h-7 w-7 text-brand-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-brand-800">Almost there</h1>
            <p className="mt-2 text-sm text-muted-foreground">Tap below to finish signing in.</p>
            <form action={confirmLogin} className="mt-6">
              <input type="hidden" name="token" value={token} />
              <Button type="submit" size="lg" className="w-full">Sign in to my account</Button>
            </form>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <Clock className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-brand-800">This link has expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign-in links work once and last 15 minutes. Request a fresh one below.
            </p>
            <Link href="/account" className="mt-6 inline-block">
              <Button size="lg">Get a new link</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
