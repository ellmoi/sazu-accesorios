(function () {
  const $ = (s, c = document) => c.querySelector(s),
    $$ = (s, c = document) => [...c.querySelectorAll(s)],
    states = [
      "Pendiente",
      "Confirmado",
      "Preparando",
      "Empacado",
      "Enviado",
      "Entregado",
      "Cancelado",
    ];
  function products() {
    $("#productsBody").innerHTML = PRODUCTS.map(
      (p) =>
        `<tr><td><strong>${p.name}</strong><br><small>${p.code}</small></td><td>${p.category}</td><td>${money(p.price)}</td><td>${money(p.wholesale)}</td><td>${p.stock}</td><td><span class="tag ${inventory(p.stock).toLowerCase().replace(" ", "-")}">${inventory(p.stock)}</span></td><td>${p.sales}</td><td><div class="row-actions"><button class="btn btn-outline btn-small" data-edit="${p.id}">Editar</button><button class="btn btn-outline btn-small" data-dup="${p.id}">Duplicar</button><button class="btn btn-danger btn-small" data-del="${p.id}">Eliminar</button></div></td></tr>`,
    ).join("");
    $$("[data-edit]").forEach(
      (b) =>
        (b.onclick = () =>
          productForm(PRODUCTS.find((p) => p.id === +b.dataset.edit))),
    );
    $$("[data-dup]").forEach(
      (b) => (b.onclick = () => Sazu.toast("Producto duplicado")),
    );
    $$("[data-del]").forEach(
      (b) =>
        (b.onclick = () => {
          b.closest("tr").remove();
          Sazu.toast("Producto eliminado de la vista");
        }),
    );
  }
  function clients() {
    $("#clientsBody").innerHTML = CLIENTS.map(
      (c) =>
        `<tr><td><strong>${c.name}</strong></td><td>${c.email}</td><td>${c.phone}</td><td>${c.city}</td><td>${c.type}</td><td>${c.purchases}</td><td>${money(c.total)}</td><td><span class="tag ${c.level.toLowerCase()}">${c.level}</span></td><td>${c.last}</td><td>${c.status}</td><td><button class="btn btn-outline btn-small" data-demo>Ver perfil</button></td></tr>`,
    ).join("");
  }
  function orders() {
    const f = $("#orderFilter").value;
    $("#ordersBody").innerHTML = ORDERS.filter((o) => !f || o.status === f)
      .map(
        (o) =>
          `<tr><td><strong>${o.id}</strong></td><td>${o.client}</td><td>${o.date}</td><td>${o.products}</td><td>${o.qty}</td><td>${o.type}</td><td>${money(o.total)}</td><td>${o.payment}<br><small>${o.pay}</small></td><td><select data-state="${o.id}">${states.map((s) => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td><td>${o.city}</td><td>${o.carrier}<br><small>${o.tracking}</small></td><td><div class="row-actions"><button class="btn btn-outline btn-small" data-order="${o.id}">Ver</button><button class="btn btn-outline btn-small" onclick="PrintDocs.order('${o.id}')">Orden</button><button class="btn btn-outline btn-small" onclick="PrintDocs.shipping('${o.id}')">Envío</button></div></td></tr>`,
      )
      .join("");
    $$("[data-state]").forEach(
      (s) =>
        (s.onchange = () => {
          ORDERS.find((o) => o.id === s.dataset.state).status = s.value;
          Sazu.toast("Estado actualizado");
        }),
    );
    $$("[data-order]").forEach(
      (b) => (b.onclick = () => orderDetail(b.dataset.order)),
    );
  }
  function productForm(p = {}) {
    open(
      `<h2>${p.id ? "Editar" : "Agregar"} producto</h2><form id="productForm" class="grid2"><div class="field"><label>Nombre</label><input required value="${p.name || ""}"></div><div class="field"><label>Código</label><input required value="${p.code || ""}"></div><div class="field"><label>Categoría</label><select>${CATEGORIES.map((c) => `<option ${p.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div><div class="field"><label>Precio detal</label><input type="number" value="${p.price || ""}"></div><div class="field"><label>Precio mayor</label><input type="number" value="${p.wholesale || ""}"></div><div class="field"><label>Mínimo mayorista</label><input type="number" value="${p.min || 6}"></div><div class="field"><label>Inventario</label><input type="number" value="${p.stock || 0}"></div><div class="field"><label>Estado</label><select><option>Activo</option><option>Inactivo</option></select></div><div class="field"><label>Imagen</label><input type="file" accept="image/*"></div><label class="checks"><input type="checkbox"> Producto destacado</label><div class="field" style="grid-column:1/-1"><label>Descripción</label><textarea>${p.desc || ""}</textarea></div><button class="btn btn-primary">Guardar producto</button></form>`,
    );
    $("#productForm").onsubmit = (e) => {
      e.preventDefault();
      $("#adminModal").classList.remove("open");
      Sazu.toast("Producto guardado");
    };
  }
  function orderDetail(id) {
    const o = ORDERS.find((x) => x.id === id);
    open(
      `<div class="order-detail"><section><span class="eyebrow">Pedido ${o.id}</span><h2>${o.client}</h2><p><strong>Fecha:</strong> ${o.date}<br><strong>Ciudad:</strong> ${o.city}<br><strong>Pago:</strong> ${o.payment} · ${o.pay}<br><strong>Total:</strong> ${money(o.total)}</p><div class="card"><strong>${o.products}</strong><br>${o.qty} unidades</div><h3>Envío</h3><p>${o.carrier} · ${o.tracking}<br>${o.city}, Colombia</p></section><section><h3>Historial</h3><div class="timeline"><div><strong>Pedido creado</strong><br><small>${o.date}</small></div><div><strong>Pago ${o.pay.toLowerCase()}</strong><br><small>${o.payment}</small></div><div><strong>${o.status}</strong><br><small>Última actualización</small></div></div><div class="field"><label>Notas internas</label><textarea>Verificar empaque y datos.</textarea></div><div class="hero-actions"><button class="btn btn-primary" onclick="PrintDocs.order('${o.id}')">Imprimir orden</button><button class="btn btn-outline" onclick="PrintDocs.shipping('${o.id}')">Imprimir envío</button><button class="btn btn-outline" onclick="Sazu.toast('Contacto simulado')">Contactar</button></div></section></div>`,
    );
  }
  function open(html) {
    $("#adminModalContent").innerHTML = html;
    $("#adminModal").classList.add("open");
  }
  document.addEventListener("DOMContentLoaded", () => {
    products();
    clients();
    orders();
    $$("[data-view]").forEach(
      (b) =>
        (b.onclick = () => {
          $$("[data-view]").forEach((x) =>
            x.classList.toggle("active", x === b),
          );
          $$(".view").forEach((v) =>
            v.classList.toggle("active", v.id === b.dataset.view),
          );
          $("#sidebar").classList.remove("open");
        }),
    );
    $("#adminMenu").onclick = () => $("#sidebar").classList.toggle("open");
    $("#addProduct").onclick = () => productForm();
    $("#orderFilter").onchange = orders;
    $$("[data-close-admin]").forEach(
      (b) => (b.onclick = () => b.closest(".modal").classList.remove("open")),
    );
    $$("[data-demo]").forEach(
      (b) => (b.onclick = () => Sazu.toast("Función simulada")),
    );
    $("#copyData")?.addEventListener("click", () => {
      navigator.clipboard?.writeText("Datos de envío Sazu");
      Sazu.toast("Datos copiados");
    });
  });
})();
