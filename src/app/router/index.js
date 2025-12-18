// src/app/router/index.js
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth.store";

// Lazy pages
const Home = () => import("../../modules/dashboard/pages/DashboardHome.vue");
const Login = () => import("../../modules/auth/pages/LoginPage.vue");

const Products = () => import("../../modules/products/pages/ProductsListPage.vue");
const Stock = () => import("../../modules/stock/pages/StockPage.vue");

// ✅ nuevo
const Categories = () => import("../../modules/categories/pages/CategoriesPage.vue");

const routes = [
  { path: "/", name: "home", component: Home, meta: { requiresAuth: true } },
  { path: "/products", name: "products", component: Products, meta: { requiresAuth: true } },
  { path: "/stock", name: "stock", component: Stock, meta: { requiresAuth: true } },

  // ✅ parametrización
  { path: "/categories", name: "categories", component: Categories, meta: { requiresAuth: true } },

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
});

export default router;
