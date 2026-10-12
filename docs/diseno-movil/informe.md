# POS 360: rediseño móvil del backoffice (webapp y APK)

Rama `diseno-movil` · 2026-10-11 · rol diseño.
Maqueta navegable: `docs/diseno-movil/maqueta.html`. Es un solo archivo y se abre en el navegador. Arriba a la izquierda tiene tres selectores: tema, rol (Dueño / Cajero) y plataforma (Webapp / APK). También acepta parámetros en la URL: `?tema=oscuro&rol=cajero&plat=apk#caja`.

El QA se hizo **leyendo el código** de `origin/main` (frontend `717cae3`) y de la API (`pos360-commerce-api`). Ninguna pantalla se probó en un teléfono. Antes de dar por buena una pantalla implementada hay que verla a 390 px en un aparato real.

---

## 1. QA a 390 px

### 1.1 Lo que hace cada perfil desde el teléfono

| Tarea | Dueño | Vendedor / cajero | Hoy en el teléfono |
|---|---|---|---|
| Vender rápido (buscar o escanear, sumar, cobrar) | a veces | **todo el día** | anda (PosMobileLayout), pero se cobra en un diálogo de escritorio |
| Cobrar | a veces | **todo el día** | diálogo de 960 px con textos de teclado |
| Ventas del día | **todo el día** | las suyas | anda (tarjetas a menos de 900 px) |
| Estado de la caja | **todo el día** | al abrir y cerrar | sin datos en Inicio; el acceso «Caja» está roto |
| Abrir y cerrar caja | rara vez | **cada turno** | **el arqueo se rompe** |
| Consultar stock y precio | seguido | seguido | anda (escáner y ficha) |
| Cargar un producto con foto | seguido | rara vez | anda, pero el formulario es largo y tiene áreas táctiles chicas |
| Preguntarle al asistente | seguido | a veces | anda; en el teléfono no hay forma de llegar |
| Pedidos web, avisos | **en cuanto entran** | no | sin aviso, tabla de 16 columnas |

### 1.2 Hallazgos que bloquean

| # | Archivo | Problema | Motivo |
|---|---|---|---|
| B1 | `src/modules/dashboard/components/DashboardMobileHome.vue:100-172` | Los accesos rápidos apuntan a `/pos`, `/pos/sales`, `/pos/transfers`, `/pos/cash` y `/pos/products?...`. Las rutas reales viven bajo `/app`, y `/pos/transfers` y `/pos/cash` no existen. | El catch-all (`router/index.js:249`) manda esos enlaces a `/shop`. Vender, Ventas, Transferir, Caja, la alerta de stock y «Ver todas» **sacan al usuario del backoffice**. |
| B2 | `src/app/components/AppBottomNav.vue` + `AppShell.vue:110` | En el teléfono el drawer desaparece entero y la barra inferior solo tiene Inicio, Productos, Escanear, Derivaciones y Vender. No hay «Más». | Ventas, Caja, Clientes, Asistente, Contenidos, Tienda, Sistema y Perfil **no tienen entrada** en el teléfono. La barra tampoco cambia según el rol. |
| B3 | `src/modules/pos/components/PosCajaArqueoDialog.vue:4,721,740` | El cierre de caja (arqueo) es un diálogo de 1040 px con un aside fijo de 350 px y sin `@media`. | A 390 px la columna «Efectivo contado» queda en unos 16 px. **No se puede cerrar la caja desde el teléfono.** |
| B4 | `src/modules/pos/components/modales/PosMovimientosDialog.vue:5,45,190` | Ingresos y egresos: flex con un aside de 330 px y los motivos en 3 columnas. | Se rompe igual que el arqueo. |
| B5 | `src/modules/pos/components/checkout/CheckoutDialog.vue:2,148,162` | El cobro es un `v-dialog` de 960 px, no fullscreen. El pie dice «BORRAR Atrás» y «ENTER Siguiente», y el encabezado «Cobrar F9». | Lo sensible va en vista completa. En el teléfono no hay teclado físico ni barra de teclas (ver 2.2). |
| B6 | `src/modules/admin/pages/CustomersAdminPage.vue:257-278, 1680` | Tabla de 10 columnas dentro de `.lp-content{overflow:hidden}` y sin contenedor con scroll. | Las columnas quedan recortadas, sin forma de verlas. |
| B7 | `src/modules/admin/pages/CashRegistersAdminPage.vue:236` | `.cj-abiertas` usa `minmax(380px,1fr)`. | Desborda a 390 px. |
| B8 | `src/modules/admin/pages/ContenidosAdminPage.vue:1354,1473` | La grilla de «Publicar» queda en `260px minmax(0,1fr)` y no cambia por debajo de 900 px. | Quedan menos de 130 px para el texto de la publicación. |
| B9 | `src/modules/admin/pages/ShopLinksView.vue:34,45` y `src/modules/admin/pages/GaleriaMultimediaView.vue:528` | Inputs con `min-width` de 260, 320 y 320 px. | Desbordan. |

### 1.3 Hallazgos de reglas del usuario

| # | Archivo | Problema | Regla |
|---|---|---|---|
| R1 | `src/app/plugins/vuetify.js:58-68` | Tema oscuro **invertido**: `background #1a1d23` es más claro que `surface #0d0f13`, aunque el comentario diga lo contrario. | El canvas va más oscuro que las piezas, con un escalón ancho, en los dos temas. |
| R2 | `AppBottomNav.vue` (hoja «¿Qué querés hacer?») | Usa voseo, dice «El teléfono actúa como pistola digital» y cada opción trae una descripción. | Registro impersonal; la interfaz no explica. |
| R3 | `AppShell.vue:20,99` | En el teléfono se oculta el estado «Caja abierta / cerrada» (`v-if="!mobile"`). El menú de cuenta dice «Mi perfil». | Es el dato que más mira el dueño. «Mi» es primera persona: debe decir «Perfil». |
| R4 | `AppApkPrompt.vue` (commits `fade874`, `ae51296`) | Hoja invasiva que vuelve en cada recarga, con el texto «Te lo vamos a recordar…». | Un aviso no trivial en ventana, y además explica. |
| R5 | Diálogos sensibles en el teléfono | Hay diálogos para abrir caja (`PosCajaConfigDialog`), editar o crear cliente, unificar, desactivar o eliminar (`CustomersAdminPage:439,535,575`), inactivar o eliminar producto (`ProductsListPage:284,298`), editar usuario (`UserUpsertDialog`, 860 px), editar sucursal (`BranchEditDialog`, 900 px), ver un pedido (`ShopOrderDetailDialog`, 980 px) y responder una consulta (`ShopQAView:325`). | Lo sensible va en vista completa. |
| R6 | Todo el sistema | Voseo: «Elegí medio de pago», «Ingresá con tu cuenta para continuar», «Escribí ELIMINAR para confirmar», «Podés seguir sin cliente», «Tocá…», «¿querés cerrar caja?», «Agregá productos del catálogo», «Elegí sucursal», entre otros. El tour `PosWizardDialog` está en voseo entero. | Registro impersonal. El barrido es por sistema, no por pantalla. |
| R7 | Pistas y textos de ayuda | `CheckoutDialog.vue:977-1058` («Completá datos · Tab entre campos · Enter…»), notas al pie en `TableroInicio.vue:56-232`, `AppInstallPage` con 3 pasos y 3 preguntas frecuentes, `ProductImagesPanel` («Arrastrá imágenes o tocá aquí»). | La interfaz no explica. |
| R8 | Em-dash | `BarcodeScannerDialog.vue:330,335` («— abriendo…»), `PosCajaActionsBar.vue:97`, el pie del login «POS 360 — Desarrollado por…», `CustomerDetailView.vue:69`, `ProductsListPage.vue:752`. Además se usa «—» como valor vacío en ventas, arqueo y admin. | Sin em-dash en la interfaz. Para un valor vacío va el campo vacío o «Sin dato». |
| R9 | Radios mayores a 14 px | `PosMobileLayout.vue:345,426` (18 y 20), `ReceiptDialog` `rounded="xl"` (24), `LoginPage` (18, 22, 24), `AppApkPrompt` (22), `DashboardMobileHome` (16 y 22), `ContenidosAdminPage` (16) y `rounded="xl"` en ShopQA, Galería, Fiscal, Branches, Clientes y producto. | Techo de 14 px. Los `999px` / `9999px` de puntos, píldoras y avatares son círculos, no tarjetas: **no se tocan**. |
| R10 | Más de un botón por bloque | `CustomersAdminPage:211-235` (envío masivo con 3 botones y «Limpiar»), el hero de `CustomerDetailView:75-90` (4 acciones), la barra de `ProductImagesPanel` (Refrescar, Cámara, Elegir/Subir), `PosZombieCashDialog` (cerrar y abrir más «Abrir caja en otra sucursal»). | Un bloque, un botón. |

### 1.4 Otros hallazgos

- `vuetify.js`: falta `display.mobileBreakpoint`. El valor por defecto de Vuetify es `'lg'` (verificado en `node_modules/vuetify/lib/composables/display.js:9`). Vuetify 3 toma `mobile` por debajo de `lg` (1280 px). Por eso **una notebook de 1366 con zoom o una tablet apaisada ya cae en la barra inferior** y pierde el drawer. Además conviven dos cortes en la misma pantalla: `AppShell` usa `mobile` (menos de 1280) y `DashboardHome` usa `smAndDown` (menos de 960). Entre 960 y 1279 px se ve la barra inferior con el tablero de escritorio. Hay que fijar `mobileBreakpoint: 'md'` y usar ese corte en todo el sistema.
- `index.html:5`: el viewport no declara `interactive-widget=resizes-content`. En Android `dvh` no se achica con el teclado y los pies fijos (cobro, asistente, formulario de producto) pueden quedar tapados.
- `ProductFormPage.vue:141`: el `grid-template-columns:200px 1fr` inline le gana a la media query. `:2635`: pie con `bottom:64px`.
- `ProductImagesPanel.vue:165-195`: los botones de principal, recortar y eliminar foto son `x-small`.
- `StockTransfersPage.vue:97` y `TransferPage.vue`: tablas de 760 a 900 px sin vista en tarjetas. `DashboardTransferenciasTab.vue` y `TransferForm.vue` ya tenían vista móvil, pero **ninguna ruta los usa** (código muerto).
- `ShopOrdersTable.vue:10`: unas 16 columnas sin vista móvil. `UsersPage.vue:761`: tabla de 900 px.
- `ProductProfilePage` (`router:118`) no tiene enlaces que lleguen a ella; parece huérfana.
- **La pantalla de ingreso del backoffice no tiene huella.** La APK Capacitor actual pide huella al arrancar (`main.js:132-160`, «Ingresá con tu huella para abrir Sj Tecnología»), pero ese bloqueo hidrata la sesión del **shop** (`useShopAuthStore`), no la del backoffice (`useAuthStore`). También usa `biometric.js` el login del shop (`ShopLogin.vue:128`).
- La API emite por socket solo `transfer:dispatched|received|cancelled` (`stockTransfer.service.js`). No hay eventos de venta ni de pedido, ni push (FCM).
- La impresión de tickets (`pos/utils/impresion.js`) manda ESC/POS a un programa local por `fetch`. En un teléfono ese programa no existe.

---

## 2. Decisiones de diseño

### 2.1 Navegación

**Barra inferior de 5 destinos según el rol. El escáner deja de ser un botón central.**

| Rol (`auth.store`) | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| `isBranchAdmin` (admin, super_admin, owner) | Inicio | Vender | Ventas | Productos | Más |
| `isCajero` (cajero, vendedor, sin rol) | Vender | Ventas | Caja | Productos | Más |

- El cajero arranca en **Vender** y el dueño en **Inicio**.
- Para el dueño, la Caja entra por el primer bloque de Inicio y por Más › Operación.
- El escáner es el ícono de código de barras **dentro del buscador** de Vender, Productos y el campo «Código de barras». Así el destino es siempre el mismo y desaparece la hoja «¿Qué querés hacer?».
- El badge de Más suma pedidos web sin preparar y derivaciones por recibir.
- **Más** es una lista agrupada como el drawer de escritorio (Operación, Gestión, CRM, Tienda, Sistema, Cuenta), con los mismos permisos (`hasRoute`, `isAdmin`, `isSuperAdmin`, `usaAsistente`). Arriba va la ficha de la cuenta y al final «Modo oscuro», y en la APK «Entrar con huella» y «Avisos de ventas y pedidos». Cierra con «Cerrar sesión».
- La barra superior es la banda azul del sistema (la del cobro), de 56 px. Lleva el título de la sección y, a la derecha, el estado de caja (píldora «Caja #312» con punto verde, o «Caja cerrada» con punto rojo) o la sucursal y la campana de avisos. En las vistas completas lleva una flecha de volver y **no muestra la barra inferior**.

### 2.2 Lo sensible va en vista completa

En el teléfono son pantallas propias, con ruta y botón de volver:

- Cobrar, en 4 pasos.
- Abrir caja, cerrar caja (arqueo) y movimiento de caja.
- Anular una venta.
- Nuevo y editar producto. La baja del producto es un enlace al pie de editar.
- Editar cliente, editar usuario y detalle de pedido.

Solo quedan como hoja inferior los filtros de listados y los avisos breves.

> **La excepción del 10/10 no aplica en el teléfono.** El usuario aceptó que las acciones de la barra de teclas del POS (F1 a F11, incluido el movimiento de caja) sean ventanas **en el mostrador de escritorio**, para que el cajero no salga de la venta. En el teléfono no hay barra de teclas ni teclado físico: se cobra, se abre, se cierra y se registran movimientos en vista completa. **No hay que revertir esto citando esa excepción.** En escritorio todo sigue igual.

### 2.3 Kit

Los tokens salen del código. Se definen una vez como variables CSS (webapp) y como `ThemeExtension` (Flutter).

| Token | Claro | Oscuro | Origen |
|---|---|---|---|
| canvas | `#c5cbd2` | `#111317` | claro: `vuetify.js`; oscuro: corregido, por debajo de la pieza |
| pieza (cards, barras, pies) | `#ffffff` | `#1f232a` | |
| variante (miniaturas, campos) | `#eef2f6` | `#2a2f38` | |
| línea | `#d3dde7` | `#343943` | `cobro.css --cb-borde` |
| tinta / suave | `#0f172a` / `#5a6678` | `#e6e7eb` / `#a1a4ab` | `cobro.css`, `vuetify.js` |
| texto sobre canvas (rótulos) | `#28313e` | `#b9bdc5` | sube de tono porque el canvas es oscuro |
| acción (botones, activo) | `#0f6fae` | `#1488d1` | 194 usos; `cobro.css --cb-azul` |
| texto de acción (enlaces) | `#0f6fae` | `#6cb6e6` | |
| banda (barra superior) | `#0f6fae` | `#173a5e` | `asistente.css --gx-banda` oscuro |
| verde (solo estados) | `#2e9e7b` | `#3fb68f` | |
| rojo (una vez por pantalla) | `#c2413a` | `#e2625b` | |
| rampa de series | `#0f6fae` `#3d8cc4` `#79b2da` `#b3d3ea` | `#a6d8fa` `#3aa5e6` `#1c6699` `#203a52` | monocromática |

- **Tipografía:** Inter. Título de barra 19/700; título de bloque 16/800; cifra principal 28-30/800; cifra de fila 16-17/800; texto 15; secundario 13. Cifras con `tabular-nums`.
- **Radios:** pieza y opción 12, botón y campo 10, chip 8, estado 6. **Techo de 14.** Los círculos (avatar, punto, badge) no cuentan.
- **Tamaños táctiles:** botón principal de 52 px de alto y ancho completo; ítem de lista de 60 px como mínimo; ícono de barra en un área de 44×44; barra inferior de 64 px más `env(safe-area-inset-bottom)`; márgenes laterales de 16 px.
- **Gráficos:** según el estándar del usuario. Usar **fila** (cifra, etiqueta y barra fina de 8 px debajo) para medios de pago, stock por sucursal y cobrado en el turno, y **columnas** para las ventas por hora. Va un solo tono en pasos; la columna más alta lleva el paso fuerte. A 390 px los bloques van apilados de a uno, no de a dos.
- **Un botón por bloque.** Las alternativas van como enlace de texto: «Usar contraseña», «Enviar por email», «Nueva venta», «Anular venta», «Ver todas», «Ingresar código», «Dar de baja el producto».

### 2.4 Pantallas (todas en la maqueta)

1. **Ingreso.** En la webapp: usuario, contraseña, «Mantener sesión» y «Entrar». En la APK, a partir del segundo ingreso: avatar, nombre, sucursal y «Entrar con huella», con el enlace «Usar contraseña».
2. **Inicio (dueño).** Lleva cinco bloques:
   - Caja: número, desde cuándo está abierta, cajero y efectivo esperado. Abre la Caja.
   - Ventas de hoy: cifra, comparación con «Ayer a esta hora» y columnas por hora.
   - Medios de pago, en filas.
   - Pendientes: pedidos web, derivaciones y sin stock. Cada uno lleva **al listado filtrado**.
   - Últimas ventas, con el enlace «Ver todas».
3. **Avisos.** Lista por día. Cada aviso abre el listado filtrado correspondiente.
4. **Vender.** Lleva:
   - Buscador con el ícono del escáner.
   - Chips de rubro.
   - Lista de productos: tocar una fila suma una unidad y el badge muestra la cantidad. Los productos sin stock aparecen apagados y no se pueden tocar.
   - Barra fija sobre la navegación, con la cantidad de artículos, el total y un único botón «Cobrar». Tocar el total abre la venta en curso.
5. **Venta en curso.** Ítems con un stepper −/+ (en 1, el «−» se convierte en quitar), cliente y lista de precios, y un pie con el total y «Cobrar».
6. **Cobrar.** Son 4 pasos en vista completa. Arriba se ve siempre el total y una barra de pasos.
   - **Medio de pago:** Efectivo, Débito, Crédito, Transferencia, Mercado Pago y Mixto. La lista viene del backend.
   - **Pago:**
     - Efectivo: «Efectivo recibido», con montos rápidos («Exacto» y redondeos) y el vuelto.
     - Crédito: cuotas con su recargo.
     - Los demás medios: «Número de operación» opcional.
     - Mixto: lista de pagos parciales hasta cubrir el total.
   - **Comprobante:** No fiscal, Factura B, Factura A o Factura C. Si la factura pide cliente, aparecen ahí mismo los campos de cliente.
   - **Confirmar:** resumen y «Confirmar venta».
   - **Venta registrada:** en la APK, «Imprimir ticket»; en la webapp, «Compartir ticket». Debajo, los enlaces «Enviar por email» y «Nueva venta».
7. **Escáner.** Cámara a pantalla completa con un marco, linterna y el enlace «Ingresar código». Qué hace al leer depende de dónde se abrió:
   - Vender: suma el producto a la venta y vuelve.
   - Productos: abre la ficha.
   - Formulario de producto: completa el código.
8. **Ventas.** Lleva:
   - Chips de período.
   - Bloque «Total»: cifra, cantidad de ventas y anuladas, y filas por medio de pago.
   - Lista por franja horaria. Las anuladas aparecen tachadas, con el estado «Anulada».
   - El ícono de filtros abre una vista con chips y la cantidad de cada opción. Las cantidades de cada grupo suman el total. El botón dice «Ver N ventas».
   - El cajero ve solo su caja, igual que hoy.
9. **Detalle de venta.** Datos, artículos y pagos. El botón es «Reimprimir ticket» en la APK y «Compartir ticket» en la webapp. Debajo, el enlace «Anular venta», solo con permiso.
10. **Anular venta.** Resumen (total, medio, comprobante y stock que vuelve), motivo, observación y el botón rojo «Anular venta #N».
11. **Caja.** Con la caja abierta:
    - Bloque «Caja #N»: efectivo esperado, fondo inicial, ventas en efectivo, ingresos y egresos, y el botón «Cerrar caja».
    - Bloque «Cobrado en el turno», en filas.
    - Bloque «Movimientos», con el botón «Registrar movimiento».
    
    Con la caja cerrada: último cierre, su diferencia y «Abrir caja».
12. **Abrir caja.** Cajero, sucursal y hora; «Efectivo para empezar el turno»; observación; y el botón «Abrir caja con $ X».
13. **Cerrar caja (arqueo).** Lleva:
    - Datos: «Debería haber», ventas, facturado y fondo inicial.
    - «Efectivo contado», con la diferencia calculada en vivo: rojo si no da cero, verde si da cero.
    - «Motivo de la diferencia», que aparece solo si hay diferencia.
    - Cobrado en el turno.
    - Botón «Cerrar la caja».
14. **Movimiento de caja.** Selector Egreso / Ingreso, importe, motivos (los 5 de `PosMovimientosDialog`), otro motivo y el botón «Registrar egreso de $ X».
15. **Productos.** Buscador con escáner y chips con su cantidad (Todos, Con stock, Sin stock). Cada fila muestra rubro, código, precio y stock. Para el dueño hay un «+» en la barra que abre Nuevo producto.
16. **Ficha de producto.** Foto, nombre, código y rubro, precio contado, precio lista, costo (solo el dueño) y stock por sucursal en filas. El dueño ve «Editar producto»; el cajero, «Agregar a la venta».
17. **Nuevo / Editar producto.** Una sola vista con scroll:
    - Fotos: el primer tile es «Agregar foto» y abre la cámara. La primera foto es la principal.
    - Descripción y código de barras con escáner.
    - Rubro y marca.
    - Costo y % de ganancia; precio contado y precio lista.
    - Stock por sucursal.
    - Activo y Controla stock.
    - «Guardar producto».
    
    Al editar, aparece al final el enlace «Dar de baja el producto». Lo que en escritorio está en «Más datos» (proveedor, garantía, ubicación, kit) no entra en el teléfono: se edita en escritorio.
18. **Asistente.** Las sugeridas son las del código, según el rol. La respuesta lleva cifra y filas. La entrada es «Ventas, caja, cierres, stock» con un botón de enviar. El dueño ve el medidor «USD x de y».
19. **Pedidos web.** Chips por estado con su cantidad, y en cada fila cliente, entrega, pago e importe.
20. **Cajas (dueño).** Abiertas, con el esperado, y cerradas, con la diferencia.
21. **Más.** Ver 2.1.

---

## 3. La APK

### 3.1 Decisión pendiente del usuario (no la tomé yo)

**Hoy ya hay una APK Capacitor** (`capacitor.config.json`, `scripts/build-apk.mjs`, `apk:build`, la página `/app/install` y `AppApkPrompt`). Se distribuye por fuera de Play y ya tiene sesión persistente, huella en el shop y cámara.

El método del workspace (`orchestrator/METODO-MOVIL.md`) dice que **Capacitor sirve solo para distribución interna** y que para Play va Flutter, porque Play rechaza una web empaquetada por la política de funcionalidad mínima. El pedido es Flutter en `movil/`. Antes de escribir código, el usuario tiene que decidir:

1. **El destino.** ¿Google Play, o sigue por descarga directa (sideload) para el personal del comercio? Si es sideload, Capacitor alcanza y Flutter es un costo que no hace falta pagar: Capacitor ya da cámara y huella, y lo que falta (impresión Bluetooth, push y caché sin conexión) se le puede sumar con plugins. Si es Play (por ejemplo, para el SaaS de POS 360 con varios comercios), va Flutter.
2. **La transición.** Qué pasa con la APK Capacitor instalada hoy en los teléfonos: se reemplaza con el mismo `applicationId` `com.sanjuantecnologia.app` (requiere la misma firma), o la nueva usa otro ID y conviven un tiempo.
3. **La página `/app/install` y el aviso `AppApkPrompt`.** Si la app pasa a Play, la página apunta a la ficha de Play y el aviso deja de ser invasivo (R4).

Esta especificación supone **Flutter para Play**, como se pidió. Las pantallas y los textos son los mismos en cualquiera de los dos caminos.

### 3.2 Qué hace la APK además de la webapp

| Función | Cómo | Dependencia |
|---|---|---|
| **Escáner de códigos** | Cámara nativa (familia `mobile_scanner` o ML Kit barcode): EAN-13, EAN-8, Code 128, QR. Vibración y sonido al leer, linterna y lectura continua en Vender. | Permiso `CAMERA` (declararlo en Data safety). |
| **Impresión de tickets** | Impresora térmica Bluetooth de 58 y 80 mm, por ESC/POS. Se **porta a Dart la lógica de `pos/utils/escpos.js`** (renglones, ancho de papel, corte) con el mismo contenido de ticket; no cambia el canal. La impresora se elige en Más › Impresión. | Permisos `BLUETOOTH_CONNECT` y `BLUETOOTH_SCAN`. Ver el riesgo de 16 KB en 3.5. |
| **Notificaciones** | Push por FCM: venta registrada (para el dueño, configurable), pedido web nuevo, derivación despachada o recibida, cierre de caja con diferencia. Cada aviso abre el **listado filtrado**. | **Backend** (ver 3.4). |
| **Huella para entrar** | `local_auth`. El token se guarda en `flutter_secure_storage` y la huella lo desbloquea. Se puede apagar en Más › Cuenta. | Ninguna: la API ya usa Bearer (`app/api/http.js:86`). |
| **Uso sin conexión, mínimo** | El catálogo (nombre, código, precio, stock de la sucursal) queda en caché local y se refresca al abrir y cada 15 min. La venta en curso se guarda como borrador. Sin red, se puede buscar, escanear, consultar precio y armar la venta. | Ninguna. |
| **Sin cobro sin conexión** | Es una decisión, no un olvido. Sin red, «Cobrar» queda deshabilitado y la barra muestra «Sin conexión». Este POS ya tuvo problemas de cobro duplicado e idempotencia (ver `pos360-saas/qa/idempotencia.mjs` y `recarga.mjs`), y cobrar sin conexión exige numeración y stock reservados del lado del servidor. | |
| **Foto de producto** | Cámara nativa con recorte 1:1 y compresión antes de subir (`POST /products/:id/images`). | Permiso `CAMERA`. |

### 3.3 Pantallas nativas y pantallas web

Para pasar la revisión de Play, la WebView tiene que ser **marginal**: lo que se usa todo el día va nativo.

| Nativa (Flutter) | WebView dentro de la app (misma sesión, Bearer inyectado) |
|---|---|
| Ingreso y huella | Tienda: Marca, Contacto, Redes, Vista al compartir, Pagos, Links, Galería |
| Inicio (dueño) y Avisos | Sistema: Usuarios, Parámetros de precios, Medios de pago, Fiscal, Alertas Telegram |
| Vender, escáner, venta en curso | Gestión de contenidos (videos) |
| Cobrar (4 pasos) y Venta registrada con impresión | Reportes, Presupuestos, Proveedores, Categorías, Etiquetas, Clientes |
| Ventas, filtros, detalle, anular | Derivaciones (hasta portarla) |
| Caja: estado, abrir, cerrar y movimiento; Cajas (dueño) | |
| Productos, ficha, nuevo y editar con foto | |
| Pedidos web (lista y detalle) | |
| Asistente | |
| Más, Impresión y Perfil | |

- La WebView abre la ruta `/app/...` de la webapp con el layout móvil corregido (sección 4) y **sin su propia barra superior ni inferior**. La barra la pone la app: la webapp detecta el `User-Agent` o un parámetro `?embed=1`.
- Hay un riesgo con Play: si el revisor entra solo a Tienda o a Sistema, ve web. Por eso **lo que muestra la ficha de Play y la prueba cerrada** tiene que ser Vender, Cobrar, Caja y escáner, que son nativos.

### 3.4 Arquitectura Flutter

```
movil/                          (carpeta del objeto, junto a pos360-commerce-frontend)
  pubspec.yaml
  android/app/build.gradle.kts  applicationId (ver 3.1), minSdk 24, targetSdk vigente de Play
  lib/
    main.dart
    app/            router (go_router), tema (ThemeExtension con los tokens de 2.3), shell con barra inferior por rol
    api/            cliente HTTP (dio) con Bearer, reintento y clave de idempotencia en POST /pos/sales
    auth/           login, huella (local_auth), almacenamiento seguro
    vender/         catálogo, búsqueda, escáner, carrito (estado + borrador local)
    cobro/          4 pasos, medios desde /pos/context, comprobante
    ventas/         lista, filtros, detalle, anular
    caja/           estado, abrir, cerrar (arqueo), movimientos
    productos/      lista, ficha, formulario, fotos
    asistente/      hilo y sugeridas
    avisos/         FCM, lista y ruteo al listado filtrado
    impresion/      ESC/POS portado de escpos.js + transporte Bluetooth
    web/            WebView (familia webview_flutter) para las pantallas de la columna derecha de 3.3
    offline/        caché del catálogo (sqlite / drift) y cola de lectura
```

**Endpoints que ya existen** (API `src/routes`, todos bajo `/api/v1`):
- `POST /auth/login`, `GET /auth/me`.
- `GET /pos/context`, `GET /pos/products`, `POST /pos/sales`, `GET /pos/sales`, `GET /pos/sales/stats`, `GET /pos/sales/facets`, `GET /pos/sales/:id`, `DELETE /pos/sales/:id`.
- `GET /pos/cash-registers/current`, `POST /pos/cash-registers/open`, `GET /pos/cash-registers/:id/summary`, `POST /pos/cash-registers/:id/movements`, `POST /pos/cash-registers/:id/close`.
- `GET|POST|PATCH /products`, `GET /products/:id/branches`, `POST /products/:id/images`.
- `GET /dashboard/overview|sales`.
- Asistente: el mismo proxy que usa `AsistentePage`.

**Lo que falta en el backend.** Va primero, por el paso 2 del método: el contrato con el backend se resuelve antes de la primera pantalla.
1. `POST /me/devices` y `DELETE /me/devices/:id`: registrar o quitar el token FCM del teléfono, con la plataforma y la sucursal.
2. Enviar el push desde el servidor en estos casos:
   - `createPosSale`: venta registrada, para dueños con el aviso activo.
   - Creación y pago de un pedido web en `ecomCheckout` / `ecomPayments`.
   - Los tres eventos `transfer:*` que ya existen por socket.
   - El cierre de caja con diferencia distinta de cero.
3. Clave de idempotencia en `POST /pos/sales` (encabezado `Idempotency-Key`), si todavía no existe. Es lo que protege el doble toque en el teléfono.
4. Cuenta de Firebase y `google-services.json`: el usuario crea el proyecto, y la clave de servidor va al `.env` de la API más `boveda respaldar`.

### 3.5 Play y mantenimiento (de `METODO-MOVIL.md`)

- Se publica como AAB firmado con Play App Signing. La upload key va con los secretos del objeto y `boveda respaldar`, **nunca a git**.
- `targetSdk` vigente.
- Páginas de memoria de **16 KB**: obligatorias desde el 1/2/2027. Hay que revisar los plugins con `.so` propias (escáner, Bluetooth, sqlite) y probar en un emulador `ps16k`.
- Permisos declarados y justificados: cámara, Bluetooth y notificaciones. No pedir ubicación.
- Data safety coherente con lo que se envía (ventas, fotos de producto y token de dispositivo). Política de privacidad publicada.
- Prueba cerrada con testers antes de producción, si la cuenta es personal y nueva.
- Las actualizaciones se avisan dentro de la app con `in_app_update`.
- Liberar en Play requiere **autorización explícita del usuario**.

---

## 4. Especificación para la webapp (Vue)

Va en una rama propia, desde `main` actualizado. **El escritorio no cambia**: todo lo de abajo vale por debajo del corte móvil.

### 4.1 Base
1. `vuetify.js`:
   - `display: { mobileBreakpoint: 'md' }`.
   - En `adminDark` y `shopDark`: `background: '#111317'`, `surface: '#1f232a'`, `surface-bright: '#262a32'`, `surface-variant: '#2a2f38'`.

   Antes de cambiar los tokens oscuros, verificar que las tarjetas pinten con `var(--v-theme-surface)` y no con un hex propio, porque si no el contraste empeora.
2. `index.html`: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">`.
3. Archivo nuevo `src/app/theme/movil.css` con los tokens de 2.3 como variables `--m-*`, cargado una sola vez.

### 4.2 Navegación
1. Reescribir `AppBottomNav.vue`:
   - Dos juegos de destinos según `auth.isCajero` (tabla 2.1).
   - Quitar el FAB y la hoja «¿Qué querés hacer?».
   - Badge en Más con `transferUnreadCount` y los pedidos sin preparar.
2. Ruta nueva `/app/mas`, `name: 'mas'`, componente `MasPage.vue`: la lista de 2.1 con los mismos `v-if` del drawer.
3. `AppShell.vue`:
   - En el teléfono, mostrar la píldora de caja (`cajaNav`) en la barra y ocultar fecha y pantalla completa.
   - Cambiar «Mi perfil» por «Perfil».
   - Ocultar la barra inferior en las rutas con `meta.fullPage` y en las vistas completas nuevas (`meta.movilCompleta: true`).
4. `DashboardMobileHome.vue`: arreglar B1. Todas las rutas van por `name`: `pos`, `posSales`, `transfers`, `adminCashRegisters` / `caja`, `products` con `query: { filter: 'out_of_stock' }`. Rearmar con los bloques de 2.4 punto 2: Caja primero; sin tarjetas de KPI 2×2; sin saludo.

### 4.3 Rutas nuevas (vista completa en el teléfono, sin cambios en escritorio)

| Ruta | Nombre | Reemplaza en el teléfono |
|---|---|---|
| `/app/pos/cobrar` | `posCobrar` | `CheckoutDialog` (se reusan las screens con un layout de página y pasos) |
| `/app/pos/venta` | `posCarrito` | hoja del carrito de `PosMobileLayout` |
| `/app/caja` | `caja` | hoja «Estado de caja» |
| `/app/caja/abrir` | `cajaAbrir` | `PosCajaConfigDialog` |
| `/app/caja/cerrar` | `cajaCerrar` | `PosCajaArqueoDialog` (B3) |
| `/app/caja/movimiento` | `cajaMovimiento` | `PosMovimientosDialog` (B4) |
| `/app/pos/sales/:id/anular` | `posSaleAnular` | anulación en línea |
| `/app/admin/clientes/:id/editar` | `adminCustomerEdit` | diálogo de `CustomersAdminPage:439` |

En escritorio, `PosPage` sigue abriendo los diálogos de siempre (excepción de la barra de teclas). En el teléfono, el mismo disparador hace `router.push`. El estado del carrito ya vive en `pos.store`, así que pasar a una ruta no lo pierde.

### 4.4 Listados
- Clientes (B6), Cajas (B7), Pedidos, Usuarios, Derivaciones, Medios de pago: a 390 px, **tarjetas de dos renglones** en lugar de tabla, como ya hace `PosSalesPage`. Cada tarjeta abre el detalle.
- Derivaciones: revivir la vista móvil de `TransferForm.vue` en lugar de tirarla.
- Inputs con `min-width` (B9): pasar a `width:100%`.

### 4.5 Barrido de textos (todo el sistema)
Pasar todo el sistema a registro impersonal, quitar textos de ayuda y em-dash, y llevar los radios a 14 como máximo, según 1.3. Algunos reemplazos exactos:

| Hoy | Queda |
|---|---|
| Elegí medio de pago | Medio de pago |
| Ingresá con tu cuenta para continuar | (se quita) |
| Bienvenido de nuevo | (se quita) |
| Escribí ELIMINAR para confirmar | Confirmación |
| Podés seguir sin cliente | (se quita) |
| Vacío. Agregá productos del catálogo. | Sin artículos |
| Sin movimiento hace X — ¿querés cerrar caja? | Sin movimiento desde HH:MM |
| Agregá productos al carrito antes de cobrar | (el botón Cobrar queda deshabilitado) |
| Elegí sucursal | Sucursal |
| Permití el acceso a la cámara… | Sin acceso a la cámara |
| Probá de nuevo | Reintentar |
| `${name} — abriendo…` | `${name}` |
| BORRAR Atrás / ENTER Siguiente (en el teléfono) | (flecha de volver) / Siguiente |
| Cobrar F9 (en el teléfono) | Cobrar |
| Mi perfil | Perfil |
| POS 360 — Desarrollado por… | POS 360 · San Juan Tecnología |

---

## 5. Textos exactos de la interfaz (webapp y APK)

Los dos desarrolladores usan **los mismos textos**. Los montos van como `$ 31.900`, con punto de miles y sin decimales salvo que los haya. Los negativos van como `− $ 2.300`.

**Barra inferior.** Inicio · Vender · Ventas · Caja · Productos · Más

**Ingreso**
- Usuario o email · Contraseña · Mantener sesión · Entrar
- APK: Entrar con huella · Usar contraseña · Entrar con huella la próxima vez
- Errores: Usuario o contraseña incorrectos · Sin conexión

**Inicio**
- Bloques: Caja #N abierta · Desde HH:MM · {cajero} · Efectivo esperado · Caja cerrada
- Ventas de hoy · N ventas · Ayer a esta hora: $ X
- Medios de pago · Hoy
- Pendientes: Pedidos web · Sin preparar · Derivaciones · Por recibir · Sin stock
- Últimas ventas · Ver todas
- Avisos: Hoy · Ayer

**Vender**
- Vender · Caja #N · Caja cerrada
- Buscar producto o código
- Todos · {rubros}
- N u. · Sin stock
- 1 artículo · N artículos · Cobrar
- Aviso breve: {producto} agregado
- Venta en curso: Cliente · Consumidor final · Precio · Lista · Sin artículos
- Sin caja abierta: el botón dice Abrir caja y lleva a Abrir caja

**Cobrar**
- Cobrar · Total
- Pasos: Medio de pago · {medio} · Comprobante · Confirmar
- Medios: Efectivo · Débito · Crédito · Transferencia · Mercado Pago · Mixto
- Efectivo recibido · Exacto · Vuelto · Falta $ X
- Cuotas · 1 pago · N cuotas · Recargo N %
- Número de operación · Opcional
- Comprobante:
  - No fiscal · Sin comprobante ARCA
  - Factura B · Consumidor final / Exento
  - Factura A · Responsable inscripto
  - Factura C · Monotributo
- Cliente: DNI / CUIT / CUIL · Nombre / Razón social · Teléfono
- Confirmar: Total a cobrar · Medio de pago · Recibido · Vuelto · Comprobante · Cliente
- Botones: Siguiente · Confirmar venta
- Resultado: Venta registrada · Venta #N · Imprimir ticket (APK) · Compartir ticket (web) · Enviar por email · Nueva venta
- Errores: Sin conexión · La venta no se registró · Reintentar

**Escáner.** Escanear · Ingresar código · Sin acceso a la cámara · Código no encontrado

**Ventas**
- Ventas · Hoy · Ayer · 7 días · Este mes · Fecha
- Total · N ventas · N anuladas · Pagada · Anulada
- Filtros:
  - Grupos: Medio de pago · Cajero · Estado · Comprobante
  - Botón: Ver N ventas
- Detalle: Venta #N · Fecha · Cajero · Caja · Comprobante · Cliente · Artículos · Total · Reimprimir ticket · Compartir ticket · Anular venta
- Anular venta #N:
  - Datos: Total · Medio de pago · Comprobante · Stock que vuelve
  - Motivo: Error de carga · Devolución del cliente · Cobro duplicado · Otro
  - Observación
  - Botón: Anular venta #N

**Caja**
- Caja · Abierta · Cerrada · Caja #N · {sucursal} · desde HH:MM
- Efectivo esperado · Fondo inicial · Ventas en efectivo · Ingresos · Egresos
- Cerrar caja · Cobrado en el turno · Movimientos · Registrar movimiento
- Último cierre · Diferencia · Abrir caja
- Abrir caja:
  - Cajero · Sucursal · Hora
  - Efectivo para empezar el turno
  - Observación · Opcional
  - Botón: Abrir caja con $ X
- Cerrar caja #N:
  - Debería haber · Ventas · Facturado · Fondo inicial
  - Efectivo contado · Diferencia · Motivo de la diferencia
  - Botón: Cerrar la caja
- Movimiento de caja:
  - Egreso · Ingreso · Importe · Motivo
  - Pago a proveedor · Retiro de efectivo · Gastos del local · Cambio para la caja · Depósito
  - Otro motivo
  - Botón: Registrar egreso de $ X · Registrar ingreso de $ X
- Avisos breves: Caja #N abierta · Caja #N cerrada

**Productos**
- Productos · Buscar nombre, SKU o código · Todos N · Con stock N · Sin stock N
- Ficha: Producto · Código {código} · {rubro} · Precio contado · Precio lista · Costo · Stock por sucursal · N u.
- Botones de la ficha: Editar producto · Agregar a la venta
- Formulario:
  - Nuevo producto · Editar producto
  - Fotos · Agregar foto · Principal
  - Datos · Descripción · Código de barras · Escanear o escribir · Rubro · Marca
  - Precios · Costo · % de ganancia · Precio contado · Precio lista
  - Stock · {sucursal} · Activo · Controla stock
  - Guardar producto · Dar de baja el producto
- Validación: Falta la descripción · Falta el precio

**Asistente**
- Asistente · Sugeridas (las del código, según el rol) · Ventas, caja, cierres, stock · Preguntar
- Mensajes: los de `AsistentePage` que ya están en registro impersonal

**Más**
- Grupos: Operación · Gestión · CRM · Tienda · Sistema · Cuenta
- Destinos: los nombres del drawer de escritorio
- Cuenta: Modo oscuro · Entrar con huella · Avisos de ventas y pedidos · Cerrar sesión

**Notificaciones (APK)**
- Pedido web #N · $ X · {entrega}
- Venta #N · $ X · {medio}
- Derivación #N despachada · {origen} a {destino}
- Derivación #N recibida
- Cierre de caja #N · Diferencia − $ X
- Sin conexión: Sin conexión (barra fina arriba del contenido)

---

## 6. Orden de trabajo sugerido

1. **Webapp, primero.** B1 (Inicio roto) y B2 (barra con Más) son chicos y destraban el teléfono hoy. Después el corte `mobileBreakpoint` y el tema oscuro.
2. **Webapp: vistas completas** de caja (B3, B4) y cobro (B5). Hay que probarlas en la instancia de QA (`demo-qa`, arnés `pos360-saas/qa/`: smoke, idempotencia, recarga), **no contra comercios reales**.
3. **Webapp:** barrido de textos y radios por sistema, y listados en tarjetas.
4. **Decisión 3.1** del usuario.
5. **Backend:** dispositivos, FCM e idempotencia.
6. **Flutter:** scaffold, después ingreso con huella, Vender con escáner, Cobrar, Caja, Ventas, Productos con foto, Avisos, Impresión, WebView. Cada pantalla se verifica en el teléfono contra la API real.
