# CHANGELOG

## 2026-10-12 · APK 2.1.0 y textos de instalación impersonales

- `android/app/build.gradle`: versionCode **3**, versionName **2.1.0** (el front la toma de ahí
  vía `build-apk.mjs` -> `VITE_APP_VERSION`).
- `AppApkPrompt.vue`, `AppApkBanner.vue` y `/app/install` (`AppInstallPage.vue`): sin voseo ni
  explicaciones. Título "App para Android", beneficios cortos, pasos en infinitivo; se quitó la
  nota "Te lo vamos a recordar..." y las preguntas frecuentes de `/app/install`.
- Aviso en el prompt y en `/app/install`: "Si hay una versión anterior, desinstalarla primero."
  (la firma cambió y Android responde "No se instaló la app" si se instala encima).

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
