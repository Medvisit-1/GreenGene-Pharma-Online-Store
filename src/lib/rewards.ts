import "server-only";
import crypto from "node:crypto";
import type { Customer, Reward } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export const REWARD_TYPES = ["milestone", "review", "referral", "birthday", "newsletter"] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  milestone: "Order milestone",
  review: "Product review",
  referral: "Refer a friend",
  birthday: "Birthday month",
  newsletter: "Newsletter sign-up",
};

type RewardSeed = Omit<Reward, "id" | "createdAt" | "updatedAt">;

const REFERRAL_DEFAULT: RewardSeed = {
  title: "Refer a friend",
  description: "Share your personal link. When a friend places their first order through it, you get R50 off.",
  type: "referral", threshold: 0, discountType: "fixed", discountValue: 5000,
  minSpend: 0, validDays: 90, active: true, sortOrder: 45,
};
const OLD_REVIEW_DESCRIPTION =
  "Share an honest review of a product you've bought. Earn a reward for every product you review once it's published.";

/** The starter programme, created the first time rewards are used. Fully editable in admin. */
const DEFAULT_REWARDS: RewardSeed[] = [
  {
    title: "3rd order milestone",
    description: "Thank you for coming back — enjoy 10% off your next order.",
    type: "milestone", threshold: 3, discountType: "percent", discountValue: 10,
    minSpend: 0, validDays: 90, active: true, sortOrder: 10,
  },
  {
    title: "6th order milestone",
    description: "Six orders in — your next delivery is on us.",
    type: "milestone", threshold: 6, discountType: "freeship", discountValue: 0,
    minSpend: 0, validDays: 90, active: true, sortOrder: 20,
  },
  {
    title: "10th order milestone",
    description: "A true GreenGene regular — 15% off your next order.",
    type: "milestone", threshold: 10, discountType: "percent", discountValue: 15,
    minSpend: 0, validDays: 90, active: true, sortOrder: 30,
  },
  {
    title: "Review a product",
    description: "Share an honest review of a product you've bought. Earn a reward for every product you review.",
    type: "review", threshold: 0, discountType: "percent", discountValue: 5,
    minSpend: 0, validDays: 90, active: true, sortOrder: 40,
  },
  REFERRAL_DEFAULT,
  {
    title: "Birthday treat",
    description: "Happy birthday! Add your birthday to your details and claim this during your birthday month.",
    type: "birthday", threshold: 0, discountType: "percent", discountValue: 10,
    minSpend: 0, validDays: 30, active: true, sortOrder: 50,
  },
  {
    title: "Join our newsletter",
    description: "Subscribe to news & offers in your details for a welcome reward.",
    type: "newsletter", threshold: 0, discountType: "fixed", discountValue: 3000,
    minSpend: 20000, validDays: 90, active: true, sortOrder: 60,
  },
];

/** Seed the starter rewards exactly once (atomic flag in the Setting table). */
export async function ensureDefaultRewards(): Promise<void> {
  await runOnce("rewardsSeeded", async () => {
    if ((await prisma.reward.count()) === 0) {
      await prisma.reward.createMany({ data: DEFAULT_REWARDS });
    }
  });
  // v2: stores seeded before refer-a-friend existed get it too, and the review
  // description loses "once it's published" (only if the admin hasn't edited it).
  await runOnce("rewardsSeededV2", async () => {
    if ((await prisma.reward.count({ where: { type: "referral" } })) === 0) {
      await prisma.reward.create({ data: REFERRAL_DEFAULT });
    }
    await prisma.reward.updateMany({
      where: { type: "review", description: OLD_REVIEW_DESCRIPTION },
      data: { description: DEFAULT_REWARDS.find((r) => r.type === "review")!.description },
    });
  });
}

/** Run a one-time setup step, guarded by an atomic flag in the Setting table. */
async function runOnce(flag: string, fn: () => Promise<void>): Promise<void> {
  try {
    // Cheap check first so normal page views never hit (and log) a unique-constraint error.
    if (await prisma.setting.findUnique({ where: { key: flag } })) return;
    // The create is the atomic guard if two requests race on the very first visit.
    await prisma.setting.create({ data: { key: flag, value: "1" } });
  } catch {
    return; // done by a concurrent request (or DB unavailable)
  }
  await fn();
}

export async function rewardsEnabled(): Promise<boolean> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "rewardsEnabled" } });
    return row?.value !== "0";
  } catch {
    return false;
  }
}

export function describeDiscount(r: Pick<Reward, "discountType" | "discountValue">): string {
  if (r.discountType === "freeship") return "Free shipping";
  if (r.discountType === "fixed") return `${formatPrice(r.discountValue)} off`;
  return `${r.discountValue}% off`;
}

export function describeRequirement(r: Pick<Reward, "type" | "threshold">): string {
  switch (r.type) {
    case "milestone":
      return `Place ${r.threshold} paid order${r.threshold === 1 ? "" : "s"}`;
    case "review":
      return "Review a product you've bought";
    case "referral":
      return "A friend places their first order through your link";
    case "birthday":
      return "Claim during your birthday month";
    case "newsletter":
      return "Subscribe to our newsletter";
    default:
      return "";
  }
}

/** Year + month (1-12) in South Africa, regardless of server timezone. */
function saNow(): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "numeric",
  }).formatToParts(new Date());
  return {
    year: Number(parts.find((p) => p.type === "year")?.value),
    month: Number(parts.find((p) => p.type === "month")?.value),
  };
}

export type RewardCode = {
  code: string;
  rewardTitle: string;
  discount: string;
  minSpend: number;
  claimedAt: Date;
  expiresAt: Date | null;
  used: boolean;
  expired: boolean;
};

export type CustomerReward = {
  reward: Reward;
  discount: string;
  requirement: string;
  /** locked = not earned yet; available = can claim now; claimed = all earned claims used up */
  status: "locked" | "available" | "claimed";
  progress?: { current: number; target: number };
  /** Short helper line under locked rewards */
  hint?: string;
  /** Unclaimed earned periods (e.g. several reviewed products) */
  availableCount: number;
};

type Context = {
  paidCount: number;
  purchased: Set<string>;
  reviewedProducts: string[];
  /** One entry per friend whose paid first order came through this customer's link */
  referredFriends: string[];
  claimsByReward: Map<string, Set<string>>;
};

async function loadContext(customer: Customer): Promise<Context> {
  const [orders, reviews, claims, referred] = await Promise.all([
    prisma.order.findMany({
      where: {
        paymentStatus: "paid",
        OR: [{ customerId: customer.id }, { email: customer.email }],
      },
      select: { id: true, items: { select: { productId: true } } },
    }),
    prisma.review.findMany({
      where: { status: "approved", email: { equals: customer.email, mode: "insensitive" } },
      select: { productId: true },
    }),
    prisma.rewardClaim.findMany({
      where: { customerId: customer.id },
      select: { rewardId: true, period: true },
    }),
    prisma.order.findMany({
      where: { referrerId: customer.id, paymentStatus: "paid" },
      select: { customerId: true, email: true },
    }),
  ]);

  const purchased = new Set<string>();
  for (const o of orders) for (const it of o.items) if (it.productId) purchased.add(it.productId);

  const claimsByReward = new Map<string, Set<string>>();
  for (const c of claims) {
    if (!claimsByReward.has(c.rewardId)) claimsByReward.set(c.rewardId, new Set());
    claimsByReward.get(c.rewardId)!.add(c.period);
  }

  return {
    paidCount: orders.length,
    purchased,
    reviewedProducts: [...new Set(reviews.map((r) => r.productId))],
    referredFriends: [...new Set(referred.map((o) => `ref:${o.customerId ?? o.email}`))],
    claimsByReward,
  };
}

/** Periods this customer has earned (claimed or not) for a reward. */
function earnedPeriods(reward: Reward, customer: Customer, ctx: Context): string[] {
  switch (reward.type) {
    case "milestone":
      return ctx.paidCount >= reward.threshold ? [""] : [];
    case "review":
      // Only verified buyers: the reviewed product must be in one of their paid orders.
      return ctx.reviewedProducts.filter((pid) => ctx.purchased.has(pid));
    case "referral":
      return ctx.referredFriends;
    case "birthday": {
      if (!customer.birthday) return [];
      const { year, month } = saNow();
      return customer.birthday.getUTCMonth() + 1 === month ? [String(year)] : [];
    }
    case "newsletter":
      return customer.newsletter ? [""] : [];
    default:
      return [];
  }
}

function evaluate(reward: Reward, customer: Customer, ctx: Context): CustomerReward {
  const claimed = ctx.claimsByReward.get(reward.id) ?? new Set<string>();
  const earned = earnedPeriods(reward, customer, ctx);
  const open = earned.filter((p) => !claimed.has(p));

  const base = {
    reward,
    discount: describeDiscount(reward),
    requirement: describeRequirement(reward),
    availableCount: open.length,
  };

  if (open.length > 0) return { ...base, status: "available" };

  // Repeatable rewards (review, birthday) go back to "locked" with a helpful hint.
  if (reward.type === "review") {
    return {
      ...base,
      status: "locked",
      hint: claimed.size > 0
        ? "Review another product you've bought to earn this again."
        : ctx.purchased.size === 0
          ? "Place an order, then review what you bought."
          : "Leave a review on a product page while signed in.",
    };
  }
  if (reward.type === "referral") {
    return {
      ...base,
      status: "locked",
      hint: claimed.size > 0
        ? "Refer another friend to earn this again."
        : "Share your link below — you earn this when a friend's first order is paid.",
    };
  }
  if (reward.type === "birthday") {
    return {
      ...base,
      status: claimed.size > 0 && earned.length > 0 ? "claimed" : "locked",
      hint: customer.birthday
        ? claimed.size > 0 && earned.length > 0
          ? "Claimed for this year — see you next birthday!"
          : `Available in ${customer.birthday.toLocaleDateString("en-ZA", { month: "long", timeZone: "UTC" })}.`
        : "Add your birthday under My details.",
    };
  }
  if (claimed.has("")) return { ...base, status: "claimed" };

  if (reward.type === "milestone") {
    return {
      ...base,
      status: "locked",
      progress: { current: ctx.paidCount, target: reward.threshold },
      hint: `${Math.max(0, reward.threshold - ctx.paidCount)} more order${reward.threshold - ctx.paidCount === 1 ? "" : "s"} to go.`,
    };
  }
  if (reward.type === "newsletter") {
    return { ...base, status: "locked", hint: "Tick “Newsletter” under My details." };
  }
  return { ...base, status: "locked" };
}

/** Every active reward with this customer's status, plus their reward codes. */
export async function getCustomerRewards(customer: Customer) {
  await ensureDefaultRewards();
  const [rewards, ctx, claims] = await Promise.all([
    prisma.reward.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    loadContext(customer),
    prisma.rewardClaim.findMany({
      where: { customerId: customer.id },
      include: { reward: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const promos = await prisma.promotion.findMany({
    where: { code: { in: claims.map((c) => c.code) } },
  });
  const promoBy = new Map(promos.map((p) => [p.code, p]));
  const now = new Date();

  const codes: RewardCode[] = claims.map((c) => {
    const p = promoBy.get(c.code);
    const used = !!p && p.usageLimit != null && p.usageCount >= p.usageLimit;
    return {
      code: c.code,
      rewardTitle: c.reward.title,
      // Describe the code as issued — the reward may have been edited since.
      discount: p ? describeDiscount({ discountType: p.type, discountValue: p.value }) : describeDiscount(c.reward),
      minSpend: p?.minSpend ?? 0,
      claimedAt: c.createdAt,
      expiresAt: p?.endsAt ?? null,
      used,
      expired: !used && !!p?.endsAt && p.endsAt < now,
    };
  });

  return {
    rewards: rewards.map((r) => evaluate(r, customer, ctx)),
    codes,
    paidOrders: ctx.paidCount,
  };
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `RWD-${s}`;
}

export type ClaimResult =
  | { ok: true; code: string; reward: Reward }
  | { ok: false; error: string };

/**
 * Claim a reward: re-checks eligibility server-side, then creates a single-use
 * promo code locked to the customer's email. Safe against double-clicks via
 * the (reward, customer, period) unique constraint.
 */
export async function claimReward(customerId: string, rewardId: string): Promise<ClaimResult> {
  if (!(await rewardsEnabled())) return { ok: false, error: "The rewards programme is paused." };

  const [customer, reward] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),
    prisma.reward.findUnique({ where: { id: rewardId } }),
  ]);
  if (!customer || !reward || !reward.active) return { ok: false, error: "This reward isn't available." };

  const ctx = await loadContext(customer);
  const claimed = ctx.claimsByReward.get(reward.id) ?? new Set<string>();
  const earned = earnedPeriods(reward, customer, ctx);
  const period = earned.find((p) => !claimed.has(p));
  if (period === undefined) {
    return {
      ok: false,
      error: earned.length > 0 ? "You've already claimed this reward." : "You haven't unlocked this reward yet.",
    };
  }

  const endsAt = reward.validDays > 0 ? new Date(Date.now() + reward.validDays * 86400_000) : null;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    try {
      await prisma.$transaction([
        prisma.rewardClaim.create({
          data: { rewardId: reward.id, customerId: customer.id, period, code },
        }),
        prisma.promotion.create({
          data: {
            code,
            type: reward.discountType,
            value: reward.discountValue,
            minSpend: reward.minSpend,
            usageLimit: 1,
            endsAt,
            active: true,
            source: "reward",
            customerEmail: customer.email,
          },
        }),
      ]);
      return { ok: true, code, reward };
    } catch (e) {
      const target = String((e as { meta?: { target?: unknown } }).meta?.target ?? "");
      // A duplicate (reward, customer, period) means it was already claimed (double click).
      if (target.includes("period") || target.includes("rewardId")) {
        return { ok: false, error: "You've already claimed this reward." };
      }
      // Otherwise assume a code collision and retry with a new code.
    }
  }
  return { ok: false, error: "Could not create your code. Please try again." };
}

/* ---------------- Refer a friend ---------------- */

/** Cookie set by a /r/<code> referral link (30 days). */
export const REF_COOKIE = "gg_ref";

const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** The customer's personal referral code, created on first use (e.g. CLAIR7K3P). */
export async function ensureReferralCode(customer: Customer): Promise<string> {
  if (customer.referralCode) return customer.referralCode;
  const prefix = (customer.name ?? "").split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "GG";
  for (let attempt = 0; attempt < 6; attempt++) {
    let suffix = "";
    for (const b of crypto.randomBytes(4)) suffix += REF_ALPHABET[b % REF_ALPHABET.length];
    const code = `${prefix}${suffix}`;
    try {
      const updated = await prisma.customer.updateMany({
        where: { id: customer.id, referralCode: null },
        data: { referralCode: code },
      });
      if (updated.count === 1) return code;
      // Set concurrently by another request — use that one.
      const fresh = await prisma.customer.findUnique({ where: { id: customer.id } });
      if (fresh?.referralCode) return fresh.referralCode;
    } catch {
      // code collision with another customer — retry with a new suffix
    }
  }
  throw new Error("Could not create a referral code");
}

const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const phoneKey = (s: unknown) => String(s ?? "").replace(/\D/g, "").slice(-9);

/**
 * Who referred this new order, if the referral counts. A referral only counts
 * for a genuinely new customer: a different email from the referrer, no earlier
 * paid order, and not the referrer's own phone number or delivery address.
 */
export async function resolveReferrer(
  referralCode: string | undefined | null,
  order: { email: string; phone?: string | null; address: { line1?: string; postalCode?: string } }
): Promise<string | null> {
  if (!referralCode) return null;
  try {
    const referrer = await prisma.customer.findUnique({
      where: { referralCode: referralCode.trim().toUpperCase() },
    });
    if (!referrer) return null;
    const email = order.email.trim().toLowerCase();
    if (email === referrer.email.toLowerCase()) return null;

    const priorPaid = await prisma.order.count({ where: { email, paymentStatus: "paid" } });
    if (priorPaid > 0) return null;

    const theirOrders = await prisma.order.findMany({
      where: { OR: [{ customerId: referrer.id }, { email: referrer.email }] },
      select: { phone: true, shippingAddress: true },
    });
    let saved: Record<string, string> = {};
    try {
      saved = JSON.parse(referrer.shippingDetails || "{}");
    } catch {
      saved = {};
    }
    const addrKey = norm(order.address.line1) + norm(order.address.postalCode);
    const phone = phoneKey(order.phone);
    const referrerAddrs = new Set<string>([norm(saved.line1) + norm(saved.postalCode)]);
    const referrerPhones = new Set<string>([phoneKey(referrer.phone)]);
    for (const o of theirOrders) {
      referrerPhones.add(phoneKey(o.phone));
      try {
        const a = JSON.parse(o.shippingAddress || "{}");
        referrerAddrs.add(norm(a.line1) + norm(a.postalCode));
      } catch {
        /* ignore */
      }
    }
    if (addrKey && referrerAddrs.has(addrKey)) return null;
    if (phone.length >= 9 && referrerPhones.has(phone)) return null;
    return referrer.id;
  } catch {
    return null;
  }
}

/** Referral link stats for the account page. */
export async function referralStats(customerId: string) {
  const orders = await prisma.order.findMany({
    where: { referrerId: customerId, paymentStatus: "paid" },
    select: { customerId: true, email: true },
  });
  return { friendsOrdered: new Set(orders.map((o) => o.customerId ?? o.email)).size };
}

/* ---------------- After an order is paid ---------------- */

/**
 * Runs once per order when it first becomes paid (from finalizePaidOrder):
 * emails the customer if this order unlocked a milestone, and the referrer if
 * this was a referred friend's first paid order. Never throws.
 */
export async function afterOrderPaid(orderId: string): Promise<void> {
  try {
    if (!(await rewardsEnabled())) return;
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;
    const { sendRewardUnlocked } = await import("@/lib/email");

    const customer = order.customerId
      ? await prisma.customer.findUnique({ where: { id: order.customerId } })
      : await prisma.customer.findUnique({ where: { email: order.email } });
    if (customer) {
      const { rewards, paidOrders } = await getCustomerRewards(customer);
      const unlocked = rewards.filter(
        (r) => r.reward.type === "milestone" && r.reward.threshold === paidOrders && r.status === "available"
      );
      for (const r of unlocked) {
        await sendRewardUnlocked({
          to: customer.email,
          title: r.reward.title,
          discount: r.discount,
          reason: `You've placed ${paidOrders} orders with us — thank you!`,
        });
      }
    }

    const friendPaidOrders = order.referrerId
      ? await prisma.order.count({
          where: { referrerId: order.referrerId, email: order.email, paymentStatus: "paid" },
        })
      : 0;
    if (order.referrerId && friendPaidOrders === 1) {
      const referrer = await prisma.customer.findUnique({ where: { id: order.referrerId } });
      const reward = await prisma.reward.findFirst({ where: { type: "referral", active: true } });
      if (referrer && reward) {
        await sendRewardUnlocked({
          to: referrer.email,
          title: reward.title,
          discount: describeDiscount(reward),
          reason: "A friend you referred just placed their first order.",
        });
      }
    }
  } catch (e) {
    console.error("[rewards] afterOrderPaid failed:", (e as Error).message);
  }
}

export function cleanReferralCode(raw: string | undefined | null): string {
  return String(raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 20);
}

/**
 * Who a referral code belongs to — first name only, for the welcome banner
 * and checkout confirmation. Null if the code doesn't exist or the referral
 * reward is switched off.
 */
export async function lookupReferral(raw: string | undefined | null): Promise<{ code: string; name: string } | null> {
  const code = cleanReferralCode(raw);
  if (!code) return null;
  try {
    if (!(await rewardsEnabled())) return null;
    if (!(await prisma.reward.count({ where: { type: "referral", active: true } }))) return null;
    const c = await prisma.customer.findUnique({ where: { referralCode: code }, select: { name: true } });
    if (!c) return null;
    return { code, name: (c.name ?? "").trim().split(/\s+/)[0] || "a friend" };
  } catch {
    return null;
  }
}
