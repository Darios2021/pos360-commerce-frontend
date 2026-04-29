// src/modules/shop/router/shop.account.routes.js
//
// Rutas "Mi cuenta" como CHILDREN de /shop
// - /shop/account/profile
// - /shop/account/orders
// - /shop/account/favorites

export const shopAccountRoutes = [
  {
    path: "account",
    component: () => import("@/modules/shop/pages/account/ShopAccountLayout.vue"),
    children: [
      { path: "", redirect: "/shop/account/profile" },
      {
        path: "profile",
        name: "shop-account-profile",
        component: () => import("@/modules/shop/pages/account/ShopAccountProfile.vue"),
        meta: { requiresShopAuth: true },
      },
      {
        path: "orders",
        name: "shop-account-orders",
        component: () => import("@/modules/shop/pages/account/ShopAccountOrders.vue"),
        meta: { requiresShopAuth: true },
      },
      {
        path: "favorites",
        name: "shop-account-favorites",
        component: () => import("@/modules/shop/pages/account/ShopAccountFavorites.vue"),
        meta: { requiresShopAuth: true },
      },
    ],
  },
];

export default shopAccountRoutes;
