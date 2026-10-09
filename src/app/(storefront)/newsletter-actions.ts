"use server";

import { redirect } from "next/navigation";
import { isValidEmail, normalizeEmail } from "@/lib/customer-auth";
import { subscribe, unsubscribe, verifyUnsubscribe } from "@/lib/newsletter";

export type SubscribeState = { status: "idle" | "done" | "already" | "error"; message?: string };

export async function subscribeAction(_prev: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!isValidEmail(email)) return { status: "error", message: "Please enter a valid email address." };
  try {
    const added = await subscribe(email);
    return { status: added ? "done" : "already" };
  } catch {
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}

export async function confirmUnsubscribe(formData: FormData) {
  const email = String(formData.get("e") ?? "");
  const token = String(formData.get("t") ?? "");
  if (!verifyUnsubscribe(email, token)) redirect("/newsletter/unsubscribe?invalid=1");
  await unsubscribe(email);
  redirect("/newsletter/unsubscribe?done=1");
}
