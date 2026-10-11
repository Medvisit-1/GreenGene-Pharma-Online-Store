import Link from "next/link";
import { BookOpen, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ensureArticles } from "@/lib/wellness";
import { NewsletterSignup } from "@/components/newsletter-signup";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Wellness Notes",
  description: "Plain-English guides to the natural ingredients in our products — what they are, what research suggests and how to use them safely.",
};

export default async function WellnessPage() {
  await ensureArticles();
  const articles = await prisma.newsletterArticle.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 p-8 text-white sm:p-12">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold ring-1 ring-white/20">
          <BookOpen className="h-3.5 w-3.5" /> GreenGene Wellness Notes
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          The science behind our ingredients, in plain English
        </h1>
        <p className="mt-3 max-w-2xl text-brand-50/90">
          From green tea to ashwagandha — what each ingredient is, what research suggests, and how to use it safely.
          New notes land in subscribers&apos; inboxes twice a week.
        </p>
        <div className="mt-6 max-w-md">
          <NewsletterSignup />
        </div>
      </header>

      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <li key={a.id}>
            <Link
              href={`/wellness/${a.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold leading-snug text-brand-800 group-hover:text-brand-600">{a.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
              <span className="mt-4 text-sm font-semibold text-brand-700">Read more →</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Mail className="mt-0.5 h-4 w-4 shrink-0" />
        Subscribers get one note by email on our sending days, plus occasional offers. Unsubscribe any time with one click.
      </p>
    </div>
  );
}
