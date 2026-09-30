# SAZU Accesorios

SAZU demuestra la gestión comercial de una tienda: conecta catálogo, inventario, clientes, niveles, descuentos, carrito, pedidos y seguimiento en una aplicación estática con administración local.

## Demo

**[Abrir SAZU en GitHub Pages](https://ellmoi.github.io/sazu-accesorios/)**. No necesitas instalar nada ni configurar servicios. Todo el recorrido es gratuito y se ejecuta en el navegador.

## Probar SAZU

Recorrido orientativo de 3–5 minutos, usando el mismo navegador:

1. Abre **Ingresar** y pulsa **Cliente demo**.
2. En Productos, busca **Nova**, abre su detalle y agrega 2 unidades.
3. En Carrito, revisa subtotal, descuento y total; finaliza el pedido con los datos ficticios precargados.
4. Pulsa **Realizar pedido de demostración** y consulta **Mis pedidos**.
5. En Ingresar, pulsa **Administrador demo**, abre Pedidos y cambia el nuevo pedido a **Enviado**.
6. Vuelve a Cliente demo: el historial muestra el nuevo estado. Desde administración también puedes editar stock y cambiar el nivel del cliente.
7. Para empezar de nuevo: Administración → Niveles y reglas → **Restablecer datos demo**.

| Cuenta        | Correo          | Contraseña pública de demostración |
| ------------- | --------------- | ---------------------------------- |
| Cliente       | cliente@demo.co | demo123                            |
| Administrador | admin@demo.co   | admin123                           |

Cliente Demo está vinculado al registro comercial ficticio de Laura Gómez, conservado del dataset original. El administrador no cuenta como cliente. No uses contraseñas ni datos personales reales.

## Funcionalidades

- Catálogo con búsqueda, categorías, precio, disponibilidad, ordenamiento y ofertas; filtros combinables y estados sin resultados.
- Detalle según ID, cantidades validadas, favoritos locales y carrito persistente.
- Inventario disponible, bajo y agotado; reserva al confirmar y devolución al cancelar un pedido nuevo.
- Descuentos por producto, nivel y volumen calculados en un único módulo.
- Checkout sin cobros, con identificación única y copia histórica de nombres, precios, cantidades y descuentos.
- Historial por cliente, estados compartidos con administración e impresión de pedidos demo.
- Administración de productos, stock, clientes, niveles, pedidos y solicitudes mayoristas locales.
- Dashboard derivado de los datos: productos, clientes, pedidos, valor no cancelado, inventario y distribuciones por estado/nivel.
- Restablecimiento confirmado, recuperación de almacenamiento corrupto y aviso ante almacenamiento bloqueado.
- Diseño adaptable, tablas móviles en fichas, foco visible, etiquetas y diálogos con teclado.

## Flujo comercial

**Productos → Inventario → Clientes → Niveles → Descuentos → Carrito → Pedidos → Seguimiento**.

El stock se valida al agregar y al confirmar. El pedido, la reducción de existencias y el vaciado del carrito se guardan juntos; si falla la escritura, no se confirma la compra. Los cambios administrativos de estado se reflejan en el historial. Los pedidos conservan su precio aunque luego se edite o retire el producto.

### Reglas de precios

Importes en COP, redondeados a pesos enteros por unidad. Los descuentos no se acumulan.

- **Detal:** se aplica el menor precio entre la oferta del producto y el beneficio del nivel.
- **Mayorista:** por cantidad de cada referencia, se aplica el menor precio entre el precio mayorista del producto (desde su mínimo) y el tramo por volumen: 6–12 unidades, 8%; 13–24, 15%; desde 25, 25% sobre lista.
- **Niveles:** Nuevo 0%, Frecuente 3%, Preferencial 5%, VIP 8%; Mayorista activa el cálculo mayorista. Estos porcentajes de nivel son reglas explícitas de esta demo, añadidas durante la auditoría: el proyecto original solo contenía los nombres de los niveles.
- Administración asigna niveles manualmente; no existe ascenso automático por compras.
- Envío demo sin costo. Los siete estados son Pendiente, Confirmado, Preparando, Empacado, Enviado, Entregado y Cancelado. La demo permite cambios manuales; Cancelado no se reactiva y devuelve stock una sola vez en pedidos nuevos.

## Tecnologías

HTML, CSS y JavaScript sin frameworks ni dependencias de ejecución. JSON y localStorage para datos demo. Node.js 24 y su runner integrado se utilizan únicamente para verificaciones de desarrollo; Playwright es opcional para reproducir las comprobaciones de navegador. No hay build ni linter configurados.

## Arquitectura

Las 12 páginas HTML siguen en la raíz y utilizan rutas relativas compatibles con el subdirectorio de GitHub Pages.

| Responsabilidad                                        | Archivos                                                  |
| ------------------------------------------------------ | --------------------------------------------------------- |
| Dataset inicial                                        | `js/products.js`, `js/clients.js`, `js/orders.js`         |
| Reglas de precios, niveles y estados                   | `js/pricing.js`                                           |
| Persistencia, migración, clientes y transacciones demo | `js/storage.js`                                           |
| Navegación, catálogo, detalle, sesión y perfil         | `js/app.js`                                               |
| Carrito y checkout                                     | `js/cart.js`                                              |
| Administración e impresión                             | `js/admin.js`, `js/print.js`                              |
| Presentación y recursos locales                        | `css/`, `assets/images/`                                  |
| Verificación                                           | `scripts/check.mjs`, `test/`, `scripts/browser-check.cjs` |

## Datos

El dataset contiene **46 productos, 9 categorías, 8 clientes y 10 pedidos históricos**; cinco niveles, tres tramos de descuento y tres estados de inventario. Se conserva la ampliación de productos existente antes de esta auditoría.

Los pedidos históricos originales contienen cantidades e importes globales, pero no un desglose fiable por producto. Se muestran como históricos, sin inventar precios unitarios o descuentos; los pedidos nuevos sí guardan el desglose completo. Las métricas de clientes se calculan con los pedidos disponibles, no con los acumulados ilustrativos del dataset original.

`data/demo-products.json` y `data/demo-users.json` son exportaciones de referencia conservadas del trabajo previo, no otra fuente de datos activa. La aplicación usa las semillas JavaScript y no depende de solicitudes JSON. Las fotografías ilustrativas de Unsplash están copiadas localmente; su origen está en [assets/images/README.txt](assets/images/README.txt).

## Persistencia

`js/storage.js` concentra el acceso a localStorage en la clave versionada `sazuDemoV2`. Incluye productos, clientes, pedidos, usuarios demo, sesión, carrito, favoritos, solicitudes y modo de compra. Migra las claves anteriores cuando sus datos son válidos, sin eliminar información de otras aplicaciones.

Al restablecer, se recuperan semillas independientes del inventario modificado y se cierra la sesión. Si el almacenamiento no permite escribir, se puede explorar el catálogo y se explica por qué no se pueden guardar cambios. Los favoritos y el carrito pertenecen al navegador; el historial se filtra por cliente. Las pestañas reciben actualizaciones locales mediante eventos de almacenamiento.

## Modo demostración y limitaciones

- No hay cobros, despacho, transportadoras conectadas, notificaciones ni cotizaciones enviadas a una empresa.
- localStorage **no es una base de datos**: no hay sincronización entre dispositivos, respaldo central ni garantías de concurrencia entre varios usuarios.
- La autenticación y los roles son **simulaciones locales**, manipulables desde el navegador. Las contraseñas demo son públicas y se guardan sin protección; nunca deben ser contraseñas personales.
- Los clientes, pedidos y valores son ficticios. Las fotografías son de referencia; colores/tallas no tienen inventario independiente.
- La cancelación de pedidos históricos no cambia el stock porque no existe su desglose original.
- La verificación de interfaz se realizó en Chromium; no equivale a una certificación de accesibilidad ni una auditoría de seguridad para producción.

## Ejecutar localmente

Para evaluar el proyecto usa el enlace público. Para desarrollo, sirve la raíz con cualquier servidor estático. Por ejemplo, si tienes Python:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Abre `http://127.0.0.1:8000/`. Usa HTTP local o HTTPS; abrir archivos con `file://` no reproduce correctamente el origen compartido y la persistencia de la demo.

### Verificación de desarrollo

```sh
node scripts/check.mjs
node --test test/*.test.js
git diff --check
```

Para repetir las pruebas de navegador, con Playwright instalado como herramienta de desarrollo y su Chromium disponible:

```sh
node scripts/browser-check.cjs ruta/al/modulo/playwright
```

Ese script inicia un servidor temporal en el puerto 8001, sirve el sitio bajo `/sazu-accesorios/`, comprueba el recorrido comercial y 12 páginas en seis anchos, y guarda evidencia en `tmp/` (ignorado por Git). La herramienta no forma parte de los recursos publicados de la aplicación. CI ejecuta verificación estática y pruebas comerciales.

## Evolución futura

Un backend real permitiría una API, base de datos, inventario transaccional compartido, autenticación segura y permisos de servidor. Después podrían añadirse pagos y envíos reales con proveedores adecuados. Nada de eso es necesario para probar esta demo ni está presentado como implementado.

Consulta el [reporte técnico](docs/REPORTE.md) y el [flujo de contribución](CONTRIBUTING.md).
