import { createHmac } from "node:crypto";

/**
 * Instant order events for the GeneFlow stock app (bottle counts), on top of its 5-minute
 * /api/stock-feed poll. Same line ids and product ids as the feed, so GeneFlow never double-counts.
 *
 * Off unless GENEFLOW_WEBHOOK_URL and GENEFLOW_WEBHOOK_SECRET (16+ chars) are set.
 * Signed like GeneFlow verifies it: X-GeneFlow-Signature: sha256=<hex HMAC-SHA256 of the raw body>.
 * Never throws and is never awaited by checkout or payment code. No customer details are sent.
 */
export type GeneflowTopic = "order.paid" | "order.refunded" | "order.cancelled";

export type GeneflowOrder = {
  orderNumber: string;
  paidAt: Date | string | null;
  items: { id: string; productId: string | null; quantity: number; name: string }[];
};

type Options = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  retryDelayMs?: number;
};

function config(env: Record<string, string | undefined> = process.env) {
  const url = env.GENEFLOW_WEBHOOK_URL?.trim() ?? "";
  const secret = env.GENEFLOW_WEBHOOK_SECRET ?? "";
  if (!/^https?:\/\//i.test(url) || secret.length < 16) return null;
  return { url, secret };
}

/** True when the feature is configured (lets callers skip extra DB reads when it is off). */
export function geneflowEnabled(env?: Record<string, string | undefined>): boolean {
  return config(env) !== null;
}

/** The exact JSON GeneFlow's webhookEvents() reads: only order number, paid time and line ids/qty/name. */
export function buildOrderBody(order: GeneflowOrder): string {
  const paidAt = order.paidAt ? new Date(order.paidAt).toISOString() : null;
  return JSON.stringify({
    order: {
      orderNumber: order.orderNumber,
      paidAt,
      lines: order.items.map((i) => ({ id: i.id, productId: i.productId, quantity: i.quantity, name: i.name })),
    },
  });
}

export function signBody(secret: string, body: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * POST one signed event to GeneFlow: 5 s timeout, one quick retry on a network error, timeout or 5xx/429.
 * Resolves true when GeneFlow accepted it, false otherwise (including when the feature is off). Never rejects.
 */
export async function sendOrderEvent(topic: GeneflowTopic, order: GeneflowOrder, opts: Options = {}): Promise<boolean> {
  try {
    const cfg = config(opts.env);
    if (!cfg) return false;
    const body = buildOrderBody(order);
    const headers = {
      "content-type": "application/json",
      "x-geneflow-topic": topic,
      "x-geneflow-signature": signBody(cfg.secret, body),
      "x-geneflow-event-id": `${topic}:${order.orderNumber}`,
    };
    const doFetch = opts.fetchImpl ?? fetch;
    let last = "";
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await doFetch(cfg.url, {
          method: "POST",
          headers,
          body,
          signal: AbortSignal.timeout(opts.timeoutMs ?? 5000),
        });
        if (res.ok) return true;
        last = `HTTP ${res.status}`;
        if (res.status < 500 && res.status !== 429) break; // bad signature / config: retrying won't help
      } catch (e) {
        last = (e as Error)?.name ?? "error";
      }
      if (attempt === 1) await wait(opts.retryDelayMs ?? 1000);
    }
    console.warn(`[geneflow] ${topic} for order ${order.orderNumber} not delivered (${last}); the 5-minute stock feed will catch it`);
    return false;
  } catch {
    console.warn(`[geneflow] ${topic} could not be sent`);
    return false;
  }
}
