<!--
  ShopAccountLayout (ML-like)
  ---------------------------
  Estructura tipo Mercado Libre / "Mi cuenta":
    - Sin header propio (ya está el ShopHeader del shop arriba).
    - Container centrado max 1200px.
    - Breadcrumb + título de sección.
    - Desktop: sidebar fijo izquierdo con menú vertical (Perfil / Mis compras /
      Favoritos / Cerrar sesión) + main derecho.
    - Mobile: lista vertical de items (sin sidebar) y router-view abajo.
-->
<template>
  <div class="acc">
    <div class="acc-shell">
      <!-- Breadcrumb -->
      <nav class="acc-crumb" aria-label="Migas">
        <router-link to="/shop">Inicio</router-link>
        <span>›</span>
        <span class="acc-crumb__current">{{ currentLabel }}</span>
      </nav>

      <div class="acc-grid">
        <!-- ── Sidebar (desktop) / Lista (mobile) ─────────────── -->
        <aside class="acc-side" aria-label="Secciones de la cuenta">
          <div class="acc-side__user">
            <img
              v-if="auth.avatarUrl"
              :src="auth.avatarUrl"
              :alt="auth.fullName"
              class="acc-side__avatar acc-side__avatar--img"
              referrerpolicy="no-referrer"
            />
            <div v-else class="acc-side__avatar">{{ auth.initials || "U" }}</div>
            <div class="acc-side__txt">
              <div class="acc-side__name">{{ auth.fullName || "Mi cuenta" }}</div>
              <div class="acc-side__email">{{ auth.customer?.email || "—" }}</div>
            </div>
          </div>

          <nav class="acc-menu">
            <router-link
              v-for="t in tabs"
              :key="t.path"
              :to="t.path"
              class="acc-menu__item"
              :class="{ 'is-active': isActive(t.path) }"
            >
              <v-icon size="20" :color="isActive(t.path) ? 'primary' : undefined">
                {{ t.icon }}
              </v-icon>
              <span class="acc-menu__label">{{ t.label }}</span>
              <span
                v-if="t.path === '/shop/account/profile' && !auth.isProfileComplete"
                class="acc-menu__warn"
                aria-hidden="true"
              />
              <v-icon
                v-if="isActive(t.path)"
                size="16"
                color="primary"
                class="acc-menu__chev"
              >mdi-chevron-right</v-icon>
            </router-link>

            <button
              type="button"
              class="acc-menu__item acc-menu__logout"
              :disabled="logoutLoading"
              @click="onLogout"
            >
              <v-icon size="20">mdi-logout</v-icon>
              <span class="acc-menu__label">Cerrar sesión</span>
            </button>
          </nav>
        </aside>

        <!-- ── Contenido ──────────────────────────────────────── -->
        <main class="acc-main">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";
import { useShopFavoritesStore } from "@/modules/shop/service/shopFavorites.store";

const router = useRouter();
const route = useRoute();
const auth = useShopAuthStore();
const favs = useShopFavoritesStore();

const logoutLoading = ref(false);

const tabs = [
  { path: "/shop/account/profile",   icon: "mdi-account-outline",      label: "Perfil" },
  { path: "/shop/account/orders",    icon: "mdi-receipt-text-outline", label: "Mis compras" },
  { path: "/shop/account/favorites", icon: "mdi-heart-outline",        label: "Favoritos" },
];

function isActive(path) { return String(route.path || "").startsWith(path); }

const currentLabel = computed(() => {
  const t = tabs.find((x) => isActive(x.path));
  return t?.label || "Mi cuenta";
});

async function onLogout() {
  if (logoutLoading.value) return;
  logoutLoading.value = true;
  try {
    await auth.logout();
    favs.reset();
    router.replace("/shop").catch(() => {});
  } finally {
    logoutLoading.value = false;
  }
}
</script>

<style scoped>
.acc {
  background: #ebebeb;
  min-height: calc(100dvh - 120px);
  color: #111827;
  padding: 18px 0 48px;
}

.acc-shell {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}

/* ── Breadcrumb ─────────────────────────────────────────────── */
.acc-crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 16px;
}
.acc-crumb a {
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
}
.acc-crumb a:hover { text-decoration: underline; }
.acc-crumb__current { color: rgba(0, 0, 0, 0.85); font-weight: 500; }

/* ── Grid: sidebar + main ───────────────────────────────────── */
.acc-grid {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

/* ── Sidebar ────────────────────────────────────────────────── */
.acc-side {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.10);
  overflow: hidden;
  position: sticky;
  top: 16px;
}

.acc-side__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.acc-side__avatar {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(20, 136, 209, 0.12);
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
}
.acc-side__avatar--img {
  object-fit: cover;
  background: #f5f5f5;
}
.acc-side__txt { min-width: 0; line-height: 1.2; }
.acc-side__name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.acc-side__email {
  margin-top: 2px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.acc-menu {
  display: flex;
  flex-direction: column;
  padding: 6px 0;
}
.acc-menu__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 18px;
  text-decoration: none;
  color: rgba(0, 0, 0, 0.78);
  font-size: 14px;
  font-weight: 400;
  background: transparent;
  border: 0;
  cursor: pointer;
  position: relative;
  text-align: left;
  width: 100%;
}
.acc-menu__item:hover {
  background: rgba(0, 0, 0, 0.04);
  color: #111827;
}
.acc-menu__item.is-active {
  background: rgba(20, 136, 209, 0.08);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
.acc-menu__item.is-active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 6px;
  bottom: 6px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: rgb(var(--v-theme-primary));
}

.acc-menu__label { flex: 1 1 auto; }
.acc-menu__chev { margin-left: auto; }
.acc-menu__warn {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  margin-left: auto;
}

.acc-menu__logout {
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  margin-top: 4px;
  padding-top: 12px;
  color: #b91c1c;
}
.acc-menu__logout:hover { background: rgba(185, 28, 28, 0.06); color: #991b1b; }
.acc-menu__logout:disabled { opacity: 0.6; cursor: wait; }

/* ── Main ───────────────────────────────────────────────────── */
.acc-main {
  min-width: 0;
}

/* ── Mobile ─────────────────────────────────────────────────── */
@media (max-width: 880px) {
  .acc { padding: 12px 0 32px; }
  .acc-shell { padding: 0 12px; }
  .acc-grid { grid-template-columns: 1fr; gap: 12px; }
  .acc-side { position: static; }
}

/* ── Mobile real (≤600px) — app-style con pills ── */
@media (max-width: 600px) {
  .acc { padding: 0 0 24px; }
  .acc-shell { padding: 0; }

  /* Breadcrumb redundante (ya hay back/bottomnav) */
  .acc-crumb { display: none; }

  /* Avatar duplicado (ya está en el menú del header del shop) */
  .acc-side__user { display: none; }

  /* "Cerrar sesión" duplicado (ya está en el menú del header del shop) */
  .acc-menu__logout { display: none; }

  /* Tabs estilo Apple/Twitter: solo texto + underline celeste grueso */
  .acc-side {
    position: sticky;
    top: 0;
    z-index: 5;
    background: #ffffff;
    border-radius: 0;
    box-shadow: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    overflow: hidden;
    margin-bottom: 4px;
  }
  .acc-menu {
    flex-direction: row;
    overflow-x: auto;
    padding: 0 12px;
    gap: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  .acc-menu::-webkit-scrollbar { display: none; }

  .acc-menu__item {
    flex-direction: row;
    flex-shrink: 0;
    padding: 12px 4px;
    margin: 0 8px;
    border-radius: 0;
    border: 0;
    background: transparent;
    color: rgba(0, 0, 0, 0.55);
    font-weight: 500;
    font-size: 14px;
    letter-spacing: -0.01em;
    gap: 0;
    white-space: nowrap;
    width: auto;
    min-height: 0;
    position: relative;
    transition: color 0.15s;
  }
  .acc-menu__item:first-child { margin-left: 0; }
  .acc-menu__item :deep(.v-icon) { display: none; }
  .acc-menu__chev { display: none; }
  .acc-menu__warn { display: none; }

  .acc-menu__item:hover { background: transparent; color: rgba(0, 0, 0, 0.85); }
  .acc-menu__item.is-active {
    background: transparent;
    color: rgb(var(--v-theme-primary));
    font-weight: 600;
  }
  .acc-menu__item.is-active::before {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    width: auto;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: rgb(var(--v-theme-primary));
  }

  /* Main content */
  .acc-main { padding: 0 12px; }
}
</style>
