// ✅ COPY-PASTE FINAL COMPLETO
// src/app/router/index.js
// FIX scroll:
// - F5 en /shop inicia arriba
// - volver desde producto conserva scroll
// - evita salto al footer

import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";

// Layouts
import AppShell from "@/app/layouts/AppShell.vue";
import AuthLayout from "@/app/layouts/AuthLayout.vue";

// Shop
import { shopRoutes } from "@/modules/shop/router/shop.routes";
import { shopAdminRoutes } from "@/app/router/shopAdmin.routes";

// Pages
import LoginPage from "@/modules/auth/pages/LoginPage.vue";
import ProfilePage from "@/modules/account/pages/ProfilePage.vue";
import DashboardHome from "@/modules/dashboard/pages/DashboardHome.vue";

import PosPage from "@/modules/pos/pages/PosPage.vue";
import PosSalesPage from "@/modules/pos/pages/PosSalesPage.vue";
import PosSaleDetailPage from "@/modules/pos/pages/PosSaleDetailPage.vue";

import ProductsListPage from "@/modules/products/pages/ProductsListPage.vue";
import ProductProfilePage from "@/modules/products/pages/ProductProfilePage.vue";
import ProductDetailViewPage from "@/modules/products/pages/ProductDetailViewPage.vue";

import ImportProductsPage from "@/modules/import/pages/ImportProductsPage.vue";

import CategoriesPage from "@/modules/categories/pages/CategoriesPage.vue";
import InventoryPage from "@/modules/inventory/pages/InventoryPage.vue";
import StockPage from "@/modules/stock/pages/StockPage.vue";

import UsersPage from "@/modules/users/pages/UsersPage.vue";

const routes = [

  // SHOP PUBLIC
  ...shopRoutes,

  // AUTH
  {
    path: "/app/auth",
    component: AuthLayout,
    children: [
      { path: "login", name: "login", component: LoginPage, meta: { public: true } },
      { path: "", redirect: { name: "login" } },
    ],
  },

  // APP PRIVADO
  {
    path: "/app",
    component: AppShell,
    meta: { requiresAuth: true },
    children: [

      { path: "", name: "home", component: DashboardHome },

      // POS
      { path: "pos", name: "pos", component: PosPage },
      { path: "pos/sales", name: "posSales", component: PosSalesPage },
      { path: "pos/sales/:id", name: "posSaleDetail", component: PosSaleDetailPage },

      // PRODUCTS
      { path: "products", name: "products", component: ProductsListPage },
      { path: "products/:id/view", name: "productView", component: ProductDetailViewPage },
      { path: "products/:id", name: "productProfile", component: ProductProfilePage },

      // IMPORT
      { path: "products-import", name: "productsImport", component: ImportProductsPage },

      // CONFIG
      { path: "stock", name: "stock", component: StockPage },
      {
        path: "inventory",
        name: "inventory",
        component: InventoryPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      { path: "categories", name: "categories", component: CategoriesPage },

      // ADMIN SHOP
      ...shopAdminRoutes,

      // USERS
      {
        path: "users",
        name: "users",
        component: UsersPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      // PROFILE
      { path: "profile", name: "profile", component: ProfilePage },
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/shop" },
];


// =======================
// Scroll persistence
// =======================

const SCROLL_KEY = "scroll_positions_v1";

function readScroll() {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveScroll(path) {
  const map = readScroll();
  map[path] = {
    top: window.scrollY || 0,
    left: window.scrollX || 0,
  };
  sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map));
}

function getScroll(path) {
  const map = readScroll();
  return map[path];
}


// Detect reload
function isReload() {
  try {
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav) return nav.type === "reload";
    return performance.navigation.type === 1;
  } catch {
    return false;
  }
}


// Disable browser auto scroll restore
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}


// Persist scroll while user scrolls
if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      const path =
        window.location.pathname +
        window.location.search +
        window.location.hash;

      saveScroll(path);
    },
    { passive: true }
  );
}


// =======================
// Router
// =======================

const router = createRouter({
  history: createWebHistory("/"),
  routes,

  scrollBehavior(to, from, savedPosition) {

    // Hash anchors
    if (to.hash) {
      return {
        el: to.hash,
        top: 90,
        behavior: "smooth",
      };
    }

    // Browser back
    if (savedPosition) {
      return savedPosition;
    }

    // F5 reload
    if (isReload()) {
      return { top: 0, left: 0 };
    }

    // Manual restore
    const pos = getScroll(to.fullPath);
    if (pos) {
      return pos;
    }

    return { top: 0, left: 0 };
  },
});


// =======================
// Guards
// =======================

router.beforeEach((to, from) => {

  if (from?.fullPath) {
    saveScroll(from.fullPath);
  }

  const auth = useAuthStore();
  if (auth.status === "idle") auth.hydrate?.();

  if (to.meta?.public) return true;

  if (to.name === "login" && auth.isAuthed) {
    return { name: "home" };
  }

  if (to.meta?.requiresAuth && !auth.isAuthed) {
    return { name: "login" };
  }

  const roles = to.meta?.roles;

  if (roles?.length) {
    const r = auth.roles || [];
    if (!roles.some((x) => r.includes(x))) {
      return { name: "home" };
    }
  }

  return true;
});

export default router;