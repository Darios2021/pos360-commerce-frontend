# POS 360: el teléfono como cargador y consultor (desarrollo)

Rama `cargador-movil` (desde `origin/main` e7774f9) · 2026-10-12 · rol desarrollo (front).
Implementa la maqueta aprobada `docs/diseno-cargador/maqueta.html` de la rama
`diseno-cargador`, sólo en el corte de teléfono (`display.mobile`, menos de 960 px).
No hay deploy: la rama queda para revisar. La API de conteos y código es la de
la rama `cargador-api` de `pos360-commerce-api` (contrato en su
`docs/conteos-y-codigo.md`).

## 1. Qué se hizo

### Navegación y banda
- `AppBottomNav.vue`: una sola barra para el dueño y el cajero: Inicio · Productos ·
  Escanear (botón central de 60 px, `m-bola`) · Derivaciones · Más. Badge de
  Derivaciones = por recibir **en la sucursal del usuario** (el composable de
  avisos le da todas al administrador; se filtra por `to_branch_id`). Badge de Más =
  pedidos web sin preparar.
- Vender salió de la barra: queda en Inicio (acceso) y en Más (Mostrador). La ruta
  `pos` lleva `meta.movilCompleta`: en el teléfono es vista completa con flecha,
  título y píldora de caja (`PosMobileLayout.vue`); el flujo de venta no cambió.
- `AppShell.vue`, banda del teléfono por pantalla (`bandaMovil`): Inicio con la
  píldora de sucursal y el aviso de por recibir (lleva a Derivaciones En camino);
  Productos y Derivaciones con su "+"; Más sólo el título; el resto (Ventas, Caja…)
  sigue con la píldora de caja y la campana.
- **Asistente a un toque (pedido del usuario):** ícono `mdi-forum-outline` en la
  banda de Inicio, Productos, Derivaciones y del resto de las pantallas con banda
  del shell, y un renglón propio arriba de todo en Más (no dentro de un grupo).
  Respeta la regla existente: sólo aparece si `GET asistente/estado` devuelve
  consultas permitidas (`usaAsistente`). No se agregó un sexto ítem a la barra.
- Router: el cajero ya no arranca en Vender en el teléfono (la maqueta le da Inicio).
  Las rutas nuevas llevan `soloMovil`; en escritorio cada una vuelve a su
  equivalente (lector → Inicio, consulta → ficha, derivaciones → `transferView`,
  conteo → Stock). En el teléfono `transferNew`, `transferView` y `productView`
  abren las vistas del cargador.

### Pantallas (módulo nuevo `src/modules/cargador/`)
| Maqueta | Ruta | Archivo |
|---|---|---|
| Inicio | `home` (teléfono) | `pages/InicioRuta.vue` → `components/InicioCargador.vue` |
| Lector (botón central) | `/app/escanear` `lector` | `pages/LectorPage.vue` |
| Ingresar código | `/app/escanear/codigo` | `pages/IngresarCodigoPage.vue` |
| Consulta de producto | `/app/products/:id/consulta` | `pages/ProductoConsultaPage.vue` |
| Código no encontrado | `/app/escanear/no-encontrado/:codigo` | `pages/CodigoNoEncontradoPage.vue` |
| Alta / edición | `productNew` / `productEdit` (teléfono) | `pages/ProductoFormRuta.vue` → `pages/ProductoFormMovil.vue` |
| (Dar de baja, vista completa) | `/app/products/:id/baja` | `pages/ProductoBajaPage.vue` |
| Productos | `products` | `ProductsListPage.vue` (bloque del teléfono) |
| Derivaciones | `transfers` | `StockTransfersPage.vue` (bloque del teléfono) |
| Nueva derivación | `/app/derivaciones/nueva` | `pages/DerivNuevaPage.vue` |
| Lector por lote | `/app/derivaciones/lote?modo=derivar|recibir|contar` | `pages/LotePage.vue` |
| Derivación despachada (QR) | `/app/derivaciones/:id` | `pages/DerivDetallePage.vue` |
| Cancelar derivación | `/app/derivaciones/:id/cancelar` | `pages/DerivCancelarPage.vue` |
| Recibir | `/app/derivaciones/:id/recibir` | `pages/DerivRecibirPage.vue` |
| Recepción registrada | `/app/derivaciones/:id/recibida` | `pages/DerivRecibidaPage.vue` |
| Conteo | `/app/conteo` | `pages/ConteoPage.vue` |
| Diferencias | `/app/conteo/diferencias` | `pages/ConteoDiferenciasPage.vue` |
| Vender | `pos` | `PosMobileLayout.vue` (banda propia) |
| Más | `mas` | `MasPage.vue` |

Piezas nuevas en `src/app/theme/movil.css` (sección "Cargador"), medidas de la
maqueta: píldora de sucursal, estados ocre y azul, ruta, ficha corta, código
grande y barras, líneas `m-ln`, progreso, diferencia, caja del QR, resultado,
accesos, fotos (`m-ftile`), visor, marco y rayo, modos, hoja del lote, `m-bola`.
Tokens nuevos `--m-ocre` y `--m-ocre-tinte` en los dos temas.

### Lector
- `lib/useLector.js`: APK con `startScan()` + evento `barcodesScanned` del plugin
  ML Kit (`app/native/escaner.js`, `lecturaContinua`), la cámara detrás de la vista
  y el fondo transparente (`barcode-scanner-active`). Webapp con `getUserMedia` +
  `BarcodeDetector` en bucle cada 200 ms; el mismo código se ignora 1,5 s (no suma
  dos veces por apuntar). Además lee pistolas USB o Bluetooth que tipean el código
  y Enter (cada Enter cuenta, sin la pausa).
- `lib/ruteo.js`: `DER-AAAA-NNNNNN` busca la derivación (`?search=`); si viene en
  camino a la sucursal del usuario abre Recibir, si es borrador la retoma, si no el
  detalle. Otro código según el modo: Consultar (consulta o no encontrado), Derivar
  (suma a la derivación en armado), Contar (suma al conteo).
- `lib/codigo.js`: `GET /products/by-code/:code`; ante cualquier 404 cae a
  `GET /products?q=` con coincidencia exacta de barcode, SKU o code (API vieja);
  403 `FORBIDDEN_SCOPE` = "Producto no habilitado en la sucursal"; sin red en la
  APK, la copia del catálogo con su hora (la consulta muestra la estampa).
- El campo "Código de barras" del alta abre el lector con `?para=campo` y vuelve con
  el código (el formulario guarda lo cargado en `sessionStorage` mientras tanto).

### APK 2.2.0: cámara del lector, barra de estado y aviso de versión nueva
Defectos de la 2.1.0 vistos en el teléfono del usuario y lo que cambió:

**"Escanear" no mostraba la cámara.** `startScan()` de
`@capacitor-mlkit/barcode-scanning` 8.2.1 dibuja la vista previa de CameraX
*detrás* del WebView (el plugin pone el WebView transparente,
`BarcodeScanner.java:393`). La regla vieja dejaba transparentes sólo `html`,
`body`, `.v-application`, `.v-main`, `.m-lector` y `.m-visor`; cualquier otro
contenedor con fondo (`#app`, `.scope-app`, `.v-layout`, el canvas de la vista)
tapaba la cámara. Ahora (`movil.css`, patrón de la documentación del plugin):
- `body.barcode-scanner-active { visibility: hidden }` (un elemento oculto no
  pinta su fondo) y `visibility: visible` sólo en la banda de la vista
  (`.mv-tb`: cerrar y linterna), el marco, el estado, el pie de modos, la hoja
  del lote, el aviso breve y las piezas de la APK. `html` y `body` transparentes.
- Permiso: `startScan()`, a diferencia de `scan()`, necesita CAMERA en tiempo de
  ejecución. `lecturaContinua()` hace `checkPermissions` / `requestPermissions`;
  si se niega, el lector muestra "Cámara sin permiso" con "Permitir cámara"
  (`openSettings()`), y al volver de los ajustes reintenta solo.
- Corte: `stopScan` + `removeAllListeners` y se saca la clase al salir de la
  vista (cerrar, atrás del sistema: desmonta), al pasar a segundo plano
  (`visibilitychange` / evento `pause` de Capacitor) y vuelve a arrancar al
  regresar (`resume`).
- Módulo de Google: `startScan()` usa ML Kit empaquetado
  (`com.google.mlkit:barcode-scanning:17.3.0` en el `build.gradle` del plugin);
  `isGoogleBarcodeScannerModuleAvailable` / `installGoogleBarcodeScannerModule`
  son sólo para `scan()`.
- Linterna en la APK: `enableTorch` / `disableTorch` del plugin.
- Plan B, ya en el código: si `startScan()` falla (no por permiso),
  `useLector` pasa a `scan()`, la pantalla propia de Google (sin permiso de la
  app), en bucle: cada lectura se entrega y se vuelve a abrir; al cancelarla el
  visor muestra "Escanear" para retomar. Si tampoco está el módulo de Google, la
  cámara web de siempre.
- Probado en Chrome sin interfaz con un plugin simulado (`window.Capacitor` con
  `PluginHeaders` falsos): orden de llamadas, clase puesta y quitada, alfa 0 en
  el visor, corte y regreso con `pause`/`resume`. **Falta verlo en un teléfono.**

**La banda superior quedaba debajo de la hora, el wifi y la batería.** Con
targetSdk 35/36 Android dibuja la app de borde a borde. En Capacitor 8 ya no
existe `android.adjustMarginsForEdgeToEdge` (era de la 7): lo reemplaza el
plugin de núcleo **SystemBars** (`capacitor.config.json` ->
`plugins.SystemBars`, `insetsHandling: "css"`, `style: "DARK"` = íconos claros).
Con `viewport-fit=cover` (está en `index.html`) y WebView 140 o más, el WebView
queda debajo de las barras y los márgenes llegan por
`env(safe-area-inset-*)` y por `--safe-area-inset-*`; con un WebView más viejo
el propio Android corre la vista y ambos dan 0.
- `movil.css`: `--m-sat` (barra de estado), `--m-sab` (barra de gestos) y
  `--m-sup` (barra de estado + banda de versión). Las barras del shell
  (`.m-appbar`, `.pos-appbar`) crecen hacia arriba con `--m-sup`, `.v-main`,
  el menú lateral, el login y `MovilVista` se corren lo mismo; la barra
  inferior usa `--m-sab`.
- `ArranqueApk.vue` pinta una franja del color de la banda detrás de la barra de
  estado (oscura en el lector) y deja la barra de gestos según el tema.
- En el navegador todo da 0 (salvo teléfonos con muesca, que es lo correcto).
  Probado simulando 28 px arriba y 20 px abajo.

**Aviso de versión nueva** (`app/native/AvisoActualizacion.vue`, montado por
`ArranqueApk`): al abrir y al volver al frente pide
`https://sanjuantecnologia.com/app/download/version.json` sin caché
(`CapacitorHttp`, sin CORS; si no, `fetch`) y compara `versionCode` con el de la
APK (`VITE_APP_VERSION_CODE`, de `build.gradle` vía `build-apk.mjs`). Mayor:
banda fija arriba "Versión X disponible" + "Actualizar" (abre el APK en el
navegador del teléfono), se oculta con la cruz hasta el próximo arranque o
regreso, o 30 minutos. Instalada menor que `minimo`: vista completa sin salida
con "Actualizar". Sin red o manifiesto roto: nada.
- El manifiesto se genera con `npm run apk:version` (o `-- --minimo N`) desde
  `build.gradle`, y se publica junto con el APK firmado, en el mismo commit.
- `nginx.conf` lo sirve como JSON, `no-store` y con
  `Access-Control-Allow-Origin: *`. Tras el deploy:
  `curl -sI -H 'Origin: https://localhost' https://sanjuantecnologia.com/app/download/version.json`.
- Las APK 2.0.0 y 2.1.0 no tienen este aviso: se enteran sólo por fuera.

### Alta y edición
Una sola vista con scroll. Obligatorios los de `ProductFormPage`: nombre, rubro y
subrubro del rubro. Precio lista = costo + % de ganancia + IVA (la regla del
escritorio, IVA 21 por defecto; la maqueta mostraba la cuenta sin IVA). Al crear:
`POST /products` con `branch_ids`, SKU con el id (misma función de iniciales), stock
por sucursal con `/stock/init` (sólo administrador) y fotos por
`POST /products/:id/images`. "Tomar foto" es un `<label for>` sobre un input
renderizado y recortado (`capture="environment"`), no el `display:none` que falla en
teléfonos. "Dar de baja el producto" abre una vista completa con botón rojo.

### Derivaciones
- Origen = depósito (`/warehouses`), destino = sucursal. La API toma el depósito de
  la sucursal activa, no el `from_warehouse_id` del cuerpo: el alta va con
  `X-Branch-Id` = sucursal del depósito elegido.
- Stock en origen por línea con `GET /stock?warehouse_id=&q=`; sin stock la línea
  queda apagada y no suma. Si el despacho da 422 por stock, la línea toma el
  disponible que dice la API.
- Despachar = guardar (POST o PUT del borrador) + `POST /:id/dispatch`, y abre el
  detalle con el QR (`qrcode` en SVG). Webapp: "Compartir QR" (PNG por la hoja
  nativa o descarga). APK: "Imprimir etiqueta" por la térmica Bluetooth de
  Impresión (`lib/etiquetas.js`, ESC/POS con QR `GS ( k`; la etiqueta de producto
  lleva CODE128).
- Recibir: lo contado vive en el teléfono hasta confirmar (`state/recepcion.js`);
  lo que no viene en la derivación se rechaza en la hoja y no viaja.
  `POST /:id/receive` con `item_id`, `qty_received` y `note`; el estado (Recibida o
  Recibida con diferencias) lo decide la API.
- Chips del listado: Recibidas incluye `partial` y Canceladas `rejected` (se pide con
  `status[]`), así las cantidades suman Todas; si aparece otro estado, chip "Otras".

### Conteo (contrato real de `origin/cargador-api`)
`services/conteos.service.js` concentra el contrato y `state/conteo.js` el espejo:
- Cada lectura: `POST /stock/counts` la primera vez (con el renglón) y después
  `PUT /stock/counts/:id` con `{ mode: "sumar", items: [{ product_id, counted_qty: 1 }] }`.
  El stepper usa `mode: "reemplazar"`.
- Al abrir Conteo se refresca el conteo del servidor y, si el teléfono no tiene uno,
  retoma el borrador abierto del depósito (el administrador también el `pending`):
  dos teléfonos cuentan juntos.
- Diferencias: dueño `POST /:id/apply { motivo }`, cajero `POST /:id/submit { motivo }`.
  Motivo obligatorio (el botón no se habilita sin motivo).
- Rechazos en la hoja del lote: `PRODUCT_NO_STOCK_TRACK` = "No controla stock",
  y los demás códigos con su texto (`textoError`).
- Con la API vieja (`/stock/counts` da el 404 de ruta inexistente) el conteo queda
  en el teléfono y el dueño aplica por `/stock/init`; el cajero no puede enviar.

### Más
Arriba la cuenta y el Asistente; Stock (Conteo, Derivaciones, Etiquetas) y
Mostrador (Vender, Ventas, Caja) como en la maqueta; **se conservan** Operación,
Gestión, CRM, Tienda y Sistema con sus permisos (sacarlos dejaba módulos sin
entrada en el teléfono). Cuenta: Modo oscuro; en la APK Entrar con huella y
Catálogo sin conexión con "Actualizado HH:MM" (interruptor real: apaga la copia,
`catalogoActivo()` en `catalogoOffline.js`); Cerrar sesión.

## 2. Verificación
- `npm ci`, `npx vite build` y `npm run test:sonido`: OK.
- Capturas en Chrome sin interfaz (Playwright), 390 × 844, contra una API simulada
  con datos inventados que sigue el contrato de `cargador-api`, build de producción.
  Las lecturas se simulan con la entrada de pistola (teclado + Enter). Recorridos:
  Inicio, lector, ingresar código, consulta, no encontrado, alta con el código,
  edición, baja, productos, nueva derivación con lote (incluye sin stock),
  despachada con QR, cancelar, listado con chips, QR que abre Recibir, lote de
  recepción (incluye "No viene en esta derivación"), recepción con diferencias y
  nota, recepción registrada, QR de otra sucursal que abre el detalle, conteo por
  lote (incluye "No controla stock"), chips del conteo, diferencias, aplicar
  (dueño) y enviar (cajero), Más, Vender desde "Agregar a la venta", asistente y
  las variantes APK (`?native=1`). Dueño y cajero, claro y oscuro:
  `docs/diseno-cargador/capturas-app/<tema>-<rol>-NN-<pantalla>.png` (169 capturas, PNG de 256 colores). Con el asistente apagado para el comercio no aparece en ninguna banda ni en Más (`claro-dueno-sin-asistente-mas.png`); con la API vieja (sin by-code ni conteos) la consulta y el conteo local funcionan.
- Sin desborde horizontal en ninguna captura. Consola sin errores de la app: los
  únicos "errores" son las líneas de red que Chrome registra por el 404 de un
  código inexistente y el 422 de un producto sin control de stock, que son las
  respuestas esperadas del contrato.
- Escritorio 1366 px: build de `origin/main` contra build de la rama, misma API
  simulada: Inicio, Productos, Derivaciones, POS, Editar producto, Derivación y
  `/app/mas` dan **0 píxeles** de diferencia (con la fecha del encabezado oculta).

## 3. Lo que no se pudo o quedó distinto
- **Unidades en el listado de derivaciones:** `GET /stock/transfers` trae los ítems
  sólo con `id`, sin `qty_sent`. El listado muestra la cantidad de productos; el
  bloque Por recibir de Inicio sí muestra unidades (pide el detalle de las 3
  primeras). Falta en la API un `units_total` en el listado.
- La cámara real no se pudo probar (Chrome sin interfaz no tiene `BarcodeDetector`;
  NUNCA se abrió emulador). `startScan()` con la vista transparente hay que verlo en
  un teléfono con la APK; también compartir el PNG del QR y la etiqueta Bluetooth.
  (2.2.0: corregido el fondo que tapaba la cámara y agregado el permiso, ver
  "APK 2.2.0"; sigue sin probarse en un teléfono.)
- Las fotos tomadas antes de ir al lector desde el campo "Código de barras" no se
  conservan (un archivo no entra en `sessionStorage`); el resto del formulario sí.
- El filtro Rubro del conteo filtra los renglones cuyo rubro conoce el teléfono
  (los renglones del servidor no traen la categoría).
- "Agregar a la venta" depende de `GET /pos/products?ids=`; en la API simulada la
  validación de stock del POS lo rechazó ("Producto sin stock en este depósito."),
  que es el aviso de siempre del mostrador: verificar en `demo-qa`.
- El escáner viejo de Productos (`BarcodeScannerDialog`) quedó montado sin uso en el
  teléfono: el ícono del buscador ahora abre el lector central.
