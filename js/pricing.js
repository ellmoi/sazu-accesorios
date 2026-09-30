(function () {
  const root = typeof window !== "undefined" ? window : globalThis;
  // Explicit demo benefits: the original dataset only defined level names.
  const LEVELS = {
    Nuevo: 0,
    Frecuente: 3,
    Preferencial: 5,
    VIP: 8,
    Mayorista: 0,
  };
  const VOLUME = [
    { min: 6, percent: 8 },
    { min: 13, percent: 15 },
    { min: 25, percent: 25 },
  ];
  const STATES = [
    "Pendiente",
    "Confirmado",
    "Preparando",
    "Empacado",
    "Enviado",
    "Entregado",
    "Cancelado",
  ];
  const formatMoney = (value) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(value || 0);
  const inventoryLabel = (stock) =>
    stock <= 0 ? "Agotado" : stock <= 10 ? "Pocas unidades" : "Disponible";
  function getUnitPrice(product, qty, mode = "retail", level = "Nuevo") {
    const base = Number(product.price),
      offerPercent = Number(product.offer || 0);
    const isWholesale = mode === "wholesale" || level === "Mayorista";
    let unitPrice = base,
      benefit = "Precio de lista";
    const consider = (price, label) => {
      if (price < unitPrice) {
        unitPrice = price;
        benefit = label;
      }
    };
    if (isWholesale) {
      if (qty >= product.min)
        consider(Number(product.wholesale), "Precio mayorista por referencia");
      const tier = VOLUME.filter((t) => qty >= t.min).at(-1);
      if (tier)
        consider(
          Math.round(base * (1 - tier.percent / 100)),
          `Volumen ${tier.percent}%`,
        );
    } else {
      consider(
        Math.round(base * (1 - offerPercent / 100)),
        `Oferta ${offerPercent}%`,
      );
      const percent = LEVELS[level] || 0;
      consider(
        Math.round(base * (1 - percent / 100)),
        `Nivel ${level} ${percent}%`,
      );
    }
    return {
      base,
      unitPrice,
      benefit,
      offerPercent,
      isWholesale,
      hasOffer: !isWholesale && benefit.startsWith("Oferta"),
    };
  }
  function summarizeCart(items, products, mode = "retail", level = "Nuevo") {
    const errors = [],
      seen = new Set(),
      lines = [];
    if (!Array.isArray(items) || !items.length)
      errors.push("Tu carrito está vacío");
    for (const entry of Array.isArray(items) ? items : []) {
      const product = products.find((p) => p.id === entry.id);
      if (!product) {
        errors.push("Un producto ya no está disponible; elimínalo del carrito");
        continue;
      }
      if (
        !Number.isInteger(entry.qty) ||
        entry.qty <= 0 ||
        seen.has(entry.id)
      ) {
        errors.push(`Cantidad inválida: ${product.name}`);
        continue;
      }
      seen.add(entry.id);
      if (entry.qty > product.stock)
        errors.push(`Solo quedan ${product.stock} unidades de ${product.name}`);
      const pricing = getUnitPrice(product, entry.qty, mode, level);
      const subtotal = entry.qty * pricing.unitPrice;
      lines.push({
        product,
        qty: entry.qty,
        ...pricing,
        listPrice: pricing.base,
        subtotal,
        discount: entry.qty * pricing.base - subtotal,
      });
    }
    const subtotal = lines.reduce(
      (sum, line) => sum + line.qty * line.listPrice,
      0,
    );
    const discount = lines.reduce((sum, line) => sum + line.discount, 0);
    return {
      mode,
      level,
      subtotal,
      discount,
      total: subtotal - discount,
      itemCount: lines.reduce((sum, line) => sum + line.qty, 0),
      lines,
      errors,
      valid: errors.length === 0,
    };
  }
  const pricing = {
    LEVELS,
    VOLUME,
    STATES,
    formatMoney,
    inventoryLabel,
    getUnitPrice,
    summarizeCart,
  };
  root.SazuPricing = pricing;
  if (typeof module !== "undefined") module.exports = pricing;
})();
