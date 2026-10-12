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
- Las fotos tomadas antes de ir al lector desde el campo "Código de barras" no se
  conservan (un archivo no entra en `sessionStorage`); el resto del formulario sí.
- El filtro Rubro del conteo filtra los renglones cuyo rubro conoce el teléfono
  (los renglones del servidor no traen la categoría).
- "Agregar a la venta" depende de `GET /pos/products?ids=`; en la API simulada la
  validación de stock del POS lo rechazó ("Producto sin stock en este depósito."),
  que es el aviso de siempre del mostrador: verificar en `demo-qa`.
- El escáner viejo de Productos (`BarcodeScannerDialog`) quedó montado sin uso en el
  teléfono: el ícono del buscador ahora abre el lector central.
