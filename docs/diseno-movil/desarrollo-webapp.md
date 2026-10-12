# POS 360: desarrollo de la webapp móvil

Rama `movil-webapp` (desde `origin/main` 717cae3) · 2026-10-12 · rol desarrollo.
Implementa lo aprobado en la rama `diseno-movil` (`docs/diseno-movil/maqueta.html` e `informe.md`).
No se tocó la API. No hay deploy: la rama queda para revisar.

## 1. Qué se hizo

### Base (informe 4.1)
- `vuetify.js`: `display.mobileBreakpoint: "md"`. Un solo corte de teléfono: menos de 960 px. `DashboardHome` dejó de usar `smAndDown` y usa `mobile`. `PosPage` pasó su `@media (max-width: 600px)` a 959.98 px.
- Tema oscuro corregido en `adminDark` y `shopDark`: canvas `#111317`, pieza `#1f232a`, `surface-bright` `#262a32`, `surface-variant` `#2a2f38`. Se alinearon los hex que decían "igual a surface" (`asistente.css`, comentario de `style.css`).
- `index.html`: viewport con `interactive-widget=resizes-content`.
- `src/app/theme/movil.css`: tokens `--m-*` de los dos temas (informe 2.3) y las piezas del teléfono con prefijo `m-` (barra, pieza, fila con barra de 8 px, columnas, ítem de 60 px, buscador, chips, botón de 52 px, enlace, pie, campos, opción, segmento, stepper, píldora). Se carga una vez en `main.js`. Radios 12 / 10 / 8 / 6.
- `ShopHome` conserva su corte anterior con `mdAndDown`, para que la tienda no cambie.

### Navegación (4.2)
- `AppBottomNav.vue` reescrito: dueño Inicio · Vender · Ventas · Productos · Más; cajero Vender · Ventas · Caja · Productos · Más. Sin FAB ni hoja "¿Qué querés hacer?". Badge de Más = derivaciones por recibir + pedidos web sin preparar (`status=created`).
- Ruta `/app/mas` (`MasPage.vue`): ficha de la cuenta, grupos Operación, Gestión, CRM, Tienda, Sistema con los mismos permisos del menú de escritorio, Modo oscuro y Cerrar sesión.
- `AppShell.vue` en el teléfono: banda azul de 56 px con el título de la sección, la píldora de caja (`Caja #N` verde o `Caja cerrada` roja; en la pantalla Caja dice `Abierta` / `Cerrada`) y la campana de derivaciones. Sin fecha, pantalla completa ni menú de cuenta (están en Más). Las rutas con `meta.movilCompleta` no muestran la banda del shell ni la barra inferior. "Mi perfil" pasó a "Perfil" (menú y `routeTree`).
- El cajero arranca en Vender en el teléfono (sólo al entrar; desde Más puede abrir Inicio).
- `DashboardMobileHome.vue` reescrito (B1): Caja primero, Ventas de hoy con "Ayer a esta hora" y columnas por hora, Medios de pago en filas, Pendientes (cada uno al listado filtrado) y Últimas ventas con "Ver todas". Sin saludo ni tarjetas 2×2. Todos los enlaces por `name`.
  - Listados filtrados: `products?stock=without` (es el parámetro que ya lee Productos), `transfers?estado=dispatched` y `shopOrders?status=created`. Derivaciones y Pedidos ahora leen ese parámetro de la URL.

### Vistas completas en el teléfono (2.2 y 4.3)
Componente común `src/app/components/movil/MovilVista.vue` (banda con flecha, cuerpo con scroll, pie fijo con un botón) y `MovilAviso.vue` (aviso breve sobre el pie).

| Ruta | Nombre | Archivo |
|---|---|---|
| `/app/pos` (teléfono) | `pos` | `PosMobileLayout.vue` reescrito: buscador con escáner adentro, chips de rubro, filas que suman de a una con badge, sin stock apagados, barra fija con cantidad, total y Cobrar (o Abrir caja) |
| `/app/pos/venta` | `posCarrito` | `pages/movil/PosVentaEnCursoPage.vue` |
| `/app/pos/cobrar` | `posCobrar` | `pages/movil/PosCobrarPage.vue`: 4 pasos y Venta registrada |
| `/app/caja` | `caja` | `pages/movil/CajaPage.vue` |
| `/app/caja/abrir` | `cajaAbrir` | `pages/movil/CajaAbrirPage.vue` |
| `/app/caja/cerrar` | `cajaCerrar` | `pages/movil/CajaCerrarPage.vue` (B3) |
| `/app/caja/movimiento` | `cajaMovimiento` | `pages/movil/CajaMovimientoPage.vue` (B4) |
| `/app/pos/sales/:id/anular` | `posSaleAnular` | `pages/movil/PosAnularVentaPage.vue` |
| `/app/products/new` y `/:id/edit` | `productNew` / `productEdit` | `ProductFormPage.vue` con `meta.movilCompleta` |

- El disparador es el mismo: `usePosSalesFlow` decide. En escritorio `openCajaConfig`, `onCloseCaja` y `openCheckoutSafe` abren las ventanas de siempre; en el teléfono hacen `router.push`. Las rutas con `meta.soloMovil` redirigen en escritorio (a `pos`, al detalle o a Inicio), así el mostrador nunca las ve.
- `PosDialogs.vue`: `CheckoutDialog`, `ReceiptDialog`, `PosCajaConfigDialog`, `PosCajaArqueoDialog`, el snackbar y el tour `PosWizardDialog` sólo se montan en escritorio.
- Cobrar usa las mismas reglas de precio y cuotas que el escritorio (copiadas tal cual en `pos/utils/cobroReglas.js`, sin tocar `CheckoutDialog`) y registra la venta por `onCheckoutConfirm` con el mismo payload. Venta registrada: "Compartir ticket" (PDF por la hoja nativa del teléfono, o descarga), enlaces "Enviar por email" (mismo `POST /pos/sales/:id/email`) y "Nueva venta".
- Abrir, cerrar y movimiento usan el mismo estado de caja del singleton (`openCaja`, `closeCaja`, `addMovement`, `refreshCaja`), con el mismo pedido que el escritorio.
- Detalle de venta (teléfono): botón "Compartir ticket" y enlace rojo "Anular venta" que abre la vista completa; el bloque de anulación en línea queda sólo en escritorio.
- Productos (teléfono): buscador con escáner, chips "Todos N · Con stock N · Sin stock N" (las cantidades suman el total), filas con rubro, código, precio y stock; "+" en la banda para el dueño. Ficha: el dueño ve el costo y "Editar producto"; el cajero "Agregar a la venta".
- Escáner (`BarcodeScannerDialog`): enlace "Ingresar código" sobre la cámara; textos corregidos.

### Reglas del usuario en las pantallas tocadas
- Un botón por bloque; alternativas como enlace de texto.
- Textos según 4.5: "Sin artículos", "Sin caja abierta", "Falta la sucursal", "{producto} agregado", "Código no encontrado", "Sin acceso a la cámara", "Sin conexión", "La venta no se registró", sin "— abriendo…", login sin "Bienvenido de nuevo" ni "Ingresá con tu cuenta…" y pie "POS 360 · San Juan Tecnología". Estos avisos del flujo también cambian en escritorio (mismo texto, mismo lugar).
- Radios: login 24/22/18 a 14; `DashboardHome` `rounded="xl"` a `lg`. Lo nuevo no pasa de 12.
- `ProductFormPage`: el `grid-template-columns: 200px 1fr` inline pasó a clase y cae a una columna en el teléfono; el pie ya no queda a 64 px (no hay barra inferior en la vista completa). `ProductImagesPanel`: botones de foto con tamaño normal en el teléfono y "Agregar foto" en lugar de "Arrastrá imágenes o tocá aquí".

## 2. Verificación

- `npm ci` y `npx vite build`: OK.
- Chrome sin interfaz por CDP, build propio contra una API simulada con datos inventados (servidor local; nunca contra comercios reales). Capturas en `docs/diseno-movil/capturas-webapp/`.
- 390 × 844, dueño y cajero, claro y oscuro: Inicio, Más, Caja abierta y cerrada, Vender con carrito, Venta en curso, Cobrar pasos 1 a 4 (efectivo, crédito con cuotas, Factura A con cliente), Venta registrada (la venta se registró contra la API simulada), Abrir caja, Cerrar caja con diferencia, Movimiento, Detalle de venta, Anular venta, Productos, Ficha, Editar producto, Ventas y escáner. Sin desborde horizontal (`scrollWidth` = 390) ni errores de consola.
- 768 px: entra la rama del teléfono (Vender) sin desborde.
- Escritorio 1366 px: build de `origin/main` contra build de la rama, misma API simulada, diferencia de píxeles. Inicio y POS: 0 píxeles. Ventas, Productos, Inicio oscuro y POS oscuro: unos 1.000 píxeles, que son el reloj del encabezado (las capturas se tomaron con un minuto de diferencia). `/app/caja/cerrar` en escritorio vuelve a `/app/pos`.
- 1100 px cambia a propósito: antes caía en la barra inferior del teléfono, ahora tiene el menú lateral (`esc-1100-inicio.png`).

## 3. Lo que no se pudo o quedó distinto de la maqueta

**Necesita API (hacerlo aparte):**
- ~~Anular venta: motivo y observación~~ Resuelto en la rama `ajustes-cargador` de la API (2026-10-12): `deleteSale` guarda `reason` y `note` en `sales.cancel_reason` y `sales.cancel_note`, los suma a la nota de la venta y `GET /pos/sales/:id` los devuelve en `data.cancellation` (contrato en `docs/conteos-y-codigo.md` de la API).
- "Ayer a esta hora" y columnas por hora: `dashboard/overview` no tiene período "hoy" ni comparación con ayer. Se arman en el teléfono con `GET /pos/sales` (pagadas de hoy, hasta 200) y `GET /pos/sales/stats` de ayer hasta la misma hora. Con más de 200 ventas en el día las columnas quedan cortas: conviene un `salesByHourToday` y `yesterdaySameTime` en el overview.
- Recargo de cuotas: se muestra "Recargo N %" si el plan del medio lo tiene cargado (`surcharge_percent`), pero, igual que en escritorio, el total no lo suma (la regla vigente es precio lista en 2 o más cuotas). Si el recargo tiene que cobrarse, es un cambio de regla en los dos cobros.
- Contador de pedidos web sin preparar: se pide `GET /admin/shop/orders?status=created&limit=1` y se lee `meta.total`. Funciona, pero un endpoint de conteo sería más liviano.

**Pendiente en la webapp (no entró en esta rama):**
- Ventas (pantalla 8): sigue la vista de tarjetas que ya existía por debajo de 900 px; falta el rediseño con chips de período, bloque Total con filas, lista por franja horaria y la vista de filtros "Ver N ventas".
- Detalle de venta y Ficha de producto: se agregaron los botones de la maqueta, pero la pantalla sigue siendo la responsiva de escritorio (con su pastilla de volver).
- Nuevo / Editar producto: es vista completa en el teléfono, pero conserva el formulario de pasos actual. La vista única con scroll y el set reducido de campos de la maqueta no se hizo.
- Avisos (pantalla 3), Pedidos web (19) y Cajas del dueño (20) en formato teléfono.
- Listados en tarjetas (4.4): Clientes (B6), Cajas (B7), Pedidos, Usuarios, Derivaciones (revivir `TransferForm`), Medios de pago; inputs con `min-width` (B9); grilla de Contenidos (B8).
- `adminCustomerEdit` y los demás diálogos sensibles de R5 (cliente, usuario, sucursal, pedido, consulta).
- Barrido de voseo y em-dash en todo el sistema (R6, R8) y radios de R9 fuera de las pantallas tocadas.
- La caja trabada al abrir (409) sigue usando `PosZombieCashDialog`, que ya es pantalla completa.
- `AppApkPrompt` (R4) no se tocó: depende de la decisión 3.1 del usuario (Play o descarga directa).
- El escáner de Derivaciones dependía del botón central que se quitó; ahí queda el escáner propio de la pantalla.

**No verificable en este entorno:** teléfono real (cámara, teclado en pantalla con `interactive-widget`, compartir archivos, zona segura del iPhone). La cámara en el navegador sin interfaz cae al ingreso manual. Hay que verlo a 390 px en un aparato y en `demo-qa` antes de dar por bueno el cobro.
