# Flujo de trabajo

Repositorio personal de un prototipo estático. `main` contiene la versión integrada y verificada. No se utiliza `develop`: las tareas se integran mediante Pull Requests pequeños.

## Ramas y commits

Crear cada rama desde `main` actualizado. Usar minúsculas y kebab-case con prefijos `feature/`, `fix/`, `refactor/`, `docs/`, `test/` o `chore/`, según el propósito; nunca nombres de personas.

El flujo es: rama → cambios → verificación → commits lógicos → push → Pull Request a `main` → comprobaciones satisfactorias → merge. Eliminar la rama de tarea después de integrarla. No editar directamente `main`.

Los commits nuevos usan Conventional Commits en inglés: `feat`, `fix`, `refactor`, `docs`, `test`, `style`, `chore`, `perf`, `ci` o `build`. Ejemplo: `docs: document local setup`. Revisar el diff y preparar rutas concretas; separar cambios por propósito. No reescribir el historial publicado ni sobrescribir trabajo pendiente.

## Verificación

Con Node.js 24, ejecutar desde la raíz:

```sh
node scripts/check.mjs
git diff --check
```

El script comprueba sintaxis JavaScript y referencias locales estáticas en HTML, CSS y Markdown. No instala paquetes. No sustituye una prueba funcional ni valida enlaces externos o referencias construidas dinámicamente. La suite comercial usa el runner integrado de Node: `node --test test/*.test.js`. No hay linter ni build configurados. Las comprobaciones opcionales de navegador se documentan en README.md.

Si cambia la interfaz o la lógica, comprobar en un navegador el catálogo y sus filtros, el carrito al detal y mayorista, el pedido simulado, los formularios y las vistas administrativas afectadas. Usar datos ficticios. Documentar en el PR lo verificado y cualquier limitación.

## GitHub

La acción `CI` ejecuta `Static checks` (referencias, sintaxis y pruebas comerciales) en Pull Requests a `main` y en cambios integrados. `main` está protegida: exige PR, rama actualizada, este check satisfactorio y conversaciones resueltas; bloquea force push y eliminación, también para administradores. No exige aprobaciones de terceros porque hay un único mantenedor. Está activada la eliminación automática de ramas integradas. Estas opciones se administran en GitHub; los archivos del repositorio no las activan por sí solos. Referencia: [protección de ramas en GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches).

GitHub Pages sirve el sitio estático; no necesita un pipeline de compilación adicional. Usar Issues para errores o tareas concretas cuando aporten valor.

## Alcance y seguridad

Mantener las páginas públicas en la raíz para conservar las rutas. Separar comportamiento en `js/`, estilos en `css/`, recursos propios en `assets/` y documentación en `docs/`.

No versionar credenciales, archivos `.env`, datos personales reales ni resultados generados. El navegador no puede proteger secretos: no añadir claves privadas al JavaScript. Actualmente no se necesitan variables de entorno. Si se detecta un secreto publicado, revocarlo antes de planificar su retirada del historial; `.gitignore` no elimina exposiciones anteriores.
