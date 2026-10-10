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
  Ticket,
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
import { headers } from "next/headers";
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
  "w-full rounded-xl border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-plum-400 focus:ring-2 focus:ring-plum-100";
const label = "mb-1.5 block text-sm font-medium";

/** The domain the customer is actually browsing (falls back to APP_URL). */
async function siteOrigin() {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  const proto = (h.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
  return host && !host.startsWith("localhost") && !/^\d+\.\d+\.\d+\.\d+/.test(host) ? `${proto}://${host}` : appUrl();
}

export default async function AccountPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const customer = await getCurrentCustomer();

  if (!customer) {
    return (
      <div className="mx-auto flex max-w-7xl justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-md">
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-plum-700 via-plum-500 to-grape" />
            <div className="p-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-plum-600 to-grape text-white shadow-md shadow-plum-700/25">
                <UserCircle2 className="h-8 w-8" />
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
        link: `${await siteOrigin()}/r/${await ensureReferralCode(customer)}`,
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
  const paidOrders = orders.filter((o) => o.paymentStatus === "paid").length;
  const activeCodes = rewardsData?.codes.filter((c) => !c.used && !c.expired).length ?? 0;
  const firstName = (customer.name ?? "").split(" ")[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-plum-800 via-plum-700 to-grape p-6 text-white shadow-lg shadow-plum-900/20 sm:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-plum-50 ring-1 ring-white/20">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              {programOn ? "GreenGene Rewards member" : "My account"}
            </span>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Hi{firstName ? ` ${firstName}` : ""} 👋
            </h1>
            <p className="mt-1 truncate text-sm text-plum-100">{customer.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/25 transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
        <div className={cn("relative mt-6 grid gap-3", rewardsData ? "grid-cols-3" : "grid-cols-1 sm:max-w-xs")}>
          <HeroStat icon={Package} label="Orders placed" value={paidOrders} />
          {rewardsData && <HeroStat icon={Gift} label="Rewards ready" value={readyCount} highlight={readyCount > 0} />}
          {rewardsData && <HeroStat icon={Ticket} label="Active codes" value={activeCodes} />}
        </div>
      </section>

      <nav className="mt-5 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 shadow-sm">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/account?tab=${t.id}`}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              tab === t.id
                ? "bg-plum-700 text-white shadow-sm shadow-plum-700/25"
                : "text-muted-foreground hover:bg-plum-50 hover:text-plum-800"
            )}
          >
            {t.label}
            {t.id === "rewards" && readyCount > 0 && (
              <span className={cn(
                "rounded-full px-1.5 text-[11px] font-bold",
                tab === t.id ? "bg-accent text-plum-900" : "bg-plum-600 text-white"
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
  const nextMilestone = rewardsData?.rewards
    .filter((r) => r.reward.type === "milestone" && r.status === "locked" && r.progress)
    .sort((a, b) => a.reward.threshold - b.reward.threshold)[0];

  return (
    <div className="space-y-6">
      {readyCount > 0 && (
        <Link
          href="/account?tab=rewards"
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-plum-700 to-plum-600 p-5 text-white shadow-md shadow-plum-700/20 transition hover:from-plum-800 hover:to-plum-700"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <PartyPopper className="h-5 w-5 text-accent" />
          </span>
          <span className="flex-1 font-semibold">
            You have {readyCount} reward{readyCount === 1 ? "" : "s"} ready to claim!
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-plum-700">Claim now →</span>
        </Link>
      )}

      {nextMilestone?.progress && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-plum-600">Next milestone</div>
          <div className="mt-1 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-brand-800">{nextMilestone.reward.title}</span>
            <span className="rounded-full bg-plum-100 px-2.5 py-0.5 text-xs font-bold text-plum-700">{nextMilestone.discount}</span>
          </div>
          <ProgressBar current={nextMilestone.progress.current} target={nextMilestone.progress.target} />
          <p className="mt-2 text-xs text-muted-foreground">{nextMilestone.hint}</p>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle>Recent orders</SectionTitle>
          {orders.length > 0 && (
            <Link href="/account?tab=orders" className="text-sm font-semibold text-plum-700 hover:underline">
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
      <SectionTitle className="mb-3">Order history</SectionTitle>
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
            <div className="min-w-0 basis-full sm:flex-1 sm:basis-0">
              <Link href={`/orders/${o.orderNumber}`} className="whitespace-nowrap font-semibold text-plum-700 hover:underline">
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
              <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-plum-700 hover:underline">
                <Truck className="h-3.5 w-3.5" /> Track
              </a>
            )}
            <span className="ml-auto w-24 text-right text-sm font-semibold">{formatPrice(o.total)}</span>
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
        <div className="flex items-start gap-3 rounded-2xl border border-plum-200 bg-plum-50 p-4 text-sm">
          <PartyPopper className="h-5 w-5 shrink-0 text-plum-600" />
          <div>
            <div className="font-semibold text-plum-800">Reward claimed! Your code is <span className="tracking-wider">{claimed}</span></div>
            <div className="text-plum-700">We&apos;ve emailed it to you too. It&apos;s applied automatically at checkout when you&apos;re signed in.</div>
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
          <SectionTitle className="mb-3">Your reward codes</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((c) => (
              <div
                key={c.code}
                className="relative overflow-hidden rounded-2xl border-2 border-dashed border-plum-300 bg-gradient-to-br from-plum-50 to-card px-5 py-4"
              >
                <span aria-hidden className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
                <span aria-hidden className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-extrabold tracking-wider text-plum-800">{c.code}</span>
                  <CopyCode code={c.code} />
                </div>
                <div className="mt-1 text-sm font-semibold text-plum-700">{c.discount} · {c.rewardTitle}</div>
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
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-plum-700 to-grape p-5 text-white shadow-md shadow-plum-900/20 sm:p-6">
          <div aria-hidden className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                <Users className="h-5 w-5 text-accent" /> Refer a friend, get {referral.reward}
              </h2>
              <p className="mt-1 text-sm text-plum-100">
                Share your personal link. When a friend places their <strong>first order</strong> through
                it, you get {referral.reward} — for every friend.
              </p>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
              {referral.friendsOrdered} friend{referral.friendsOrdered === 1 ? "" : "s"} ordered
            </span>
          </div>
          <div className="relative mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-white p-2 pl-3 shadow-sm">
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-plum-800">{referral.link}</span>
            <CopyCode code={referral.link} />
          </div>
          <p className="relative mt-2 text-xs text-plum-100">
            Your friend must use the link before buying, with their own email and delivery address.
          </p>
        </section>
      )}

      <section>
        <SectionTitle className="mb-3">Ways to earn</SectionTitle>
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
      available ? "border-plum-400 shadow-md shadow-plum-700/15 ring-2 ring-plum-100" : "border-border"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
          available ? "bg-gradient-to-br from-plum-600 to-grape text-white" : "bg-plum-50 text-plum-600"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={cn(
          "rounded-full px-2.5 py-0.5 text-xs font-bold",
          available ? "bg-accent text-plum-900" : claimedState ? "bg-plum-100 text-plum-700" : "bg-muted text-muted-foreground"
        )}>
          {r.discount}
        </span>
      </div>
      <h3 className="mt-3 font-bold text-brand-800">{r.reward.title}</h3>
      {r.reward.description && <p className="mt-1 text-sm text-muted-foreground">{r.reward.description}</p>}
      <p className="mt-2 text-xs font-medium text-plum-700">{r.requirement}</p>
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
            <Button type="submit" variant="plum" className="w-full">
              <Gift className="h-4 w-4" /> Claim{r.availableCount > 1 ? ` (${r.availableCount} ready)` : ""}
            </Button>
          </form>
        ) : claimedState ? (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-plum-700">
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
        <p className="flex items-center gap-2 rounded-2xl border border-plum-200 bg-plum-50 p-4 text-sm font-medium text-plum-700">
          <CheckCircle2 className="h-4 w-4" /> Your details have been saved.
        </p>
      )}

      <section className="rounded-2xl border border-border bg-card p-6">
        <SectionTitle className="mb-4">Personal details</SectionTitle>
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
        <SectionTitle className="mb-1">Delivery address</SectionTitle>
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
            className="mt-0.5 h-4 w-4 accent-plum-600"
          />
          <span>
            <span className="font-semibold">Newsletter</span> — send me news, launches and offers by email.
            {programOn && !customer.newsletter && (
              <span className="block text-xs font-medium text-plum-700">Subscribing unlocks a welcome reward.</span>
            )}
          </span>
        </label>
      </section>

      <Button type="submit" size="lg" variant="plum">Save details</Button>
    </form>
  );
}

/* ---------------- Small pieces ---------------- */

function HeroStat({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl p-3 ring-1 backdrop-blur-sm sm:p-4",
      highlight ? "bg-white text-plum-800 ring-white" : "bg-white/10 text-white ring-white/15"
    )}>
      <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", highlight ? "text-plum-600" : "text-accent")} />
      <div className="mt-2 text-2xl font-bold sm:text-3xl">{value}</div>
      <div className={cn("text-[11px] font-medium sm:text-xs", highlight ? "text-plum-600" : "text-plum-100")}>{label}</div>
    </div>
  );
}

function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("flex items-center gap-2 font-bold", className)}>
      <span aria-hidden className="h-4 w-1 rounded-full bg-gradient-to-b from-plum-500 to-plum-700" />
      {children}
    </h2>
  );
}

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="mt-2">
      <div className="h-2.5 overflow-hidden rounded-full bg-plum-100">
        <div className="h-full rounded-full bg-gradient-to-r from-plum-500 to-plum-700 transition-all" style={{ width: `${pct}%` }} />
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
      <Link href="/products" className="font-semibold text-plum-700 hover:underline">Start shopping</Link>
    </div>
  );
}

async function RewardsTeaser() {
  if (!(await rewardsEnabled())) return null;
  return (
    <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-plum-700 to-grape p-6 text-white shadow-md shadow-plum-900/20">
      <div aria-hidden className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-center gap-2 font-bold">
        <Gift className="h-5 w-5 text-accent" /> GreenGene Rewards
      </div>
      <ul className="relative mt-3 space-y-2 text-sm text-plum-50">
        {["Discounts at order milestones", "A reward for every product review", "R50 off for every friend you refer", "A birthday treat & welcome gift"].map((t) => (
          <li key={t} className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" /> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
