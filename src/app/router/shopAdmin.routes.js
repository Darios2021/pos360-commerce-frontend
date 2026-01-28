// src/app/router/shopAdmin.routes.js
// ✅ COPY-PASTE FINAL COMPLETO (cuelga bajo /app/*)

import ShopBrandingView from "@/modules/admin/pages/ShopBrandingView.vue";

// ✅ LISTADO / BANDEJA de pedidos (TU VISTA)
import ShopOrdersView from "@/modules/admin/pages/ShopOrdersView.vue";
// (si preferís la otra, cambiá ShopOrdersView por ShopOrdersInboxView)
// import ShopOrdersInboxView from "@/modules/admin/pages/ShopOrdersInboxView.vue";

// ✅ Settings (si existen)
import ShopOrdersSettingsView from "@/modules/admin/pages/ShopOrdersSettingsView.vue";
import ShopShippingSettingsView from "@/modules/admin/pages/ShopShippingSettingsView.vue";
import ShopPickupSettingsView from "@/modules/admin/pages/ShopPickupSettingsView.vue";
import ShopPaymentsSettingsView from "@/modules/admin/pages/ShopPaymentsSettingsView.vue";
import ShopNotificationsSettingsView from "@/modules/admin/pages/ShopNotificationsSettingsView.vue";

// ✅ Links Tienda
import ShopLinksView from "@/modules/admin/pages/ShopLinksView.vue";

// ✅ Galería Multimedia
import GaleriaMultimediaView from "@/modules/admin/pages/GaleriaMultimediaView.vue";

export const shopAdminRoutes = [
  {
    path: "admin/shop/branding",
    name: "shopBranding",
    component: ShopBrandingView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  // ✅ PEDIDOS (LISTADO REAL)
  {
    path: "admin/shop/orders",
    name: "shopOrders",
    component: ShopOrdersView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  // ✅ (Opcional) Settings de pedidos
  {
    path: "admin/shop/orders-settings",
    name: "shopOrdersSettings",
    component: ShopOrdersSettingsView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  {
    path: "admin/shop/shipping",
    name: "shopShippingSettings",
    component: ShopShippingSettingsView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/pickup",
    name: "shopPickupSettings",
    component: ShopPickupSettingsView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/payments",
    name: "shopPaymentsSettings",
    component: ShopPaymentsSettingsView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/notifications",
    name: "shopNotificationsSettings",
    component: ShopNotificationsSettingsView,
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
];
