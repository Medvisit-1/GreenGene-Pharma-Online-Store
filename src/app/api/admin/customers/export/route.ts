import { isAuthed } from "@/lib/auth";
import { customerRows, parseAddress, type CustomerFilter, type CustomerSort } from "@/lib/customers";

export const dynamic = "force-dynamic";

/** CSV cell: quoted, and never starting with = + - @ (stops spreadsheet formula injection). */
function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export async function GET(req: Request) {
  if (!(await isAuthed())) return new Response("Unauthorized", { status: 401 });
  const sp = new URL(req.url).searchParams;
  const rows = await customerRows({
    q: sp.get("q") ?? undefined,
    filter: (sp.get("filter") as CustomerFilter) ?? "all",
    sort: (sp.get("sort") as CustomerSort) ?? "newest",
  });
  const header = ["Name", "Email", "Phone", "Joined", "Paid orders", "Total spent (R)", "Last order", "Newsletter", "Subscribed on", "City", "Province", "Reminders off", "Deletion requested"];
  const lines = [header.map(cell).join(",")];
  for (const r of rows) {
    const a = parseAddress(r.shippingDetails);
    lines.push(
      [
        r.name, r.email, r.phone, day(r.createdAt), r.paidOrders, (r.spent / 100).toFixed(2), day(r.lastOrderAt),
        r.newsletter ? "Yes" : "No", day(r.newsletterAt), a.city, a.province,
        r.remindersOptOut ? "Yes" : "No", day(r.deletionRequestedAt),
      ].map(cell).join(",")
    );
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="greengene-customers-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
