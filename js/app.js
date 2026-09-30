(function () {
  const $ = (s, c = document) => c.querySelector(s),
    $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const getProducts = () => window.SazuStorage.getProducts();
  const getFavorites = () => window.SazuStorage?.getFavorites?.() || [];
  const setFavorites = (items) =>
    window.SazuStorage?.setFavorites?.(items) || false;
  const previewPrice = (product, qty = 1) =>
    SazuPricing.getUnitPrice(
      product,
      qty,
      SazuStorage.getMode(),
      SazuStorage.getCustomer()?.level || "Nuevo",
    );

  function money(value) {
    return window.SazuPricing?.formatMoney
      ? window.SazuPricing.formatMoney(value)
      : new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }).format(Number(value || 0));
  }

  function inventoryLabel(stock) {
    return window.SazuPricing?.inventoryLabel
      ? window.SazuPricing.inventoryLabel(stock)
      : stock <= 0
        ? "Agotado"
        : stock <= 10
          ? "Pocas unidades"
          : "Disponible";
  }

  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  let previousFocus;
  function openDialog(node) {
    previousFocus = document.activeElement;
    node.classList.add("open");
    document.body.classList.add("lock");
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-modal", "true");
    node.setAttribute("aria-label", "Detalle");
    node.querySelector("button,input,a")?.focus();
  }
  function closeDialog(node) {
    node?.classList.remove("open");
    document.body.classList.remove("lock");
    previousFocus?.focus();
  }
  window.Sazu = {
    escape,
    openDialog,
    closeDialog,
    $,
    $$,
    toast(msg) {
      let t = $("#toast");
      if (!t) {
        t = document.createElement("div");
        t.id = "toast";
        t.className = "toast";
        t.setAttribute("role", "status");
        document.body.append(t);
      }
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(window._toast);
      window._toast = setTimeout(() => t.classList.remove("show"), 2400);
    },
  };

  function setupHeaderFooter() {
    const h = $("#sharedHeader");
    if (h) {
      h.innerHTML = `
        <div class="topbar">Envíos nacionales · Compra al detal o al por mayor · Demostración sin pagos reales</div>
        <header class="header">
          <div class="container nav">
            <a class="brand" href="index.html">SAZU <span>ACCESORIOS</span></a>
            <nav class="links">
              <a href="index.html">Inicio</a>
              <a href="categorias.html">Categorías</a>
              <a href="productos.html">Productos</a>
              <a href="ofertas.html">Ofertas</a>
              <a href="mayoristas.html">Mayoristas</a>
              <a href="perfil.html">Mis pedidos</a>
            </nav>
            <div class="actions">
              <a class="icon desktop-only" href="login.html" aria-label="Iniciar sesión">♙</a>
              <a class="icon desktop-only" href="perfil.html" aria-label="Favoritos">♡</a>
              <button class="icon" data-open-cart aria-label="Carrito">🛒<span class="count" data-cart-count>0</span></button>
              <button class="icon hamb" id="hamb" aria-label="Menú">☰</button>
            </div>
          </div>
          <nav class="mobile" id="mobile">
            <a href="index.html">Inicio</a>
            <a href="categorias.html">Categorías</a>
            <a href="productos.html">Productos</a>
            <a href="ofertas.html">Ofertas</a>
            <a href="mayoristas.html">Mayoristas</a>
            <a href="perfil.html">Mis pedidos</a>
            <a href="login.html">Iniciar sesión</a>
            <a href="registro.html">Registrarse</a>
          </nav>
        </header>
      `;
    }

    const f = $("#sharedFooter");
    if (f) {
      f.innerHTML = `
        <footer class="footer">
          <div class="container footer-grid">
            <div>
              <a class="brand" href="index.html">SAZU <span>ACCESORIOS</span></a>
              <p>Variedad para cada estilo. Compra al detal o impulsa tu negocio con precios mayoristas.</p>
            </div>
            <div>
              <h3>Comprar</h3>
              <a href="categorias.html">Categorías</a>
              <a href="productos.html">Productos</a>
              <a href="ofertas.html">Ofertas</a>
              <a href="mayoristas.html">Mayoristas</a>
            </div>
            <div>
              <h3>Mi cuenta</h3>
              <a href="perfil.html">Mis pedidos</a>
              <a href="carrito.html">Carrito</a>
              <a href="login.html">Ingresar</a>
            </div>
            <div>
              <h3>Administración</h3>
              <a href="admin.html">Panel administrativo</a>
              <a href="mayoristas.html">Contacto</a>
            </div>
          </div>
          <div class="container footer-bottom">
            <span>© 2026 Sazu Accesorios</span>
            <span>Modo demostración · Los datos se almacenan localmente en este navegador.</span>
          </div>
        </footer>
      `;
    }

    let floating = document.getElementById("floatingCart");
    if (!floating) {
      floating = document.createElement("button");
      floating.id = "floatingCart";
      floating.type = "button";
      floating.className = "floating-cart";
      floating.setAttribute("aria-label", "Carrito");
      floating.innerHTML =
        '<span class="floating-cart-icon">🛒</span><span class="count" data-cart-float-count>0</span>';
      floating.addEventListener("click", () => {
        if (window.Cart) {
          window.Cart.open();
        } else {
          location.href = "carrito.html";
        }
      });
      document.body.appendChild(floating);
    }
  }

  function updateCartBadge() {
    const cart = window.SazuStorage?.getCart?.() || [];
    const count = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);

    $$("[data-cart-count]").forEach((node) => {
      node.textContent = count;
    });

    const floating = document.getElementById("floatingCart");
    if (floating) {
      const bubble = floating.querySelector("[data-cart-float-count]");
      if (bubble) bubble.textContent = count;
      floating.style.display = count > 0 ? "flex" : "none";
      floating.setAttribute(
        "aria-label",
        count > 0 ? `Carrito con ${count} productos` : "Carrito vacío",
      );
    }
  }

  function renderProductCard(product) {
    const label = inventoryLabel(product.stock);
    const favorite = getFavorites().includes(product.id);
    return `
      <article class="product">
        ${product.offer ? `<span class="offer">-${product.offer}%</span>` : ""}
        <button class="icon fav ${favorite ? "active" : ""}" data-fav="${product.id}" aria-label="Producto favorito">${favorite ? "♥" : "♡"}</button>
        <div class="product-img"><img src="${escape(product.image)}" alt="${escape(product.name)}" loading="lazy" /></div>
        <div class="product-body">
          <span class="cat">${escape(product.category)}</span>
          <h3>${escape(product.name)}</h3>
          <span class="rating">★ ${product.rating} · ${product.sales} ventas</span>
          <span class="price">${money(previewPrice(product).unitPrice)}</span>
          <span class="wholesale-price">Mayorista ${money(product.wholesale)} desde ${product.min} uds.</span>
          <span class="stock ${label.toLowerCase().replace(/\s+/g, "-")}">${label} · ${product.stock} disponibles</span>
          <div class="product-actions">
            <button class="btn btn-primary btn-small" data-add="${product.id}" ${product.stock ? "" : "disabled"}>Agregar</button>
            <button class="btn btn-outline btn-small" data-detail="${product.id}">Ver</button>
          </div>
        </div>
      </article>
    `;
  }

  function bindProductCards() {
    $$("[data-add]").forEach((button) => {
      button.onclick = () => {
        if (window.Cart) {
          window.Cart.add(Number(button.dataset.add));
        }
      };
    });

    $$("[data-detail]").forEach((button) => {
      button.onclick = () => openDetail(Number(button.dataset.detail));
    });

    $$("[data-fav]").forEach((button) => {
      button.onclick = () => {
        const id = Number(button.dataset.fav);
        const favorites = getFavorites();
        const next = favorites.includes(id)
          ? favorites.filter((item) => item !== id)
          : [...favorites, id];
        try {
          setFavorites(next);
        } catch (e) {
          Sazu.toast(e.message);
          return;
        }
        button.classList.toggle("active", next.includes(id));
        button.textContent = next.includes(id) ? "♥" : "♡";
        Sazu.toast(
          next.includes(id) ? "Agregado a favoritos" : "Eliminado de favoritos",
        );
      };
    });
  }

  function renderCatalog() {
    const grid = $("#productGrid");
    if (!grid) return;

    const products = getProducts();
    const search = ($("#search")?.value || "").toLowerCase();
    const category = $("#category")?.value || "";
    const availability = $("#availability")?.value || "";
    const minPrice = Number($("#minPrice")?.value || 0);
    const maxPrice = Number($("#maxPrice")?.value || Number.MAX_SAFE_INTEGER);
    const sort = $("#sort")?.value || "popular";

    let list = products.filter((product) => {
      const matchesSearch =
        !search ||
        `${escape(product.name)} ${escape(product.category)} ${escape(product.desc)}`
          .toLowerCase()
          .includes(search);
      const matchesCategory = !category || product.category === category;
      const matchesAvailability =
        !availability || inventoryLabel(product.stock) === availability;
      const actualPrice = previewPrice(product).unitPrice;
      const matchesPrice = actualPrice >= minPrice && actualPrice <= maxPrice;
      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability &&
        matchesPrice &&
        (!grid.hasAttribute("data-offers-only") || product.offer > 0)
      );
    });

    list.sort((left, right) => {
      if (sort === "low")
        return previewPrice(left).unitPrice - previewPrice(right).unitPrice;
      if (sort === "high")
        return previewPrice(right).unitPrice - previewPrice(left).unitPrice;
      if (sort === "new") return Number(right.new) - Number(left.new);
      return right.sales - left.sales;
    });

    grid.innerHTML = list.length
      ? list.map(renderProductCard).join("")
      : '<div class="empty"><h3>No hay resultados</h3><p>Prueba con otros filtros o limpia la búsqueda.</p></div>';

    const countNode = $("#productCount");
    if (countNode) countNode.textContent = `${list.length} productos`;
    bindProductCards();
  }

  function openDetail(id) {
    const product = getProducts().find((item) => item.id === id);
    if (!product) {
      const container = $("#productDetail");
      if (container) {
        container.innerHTML =
          '<div class="empty"><h3>Producto no encontrado</h3><p>El producto solicitado ya no está disponible.</p><a class="btn btn-primary" href="productos.html">Volver al catálogo</a></div>';
      }
      return;
    }

    location.href = `producto.html?id=${id}`;
  }

  function renderProductPage() {
    const container = $("#productDetail");
    if (!container) return;

    const id = Number(new URLSearchParams(location.search).get("id"));
    const product = getProducts().find((item) => item.id === id);
    if (!product) {
      container.innerHTML =
        '<div class="empty"><h3>Página no disponible</h3><p>El producto solicitado no existe.</p><a class="btn btn-primary" href="productos.html">Volver al catálogo</a></div>';
      return;
    }

    const favorites = getFavorites();
    const isFavorite = favorites.includes(product.id);
    const related = getProducts()
      .filter(
        (item) => item.category === product.category && item.id !== product.id,
      )
      .slice(0, 3);

    container.innerHTML = `
      <div class="detail">
        <div class="detail-img">
          <img src="${escape(product.image)}" alt="${escape(product.name)}" loading="eager" />
        </div>
        <div>
          <span class="eyebrow">${escape(product.category)}</span>
          <h1>${escape(product.name)}</h1>
          <div class="rating">★ ${product.rating} · ${product.sales} ventas</div>
          <p>${escape(product.desc)}</p>
          <div class="price" id="detailPrice">${money(previewPrice(product).unitPrice)}</div>
          <p id="detailBenefit">${escape(previewPrice(product).benefit)}</p>
          <p class="wholesale-price">Precio mayorista ${money(product.wholesale)} · mínimo ${product.min} unidades</p>
          <p class="stock ${inventoryLabel(product.stock).toLowerCase().replace(/\s+/g, "-")}">${inventoryLabel(product.stock)} · ${product.stock} unidades</p>
          <p>Presentaciones de referencia: ${(product.variants || []).map(escape).join(", ")}. Inventario conjunto.</p>
          <div class="field">
            <label>Cantidad</label>
            <div class="qty">
              <button type="button" data-qty-minus>−</button>
              <input type="number" min="1" max="${product.stock}" value="1" data-detail-qty />
              <button type="button" data-qty-plus>+</button>
            </div>
          </div>
          <div class="hero-actions">
            <button class="btn btn-primary" data-add-to-cart ${product.stock ? "" : "disabled"}>Agregar al carrito</button>
            <button class="btn btn-dark" data-buy-now ${product.stock ? "" : "disabled"}>Comprar ahora</button>
            <button class="btn btn-outline" data-fav-toggle>${isFavorite ? "♥" : "♡"} Favoritos</button>
          </div>
          <small>Envío nacional · Compra demostrativa</small>
        </div>
      </div>
      <section class="section soft" style="margin-top: 55px">
        <div class="container">
          <div class="section-title">
            <div>
              <span class="eyebrow">También te puede gustar</span>
              <h2>Productos relacionados</h2>
            </div>
          </div>
          <div class="products">
            ${related.length ? related.map(renderProductCard).join("") : '<div class="empty"><h3>Más productos próximamente</h3></div>'}
          </div>
        </div>
      </section>
    `;

    const qtyInput = container.querySelector("[data-detail-qty]");
    const updatePrice = () => {
      const price = previewPrice(product, Number(qtyInput.value));
      $("#detailPrice").textContent = money(price.unitPrice) + " c/u";
      $("#detailBenefit").textContent =
        price.benefit +
        " · Nivel " +
        (SazuStorage.getCustomer()?.level || "Nuevo");
    };
    qtyInput.oninput = updatePrice;
    const updateQty = (step) => {
      const current = Number(qtyInput.value || 1);
      qtyInput.value = Math.max(1, Math.min(product.stock, current + step));
      updatePrice();
    };

    container.querySelector("[data-qty-minus]").onclick = () => updateQty(-1);
    container.querySelector("[data-qty-plus]").onclick = () => updateQty(1);
    container.querySelector("[data-add-to-cart]").onclick = () => {
      if (window.Cart) window.Cart.add(product.id, Number(qtyInput.value));
    };
    container.querySelector("[data-buy-now]").onclick = () => {
      if (window.Cart) {
        if (window.Cart.add(product.id, Number(qtyInput.value)))
          location.href = "checkout.html";
      }
    };
    container.querySelector("[data-fav-toggle]").onclick = () => {
      const list = getFavorites();
      const next = list.includes(product.id)
        ? list.filter((item) => item !== product.id)
        : [...list, product.id];
      try {
        setFavorites(next);
      } catch (e) {
        Sazu.toast(e.message);
        return;
      }
      Sazu.toast(
        next.includes(product.id)
          ? "Agregado a favoritos"
          : "Eliminado de favoritos",
      );
      renderProductPage();
    };

    bindProductCards();
  }

  function renderProfilePage() {
    const root = $("#profileSummary");
    if (!root) return;
    const session = window.SazuStorage?.getSession?.() || null;
    if (!session) {
      root.innerHTML =
        '<div class="empty"><h2>Inicia sesión para ver tus pedidos</h2><a class="btn btn-primary" href="login.html">Entrar como cliente demo</a></div>';
      return;
    }
    const customer = SazuStorage.getCustomer();
    const orders = SazuStorage.getOrders().filter(
      (o) => o.clientId === customer?.id,
    );
    const favorites = getFavorites();
    const userName = session?.name || "Cliente Demo";
    const recent = orders;

    root.innerHTML = `
      <article class="card">
        <div class="section-title">
          <div>
            <span class="eyebrow">Datos personales</span>
            <h2>Mi perfil</h2>
          </div>
          <a class="btn btn-outline btn-small" href="login.html">Cambiar cuenta demo</a>
        </div>
        <div class="grid2">
          <p><strong>Nombre</strong><br>${escape(userName)}</p>
          <p><strong>Correo</strong><br>${escape(session?.email || "cliente@demo.co")}</p>
          <p><strong>Cliente comercial</strong><br>${escape(customer?.name || "Administrador")}</p>
          <p><strong>Nivel</strong><br>${escape(customer?.level || "Administración")} · ${SazuPricing.LEVELS[customer?.level] || 0}% al detal; se aplica el mejor beneficio.</p>
        </div>
      </article>
      <article id="history" class="card" style="margin-top: 17px">
        <span class="eyebrow">Historial</span>
        <h2>Pedidos recientes</h2>
        ${
          recent.length
            ? recent
                .map(
                  (order) => `
          <div class="order-card">
            <div class="total">
              <strong>${escape(order.id)}</strong><span class="tag">${escape(order.status)}</span>
            </div>
            <p>${order.items.length ? order.items.map((item) => `${escape(item.name || getProducts().find((p) => p.id === item.id)?.name || "Producto retirado")} × ${item.qty}`).join(", ") : escape(order.products)}</p>
            <small>${escape(order.date)} · ${money(order.total)}</small><details><summary>Ver detalle y seguimiento</summary>${Sazu.orderMarkup(order)}</details>
          </div>
        `,
                )
                .join("")
            : "<p>No tienes pedidos aún. Crea uno desde el carrito.</p>"
        }
      </article>
      <article id="favorites" class="card" style="margin-top: 17px">
        <h2>Favoritos</h2>
        ${
          favorites.length
            ? getProducts()
                .filter((product) => favorites.includes(product.id))
                .map((product) => `<p>• ${escape(product.name)}</p>`)
                .join("")
            : "<p>Tus productos guardados aparecerán aquí.</p>"
        }
        <a class="btn btn-primary" href="productos.html">Explorar productos</a>
      </article>
    `;
  }

  function bindForms() {
    const wholesaleForm = $("#wholesaleForm");
    wholesaleForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const requests = window.SazuStorage?.getWholesaleRequests?.() || [];
      const payload = {
        id: `WH-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: "Pendiente",
        fields: [...event.target.querySelectorAll("input,textarea")].map((f) =>
          f.value.trim(),
        ),
      };
      requests.push(payload);
      try {
        SazuStorage.setWholesaleRequests(requests);
      } catch (e) {
        Sazu.toast(e.message);
        return;
      }
      $("#wholesaleMessage").textContent =
        "Solicitud guardada localmente. Puedes verla en administración; no se envió a una empresa.";
      event.target.reset();
    });

    const loginForm = $("#loginForm");
    loginForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const email = $("#loginEmail").value.trim().toLowerCase();
      const password = $("#loginPassword").value.trim();
      const users = window.SazuStorage?.getDemoUsers?.() || [];
      const user = users.find(
        (entry) => entry.email === email && entry.password === password,
      );

      if (!user) {
        Sazu.toast(
          "Credenciales demo no válidas. Usa cliente@demo.co / demo123 o admin@demo.co / admin123",
        );
        return;
      }

      try {
        SazuStorage.setSession({ email: user.email });
      } catch (e) {
        Sazu.toast(e.message);
        return;
      }
      Sazu.toast("Sesión iniciada en modo demostración");
      setTimeout(() => {
        location.href =
          user.role === "admin"
            ? "admin.html"
            : new URLSearchParams(location.search).get("next") === "checkout"
              ? "checkout.html"
              : "perfil.html";
      }, 400);
    });

    const registerForm = $("#registerForm");
    registerForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = [...event.target.querySelectorAll("input, select")].map(
        (field) => field.value.trim(),
      );
      const valid = values.every(Boolean);
      if (!valid || $("#password")?.value !== $("#confirm")?.value) {
        Sazu.toast("Revisa los datos del formulario");
        return;
      }
      try {
        SazuStorage.register({
          name: $("#firstName").value.trim(),
          email: event.target
            .querySelector("input[type='email']")
            .value.trim()
            .toLowerCase(),
          password: $("#password").value,
        });
      } catch (e) {
        Sazu.toast(e.message);
        return;
      }
      Sazu.toast("Registro completado en modo demo");
      setTimeout(() => (location.href = "perfil.html"), 500);
    });

    $("#logout")?.addEventListener("click", () => {
      try {
        SazuStorage.setSession(null);
      } catch (e) {
        Sazu.toast(e.message);
        return;
      }
      window.location.href = "index.html";
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (window.SazuStorage) window.SazuStorage.ensureDemoData();

    setupHeaderFooter();
    if (SazuStorage.getWarning()) {
      const note = document.createElement("p");
      note.className = "demo-note";
      note.textContent = SazuStorage.getWarning();
      document.body.prepend(note);
    }
    $$("[data-login-demo]").forEach(
      (b) =>
        (b.onclick = () => {
          const user = SazuStorage.DEFAULT_USERS.find(
            (u) => u.role === b.dataset.loginDemo,
          );
          $("#loginEmail").value = user.email;
          $("#loginPassword").value = user.password;
          $("#loginForm").requestSubmit();
        }),
    );
    if ($("#volumeRules"))
      $("#volumeRules").innerHTML =
        "<tr><th>Cantidad por referencia</th><th>Descuento sobre lista</th></tr><tr><td>1–5</td><td>Precio por referencia</td></tr>" +
        SazuPricing.VOLUME.map(
          (t, i) =>
            "<tr><td>" +
            t.min +
            (i === 2 ? " o más" : "–" + (SazuPricing.VOLUME[i + 1].min - 1)) +
            "</td><td>" +
            t.percent +
            "%</td></tr>",
        ).join("");
    updateCartBadge();
    if (new URLSearchParams(location.search).get("reset") === "1")
      Sazu.toast("Datos de demostración restaurados");
    bindForms();

    const currentPage = location.pathname.split("/").pop() || "index.html";
    if (currentPage === "index.html") {
      const hashMap = {
        "#categorias": "categorias.html",
        "#productos": "productos.html",
        "#mayoristas": "mayoristas.html",
      };
      const destination = new URLSearchParams(location.search).has("category")
        ? "productos.html"
        : hashMap[location.hash];
      if (destination) {
        location.replace(destination + location.search);
        return;
      }
    }

    $$("#sharedHeader nav a").forEach((link) => {
      if (link.getAttribute("href") === currentPage) {
        link.setAttribute("aria-current", "page");
      }
    });

    $("#hamb")?.addEventListener("click", () => {
      const open = $("#mobile").classList.toggle("open");
      $("#hamb").setAttribute("aria-expanded", open);
    });
    $$("[data-open-cart]").forEach((button) => {
      button.onclick = () => {
        if (window.Cart) {
          window.Cart.open();
        } else {
          location.href = "carrito.html";
        }
      };
    });

    $$("[data-category]").forEach((button) => {
      button.onclick = () => {
        const category = button.dataset.category;
        if (!category) return;
        location.href = `productos.html?category=${encodeURIComponent(category)}`;
      };
    });

    $$("[data-close]").forEach((button) => {
      button.onclick = () => {
        const closest = button.closest(".modal,.drawer");
        closeDialog(closest);
      };
    });

    const categoryNode = $("#category");
    if (categoryNode) {
      const categories = [
        ...new Set(getProducts().map((product) => product.category)),
      ];
      categories.forEach((category) => {
        categoryNode.insertAdjacentHTML(
          "beforeend",
          `<option value="${escape(category)}">${escape(category)}</option>`,
        );
      });
      const params = new URLSearchParams(location.search);
      if (params.get("category")) categoryNode.value = params.get("category");
    }

    ["input", "change"].forEach((eventName) => {
      $$("#search,#category,#availability,#minPrice,#maxPrice,#sort").forEach(
        (node) => {
          node.addEventListener(eventName, renderCatalog);
        },
      );
    });

    $("#clear")?.addEventListener("click", () => {
      ["search", "category", "availability", "minPrice", "maxPrice"].forEach(
        (id) => {
          const node = $(`#${id}`);
          if (node) node.value = "";
        },
      );
      if ($("#sort")) $("#sort").value = "popular";
      renderCatalog();
    });

    if ($("#productGrid")) renderCatalog();
    if ($("#productDetail")) renderProductPage();
    if ($("#profileSummary")) renderProfilePage();
  });

  Sazu.orderMarkup = (order) => {
    const lines = order.items
      .map(
        (i) =>
          "<p>" +
          escape(
            i.name ||
              getProducts().find((p) => p.id === i.id)?.name ||
              "Producto retirado",
          ) +
          " × " +
          i.qty +
          (Number.isFinite(i.unitPrice)
            ? " · " +
              money(i.unitPrice) +
              " c/u · " +
              escape(i.benefit) +
              " · " +
              money(i.subtotal)
            : "") +
          "</p>",
      )
      .join("");
    return (
      lines +
      (order.legacy
        ? "<p>Pedido histórico: " +
          escape(order.products || "Sin desglose original") +
          ". El dataset original no registra precios unitarios ni descuentos.</p>"
        : "<p>Nivel: " +
          escape(order.level) +
          "</p><p>Subtotal: " +
          money(order.subtotal) +
          " · Descuentos: " +
          money(order.discount) +
          "</p>") +
      "<p><strong>Total: " +
      money(order.total) +
      "</strong></p><p>Pago simulado: " +
      escape(order.payment || "Sin registro") +
      "</p><h3>Seguimiento</h3>" +
      order.history
        .map((h) => "<p>" + escape(h.date) + " · " + escape(h.status) + "</p>")
        .join("")
    );
  };
  document.addEventListener("keydown", (e) => {
    const dialog = $(".modal.open,.drawer.open");
    if (!dialog) return;
    if (e.key === "Escape") closeDialog(dialog);
    if (e.key === "Tab") {
      const list = $$("button,input,select,textarea,a[href]", dialog).filter(
        (n) => !n.disabled && n.offsetParent !== null,
      );
      const first = list[0],
        last = list.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  // Associate static and dynamically rendered labels without changing the visual layout.
  const labelFields = () =>
    $$(".field").forEach((field, i) => {
      const label = $("label", field),
        input = $("input,select,textarea", field);
      if (label && input && !label.htmlFor) {
        input.id ||= "field-" + i;
        label.htmlFor = input.id;
      }
    });
  document.addEventListener("DOMContentLoaded", () => {
    labelFields();
    new MutationObserver(labelFields).observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
  window.addEventListener("storage", () => {
    renderCatalog();
    renderProfilePage();
  });
  window.addEventListener(
    "error",
    (e) => {
      if (e.target instanceof HTMLImageElement) {
        e.target.onerror = null;
        e.target.src = "assets/images/product-fallback.svg";
      }
    },
    true,
  );
  window.openDetail = openDetail;
  window.renderProducts = renderCatalog;
  window.renderProductPage = renderProductPage;
  window.renderProfilePage = renderProfilePage;
})();
