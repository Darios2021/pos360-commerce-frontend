<!-- src/modules/auth/pages/LoginPage.vue -->
<template>
  <div class="login-shell">
    <!-- Fondo decorativo (blobs animados) -->
    <div class="login-bg">
      <span class="blob blob--a" />
      <span class="blob blob--b" />
      <span class="blob blob--c" />
    </div>

    <div class="login-grid">

      <!-- ══ PANEL IZQUIERDO — branding + value props ══ -->
      <aside class="login-side">
        <div class="login-side__hero">
          <h1 class="hero-title">
            Tu negocio<br />
            <span class="hero-accent">automatizado y bajo control.</span>
          </h1>
          <p class="hero-sub">
            Ecosistema de gestión con procesos automatizados y control remoto en
            tiempo real. Centralizá ventas, stock y monitoreo desde una sola plataforma.
          </p>

          <ul class="hero-features">
            <li>
              <v-icon size="20" class="feat-ico">mdi-storefront-outline</v-icon>
              <div class="feat-body">
                <div class="feat-title">Venta Omnicanal</div>
                <div class="feat-desc">Punto de venta rápido y tienda online sincronizada.</div>
              </div>
            </li>
            <li>
              <v-icon size="20" class="feat-ico">mdi-truck-fast-outline</v-icon>
              <div class="feat-body">
                <div class="feat-title">Logística en Red</div>
                <div class="feat-desc">Control de stock real y alertas de reposición.</div>
              </div>
            </li>
            <li>
              <v-icon size="20" class="feat-ico">mdi-monitor-eye</v-icon>
              <div class="feat-body">
                <div class="feat-title">Monitoreo Remoto</div>
                <div class="feat-desc">Consultas y estados de sistema al instante.</div>
              </div>
            </li>
            <li>
              <v-icon size="20" class="feat-ico">mdi-chart-box-outline</v-icon>
              <div class="feat-body">
                <div class="feat-title">Reportes de Gestión</div>
                <div class="feat-desc">Analítica de ventas y cierres operativos automáticos.</div>
              </div>
            </li>
          </ul>
        </div>

        <div class="login-side__foot">
          © {{ year }} · POS 360 — Desarrollado por <b>SAN JUAN TECNOLOGÍA</b>
        </div>
      </aside>

      <!-- ══ PANEL DERECHO — formulario ══ -->
      <main class="login-main">
        <div class="login-card">
          <div class="login-card__head">
            <img :src="LOGO_BLUE" alt="POS 360" class="login-logo" />
            <h2 class="login-title">Bienvenido de nuevo</h2>
            <p class="login-sub">Ingresá con tu cuenta para continuar</p>
          </div>

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            density="comfortable"
            class="mb-4 login-alert"
            closable
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <v-form @submit.prevent="submit" class="login-form">
            <v-text-field
              v-model="identifier"
              label="Usuario o email"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account-outline"
              autocomplete="username"
              autofocus
              :disabled="loading"
              hide-details="auto"
              class="login-input"
            />

            <v-text-field
              v-model="password"
              :label="'Contraseña'"
              :type="showPwd ? 'text' : 'password'"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-lock-outline"
              :append-inner-icon="showPwd ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
              @click:append-inner="showPwd = !showPwd"
              autocomplete="current-password"
              :disabled="loading"
              hide-details="auto"
              class="login-input"
              @keyup.enter="submit"
            />

            <div class="login-row">
              <v-checkbox
                v-model="remember"
                label="Mantener sesión"
                density="compact"
                hide-details
                color="primary"
                class="login-remember"
              />
            </div>

            <v-btn
              type="submit"
              block
              size="large"
              color="primary"
              variant="flat"
              rounded="lg"
              :loading="loading"
              :disabled="!canSubmit"
              class="login-cta"
            >
              <v-icon start size="18">mdi-login</v-icon>
              Entrar
            </v-btn>
          </v-form>

          <div class="login-foot">
            <span class="login-foot__hint">
              ¿Problemas para ingresar?
              <a href="mailto:soporte@sanjuantecnologia.com">Contactar soporte</a>
            </span>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";

const router = useRouter();
const auth = useAuthStore();

// Logo POS 360 — Versión final (logo redondo con gradiente brand #1488d1 → #121e47)
// Es el mismo logo en ambos paneles para mantener consistencia de marca.
const LOGO_FINAL = "https://storage-files.cingulado.org/pos360/media/1777339156015-9b15336ec844fc3e.webp";
const LOGO_BLUE  = LOGO_FINAL; // card derecha (fondo claro)
const LOGO_WHITE = LOGO_FINAL; // panel izquierdo (fondo navy)

const identifier = ref("");
const password   = ref("");
const showPwd    = ref(false);
const remember   = ref(true);

const loading = ref(false);
const error   = ref(null);

const year = new Date().getFullYear();

const canSubmit = computed(
  () => !!identifier.value.trim() && !!password.value && !loading.value
);

async function submit() {
  if (!canSubmit.value) return;
  loading.value = true;
  error.value = null;
  try {
    await auth.login({
      identifier: identifier.value.trim(),
      password: password.value,
      remember: remember.value,
    });
    router.replace({ name: "home" });
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "Credenciales incorrectas";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* ══ BRAND PALETTE ══
   Definidos como CSS vars para tocar el sistema entero desde un lugar.
   - --brand-deep:  navy oscuro del logo (#121e47)
   - --brand-light: celeste vivo del logo (#1488d1)
*/
.login-shell {
  --brand-deep:  #121e47;
  --brand-light: #1488d1;
  --brand-deep-rgb:  18, 30, 71;
  --brand-light-rgb: 20, 136, 209;

  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at top left,  rgba(var(--brand-light-rgb), 0.18), transparent 55%),
    radial-gradient(ellipse at bottom right, rgba(var(--brand-deep-rgb),  0.10), transparent 55%),
    linear-gradient(135deg, #f4f7fb 0%, #e8eef8 100%);
  overflow: hidden;
  padding: 24px;
}

/* Fondo decorativo: blobs con blur en colores marca */
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.50;
  animation: floatY 12s ease-in-out infinite;
}
.blob--a {
  width: 380px; height: 380px;
  top: -120px; left: -80px;
  background: radial-gradient(circle, var(--brand-deep), transparent 70%);
}
.blob--b {
  width: 460px; height: 460px;
  bottom: -160px; right: -120px;
  background: radial-gradient(circle, var(--brand-light), transparent 70%);
  animation-delay: -4s;
}
.blob--c {
  width: 300px; height: 300px;
  top: 35%; right: 30%;
  background: radial-gradient(circle, #4ba9e0, transparent 70%);
  opacity: 0.28;
  animation-delay: -8s;
}
@keyframes floatY {
  0%, 100% { transform: translateY(0) translateX(0); }
  50%      { transform: translateY(-20px) translateX(15px); }
}

/* ══ GRID 2 columnas ══ */
.login-grid {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1100px;
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 32px;
  align-items: stretch;
  animation: fadeInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 960px) {
  .login-grid { grid-template-columns: 1fr; max-width: 480px; }
}

/* ══ PANEL IZQUIERDO — gradiente exacto del logo ══ */
.login-side {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 40px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 18% 20%, rgba(20, 136, 209, 0.55), transparent 55%),
    linear-gradient(135deg, #121e47 0%, #1a2a5c 50%, #1488d1 130%);
  color: #fff;
  box-shadow:
    0 20px 60px rgba(18, 30, 71, 0.35),
    0 4px 12px rgba(18, 30, 71, 0.20);
  position: relative;
  overflow: hidden;
  min-height: 580px;
}
.login-side::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at top right, rgba(255,255,255,0.14), transparent 60%);
  pointer-events: none;
}

@media (max-width: 960px) {
  .login-side { display: none; }
}

.login-side__top { z-index: 1; position: relative; }
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}
/* Logo blanco flotante en el panel izquierdo (fondo azul) */
.brand-logo {
  width: 56px; height: 56px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.30));
  flex-shrink: 0;
}
.brand-text { line-height: 1.1; }
.brand-title { font-size: 17px; font-weight: 500; }
.brand-tagline { font-size: 11.5px; opacity: 0.85; }

.login-side__hero { z-index: 1; position: relative; }
.hero-title {
  font-size: clamp(28px, 3.4vw, 38px);
  font-weight: 500;
  line-height: 1.1;
  margin-bottom: 14px;
  letter-spacing: -0.5px;
}
.hero-accent {
  background: linear-gradient(90deg, #ffffff 0%, #a5d4f5 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero-sub {
  font-size: 13.5px;
  opacity: 0.88;
  margin-bottom: 24px;
  max-width: 92%;
  line-height: 1.5;
}
.hero-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.hero-features li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.10);
  padding: 12px 14px;
  border-radius: 12px;
  backdrop-filter: blur(6px);
  transition: background 0.18s, border-color 0.18s, transform 0.18s;
}
.hero-features li:hover {
  background: rgba(255, 255, 255, 0.10);
  border-color: rgba(255, 255, 255, 0.20);
  transform: translateX(2px);
}

.feat-ico {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 6px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(20, 136, 209, 0.45), rgba(255, 255, 255, 0.10));
  color: #fff !important;
  width: 32px; height: 32px;
}

.feat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.feat-title {
  font-size: 13.5px;
  font-weight: 500;
  letter-spacing: 0.1px;
  color: #ffffff;
  line-height: 1.2;
}
.feat-desc {
  font-size: 12px;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.78);
}

.login-side__foot {
  z-index: 1; position: relative;
  font-size: 11.5px;
  opacity: 0.75;
  margin-top: 32px;
}

/* ══ PANEL DERECHO — Formulario ══ */
.login-main {
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 100%;
  max-width: 460px;
  padding: 36px 32px;
  background: rgb(var(--v-theme-surface));
  border-radius: 22px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow:
    0 20px 60px rgba(0,0,0,0.10),
    0 4px 12px rgba(0,0,0,0.06);
}
.login-card__head {
  text-align: center;
  margin-bottom: 22px;
}
/* Logo brand flotante en la card derecha (fondo claro) */
.login-logo {
  width: 96px; height: 96px;
  margin: 0 auto 16px;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 8px 22px rgba(20, 136, 209, 0.35))
          drop-shadow(0 2px 4px rgba(18, 30, 71, 0.20));
  animation: logoFloat 6s ease-in-out infinite;
}
@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
.login-title {
  font-size: 22px;
  font-weight: 500;
  letter-spacing: -0.3px;
  margin-bottom: 4px;
}
.login-sub {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 0;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.login-input :deep(.v-field) {
  border-radius: 12px;
}
.login-input :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(20, 136, 209, 0.18);
}
.login-input :deep(.v-field--focused .v-field__outline__start),
.login-input :deep(.v-field--focused .v-field__outline__end),
.login-input :deep(.v-field--focused .v-field__outline__notch::before),
.login-input :deep(.v-field--focused .v-field__outline__notch::after) {
  border-color: #1488d1 !important;
}

.login-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: -4px;
}
.login-remember :deep(.v-label) { font-size: 13px; }

.login-cta {
  margin-top: 6px;
  height: 48px !important;
  font-size: 14.5px !important;
  font-weight: 500 !important;
  letter-spacing: 0.3px;
  text-transform: none;
  /* Gradiente brand: navy → celeste */
  background: linear-gradient(135deg, #121e47 0%, #1488d1 100%) !important;
  color: #fff !important;
  box-shadow: 0 8px 22px rgba(20, 136, 209, 0.35) !important;
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
}
.login-cta:hover:not(.v-btn--disabled):not(.v-btn--loading) {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 12px 30px rgba(20, 136, 209, 0.45) !important;
}
.login-cta.v-btn--disabled {
  opacity: 0.55;
}

.login-alert :deep(.v-alert__content) { font-size: 13px; }

.login-foot {
  text-align: center;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
}
.login-foot__hint {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.login-foot__hint a {
  color: #1488d1;
  font-weight: 400;
  text-decoration: none;
}
.login-foot__hint a:hover { text-decoration: underline; }

/* ══ DARK MODE — paleta brand ══ */
.v-theme--dark .login-shell {
  background:
    radial-gradient(ellipse at top left,  rgba(20, 136, 209, 0.30), transparent 55%),
    radial-gradient(ellipse at bottom right, rgba(18, 30, 71, 0.45), transparent 55%),
    linear-gradient(135deg, #08102a 0%, #0d1840 100%);
}

@media (max-width: 600px) {
  .login-shell { padding: 12px; }
  .login-card { padding: 28px 22px; border-radius: 18px; }
  .login-title { font-size: 20px; }
}
</style>
