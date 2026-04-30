// src/modules/admin/routes/shopAdmin.routes.js
// ✅ Solo rutas con backend real

import ShopBrandingHubView from "@/modules/admin/pages/ShopBrandingHubView.vue";
import BrandingIdentityView from "@/modules/admin/pages/BrandingIdentityView.vue";
import BrandingThemeView from "@/modules/admin/pages/BrandingThemeView.vue";
import BrandingContactView from "@/modules/admin/pages/BrandingContactView.vue";
import BrandingSocialView from "@/modules/admin/pages/BrandingSocialView.vue";
import ShopOrdersView from "@/modules/admin/pages/ShopOrdersView.vue";
import ShopPaymentsSettingsView from "@/modules/admin/pages/ShopPaymentsSettingsView.vue";

export const shopAdminRoutes = [
  // Branding HUB (cards de acceso)
  {
    path: "admin/shop/branding",
    name: "shopBranding",
    component: ShopBrandingHubView,
    meta: { roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/identity",
    name: "shopBrandingIdentity",
    component: BrandingIdentityView,
    meta: { roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/theme",
    name: "shopBrandingTheme",
    component: BrandingThemeView,
    meta: { roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/contact",
    name: "shopBrandingContact",
    component: BrandingContactView,
    meta: { roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/social",
    name: "shopBrandingSocial",
    component: BrandingSocialView,
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
