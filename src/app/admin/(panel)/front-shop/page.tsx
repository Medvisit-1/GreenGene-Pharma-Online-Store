import { CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getSettings } from "@/lib/settings";
import { saveFrontShop } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { SingleImageField } from "@/components/admin/single-image";

export const dynamic = "force-dynamic";
export const metadata = { title: "Front Shop" };

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";
const card = "rounded-2xl border border-border bg-surface p-6";

export default async function AdminFrontShop({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const s = await getSettings();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Front Shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit your homepage hero, feature cards, the trust section, and the floating banner.
          </p>
        </div>
        <Link href="/" target="_blank">
          <Button variant="outline">
            <ExternalLink className="h-4 w-4" /> View homepage
          </Button>
        </Link>
      </div>

      {saved && (
        <p className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> Front shop saved.
        </p>
      )}

      <form action={saveFrontShop} className="max-w-3xl space-y-5">
        {/* Floating banner */}
        <div className={card}>
          <h2 className="mb-1 font-bold">Floating announcement banner</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            A scrolling bar across the very top of the site for promos & announcements.
          </p>
          <label className="mb-4 flex cursor-pointer items-center gap-3">
            <span className="relative inline-flex items-center">
              <input
                type="checkbox"
                name="marqueeEnabled"
                defaultChecked={s.marqueeEnabled === "1"}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:bg-brand-600 peer-checked:after:translate-x-5" />
            </span>
            <span className="text-sm font-medium">Show the banner</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
            <div>
              <label className={label}>Banner text</label>
              <input name="marqueeText" defaultValue={s.marqueeText} className={input} />
            </div>
            <div>
              <label className={label}>Speed (seconds)</label>
              <input
                name="marqueeSpeed"
                inputMode="numeric"
                defaultValue={s.marqueeSpeed}
                className={input}
              />
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className={card}>
          <h2 className="mb-4 font-bold">Hero section</h2>
          <div className="grid gap-4">
            <div>
              <label className={label}>Badge text</label>
              <input name="heroBadge" defaultValue={s.heroBadge} className={input} />
            </div>
            <div>
              <label className={label}>Heading</label>
              <input name="heroHeading" defaultValue={s.heroHeading} className={input} />
            </div>
            <div>
              <label className={label}>Subheading</label>
              <textarea name="heroSubheading" defaultValue={s.heroSubheading} rows={2} className={input} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Primary button — text</label>
                <input name="heroPrimaryLabel" defaultValue={s.heroPrimaryLabel} className={input} />
              </div>
              <div>
                <label className={label}>Primary button — link</label>
                <input name="heroPrimaryLink" defaultValue={s.heroPrimaryLink} className={input} />
              </div>
              <div>
                <label className={label}>Secondary button — text</label>
                <input name="heroSecondaryLabel" defaultValue={s.heroSecondaryLabel} className={input} />
              </div>
              <div>
                <label className={label}>Secondary button — link</label>
                <input name="heroSecondaryLink" defaultValue={s.heroSecondaryLink} className={input} />
              </div>
            </div>
            <div>
              <label className={label}>Hero image (optional)</label>
              <SingleImageField name="heroImage" initial={s.heroImage} />
              <p className="mt-1.5 text-xs text-muted-foreground">
                Shown under the buttons. Leave empty to keep the clean text-only hero.
              </p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className={card}>
          <h2 className="mb-1 font-bold">Feature cards</h2>
          <p className="mb-4 text-xs text-muted-foreground">The four trust badges under the hero (icons are fixed).</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-xl border border-border p-4">
                <label className={label}>Card {n} — title</label>
                <input
                  name={`feat${n}Title`}
                  defaultValue={s[`feat${n}Title` as keyof typeof s] as string}
                  className={input}
                />
                <label className={`${label} mt-3`}>Card {n} — subtitle</label>
                <input
                  name={`feat${n}Text`}
                  defaultValue={s[`feat${n}Text` as keyof typeof s] as string}
                  className={input}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Research, Quality & Trust */}
        <div className={card}>
          <h2 className="mb-4 font-bold">“Research, Quality &amp; Trust” section</h2>
          <div className="grid gap-4">
            <div>
              <label className={label}>Heading</label>
              <input name="rqtHeading" defaultValue={s.rqtHeading} className={input} />
            </div>
            <div>
              <label className={label}>Body (separate paragraphs with a blank line)</label>
              <textarea name="rqtBody" defaultValue={s.rqtBody} rows={6} className={input} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Button — text</label>
                <input name="rqtButtonLabel" defaultValue={s.rqtButtonLabel} className={input} />
              </div>
              <div>
                <label className={label}>Button — link</label>
                <input name="rqtButtonLink" defaultValue={s.rqtButtonLink} className={input} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-xl border border-border p-4">
                  <label className={label}>Stat {n} — value</label>
                  <input
                    name={`rqtStat${n}Key`}
                    defaultValue={s[`rqtStat${n}Key` as keyof typeof s] as string}
                    className={input}
                  />
                  <label className={`${label} mt-3`}>Stat {n} — label</label>
                  <input
                    name={`rqtStat${n}Val`}
                    defaultValue={s[`rqtStat${n}Val` as keyof typeof s] as string}
                    className={input}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom CTA banner */}
        <div className={card}>
          <h2 className="mb-1 font-bold">Bottom call-to-action banner</h2>
          <p className="mb-4 text-xs text-muted-foreground">The green banner near the bottom of the homepage.</p>
          <div className="grid gap-4">
            <div>
              <label className={label}>Heading</label>
              <input name="ctaHeading" defaultValue={s.ctaHeading} className={input} />
            </div>
            <div>
              <label className={label}>Subheading</label>
              <input name="ctaSubheading" defaultValue={s.ctaSubheading} className={input} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Button — text</label>
                <input name="ctaButtonLabel" defaultValue={s.ctaButtonLabel} className={input} />
              </div>
              <div>
                <label className={label}>Button — link</label>
                <input name="ctaButtonLink" defaultValue={s.ctaButtonLink} className={input} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Leave the heading and button text empty to hide the banner entirely.</p>
          </div>
        </div>

        <Button type="submit" size="lg">Save front shop</Button>
      </form>
    </div>
  );
}
