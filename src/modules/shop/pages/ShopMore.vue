<!--
  ShopMore.vue — Vista "Más" mobile-first inspirada en Mercado Libre.
  Estructura:
    - Header con avatar + saludo del usuario logueado (o CTA de ingresá).
    - Banners destacados (acciones rápidas).
    - Sección "Navegación" (landings y catálogo).
    - Sección "Mi actividad" (compras, favoritos, etc.) — solo si hay sesión.
    - Cerrar sesión al final.
-->
<template>
  <div class="more-page" data-page="shop-more">
    <!-- Header sticky con back -->
    <div class="more-head">
      <button class="backBtn" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>
      <div class="headTitle">Más</div>
      <div class="headRight"></div>
    </div>

    <div class="more-wrap">

      <!-- ── HERO USER ─────────────────────────────────────────────── -->
      <router-link v-if="auth.isLogged" class="hero hero--user" to="/shop/account/profile">
        <div class="hero__avatar-wrap">
          <img
            v-if="auth.avatarUrl"
            :src="auth.avatarUrl"
            :alt="auth.fullName"
            class="hero__avatar"
            referrerpolicy="no-referrer"
          />
          <div v-else class="hero__avatar hero__avatar--initials">
            {{ auth.initials || "U" }}
          </div>
        </div>
        <div class="hero__body">
          <div class="hero__name">{{ auth.fullName || "Mi cuenta" }}</div>
          <div class="hero__link">
            Mi perfil
            <v-icon size="13">mdi-chevron-right</v-icon>
          </div>
        </div>
      </router-link>

      <router-link v-else class="hero hero--guest" to="/app/auth/login">
        <div class="hero__avatar-wrap">
          <div class="hero__avatar hero__avatar--guest">
            <v-icon size="24" color="white">mdi-account-circle-outline</v-icon>
          </div>
        </div>
        <div class="hero__body">
          <div class="hero__name">Ingresá a tu cuenta</div>
          <div class="hero__link">
            Iniciar sesión
            <v-icon size="13">mdi-chevron-right</v-icon>
          </div>
        </div>
      </router-link>

      <!-- ── BANNERS DESTACADOS ─────────────────────────────────────── -->
      <div class="banners">
        <a class="banner banner--whatsapp" :href="waHref" target="_blank" rel="noopener">
          <div class="banner__icon">
            <v-icon size="20" color="white">mdi-whatsapp</v-icon>
          </div>
          <div class="banner__body">
            <div class="banner__title">¿Necesitás ayuda?</div>
            <div class="banner__sub">Escribinos por WhatsApp</div>
          </div>
          <v-icon class="banner__chev" size="16">mdi-chevron-right</v-icon>
        </a>
      </div>

      <!-- ── NAVEGACIÓN ────────────────────────────────────────────── -->
      <div class="section">
        <div class="list">
          <router-link class="list-item" to="/shop">
            <v-icon class="list-item__icon" size="22">mdi-home-outline</v-icon>
            <span class="list-item__label">Inicio</span>
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </router-link>

          <router-link class="list-item" :to="{ name: 'shopLandingSeguridad' }">
            <v-icon class="list-item__icon" size="22">mdi-shield-check-outline</v-icon>
            <span class="list-item__label">San Juan Seguridad</span>
            <span class="list-item__tag">NUEVO</span>
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </router-link>

          <router-link class="list-item" :to="{ name: 'shopLandingSistemas' }">
            <v-icon class="list-item__icon" size="22">mdi-monitor-dashboard</v-icon>
            <span class="list-item__label">San Juan Sistemas</span>
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </router-link>

          <router-link class="list-item" :to="{ name: 'shopLandingServicioTecnico' }">
            <v-icon class="list-item__icon" size="22">mdi-tools</v-icon>
            <span class="list-item__label">Servicio Técnico</span>
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </router-link>

          <a class="list-item" :href="waHref" target="_blank" rel="noopener">
            <v-icon class="list-item__icon" size="22">mdi-help-circle-outline</v-icon>
            <span class="list-item__label">Ayuda</span>
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </a>
        </div>
      </div>

      <!-- ── MI ACTIVIDAD (logueado) ───────────────────────────────── -->
      <div v-if="auth.isLogged" class="section">
        <div class="section__title">Mi actividad</div>
        <div class="list">
          <router-link class="list-item" to="/shop/account/orders">
            <v-icon class="list-item__icon" size="22">mdi-package-variant</v-icon>
            <span class="list-item__label">Mis compras</span>
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </router-link>

          <router-link class="list-item" to="/shop/account/favorites">
            <v-icon class="list-item__icon" size="22">mdi-heart-outline</v-icon>
            <span class="list-item__label">Favoritos</span>
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </router-link>

          <router-link class="list-item" to="/shop/account/profile">
            <v-icon class="list-item__icon" size="22">mdi-account-edit-outline</v-icon>
            <span class="list-item__label">Datos personales</span>
            <span v-if="!auth.isProfileComplete" class="list-item__warn-dot" aria-hidden="true" />
            <v-icon class="list-item__chev" size="18">mdi-chevron-right</v-icon>
          </router-link>
        </div>
      </div>

      <!-- ── CERRAR SESIÓN ─────────────────────────────────────────── -->
      <div v-if="auth.isLogged" class="section">
        <div class="list">
          <button
            type="button"
            class="list-item list-item--danger"
            :disabled="logoutLoading"
            @click="onLogout"
          >
            <v-icon class="list-item__icon" size="22">mdi-logout</v-icon>
            <span class="list-item__label">Cerrar sesión</span>
          </button>
        </div>
      </div>

      <!-- ── FOOTER tipográfico ────────────────────────────────────── -->
      <div class="more-foot">
        POS 360 · San Juan Tecnología
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";
import { useShopFavoritesStore } from "@/modules/shop/service/shopFavorites.store";

const router = useRouter();
const auth = useShopAuthStore();
const favs = useShopFavoritesStore();

const logoutLoading = ref(false);

const waHref = computed(() => {
  const phone = "5492644448834";
  const text = encodeURIComponent("Hola! Tengo una consulta.");
  return `https://wa.me/${phone}?text=${text}`;
});

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/shop");
}

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
/*
 * ShopMore — diseño app móvil con:
 * - Hero del usuario (logueado / invitado)
 * - Banners destacados con icon prominente
 * - Listas tipo iOS/ML con divider sutil entre items
 * - Tags "NUEVO" inline
 * - Cerrar sesión separado al final
 */
.more-page {
  background: #f6f7f9;
  min-height: 100vh;
}

/* ── Header sticky ─────────────────────────────────────────── */
.more-head {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 52px;
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  border-bottom: 1px solid #ededed;
  background: #fff;
}
.backBtn {
  width: 52px;
  height: 52px;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.headTitle {
  font-weight: 600;
  font-size: 17px;
  letter-spacing: -0.01em;
  color: #111;
  text-align: center;
}
.headRight {
  width: 52px;
  height: 52px;
}

.more-wrap {
  padding: 14px 12px 32px;
  display: grid;
  gap: 12px;
}

/* ── HERO usuario / guest ──────────────────────────────────── */
.hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #fff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: inherit;
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(20, 136, 209, 0.06) 0%,
    transparent 60%);
  pointer-events: none;
}
.hero__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}
.hero__avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  background: #eee;
  display: grid;
  place-items: center;
  box-shadow: 0 0 0 3px rgba(20, 136, 209, 0.12);
}
.hero__avatar--initials {
  background: rgba(20, 136, 209, 0.14);
  color: #1488d1;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.hero__avatar--guest {
  background: linear-gradient(135deg, #1488d1, #0e6ba8);
  color: #fff;
}
.hero__body {
  min-width: 0;
  flex: 1;
  position: relative;
  z-index: 1;
}
.hero__name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: #111;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hero__link {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  margin-top: 4px;
  font-size: 13px;
  color: #1488d1;
  font-weight: 500;
}

/* ── BANNERS destacados ────────────────────────────────────── */
.banners {
  display: grid;
  gap: 8px;
}
.banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: inherit;
  transition: background 0.15s, transform 0.1s;
}
.banner:active { transform: scale(0.98); }
.banner__icon {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.banner--whatsapp .banner__icon {
  background: linear-gradient(135deg, #25d366, #1ebe5d);
}
.banner__body { flex: 1; min-width: 0; }
.banner__title {
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: #111;
  line-height: 1.2;
}
.banner__sub {
  font-size: 11.5px;
  color: rgba(0, 0, 0, 0.55);
  margin-top: 2px;
}
.banner__chev {
  color: rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
}

/* ── SECTIONS ──────────────────────────────────────────────── */
.section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.section__title {
  padding: 4px 4px 2px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.45);
}

/* ── LISTAS estilo Mercado Libre ───────────────────────────── */
.list {
  background: #fff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  text-decoration: none;
  color: #111;
  background: transparent;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  width: 100%;
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s;
  font-size: 14.5px;
  position: relative;
}
.list-item:first-child { border-top: 0; }
.list-item:active { background: rgba(0, 0, 0, 0.03); }
.list-item__icon {
  color: rgba(0, 0, 0, 0.7);
  flex-shrink: 0;
}
.list-item__label {
  flex: 1;
  font-weight: 500;
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.list-item__chev {
  color: rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}
.list-item__tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 6px;
  background: #1488d1;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.list-item__warn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  flex-shrink: 0;
}

/* Item peligroso (Cerrar sesión) */
.list-item--danger {
  color: #dc2626;
}
.list-item--danger .list-item__icon { color: #dc2626; }
.list-item--danger:active { background: rgba(220, 38, 38, 0.05); }
.list-item--danger:disabled { opacity: 0.6; cursor: wait; }

/* ── Footer tipográfico ────────────────────────────────────── */
.more-foot {
  text-align: center;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-weight: 500;
  padding: 12px 0 4px;
}
</style>
