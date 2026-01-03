// src/modules/shop/router/shop.routes.js
import ShopLayout from "@/modules/shop/layouts/ShopLayout.vue";

import ShopHome from "@/modules/shop/pages/ShopHome.vue";
import ShopCategory from "@/modules/shop/pages/ShopCategory.vue";
import ShopProduct from "@/modules/shop/pages/ShopProduct.vue";
import ShopCart from "@/modules/shop/pages/ShopCart.vue";

export const shopRoutes = [
  {
    path: "/shop",
    component: ShopLayout,
    meta: { public: true },
    children: [
      { path: "", name: "shopHome", component: ShopHome, meta: { public: true } },

      // ✅ Landing de categoría estilo MercadoLibre
      { path: "c/:id", name: "shopCategory", component: ShopCategory, meta: { public: true } },

      { path: "product/:id", name: "shopProduct", component: ShopProduct, meta: { public: true } },
      { path: "cart", name: "shopCart", component: ShopCart, meta: { public: true } },
    ],
  },
];
