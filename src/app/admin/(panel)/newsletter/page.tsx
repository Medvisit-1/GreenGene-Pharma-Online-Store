import { Mail, Send, UserPlus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import { NewsletterComposer } from "@/components/admin/newsletter-composer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Newsletter" };

function daysAgo(days: number) {
  return new Date(Date.now() - days * 86400_000);
}

export default async function AdminNewsletter() {
  const monthAgo = daysAgo(30);
  const [subscribers, newThisMonth, campaigns, settings] = await Promise.all([
    prisma.customer.findMany({
      where: { newsletter: true },
      select: { email: true, name: true, newsletterAt: true },
      orderBy: { newsletterAt: "desc" },
    }),
    prisma.customer.count({ where: { newsletter: true, newsletterAt: { gt: monthAgo } } }),
    prisma.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
    getSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Newsletter</h1>
        <p className="text-sm text-muted-foreground">
          People join from the shop footer, at checkout, or in their account. Each gets a welcome email, and
          every email you send includes their personal unsubscribe link.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Mail} label="Subscribers" value={subscribers.length} />
        <Stat icon={UserPlus} label="Joined in the last 30 days" value={newThisMonth} />
        <Stat icon={Send} label="Emails sent" value={campaigns.length} />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="mb-4 font-bold">Write a newsletter</h2>
        <NewsletterComposer subscribers={subscribers.length} defaultTestEmail={settings.contactEmail} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <h2 className="border-b border-border px-5 py-4 font-bold">Sent newsletters</h2>
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Delivered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {campaigns.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">Nothing sent yet.</td></tr>
            )}
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {c.createdAt.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" })}
                </td>
                <td className="px-4 py-3 font-medium">{c.subject}</td>
                <td className="px-4 py-3">
                  {c.sentCount}
                  {c.failedCount > 0 && <span className="ml-2 text-xs text-red-600">({c.failedCount} failed)</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-2xl border border-border bg-surface px-5 py-4">
        <details>
          <summary className="cursor-pointer list-none font-bold">
            Subscriber list ({subscribers.length}) <span className="text-sm font-normal text-brand-700">— show</span>
          </summary>
          {subscribers.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No subscribers yet.</p>
          ) : (
            <ul className="mt-3 max-h-96 divide-y divide-border overflow-y-auto rounded-xl border border-border bg-white text-sm">
              {subscribers.map((s) => (
                <li key={s.email} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                  <span>{s.name ? `${s.name} · ` : ""}{s.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.newsletterAt ? `joined ${s.newsletterAt.toLocaleDateString("en-ZA", { dateStyle: "medium" })}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </details>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface p-5")}>
      <Icon className="h-5 w-5 text-brand-600" />
      <div className="mt-2 text-2xl font-bold text-brand-800">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
