(function () {
  const $ = (s, c = document) => c.querySelector(s),
    $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = window.SazuStorage,
    pricing = window.SazuPricing;
  const money = pricing.formatMoney,
    escape = (value) => Sazu.escape(value);
  const getCart = () => store.getCart();
  const summary = () =>
    pricing.summarizeCart(
      getCart(),
      store.getProducts(),
      store.getMode(),
      store.getCustomer()?.level || "Nuevo",
    );
  function save(items) {
    try {
      store.setCart(items);
      render();
      return true;
    } catch (e) {
      Sazu.toast(e.message);
      return false;
    }
  }
  function add(id, qty = 1) {
    const product = store.getProducts().find((p) => p.id === id),
      cart = getCart();
    if (!product) {
      Sazu.toast("Producto no disponible");
      return false;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      Sazu.toast("La cantidad debe ser un entero mayor que cero");
      return false;
    }
    const item = cart.find((i) => i.id === id),
      total = (item?.qty || 0) + qty;
    if (total > product.stock) {
      Sazu.toast(`Solo quedan ${product.stock} unidades disponibles`);
      return false;
    }
    if (item) item.qty = total;
    else cart.push({ id, qty });
    if (!save(cart)) return false;
    Sazu.toast(`${product.name} agregado al carrito`);
    return true;
  }
  function remove(id) {
    if (save(getCart().filter((i) => i.id !== id)))
      Sazu.toast("Producto eliminado del carrito");
  }
  function update(id, qty) {
    const product = store.getProducts().find((p) => p.id === id);
    if (!product || !Number.isInteger(qty) || qty <= 0 || qty > product.stock) {
      Sazu.toast(
        "Introduce una cantidad entera positiva dentro del inventario disponible",
      );
      render();
      return;
    }
    const cart = getCart(),
      item = cart.find((i) => i.id === id);
    if (item) {
      item.qty = qty;
      save(cart);
    }
  }
  function render() {
    const cart = getCart(),
      totals = summary(),
      products = store.getProducts();
    const markup = cart.length
      ? cart
          .map((entry) => {
            const p = products.find((p) => p.id === entry.id);
            if (!p)
              return `<div class="cart-item"><p>Producto no disponible</p><button class="btn btn-danger" data-remove="${entry.id}">Eliminar</button></div>`;
            const price = pricing.getUnitPrice(
              p,
              entry.qty,
              store.getMode(),
              totals.level,
            );
            return `<div class="cart-item"><img src="${escape(p.image)}" alt="${escape(p.name)}"><div><h4>${escape(p.name)}</h4><small>${money(price.unitPrice)} c/u · ${escape(price.benefit)}</small><div class="qty"><button type="button" aria-label="Restar unidad" data-minus="${p.id}">−</button><input aria-label="Cantidad de ${escape(p.name)}" type="number" min="1" max="${p.stock}" value="${entry.qty}" data-qty="${p.id}"><button type="button" aria-label="Sumar unidad" data-plus="${p.id}">+</button></div></div><button class="btn btn-danger btn-small" data-remove="${p.id}">Eliminar</button></div>`;
          })
          .join("")
      : '<div class="empty"><h3>Tu carrito está vacío</h3><a href="productos.html">Explorar el catálogo</a></div>';
    for (const selector of ["#drawerItems", "#cartItems"])
      if ($(selector)) $(selector).innerHTML = markup;
    $$("[data-cart-count],[data-cart-float-count]").forEach(
      (n) => (n.textContent = totals.itemCount),
    );
    if ($("#floatingCart"))
      $("#floatingCart").style.display = cart.length ? "flex" : "none";
    for (const [selector, value] of Object.entries({
      "[data-total]": totals.total,
      "[data-subtotal]": totals.subtotal,
      "[data-discount]": totals.discount,
    }))
      $$(selector).forEach((n) => (n.textContent = money(value)));
    $$("[data-benefit]").forEach(
      (n) =>
        (n.textContent = `Nivel: ${totals.level}. ${totals.valid ? "Mejor beneficio aplicable, sin acumular descuentos." : totals.errors.join(". ")}`),
    );
    $$("[data-remove]").forEach(
      (b) => (b.onclick = () => remove(Number(b.dataset.remove))),
    );
    for (const [attr, step] of [
      ["minus", -1],
      ["plus", 1],
    ])
      $$(`[data-${attr}]`).forEach(
        (b) =>
          (b.onclick = () => {
            const i = getCart().find((i) => i.id === Number(b.dataset[attr]));
            if (i) update(i.id, i.qty + step);
          }),
      );
    $$("[data-qty]").forEach(
      (i) =>
        (i.onchange = () => update(Number(i.dataset.qty), Number(i.value))),
    );
    if ($("#clearCart")) $("#clearCart").disabled = !cart.length;
  }
  function open() {
    if (!$("#cartDrawer")) {
      location.href = "carrito.html";
      return;
    }
    Sazu.openDialog($("#cartDrawer"));
    render();
  }
  function checkout() {
    const form = $("#checkoutForm");
    if (!form) return;
    const session = store.getSession(),
      customer = store.getCustomer();
    if (session?.role !== "customer" || !customer) {
      form.innerHTML =
        '<div class="empty"><h2>Elige una cuenta cliente demo</h2><p>Tu carrito se conserva mientras inicias sesión.</p><a class="btn btn-primary" href="login.html?next=checkout">Iniciar sesión</a></div>';
      return;
    }
    if (!getCart().length) {
      form.innerHTML =
        '<div class="empty"><h2>Tu carrito está vacío</h2><a class="btn btn-primary" href="productos.html">Ver productos</a></div>';
      return;
    }
    $("#checkoutName").value = customer.name;
    $("#checkoutEmail").value = session.email;
    form.onsubmit = (e) => e.preventDefault();
    let step = 1,
      completed = null;
    function show() {
      $$(".checkout-step").forEach((n) =>
        n.classList.toggle("active", Number(n.dataset.step) === step),
      );
      $$(".step").forEach((n, i) => n.classList.toggle("active", i < step));
      $("#prev").hidden = step === 1 || step === 5;
      $("#next").hidden = step === 5;
      $("#next").textContent =
        step === 4 ? "Realizar pedido de demostración" : "Continuar";
      const totals = completed || summary();
      if (!completed)
        $("#orderSummary").innerHTML =
          totals.lines
            .map(
              (l) =>
                `<p><strong>${escape(l.product.name)} × ${l.qty}</strong><br>${money(l.unitPrice)} c/u · ${escape(l.benefit)}<br>${money(l.subtotal)}</p>`,
            )
            .join("") +
          `<hr><p>Nivel ${escape(totals.level)}</p><div class="total">Subtotal <strong>${money(totals.subtotal)}</strong></div><div class="total">Descuentos <strong>${money(totals.discount)}</strong></div><div class="total grand">Total <strong>${money(totals.total)}</strong></div>`;
      $("#checkoutTotal").textContent = money(totals.total);
    }
    $("#prev").onclick = () => {
      step = Math.max(1, step - 1);
      show();
    };
    $("#next").onclick = () => {
      const totals = summary();
      if (!totals.valid) {
        Sazu.toast(totals.errors[0]);
        return;
      }
      if (step < 4) {
        const invalid = $$(
          `.checkout-step[data-step="${step}"] [required]`,
        ).find((f) => !f.checkValidity() || !f.value.trim());
        if (invalid) {
          invalid.reportValidity();
          invalid.focus();
          return;
        }
        step++;
        show();
        return;
      }
      try {
        completed = store.createOrder({
          city: $("#checkoutCity").value,
          payment: form.querySelector('[name="payment"]:checked').value,
        });
        $("#confirmedOrder").textContent =
          `${completed.id} · ${money(completed.total)}`;
        step = 5;
        render();
        show();
        Sazu.toast("Pedido registrado. No se realizó ningún cobro real.");
      } catch (e) {
        Sazu.toast(e.message);
      }
    };
    show();
  }
  document.addEventListener("DOMContentLoaded", () => {
    store.ensureDemoData();
    render();
    checkout();
    $$('[name="purchaseType"]').forEach((r) => {
      r.checked = r.value === store.getMode();
      r.onchange = () => {
        try {
          store.setMode(r.value);
          render();
        } catch (e) {
          Sazu.toast(e.message);
        }
      };
    });
    $("#clearCart")?.addEventListener("click", () => {
      if (confirm("¿Vaciar el carrito?")) {
        save([]);
        Sazu.toast("Carrito vaciado");
      }
    });
    $$("[data-close-drawer]").forEach(
      (b) => (b.onclick = () => Sazu.closeDialog(b.closest(".drawer"))),
    );
  });
  window.addEventListener("storage", () => render());
  window.Cart = {
    get: getCart,
    add,
    remove,
    update,
    render,
    open,
    total: () => summary().total,
  };
})();
