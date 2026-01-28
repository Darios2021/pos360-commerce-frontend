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

      // Categoría (estilo Mercado Libre)
      {
        path: "c/:id",
        name: "shopCategory",
        component: ShopCategory,
        meta: { public: true },
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
    ],
  },
];
