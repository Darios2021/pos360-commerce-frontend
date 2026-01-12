// src/modules/admin/router/shopAdmin.routes.js
import ShopBrandingView from "@/modules/admin/pages/ShopBrandingView.vue";
import ShopOrdersSettingsView from "@/modules/admin/pages/ShopOrdersSettingsView.vue";
import ShopShippingSettingsView from "@/modules/admin/pages/ShopShippingSettingsView.vue";
import ShopPickupSettingsView from "@/modules/admin/pages/ShopPickupSettingsView.vue";
import ShopPaymentsSettingsView from "@/modules/admin/pages/ShopPaymentsSettingsView.vue";
import ShopNotificationsSettingsView from "@/modules/admin/pages/ShopNotificationsSettingsView.vue";

/**
 * ✅ Admin > Tienda
 * Paths sugeridos (no chocan con /shop público)
 */
export const shopAdminRoutes = [
  { path: "/admin/shop/branding", name: "shopBranding", component: ShopBrandingView, meta: { requiresAuth: true } },
  { path: "/admin/shop/orders", name: "shopOrdersSettings", component: ShopOrdersSettingsView, meta: { requiresAuth: true } },
  { path: "/admin/shop/shipping", name: "shopShippingSettings", component: ShopShippingSettingsView, meta: { requiresAuth: true } },
  { path: "/admin/shop/pickup", name: "shopPickupSettings", component: ShopPickupSettingsView, meta: { requiresAuth: true } },
  { path: "/admin/shop/payments", name: "shopPaymentsSettings", component: ShopPaymentsSettingsView, meta: { requiresAuth: true } },
  { path: "/admin/shop/notifications", name: "shopNotificationsSettings", component: ShopNotificationsSettingsView, meta: { requiresAuth: true } },
];
