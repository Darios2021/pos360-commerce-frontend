// src/modules/pos/config/posShortcuts.config.js
//
// Fuente UNICA de verdad de los atajos F1..F12 del POS.
// La consumen:
//   - PosTopBar.vue            (renderiza botones y atajos globales)
//   - modales/PosAyudaDialog   (F1, el listado de teclas)
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
// El orden de los grupos y de las teclas es el orden de la barra: de lo que
// se usa en cada venta a lo que se usa rara vez (maqueta aprobada 10/10).
export const POS_SHORTCUT_GROUPS = [
  { id: "clave",   label: "En cada venta" },
  { id: "venta",   label: "Algunas ventas" },
  { id: "caja",    label: "Una vez por turno" },
  { id: "sistema", label: "Rara vez" },
];

// Todas abren y cierran su ventana con la misma tecla (toggle), salvo F5
// (acción puntual) y F11 (pantalla completa).
export const POS_SHORTCUTS = [
  { key: "F2", event: "find-product", label: "Buscar", icon: "mdi-magnify", color: "hk-find", group: "clave", clave: true,
    description: "Nombre, código o lector", tooltip: "Buscar producto (F2)", allowInInput: true, toggle: true },
  { key: "F9", event: "pay", label: "Cobrar", icon: "mdi-cash-register", color: "hk-pay", group: "clave", clave: true,
    description: "Medio, vuelto y comprobante", tooltip: "Cobrar (F9)", allowInInput: true, toggle: true },
  { key: "F6", event: "show-cart", label: "Carrito", icon: "mdi-cart-outline", color: "hk-cart", group: "venta",
    description: "Cantidades y quitar", tooltip: "Carrito (F6)", allowInInput: true, toggle: true },
  { key: "F3", event: "new-customer", label: "Cliente", icon: "mdi-account-plus-outline", color: "hk-customer", group: "venta",
    description: "Buscar o dar de alta", tooltip: "Cliente (F3)", allowInInput: true, toggle: true },
  { key: "F8", event: "clear-cart", label: "Vaciar", icon: "mdi-backspace-outline", color: "hk-clear", group: "venta",
    description: "Pide confirmar", tooltip: "Vaciar carrito (F8)", allowInInput: true, toggle: true },
  { key: "F10", event: "movements", label: "Movimientos", icon: "mdi-cash-sync", color: "hk-movements", group: "caja",
    description: "Ingresos y egresos", tooltip: "Movimientos de caja (F10)", allowInInput: true, toggle: true },
  { key: "F7", event: "cash", label: "Caja", icon: "mdi-lock-open-variant-outline", color: "hk-cash", group: "caja",
    description: "Abrir o cerrar el turno", tooltip: "Caja (F7)", allowInInput: true },
  { key: "F5", event: "refresh", label: "Actualizar", icon: "mdi-refresh", color: "hk-refresh", group: "sistema", soloIcono: true,
    description: "Precios y stock al día", tooltip: "Actualizar catálogo (F5)", allowInInput: false },
  { key: "F11", event: "fullscreen", label: "Pantalla completa", icon: "mdi-fullscreen", color: "hk-fullscreen", group: "sistema", soloIcono: true,
    description: "Ocupa toda la pantalla", tooltip: "Pantalla completa (F11)", allowInInput: true, localOnly: true, toggle: true },
  { key: "F1", event: "help", label: "Ayuda", icon: "mdi-help-circle-outline", color: "hk-help", group: "sistema", soloIcono: true,
    description: "Esta lista", tooltip: "Teclas del POS (F1)", allowInInput: true, toggle: true },
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
