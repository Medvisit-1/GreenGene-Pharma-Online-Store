import "server-only";
import type { Order } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Bob Go (smart shipping) integration.
 *
 * Sends a paid order to Bob Go so it can be fulfilled (label/courier) from the
 * Bob Go portal. Our order number is passed as the reference so the two are linked.
 *
 * NOTE: the exact endpoint/field names below are based on Bob Go's general API
 * shape and MUST be confirmed against the account's API docs/Postman. Until
 * BOBGO_API_KEY is set, this returns a friendly "not connected" result.
 */
export type ShipResult = { ok: boolean; message: string };

function host() {
  return process.env.BOBGO_API_HOST || "https://api.bobgo.co.za";
}

export async function sendToBobGo(order: Order): Promise<ShipResult> {
  const key = process.env.BOBGO_API_KEY;
  if (!key) {
    return { ok: false, message: "Bob Go is not connected yet (add BOBGO_API_KEY)." };
  }

  type Address = {
    line1?: string;
    line2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
  };
  let addr: Address = {};
  try {
    addr = JSON.parse(order.shippingAddress || "{}");
  } catch {
    addr = {};
  }

  const [items, customer] = await Promise.all([
    prisma.orderItem.findMany({ where: { orderId: order.id } }),
    order.customerId
      ? prisma.customer.findUnique({ where: { id: order.customerId } })
      : Promise.resolve(null),
  ]);

  // Request body — field names to be confirmed against Bob Go API docs.
  const body = {
    channel_order_number: order.orderNumber,
    order_number: order.orderNumber,
    customer: {
      name: customer?.name ?? "",
      email: order.email,
      phone: order.phone ?? "",
    },
    delivery_address: {
      street_address: [addr.line1, addr.line2].filter(Boolean).join(", "),
      local_area: addr.line2 || addr.city || "",
      city: addr.city || "",
      zone: addr.province || "",
      code: addr.postalCode || "",
      country: addr.country || "South Africa",
    },
    items: items.map((i) => ({
      description: i.name,
      sku: i.productId ?? "",
      quantity: i.quantity,
      unit_price: i.price / 100, // rands
    })),
    total: order.total / 100,
  };

  try {
    const res = await fetch(`${host()}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, message: data?.message ?? `Bob Go error (${res.status}).` };
    }

    const bobgoOrderId = String(data.id ?? data.order_id ?? data.order?.id ?? "");
    const trackingNumber = String(
      data.tracking_reference ?? data.tracking_number ?? data.short_tracking_reference ?? ""
    );
    const trackingUrl = data.tracking_url ?? null;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        bobgoOrderId: bobgoOrderId || null,
        trackingNumber: trackingNumber || null,
        trackingUrl,
        status: "processing",
      },
    });
    return { ok: true, message: "Order sent to Bob Go." };
  } catch {
    return { ok: false, message: "Could not reach Bob Go. Please try again." };
  }
}
