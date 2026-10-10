"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  clearCustomerSession,
  createLoginCode,
  getCurrentCustomer,
  isValidEmail,
  normalizeEmail,
  setCustomerSession,
  verifyLoginCode,
} from "@/lib/customer-auth";
import { claimReward, describeDiscount } from "@/lib/rewards";
import { sendLoginCode, sendRewardCode } from "@/lib/email";
import { subscribe, unsubscribe } from "@/lib/newsletter";

export type LoginState = {
  step: "email" | "code";
  email?: string;
  message?: string;
  error?: string;
};

async function sendCode(email: string): Promise<LoginState> {
  try {
    const code = await createLoginCode(email);
    if (!code) {
      return {
        step: "code",
        email,
        error: "We've sent you a few codes already — use the latest one from your inbox (check spam), or try again in 15 minutes.",
      };
    }
    if (!(await sendLoginCode(email, code))) {
      return { step: "email", email, error: "We couldn't send the email right now. Please try again shortly." };
    }
  } catch {
    return { step: "email", email, error: "Something went wrong. Please try again." };
  }
  return { step: "code", email, message: `We sent a 6-digit code to ${email}.` };
}

/** One form, two steps: email → code. `intent` picks the action. */
export async function loginAction(prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = String(formData.get("intent") ?? "send");

  if (intent === "change") return { step: "email", email: prev.email };

  if (intent === "send" || intent === "resend") {
    const email = normalizeEmail(String(formData.get("email") ?? prev.email ?? ""));
    if (!isValidEmail(email)) return { step: "email", email, error: "Please enter a valid email address." };
    const res = await sendCode(email);
    if (intent === "resend" && res.step === "code" && !res.error) res.message = `New code sent to ${email}.`;
    return res;
  }

  // intent === "verify"
  const email = normalizeEmail(prev.email ?? String(formData.get("email") ?? ""));
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { step: "code", email, error: "Enter the 6-digit code from the email." };

  const result = await verifyLoginCode(email, code);
  if (!result.ok) {
    const error =
      result.reason === "invalid"
        ? "That code isn't right. Check the latest email and try again."
        : result.reason === "locked"
          ? "Too many wrong attempts. Tap “Send a new code” to get a fresh one."
          : "That code has expired. Tap “Send a new code” to get a fresh one.";
    return { step: "code", email, error };
  }
  await setCustomerSession(result.customerId);
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

  // Newsletter opt-in/out goes through the newsletter service (consent date + welcome email).
  const wantsNews = formData.get("newsletter") === "on";
  if (wantsNews && !customer.newsletter) await subscribe(customer.email, customer.name);
  if (!wantsNews && customer.newsletter) await unsubscribe(customer.email);

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
