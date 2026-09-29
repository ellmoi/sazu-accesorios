# Instrucciones del repositorio

- Leer `README.md` y `CONTRIBUTING.md` antes de modificar el proyecto.
- Trabajar en una rama de tarea en minúsculas y kebab-case; no editar directamente `main`. No crear `develop` para este proyecto.
- Preservar cambios existentes y revisar su propósito antes de preparar archivos. Usar rutas explícitas y commits lógicos con Conventional Commits en inglés.
- Seguir rama → cambios → verificación → commits → push → PR a `main` → CI satisfactorio → merge. Informar si permisos o acceso impiden completar algún paso.
- Ejecutar `node scripts/check.mjs` y `git diff --check`. No afirmar que hay pruebas, lint o build si no están configurados. Verificar en navegador los comportamientos modificados cuando sea posible.
- Mantener HTML/CSS/JavaScript sin dependencias de ejecución. Evitar cambios de rutas, grandes refactorizaciones o herramientas adicionales sin necesidad concreta.
- No publicar secretos ni datos personales reales. No hacer force push, reescribir historial, eliminar trabajo sin integrar ni descartar archivos del usuario sin autorización específica.
