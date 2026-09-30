const test = require("node:test");
const assert = require("node:assert/strict");

const { getUnitPrice, summarizeCart } = require("../js/pricing.js");

test("getUnitPrice applies retail discount and wholesale pricing by threshold", () => {
  const retail = getUnitPrice(
    { price: 100000, wholesale: 80000, min: 5, offer: 10 },
    1,
    "retail",
  );
  assert.equal(retail.unitPrice, 90000);
  assert.equal(retail.isWholesale, false);

  const wholesale = getUnitPrice(
    { price: 100000, wholesale: 80000, min: 5, offer: 10 },
    5,
    "wholesale",
  );
  assert.equal(wholesale.unitPrice, 80000);
  assert.equal(wholesale.isWholesale, true);
});

test("summarizeCart totals line items without mutating input prices", () => {
  const cart = [
    { id: 1, qty: 2 },
    { id: 2, qty: 1 },
  ];
  const products = [
    { id: 1, price: 100000, wholesale: 85000, min: 3, offer: 5 },
    { id: 2, price: 250000, wholesale: 220000, min: 2, offer: 0 },
  ];

  const summary = summarizeCart(cart, products, "retail");
  assert.equal(summary.itemCount, 3);
  assert.equal(summary.total, 2 * 95000 + 250000);
  assert.equal(summary.discount, 2 * 5000);
});
