import Link from "next/link";
import { Truck, ShieldCheck, FlaskConical, Leaf, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
import { getRatingMap } from "@/lib/reviews";
import { getSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({
      where: { active: true, featured: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const ratings = await getRatingMap(featured.map((p) => p.id));
  const featuredWithRatings = featured.map((p) => ({
    ...p,
    rating: ratings.get(p.id)?.avg,
    reviewCount: ratings.get(p.id)?.count,
  }));

  const s = await getSettings();
  const features = [
    { icon: Leaf, title: s.feat1Title, text: s.feat1Text },
    { icon: ShieldCheck, title: s.feat2Title, text: s.feat2Text },
    { icon: FlaskConical, title: s.feat3Title, text: s.feat3Text },
    { icon: Truck, title: s.feat4Title, text: s.feat4Text },
  ];
  const stats = [
    { k: s.rqtStat1Key, v: s.rqtStat1Val },
    { k: s.rqtStat2Key, v: s.rqtStat2Val },
    { k: s.rqtStat3Key, v: s.rqtStat3Val },
  ];
  const rqtParagraphs = s.rqtBody.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);

  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center md:py-28">
          {s.heroBadge && (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Leaf className="h-3.5 w-3.5" /> {s.heroBadge}
            </span>
          )}
          <h1 className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-brand-700 sm:text-4xl md:text-5xl">
            {s.heroHeading}
          </h1>
          {s.heroSubheading && (
            <p className="mx-auto mt-5 max-w-xl text-lg text-brand-800/80">
              {s.heroSubheading}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {s.heroPrimaryLabel && (
              <Link href={s.heroPrimaryLink || "/products"}>
                <Button variant="accent" size="lg">
                  {s.heroPrimaryLabel} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            {s.heroSecondaryLabel && (
              <Link href={s.heroSecondaryLink || "/promotions"}>
                <Button variant="outline" size="lg">{s.heroSecondaryLabel}</Button>
              </Link>
            )}
          </div>
          {s.heroImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={s.heroImage}
              alt=""
              className="animate-fade-in-up mx-auto mt-12 max-h-[440px] w-auto rounded-3xl object-contain"
            />
          )}
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="grid grid-cols-2 gap-6 rounded-3xl bg-surface p-8 shadow-sm lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Research, Quality & Trust */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="grid items-center gap-10 rounded-3xl bg-brand-800 p-8 text-white md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {s.rqtHeading}
            </h2>
            {rqtParagraphs.map((para, i) => (
              <p key={i} className="mt-4 text-white/85">{para}</p>
            ))}
            {s.rqtButtonLabel && (
              <Link href={s.rqtButtonLink || "/products"} className="mt-7 inline-block">
                <Button variant="accent" size="lg">{s.rqtButtonLabel}</Button>
              </Link>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {stats.map((st) => (
              <div key={st.v} className="rounded-2xl bg-white/10 p-3 text-center sm:p-5">
                <p className="break-words text-base font-semibold leading-tight text-accent sm:text-2xl">{st.k}</p>
                <p className="mt-1 text-[11px] leading-tight text-white/80 sm:text-xs">{st.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Shop by category</h2>
            <p className="text-sm text-muted-foreground">Find exactly what you need</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-3xl"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image ?? ""}
                alt={c.name}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-bold leading-tight text-white drop-shadow">
                  {c.name}
                </h3>
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-accent opacity-0 transition-all duration-300 group-hover:opacity-100">
                  Shop now <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/10" />
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Featured products</h2>
            <p className="text-sm text-muted-foreground">Hand-picked favourites</p>
          </div>
          <Link href="/products" className="text-sm font-semibold text-brand-700 hover:underline">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featuredWithRatings.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Promo / advertising banner */}
      {s.promoBannerEnabled === "1" && s.promoBannerImage && (
        <section className="mx-auto max-w-7xl px-4 py-4">
          {s.promoBannerLink ? (
            <Link href={s.promoBannerLink} className="block overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.promoBannerImage} alt="" className="w-full object-cover transition-transform duration-500 hover:scale-[1.02]" />
            </Link>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.promoBannerImage} alt="" className="w-full rounded-3xl object-cover" />
          )}
        </section>
      )}

      {/* CTA banner */}
      {(s.ctaHeading || s.ctaButtonLabel) && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="overflow-hidden rounded-3xl bg-brand-700 px-8 py-12 text-center text-white md:py-16">
            {s.ctaHeading && (
              <h2 className="text-2xl font-semibold md:text-3xl">{s.ctaHeading}</h2>
            )}
            {s.ctaSubheading && (
              <p className="mx-auto mt-2 max-w-md text-white/80">{s.ctaSubheading}</p>
            )}
            {s.ctaButtonLabel && (
              <Link href={s.ctaButtonLink || "/products"} className="mt-6 inline-block">
                <Button variant="accent" size="lg">{s.ctaButtonLabel}</Button>
              </Link>
            )}
          </div>
        </section>
      )}
    </>
  );
}
