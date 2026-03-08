// ✅ COPY-PASTE FINAL COMPLETO
// src/app/router/index.js
// FIX scroll definitivo PROD/LOCAL:
// - F5 en /shop inicia arriba
// - volver desde producto conserva scroll real
// - soporta /shop y /shop/
// - evita salto al footer/hero

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
  ...shopRoutes,

  {
    path: "/app/auth",
    component: AuthLayout,
    children: [
      { path: "login", name: "login", component: LoginPage, meta: { public: true } },
      { path: "", redirect: { name: "login" } },
    ],
  },

  {
    path: "/app",
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "home", component: DashboardHome },

      { path: "pos", name: "pos", component: PosPage },
      { path: "pos/sales", name: "posSales", component: PosSalesPage },
      { path: "pos/sales/:id", name: "posSaleDetail", component: PosSaleDetailPage },

      { path: "products", name: "products", component: ProductsListPage },
      { path: "products/:id/view", name: "productView", component: ProductDetailViewPage },
      { path: "products/:id", name: "productProfile", component: ProductProfilePage },

      { path: "products-import", name: "productsImport", component: ImportProductsPage },

      { path: "stock", name: "stock", component: StockPage },
      {
        path: "inventory",
        name: "inventory",
        component: InventoryPage,
        meta: { roles: ["admin", "super_admin"] },
      },
      { path: "categories", name: "categories", component: CategoriesPage },

      ...shopAdminRoutes,

      {
        path: "users",
        name: "users",
        component: UsersPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      { path: "profile", name: "profile", component: ProfilePage },
    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/shop" },
];

// =======================
// Scroll persistence
// =======================

const SCROLL_KEY = "scroll_positions_v5";
const RELOAD_ONCE_KEY = "scroll_reload_once_v5";
const SHOP_HOME_SCROLL_KEY = "shop_home_scroll_y_v9";
const SHOP_HOME_RESTORE_PENDING_KEY = "shop_home_restore_pending_v9";

function normalizePath(path = "") {
  const p = String(path || "").trim();
  if (!p) return "/";
  if (p.length > 1 && p.endsWith("/")) return p.slice(0, -1);
  return p;
}

function isShopHomePath(path) {
  return normalizePath(path) === "/shop";
}

function isShopCategoryPath(path) {
  return /^\/shop\/c\/[^/]+$/.test(normalizePath(path));
}

function getCurrentScroll() {
  return Math.max(
    window.scrollY || 0,
    document.documentElement?.scrollTop || 0,
    document.body?.scrollTop || 0,
    document.scrollingElement?.scrollTop || 0
  );
}

function readScroll() {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveScroll(path, top = getCurrentScroll()) {
  try {
    if (!path) return;
    const key = normalizePath(path);
    const map = readScroll();
    map[key] = {
      top: Number(top) || 0,
      left: window.scrollX || 0,
    };
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map));
  } catch {}
}

function getScroll(path) {
  try {
    const key = normalizePath(path);
    const map = readScroll();
    return map[key] || null;
  } catch {
    return null;
  }
}

function saveShopHomeScroll(top = getCurrentScroll()) {
  try {
    sessionStorage.setItem(SHOP_HOME_SCROLL_KEY, String(Number(top) || 0));
  } catch {}
}

function getShopHomeScroll() {
  try {
    const n = Number(sessionStorage.getItem(SHOP_HOME_SCROLL_KEY) || 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function markShopHomeRestorePending() {
  try {
    sessionStorage.setItem(SHOP_HOME_RESTORE_PENDING_KEY, "1");
  } catch {}
}

function consumeShopHomeRestorePending() {
  try {
    const yes = sessionStorage.getItem(SHOP_HOME_RESTORE_PENDING_KEY) === "1";
    sessionStorage.removeItem(SHOP_HOME_RESTORE_PENDING_KEY);
    return yes;
  } catch {
    return false;
  }
}

function markReloadOnce() {
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    const reloaded = nav ? nav.type === "reload" : performance?.navigation?.type === 1;
    if (reloaded) {
      sessionStorage.setItem(RELOAD_ONCE_KEY, "1");
    } else {
      sessionStorage.removeItem(RELOAD_ONCE_KEY);
    }
  } catch {}
}

function consumeReloadOnce() {
  try {
    const v = sessionStorage.getItem(RELOAD_ONCE_KEY) === "1";
    sessionStorage.removeItem(RELOAD_ONCE_KEY);
    return v;
  } catch {
    return false;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

markReloadOnce();

if (typeof window !== "undefined") {
  window.addEventListener(
    "scroll",
    () => {
      const path = window.location.pathname + window.location.search + window.location.hash;
      const top = getCurrentScroll();

      saveScroll(path, top);

      if (isShopHomePath(window.location.pathname)) {
        saveShopHomeScroll(top);
      }
    },
    { passive: true }
  );

  window.addEventListener("pagehide", () => {
    const path = window.location.pathname + window.location.search + window.location.hash;
    const top = getCurrentScroll();

    saveScroll(path, top);

    if (isShopHomePath(window.location.pathname)) {
      saveShopHomeScroll(top);
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      const path = window.location.pathname + window.location.search + window.location.hash;
      const top = getCurrentScroll();

      saveScroll(path, top);

      if (isShopHomePath(window.location.pathname)) {
        saveShopHomeScroll(top);
      }
    }
  });
}

// =======================
// Router
// =======================

const router = createRouter({
  history: createWebHistory("/"),
  routes,

  async scrollBehavior(to, from, savedPosition) {
    if (to.hash) {
      await delay(120);
      return {
        el: to.hash,
        top: 90,
        behavior: "smooth",
      };
    }

    if (consumeReloadOnce()) {
      await delay(40);
      return { top: 0, left: 0 };
    }

    if (isShopHomePath(to.path) && consumeShopHomeRestorePending()) {
      const top = getShopHomeScroll();
      await delay(700);
      return { top: top > 0 ? top : 0, left: 0 };
    }

    if (savedPosition) {
      if (isShopHomePath(to.path) || isShopCategoryPath(to.path)) {
        await delay(500);
      }
      return savedPosition;
    }

    const pos = getScroll(to.fullPath);
    if (pos && (pos.top > 0 || pos.left > 0)) {
      if (isShopHomePath(to.path) || isShopCategoryPath(to.path)) {
        await delay(500);
      }
      return pos;
    }

    if (isShopHomePath(to.path) || isShopCategoryPath(to.path)) {
      await delay(120);
    }

    return { top: 0, left: 0 };
  },
});

// =======================
// Guards
// =======================

router.beforeEach((to, from) => {
  if (from?.fullPath) {
    saveScroll(from.fullPath, getCurrentScroll());
  }

  if (isShopHomePath(from?.path) && !isShopHomePath(to?.path)) {
    saveShopHomeScroll(getCurrentScroll());
    markShopHomeRestorePending();
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