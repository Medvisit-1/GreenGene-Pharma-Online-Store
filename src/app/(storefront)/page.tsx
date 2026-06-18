import Link from "next/link";
import { Truck, ShieldCheck, FlaskConical, Leaf, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product-card";
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

  return (
    <>
      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center md:py-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            <Leaf className="h-3.5 w-3.5" /> Research · Quality · Trust
          </span>
          <h1 className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-balance text-3xl font-semibold leading-[1.12] tracking-tight text-brand-700 sm:text-4xl md:text-5xl">
            Empower Your Wellness, Live Better.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-brand-800/80">
            Empowering your journey to holistic well-being with our premium
            natural health solutions.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/products">
              <Button variant="accent" size="lg">
                Shop all products <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/promotions">
              <Button variant="outline" size="lg">View promotions</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="grid grid-cols-2 gap-6 rounded-3xl bg-surface p-8 shadow-sm lg:grid-cols-4">
          {[
            { icon: Leaf, title: "100% Natural", text: "Premium plant-based formulas" },
            { icon: ShieldCheck, title: "SAHPRA-Approved Facility", text: "Manufactured to high standards" },
            { icon: FlaskConical, title: "Research-Backed", text: "Clinically studied ingredients" },
            { icon: Truck, title: "Fast Delivery", text: "Across South Africa" },
          ].map((f) => (
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
              Research, Quality &amp; Trust
            </h2>
            <p className="mt-4 text-white/85">
              GreenGene products are thoughtfully developed by a team of expert
              researchers, utilising the highest-quality ingredients and
              showcasing unique, innovative formulations. Each product is backed
              by rigorous science and research, setting us apart from the rest.
            </p>
            <p className="mt-4 text-white/85">
              What sets us apart is our transparency — our ingredients are fully
              disclosed with precise dosages clearly stated, and every product is
              manufactured in a SAHPRA-approved facility under ethical practices.
            </p>
            <Link href="/products" className="mt-7 inline-block">
              <Button variant="accent" size="lg">Explore our range</Button>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { k: "100%", v: "Natural ingredients" },
              { k: "Full", v: "Dosage transparency" },
              { k: "SAHPRA", v: "Approved facility" },
            ].map((s) => (
              <div key={s.v} className="rounded-2xl bg-white/10 p-5 text-center">
                <p className="text-2xl font-semibold text-accent">{s.k}</p>
                <p className="mt-1 text-xs text-white/80">{s.v}</p>
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
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="overflow-hidden rounded-3xl bg-brand-700 px-8 py-12 text-center text-white md:py-16">
          <h2 className="text-2xl font-semibold md:text-3xl">Get 10% off your first order</h2>
          <p className="mx-auto mt-2 max-w-md text-white/80">
            Use code <span className="font-bold text-accent">WELCOME10</span> at checkout.
          </p>
          <Link href="/products" className="mt-6 inline-block">
            <Button variant="accent" size="lg">Start shopping</Button>
          </Link>
        </div>
      </section>
    </>
  );
}
