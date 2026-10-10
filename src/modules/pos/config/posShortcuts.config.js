// src/modules/pos/config/posShortcuts.config.js
//
// Fuente UNICA de verdad de los atajos F1..F12 del POS.
// La consumen:
//   - PosTopBar.vue            (renderiza botones y atajos globales)
//   - PosShortcutsHelpDialog   (arma el listado de ayuda)
//
// Contrato de cada entrada:
//   key         : 'F1'..'F12'
//   event       : nombre del evento que PosTopBar emite al padre
//                 (null si la accion se resuelve en el propio PosTopBar,
//                  ej. fullscreen)
//   label       : texto corto mostrado en el boton (visible en >=1200px)
//   icon        : mdi-* icon
//   color       : clase CSS interna del PosTopBar (hk-*)
//                 mapeada a tokens semanticos del tema
//   group       : 'utility' | 'search' | 'cart' | 'cash' | 'sales' | 'system'
//   description : texto largo usado en el dialog de ayuda
//   tooltip     : texto corto del tooltip (suele ser label + (Fn))
//   holdActive  : si true, queda resaltado mientras no se active otra.
//                 util para el atajo "principal" (busqueda).
//   allowInInput: si true, el atajo funciona aunque haya un input focuseado.
//                 Por defecto las F-keys se bloquean si se esta editando.
//                 F1/F2 siempre son true (ayuda y buscador deben funcionar
//                 aunque el cajero este tipeando).
//   toggle      : si true, la F-key abre/cierra la misma UI (toggle).
//                 El padre (PosTopBarSection) usa esta info en el handler.
//                 Tambien se usa para que el listener global NO bloquee la
//                 F-key de un dialog toggleable mientras esta abierto.

// El orden de los grupos es el orden de la barra (como Zondito: buscar,
// venta, caja, cobrar y al final ayuda y pantalla).
export const POS_SHORTCUT_GROUPS = [
  { id: "search",  label: "Busqueda" },
  { id: "cart",    label: "Venta" },
  { id: "cash",    label: "Caja" },
  { id: "sales",   label: "Cobro" },
  { id: "system",  label: "Sistema" },
  { id: "utility", label: "Ayuda" },
];

// Solo las F-keys que tienen una acción real conectada en PosTopBarSection.
// Las toggle abren y cierran su ventana; F3 va a la ficha completa de
// clientes (el carrito queda en el store y se recupera al volver); F8 pide una
// segunda pulsación antes de vaciar.
export const POS_SHORTCUTS = [
  {
    key: "F1",
    event: "help",
    label: "Ayuda",
    icon: "mdi-help-circle-outline",
    color: "hk-help",
    group: "utility",
    description: "Mostrar u ocultar la ayuda de atajos del POS.",
    tooltip: "Ayuda rapida (F1)",
    holdActive: false,
    allowInInput: true,
    toggle: true,
  },
  {
    key: "F2",
    event: "find-product",
    label: "Buscar",
    icon: "mdi-barcode-scan",
    color: "hk-find",
    group: "search",
    description: "Enfocar el buscador de productos / scanner.",
    tooltip: "Buscar producto (F2)",
    holdActive: true,
    allowInInput: true,
  },
  {
    key: "F3",
    event: "new-customer",
    label: "Cliente nuevo",
    icon: "mdi-account-plus-outline",
    color: "hk-customer",
    group: "cart",
    description: "Dar de alta un cliente en su ficha completa. La venta en curso se conserva.",
    tooltip: "Cliente nuevo (F3)",
    holdActive: false,
    allowInInput: true,
  },
  {
    key: "F4",
    event: "search",
    label: "Consulta",
    icon: "mdi-magnify",
    color: "hk-search",
    group: "search",
    description: "Abrir / cerrar la consulta rapida de productos.",
    tooltip: "Consulta (F4)",
    holdActive: false,
    allowInInput: true,
    toggle: true,
  },
  {
    key: "F5",
    event: "refresh",
    label: "Refrescar",
    icon: "mdi-refresh",
    color: "hk-refresh",
    group: "search",
    description: "Refrescar el catalogo de productos desde el servidor.",
    tooltip: "Refrescar catalogo (F5)",
    holdActive: false,
    allowInInput: false,
  },
  {
    key: "F6",
    event: "show-cart",
    label: "Carrito",
    icon: "mdi-cart-outline",
    color: "hk-cart",
    group: "cart",
    description: "Abrir / cerrar el carrito.",
    tooltip: "Carrito (F6)",
    holdActive: false,
    allowInInput: false,
    toggle: true,
  },
  {
    key: "F8",
    event: "clear-cart",
    label: "Vaciar",
    icon: "mdi-backspace-outline",
    color: "hk-clear",
    group: "cart",
    description: "Vaciar el carrito. Pide una segunda pulsación para confirmar.",
    tooltip: "Vaciar carrito (F8)",
    holdActive: false,
    allowInInput: false,
    confirm: true,
  },
  {
    key: "F7",
    event: "cash",
    label: "Caja",
    icon: "mdi-lock-open-variant-outline",
    color: "hk-cash",
    group: "cash",
    description: "Con la caja cerrada, abrirla. Con la caja abierta, arqueo y cierre.",
    tooltip: "Caja (F7)",
    holdActive: false,
    allowInInput: true,
  },
  {
    key: "F10",
    event: "movements",
    label: "Movimientos",
    icon: "mdi-cash-sync",
    color: "hk-movements",
    group: "cash",
    description: "Ingresos y egresos de efectivo de la caja abierta.",
    tooltip: "Movimientos de caja (F10)",
    holdActive: false,
    allowInInput: true,
    toggle: true,
  },
  {
    key: "F9",
    event: "pay",
    label: "Cobrar",
    icon: "mdi-cash-register",
    color: "hk-pay",
    group: "sales",
    description: "Abrir / cerrar el checkout de la venta actual.",
    tooltip: "Cobrar (F9)",
    holdActive: false,
    allowInInput: true,
    toggle: true,
  },
  {
    key: "F11",
    event: "fullscreen",
    label: "Pantalla",
    icon: "mdi-fullscreen",
    color: "hk-fullscreen",
    group: "system",
    description: "Alternar pantalla completa del navegador.",
    tooltip: "Pantalla completa (F11)",
    holdActive: false,
    allowInInput: true,
    localOnly: true,
    toggle: true,
  },
];

// Helpers --------------------------------------------------------------

export function getShortcutByKey(key) {
  const k = String(key || "").toUpperCase();
  return POS_SHORTCUTS.find((s) => s.key === k) || null;
}

export function groupShortcuts(shortcuts = POS_SHORTCUTS) {
  const groups = new Map();
  for (const g of POS_SHORTCUT_GROUPS) {
    groups.set(g.id, { id: g.id, label: g.label, items: [] });
  }
  for (const s of shortcuts) {
    const bucket = groups.get(s.group);
    if (bucket) bucket.items.push(s);
  }
  return Array.from(groups.values()).filter((g) => g.items.length);
}

export const POS_SHORTCUT_EVENTS = Array.from(
  new Set(
    POS_SHORTCUTS
      .filter((s) => !s.localOnly && s.event)
      .map((s) => s.event)
  )
);
