<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopLogin.vue -->
<template>
  <div class="sl">
    <div class="sl-shell">
      <!-- Panel izquierdo (desktop) -->
      <section class="sl-left" aria-label="Información de inicio de sesión">
        <div class="sl-left-badge">
          <span class="sl-left-dot" aria-hidden="true" />
          <span class="sl-left-brand">San Juan Tecnología</span>
        </div>

        <h1 class="sl-left-title">Ingresá para comprar más rápido</h1>
        <p class="sl-left-sub">
          Accedé con Google para ver tus compras, favoritos y avanzar en el checkout sin perder tiempo.
        </p>

        <div class="sl-left-cards">
          <div class="sl-mini">
            <div class="sl-mini-title">✅ Tus compras</div>
            <div class="sl-mini-sub">Seguimiento y historial</div>
          </div>
          <div class="sl-mini">
            <div class="sl-mini-title">❤️ Favoritos</div>
            <div class="sl-mini-sub">Guardá para después</div>
          </div>
          <div class="sl-mini">
            <div class="sl-mini-title">🔒 Sesión segura</div>
            <div class="sl-mini-sub">Google Identity Services</div>
          </div>
        </div>
      </section>

      <!-- Panel derecho (card login) -->
      <section class="sl-right" aria-label="Formulario de inicio de sesión">
        <div class="sl-card">
          <!-- header tipo ML -->
          <div class="sl-card-top">
            <div class="sl-card-topbar" aria-hidden="true" />
            <div class="sl-title">Ingresá</div>
            <div class="sl-sub">
              Entrá con Google para ver tus compras y avanzar más rápido.
            </div>
          </div>

          <v-alert v-if="error" type="error" variant="tonal" class="mt-3">
            {{ error }}
          </v-alert>

          <v-alert v-else-if="!googleClientId" type="warning" variant="tonal" class="mt-3">
            Falta configurar <b>VITE_GOOGLE_CLIENT_ID</b> en el frontend.
            <br />
            (Es el mismo valor que ya tenés en backend: <b>GOOGLE_CLIENT_ID</b>)
          </v-alert>

          <!-- ✅ Botón Google (GIS) -->
          <div class="sl-google" v-if="googleClientId">
            <div ref="gisBtnWrap" class="sl-gis-wrap">
              <div ref="gisBtn" class="sl-gis-btn" />
            </div>

            <div class="sl-or">
              <span />
              <em>o</em>
              <span />
            </div>

            <div class="sl-note">
              Al continuar, aceptás iniciar sesión con tu cuenta Google.
            </div>
          </div>

          <div class="sl-actions">
            <v-btn class="sl-btn-back" variant="tonal" @click="goBack">
              Volver
            </v-btn>

            <v-btn
              class="sl-btn-main"
              color="primary"
              :loading="loading"
              :disabled="!googleClientId"
              @click="promptGoogle"
            >
              Continuar
            </v-btn>
          </div>

          <div class="sl-foot">
            ¿Problemas con el navegador interno de Instagram/Facebook?
            Probá “Abrir en navegador”.
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

/**
 * ✅ IMPORT FIX (igual que tu header actual):
 * Si tu store real está en /service, dejalo así.
 */
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";

const route = useRoute();
const router = useRouter();
const auth = useShopAuthStore();

const loading = ref(false);
const error = ref(null);

const gisBtn = ref(null);
const gisBtnWrap = ref(null);

const googleClientId = computed(() => String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim());
const redirectTo = computed(() => String(route.query.redirect || "/shop"));

function goBack() {
  const r = redirectTo.value || "/shop";
  router.replace(r).catch(() => router.replace("/shop").catch(() => {}));
}

// ========================
// GIS loader
// ========================
let scriptEl = null;
let onResize = null;

function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve(true);

    const existing = document.querySelector('script[data-gis="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    scriptEl = document.createElement("script");
    scriptEl.src = "https://accounts.google.com/gsi/client";
    scriptEl.async = true;
    scriptEl.defer = true;
    scriptEl.dataset.gis = "1";

    scriptEl.onload = () => resolve(true);
    scriptEl.onerror = reject;

    document.head.appendChild(scriptEl);
  });
}

async function onGoogleCredentialResponse(resp) {
  try {
    loading.value = true;
    error.value = null;

    const credential = resp?.credential;
    if (!credential) throw new Error("No llegó credential de Google.");

    await auth.loginGoogle({ credential });

    const target = redirectTo.value || "/shop";
    router.replace(target).catch(() => router.replace("/shop").catch(() => {}));
  } catch (e) {
    const msg = e?.friendlyMessage || e?.message || String(e);
    error.value = msg;
  } finally {
    loading.value = false;
  }
}

function getGisWidth() {
  const el = gisBtnWrap.value || gisBtn.value;
  const w = Math.floor(el?.getBoundingClientRect?.().width || 0);
  // límites razonables
  return Math.max(240, Math.min(w || 320, 420));
}

function renderGisButton() {
  if (!window.google?.accounts?.id) return;
  if (!gisBtn.value) return;

  gisBtn.value.innerHTML = "";

  window.google.accounts.id.renderButton(gisBtn.value, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "rect", // más ML (menos píldora)
    logo_alignment: "left",
    width: getGisWidth(),
  });
}

async function initGis() {
  if (!googleClientId.value) return;

  await loadGisScript();
  await nextTick();

  window.google.accounts.id.initialize({
    client_id: googleClientId.value,
    callback: onGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  renderGisButton();

  // re-render en resize (responsive real)
  onResize = () => {
    // throttle simple
    clearTimeout(onResize._t);
    onResize._t = setTimeout(() => renderGisButton(), 120);
  };
  window.addEventListener("resize", onResize, { passive: true });
}

function promptGoogle() {
  if (!window.google?.accounts?.id) return;
  window.google.accounts.id.prompt();
}

onMounted(async () => {
  try {
    await auth.fetchMe?.({ force: true });
    if (auth.isLogged) {
      const target = redirectTo.value || "/shop";
      return router.replace(target).catch(() => router.replace("/shop").catch(() => {}));
    }
    await initGis();
  } catch (e) {
    error.value = e?.message || String(e);
  }
});

onBeforeUnmount(() => {
  try {
    if (onResize) window.removeEventListener("resize", onResize);
  } catch {}
});
</script>

<style scoped>
/* ================================
   BASE (ML: limpio, aireado)
================================ */
.sl {
  min-height: calc(100vh - 120px);
  background: #ffffff; /* ML es más blanco */
  display: grid;
  place-items: start center;
  padding: 36px 16px;
  font-family: Proxima Nova, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  color: #111827;
}

/* Contenedor general */
.sl-shell {
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: minmax(420px, 1fr) 420px;
  gap: 64px; /* aire ML */
  align-items: start;
  padding-top: 8px;
}

/* ================================
   PANEL IZQUIERDO (desktop)
   ML: texto grande, simple, sin cajas
================================ */
.sl-left {
  padding: 8px 0 0;
}

.sl-left-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;              /* ML no usa pill acá */
  background: transparent;  /* sin caja */
  border: 0;
  box-shadow: none;
}

.sl-left-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #3483fa;
}

.sl-left-brand {
  font-weight: 400;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.78);
  letter-spacing: 0.1px;
}

.sl-left-title {
  margin: 14px 0 10px;
  font-size: 42px;   /* ML grande */
  line-height: 1.08;
  font-weight: 500;
  color: #111827;
  max-width: 18ch;
}

.sl-left-sub {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(17, 24, 39, 0.72);
  max-width: 56ch;
}

/* Beneficios: texto simple, sin “cards” */
.sl-left-cards {
  margin-top: 20px;
  display: grid;
  gap: 14px;
  max-width: 520px;
}

.sl-mini {
  background: transparent;
  border: 0;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.sl-mini-title {
  font-weight: 500;
  font-size: 14px;
  color: #111827;
}

.sl-mini-sub {
  margin-top: 2px;
  font-size: 13px;
  color: rgba(17, 24, 39, 0.65);
}

/* ================================
   LOGIN CARD (derecha) - ML sutil
================================ */
.sl-right {
  display: grid;
}

.sl-card {
  background: #fff;
  border-radius: 6px; /* ML suele ser menos redondo */
  border: 1px solid rgba(0,0,0,0.12);
  box-shadow: 0 1px 2px rgba(0,0,0,0.06); /* sombra mínima */
  overflow: hidden;
}

/* sin barra/linea superior */
.sl-card-top {
  padding: 22px 22px 10px;
  border: 0;
}

.sl-title {
  font-size: 24px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #111827;
}

.sl-sub {
  font-size: 13.5px;
  line-height: 1.45;
  color: rgba(17, 24, 39, 0.72);
}

/* zona Google */
.sl-google {
  padding: 14px 22px 6px;
  display: grid;
  gap: 12px;
}

.sl-gis-wrap {
  width: 100%;
}

.sl-gis-btn {
  width: 100%;
  min-height: 44px;
}

/* separador simple */
.sl-or {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  padding: 2px 0;
}

.sl-or span {
  height: 1px;
  background: rgba(0,0,0,0.10);
}

.sl-or em {
  font-style: normal;
  font-size: 12px;
  color: rgba(0,0,0,0.55);
}

.sl-note {
  font-size: 12px;
  color: rgba(17, 24, 39, 0.65);
}

/* botones */
.sl-actions {
  padding: 14px 22px 18px;
  display: grid;
  gap: 10px;
}

/* El look final lo da Vuetify, acá solo pequeños detalles */
.sl-btn-back {
  background: #e6e6e6 !important;
  color: #111 !important;
  font-weight: 400;
  letter-spacing: 0.8px;
}

.sl-btn-main {
  font-weight: 500;
  letter-spacing: 0.6px;
}

/* footer */
.sl-foot {
  padding: 0 22px 18px;
  font-size: 12px;
  color: rgba(17, 24, 39, 0.60);
}

/* ================================
   RESPONSIVE
================================ */

/* Tablet y abajo: 1 columna (y panel oculto) */
@media (max-width: 960px) {
  .sl {
    padding: 18px 12px;
    place-items: start center;
  }

  .sl-shell {
    grid-template-columns: 1fr;
    gap: 0;
    width: min(520px, 100%);
  }

  /* ✅ NO mostrar panel izquierdo en mobile/tablet */
  .sl-left {
    display: none !important;
  }
}

@media (max-width: 600px) {
  .sl-card {
    border-radius: 10px;
  }

  .sl-card-top {
    padding: 18px 16px 10px;
  }

  .sl-google,
  .sl-actions,
  .sl-foot {
    padding-left: 16px;
    padding-right: 16px;
  }

  .sl-title {
    font-size: 22px;
  }
}
</style>

