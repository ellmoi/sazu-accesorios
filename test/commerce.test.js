const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  { webcrypto } = require("node:crypto");
function demo(seed = {}) {
  const values = new Map(Object.entries(seed));
  let fail = false;
  const localStorage = {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => {
      if (fail) throw Error("quota");
      values.set(k, v);
    },
    removeItem: (k) => values.delete(k),
  };
  const context = { localStorage, crypto: webcrypto };
  context.window = context;
  vm.createContext(context);
  for (const file of ["products", "clients", "orders", "pricing", "storage"])
    vm.runInContext(fs.readFileSync(`js/${file}.js`, "utf8"), context);
  context.SazuStorage.ensureDemoData();
  return {
    store: context.SazuStorage,
    pricing: context.SazuPricing,
    values,
    fail: () => {
      fail = true;
    },
  };
}
function customer(d) {
  d.store.setSession({ email: "cliente@demo.co" });
}
test("verified seed counts and a single initial dataset", () => {
  const d = demo(),
    s = d.store.getState();
  assert.equal(s.products.length, 46);
  assert.equal(s.clients.length, 8);
  assert.equal(s.orders.length, 10);
  assert.equal(Object.keys(d.pricing.LEVELS).length, 5);
  assert.equal(d.pricing.STATES.length, 7);
  assert.equal(new Set(s.products.map((p) => p.id)).size, 46);
});
test("order snapshots prices, reserves stock, clears cart and reloads consistently", () => {
  const d = demo();
  customer(d);
  d.store.setCart([{ id: 1, qty: 2 }]);
  const before = d.store.getProducts()[0];
  const o = d.store.createOrder({ city: "Bogotá" });
  assert.equal(o.total, 207840);
  assert.equal(o.subtotal, 259800);
  assert.equal(o.discount, 51960);
  assert.equal(o.items[0].unitPrice, 103920);
  assert.equal(d.store.getProducts()[0].stock, before.stock - 2);
  assert.equal(d.store.getCart().length, 0);
  assert.equal(d.store.getOrders().length, 11);
  const reloaded = demo(Object.fromEntries(d.values));
  assert.equal(reloaded.store.getOrders()[0].id, o.id);
  assert.equal(reloaded.store.getProducts()[0].stock, before.stock - 2);
});
test("empty, missing, fractional, duplicate and oversold carts cannot create orders", () => {
  for (const cart of [
    [],
    [{ id: 999, qty: 1 }],
    [{ id: 1, qty: 1.5 }],
    [{ id: 1, qty: 29 }],
    [
      { id: 1, qty: 20 },
      { id: 1, qty: 20 },
    ],
  ]) {
    const d = demo();
    customer(d);
    if (cart.some((i) => !Number.isInteger(i.qty))) {
      assert.equal(
        d.pricing.summarizeCart(cart, d.store.getProducts()).valid,
        false,
      );
      continue;
    }
    d.store.setCart(cart);
    assert.throws(() => d.store.createOrder({}));
    assert.equal(d.store.getOrders().length, 10);
    assert.equal(d.store.getProducts()[0].stock, 28);
  }
});
test("level and wholesale thresholds use best benefit without stacking", () => {
  const { pricing: p } = demo();
  const product = {
    price: 100000,
    wholesale: 95000,
    min: 6,
    offer: 5,
    stock: 100,
  };
  for (const [qty, expected] of [
    [5, 100000],
    [6, 92000],
    [12, 92000],
    [13, 85000],
    [24, 85000],
    [25, 75000],
  ])
    assert.equal(p.getUnitPrice(product, qty, "wholesale").unitPrice, expected);
  assert.equal(p.getUnitPrice(product, 1, "retail", "VIP").unitPrice, 92000);
  assert.equal(
    p.getUnitPrice({ ...product, offer: 20 }, 1, "retail", "VIP").unitPrice,
    80000,
  );
  assert.equal(
    p.getUnitPrice(product, 25, "retail", "Mayorista").unitPrice,
    75000,
  );
});
test("admin status is persisted; cancellation restores stock exactly once", () => {
  const d = demo();
  customer(d);
  d.store.setCart([{ id: 1, qty: 2 }]);
  const o = d.store.createOrder({});
  assert.throws(() => d.store.changeStatus(o.id, "Enviado"));
  d.store.setSession({ email: "admin@demo.co" });
  d.store.changeStatus(o.id, "Enviado");
  assert.equal(d.store.getOrders()[0].status, "Enviado");
  d.store.changeStatus(o.id, "Cancelado");
  d.store.changeStatus(o.id, "Cancelado");
  assert.equal(d.store.getProducts()[0].stock, 28);
  assert.throws(() => d.store.changeStatus(o.id, "Pendiente"));
  assert.throws(() => d.store.changeStatus(o.id, "Inventado"));
});
test("failed storage write cannot partially place an order", () => {
  const d = demo();
  customer(d);
  d.store.setCart([{ id: 1, qty: 2 }]);
  const before = d.values.get(d.store.KEY);
  d.fail();
  assert.throws(() => d.store.createOrder({}), /No se pudo guardar/);
  assert.equal(d.values.get(d.store.KEY), before);
});
test("reset restores immutable seeds and preserves unrelated keys", () => {
  const d = demo({ unrelated: "keep" });
  customer(d);
  d.store.setCart([{ id: 1, qty: 1 }]);
  d.store.createOrder({});
  d.store.resetDemoData();
  assert.equal(d.store.getProducts()[0].stock, 28);
  assert.equal(d.store.getOrders().length, 10);
  assert.equal(d.store.getSession(), null);
  assert.equal(d.values.get("unrelated"), "keep");
});
test("missing or corrupt persisted state recovers without crashing", () => {
  for (const value of [
    "{broken",
    "null",
    "{}",
    '{"version":2,"products":null}',
  ]) {
    const d = demo({ sazuDemoV2: value });
    assert.equal(d.store.getProducts().length, 46);
    assert.equal(d.store.getOrders().length, 10);
  }
});
test("legacy orders are preserved without inventing unit prices", () => {
  const d = demo({
    sazuOrders: JSON.stringify([
      {
        id: "OLD",
        client: "Cliente Demo",
        total: 123,
        items: [{ id: 1, qty: 1 }],
        status: "Pendiente",
      },
    ]),
  });
  assert.equal(d.store.getOrders().length, 11);
  assert.equal(d.store.getOrders().find((o) => o.id === "OLD").legacy, true);
});
test("registration adds a linked client, rejects duplicate emails and applies updated level", () => {
  const d = demo();
  d.store.register({
    name: "Prueba",
    email: "prueba@example.test",
    password: "demo123",
  });
  assert.equal(d.store.getClients().length, 9);
  assert.equal(d.store.getCustomer().name, "Prueba");
  assert.throws(() =>
    d.store.register({
      name: "Otro",
      email: "PRUEBA@example.test",
      password: "demo123",
    }),
  );
  const clients = d.store.getClients();
  clients.find((c) => c.name === "Prueba").level = "VIP";
  d.store.setClients(clients);
  assert.equal(d.store.getCustomer().level, "VIP");
});

test("a stale cart cannot oversell after inventory is changed", () => {
  const d = demo();
  customer(d);
  d.store.setCart([{ id: 1, qty: 5 }]);
  const products = d.store.getProducts();
  products[0].stock = 2;
  d.store.setProducts(products);
  assert.throws(() => d.store.createOrder({}), /Solo quedan 2/);
  assert.equal(d.store.getCart()[0].qty, 5);
  assert.equal(d.store.getProducts()[0].stock, 2);
});
test("historic price snapshots survive product changes and deletion", () => {
  const d = demo();
  customer(d);
  d.store.setCart([{ id: 1, qty: 2 }]);
  const order = d.store.createOrder({});
  d.store.setProducts(d.store.getProducts().filter((p) => p.id !== 1));
  assert.equal(d.store.getOrders()[0].items[0].name, "Audífonos Nova Pro");
  assert.equal(d.store.getOrders()[0].total, order.total);
});
test("nested corrupt orders recover and JSON exports match the seed", () => {
  const d = demo();
  const broken = d.store.getState();
  broken.orders[0].items = [null];
  d.values.set(d.store.KEY, JSON.stringify(broken));
  assert.equal(d.store.getOrders()[0].items.length, 0);
  assert.deepEqual(
    JSON.parse(JSON.stringify(d.store.getProducts())),
    JSON.parse(fs.readFileSync("data/demo-products.json", "utf8")),
  );
});
