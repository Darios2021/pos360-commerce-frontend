// src/app/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth.store";

// Dashboard / Auth
const Home = () => import("../../modules/dashboard/pages/DashboardHome.vue");
const Login = () => import("../../modules/auth/pages/LoginPage.vue");

// Inventario / Productos
const Products = () => import("../../modules/products/pages/ProductsListPage.vue");
const ProductProfile = () => import("../../modules/products/pages/ProductProfilePage.vue");
const ImportProducts = () => import("../../modules/import/page/ImportProductsPage.vue");
const Stock = () => import("../../modules/stock/pages/StockPage.vue");
const Categories = () => import("../../modules/categories/pages/CategoriesPage.vue");

// ✅ Inventario Admin
const Inventory = () => import("../../modules/inventory/pages/InventoryPage.vue");

// ✅ Perfil (nuevo)
const Profile = () => import("../../modules/account/pages/ProfilePage.vue");

// POS
const Pos = () => import("../../modules/pos/pages/PosPage.vue");
const PosSales = () => import("../../modules/pos/pages/PosSalesPage.vue");
const PosSaleDetail = () => import("../../modules/pos/pages/PosSaleDetailPage.vue");

const routes = [
  { path: "/", name: "home", component: Home, meta: { requiresAuth: true } },

  // Productos
  { path: "/products", name: "products", component: Products, meta: { requiresAuth: true } },
  { path: "/products/import", name: "productsImport", component: ImportProducts, meta: { requiresAuth: true } },
  { path: "/products/:id", name: "productProfile", component: ProductProfile, meta: { requiresAuth: true } },

  // ✅ Inventario (admin)
  {
    path: "/inventory",
    name: "inventory",
    component: Inventory,
    meta: { requiresAuth: true, roles: ["admin", "super_admin"] },
  },

  { path: "/stock", name: "stock", component: Stock, meta: { requiresAuth: true } },
  { path: "/categories", name: "categories", component: Categories, meta: { requiresAuth: true } },

  // ✅ Perfil (nuevo)
  { path: "/account/profile", name: "profile", component: Profile, meta: { requiresAuth: true } },

  // POS
  { path: "/pos", name: "pos", component: Pos, meta: { requiresAuth: true } },
  { path: "/pos/sales", name: "posSales", component: PosSales, meta: { requiresAuth: true } },
  { path: "/pos/sales/:id", name: "posSaleDetail", component: PosSaleDetail, meta: { requiresAuth: true } },

  // Auth
  { path: "/auth/login", name: "login", component: Login, meta: { layout: "auth" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (auth.status === "idle") auth.hydrate?.();

  if (to.meta?.requiresAuth && !auth.isAuthed) return { name: "login" };
  if (to.name === "login" && auth.isAuthed) return { name: "home" };

  // ✅ Gate de roles
  const roles = to.meta?.roles;
  if (roles && roles.length) {
    const r = auth.roles || [];
    const ok = roles.some((x) => r.includes(x));
    if (!ok) return { name: "home" };
  }
});

export default router;
