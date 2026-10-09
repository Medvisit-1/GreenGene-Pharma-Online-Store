import Link from "next/link";
import {
  CheckCircle2,
  Gift,
  Lock,
  LogOut,
  Package,
  PartyPopper,
  Sparkles,
  Star,
  Truck,
  UserCircle2,
  AlertTriangle,
  Users,
} from "lucide-react";
import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cn, formatPrice } from "@/lib/utils";
import { SA_PROVINCES } from "@/lib/constants";
import { getCurrentCustomer } from "@/lib/customer-auth";
import {
  ensureReferralCode,
  getCustomerRewards,
  referralStats,
  rewardsEnabled,
  type CustomerReward,
} from "@/lib/rewards";
import { appUrl } from "@/lib/email";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/account/login-form";
import { CopyCode } from "@/components/account/copy-code";
import { claim, saveDetails, signOut } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Account" };

type Search = Promise<{
  tab?: string;
  link?: string;
  saved?: string;
  claimed?: string;
  error?: string;
}>;

const input =
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100";
const label = "mb-1.5 block text-sm font-medium";

export default async function AccountPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
                <UserCircle2 className="h-8 w-8 text-brand-600" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight text-brand-800">Sign in to your account</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Track your orders and unlock rewards.
              </p>
            </div>
            {sp.link === "expired" && (
              <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                That sign-in link has expired or was already used. Request a new one below.
              </p>
            )}
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
          <RewardsTeaser />
        </div>
      </div>
    );
  }

  const programOn = await rewardsEnabled();
  const [orders, rewardsData] = await Promise.all([
    prisma.order.findMany({
      where: { OR: [{ customerId: customer.id }, { email: customer.email }] },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    programOn ? getCustomerRewards(customer) : Promise.resolve(null),
  ]);

  // Refer-a-friend link (only while the referral reward is switched on)
  const referralOn = !!rewardsData?.rewards.some((r) => r.reward.type === "referral");
  const referral = referralOn
    ? {
        link: `${appUrl()}/r/${await ensureReferralCode(customer)}`,
        ...(await referralStats(customer.id)),
        reward: rewardsData!.rewards.find((r) => r.reward.type === "referral")!.discount,
      }
    : null;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "My orders" },
    ...(programOn ? [{ id: "rewards", label: "Rewards" }] : []),
    { id: "details", label: "My details" },
  ];
  const tab = tabs.some((t) => t.id === sp.tab) ? sp.tab! : "overview";
  const readyCount = rewardsData?.rewards.reduce((n, r) => n + r.availableCount, 0) ?? 0;
  const firstName = (customer.name ?? "").split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Hi{firstName ? ` ${firstName}` : ""} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{customer.email}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline" size="sm">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </form>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/account?tab=${t.id}`}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.id ? "bg-brand-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t.label}
            {t.id === "rewards" && readyCount > 0 && (
              <span className={cn(
                "rounded-full px-1.5 text-[11px] font-bold",
                tab === t.id ? "bg-white text-brand-700" : "bg-accent text-brand-900"
              )}>
                {readyCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="mt-6">
        {tab === "overview" && (
          <Overview orders={orders} rewardsData={rewardsData} readyCount={readyCount} />
        )}
        {tab === "orders" && <Orders orders={orders} />}
        {tab === "rewards" && rewardsData && (
          <Rewards data={rewardsData} claimed={sp.claimed} error={sp.error} referral={referral} />
        )}
        {tab === "details" && <Details customer={customer} saved={!!sp.saved} programOn={programOn} />}
      </div>
    </div>
  );
}

/* ---------------- Sections ---------------- */

type OrderWithItems = Awaited<ReturnType<typeof prisma.order.findMany<{ include: { items: true } }>>>[number];
type RewardsData = Awaited<ReturnType<typeof getCustomerRewards>>;

function Overview({
  orders,
  rewardsData,
  readyCount,
}: {
  orders: OrderWithItems[];
  rewardsData: RewardsData | null;
  readyCount: number;
}) {
  const paid = orders.filter((o) => o.paymentStatus === "paid").length;
  const activeCodes = rewardsData?.codes.filter((c) => !c.used && !c.expired).length ?? 0;
  const nextMilestone = rewardsData?.rewards
    .filter((r) => r.reward.type === "milestone" && r.status === "locked" && r.progress)
    .sort((a, b) => a.reward.threshold - b.reward.threshold)[0];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Package} label="Orders placed" value={String(paid)} />
        {rewardsData && <Stat icon={Gift} label="Rewards ready" value={String(readyCount)} highlight={readyCount > 0} />}
        {rewardsData && <Stat icon={Sparkles} label="Active reward codes" value={String(activeCodes)} />}
      </div>

      {readyCount > 0 && (
        <Link
          href="/account?tab=rewards"
          className="flex items-center gap-3 rounded-2xl bg-brand-600 p-5 text-white shadow-sm transition hover:bg-brand-700"
        >
          <PartyPopper className="h-6 w-6 shrink-0" />
          <span className="flex-1 font-semibold">
            You have {readyCount} reward{readyCount === 1 ? "" : "s"} ready to claim!
          </span>
          <span className="text-sm font-semibold underline">Claim now →</span>
        </Link>
      )}

      {nextMilestone?.progress && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-brand-800">Next milestone: {nextMilestone.reward.title}</span>
            <span className="font-bold text-brand-700">{nextMilestone.discount}</span>
          </div>
          <ProgressBar current={nextMilestone.progress.current} target={nextMilestone.progress.target} />
          <p className="mt-2 text-xs text-muted-foreground">{nextMilestone.hint}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent orders</h2>
          {orders.length > 0 && (
            <Link href="/account?tab=orders" className="text-sm font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          )}
        </div>
        {orders.length === 0 ? <NoOrders /> : <OrderList orders={orders.slice(0, 3)} />}
      </div>
    </div>
  );
}

function Orders({ orders }: { orders: OrderWithItems[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 font-bold">Order history</h2>
      {orders.length === 0 ? <NoOrders /> : <OrderList orders={orders} />}
    </div>
  );
}

function OrderList({ orders }: { orders: OrderWithItems[] }) {
  return (
    <ul className="divide-y divide-border">
      {orders.map((o) => {
        const count = o.items.reduce((n, i) => n + i.quantity, 0);
        const paid = o.paymentStatus === "paid";
        return (
          <li key={o.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
            <div className="min-w-0 flex-1">
              <Link href={`/orders/${o.orderNumber}`} className="font-semibold text-brand-700 hover:underline">
                {o.orderNumber}
              </Link>
              <div className="text-xs text-muted-foreground">
                {o.createdAt.toLocaleDateString("en-ZA", { dateStyle: "medium" })} · {count} item{count === 1 ? "" : "s"}
              </div>
            </div>
            <span className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              paid ? "bg-brand-100 text-brand-700" : "bg-amber-100 text-amber-700"
            )}>
              {paid ? (o.status === "fulfilled" ? "Shipped" : "Paid · preparing") : o.paymentStatus === "refunded" ? "Refunded" : "Awaiting payment"}
            </span>
            {o.trackingUrl && (
              <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                <Truck className="h-3.5 w-3.5" /> Track
              </a>
            )}
            <span className="w-24 text-right text-sm font-semibold">{formatPrice(o.total)}</span>
          </li>
        );
      })}
    </ul>
  );
}

type Referral = { link: string; friendsOrdered: number; reward: string } | null;

function Rewards({
  data,
  claimed,
  error,
  referral,
}: {
  data: RewardsData;
  claimed?: string;
  error?: string;
  referral: Referral;
}) {
  const active = data.codes.filter((c) => !c.used && !c.expired);
  const past = data.codes.filter((c) => c.used || c.expired);

  return (
    <div className="space-y-6">
      {claimed && (
        <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm">
          <PartyPopper className="h-5 w-5 shrink-0 text-brand-600" />
          <div>
            <div className="font-semibold text-brand-800">Reward claimed! Your code is <span className="tracking-wider">{claimed}</span></div>
            <div className="text-brand-700">We&apos;ve emailed it to you too. It&apos;s applied automatically at checkout when you&apos;re signed in.</div>
          </div>
        </div>
      )}
      {error && (
        <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}

      {active.length > 0 && (
        <section>
          <h2 className="mb-3 font-bold">Your reward codes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((c) => (
              <div key={c.code} className="rounded-2xl border-2 border-dashed border-brand-300 bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold tracking-wider text-brand-800">{c.code}</span>
                  <CopyCode code={c.code} />
                </div>
                <div className="mt-1 text-sm font-semibold text-brand-700">{c.discount} · {c.rewardTitle}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {c.minSpend > 0 && <>Min. spend {formatPrice(c.minSpend)} · </>}
                  {c.expiresAt ? <>Valid until {c.expiresAt.toLocaleDateString("en-ZA", { dateStyle: "medium" })}</> : "No expiry"}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {referral && (
        <section className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-brand-800">
                <Users className="h-5 w-5 text-brand-600" /> Refer a friend, get {referral.reward}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Share your personal link. When a friend places their <strong>first order</strong> through
                it, you get {referral.reward} — for every friend.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700">
              {referral.friendsOrdered} friend{referral.friendsOrdered === 1 ? "" : "s"} ordered
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-white p-2 pl-3">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-brand-800">{referral.link}</span>
            <CopyCode code={referral.link} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your friend must use the link before buying, with their own email and delivery address.
          </p>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-bold">Ways to earn</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.rewards.map((r) => <RewardCard key={r.reward.id} r={r} />)}
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-muted-foreground">Past codes</h2>
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card text-sm">
            {past.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <span><span className="font-semibold">{c.code}</span> · {c.discount}</span>
                <span className="text-xs text-muted-foreground">{c.used ? "Used" : "Expired"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const TYPE_ICON = { milestone: Package, review: Star, referral: Users, birthday: PartyPopper, newsletter: Sparkles } as const;

function RewardCard({ r }: { r: CustomerReward }) {
  const Icon = TYPE_ICON[r.reward.type as keyof typeof TYPE_ICON] ?? Gift;
  const available = r.status === "available";
  const claimedState = r.status === "claimed";

  return (
    <div className={cn(
      "flex flex-col rounded-2xl border bg-card p-5 transition",
      available ? "border-brand-400 shadow-md shadow-brand-600/10 ring-2 ring-brand-100" : "border-border"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          available ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-600"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-bold",
          available ? "bg-accent text-brand-900" : claimedState ? "bg-brand-100 text-brand-700" : "bg-muted text-muted-foreground"
        )}>
          {r.discount}
        </span>
      </div>
      <h3 className="mt-3 font-bold text-brand-800">{r.reward.title}</h3>
      {r.reward.description && <p className="mt-1 text-sm text-muted-foreground">{r.reward.description}</p>}
      <p className="mt-2 text-xs font-medium text-brand-700">{r.requirement}</p>
      {r.reward.minSpend > 0 && (
        <p className="text-xs text-muted-foreground">Min. spend {formatPrice(r.reward.minSpend)}</p>
      )}

      <div className="mt-auto pt-4">
        {r.progress && !available && !claimedState && (
          <>
            <ProgressBar current={r.progress.current} target={r.progress.target} />
          </>
        )}
        {available ? (
          <form action={claim}>
            <input type="hidden" name="rewardId" value={r.reward.id} />
            <Button type="submit" className="w-full">
              <Gift className="h-4 w-4" /> Claim{r.availableCount > 1 ? ` (${r.availableCount} ready)` : ""}
            </Button>
          </form>
        ) : claimedState ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-700">
            <CheckCircle2 className="h-4 w-4" /> {r.hint ?? "Claimed"}
          </p>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" /> {r.hint ?? "Not unlocked yet"}
          </p>
        )}
      </div>
    </div>
  );
}

function Details({ customer, saved, programOn }: { customer: Customer; saved: boolean; programOn: boolean }) {
  let addr: Record<string, string> = {};
  try {
    addr = JSON.parse(customer.shippingDetails || "{}");
  } catch {
    addr = {};
  }
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 1)).toLocaleDateString("en-ZA", { month: "long", timeZone: "UTC" })
  );

  return (
    <form action={saveDetails} className="space-y-6">
      {saved && (
        <p className="flex items-center gap-2 rounded-2xl bg-brand-50 p-4 text-sm font-medium text-brand-700">
          <CheckCircle2 className="h-4 w-4" /> Your details have been saved.
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 font-bold">Personal details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Full name</label>
            <input name="name" defaultValue={customer.name ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Phone</label>
            <input name="phone" type="tel" defaultValue={customer.phone ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Email</label>
            <input value={customer.email} disabled className={cn(input, "bg-muted text-muted-foreground")} />
          </div>
          <div>
            <label className={label}>Birthday</label>
            {customer.birthday ? (
              <input
                value={customer.birthday.toLocaleDateString("en-ZA", { day: "numeric", month: "long", timeZone: "UTC" })}
                disabled
                className={cn(input, "bg-muted text-muted-foreground")}
              />
            ) : (
              <div className="flex gap-2">
                <select name="birthDay" defaultValue="" className={input}>
                  <option value="">Day</option>
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <select name="birthMonth" defaultValue="" className={input}>
                  <option value="">Month</option>
                  {months.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {customer.birthday ? "To change your birthday, please contact us." : "Can only be set once."}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-1 font-bold">Delivery address</h2>
        <p className="mb-4 text-xs text-muted-foreground">Saved here, it&apos;s filled in for you at checkout.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Street address</label>
            <input name="line1" defaultValue={addr.line1 ?? ""} className={input} />
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Apartment, suite, etc. (optional)</label>
            <input name="line2" defaultValue={addr.line2 ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Suburb</label>
            <input name="suburb" defaultValue={addr.suburb ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>City / Town</label>
            <input name="city" defaultValue={addr.city ?? ""} className={input} />
          </div>
          <div>
            <label className={label}>Province</label>
            <select name="province" defaultValue={addr.province ?? ""} className={input}>
              <option value="">Select province</option>
              {SA_PROVINCES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Postal code</label>
            <input name="postalCode" defaultValue={addr.postalCode ?? ""} className={input} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="newsletter"
            defaultChecked={customer.newsletter}
            className="mt-0.5 h-4 w-4 accent-brand-600"
          />
          <span>
            <span className="font-semibold">Newsletter</span> — send me news, launches and offers by email.
            {programOn && !customer.newsletter && (
              <span className="block text-xs text-brand-700">Subscribing unlocks a welcome reward.</span>
            )}
          </span>
        </label>
      </section>

      <Button type="submit" size="lg">Save details</Button>
    </form>
  );
}

/* ---------------- Small pieces ---------------- */

function Stat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border bg-card p-5", highlight ? "border-brand-400" : "border-border")}>
      <Icon className="h-5 w-5 text-brand-600" />
      <div className="mt-3 text-2xl font-bold text-brand-800">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-right text-[11px] font-semibold text-muted-foreground">
        {Math.min(current, target)} / {target} orders
      </div>
    </div>
  );
}

function NoOrders() {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground">
      No orders yet.{" "}
      <Link href="/products" className="font-semibold text-brand-700 hover:underline">Start shopping</Link>
    </div>
  );
}

async function RewardsTeaser() {
  if (!(await rewardsEnabled())) return null;
  return (
    <div className="mt-5 rounded-3xl border border-brand-200 bg-brand-50/70 p-6">
      <div className="flex items-center gap-2 font-bold text-brand-800">
        <Gift className="h-5 w-5 text-brand-600" /> GreenGene Rewards
      </div>
      <ul className="mt-3 space-y-1.5 text-sm text-brand-800">
        <li>✓ Discounts at order milestones</li>
        <li>✓ A reward for every product review</li>
        <li>✓ A birthday treat & welcome gift</li>
      </ul>
    </div>
  );
}
