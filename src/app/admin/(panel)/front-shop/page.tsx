import { CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { saveFrontShop } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { SingleImageField } from "@/components/admin/single-image";
import { NewReleaseEditor } from "@/components/admin/new-release-editor";
import { parseNewReleaseCards } from "@/lib/new-release";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage" };

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

function Toggle({ name, on, children, hint }: { name: string; on: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-3.5">
      <span className="relative mt-0.5 inline-flex items-center">
        <input type="checkbox" name={name} defaultChecked={on} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{children}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

function Step({ n, title, note, children }: { n: number; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--g-plum)] font-[family-name:var(--font-g-serif)] text-lg font-semibold text-[color:var(--g-gold)]">{n}</span>
        <div>
          <h2>{title}</h2>
          {note && <p className="text-xs text-muted-foreground">{note}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function AdminFrontShop({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const [s, products] = await Promise.all([
    getSettings(),
    prisma.product.findMany({ where: { active: true }, select: { name: true, slug: true }, orderBy: { name: "asc" } }),
  ]);
  const linkOptions = [
    { label: "All products", value: "/products" },
    { label: "Promotions", value: "/promotions" },
    { label: "Home", value: "/" },
    ...products.map((p) => ({ label: p.name, value: `/products/${p.slug}` })),
  ];
  const newReleaseCards = parseNewReleaseCards(s.newReleaseCards);
  const on = (v: string) => v !== "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1>Homepage</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything on your homepage, top to bottom. Products, prices, rewards and articles fill in automatically. Here you
            choose what shows and what it says.
          </p>
        </div>
        <Link href="/" target="_blank" className="gg-quick"><ExternalLink className="h-4 w-4" /> View homepage</Link>
      </div>

      {saved && (
        <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" /> Homepage saved.
        </p>
      )}

      <form action={saveFrontShop} className="max-w-4xl space-y-5">
        <Step n={1} title="Top of every page" note="The thin plum strip above the header, and an optional scrolling promo bar.">
          <div className="space-y-4">
            <div>
              <label className={label}>Announcement strip</label>
              <input name="announcement" defaultValue={s.announcement} className={input} />
            </div>
            <Toggle name="marqueeEnabled" on={s.marqueeEnabled === "1"} hint="A scrolling bar across the very top, for promos and news.">Scrolling promo bar</Toggle>
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
              <div>
                <label className={label}>Promo bar text</label>
                <input name="marqueeText" defaultValue={s.marqueeText} className={input} />
              </div>
              <div>
                <label className={label}>Speed (seconds)</label>
                <input name="marqueeSpeed" inputMode="numeric" defaultValue={s.marqueeSpeed} className={input} />
              </div>
            </div>
          </div>
        </Step>

        <Step n={2} title="Greeting & rewards card" note="“Good morning, Thandi” with the search box and goal circles (your categories), next to the customer's rewards progress.">
          <label className={label}>Handwritten line under the greeting</label>
          <input name="homeTagline" defaultValue={s.homeTagline} maxLength={80} className={input} />
          <p className="mt-2 text-xs text-muted-foreground">The rewards card follows Admin → Rewards (it becomes a delivery card if rewards are switched off).</p>
        </Step>

        <Step n={3} title="Banner slider" note="Changes every 6 seconds. Each slide fills itself from your shop.">
          <div className="space-y-4">
            <div>
              <label className={label}>Heading</label>
              <input name="homeSlidesHeading" defaultValue={s.homeSlidesHeading} maxLength={60} className={input} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <Toggle name="homeSlideRewards" on={on(s.homeSlideRewards)} hint="Welcome gift, refer-a-friend and milestones, from Rewards.">Rewards ad</Toggle>
              <Toggle name="homeSlideOffer" on={on(s.homeSlideOffer)} hint="The product with the biggest saving (set a “compare at” price).">Best offer</Toggle>
              <Toggle name="homeSlideArticle" on={on(s.homeSlideArticle)} hint="The latest Wellness Note with a matching product.">Wellness Note</Toggle>
            </div>
            <div>
              <label className={label}>Photo on the rewards slide</label>
              <SingleImageField name="homeRewardsPhoto" initial={s.homeRewardsPhoto} />
              <p className="mt-1.5 text-xs text-muted-foreground">A portrait photo works best; on phones the top part (the face) is shown.</p>
            </div>
          </div>
        </Step>

        <Step n={4} title="More sections">
          <div className="grid gap-3 md:grid-cols-3">
            <Toggle name="homeShowJourney" on={on(s.homeShowJourney)} hint="Signup → newsletter → saving, with the animated path.">“Path to healthy savings” band</Toggle>
            <Toggle name="homeShowRoutine" on={on(s.homeShowRoutine)} hint="Daily routine and refill countdown from the customer's last order.">Routine & refill cards</Toggle>
            <Toggle name="homeShowPopular" on={on(s.homeShowPopular)} hint="Your featured products (tick “Featured” on a product).">Popular products</Toggle>
          </div>
          <div className="mt-4">
            <label className={label}>Popular products heading</label>
            <input name="homePopularHeading" defaultValue={s.homePopularHeading} maxLength={60} className={input} />
          </div>
        </Step>

        <Step n={5} title="New Release cards" note="A swipeable row of picture cards at the bottom of the homepage. To change a picture: remove it on the card, then upload a new one.">
          <Toggle name="newReleaseEnabled" on={s.newReleaseEnabled === "1"}>Show on the homepage</Toggle>
          <div className="my-4">
            <label className={label}>Section heading</label>
            <input name="newReleaseHeading" defaultValue={s.newReleaseHeading} className={input} />
          </div>
          <label className={label}>Cards</label>
          <NewReleaseEditor name="newReleaseCards" initial={newReleaseCards} linkOptions={linkOptions} />
        </Step>

        <div className="sticky bottom-4 z-10 flex items-center gap-3 rounded-full bg-[color:var(--g-plum)] p-2 pl-6 text-sm text-[color:var(--g-on-primary)] shadow-xl">
          <span className="flex-1">Changes go live as soon as you save.</span>
          <Button type="submit" variant="accent" size="md">Save homepage</Button>
        </div>
      </form>
    </div>
  );
}
