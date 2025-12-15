import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../store/auth.store";

const Home = () => import("../../modules/dashboard/pages/DashboardHome.vue");
const Login = () => import("../../modules/auth/pages/LoginPage.vue");

const routes = [
  {
    path: "/",
    name: "home",
    component: Home,
    meta: { requiresAuth: true },
  },
  {
    path: "/auth/login",
    name: "login",
    component: Login,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  if (auth.status === "idle") auth.hydrate();

  if (to.meta.requiresAuth && !auth.isAuthed) {
    return { name: "login" };
  }

  if (to.meta.requiresAuth && auth.isAuthed && !auth.user) {
    try {
      await auth.me();
    } catch {
      return { name: "login" };
    }
  }

  if (to.name === "login" && auth.isAuthed) {
    return { name: "home" };
  }
});
