# CHANGELOG

## 2026-10-12 · APK 2.2.0: aviso de actualización, barra de estado y cámara del lector

- `android/app/build.gradle`: versionCode **4**, versionName **2.2.0**.
- Aviso de versión nueva en la APK (`src/app/native/AvisoActualizacion.vue`): lee
  `/app/download/version.json` al abrir y al volver al frente; banda fija arriba con
  "Actualizar", o vista completa bloqueante si la instalada es menor que `minimo`.
  Manifiesto generado por `npm run apk:version` (`scripts/generar-version-apk.mjs`);
  publicado con 2.2.0 y `minimo` 3. `nginx.conf` lo sirve sin caché y con CORS.
- Borde a borde (Android 15/16): `plugins.SystemBars` en `capacitor.config.json`, barras
  del shell, `v-main`, login y vistas completas corridas por la barra de estado
  (`--m-sat`/`--m-sup` en `movil.css`), franja del color de la banda detrás de la hora.
- Lector: la cámara de `startScan()` ya no queda tapada (todo oculto con `visibility`
  salvo marco y controles), permiso de cámara con "Permitir cámara" (ajustes), corte al
  salir y en segundo plano, linterna nativa, plan B con `scan()` de Google en bucle.
- `AppVersionAviso` (recarga de la web) ya no se monta dentro de la APK.
- Detalle: `docs/diseno-cargador/desarrollo.md`, sección "APK 2.2.0".

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
