// src/app/router/shopAdmin.routes.js
// ✅ COPY-PASTE FINAL COMPLETO (cuelga bajo /app/*)

import ShopBrandingView from "@/modules/admin/pages/ShopBrandingView.vue";

// ✅ LISTADO / BANDEJA de pedidos (TU VISTA)
import ShopOrdersView from "@/modules/admin/pages/ShopOrdersView.vue";
import ShopOrderDetailView from "@/modules/admin/pages/ShopOrderDetailView.vue";
// (si preferís la otra, cambiá ShopOrdersView por ShopOrdersInboxView)
// import ShopOrdersInboxView from "@/modules/admin/pages/ShopOrdersInboxView.vue";

// ✅ Settings (solo los que tienen backend real)
import ShopPaymentsSettingsView from "@/modules/admin/pages/ShopPaymentsSettingsView.vue";

// ✅ Links Tienda
import ShopLinksView from "@/modules/admin/pages/ShopLinksView.vue";

// ✅ Galería Multimedia
import GaleriaMultimediaView from "@/modules/admin/pages/GaleriaMultimediaView.vue";

// ✅ CRM email PRO
import EmailPromoBlocksView from "@/modules/admin/pages/EmailPromoBlocksView.vue";

export const shopAdminRoutes = [
  {
    path: "admin/shop/branding",
    name: "shopBranding",
    component: ShopBrandingView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  // ✅ PEDIDOS (LISTADO REAL) — mantengo `shopOrders` por compatibilidad
  // con AppShell y otros lugares que ya navegan a ese name.
  {
    path: "admin/shop/orders",
    name: "shopOrders",
    component: ShopOrdersView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  // ✅ PEDIDOS (DETALLE FULL VIEW — no modal)
  {
    path: "admin/shop/orders/:id",
    name: "shopOrderDetail",
    component: ShopOrderDetailView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
    props: true,
  },

  {
    path: "admin/shop/payments",
    name: "shopPaymentsSettings",
    component: ShopPaymentsSettingsView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  {
    path: "admin/shop/links",
    name: "shopLinks",
    component: ShopLinksView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  {
    path: "admin/galeria-multimedia",
    name: "adminGaleriaMultimedia",
    component: GaleriaMultimediaView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  // ✅ CRM email PRO: bloques promocionales reutilizables
  {
    path: "admin/email/promociones",
    name: "emailPromoBlocks",
    component: EmailPromoBlocksView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
];
