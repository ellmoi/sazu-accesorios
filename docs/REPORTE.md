# Reporte del proyecto

**Revisión:** 28 de septiembre de 2026.

**Estado:** prototipo frontend para portafolio. Muestra el recorrido de compra y una propuesta de administración comercial. Todavía no está preparado para operar una tienda real.

## Fortalezas

- Catálogo con 18 productos y 9 categorías; 8 clientes y 10 pedidos de ejemplo.
- Búsqueda, filtros, carrito y almacenamiento local de pedidos simulados.
- Diseño adaptable, panel de gestión y documentos de impresión.
- HTML, CSS y JavaScript sin frameworks ni proceso de compilación.

## Mejoras prioritarias

| Prioridad | Hallazgo | Próximo paso |
| --- | --- | --- |
| Alta | Acceso simulado y panel sin protección. | Añadir autenticación y permisos en un servidor. |
| Alta | Los nuevos pedidos, el panel y el perfil usan datos independientes. | Conectar las vistas a una fuente de datos común. |
| Alta | Guardar o duplicar productos solo muestra mensajes; eliminar afecta la vista. | Implementar cambios persistentes. |
| Media | `producto.html` muestra una ficha fija aunque reciba un identificador por URL. | Conectar la página de detalle con el catálogo. |
| Media | El resumen muestra líneas a precio detal, aunque el total puede usar precio mayorista. | Unificar el cálculo de precios. |
| Media | Los porcentajes por volumen anunciados no se calculan como tramos en el carrito. | Alinear la oferta con las reglas implementadas. |
| Media | Se puede avanzar con carrito vacío; la cantidad del detalle necesita validación más estricta. | Validar cantidades positivas, existencias y carrito antes de confirmar. |

## Verificación

Se revisaron las páginas y la lógica JavaScript. El enlace público respondió **HTTP 200** y devolvió el título de Sazu Accesorios. No se realizó una prueba interactiva completa en navegador ni una auditoría de seguridad. Las imágenes del README son diagramas explicativos, no capturas.

**Valor para un reclutador:** demuestra fundamentos de desarrollo web, manejo de eventos, diseño de interfaces y modelado de una compra, con un alcance transparente y mejoras concretas identificadas.

## Organización del repositorio — 29 de septiembre de 2026

Se conservaron las páginas y la lógica existentes. Los recursos propios quedan en `assets/`; se retiraron los dos archivos de orientación duplicados de `icons/` e `images/`. Se añadieron reglas de exclusión, formato de texto, flujo con ramas y PR, y una verificación estática para CI.

La revisión local comprobó sintaxis de los siete scripts de la aplicación y el verificador, referencias locales y conteos de los datos de ejemplo. La búsqueda de patrones de credenciales en archivos e historial no encontró coincidencias; no equivale a una auditoría completa. No existe suite de pruebas funcionales, linter ni compilación. Esta revisión de organización no incluyó una prueba interactiva completa en navegador.
