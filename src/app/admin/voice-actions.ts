"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const id = (f: FormData) => String(f.get("id") ?? "").slice(0, 40);

export async function setMessageHandled(formData: FormData) {
  await requireAdmin();
  await prisma.contactMessage.updateMany({ where: { id: id(formData) }, data: { handled: formData.get("handled") === "1" } });
  revalidatePath("/admin", "layout");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  await prisma.contactMessage.deleteMany({ where: { id: id(formData) } });
  revalidatePath("/admin", "layout");
}

export async function clearSearches() {
  await requireAdmin();
  await prisma.searchQuery.deleteMany({});
  revalidatePath("/admin/voice");
}
