// Run: npm test  (Node's built-in runner; Node 22.18+/24 loads the .ts module directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { addLine, buyNowLines, clampQty, itemCount, setLineQty, subtotalCents } from "../src/lib/cart-logic.ts";

const estro = { productId: "p_estro", slug: "estrogene", name: "Estrogene", price: 39900, image: "/e.png", stock: 5 };
const zen = { productId: "p_zen", slug: "zenax", name: "Zenax", price: 29900, stock: 2 };

test("clampQty keeps quantities between 1 and stock", () => {
  assert.equal(clampQty(0, 5), 1);
  assert.equal(clampQty(-3, 5), 1);
  assert.equal(clampQty(9, 5), 5);
  assert.equal(clampQty(2.7, 5), 2);
  assert.equal(clampQty(Number.NaN, 5), 1);
  assert.equal(clampQty(3, 0), 0);
});

test("addLine adds a new line and stacks on an existing one, capped at stock", () => {
  let items = addLine([], estro, 2);
  assert.deepEqual(items.map((i) => i.quantity), [2]);
  items = addLine(items, estro, 2);
  assert.equal(items[0].quantity, 4);
  items = addLine(items, estro, 10);
  assert.equal(items[0].quantity, 5, "never above stock");
  assert.equal(items.length, 1);
});

test("addLine ignores sold-out products", () => {
  assert.deepEqual(addLine([], { ...estro, stock: 0 }, 1), []);
});

test("buyNowLines puts the chosen quantity in an empty cart", () => {
  const items = buyNowLines([], estro, 3);
  assert.equal(items.length, 1);
  assert.equal(items[0].quantity, 3);
  assert.equal(subtotalCents(items), 3 * 39900);
});

test("buyNowLines never doubles: pressing twice or after Add to cart keeps the larger amount", () => {
  let items = buyNowLines([], estro, 2);
  items = buyNowLines(items, estro, 2);
  assert.equal(items[0].quantity, 2);
  items = addLine([], estro, 4);
  items = buyNowLines(items, estro, 1);
  assert.equal(items[0].quantity, 4, "keeps what the shopper already chose");
  items = buyNowLines(items, estro, 5);
  assert.equal(items[0].quantity, 5);
});

test("buyNowLines keeps the rest of the cart and caps at stock", () => {
  let items = addLine([], zen, 1);
  items = buyNowLines(items, estro, 99);
  assert.deepEqual(items.map((i) => [i.productId, i.quantity]), [["p_zen", 1], ["p_estro", 5]]);
  assert.equal(itemCount(items), 6);
  assert.equal(subtotalCents(items), 29900 + 5 * 39900);
});

test("buyNowLines ignores sold-out products", () => {
  const items = addLine([], zen, 1);
  assert.deepEqual(buyNowLines(items, { ...estro, stock: 0 }, 1), items);
});

test("setLineQty caps at stock and removes at zero", () => {
  let items = addLine(addLine([], estro, 1), zen, 1);
  items = setLineQty(items, "p_zen", 10);
  assert.equal(items.find((i) => i.productId === "p_zen").quantity, 2);
  items = setLineQty(items, "p_zen", 0);
  assert.deepEqual(items.map((i) => i.productId), ["p_estro"]);
});
