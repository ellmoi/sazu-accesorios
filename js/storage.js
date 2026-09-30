(function () {
  const KEY = "sazuDemoV2";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const DEFAULT_USERS = [
    {
      id: 1,
      clientId: 1,
      name: "Cliente Demo",
      email: "cliente@demo.co",
      password: "demo123",
      role: "customer",
    },
    {
      id: 2,
      name: "Administrador Demo",
      email: "admin@demo.co",
      password: "admin123",
      role: "admin",
    },
  ];
  const seeds = {
    products: clone(window.PRODUCTS || []),
    clients: clone(window.CLIENTS || []),
    orders: clone(window.ORDERS || []),
  };
  let warning = "",
    volatile = false,
    memory;
  const readJSON = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      warning =
        "Se recuperaron datos locales no disponibles o dañados. Puedes restablecer la demo.";
      return fallback;
    }
  };
  const normalizeOrder = (order) => ({
    ...order,
    date: order.date || "",
    clientId:
      order.clientId ||
      seeds.clients.find((c) => c.name === order.client)?.id ||
      (order.client === "Cliente Demo" ? 1 : null),
    items: Array.isArray(order.items) ? order.items : [],
    legacy: !order.items?.some((i) => Number.isFinite(i.unitPrice)),
    history: order.history || [
      { status: order.status || "Pendiente", date: order.date || "" },
    ],
  });
  const initial = () => ({
    version: 2,
    products: clone(seeds.products),
    clients: clone(seeds.clients),
    orders: seeds.orders.map(normalizeOrder),
    users: clone(DEFAULT_USERS),
    cart: [],
    favorites: [],
    wholesaleRequests: [],
    session: null,
    mode: "retail",
  });
  const productValid = (p) =>
    p &&
    Number.isFinite(p.id) &&
    typeof p.name === "string" &&
    typeof p.category === "string" &&
    Number.isFinite(p.price) &&
    p.price >= 0 &&
    Number.isFinite(p.wholesale) &&
    p.wholesale >= 0 &&
    Number.isInteger(p.stock) &&
    p.stock >= 0 &&
    Number.isInteger(p.min) &&
    p.min > 0 &&
    Number.isFinite(p.offer) &&
    p.offer >= 0 &&
    p.offer <= 100;
  function validate(data) {
    if (!data || data.version !== 2) return false;
    if (
      ![
        "products",
        "clients",
        "orders",
        "users",
        "cart",
        "favorites",
        "wholesaleRequests",
      ].every((k) => Array.isArray(data[k]))
    )
      return false;
    return (
      data.products.every(productValid) &&
      data.clients.every(
        (c) =>
          c &&
          typeof c.name === "string" &&
          Object.hasOwn(SazuPricing.LEVELS, c.level),
      ) &&
      data.orders.every(
        (o) =>
          o &&
          typeof o.id === "string" &&
          typeof o.date === "string" &&
          Array.isArray(o.items) &&
          o.items.every(
            (i) =>
              i &&
              Number.isFinite(i.id) &&
              Number.isInteger(i.qty) &&
              i.qty > 0,
          ) &&
          Array.isArray(o.history) &&
          o.history.every((h) => h && typeof h.status === "string") &&
          Number.isFinite(o.total),
      ) &&
      data.users.every((u) => u && typeof u.email === "string") &&
      data.cart.every(
        (i) =>
          i && Number.isFinite(i.id) && Number.isInteger(i.qty) && i.qty > 0,
      )
    );
  }
  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      volatile = false;
    } catch {
      throw new Error(
        "No se pudo guardar. Habilita el almacenamiento del navegador o libera espacio e inténtalo de nuevo.",
      );
    }
    memory = clone(data);
    window.PRODUCTS = clone(data.products);
    return clone(data);
  }
  function migrate() {
    const data = initial();
    const oldProducts = readJSON("sazuProducts", null);
    if (Array.isArray(oldProducts) && oldProducts.every(productValid))
      data.products = oldProducts;
    const oldOrders = readJSON("sazuOrders", []);
    if (Array.isArray(oldOrders))
      for (const order of oldOrders) {
        if (
          order &&
          typeof order.id === "string" &&
          Number.isFinite(order.total) &&
          !data.orders.some((o) => o.id === order.id)
        )
          data.orders.push(normalizeOrder(order));
      }
    for (const [key, legacy] of Object.entries({
      cart: "sazuCart",
      favorites: "sazuFavorites",
      users: "sazuUsers",
      wholesaleRequests: "sazuWholesaleRequests",
    })) {
      const value = readJSON(legacy, null);
      if (Array.isArray(value)) data[key] = value;
    }
    data.users = data.users
      .filter((u) => u && typeof u.email === "string")
      .map((u) => ({
        ...u,
        clientId: u.clientId || (u.email === "cliente@demo.co" ? 1 : undefined),
      }));
    for (const user of data.users.filter(
      (u) => u.role === "customer" && !u.clientId,
    )) {
      user.clientId = user.id;
      data.clients.push({
        id: user.clientId,
        name: user.name,
        email: user.email,
        level: "Nuevo",
        type: "Detal",
        city: "Ciudad demo",
        status: "Activo",
      });
    }
    data.session = readJSON("sazuSession", null);
    try {
      data.mode =
        localStorage.getItem("sazuPurchaseMode") ||
        localStorage.getItem("sazuType") ||
        "retail";
    } catch {
      /* Browsing remains available. */
    }
    return validate(data) ? data : initial();
  }
  function getState() {
    if (volatile && memory) return clone(memory);
    const stored = readJSON(KEY, null);
    if (validate(stored)) {
      memory = stored;
      return clone(stored);
    }
    if (stored !== null)
      warning = "Datos demo dañados: se recuperó el dataset inicial.";
    const data = stored === null ? migrate() : initial();
    try {
      return save(data);
    } catch {
      volatile = true;
      memory = data;
      warning =
        "Almacenamiento no disponible: puedes explorar, pero no guardar pedidos o cambios.";
      return clone(data);
    }
  }
  function mutate(fn) {
    const data = getState();
    const result = fn(data);
    save(data);
    return result;
  }
  const get = (key) => getState()[key];
  const set = (key, value) =>
    mutate((data) => {
      data[key] = value;
    });
  const getSession = () => {
    const data = getState(),
      user = data.users.find((u) => u.email === data.session?.email);
    if (!user) return null;
    const { password, ...session } = user;
    return session;
  };
  const getCustomer = () =>
    get("clients").find((c) => c.id === getSession()?.clientId) || null;
  function createOrder(details) {
    let created;
    mutate((data) => {
      const session = getSession();
      if (session?.role !== "customer")
        throw new Error(
          "Inicia sesión como cliente demo para realizar el pedido.",
        );
      const client = data.clients.find((c) => c.id === session.clientId);
      if (!client)
        throw new Error("Cliente no disponible. Vuelve a iniciar sesión.");
      const summary = SazuPricing.summarizeCart(
        data.cart,
        data.products,
        data.mode,
        client.level,
      );
      if (!summary.valid) throw new Error(summary.errors[0]);
      const date = new Date().toISOString();
      created = {
        id: `SZ-${crypto.randomUUID()}`,
        clientId: client.id,
        client: client.name,
        date,
        city: String(details.city || client.city || "Ciudad demo"),
        payment: String(details.payment || "Transferencia"),
        mode: data.mode,
        level: client.level,
        subtotal: summary.subtotal,
        discount: summary.discount,
        total: summary.total,
        status: "Pendiente",
        history: [{ status: "Pendiente", date }],
        legacy: false,
        items: summary.lines.map((line) => ({
          id: line.product.id,
          name: line.product.name,
          qty: line.qty,
          listPrice: line.listPrice,
          unitPrice: line.unitPrice,
          discount: line.discount,
          subtotal: line.subtotal,
          benefit: line.benefit,
        })),
      };
      for (const line of summary.lines)
        data.products.find((p) => p.id === line.product.id).stock -= line.qty;
      data.orders.unshift(created);
      data.cart = [];
    });
    return created;
  }
  function changeStatus(id, status) {
    mutate((data) => {
      if (getSession()?.role !== "admin")
        throw new Error("Inicia sesión como administrador demo.");
      if (!SazuPricing.STATES.includes(status))
        throw new Error("Estado no válido");
      const order = data.orders.find((o) => o.id === id);
      if (!order) throw new Error("Pedido no encontrado");
      if (order.status === "Cancelado" && status !== "Cancelado")
        throw new Error("Un pedido cancelado no puede reactivarse.");
      if (order.status === status) return;
      if (status === "Cancelado" && !order.legacy)
        for (const item of order.items) {
          const product = data.products.find((p) => p.id === item.id);
          if (product) product.stock += item.qty;
        }
      order.status = status;
      order.history.push({ status, date: new Date().toISOString() });
    });
  }
  function register(user) {
    mutate((data) => {
      if (
        data.users.some(
          (u) => u.email.toLowerCase() === user.email.toLowerCase(),
        )
      )
        throw new Error("Ya existe una cuenta con ese correo.");
      const id = Date.now();
      data.clients.push({
        id,
        name: user.name,
        email: user.email,
        city: "Ciudad demo",
        level: "Nuevo",
        type: "Detal",
        status: "Activo",
      });
      data.users.push({ ...user, id, clientId: id, role: "customer" });
      data.session = { email: user.email };
    });
  }
  function resetDemoData() {
    save(initial());
    for (const key of [
      "sazuProducts",
      "sazuCart",
      "sazuFavorites",
      "sazuOrders",
      "sazuWholesaleRequests",
      "sazuUsers",
      "sazuSession",
      "sazuDemoSeeded",
      "sazuPurchaseMode",
      "sazuType",
    ]) {
      try {
        localStorage.removeItem(key);
      } catch {
        /* Canonical reset already succeeded. */
      }
    }
  }
  window.SazuStorage = {
    KEY,
    DEFAULT_USERS,
    readJSON,
    getState,
    mutate,
    productValid,
    createOrder,
    changeStatus,
    register,
    getSession,
    getCustomer,
    resetDemoData,
    ensureDemoData() {
      window.PRODUCTS = get("products");
    },
    getWarning: () => warning,
    getProducts: () => get("products"),
    setProducts: (value) => set("products", value),
    getClients: () => get("clients"),
    setClients: (value) => set("clients", value),
    getDemoUsers: () => get("users"),
    setDemoUsers: (value) => set("users", value),
    getCart: () => get("cart"),
    setCart: (value) => set("cart", value),
    getFavorites: () => get("favorites"),
    setFavorites: (value) => set("favorites", value),
    getOrders: () => get("orders"),
    setOrders: (value) => set("orders", value),
    getWholesaleRequests: () => get("wholesaleRequests"),
    setWholesaleRequests: (value) => set("wholesaleRequests", value),
    setSession: (value) => set("session", value),
    getMode: () => get("mode"),
    setMode: (value) => set("mode", value),
  };
})();
