// ✅ COPY-PASTE FINAL COMPLETO
// src/modules/shop/router/shop.routes.js

import ShopLayout from "@/modules/shop/layouts/ShopLayout.vue";

import ShopHome from "@/modules/shop/pages/ShopHome.vue";
import ShopCategory from "@/modules/shop/pages/ShopCategory.vue";
import ShopProduct from "@/modules/shop/pages/ShopProduct.vue";
import ShopCart from "@/modules/shop/pages/ShopCart.vue";

// ✅ Checkout
import ShopCheckout from "@/modules/shop/pages/ShopCheckout.vue";

// ✅ Comprobante / éxito de compra
import ShopCheckoutSuccess from "@/modules/shop/pages/ShopCheckoutSuccess.vue";

// ✅ NUEVA pantalla full-screen de categorías
import ShopCategories from "@/modules/shop/pages/ShopCategories.vue";

// ✅ NUEVAS pantallas mobile footer
import ShopClips from "@/modules/shop/pages/ShopClips.vue";
import ShopMore from "@/modules/shop/pages/ShopMore.vue";

export const shopRoutes = [
  {
    path: "/shop",
    component: ShopLayout,
    meta: { public: true },
    children: [
      // Home
      {
        path: "",
        name: "shopHome",
        component: ShopHome,
        meta: { public: true },
      },

      // ✅ CATEGORÍAS (FULL SCREEN)
      {
        path: "categories",
        name: "shopCategories",
        component: ShopCategories,
        meta: { public: true },
      },

      // ✅ compat: si quedó /shop/category (singular) por el footer viejo, redirigimos
      {
        path: "category",
        redirect: "/shop/categories",
      },

      // Categoría (estilo Mercado Libre)
      {
        path: "c/:id",
        name: "shopCategory",
        component: ShopCategory,
        meta: { public: true },
      },

      // ✅ compat opcional: si alguna vez tuviste /shop/category/:id
      {
        path: "category/:id",
        redirect: (to) => `/shop/c/${to.params.id}`,
      },

      // Producto
      {
        path: "product/:id",
        name: "shopProduct",
        component: ShopProduct,
        meta: { public: true },
      },

      // Carrito
      {
        path: "cart",
        name: "shopCart",
        component: ShopCart,
        meta: { public: true },
      },

      // Checkout (Envío / Pago / Revisión)
      {
        path: "checkout",
        name: "shopCheckout",
        component: ShopCheckout,
        meta: { public: true },
      },

      // ✅ ÉXITO / COMPROBANTE
      {
        path: "checkout/success",
        name: "shopCheckoutSuccess",
        component: ShopCheckoutSuccess,
        meta: { public: true },
      },

      // ✅ CLIPS (pantalla reels)
      {
        path: "clips",
        name: "shopClips",
        component: ShopClips,
        meta: { public: true },
      },

      // ✅ MÁS (menú que antes estaba arriba)
      {
        path: "more",
        name: "shopMore",
        component: ShopMore,
        meta: { public: true },
      },
    ],
  },
];
