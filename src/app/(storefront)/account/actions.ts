"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  clearCustomerSession,
  consumeLoginToken,
  createLoginToken,
  getCurrentCustomer,
  isValidEmail,
  normalizeEmail,
  setCustomerSession,
} from "@/lib/customer-auth";
import { claimReward, describeDiscount } from "@/lib/rewards";
import { sendLoginLink, sendRewardCode } from "@/lib/email";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }
  try {
    const token = await createLoginToken(email);
    if (!token) {
      return {
        status: "error",
        message: "We've just sent you a few links — please check your inbox (and spam), or try again in 15 minutes.",
      };
    }
    const sent = await sendLoginLink(email, token);
    if (!sent) {
      return { status: "error", message: "We couldn't send the email right now. Please try again shortly." };
    }
  } catch {
    return { status: "error", message: "Something went wrong. Please try again." };
  }
  return { status: "sent", email };
}

export async function confirmLogin(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const customerId = await consumeLoginToken(token);
  if (!customerId) redirect("/account?link=expired");
  await setCustomerSession(customerId);
  redirect("/account");
}

export async function signOut() {
  await clearCustomerSession();
  redirect("/account");
}

const s = (fd: FormData, k: string, max = 120) => String(fd.get(k) ?? "").trim().slice(0, max);

export async function saveDetails(formData: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account");

  const data: Parameters<typeof prisma.customer.update>[0]["data"] = {
    name: s(formData, "name") || null,
    phone: s(formData, "phone", 30) || null,
    newsletter: formData.get("newsletter") === "on",
    shippingDetails: JSON.stringify({
      line1: s(formData, "line1"),
      line2: s(formData, "line2"),
      suburb: s(formData, "suburb"),
      city: s(formData, "city"),
      province: s(formData, "province", 40),
      postalCode: s(formData, "postalCode", 10),
    }),
  };

  // Birthday can only be set once (prevents moving it to claim the birthday reward again).
  if (!customer.birthday) {
    const month = parseInt(String(formData.get("birthMonth") ?? ""), 10);
    const day = parseInt(String(formData.get("birthDay") ?? ""), 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(2000, month - 1, day, 12));
      if (d.getUTCMonth() === month - 1) data.birthday = d; // rejects e.g. 31 February
    }
  }

  await prisma.customer.update({ where: { id: customer.id }, data });
  revalidatePath("/account");
  redirect("/account?tab=details&saved=1");
}

export async function claim(formData: FormData) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account");

  const result = await claimReward(customer.id, String(formData.get("rewardId") ?? ""));
  if (!result.ok) {
    redirect(`/account?tab=rewards&error=${encodeURIComponent(result.error)}`);
  }

  const promo = await prisma.promotion.findUnique({ where: { code: result.code } });
  await sendRewardCode({
    to: customer.email,
    rewardTitle: result.reward.title,
    discount: promo
      ? describeDiscount({ discountType: promo.type, discountValue: promo.value })
      : describeDiscount(result.reward),
    code: result.code,
    minSpend: promo?.minSpend ?? 0,
    expiresAt: promo?.endsAt ?? null,
  }).catch(() => false);

  revalidatePath("/account");
  redirect(`/account?tab=rewards&claimed=${encodeURIComponent(result.code)}`);
}
