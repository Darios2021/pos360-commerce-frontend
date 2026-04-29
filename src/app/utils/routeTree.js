// src/app/utils/routeTree.js
// Árbol único de rutas: label, sección y parent. Usado por:
//   - AppShell.vue (breadcrumbs en el header global)
//   - AppPageHeader.vue (breadcrumbs y botón volver por vista)
// Mantenelo en sincronía cuando agregues una ruta nueva al router.

export const ROUTE_TREE = {
  home:                     { label: "Dashboard" },
  pos:                      { label: "Punto de Venta" },
  posSales:                 { label: "Ventas" },
  posSaleDetail:            { label: "Detalle de venta", parent: { label: "Ventas",     to: { name: "posSales" } } },
  products:                 { label: "Productos",       section: "Gestión" },
  productNew:               { label: "Nuevo producto",  section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  productEdit:              { label: "Editar producto", section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  productView:              { label: "Ver producto",    section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  productsImport:           { label: "Importar CSV",    section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  productsLabels:           { label: "Etiquetas",        section: "Gestión", parent: { label: "Productos", to: { name: "products" } } },
  transfers:                { label: "Derivaciones",    section: "Gestión" },
  reports:                  { label: "Reportes",        section: "Gestión" },
  stock:                    { label: "Stock",           section: "Configuración" },
  inventory:                { label: "Inventario",      section: "Configuración" },
  categories:               { label: "Categorías",      section: "Configuración" },
  adminFiscal:              { label: "Fiscal",          section: "Configuración" },
  adminPaymentMethods:      { label: "Medios de pago",  section: "Configuración" },
  adminCashRegisters:       { label: "Cajas",           section: "Gestión" },
  adminCashRegisterDetail:  { label: "Detalle de caja", section: "Gestión", parent: { label: "Cajas", to: { name: "adminCashRegisters" } } },
  adminTelegram:            { label: "Alertas Telegram",section: "Configuración" },
  users:                    { label: "Usuarios",        section: "Configuración" },
  profile:                  { label: "Mi perfil" },
  shopBranding:             { label: "Branding",        section: "Tienda" },
  shopOrders:               { label: "Pedidos",         section: "Tienda" },
  shopPaymentsSettings:     { label: "Pagos",           section: "Tienda" },
  shopLinks:                { label: "Links",           section: "Tienda" },
  adminGaleriaMultimedia:   { label: "Galería multimedia", section: "Tienda" },
  adminCustomers:           { label: "Clientes",        section: "CRM" },
  adminCustomerDetail:      { label: "Detalle cliente", section: "CRM", parent: { label: "Clientes", to: { name: "adminCustomers" } } },
  emailPromoBlocks:         { label: "Promociones email", section: "CRM" },
};

/**
 * Devuelve los breadcrumbs para una ruta dada como array de
 * `{ label, to? }`. El último item siempre es la página actual.
 *
 * Reglas:
 *   - Si el nodo tiene `section`, se prepende como crumb sin link.
 *   - Si el nodo tiene `parent`, se prepende con su label y `to`.
 *   - Para `home`, opcionalmente concatena el tab activo.
 */
export function getBreadcrumbs(routeName, query = {}, tabLabels = {}) {
  const tree = ROUTE_TREE[String(routeName || "")];
  if (!tree) return [];

  const crumbs = [];
  if (tree.section) crumbs.push({ label: tree.section });
  if (tree.parent)  crumbs.push(tree.parent);
  crumbs.push({ label: tree.label });

  if (routeName === "home") {
    const tabLabel = tabLabels[query.tab];
    if (tabLabel) crumbs.push({ label: tabLabel });
  }
  return crumbs;
}

/** Atajo para conocer el parent (si existe). */
export function getParent(routeName) {
  return ROUTE_TREE[String(routeName || "")]?.parent || null;
}
