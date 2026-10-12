# CHANGELOG

## 2026-10-12 · Contenidos: el creador ofrece todas las músicas habilitadas

- **Error**: en Gestión de contenidos, creador por campañas (`?vista=nuevo&campana=...`),
  sólo se podían elegir 2 o 3 músicas aunque la consola habilitara las 19 para el comercio.
- **Causa**: `CreadorCampanas.vue` no tenía selector de música. La música salía
  únicamente del estilo elegido (`elegirEstilo` -> `s.musica`), así que con tres estilos
  quedaban tres músicas al alcance. `GET /recursos` traía las 19 y la pantalla no las usaba.
- **Arreglo**: fila "Música" con todas las músicas de `recursos.musicas` (cada una con su ▶
  y "Sin música"); la campaña o el estilo sólo preeligen. Estilos, voces y músicas salen de
  `opcionesSonido(recursos)` (`campanas.js`), que no agrega ni recorta: tampoco se descartan
  estilos sin `animacion`. Las tiras de opciones envuelven en filas en vez de un scroll
  horizontal oculto, y el reproductor de muestras distingue música y voz (`mus:`/`voz:`).
- **Prueba**: `npm run test:sonido` (`scripts/test-sonido-creador.mjs`): dado un `/recursos`
  con N músicas, voces y estilos, verifica que el creador expone los N.
