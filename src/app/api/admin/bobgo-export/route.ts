import { prisma } from "@/lib/prisma";
import { isAuthed } from "@/lib/auth";

export const runtime = "nodejs";

// Exact Bob Go bulk-import template column order.
const HEADERS = [
  "Order number (optional)",
  "First name",
  "Last name",
  "Email",
  "Contact number",
  "Street address",
  "Suburb",
  "City",
  "Province",
  "Postal code",
  "Payment status",
  "Collection address name (optional)",
  "Delivery instructions (optional)",
  "Buyer shipping charge (optional)",
  "Item name (optional)",
  "Item weight kg (optional)",
  "Item unit price (optional)",
  "Item qty (optional)",
  "Item length cm (optional)",
  "Item width cm (optional)",
  "Item height cm (optional)",
];

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  if (!(await isAuthed())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const orders = await prisma.order.findMany({
    where: id
      ? { id }
      : { paymentStatus: "paid", status: "unfulfilled" },
    include: { items: true, customer: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: string[] = [HEADERS.join(",")];

  for (const o of orders) {
    let addr: Record<string, string> = {};
    try {
      addr = JSON.parse(o.shippingAddress || "{}");
    } catch {
      addr = {};
    }
    const fullName =
      (o.customer?.name ?? "").trim() ||
      [addr.firstName, addr.lastName].filter(Boolean).join(" ").trim() ||
      (addr.name ?? "").trim();
    const [firstName, ...rest] = fullName.split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");
    const street = [addr.line1, addr.line2].filter(Boolean).join(", ") || addr.street || "";
    const suburb = addr.suburb?.trim() || addr.city || "";
    // Bob Go accepts: Unpaid, Paid, Partially paid, Refunded, Partially refunded,
    // Pending, Voided, Authorized — map our lower-case status to a valid value.
    const payStatus = o.paymentStatus === "paid" ? "Paid" : "Unpaid";

    const items = o.items.length
      ? o.items
      : [{ name: `Order ${o.orderNumber}`, price: o.total, quantity: 1 }];
    items.forEach((it, idx) => {
      const first = idx === 0; // shipping/notes only ONCE per order (avoid double-charge)
      rows.push(
        [
          cell(o.orderNumber),
          // Required customer/address/payment fields must be present on EVERY row
          cell(firstName || "-"),
          cell(lastName || "-"),
          cell(o.email),
          cell(o.phone ?? ""),
          cell(street),
          cell(suburb),
          cell(addr.city ?? ""),
          cell(addr.province ?? ""),
          cell(addr.postalCode ?? ""),
          cell(payStatus),
          cell(""), // collection address name
          cell(first ? o.notes ?? "" : ""),
          cell(first ? (o.shipping / 100).toFixed(2) : ""), // shipping charge once per order
          cell(it.name),
          cell(""), // weight
          cell((it.price / 100).toFixed(2)),
          cell(it.quantity),
          cell(""), // length
          cell(""), // width
          cell(""), // height
        ].join(",")
      );
    });
  }

  const csv = rows.join("\n");
  const date = new Date().toISOString().slice(0, 10);
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9-_]/g, "");
  const filename =
    id && orders[0]
      ? `bobgo-${safe(orders[0].orderNumber)}.csv`
      : `bobgo-orders-${date}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
