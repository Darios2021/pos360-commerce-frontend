// src/app/router/index.js
// ✅ COPY-PASTE FINAL COMPLETO (Shop público + Plataforma en /app + Auth en /app/auth)

import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";

// Layouts
import AppShell from "@/app/layouts/AppShell.vue";
import AuthLayout from "@/app/layouts/AuthLayout.vue";

// Shop routes
import { shopRoutes } from "@/modules/shop/router/shop.routes";

// ✅ Admin tienda / configs (ahora RELATIVOS para colgar de /app)
import { shopAdminRoutes } from "@/app/router/shopAdmin.routes";

// Pages
import LoginPage from "@/modules/auth/pages/LoginPage.vue";
import ProfilePage from "@/modules/account/pages/ProfilePage.vue";

// Dashboard
import DashboardHome from "@/modules/dashboard/pages/DashboardHome.vue";

// POS
import PosPage from "@/modules/pos/pages/PosPage.vue";
import PosSalesPage from "@/modules/pos/pages/PosSalesPage.vue";
import PosSaleDetailPage from "@/modules/pos/pages/PosSaleDetailPage.vue";

// Products
import ProductsListPage from "@/modules/products/pages/ProductsListPage.vue";
import ProductProfilePage from "@/modules/products/pages/ProductProfilePage.vue";

// Import
import ImportProductsPage from "@/modules/import/pages/ImportProductsPage.vue";

// Configuración
import CategoriesPage from "@/modules/categories/pages/CategoriesPage.vue";
import InventoryPage from "@/modules/inventory/pages/InventoryPage.vue";
import StockPage from "@/modules/stock/pages/StockPage.vue";

// Users
import UsersPage from "@/modules/users/pages/UsersPage.vue";

const routes = [
  // =========================
  // SHOP (público) en /shop/*
  // =========================
  ...shopRoutes,

  // =========================
  // AUTH (PLATAFORMA) en /app/auth/*
  // =========================
  {
    path: "/app/auth",
    component: AuthLayout,
    children: [
      { path: "login", name: "login", component: LoginPage, meta: { public: true } },
      { path: "", redirect: { name: "login" } },
    ],
  },

  // =========================
  // APP (privado) en /app/*
  // =========================
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

      // Productos
      { path: "products", name: "products", component: ProductsListPage },
      { path: "products/:id", name: "productProfile", component: ProductProfilePage },

      // Importación
      { path: "products-import", name: "productsImport", component: ImportProductsPage },

      // Configuración
      { path: "stock", name: "stock", component: StockPage },
      {
        path: "inventory",
        name: "inventory",
        component: InventoryPage,
        meta: { roles: ["admin", "super_admin"] },
      },
      { path: "categories", name: "categories", component: CategoriesPage },

      // ✅ TIENDA ADMIN + LINKS + GALERÍA MULTIMEDIA (cuelga bajo /app/...)
      ...shopAdminRoutes,

      // Usuarios
      {
        path: "users",
        name: "users",
        component: UsersPage,
        meta: { roles: ["admin", "super_admin"] },
      },

      // Cuenta
      { path: "profile", name: "profile", component: ProfilePage },
    ],
  },

  // fallback
  { path: "/:pathMatch(.*)*", redirect: { name: "shopHome" } },
];

const router = createRouter({
  // ✅ IMPORTANTÍSIMO: base "/" para que funcione tanto /shop como /app
  history: createWebHistory("/"),
  routes,
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
});

// =========================
// Guard global
// =========================
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (auth.status === "idle") auth.hydrate?.();

  if (to.meta?.public) return true;

  // si ya está logueado y va al login, mandalo al home
  if (to.name === "login" && auth.isAuthed) return { name: "home" };

  // si requiere auth y no está logueado -> login (que ahora es /app/auth/login)
  if (to.meta?.requiresAuth && !auth.isAuthed) return { name: "login" };

  const roles = to.meta?.roles;
  if (roles?.length) {
    const r = auth.roles || [];
    if (!roles.some((x) => r.includes(x))) return { name: "home" };
  }

  return true;
});

export default router;
