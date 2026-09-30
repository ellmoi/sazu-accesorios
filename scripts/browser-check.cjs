// Optional developer-only check. Pass an installed Playwright module path as the first argument.
const { chromium } = require(
  process.argv[2] ? require("path").resolve(process.argv[2]) : "playwright",
);
const http = require("http"),
  fs = require("fs"),
  path = require("path"),
  assert = require("assert/strict");
fs.mkdirSync("tmp", { recursive: true });
const root = process.cwd();
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split("?")[0]);
  if (!url.startsWith("/sazu-accesorios/")) {
    res.writeHead(404).end();
    return;
  }
  let file = path.resolve(
    root,
    url.slice("/sazu-accesorios/".length) || "index.html",
  );
  if (!file.startsWith(root + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  fs.readFile(file, (e, data) => {
    if (e) {
      res.writeHead(404).end();
      return;
    }
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".jpg": "image/jpeg",
        ".json": "application/json",
      }[path.extname(file)] || "application/octet-stream",
    );
    res.end(data);
  });
});

async function journey() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = "http://127.0.0.1:8001/sazu-accesorios/";
  await page.goto(base + "login.html");
  await page.click('[data-login-demo="customer"]');
  await page.waitForURL("**/perfil.html");
  assert.equal(await page.locator(".order-card").count(), 1);
  await page.goto(base + "productos.html");
  assert.equal(await page.locator(".product").count(), 46);
  await page.fill("#search", "Nova");
  assert.equal(await page.locator(".product").count(), 1);
  await page.selectOption("#category", "Ropa dama");
  assert.equal(await page.locator(".product").count(), 0);
  await page.click("#clear");
  assert.equal(await page.locator(".product").count(), 46);
  await page.click('[data-detail="1"]');
  await page.waitForURL("**/producto.html?id=1");
  await page.fill("[data-detail-qty]", "2");
  await page.click("[data-add-to-cart]");
  await page.goto(base + "carrito.html");
  assert.equal(await page.locator("[data-qty]").inputValue(), "2");
  await page.fill("[data-qty]", "1.5");
  await page.locator("[data-qty]").blur();
  assert.equal(await page.locator("[data-qty]").inputValue(), "2");
  await page.goto(base + "checkout.html");
  for (let i = 0; i < 4; i++) await page.click("#next");
  await page.locator("#confirmedOrder").waitFor({ state: "visible" });
  const order = await page.evaluate(() => SazuStorage.getOrders()[0]);
  assert.equal(order.total, 207840);
  assert.equal(
    await page.evaluate(() => SazuStorage.getProducts()[0].stock),
    26,
  );
  assert.equal(await page.evaluate(() => SazuStorage.getCart().length), 0);
  await page.goto(base + "perfil.html");
  assert.equal(await page.locator(".order-card").count(), 2);
  assert((await page.locator("#history").textContent()).includes(order.id));
  await page.goto(base + "login.html");
  await page.click('[data-login-demo="admin"]');
  await page.waitForURL("**/admin.html");
  await page.click('[data-view="orders"]');
  await page.selectOption(`[data-status="${order.id}"]`, "Enviado");
  await page.click('[data-view="clients"]');
  await page.selectOption('[data-level="1"]', "VIP");
  await page.goto(base + "login.html");
  await page.click('[data-login-demo="customer"]');
  await page.waitForURL("**/perfil.html");
  assert((await page.locator("#history").textContent()).includes("Enviado"));
  assert((await page.locator("#profileSummary").textContent()).includes("VIP"));
  await page.goto(base + "producto.html?id=99999");
  assert(
    (await page.locator("#productDetail").textContent()).includes("no existe"),
  );
  await page.goto(base + "ofertas.html");
  const offers = await page.evaluate(
    () => SazuStorage.getProducts().filter((p) => p.offer > 0).length,
  );
  assert.equal(await page.locator(".product").count(), offers);
  await page.goto(base + "login.html");
  await page.click('[data-login-demo="admin"]');
  await page.waitForURL("**/admin.html");
  await page.click('[data-view="products"]');
  await page.click('[data-edit="1"]');
  await page.fill('[name="stock"]', "9");
  await page.click("#productForm button");
  await page.reload();
  assert.equal(
    await page.evaluate(() => SazuStorage.getProducts()[0].stock),
    9,
  );
  await page.click('[data-view="settings"]');
  page.once("dialog", (d) => d.accept());
  await page.click("#resetDemoData");
  await page.waitForURL("**/login.html?reset=1");
  assert.equal(
    await page.evaluate(() => SazuStorage.getProducts()[0].stock),
    28,
  );
  assert.equal(await page.evaluate(() => SazuStorage.getOrders().length), 10);
  console.log(
    JSON.stringify(
      { result: "PASS commercial browser journey", errors },
      null,
      2,
    ),
  );
  await browser.close();
  assert.deepEqual(errors, []);
}

async function extended() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const base = "http://127.0.0.1:8001/sazu-accesorios/";
  await page.goto(base + "registro.html");
  await page.fill("#firstName", "Evaluador ficticio");
  await page.fill('input[type="email"]', "evaluador@example.test");
  await page.fill("#password", "demo123");
  await page.fill("#confirm", "demo123");
  await page.click("#registerForm button");
  await page.waitForURL("**/perfil.html");
  assert.equal(await page.locator(".order-card").count(), 0);
  await page.goto(base + "productos.html");
  await page.click('[data-add="1"]');
  await page.click("[data-open-cart]");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".drawer.open").count(), 0);
  await page.goto(base + "carrito.html");
  await page.check('[value="wholesale"]');
  await page.fill("[data-qty]", "6");
  await page.locator("[data-qty]").blur();
  assert(
    (await page.locator("[data-total]").textContent()).includes("599.400"),
  );
  await page.goto(base + "checkout.html");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.click("#next");
  await page.click("#next");
  assert(
    (await page.locator("#orderSummary").textContent()).includes("599.400"),
  );
  await page.screenshot({ path: "tmp/checkout-mobile.png" });
  await page.click("#next");
  await page.click("#next");
  assert.equal(
    await page.evaluate(() => SazuStorage.getOrders()[0].total),
    599400,
  );
  await page.goto(base + "login.html");
  await page.click('[data-login-demo="customer"]');
  await page.waitForURL("**/perfil.html");
  assert.equal(await page.locator(".order-card").count(), 1);
  await page.goto(base + "login.html");
  await page.click('[data-login-demo="admin"]');
  await page.waitForURL("**/admin.html");
  await page.evaluate(() =>
    document.querySelector('[data-view="products"]').click(),
  );
  await page.click("#addProduct");
  for (const [key, value] of Object.entries({
    name: "Producto prueba",
    code: "TEST-1",
    price: "10000",
    wholesale: "8000",
    min: "6",
    stock: "9",
    offer: "10",
    desc: "Descripción demo",
  }))
    await page.fill('[name="' + key + '"]', value);
  await page.click("#productForm button");
  assert.equal(await page.evaluate(() => SazuStorage.getProducts().length), 47);
  await page.reload();
  assert.equal(await page.evaluate(() => SazuStorage.getProducts().length), 47);
  await page.evaluate(() =>
    document.querySelector('[data-view="products"]').click(),
  );
  const id = await page.evaluate(() => SazuStorage.getProducts().at(-1).id);
  page.once("dialog", (d) => d.accept());
  await page.click(`[data-delete="${id}"]`);
  assert.equal(await page.evaluate(() => SazuStorage.getProducts().length), 46);
  await page.evaluate(() => localStorage.setItem("sazuDemoV2", "{broken"));
  await page.reload();
  assert.equal(await page.evaluate(() => SazuStorage.getOrders().length), 10);
  assert((await page.locator("body").textContent()).includes("dañados"));
  assert.deepEqual(errors, []);
  console.log(
    "PASS registration, isolation, wholesale, drawer keyboard, mobile checkout, CRUD, corruption; no JS errors",
  );
  await browser.close();
}

async function responsive() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [],
    bad = [],
    images = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) bad.push(r.url() + " " + r.status());
  });
  const base = "http://127.0.0.1:8001/sazu-accesorios/";
  await page.goto(base + "login.html");
  await page.click('[data-login-demo="admin"]');
  await page.waitForURL("**/admin.html");
  const overflow = [];
  const pages = [
    "index.html",
    "categorias.html",
    "productos.html",
    "ofertas.html",
    "mayoristas.html",
    "producto.html?id=1",
    "carrito.html",
    "checkout.html",
    "perfil.html",
    "login.html",
    "registro.html",
    "admin.html",
  ];
  for (const width of [320, 375, 425, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const file of pages) {
      await page.goto(base + file);
      const result = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("body *")]
          .filter(
            (e) =>
              e.getBoundingClientRect().right > innerWidth + 1 &&
              getComputedStyle(e).position !== "fixed",
          )
          .slice(0, 7)
          .map((e) => e.tagName + "." + e.className),
      }));
      if (result.scroll > width + 1) overflow.push({ width, file, ...result });
      if (file === "admin.html") {
        for (const view of [
          "products",
          "clients",
          "orders",
          "settings",
          "shipping",
        ]) {
          await page.evaluate(
            (v) => document.querySelector(`[data-view="${v}"]`).click(),
            view,
          );
          if (
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 1,
            )
          )
            overflow.push({ width, file, view });
        }
        await page.evaluate(() =>
          document.querySelector('[data-view="products"]').click(),
        );
        await page.click('[data-edit="1"]');
        await page.keyboard.press("Tab");
        await page.keyboard.press("Escape");
      }
      if (
        width === 375 &&
        ["index.html", "productos.html", "admin.html"].includes(file)
      )
        await page.screenshot({
          path: "tmp/mobile-" + file + ".png",
          fullPage: false,
        });
      if (width === 1440 && file === "productos.html") {
        await page.locator(".product").last().scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        images.push(
          ...(await page
            .locator("img")
            .evaluateAll((imgs) =>
              imgs
                .filter((i) => i.complete && i.naturalWidth === 0)
                .map((i) => i.src),
            )),
        );
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: "tmp/catalog-desktop.png" });
      }
    }
  }
  console.log(
    JSON.stringify(
      { pages: pages.length, widths: 6, overflow, errors, bad, images },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    "tmp/responsive-results.json",
    JSON.stringify(
      { pages: pages.length, widths: 6, overflow, errors, bad, images },
      null,
      2,
    ),
  );
  await browser.close();
  if (overflow.length || errors.length || bad.length || images.length)
    process.exitCode = 1;
}

(async () => {
  await new Promise((resolve) => server.listen(8001, "127.0.0.1", resolve));
  try {
    await journey();
    await extended();
    await responsive();
  } finally {
    server.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
