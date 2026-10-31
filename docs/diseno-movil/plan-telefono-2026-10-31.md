# POS 360 en el teléfono: plan de programación (2026-10-31)

Lo que se definió con el usuario el 2026-10-31, parte por parte, sobre la maqueta aprobada de
`diseno-movil`. Cada parte tiene su lienzo aprobado (enlaces en `asd2a12/CLAUDE.md`, sección Decisiones).

## Decisiones que cambian la maqueta

- **En el teléfono no se vende.** Salen Vender, Cobrar, el carrito y el botón «Agregar a la venta».
- **Barra inferior:** Inicio · Ventas · Productos · Asistente · Más. El técnico tiene Órdenes en lugar de
  Ventas. El escáner deja de ser un botón de la barra: vive en el buscador de Productos y en el «+».
- **Inicio no es un tablero:** banda de marca con el número del día y contadores que filtran, y la
  actividad del día debajo. Uno por perfil (dueño, admin de sucursal, cajero, técnico).
- **Asistente** pasa a ser pestaña de la barra (en el teléfono deja de ser vista completa con volver).
- **Más:** sale Asistente, entra Servicio técnico; el cajero tiene Caja (abrir, movimientos y cierre).

## Hoy en producción (punto de partida)

- Barra: Inicio · Productos · Escanear · Derivaciones · Más (`AppBottomNav.vue`).
- Inicio: `DashboardMobileHome.vue`, con forma de tablero (caja, ventas de hoy con columnas, medios,
  pendientes, últimas ventas).
- Ventas: tarjetas viejas por debajo de 900 px. Detalle y ficha de producto: pantallas de escritorio.
- Ya existen: lector (`lector`), consulta por código (`productoConsulta`, `GET /products/by-code/:code`),
  Caja móvil (`/caja`), Más (`MasPage.vue`), Asistente (`AsistentePage.vue`), Servicio técnico
  (`serviceOrders`, estados reales, aviso por WhatsApp).

## Fases

Cada fase: programar en local, revisar a 390 px en claro y oscuro para cada perfil, publicar con el ok del
usuario y anotar en el `CHANGELOG.md`.

1. **Barra y Más.** Barra nueva por perfil; escáner al buscador de Productos y al «+»; Asistente como
   pestaña; Más sin Asistente, con Servicio técnico y con Caja para el cajero.
2. **Inicio por perfil.** Banda, contadores que filtran y actividad del día. Fuentes: `GET /pos/sales`,
   pedidos web (`/admin/shop/orders`), órdenes (`/admin/service/orders`, `stats`) y derivaciones. «Sin
   stock» queda en el contador, no en la lista (no hay registro por evento). Reemplaza el Inicio actual.
3. **Ventas.** Chips de período, Total con filas por medio de pago, lista por franja horaria, Filtros a
   pantalla completa («Ver N ventas»), Detalle («Compartir ticket») y Anular (motivo y observación, la API
   ya los guarda). El cajero ve solo su caja.
4. **Productos.** Listado con chips (Todos, Con stock, Sin stock) y escáner en el buscador; ficha (dueño
   con costo y «Editar producto», cajero solo consulta); Nuevo / Editar en una sola vista con scroll.
5. **Alta con escáner y cámara.** Escanear → si el código existe, el producto con precio y stock por
   sucursal; si no, Nuevo producto con el código puesto. Varias fotos con recorte 1:1, la primera
   principal, comprimidas antes de subir. Descripción a mano en esta fase.
6. **Avisos, Pedidos web y Cajas del dueño** (pantallas 3, 19 y 20).
7. **Órdenes del técnico.** Mis órdenes con chips por estado, ficha con el recorrido de los 7 estados y un
   botón con el paso siguiente, y Presupuestar en una vista (pasa a Presupuestado y avisa por WhatsApp).
8. **Cierre.** Ventanas emergentes sensibles a vista completa (cliente, usuario, sucursal, pedido,
   consulta) y barrido de voseo, em-dash y radios en lo que se tocó.

## Después (necesitan una decisión aparte)

- **IA que completa el alta desde la foto de la caja** (descripción, marca, rubro): hay que conectar un
  servicio de IA con visión en la API; tiene costo por foto. El diseño ya está aprobado.
- **Registro de «se quedó sin stock» por evento**, para que entre en la actividad del Inicio.
- Probar en un teléfono real: cámara, teclado en pantalla y zona segura del iPhone.

## Estado al 2026-10-31 (programado en local, sin verificar con sesión)

| Fase | Commit | Qué quedó |
|---|---|---|
| 1 | `b2e747e` | `AppBottomNav.vue` por perfil; `MasPage.vue` sin Vender, con Servicio técnico y Caja. |
| 2 | `1e6fa64` | `InicioMovil.vue` (reemplaza a `DashboardMobileHome` en `DashboardHome`); `useEsTecnico.js`. |
| 3 | `850ca24`, siguiente | `VentasMovil.vue` en `PosSalesPage` (< 960 px); detalle de venta en piezas del kit. Anular ya era vista completa (`PosAnularVentaPage`). |
| 4 y 5 | `c9ba22c` | Ficha sin "Agregar a la venta"; el "+" de Productos abre el lector; "Sin código" en el lector. El alta sigue en el formulario de pasos (la vista única con scroll queda pendiente). |
| 6 | `e05eb6a` | Pedidos web y Cajas del dueño en formato teléfono. Avisos (pantalla 3) no se hizo: la actividad del Inicio cubre lo mismo; confirmar con el usuario si sigue haciendo falta. |
| 7 | `4ca2b5e` | Órdenes: listado con las vistas de la API (En el taller, Listos, Presupuestadas, Sin retirar) y ficha con recorrido de 7 estados y el paso de ahora. |
| 8 | — | Sin hacer: ventanas emergentes a vista completa y barrido de textos. |

Falta verlo en el teléfono con sesión iniciada (dueño, admin, cajero y técnico) antes de publicar.
