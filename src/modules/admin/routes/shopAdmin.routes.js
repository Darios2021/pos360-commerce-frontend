// src/modules/admin/routes/shopAdmin.routes.js
// ✅ Solo rutas con backend real

import ShopBrandingView from "@/modules/admin/pages/ShopBrandingView.vue";
import ShopOrdersView from "@/modules/admin/pages/ShopOrdersView.vue";
import ShopPaymentsSettingsView from "@/modules/admin/pages/ShopPaymentsSettingsView.vue";

export const shopAdminRoutes = [
  {
    path: "admin/shop/branding",
    name: "shopBranding",
    component: ShopBrandingView,
    meta: { roles: ["admin", "super_admin"] },
  },

  {
    path: "admin/shop/orders",
    name: "shopOrders",
    component: ShopOrdersView,
    meta: { roles: ["admin", "super_admin"] },
  },

  {
    path: "admin/shop/payments",
    name: "shopPaymentsSettings",
    component: ShopPaymentsSettingsView,
    meta: { roles: ["admin", "super_admin"] },
  },
];
