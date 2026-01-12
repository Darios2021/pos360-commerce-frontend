// src/modules/admin/routes/shopAdmin.routes.js
// ✅ COPY-PASTE FINAL COMPLETO

import ShopBrandingView from "@/modules/admin/pages/ShopBrandingView.vue";

import ShopOrdersView from "@/modules/admin/pages/ShopOrdersView.vue";
import ShopOrdersSettingsView from "@/modules/admin/pages/ShopOrdersSettingsView.vue";

import ShopShippingSettingsView from "@/modules/admin/pages/ShopShippingSettingsView.vue";
import ShopPickupSettingsView from "@/modules/admin/pages/ShopPickupSettingsView.vue";
import ShopPaymentsSettingsView from "@/modules/admin/pages/ShopPaymentsSettingsView.vue";
import ShopNotificationsSettingsView from "@/modules/admin/pages/ShopNotificationsSettingsView.vue";

export const shopAdminRoutes = [
  {
    path: "admin/shop/branding",
    name: "shopBranding",
    component: ShopBrandingView,
    meta: { roles: ["admin", "super_admin"] },
  },

  // ✅ LISTADO (datatable) -> Tienda > Pedidos
  {
    path: "admin/shop/orders",
    name: "shopOrders",
    component: ShopOrdersView,
    meta: { roles: ["admin", "super_admin"] },
  },

  // ✅ CONFIGS (lo que hoy tenías en "Pedidos")
  {
    path: "admin/shop/orders/settings",
    name: "shopOrdersSettings",
    component: ShopOrdersSettingsView,
    meta: { roles: ["admin", "super_admin"] },
  },

  {
    path: "admin/shop/shipping",
    name: "shopShippingSettings",
    component: ShopShippingSettingsView,
    meta: { roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/pickup",
    name: "shopPickupSettings",
    component: ShopPickupSettingsView,
    meta: { roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/payments",
    name: "shopPaymentsSettings",
    component: ShopPaymentsSettingsView,
    meta: { roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/notifications",
    name: "shopNotificationsSettings",
    component: ShopNotificationsSettingsView,
    meta: { roles: ["admin", "super_admin"] },
  },
];
