"use client";

import { useState } from "react";
import { Star, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        rating,
        author: fd.get("author"),
        email: fd.get("email"),
        title: fd.get("title"),
        body: fd.get("body"),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not submit your review. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-brand-50/60 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-brand-500" />
        <h3 className="mt-3 font-bold">Thank you for your review!</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your review has been submitted and will appear once it&apos;s approved by our team.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-surface p-6">
      <h3 className="text-lg font-bold">Write a review</h3>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            className="p-0.5"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                i <= (hover || rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-brand-300"
              )}
            />
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          name="author"
          required
          placeholder="Your name"
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <input
          name="email"
          type="email"
          placeholder="Email (optional, not shown)"
          className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
      </div>
      <input
        name="title"
        placeholder="Review title (optional)"
        className="mt-3 w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
      <textarea
        name="body"
        required
        rows={4}
        placeholder="Share your experience with this product…"
        className="mt-3 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-4">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit review"}
      </Button>
      <p className="mt-2 text-xs text-muted-foreground">
        Reviews are checked by our team before they appear.
      </p>
    </form>
  );
}
