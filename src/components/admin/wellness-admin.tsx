import Link from "next/link";
import { CalendarClock, ExternalLink, Bell, RotateCcw, ShoppingCart } from "lucide-react";
import type { NewsletterArticle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SiteSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { sastNow, upcomingSlots } from "@/lib/scheduler";
import { keywordsOf, productsForArticle, upcomingArticles } from "@/lib/wellness";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import {
  deleteArticle,
  saveArticle,
  saveProgramme,
  saveReminderSettings,
  sendArticleNow,
  testArticle,
} from "@/app/admin/wellness-actions";

function daysAgo(days: number) {
  return new Date(Date.now() - days * 864e5);
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const input = "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-400";
const label = "mb-1 block text-xs font-semibold text-muted-foreground";

export async function WellnessAdmin({ settings, subscribers }: { settings: SiteSettings; subscribers: number }) {
  const on = settings.newsletterAutoEnabled === "1";
  const days = settings.newsletterDays.split(",").map((d) => parseInt(d, 10));
  const sentToday = !!(await prisma.newsletterCampaign.findUnique({ where: { slot: sastNow().date } }));
  const queue = await upcomingArticles(4);
  const slots = upcomingSlots(settings, queue.length, sentToday);
  const articles = await prisma.newsletterArticle.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const matches = new Map(
    await Promise.all(articles.map(async (a) => [a.id, (await productsForArticle(a)).map((p) => p.name.split(/ [-—–(]/)[0])] as const))
  );
  const [alertsWaiting, cartsReminded, savedCarts] = await Promise.all([
    prisma.stockAlert.count({ where: { notifiedAt: null } }),
    prisma.savedCart.count({ where: { reminderSentAt: { gt: daysAgo(30) } } }),
    prisma.savedCart.count(),
  ]);

  return (
    <>
      {/* ---- Automated programme ---- */}
      <section id="programme" className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-bold">
              <CalendarClock className="h-5 w-5 text-brand-600" /> Automated Wellness Notes
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Sends one wellness article to all {subscribers} subscriber{subscribers === 1 ? "" : "s"} on the days
              you choose, rotating through the published articles below. Each email features matching products, the
              health disclaimer and an unsubscribe link. Articles are also published at{" "}
              <Link href="/wellness" target="_blank" className="font-semibold text-brand-700 underline">/wellness</Link>.
            </p>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", on ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700")}>
            {on ? "On" : "Off"}
          </span>
        </div>

        <form action={saveProgramme} className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="enabled" defaultChecked={on} className="h-4 w-4 accent-brand-600" /> Send automatically
          </label>
          <fieldset>
            <legend className={label}>Sending days</legend>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((d, i) => (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="days" value={i} defaultChecked={days.includes(i)} className="peer sr-only" />
                  <span className="inline-block rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold peer-checked:border-brand-600 peer-checked:bg-brand-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300">
                    {d}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className={label} htmlFor="nl-hour">Time (SA time)</label>
            <select id="nl-hour" name="hour" defaultValue={settings.newsletterHour} className={cn(input, "w-28")}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm">Save schedule</Button>
        </form>

        <div className="mt-5">
          <h3 className="text-sm font-bold">{on ? "Coming up" : "Next in the rotation (when switched on)"}</h3>
          {queue.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No published articles — add or publish one below.</p>
          ) : (
            <ol className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white text-sm">
              {queue.map((a, i) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span className="font-medium">{a.title}</span>
                  <span className="text-xs text-muted-foreground">{on && slots[i] ? slots[i].label : `#${i + 1}`}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* ---- Reminders & alerts ---- */}
      <section id="reminders" className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-bold">Customer reminders &amp; alerts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sent automatically, once each. Customers can switch reminders off from any reminder email or in their account.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniStat icon={Bell} label="Back-in-stock requests waiting" value={alertsWaiting} />
          <MiniStat icon={ShoppingCart} label="Saved carts (signed-in customers)" value={savedCarts} />
          <MiniStat icon={RotateCcw} label="Cart reminders sent (30 days)" value={cartsReminded} />
        </div>
        <form action={saveReminderSettings} className="mt-4 space-y-3 text-sm">
          <label className="flex items-start gap-2">
            <input type="checkbox" name="refillRemindersEnabled" defaultChecked={settings.refillRemindersEnabled === "1"} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>
              <strong>Refill reminders</strong> — email customers 5 days before their supply runs out, with a one-click re-order link.
              One unit lasts{" "}
              <input name="refillDefaultDays" type="number" min={7} max={365} defaultValue={settings.refillDefaultDays} className="mx-1 inline-block w-16 rounded-lg border border-border bg-white px-2 py-0.5" />{" "}
              days unless the product says otherwise (Products → Days one unit lasts).
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="cartRemindersEnabled" defaultChecked={settings.cartRemindersEnabled === "1"} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>
              <strong>Saved-cart reminders</strong> — one email if a signed-in customer leaves items in their cart for 2+ hours
              (only to newsletter subscribers or past customers, as POPIA allows).
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input type="checkbox" name="paymentRemindersEnabled" defaultChecked={settings.paymentRemindersEnabled === "1"} className="mt-0.5 h-4 w-4 accent-brand-600" />
            <span>
              <strong>Complete-your-payment reminders</strong> — one email if someone starts an order but the payment
              isn&apos;t completed within an hour, with a link to pay for that same order (discounts kept).
            </span>
          </label>
          <p className="text-xs text-muted-foreground">
            Back-in-stock alerts are always on: shoppers ask for them on sold-out products and get one email when stock is added.
          </p>
          <Button type="submit" size="sm" variant="secondary">Save reminder settings</Button>
        </form>
      </section>

      {/* ---- Articles ---- */}
      <section id="articles" className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-bold">Wellness articles ({articles.length})</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the wording any time. Keep claims cautious (&ldquo;research suggests&rdquo;, &ldquo;may support&rdquo;) — never
          promise to treat, cure or prevent a condition. Formatting: blank line = new paragraph, <code>## </code> = sub-heading,{" "}
          <code>- </code> = bullet point.
        </p>
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-white">
          {articles.map((a) => (
            <li key={a.id} className="px-4 py-3">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold">{a.title}</span>
                  {!a.published && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700">Draft</span>}
                  <span className="text-xs text-muted-foreground">
                    Sent {a.timesSent}×{a.lastSentAt ? ` · last ${a.lastSentAt.toLocaleDateString("en-ZA", { dateStyle: "medium", timeZone: "Africa/Johannesburg" })}` : ""}
                    {" · "}Products: {matches.get(a.id)?.join(", ") || "none matched"}
                  </span>
                  <span className="ml-auto text-xs font-semibold text-brand-700">Edit ▾</span>
                </summary>
                <ArticleForm article={a} />
                <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-border pt-3">
                  <Link href={`/wellness/${a.slug}`} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> View on site
                  </Link>
                  <form action={testArticle} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={a.id} />
                    <input name="testEmail" type="email" defaultValue={""} placeholder="test@email.com" aria-label="Test email address" className={cn(input, "w-48")} />
                    <Button type="submit" size="sm" variant="outline">Send test</Button>
                  </form>
                  <form action={sendArticleNow}>
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmSubmit
                      message={`Send "${a.title}" to all ${subscribers} subscribers now?`}
                      className="h-9 rounded-full bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Send to all now
                    </ConfirmSubmit>
                  </form>
                  <form action={deleteArticle} className="ml-auto">
                    <input type="hidden" name="id" value={a.id} />
                    <ConfirmSubmit message={`Delete "${a.title}"?`} className="text-sm font-semibold text-red-600 hover:underline">
                      Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
        <details className="mt-4 rounded-xl border border-dashed border-brand-300 bg-white px-4 py-3">
          <summary className="cursor-pointer list-none font-semibold text-brand-700">+ Add an article</summary>
          <ArticleForm />
        </details>
      </section>
    </>
  );
}

function ArticleForm({ article }: { article?: NewsletterArticle }) {
  return (
    <form action={saveArticle} className="mt-3 grid gap-3 sm:grid-cols-2">
      {article && <input type="hidden" name="id" value={article.id} />}
      <div className="sm:col-span-2">
        <label className={label}>Title</label>
        <input name="title" required defaultValue={article?.title} className={input} />
      </div>
      <div>
        <label className={label}>Email subject line</label>
        <input name="subject" defaultValue={article?.subject} className={input} />
      </div>
      <div>
        <label className={label}>Web address (/wellness/…)</label>
        <input name="slug" defaultValue={article?.slug} placeholder="made from the title" className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Short intro</label>
        <textarea name="excerpt" required rows={2} defaultValue={article?.excerpt} className={input} />
      </div>
      <div className="sm:col-span-2">
        <label className={label}>Article</label>
        <textarea name="body" required rows={14} defaultValue={article?.body} className={cn(input, "font-mono text-xs leading-relaxed")} />
      </div>
      <div>
        <label className={label}>Product keywords (comma-separated)</label>
        <input name="productKeywords" defaultValue={article ? keywordsOf(article).join(", ") : ""} placeholder="e.g. green tea, garcinia" className={input} />
      </div>
      <div className="flex items-end gap-4">
        <div>
          <label className={label}>Order</label>
          <input name="sortOrder" type="number" defaultValue={article?.sortOrder ?? 99} className={cn(input, "w-20")} />
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="published" defaultChecked={article?.published ?? true} className="h-4 w-4 accent-brand-600" /> Published
        </label>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm">{article ? "Save article" : "Add article"}</Button>
      </div>
    </form>
  );
}

function MiniStat({ icon: Icon, label: text, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-brand-600" />
      <div>
        <div className="text-lg font-bold leading-none text-brand-800">{value}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
