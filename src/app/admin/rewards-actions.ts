"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { REWARD_TYPES } from "@/lib/rewards";

const DISCOUNT_TYPES = ["percent", "fixed", "freeship"] as const;

function done() {
  revalidatePath("/admin/rewards");
  revalidatePath("/account");
  redirect("/admin/rewards?saved=1");
}

export async function setRewardsProgram(formData: FormData) {
  await requireAdmin();
  const value = formData.get("enabled") === "1" ? "1" : "0";
  await prisma.setting.upsert({
    where: { key: "rewardsEnabled" },
    create: { key: "rewardsEnabled", value },
    update: { value },
  });
  done();
}

export async function saveReward(formData: FormData) {
  await requireAdmin();
  const g = (k: string) => String(formData.get(k) ?? "").trim();
  const int = (k: string, min = 0, max = 1_000_000) =>
    Math.min(max, Math.max(min, Math.round(parseFloat(g(k)) || 0)));
  const rands = (k: string) => Math.max(0, Math.round((parseFloat(g(k)) || 0) * 100));

  const type = (REWARD_TYPES as readonly string[]).includes(g("type")) ? g("type") : "milestone";
  const discountType = (DISCOUNT_TYPES as readonly string[]).includes(g("discountType"))
    ? g("discountType")
    : "percent";

  const data = {
    title: g("title").slice(0, 80) || "Reward",
    description: g("description").slice(0, 300) || null,
    type,
    threshold: type === "milestone" ? int("threshold", 1, 1000) : 0,
    discountType,
    discountValue:
      discountType === "fixed" ? rands("discountValue") : discountType === "percent" ? int("discountValue", 1, 100) : 0,
    minSpend: rands("minSpend"),
    validDays: int("validDays", 0, 3650),
    sortOrder: int("sortOrder", 0, 10_000),
    active: formData.get("active") === "on",
  };

  const id = g("id");
  if (id) {
    await prisma.reward.update({ where: { id }, data });
  } else {
    await prisma.reward.create({ data });
  }
  done();
}

/**
 * Delete a never-claimed reward. Once claimed, a reward can only be switched
 * off: deleting it would drop the claim history customers' codes are shown from.
 */
export async function deleteReward(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id && (await prisma.rewardClaim.count({ where: { rewardId: id } })) === 0) {
    await prisma.reward.delete({ where: { id } }).catch(() => {});
  }
  done();
}
