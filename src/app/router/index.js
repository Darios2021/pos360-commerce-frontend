import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth.store";

// Lazy pages
const Home = () => import("../../modules/dashboard/pages/DashboardHome.vue");
const Login = () => import("../../modules/auth/pages/LoginPage.vue");

// Inventario
const Products = () => import("../../modules/products/pages/ProductsListPage.vue");
const ProductProfile = () => import("../../modules/products/pages/ProductProfilePage.vue");

const Stock = () => import("../../modules/stock/pages/StockPage.vue");
const Categories = () => import("../../modules/categories/pages/CategoriesPage.vue");
const ImportProducts = () => import("../../modules/import/page/ImportProductsPage.vue");

// POS
const Pos = () => import("../../modules/pos/pages/PosPage.vue");
const PosSales = () => import("../../modules/pos/pages/PosSalesPage.vue");
const PosSaleDetail = () => import("../../modules/pos/pages/PosSaleDetailPage.vue");

const routes = [
  { path: "/", name: "home", component: Home, meta: { requiresAuth: true } },

  // Inventario
  { path: "/products", name: "products", component: Products, meta: { requiresAuth: true } },
  // ✅ NUEVO: Perfil producto
  { path: "/products/:id", name: "productProfile", component: ProductProfile, meta: { requiresAuth: true } },

  { path: "/products/import", name: "productsImport", component: ImportProducts, meta: { requiresAuth: true } },
  { path: "/stock", name: "stock", component: Stock, meta: { requiresAuth: true } },
  { path: "/categories", name: "categories", component: Categories, meta: { requiresAuth: true } },

  // POS
  { path: "/pos", name: "pos", component: Pos, meta: { requiresAuth: true } },
  { path: "/pos/sales", name: "posSales", component: PosSales, meta: { requiresAuth: true } },
  { path: "/pos/sales/:id", name: "posSaleDetail", component: PosSaleDetail, meta: { requiresAuth: true } },

  // Auth
  { path: "/auth/login", name: "login", component: Login },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (auth.status === "idle") auth.hydrate?.();

  if (to.meta.requiresAuth && !auth.isAuthed) return { name: "login" };
  if (to.name === "login" && auth.isAuthed) return { name: "home" };
  return true;
});

export default router;
