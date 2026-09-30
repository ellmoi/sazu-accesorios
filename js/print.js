window.PrintDocs = {
  order(id) {
    const order = SazuStorage.getOrders().find((o) => o.id === id);
    if (!order) {
      Sazu.toast("Pedido no encontrado");
      return;
    }
    document.querySelector("#printContent").innerHTML =
      '<article class="print-document"><h1>SAZU Accesorios</h1><p>Pedido de demostración · sin cobros reales</p><h2>' +
      Sazu.escape(order.id) +
      "</h2><p>" +
      Sazu.escape(order.client) +
      " · " +
      Sazu.escape(order.date) +
      "</p>" +
      Sazu.orderMarkup(order) +
      '<button class="btn btn-primary no-print" onclick="window.print()">Imprimir</button></article>';
    Sazu.closeDialog(document.querySelector("#adminModal"));
    Sazu.openDialog(document.querySelector("#printModal"));
  },
};
