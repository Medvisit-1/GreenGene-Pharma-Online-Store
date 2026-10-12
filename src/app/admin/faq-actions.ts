"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const g = (f: FormData, k: string, max = 300) => String(f.get(k) ?? "").trim().slice(0, max);

function done(msg: string, anchor = ""): never {
  revalidatePath("/admin/faqs");
  revalidatePath("/faqs");
  redirect(`/admin/faqs?msg=${encodeURIComponent(msg)}${anchor}`);
}

export async function saveFaq(formData: FormData) {
  await requireAdmin();
  const id = g(formData, "id", 40);
  const data = {
    section: g(formData, "section", 80),
    question: g(formData, "question", 300),
    answer: String(formData.get("answer") ?? "").trim().slice(0, 5000),
    sortOrder: parseInt(g(formData, "sortOrder"), 10) || 0,
    published: formData.get("published") === "on",
  };
  if (!data.section || !data.question || !data.answer) done("Each FAQ needs a section, a question and an answer.");
  if (id) await prisma.faq.update({ where: { id }, data });
  else await prisma.faq.create({ data });
  done(id ? "FAQ saved." : "FAQ added.", `#faq-${id || "new"}`);
}

export async function deleteFaq(formData: FormData) {
  await requireAdmin();
  await prisma.faq.deleteMany({ where: { id: g(formData, "id", 40) } });
  done("FAQ deleted.");
}

/** Move a question up or down within the list. */
export async function moveFaq(formData: FormData) {
  await requireAdmin();
  const id = g(formData, "id", 40);
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const all = await prisma.faq.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const i = all.findIndex((f) => f.id === id);
  const j = i + dir;
  if (i >= 0 && j >= 0 && j < all.length && all[j].section === all[i].section) {
    [all[i], all[j]] = [all[j], all[i]];
    // Rewrite the order so it's always clean (0, 10, 20, …)
    await prisma.$transaction(all.map((f, k) => prisma.faq.update({ where: { id: f.id }, data: { sortOrder: k * 10 } })));
  }
  revalidatePath("/admin/faqs");
  revalidatePath("/faqs");
  redirect(`/admin/faqs#faq-${id}`);
}
