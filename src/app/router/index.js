// ✅ COPY-PASTE FINAL COMPLETO
// src/app/router/index.js
// FIX scroll robusto:
// - F5 en /shop inicia arriba
// - volver desde producto conserva scroll real
// - soporta /shop y /shop/
// - no depende de delays fijos para home/category
// - espera a que el documento tenga altura suficiente antes de restaurar
// ✅ NUEVO: ruta /app/admin/fiscal
// ✅ NUEVO: ruta /app/admin/payment-methods

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
import FiscalAdminPage from "@/modules/admin/pages/FiscalAdminPage.vue";
import PaymentMethodsAdminPage from "@/modules/admin/pages/PaymentMethodsAdminPage.vue";

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
        path: "admin/fiscal",
        name: "adminFiscal",
        component: FiscalAdminPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      {
        path: "admin/payment-methods",
        name: "adminPaymentMethods",
        component: PaymentMethodsAdminPage,
        meta: { roles: ["admin", "super_admin"] },
      },

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

const SCROLL_KEY = "scroll_positions_v6";
const RELOAD_ONCE_KEY = "scroll_reload_once_v6";
const SHOP_HOME_SCROLL_KEY = "shop_home_scroll_y_v10";
const SHOP_HOME_RESTORE_PENDING_KEY = "shop_home_restore_pending_v10";

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

function getMaxScrollableY() {
  const el = document.scrollingElement || document.documentElement || document.body;
  if (!el) return 0;
  return Math.max(0, (el.scrollHeight || 0) - window.innerHeight);
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntilScrollable(targetTop, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs || 2200);
  const intervalMs = Number(opts.intervalMs || 60);
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const maxY = getMaxScrollableY();
    if (maxY >= targetTop) return true;
    await sleep(intervalMs);
  }

  return false;
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
      await sleep(120);
      return {
        el: to.hash,
        top: 90,
        behavior: "smooth",
      };
    }

    if (consumeReloadOnce()) {
      await sleep(40);
      return { top: 0, left: 0 };
    }

    if (isShopHomePath(to.path) && consumeShopHomeRestorePending()) {
      const top = Math.max(0, getShopHomeScroll());

      if (top > 0) {
        await waitUntilScrollable(top, { timeoutMs: 2600, intervalMs: 60 });
      } else {
        await sleep(80);
      }

      return { top, left: 0 };
    }

    if (savedPosition) {
      const targetTop = Math.max(0, Number(savedPosition.top || 0));

      if ((isShopHomePath(to.path) || isShopCategoryPath(to.path)) && targetTop > 0) {
        await waitUntilScrollable(targetTop, { timeoutMs: 2200, intervalMs: 60 });
      } else if (isShopHomePath(to.path) || isShopCategoryPath(to.path)) {
        await sleep(80);
      }

      return savedPosition;
    }

    const pos = getScroll(to.fullPath);
    if (pos && (pos.top > 0 || pos.left > 0)) {
      const targetTop = Math.max(0, Number(pos.top || 0));

      if ((isShopHomePath(to.path) || isShopCategoryPath(to.path)) && targetTop > 0) {
        await waitUntilScrollable(targetTop, { timeoutMs: 2200, intervalMs: 60 });
      } else if (isShopHomePath(to.path) || isShopCategoryPath(to.path)) {
        await sleep(80);
      }

      return pos;
    }

    if (isShopHomePath(to.path) || isShopCategoryPath(to.path)) {
      await sleep(80);
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