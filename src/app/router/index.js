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
import { showRouteOverlay, hideRouteOverlay } from "@/modules/shop/service/routeOverlay.state";
import { isCapacitor } from "@/app/utils/runtime";

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
import BulkLabelsPage    from "@/modules/products/pages/BulkLabelsPage.vue";
import ProductFormPage from "@/modules/products/pages/ProductFormPage.vue";
import ProductProfilePage from "@/modules/products/pages/ProductProfilePage.vue";
import ProductDetailViewPage from "@/modules/products/pages/ProductDetailViewPage.vue";

import ImportProductsPage from "@/modules/import/pages/ImportProductsPage.vue";

import CategoriesPage from "@/modules/categories/pages/CategoriesPage.vue";
import InventoryPage from "@/modules/inventory/pages/InventoryPage.vue";
import StockPage from "@/modules/stock/pages/StockPage.vue";

import StockTransfersPage from "@/modules/dashboard/pages/StockTransfersPage.vue";
import UsersPage from "@/modules/users/pages/UsersPage.vue";
import FiscalAdminPage from "@/modules/admin/pages/FiscalAdminPage.vue";
import PaymentMethodsAdminPage from "@/modules/admin/pages/PaymentMethodsAdminPage.vue";
import CashRegistersAdminPage from "@/modules/admin/pages/CashRegistersAdminPage.vue";
import CashRegisterDetailPage from "@/modules/admin/pages/CashRegisterDetailPage.vue";
import TelegramSettingsAdminPage from "@/modules/admin/pages/TelegramSettingsAdminPage.vue";
import CustomersAdminPage from "@/modules/admin/pages/CustomersAdminPage.vue";
import CustomerDetailView from "@/modules/admin/pages/CustomerDetailView.vue";
import BranchesAdminPage from "@/modules/admin/pages/BranchesAdminPage.vue";
import ReportsShellPage from "@/modules/reports/pages/ReportsShellPage.vue";
import AppInstallPage from "@/app/pages/AppInstallPage.vue";

const routes = [
  ...shopRoutes,

  {
    path: "/app/install",
    name: "appInstall",
    component: AppInstallPage,
    meta: { public: true },
  },

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
      { path: "products/new", name: "productNew", component: ProductFormPage, meta: { fullPage: true } },
      { path: "products/:id/edit", name: "productEdit", component: ProductFormPage, meta: { fullPage: true } },
      { path: "products/:id/view", name: "productView", component: ProductDetailViewPage },
      { path: "products/:id", name: "productProfile", component: ProductProfilePage },

      { path: "products-import", name: "productsImport", component: ImportProductsPage },
      { path: "products-labels", name: "productsLabels", component: BulkLabelsPage },

      { path: "transfers", name: "transfers", component: StockTransfersPage },

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
        path: "admin/cash-registers",
        name: "adminCashRegisters",
        component: CashRegistersAdminPage,
        meta: { roles: ["admin", "super_admin"] },
      },
      {
        path: "admin/cash-registers/:id",
        name: "adminCashRegisterDetail",
        component: CashRegisterDetailPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      {
        path: "admin/telegram",
        name: "adminTelegram",
        component: TelegramSettingsAdminPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      {
        path: "admin/branches",
        name: "adminBranches",
        component: BranchesAdminPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      {
        path: "users",
        name: "users",
        component: UsersPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      {
        path: "admin/clientes",
        name: "adminCustomers",
        component: CustomersAdminPage,
      },
      {
        path: "admin/clientes/:id",
        name: "adminCustomerDetail",
        component: CustomerDetailView,
        props: true,
      },

      {
        path: "reports",
        name: "reports",
        component: ReportsShellPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      { path: "profile", name: "profile", component: ProfilePage },
    ],
  },

  // Catch-all: en web → shop público; dentro del APK Capacitor → backoffice.
  // En Capacitor el WebView abre https://localhost/ y matchea acá. Sin esta
  // distinción, el APK siempre arrancaría en el shop público.
  {
    path: "/:pathMatch(.*)*",
    redirect: () => (isCapacitor() ? "/app" : "/shop"),
  },
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

/**
 * Devuelve true para CUALQUIER ruta del shop público que cargue contenido async
 * (productos, categorías, ofertas, etc). Usado para decidir cuándo esperar a
 * que el DOM tenga altura suficiente antes de restaurar la posición.
 */
function isShopAsyncPath(path) {
  const p = normalizePath(path);
  if (p === "/shop") return true;                                  // home
  if (/^\/shop\/c\/[^/]+$/.test(p)) return true;                   // categoría
  if (p === "/shop/search") return true;                            // búsqueda
  if (p === "/shop/categories") return true;                        // grid de categorías
  if (/^\/shop\/account/.test(p)) return true;                      // mis compras / favoritos
  if (/^\/shop\/landing/i.test(p) || /^\/shop\/(seguridad|sistemas|servicio-tecnico)$/.test(p)) return true;
  return false;
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

// Usamos fullPath (incluye query strings) para diferenciar entre /shop?page=2 y /shop?page=3.
// El path solo (sin query) hacía que distintas páginas compartieran el mismo scroll.
function buildScrollKey(pathOrFullPath = "") {
  let s = String(pathOrFullPath || "").trim();
  if (!s) return "/";
  // Extraer query si existe; ignorar hash (los anchors los maneja scrollBehavior aparte)
  const [pathPart, queryPart] = s.split("#")[0].split("?");
  const normalizedPath = normalizePath(pathPart);
  return queryPart ? `${normalizedPath}?${queryPart}` : normalizedPath;
}

function saveScroll(pathOrFullPath, top = getCurrentScroll()) {
  try {
    if (!pathOrFullPath) return;
    const key = buildScrollKey(pathOrFullPath);
    const map = readScroll();
    map[key] = {
      top: Number(top) || 0,
      left: window.scrollX || 0,
    };
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map));
  } catch {}
}

function getScroll(pathOrFullPath) {
  try {
    const key = buildScrollKey(pathOrFullPath);
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

/**
 * Espera hasta que el documento sea suficientemente alto para alcanzar targetTop
 * Y la altura se mantenga estable por `stableForMs` (señal de que el contenido
 * async ya terminó de cargar). Esto evita los "saltitos" de re-aplicar el scroll
 * varias veces a medida que el layout cambia.
 */
async function waitUntilScrollable(targetTop, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs || 3500);
  const intervalMs = Number(opts.intervalMs || 50);
  const stableForMs = Number(opts.stableForMs || 240);
  const safety = 100; // queremos algo de margen para que scrollTop no quede recortado

  const goal = Math.max(0, targetTop) + safety;
  const started = Date.now();

  let lastHeight = -1;
  let stableSince = 0;

  while (Date.now() - started < timeoutMs) {
    const maxY = getMaxScrollableY();

    if (maxY >= goal) {
      // Altura suficiente alcanzada. Esperamos a que se mantenga estable.
      if (maxY === lastHeight) {
        if (!stableSince) stableSince = Date.now();
        if (Date.now() - stableSince >= stableForMs) return true;
      } else {
        stableSince = 0;
      }
    } else {
      stableSince = 0;
    }

    lastHeight = maxY;
    await sleep(intervalMs);
  }

  return false;
}

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

markReloadOnce();

// Captura el scroll actual de la ruta y lo guarda en sessionStorage.
// Se llama en muchos hooks (scroll, pointerdown, beforeunload, beforeEach)
// para garantizar que SIEMPRE haya un valor reciente al navegar.
function captureCurrentScroll() {
  const fullPath = window.location.pathname + window.location.search;
  const top = getCurrentScroll();

  saveScroll(fullPath, top);

  if (isShopHomePath(window.location.pathname)) {
    saveShopHomeScroll(top);
  }
}

// Throttle ligero del listener de scroll para no escribir sessionStorage en cada pixel.
// Usamos setTimeout en vez de RAF: garantiza que se ejecute incluso si el browser
// está priorizando navegación en el momento del último scroll.
let _scrollSaveTimer = null;
function onScrollThrottled() {
  if (_scrollSaveTimer) return;
  _scrollSaveTimer = setTimeout(() => {
    _scrollSaveTimer = null;
    captureCurrentScroll();
  }, 100);
}

if (typeof window !== "undefined") {
  window.addEventListener("scroll", onScrollThrottled, { passive: true });

  // ✅ CRÍTICO: capturar la posición ANTES de cualquier click/tap.
  // Cubre los casos donde el listener de scroll throttled no llegó a
  // ejecutarse (ej: scroll → click rápido) y la navegación dispara
  // antes de que se persista. Capture phase (true) para correr antes
  // que cualquier handler de los componentes.
  window.addEventListener("pointerdown", captureCurrentScroll, { capture: true, passive: true });
  window.addEventListener("click",        captureCurrentScroll, { capture: true, passive: true });

  // Cuando la pestaña se cierra o se oculta.
  window.addEventListener("pagehide", captureCurrentScroll);
  window.addEventListener("beforeunload", captureCurrentScroll);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      captureCurrentScroll();
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
    // 1) Anchor / hash → respetar el destino del hash con un offset por el header sticky.
    if (to.hash) {
      await sleep(120);
      return {
        el: to.hash,
        top: 90,
        behavior: "smooth",
      };
    }

    // 2) Reload de la página → siempre arriba (no queremos restaurar al refrescar F5).
    if (consumeReloadOnce()) {
      await sleep(40);
      return { top: 0, left: 0 };
    }

    // 3) Helper local: espera a que el layout sea estable (altura suficiente +
    //    sin cambios por 240ms) y devuelve la posición UNA SOLA VEZ.
    //    Eventos:
    //      - "shop:scroll-restoring": al inicio (overlay aparece y oculta el contenido)
    //      - "shop:scroll-restored":   al terminar (overlay se cierra con fade)
    const applyPosition = async (top, left = 0) => {
      const targetTop = Math.max(0, Number(top) || 0);
      const targetLeft = Math.max(0, Number(left) || 0);
      const willRestoreScroll = isShopAsyncPath(to.path) && targetTop > 0;

      if (willRestoreScroll) {
        try {
          window.dispatchEvent(new CustomEvent("shop:scroll-restoring"));
        } catch {}
        await waitUntilScrollable(targetTop, {
          timeoutMs: 2200,
          stableForMs: 140,
          intervalMs: 40,
        });
      } else if (isShopAsyncPath(to.path)) {
        await sleep(60);
      }

      // Avisar al overlay que ya puede cerrarse. Pequeño delay para que
      // el browser pinte la posición antes de hacer fade del overlay.
      if (willRestoreScroll) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              window.dispatchEvent(new CustomEvent("shop:scroll-restored"));
            } catch {}
            hideRouteOverlay();
          }, 100);
        });
      } else {
        // Si no hay scroll que restaurar, igual cerramos el overlay global
        // por si quedó activado erroneamente desde beforeEach.
        hideRouteOverlay();
      }

      return { top: targetTop, left: targetLeft };
    };

    // 4) Caso especial: home con flag de restore pendiente.
    if (isShopHomePath(to.path) && consumeShopHomeRestorePending()) {
      const top = Math.max(0, getShopHomeScroll());
      return await applyPosition(top, 0);
    }

    // 5) Posición del sessionStorage (siempre primero, lo guarda nuestro
    //    listener throttled + beforeEach. Es más confiable que savedPosition,
    //    que a veces viene en 0 cuando el browser no alcanzó a guardar la
    //    posición antes de navegar).
    const pos = getScroll(to.fullPath);
    if (pos && (pos.top > 0 || pos.left > 0)) {
      return await applyPosition(pos.top, pos.left);
    }

    // 6) Posición saved del browser (back/forward nativo) — fallback.
    if (savedPosition && (savedPosition.top > 0 || savedPosition.left > 0)) {
      return await applyPosition(savedPosition.top, savedPosition.left);
    }

    // 7) Default: arriba. En rutas async esperamos un toque para que no haya jitter.
    if (isShopAsyncPath(to.path)) {
      await sleep(80);
    }
    hideRouteOverlay();
    return { top: 0, left: 0 };
  },
});

// Seguro extra: ante cualquier afterEach desactivamos el overlay con un
// delay generoso (en caso de que scrollBehavior no haya corrido o haya fallado).
// Es solo un safety net — el cierre normal lo hace applyPosition.
router.afterEach(() => {
  setTimeout(() => {
    hideRouteOverlay();
  }, 4000);
});

// Captura scroll de la ruta ACTUAL antes de navegar a la siguiente.
// Esto cubre el caso donde el scroll listener throttled no llegó a guardar
// la última posición (ej. click rápido en un link de producto).
router.beforeEach((to, from, next) => {
  try {
    if (from?.fullPath) {
      saveScroll(from.fullPath, getCurrentScroll());
      if (isShopHomePath(from.path)) {
        saveShopHomeScroll(getCurrentScroll());
      }
    }

    // ✅ Activar el overlay GLOBAL del shop ANTES de que se monte la nueva
    // página, así el usuario nunca ve la transición de scroll-restore.
    // Sólo si: vamos a una ruta del shop async + hay posición guardada > 0
    // (back desde producto a home/categoría con scroll real).
    const goingToShop = isShopAsyncPath(to?.path);
    if (goingToShop) {
      const saved = getScroll(to.fullPath);
      const homePending = isShopHomePath(to.path) && getShopHomeScroll() > 0;
      const hasScrollToRestore = (saved && (saved.top > 0)) || homePending;
      if (hasScrollToRestore) {
        showRouteOverlay();
      }
    }
  } catch {}
  next();
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