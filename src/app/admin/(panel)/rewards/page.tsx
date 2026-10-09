import { Gift, Mail, Ticket, Users, Pencil, Plus } from "lucide-react";
import type { Reward } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import {
  REWARD_TYPES,
  REWARD_TYPE_LABELS,
  describeDiscount,
  describeRequirement,
  ensureDefaultRewards,
  rewardsEnabled,
  type RewardType,
} from "@/lib/rewards";
import { saveReward, deleteReward, setRewardsProgram } from "@/app/admin/rewards-actions";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rewards" };

const input =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1 block text-xs font-semibold text-muted-foreground";

export default async function AdminRewards() {
  await ensureDefaultRewards();

  const [enabled, rewards, claims, accounts, subscribers, claimCount] = await Promise.all([
    rewardsEnabled(),
    prisma.reward.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { claims: true } } },
    }),
    prisma.rewardClaim.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { reward: true, customer: true },
    }),
    prisma.customer.count({ where: { lastLoginAt: { not: null } } }),
    prisma.customer.findMany({
      where: { newsletter: true },
      select: { email: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.rewardClaim.count(),
  ]);

  const promos = await prisma.promotion.findMany({
    where: { code: { in: claims.map((c) => c.code) } },
  });
  const promoBy = new Map(promos.map((p) => [p.code, p]));
  const redeemed = await prisma.promotion.count({ where: { source: "reward", usageCount: { gt: 0 } } });
  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rewards programme</h1>
          <p className="text-sm text-muted-foreground">
            Customers earn these in their account and claim a single-use code locked to their email.
          </p>
        </div>
        <form action={setRewardsProgram} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5">
          <span className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-bold",
            enabled ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"
          )}>
            {enabled ? "Live" : "Paused"}
          </span>
          <input type="hidden" name="enabled" value={enabled ? "0" : "1"} />
          <Button type="submit" size="sm" variant={enabled ? "outline" : "primary"}>
            {enabled ? "Pause programme" : "Turn on programme"}
          </Button>
        </form>
      </div>

      {!enabled && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The programme is paused: the Rewards tab is hidden from customers and nothing new can be claimed.
          Codes already claimed still work at checkout.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Customer accounts" value={accounts} />
        <Stat icon={Gift} label="Rewards claimed" value={claimCount} />
        <Stat icon={Ticket} label="Reward codes redeemed" value={redeemed} />
        <Stat icon={Mail} label="Newsletter subscribers" value={subscribers.length} />
      </div>

      {/* Rewards list */}
      <section className="rounded-2xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-bold">Rewards</h2>
          <span className="text-xs text-muted-foreground">Lower “order” numbers show first</span>
        </div>
        <ul className="divide-y divide-border">
          {rewards.map((r) => (
            <li key={r.id} className="px-5 py-4">
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-bold",
                    r.active ? "bg-brand-100 text-brand-700" : "bg-gray-200 text-gray-600"
                  )}>
                    {r.active ? "Active" : "Off"}
                  </span>
                  <span className="font-semibold text-brand-800">{r.title}</span>
                  <span className="text-sm text-muted-foreground">{describeRequirement(r)}</span>
                  <span className="text-sm font-bold text-brand-700">→ {describeDiscount(r)}</span>
                  <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    {r._count.claims} claimed
                    <span className="inline-flex items-center gap-1 font-semibold text-brand-700 group-open:hidden">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </span>
                  </span>
                </summary>
                <div className="mt-4 rounded-xl bg-white/60 p-4">
                  <RewardForm reward={r} />
                  {r._count.claims === 0 ? (
                    <form action={deleteReward} className="mt-3 border-t border-border pt-3">
                      <input type="hidden" name="id" value={r.id} />
                      <ConfirmSubmit
                        message={`Delete "${r.title}"? This cannot be undone.`}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Delete this reward
                      </ConfirmSubmit>
                    </form>
                  ) : (
                    <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      Customers have claimed this reward, so it can&apos;t be deleted — untick
                      <strong> Active</strong> to retire it. Their codes stay valid and visible.
                    </p>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
        <div className="border-t border-border px-5 py-4">
          <details>
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-brand-700">
              <Plus className="h-4 w-4" /> Add a reward
            </summary>
            <div className="mt-4 rounded-xl bg-white/60 p-4">
              <RewardForm />
            </div>
          </details>
        </div>
      </section>

      {/* Claims */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <h2 className="border-b border-border px-5 py-4 font-bold">Recent claims</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left text-xs uppercase tracking-wide text-brand-800">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {claims.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No rewards claimed yet.</td></tr>
              )}
              {claims.map((c) => {
                const p = promoBy.get(c.code);
                const used = !!p && p.usageCount > 0;
                const expired = !used && !!p?.endsAt && p.endsAt < now;
                return (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {c.createdAt.toLocaleDateString("en-ZA", { dateStyle: "medium" })}
                    </td>
                    <td className="px-4 py-3">{c.customer.name ? `${c.customer.name} · ` : ""}{c.customer.email}</td>
                    <td className="px-4 py-3">
                      {c.reward.title}{" "}
                      <span className="text-muted-foreground">
                        ({p ? describeDiscount({ discountType: p.type, discountValue: p.value }) : describeDiscount(c.reward)})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-brand-700">{c.code}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold",
                        used ? "bg-brand-100 text-brand-700" : expired ? "bg-gray-200 text-gray-600" : "bg-amber-100 text-amber-700"
                      )}>
                        {used ? "Redeemed" : expired ? "Expired" : "Unused"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Newsletter */}
      <section className="rounded-2xl border border-border bg-surface px-5 py-4">
        <details>
          <summary className="cursor-pointer list-none font-bold">
            Newsletter subscribers ({subscribers.length}) <span className="text-sm font-normal text-brand-700">— show list</span>
          </summary>
          {subscribers.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No subscribers yet.</p>
          ) : (
            <textarea
              readOnly
              rows={Math.min(12, subscribers.length + 1)}
              className={cn(input, "mt-3 font-mono text-xs")}
              defaultValue={subscribers.map((s) => s.email).join("\n")}
            />
          )}
          <p className="mt-2 text-xs text-muted-foreground">Copy these into your email marketing tool.</p>
        </details>
      </section>
    </div>
  );
}

function RewardForm({ reward }: { reward?: Reward }) {
  const value =
    !reward ? "" : reward.discountType === "fixed" ? (reward.discountValue / 100).toFixed(2) : String(reward.discountValue);
  return (
    <form action={saveReward} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {reward && <input type="hidden" name="id" value={reward.id} />}
      <div className="sm:col-span-2">
        <label className={label}>Title</label>
        <input name="title" required defaultValue={reward?.title ?? ""} placeholder="e.g. 3rd order milestone" className={input} />
      </div>
      <div>
        <label className={label}>How it&apos;s earned</label>
        <select name="type" defaultValue={reward?.type ?? "milestone"} className={input}>
          {REWARD_TYPES.map((t) => (
            <option key={t} value={t}>{REWARD_TYPE_LABELS[t as RewardType]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={label}>Orders needed (milestones only)</label>
        <input name="threshold" type="number" min={1} defaultValue={reward?.threshold || 3} className={input} />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <label className={label}>Description shown to customers</label>
        <input name="description" defaultValue={reward?.description ?? ""} className={input} />
      </div>
      <div>
        <label className={label}>Reward type</label>
        <select name="discountType" defaultValue={reward?.discountType ?? "percent"} className={input}>
          <option value="percent">% off order</option>
          <option value="fixed">Rand amount off</option>
          <option value="freeship">Free shipping</option>
        </select>
      </div>
      <div>
        <label className={label}>Value (% or R — not used for free shipping)</label>
        <input name="discountValue" inputMode="decimal" defaultValue={value} placeholder="10" className={input} />
      </div>
      <div>
        <label className={label}>Minimum spend (R, 0 = none)</label>
        <input
          name="minSpend"
          inputMode="decimal"
          defaultValue={reward ? (reward.minSpend / 100).toFixed(2) : "0"}
          className={input}
        />
      </div>
      <div>
        <label className={label}>Code valid for (days, 0 = forever)</label>
        <input name="validDays" type="number" min={0} defaultValue={reward?.validDays ?? 90} className={input} />
      </div>
      <div>
        <label className={label}>Display order</label>
        <input name="sortOrder" type="number" min={0} defaultValue={reward?.sortOrder ?? 100} className={input} />
      </div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium">
        <input type="checkbox" name="active" defaultChecked={reward?.active ?? true} className="h-4 w-4 accent-brand-600" />
        Active
      </label>
      <div className="flex items-end sm:col-span-2 lg:col-span-2 lg:justify-end">
        <Button type="submit" size="sm">{reward ? "Save changes" : "Add reward"}</Button>
      </div>
    </form>
  );
}

function Stat({
  icon: Icon,
  label: text,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <Icon className="h-5 w-5 text-brand-600" />
      <div className="mt-2 text-2xl font-bold text-brand-800">{value}</div>
      <div className="text-xs text-muted-foreground">{text}</div>
    </div>
  );
}
