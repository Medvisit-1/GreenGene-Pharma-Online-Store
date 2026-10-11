import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ensureArticles, productsForArticle } from "@/lib/wellness";
import { getRatingMap } from "@/lib/reviews";
import { WELLNESS_DISCLAIMER, parseArticleBody } from "@/lib/constants";
import { ProductCard } from "@/components/product-card";
import { NewsletterSignup } from "@/components/newsletter-signup";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const a = await prisma.newsletterArticle.findUnique({ where: { slug } });
  if (!a || !a.published) return { title: "Article not found" };
  return { title: a.title, description: a.excerpt };
}

export default async function ArticlePage({ params }: { params: Params }) {
  const { slug } = await params;
  await ensureArticles();
  const article = await prisma.newsletterArticle.findUnique({ where: { slug } });
  if (!article || !article.published) notFound();

  const products = await productsForArticle(article, 4);
  const ratings = await getRatingMap(products.map((p) => p.id));
  const more = await prisma.newsletterArticle.findMany({
    where: { published: true, id: { not: article.id } },
    orderBy: { sortOrder: "asc" },
    take: 3,
    skip: Math.max(0, article.sortOrder % 6),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/wellness" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Wellness Notes
      </Link>

      <article className="mx-auto mt-6 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-plum-600">GreenGene Wellness Notes</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight tracking-tight text-brand-800 sm:text-4xl">{article.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.excerpt}</p>

        <div className="mt-8 space-y-4 text-[15px] leading-7 text-foreground/85">
          {parseArticleBody(article.body).map((b, i) =>
            b.type === "h" ? (
              <h2 key={i} className="pt-4 text-xl font-semibold text-brand-800">{b.text}</h2>
            ) : b.type === "ul" ? (
              <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-brand-500">
                {b.items.map((it, j) => <li key={j}>{it}</li>)}
              </ul>
            ) : (
              <p key={i}>{b.text}</p>
            )
          )}
        </div>

        <div className="mt-8 flex gap-2.5 rounded-xl border border-border bg-surface/70 p-4 text-xs leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
          <p>
            <span className="font-semibold text-foreground">Please note: </span>
            {WELLNESS_DISCLAIMER}
          </p>
        </div>
      </article>

      {products.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-2xl font-semibold tracking-tight">From our range</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                product={{ ...p, rating: ratings.get(p.id)?.avg, reviewCount: ratings.get(p.id)?.count }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-14 grid gap-6 rounded-3xl bg-gradient-to-br from-plum-800 via-plum-700 to-grape p-8 text-white md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-2xl font-semibold">Get Wellness Notes by email</h2>
          <p className="mt-2 text-sm text-plum-100">
            Two short, practical reads a week about the ingredients in our range — plus member-only offers.
          </p>
        </div>
        <NewsletterSignup />
      </section>

      {more.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">Keep reading</h2>
          <ul className="grid gap-5 sm:grid-cols-3">
            {more.map((a) => (
              <li key={a.id}>
                <Link href={`/wellness/${a.slug}`} className="block h-full rounded-2xl border border-border bg-card p-5 transition hover:border-brand-300 hover:shadow-md">
                  <h3 className="font-semibold leading-snug text-brand-800">{a.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
