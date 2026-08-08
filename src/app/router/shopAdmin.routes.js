// src/app/router/shopAdmin.routes.js
// ✅ COPY-PASTE FINAL COMPLETO (cuelga bajo /app/*)

const ShopBrandingHubView = () => import("@/modules/admin/pages/ShopBrandingHubView.vue");
const BrandingIdentityView = () => import("@/modules/admin/pages/BrandingIdentityView.vue");
const BrandingThemeView = () => import("@/modules/admin/pages/BrandingThemeView.vue");
const BrandingContactView = () => import("@/modules/admin/pages/BrandingContactView.vue");
const BrandingSocialView = () => import("@/modules/admin/pages/BrandingSocialView.vue");

// ✅ LISTADO / BANDEJA de pedidos (TU VISTA)
const ShopOrdersView = () => import("@/modules/admin/pages/ShopOrdersView.vue");
const ShopOrderDetailView = () => import("@/modules/admin/pages/ShopOrderDetailView.vue");
// (si preferís la otra, cambiá ShopOrdersView por ShopOrdersInboxView)
// import ShopOrdersInboxView from "@/modules/admin/pages/ShopOrdersInboxView.vue";

// ✅ Settings (solo los que tienen backend real)
const ShopPaymentsSettingsView = () => import("@/modules/admin/pages/ShopPaymentsSettingsView.vue");

// ✅ Links Tienda
const ShopLinksView = () => import("@/modules/admin/pages/ShopLinksView.vue");

// ✅ Galería Multimedia
const GaleriaMultimediaView = () => import("@/modules/admin/pages/GaleriaMultimediaView.vue");

// ✅ CRM email PRO
const EmailPromoBlocksView = () => import("@/modules/admin/pages/EmailPromoBlocksView.vue");

// ✅ Consultas web (Q&A + Reviews)
const ShopQAView = () => import("@/modules/admin/pages/ShopQAView.vue");

export const shopAdminRoutes = [
  {
    path: "admin/shop/branding",
    name: "shopBranding",
    component: ShopBrandingHubView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/identity",
    name: "shopBrandingIdentity",
    component: BrandingIdentityView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/theme",
    name: "shopBrandingTheme",
    component: BrandingThemeView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/contact",
    name: "shopBrandingContact",
    component: BrandingContactView,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },
  {
    path: "admin/shop/branding/social",
    name: "shopBrandingSocial",
    component: BrandingSocialView,
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

  // ✅ Consultas web (preguntas y opiniones del shop)
  {
    path: "admin/shop/qa",
    name: "shopQA",
    component: ShopQAView,
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
