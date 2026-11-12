// Run: npm test  (Node's built-in runner; Node 22.18+/24 loads the .ts module directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildOrderBody, geneflowEnabled, sendOrderEvent, signBody } from "../src/lib/geneflow-webhook.ts";

const SECRET = "test-secret-0123456789-abcdefghijklmnop";
const env = { GENEFLOW_WEBHOOK_URL: "https://geneflow.example/api/store-webhook", GENEFLOW_WEBHOOK_SECRET: SECRET };
const order = {
  orderNumber: "GG-1001",
  paidAt: new Date("2026-11-12T08:00:00Z"),
  email: "customer@example.com", phone: "0820000000", shippingAddress: '{"line1":"x"}', total: 12345,
  items: [
    { id: "li_1", productId: "prod_a", quantity: 2, name: "Ashwagandha", price: 1000, image: "/a.png" },
    { id: "li_2", productId: null, quantity: 1, name: "Old product", price: 500, image: null },
  ],
};

// Exact copy of GeneFlow's verifyWebhook (greengene-stock/shared/bottles.ts), GeneFlow branch.
const enc = new TextEncoder();
async function receiverVerify(secret, rawBody, header) {
  if (!secret || secret.length < 16) return false;
  const shop = header("x-shopify-hmac-sha256"), gf = header("x-geneflow-signature");
  const fromHex = (s) => { const h = s.trim().toLowerCase(); return /^[0-9a-f]{64}$/.test(h) ? Uint8Array.from(h.match(/../g).map((x) => parseInt(x, 16))) : null; };
  const given = shop ? null : gf ? fromHex(gf.replace(/^sha256=/i, "")) : null;
  if (!given || given.length !== 32) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(rawBody)));
  let diff = 0; for (let i = 0; i < 32; i++) diff |= mac[i] ^ given[i];
  return diff === 0;
}

function capture(responses) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    const r = responses[calls.length - 1] ?? responses.at(-1);
    if (r instanceof Error) throw r;
    return new Response("{}", { status: r });
  };
  return { calls, fetchImpl };
}

test("signature verifies with GeneFlow's exact scheme; tampering fails", async () => {
  const { calls, fetchImpl } = capture([200]);
  assert.equal(await sendOrderEvent("order.paid", order, { env, fetchImpl }), true);
  const { init } = calls[0];
  const h = (k) => init.headers[k.toLowerCase()] ?? null;
  assert.match(h("x-geneflow-signature"), /^sha256=[0-9a-f]{64}$/);
  assert.equal(h("x-geneflow-topic"), "order.paid");
  assert.equal(await receiverVerify(SECRET, init.body, h), true);
  assert.equal(await receiverVerify(SECRET, init.body + " ", h), false);
  assert.equal(await receiverVerify("another-secret-0123456789", init.body, h), false);
  assert.equal(signBody(SECRET, init.body), h("x-geneflow-signature"));
});

test("body has only order number, paidAt and line id/productId/quantity/name (no customer data)", () => {
  const body = JSON.parse(buildOrderBody(order));
  assert.deepEqual(body, {
    order: {
      orderNumber: "GG-1001",
      paidAt: "2026-11-12T08:00:00.000Z",
      lines: [
        { id: "li_1", productId: "prod_a", quantity: 2, name: "Ashwagandha" },
        { id: "li_2", productId: null, quantity: 1, name: "Old product" },
      ],
    },
  });
  const raw = buildOrderBody(order);
  for (const pii of ["customer@example.com", "0820000000", "line1", "12345"]) assert.ok(!raw.includes(pii));
});

test("missing or weak env = silent no-op (no request)", async () => {
  for (const e of [{}, { GENEFLOW_WEBHOOK_URL: env.GENEFLOW_WEBHOOK_URL }, { GENEFLOW_WEBHOOK_SECRET: SECRET }, { ...env, GENEFLOW_WEBHOOK_SECRET: "short" }, { ...env, GENEFLOW_WEBHOOK_URL: "not a url" }]) {
    const { calls, fetchImpl } = capture([200]);
    assert.equal(await sendOrderEvent("order.paid", order, { env: e, fetchImpl }), false);
    assert.equal(calls.length, 0);
    assert.equal(geneflowEnabled(e), false);
  }
  assert.equal(geneflowEnabled(env), true);
});

test("network error / 5xx: one retry then gives up without throwing", async () => {
  const a = capture([new TypeError("fetch failed"), new TypeError("fetch failed")]);
  assert.equal(await sendOrderEvent("order.refunded", order, { env, fetchImpl: a.fetchImpl, retryDelayMs: 1 }), false);
  assert.equal(a.calls.length, 2);
  const b = capture([503, 200]);
  assert.equal(await sendOrderEvent("order.paid", order, { env, fetchImpl: b.fetchImpl, retryDelayMs: 1 }), true);
  assert.equal(b.calls.length, 2);
  const c = capture([401]);
  assert.equal(await sendOrderEvent("order.paid", order, { env, fetchImpl: c.fetchImpl, retryDelayMs: 1 }), false);
  assert.equal(c.calls.length, 1, "4xx is not retried");
});

test("timeout: a hanging GeneFlow is abandoned quickly and never throws", async () => {
  let n = 0;
  const fetchImpl = (_url, init) => { n++; return new Promise((_, rej) => init.signal.addEventListener("abort", () => rej(init.signal.reason))); };
  const t0 = Date.now();
  assert.equal(await sendOrderEvent("order.paid", order, { env, fetchImpl, timeoutMs: 50, retryDelayMs: 1 }), false);
  assert.equal(n, 2);
  assert.ok(Date.now() - t0 < 2000);
});

test("bad input never throws", async () => {
  assert.equal(await sendOrderEvent("order.paid", /** @type any */ (null), { env, fetchImpl: capture([200]).fetchImpl }), false);
});
