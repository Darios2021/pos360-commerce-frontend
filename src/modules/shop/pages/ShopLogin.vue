<!--
  ShopLogin
  ---------
  Login del shop. Por ahora soporta solo Google Identity Services (GIS).
  El password queda almacenado en el backend cuando el usuario completa el
  perfil — más adelante se podrá agregar login email+password reusando ese hash.

  UI: split desktop con hero + login card. Mobile: solo card.
  Usa tokens de Vuetify (`var(--v-theme-*)`) para respetar dark mode.
-->
<template>
  <div class="sl">
    <div class="sl-shell">
      <!-- ── Hero (desktop) ───────────────────────────────────────── -->
      <section class="sl-hero" aria-label="Beneficios de tu cuenta">
        <!-- shapes decorativos -->
        <span class="sl-hero__shape sl-hero__shape--a" aria-hidden="true" />
        <span class="sl-hero__shape sl-hero__shape--b" aria-hidden="true" />

        <h1 class="sl-hero__title">
          Compra
          <span class="sl-hero__title--accent">segura</span>
        </h1>
        <p class="sl-hero__lead">
          Tu cuenta protegida, tus datos a mano y tus favoritos siempre con vos.
        </p>

        <ul class="sl-hero__benefits">
          <li class="sl-bn">
            <span class="sl-bn__ico"><v-icon size="20">mdi-cart-outline</v-icon></span>
            <div class="sl-bn__txt">
              <strong>Checkout sin fricción</strong>
              <span>Cargás tus datos una sola vez.</span>
            </div>
          </li>
          <li class="sl-bn">
            <span class="sl-bn__ico"><v-icon size="20">mdi-heart-outline</v-icon></span>
            <div class="sl-bn__txt">
              <strong>Favoritos sincronizados</strong>
              <span>Guardalos en cualquier dispositivo.</span>
            </div>
          </li>
          <li class="sl-bn">
            <span class="sl-bn__ico"><v-icon size="20">mdi-shield-lock-outline</v-icon></span>
            <div class="sl-bn__txt">
              <strong>Sesión segura</strong>
              <span>Login Google + contraseña propia.</span>
            </div>
          </li>
        </ul>

        <div class="sl-hero__trust">
          <span><v-icon size="14">mdi-lock-check</v-icon> Datos encriptados</span>
          <span class="sl-hero__trust-sep">·</span>
          <span><v-icon size="14">mdi-account-multiple-check</v-icon> Compradores verificados</span>
        </div>
      </section>

      <!-- ── Card de login ─────────────────────────────────────────── -->
      <section class="sl-card" aria-label="Iniciar sesión">
        <div class="sl-card__head">
          <div class="sl-card__icon">
            <v-icon size="22">mdi-account-circle-outline</v-icon>
          </div>
          <div>
            <div class="sl-card__title">Ingresá a tu cuenta</div>
            <div class="sl-card__sub">
              Usá Google para entrar. Te pediremos completar tus datos la primera vez.
            </div>
          </div>
        </div>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="sl-alert"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-else-if="!googleClientId"
          type="warning"
          variant="tonal"
          density="compact"
          class="sl-alert"
        >
          Falta configurar <b>VITE_GOOGLE_CLIENT_ID</b>.
        </v-alert>

        <!-- Google sign-in (botón oficial de Google Identity Services).
             Si falla la carga, mostramos el fallback que invoca el prompt. -->
        <div v-if="googleClientId" class="sl-google">
          <div ref="gisBtnWrap" class="sl-google__wrap">
            <div ref="gisBtn" class="sl-google__btn" />
          </div>

          <v-btn
            v-if="loading"
            block
            variant="text"
            size="small"
            disabled
            loading
            class="sl-google__loading"
          >
            Iniciando sesión…
          </v-btn>
        </div>

        <div class="sl-foot">
          <v-icon size="14" class="me-1">mdi-shield-lock-outline</v-icon>
          Usamos Google Identity Services. No vemos tu contraseña de Google.
        </div>

        <div class="sl-back">
          <v-btn variant="text" size="small" @click="goBack">
            <v-icon size="16" start>mdi-arrow-left</v-icon>
            Volver al shop
          </v-btn>
        </div>
      </section>
    </div>

    <!-- Dialog: ofrecer activar biometría tras primer login en mobile -->
    <v-dialog v-model="biometricDialog" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-fingerprint</v-icon>
          Ingresá con tu huella
        </v-card-title>
        <v-card-text>
          <div class="text-body-2">
            Activá el ingreso con huella o reconocimiento facial para abrir
            la app sin tener que loguearte cada vez. Es más rápido y seguro.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn variant="text" :disabled="biometricBusy" @click="skipBiometricAndContinue">
            Ahora no
          </v-btn>
          <v-spacer />
          <v-btn color="primary" variant="flat" :loading="biometricBusy" @click="enableBiometricAndContinue">
            Activar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useShopAuthStore } from "@/modules/shop/service/shopAuth.store";
import { isCapacitor } from "@/app/utils/runtime";
import { checkBiometricAvailability, authenticateBiometric } from "@/app/utils/biometric";
import { isBiometricEnabled, setBiometricEnabled } from "@/app/utils/tokenStorage";

const route = useRoute();
const router = useRouter();
const auth = useShopAuthStore();

const loading = ref(false);
const error = ref(null);

const gisBtn = ref(null);
const gisBtnWrap = ref(null);

const googleClientId = computed(() =>
  String(import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim()
);
const redirectTo = computed(() => String(route.query.redirect || "/shop"));

function goBack() {
  const r = redirectTo.value || "/shop";
  router.replace(r).catch(() => router.replace("/shop").catch(() => {}));
}

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

    // En la app móvil, si hay biometría disponible y todavía no la
    // activó, ofrecemos activarla. Si dice que sí, las próximas
    // entradas pedirán huella en lugar de re-loguear.
    if (isCapacitor()) {
      const already = await isBiometricEnabled();
      if (!already) {
        const avail = await checkBiometricAvailability();
        if (avail.available) {
          biometricDialog.value = true;
          // El dialog decide qué hacer; el redirect lo hace después.
          loading.value = false;
          return;
        }
      }
    }

    const target = redirectTo.value || "/shop";
    router.replace(target).catch(() => router.replace("/shop").catch(() => {}));
  } catch (e) {
    const msg = e?.friendlyMessage || e?.message || String(e);
    error.value = msg;
  } finally {
    loading.value = false;
  }
}

// Dialog "¿Activar huella?" después del primer login en mobile
const biometricDialog = ref(false);
const biometricBusy = ref(false);

async function enableBiometricAndContinue() {
  biometricBusy.value = true;
  try {
    // Pedimos la huella ahora mismo para confirmar que funciona y
    // que el usuario está dispuesto. Si rechaza, no activamos.
    const ok = await authenticateBiometric({
      reason: "Confirmá tu huella para activarla en este dispositivo",
    });
    if (ok) {
      await setBiometricEnabled(true);
    }
  } finally {
    biometricBusy.value = false;
    biometricDialog.value = false;
    const target = redirectTo.value || "/shop";
    router.replace(target).catch(() => router.replace("/shop").catch(() => {}));
  }
}

function skipBiometricAndContinue() {
  biometricDialog.value = false;
  const target = redirectTo.value || "/shop";
  router.replace(target).catch(() => router.replace("/shop").catch(() => {}));
}

function getGisWidth() {
  const el = gisBtnWrap.value || gisBtn.value;
  const w = Math.floor(el?.getBoundingClientRect?.().width || 0);
  return Math.max(240, Math.min(w || 360, 420));
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
    shape: "rectangular",
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

  onResize = () => {
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
/* Paleta explícita — el branding del shop pisa --v-theme-surface y
   --v-theme-background con tonos oscuros, así que evitamos esos
   tokens y usamos blanco + grises directos. */
.sl {
  min-height: calc(100dvh - 120px);
  display: grid;
  place-items: center;
  padding: 32px 16px;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  color: #111827;
  background: #ebebeb;
}

.sl-shell {
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(380px, 440px);
  gap: 56px;
  align-items: center;
}

/* ── HERO ────────────────────────────────────────────────────────── */
.sl-hero {
  position: relative;
  padding: 8px 0;
  min-width: 0;
  overflow: visible;
}

/* Shapes decorativos sutiles */
.sl-hero__shape {
  position: absolute;
  z-index: 0;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.55;
  pointer-events: none;
}
.sl-hero__shape--a {
  top: -40px;
  left: -50px;
  width: 240px;
  height: 240px;
  background: radial-gradient(circle, rgba(20, 136, 209, 0.45), transparent 70%);
}
.sl-hero__shape--b {
  bottom: -30px;
  left: 120px;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(0, 166, 80, 0.20), transparent 70%);
}

.sl-hero > *:not(.sl-hero__shape) { position: relative; z-index: 1; }

.sl-hero__title {
  margin: 0 0 12px;
  font-size: clamp(34px, 4.2vw, 52px);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}
.sl-hero__title--accent {
  color: #02498b;
}

.sl-hero__lead {
  margin: 0 0 28px;
  font-size: 15.5px;
  line-height: 1.55;
  color: rgba(15, 23, 42, 0.65);
  max-width: 50ch;
  font-weight: 400;
}

/* Lista de beneficios — pills modernas con hover */
.sl-hero__benefits {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
  max-width: 480px;
}
.sl-bn {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.sl-bn:hover {
  transform: translateY(-2px);
  border-color: rgba(20, 136, 209, 0.30);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.sl-bn__ico {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(20, 136, 209, 0.12), rgba(99, 102, 241, 0.10));
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sl-bn__txt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.sl-bn__txt strong {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.01em;
}
.sl-bn__txt span {
  font-size: 12.5px;
  color: rgba(15, 23, 42, 0.6);
  line-height: 1.4;
}

/* Trust signals al pie del hero */
.sl-hero__trust {
  margin-top: 22px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: rgba(15, 23, 42, 0.5);
  font-weight: 500;
}
.sl-hero__trust span { display: inline-flex; align-items: center; gap: 4px; }
.sl-hero__trust-sep { opacity: 0.4; }

/* ── CARD ────────────────────────────────────────────────────────── */
.sl-card {
  background: #ffffff;
  color: #111827;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.sl-card__head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.sl-card__icon {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(20, 136, 209, 0.12);
  color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.sl-card__title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: #111827;
}
.sl-card__sub {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.4;
  color: rgba(0, 0, 0, 0.6);
}

.sl-alert { margin: 0; }

.sl-google {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sl-google__wrap { width: 100%; min-height: 44px; }
.sl-google__btn {
  width: 100%;
  display: flex;
  justify-content: center;
}
.sl-google__btn :deep(> div) { width: 100% !important; }

.sl-google__loading {
  margin-top: 4px;
  text-transform: none;
  letter-spacing: 0;
}

.sl-foot {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  line-height: 1.4;
}

.sl-back {
  display: flex;
  justify-content: center;
  margin-top: -4px;
}

/* ── RESPONSIVE ─────────────────────────────────────────────────── */
@media (max-width: 960px) {
  .sl { padding: 18px 12px; }
  .sl-shell {
    grid-template-columns: 1fr;
    gap: 0;
    width: min(480px, 100%);
  }
  .sl-hero { display: none; }
}

@media (max-width: 600px) {
  .sl-card {
    border-radius: 14px;
    padding: 20px 18px;
    gap: 16px;
  }
  .sl-card__title { font-size: 17px; }
}
</style>
