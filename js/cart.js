(function () {
  const $ = (s, c = document) => c.querySelector(s),
    $$ = (s, c = document) => [...c.querySelectorAll(s)],
    KEY = "sazuCart";
  const get = () => {
      try {
        return JSON.parse(localStorage.getItem(KEY)) || [];
      } catch {
        return [];
      }
    },
    save = (x) => {
      localStorage.setItem(KEY, JSON.stringify(x));
      render();
    },
    type = () => localStorage.getItem("sazuType") || "retail";
  function add(id, qty = 1) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p?.stock) return;
    const a = get(),
      i = a.find((x) => x.id === id);
    i
      ? (i.qty = Math.min(p.stock, i.qty + qty))
      : a.push({ id, qty: Math.min(qty, p.stock) });
    save(a);
    Sazu.toast(`${p.name} agregado`);
  }
  function remove(id) {
    save(get().filter((x) => x.id !== id));
    Sazu.toast("Producto eliminado");
  }
  function update(id, q) {
    const a = get(),
      i = a.find((x) => x.id === id),
      p = PRODUCTS.find((x) => x.id === id);
    if (i) {
      i.qty = Math.max(1, Math.min(+q || 1, p.stock));
      save(a);
    }
  }
  function total() {
    return get().reduce((s, i) => {
      const p = PRODUCTS.find((x) => x.id === i.id),
        price =
          type() === "wholesale" && i.qty >= p.min ? p.wholesale : p.price;
      return s + price * i.qty;
    }, 0);
  }
  function row(i) {
    const p = PRODUCTS.find((x) => x.id === i.id),
      price = type() === "wholesale" && i.qty >= p.min ? p.wholesale : p.price;
    return `<div class="cart-item"><img src="${p.image}" alt="${p.name}"><div><h4>${p.name}</h4><small>${money(price)} c/u</small><div class="qty"><button data-minus="${p.id}">−</button><input data-qty="${p.id}" value="${i.qty}"><button data-plus="${p.id}">+</button></div></div><button class="btn btn-danger btn-small" data-remove="${p.id}">Eliminar</button></div>`;
  }
  function bind() {
    $$("[data-remove]").forEach(
      (b) => (b.onclick = () => remove(+b.dataset.remove)),
    );
    $$("[data-minus]").forEach(
      (b) =>
        (b.onclick = () => {
          const i = get().find((x) => x.id === +b.dataset.minus);
          update(i.id, i.qty - 1);
        }),
    );
    $$("[data-plus]").forEach(
      (b) =>
        (b.onclick = () => {
          const i = get().find((x) => x.id === +b.dataset.plus);
          update(i.id, i.qty + 1);
        }),
    );
    $$("[data-qty]").forEach(
      (i) => (i.onchange = () => update(+i.dataset.qty, i.value)),
    );
  }
  function render() {
    const a = get(),
      count = a.reduce((s, i) => s + i.qty, 0),
      html = a.length
        ? a.map(row).join("")
        : '<div class="empty"><h3>Tu carrito está vacío</h3><p>Explora el catálogo para comenzar.</p></div>';
    $$("[data-cart-count]").forEach((x) => (x.textContent = count));
    ["#drawerItems", "#cartItems"].forEach((s) => {
      if ($(s)) $(s).innerHTML = html;
    });
    $$("[data-total],[data-subtotal]").forEach(
      (x) => (x.textContent = money(total())),
    );
    bind();
  }
  function open() {
    $("#cartDrawer")?.classList.add("open");
    document.body.classList.add("lock");
    render();
  }
  function checkout() {
    if (!$("#checkoutForm")) return;
    let step = 1;
    const show = () => {
      $$(".checkout-step").forEach((x) =>
        x.classList.toggle("active", +x.dataset.step === step),
      );
      $$(".step").forEach((x, i) => x.classList.toggle("active", i < step));
      $("#prev").style.visibility = step === 1 ? "hidden" : "visible";
      $("#prev").style.display = step === 5 ? "none" : "";
      $("#next").style.display = step === 5 ? "none" : "";
      $("#next").textContent = step === 4 ? "Confirmar pedido" : "Continuar";
      $("#orderSummary").innerHTML =
        get()
          .map((i) => {
            const p = PRODUCTS.find((x) => x.id === i.id);
            return `<div class="total"><span>${p.name} × ${i.qty}</span><strong>${money(p.price * i.qty)}</strong></div>`;
          })
          .join("") || "<p>Sin productos.</p>";
      $("#checkoutTotal").textContent = money(total());
    };
    $("#next").onclick = () => {
      if (step < 4) {
        if (
          [
            ...$(`.checkout-step[data-step="${step}"]`).querySelectorAll(
              "[required]",
            ),
          ].some((i) => !i.value)
        ) {
          Sazu.toast("Completa los campos requeridos");
          return;
        }
        step++;
      } else {
        const orders = JSON.parse(localStorage.getItem("sazuOrders") || "[]");
        orders.push({
          id: `SZ-${Date.now().toString().slice(-5)}`,
          total: total(),
          items: get(),
          status: "Pendiente",
        });
        localStorage.setItem("sazuOrders", JSON.stringify(orders));
        localStorage.removeItem(KEY);
        step = 5;
        render();
      }
      show();
    };
    $("#prev").onclick = () => {
      step = Math.max(1, step - 1);
      show();
    };
    show();
  }
  document.addEventListener("DOMContentLoaded", () => {
    render();
    $$("[data-close-drawer]").forEach(
      (b) =>
        (b.onclick = () => {
          b.closest(".drawer").classList.remove("open");
          document.body.classList.remove("lock");
        }),
    );
    $$('[name="purchaseType"]').forEach(
      (r) =>
        (r.onchange = () => {
          localStorage.setItem("sazuType", r.value);
          render();
        }),
    );
    checkout();
  });
  window.Cart = { get, add, remove, update, total, render, open };
})();
