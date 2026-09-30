(function () {
  const $ = (s, c = document) => c.querySelector(s),
    $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const store = SazuStorage,
    pricing = SazuPricing,
    money = pricing.formatMoney,
    esc = Sazu.escape;
  const attempt = (fn) => {
    try {
      fn();
    } catch (e) {
      Sazu.toast(e.message);
    }
  };
  function tableLabels() {
    $$(".data").forEach((t) => {
      const headers = $$("th", t).map((h) => h.textContent);
      $$("tbody tr", t).forEach((row) =>
        $$("td", row).forEach((td, i) => (td.dataset.label = headers[i] || "")),
      );
    });
  }
  const search = () => ($("#adminSearch")?.value || "").trim().toLowerCase();
  function dashboard() {
    const products = store.getProducts(),
      clients = store.getClients(),
      orders = store.getOrders();
    const metrics = [
      ["Productos registrados", products.length],
      ["Clientes", clients.length],
      ["Pedidos", orders.length],
      [
        "Valor de pedidos no cancelados",
        money(
          orders
            .filter((o) => o.status !== "Cancelado")
            .reduce((s, o) => s + o.total, 0),
        ),
      ],
      [
        "Stock bajo",
        products.filter((p) => p.stock > 0 && p.stock <= 10).length,
      ],
      ["Agotados", products.filter((p) => !p.stock).length],
    ];
    $("#dashboard").innerHTML =
      '<div class="view-head"><div><span class="eyebrow">Modo demostración</span><h1>Resumen comercial</h1></div><span>' +
      new Date().toLocaleDateString("es-CO") +
      '</span></div><div class="stats">' +
      metrics
        .map(
          ([label, value]) =>
            '<article class="stat"><small>' +
            label +
            "</small><strong>" +
            value +
            "</strong></article>",
        )
        .join("") +
      '</div><div class="dashboard"><article class="panel"><h2>Pedidos por estado</h2>' +
      pricing.STATES.map(
        (s) =>
          '<div class="total"><span>' +
          s +
          "</span><strong>" +
          orders.filter((o) => o.status === s).length +
          "</strong></div>",
      ).join("") +
      '</article><article class="panel"><h2>Clientes por nivel</h2>' +
      Object.keys(pricing.LEVELS)
        .map(
          (l) =>
            '<div class="total"><span>' +
            l +
            "</span><strong>" +
            clients.filter((c) => c.level === l).length +
            "</strong></div>",
        )
        .join("") +
      "</article></div>";
  }
  function products() {
    $("#productsBody").innerHTML = store
      .getProducts()
      .filter((p) => (p.name + " " + p.code).toLowerCase().includes(search()))
      .map(
        (p) =>
          `<tr><td><strong>${esc(p.name)}</strong><br>${esc(p.code)}</td><td>${esc(p.category)}</td><td>${money(p.price)}</td><td>${money(p.wholesale)}</td><td>${p.stock}</td><td><span class="tag">${pricing.inventoryLabel(p.stock)}</span></td><td>${p.sales || 0} (dataset)</td><td><div class="row-actions"><button class="btn btn-outline" data-edit="${p.id}">Editar</button><button class="btn btn-danger" data-delete="${p.id}">Eliminar</button></div></td></tr>`,
      )
      .join("");
    $$("[data-edit]").forEach(
      (b) =>
        (b.onclick = () =>
          productForm(
            store.getProducts().find((p) => p.id === Number(b.dataset.edit)),
          )),
    );
    $$("[data-delete]").forEach(
      (b) =>
        (b.onclick = () => {
          if (
            confirm(
              "¿Eliminar este producto del catálogo demo? Los pedidos conservarán sus datos.",
            )
          )
            attempt(() => {
              store.setProducts(
                store
                  .getProducts()
                  .filter((p) => p.id !== Number(b.dataset.delete)),
              );
              refresh();
              Sazu.toast("Producto eliminado");
            });
        }),
    );
  }
  function clients() {
    const orders = store.getOrders();
    $("#clientsBody").innerHTML = store
      .getClients()
      .filter((c) => (c.name + " " + c.email).toLowerCase().includes(search()))
      .map((c) => {
        const own = orders.filter(
          (o) => o.clientId === c.id && o.status !== "Cancelado",
        );
        return `<tr><td>${esc(c.name)}</td><td>${esc(c.email)}</td><td>Dato ficticio</td><td>${esc(c.city)}</td><td>${esc(c.type)}</td><td>${own.length}</td><td>${money(own.reduce((s, o) => s + o.total, 0))}</td><td><select aria-label="Nivel de ${esc(c.name)}" data-level="${c.id}">${Object.keys(
          pricing.LEVELS,
        )
          .map(
            (l) => `<option ${l === c.level ? "selected" : ""}>${l}</option>`,
          )
          .join("")}</select></td><td>${esc(
          own
            .map((o) => o.date)
            .sort()
            .at(-1) || "Sin pedidos",
        )}</td><td>${esc(c.status)}</td><td><button class="btn btn-outline" data-client="${c.id}">Ver perfil</button></td></tr>`;
      })
      .join("");
    $$("[data-level]").forEach(
      (s) =>
        (s.onchange = () =>
          attempt(() => {
            const list = store.getClients();
            list.find((c) => c.id === Number(s.dataset.level)).level = s.value;
            store.setClients(list);
            refresh();
            Sazu.toast("Nivel actualizado; se aplicará en la próxima compra");
          })),
    );
    $$("[data-client]").forEach(
      (b) =>
        (b.onclick = () => {
          const c = store
            .getClients()
            .find((c) => c.id === Number(b.dataset.client));
          show(
            `<h2>${esc(c.name)}</h2><p>${esc(c.email)} · ${esc(c.city)}</p><p>Nivel ${esc(c.level)}: ${pricing.LEVELS[c.level]}% al detal; Mayorista utiliza precios por volumen. No se acumulan beneficios.</p><h3>Pedidos registrados</h3>${
              orders
                .filter((o) => o.clientId === c.id)
                .map(
                  (o) =>
                    `<p>${esc(o.id)} · ${esc(o.status)} · ${money(o.total)}</p>`,
                )
                .join("") || "<p>Sin pedidos</p>"
            }`,
          );
        }),
    );
  }
  function orders() {
    const filter = $("#orderFilter").value;
    $("#ordersBody").innerHTML =
      store
        .getOrders()
        .filter(
          (o) =>
            (!filter || o.status === filter) &&
            (o.id + " " + o.client).toLowerCase().includes(search()),
        )
        .map(
          (o) =>
            `<tr><td>${esc(o.id)}</td><td>${esc(o.client)}</td><td>${esc(o.date.slice(0, 10))}</td><td>${o.items.length ? o.items.map((i) => esc(i.name || store.getProducts().find((p) => p.id === i.id)?.name || "Producto retirado") + " × " + i.qty).join(", ") : esc(o.products)}</td><td>${o.items.length ? o.items.reduce((s, i) => s + i.qty, 0) : o.qty}</td><td>${esc(o.mode || o.type)}</td><td>${money(o.total)}</td><td>${esc(o.payment)} (simulado)</td><td><select aria-label="Estado de ${esc(o.id)}" data-status="${esc(o.id)}">${pricing.STATES.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td><td>${esc(o.city)}</td><td>Simulado</td><td><button class="btn btn-outline" data-order="${esc(o.id)}">Ver detalle</button></td></tr>`,
        )
        .join("") ||
      '<tr><td colspan="12">No hay pedidos con estos filtros.</td></tr>';
    $$("[data-status]").forEach(
      (s) =>
        (s.onchange = () => {
          attempt(() => {
            store.changeStatus(s.dataset.status, s.value);
            Sazu.toast("Estado actualizado");
          });
          refresh();
        }),
    );
    $$("[data-order]").forEach(
      (b) =>
        (b.onclick = () => {
          const o = store.getOrders().find((o) => o.id === b.dataset.order);
          if (!o) {
            Sazu.toast("Pedido no encontrado");
            return;
          }
          show(
            `<h2>Pedido ${esc(o.id)}</h2><p>${esc(o.client)} · ${esc(o.city)}</p>${Sazu.orderMarkup(o)}<button class="btn btn-primary" id="printOrder">Imprimir pedido demo</button>`,
          );
          $("#printOrder").onclick = () => PrintDocs.order(o.id);
        }),
    );
  }
  function show(html) {
    $("#adminModalContent").innerHTML = html;
    Sazu.openDialog($("#adminModal"));
  }
  function productForm(p = {}) {
    const fields = [
      ["name", "Nombre", "text", p.name || ""],
      ["code", "Código", "text", p.code || ""],
      ["price", "Precio detal", "number", p.price || 0],
      ["wholesale", "Precio mayorista", "number", p.wholesale || 0],
      ["min", "Mínimo mayorista", "number", p.min || 6],
      ["stock", "Inventario", "number", p.stock || 0],
      ["offer", "Oferta %", "number", p.offer || 0],
      [
        "image",
        "Imagen (URL https o ruta local)",
        "text",
        p.image || "assets/images/product-fallback.svg",
      ],
    ];
    show(
      `<h2>${p.id ? "Editar" : "Crear"} producto</h2><form id="productForm" class="grid2">${fields.map(([key, label, type, value]) => `<div class="field"><label for="product-${key}">${label}</label><input id="product-${key}" name="${key}" type="${type}" value="${esc(value)}" required ${type === "number" ? 'min="0" step="1"' : ""}></div>`).join("")}<div class="field"><label for="product-category">Categoría</label><select id="product-category" name="category">${window.CATEGORIES.map((c) => `<option ${c === p.category ? "selected" : ""}>${esc(c)}</option>`).join("")}</select></div><div class="field"><label for="product-desc">Descripción</label><textarea id="product-desc" name="desc" required>${esc(p.desc || "")}</textarea></div><button class="btn btn-primary">Guardar producto</button></form>`,
    );
    $("#productForm").onsubmit = (e) => {
      e.preventDefault();
      attempt(() => {
        const data = Object.fromEntries(new FormData(e.target));
        for (const key of ["price", "wholesale", "min", "stock", "offer"])
          data[key] = Number(data[key]);
        const next = {
          rating: 0,
          sales: 0,
          variants: [],
          ...p,
          ...data,
          id: p.id || Date.now(),
        };
        if (!store.productValid(next) || !next.name.trim() || !next.code.trim())
          throw new Error(
            "Revisa precios, cantidades enteras, mínimo mayorista y oferta entre 0 y 100.",
          );
        if (!/^(https:\/\/|assets\/)/.test(next.image))
          throw new Error(
            "La imagen debe usar https o una ruta dentro de assets/.",
          );
        const list = store.getProducts(),
          index = list.findIndex((x) => x.id === p.id);
        if (list.some((x) => x.code === next.code && x.id !== next.id))
          throw new Error("El código ya existe.");
        if (index >= 0) list[index] = next;
        else list.push(next);
        store.setProducts(list);
        Sazu.closeDialog($("#adminModal"));
        refresh();
        Sazu.toast("Producto e inventario guardados");
      });
    };
  }
  function rules() {
    $("#settings").innerHTML =
      '<h1>Reglas y demostración</h1><article class="panel"><h2>Niveles de clientes</h2><p>Beneficios demo explícitos. Asignación manual desde Clientes; no existe promoción automática por compras.</p>' +
      Object.entries(pricing.LEVELS)
        .map(
          ([level, percent]) =>
            "<p><strong>" +
            level +
            "</strong>: " +
            (level === "Mayorista"
              ? "acceso automático al cálculo mayorista"
              : percent + "% al detal") +
            "</p>",
        )
        .join("") +
      "<h2>Descuentos por volumen</h2>" +
      pricing.VOLUME.map(
        (t) =>
          "<p>Desde " +
          t.min +
          " unidades por referencia: " +
          t.percent +
          "%</p>",
      ).join("") +
      '<p>Al detal se elige el mejor precio entre oferta y nivel. En modo mayorista se elige el menor precio entre el tramo y el precio mayorista por referencia, respetando su mínimo. Sin acumulación. Envío demo sin costo.</p><button class="btn btn-danger" id="resetDemoData">Restablecer datos demo</button><p>Restaurará productos, clientes, inventario y pedidos iniciales y cerrará la sesión.</p></article>';
    $("#resetDemoData").onclick = () => {
      if (
        confirm(
          "¿Restablecer datos demo? Se perderán los cambios y pedidos locales de SAZU.",
        )
      )
        attempt(() => {
          store.resetDemoData();
          location.href = "login.html?reset=1";
        });
    };
    $("#shipping").innerHTML =
      "<h1>Solicitudes mayoristas</h1><p>Solicitudes locales de demostración; no se envían mensajes ni cotizaciones reales.</p>" +
      store
        .getWholesaleRequests()
        .map(
          (r) =>
            '<article class="panel"><h2>' +
            esc(r.id) +
            "</h2><p>" +
            esc(r.createdAt) +
            "</p>" +
            (r.fields || []).map((f) => "<p>" + esc(f) + "</p>").join("") +
            "<p>" +
            esc(r.status) +
            "</p></article>",
        )
        .join("");
  }
  function refresh() {
    dashboard();
    products();
    clients();
    orders();
    rules();
    tableLabels();
  }
  document.addEventListener("DOMContentLoaded", () => {
    if (store.getSession()?.role !== "admin") {
      document.querySelector(".admin-shell").innerHTML =
        '<main class="section container"><h1>Administración demo</h1><p>Selecciona el rol administrador para continuar. El acceso es una simulación local, no autenticación segura.</p><a class="btn btn-primary" href="login.html">Elegir cuenta demo</a></main>';
      return;
    }
    refresh();
    $$("[data-view]").forEach(
      (b) =>
        (b.onclick = () => {
          $$("[data-view]").forEach((n) =>
            n.classList.toggle("active", n === b),
          );
          $$(".view").forEach((n) =>
            n.classList.toggle("active", n.id === b.dataset.view),
          );
          $("#sidebar").classList.remove("open");
        }),
    );
    $("#adminMenu").onclick = () => $("#sidebar").classList.toggle("open");
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        $("#sidebar").classList.remove("open");
      }
    });
    $("#addProduct").onclick = () => productForm();
    $("#orderFilter").onchange = () => {
      orders();
      tableLabels();
    };
    $("#adminSearch").oninput = () => {
      products();
      clients();
      orders();
      tableLabels();
    };
    $$("[data-close-admin]").forEach(
      (b) => (b.onclick = () => Sazu.closeDialog(b.closest(".modal"))),
    );
  });
  window.addEventListener("storage", () => {
    if (store.getSession()?.role === "admin") refresh();
    else location.reload();
  });
})();
