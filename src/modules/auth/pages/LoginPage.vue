<!-- src/modules/auth/pages/LoginPage.vue -->
<!-- Login v2: pantalla partida a sangre. Marca a la izquierda (navy del logo),
     formulario a la derecha sobre blanco. En celular queda solo el formulario. -->
<template>
  <div class="lg">
    <!-- ══ MARCA ══ -->
    <aside class="lg-side">
      <div class="lg-side__grid" aria-hidden="true" />
      <div class="lg-side__glow" aria-hidden="true" />

      <div class="lg-side__hero">
        <h1 class="lg-title">
          Tu negocio automatizado<br />
          <span>y bajo control.</span>
        </h1>
        <p class="lg-lead">
          Ventas, stock y monitoreo en una sola plataforma, con procesos
          automáticos y control remoto en tiempo real.
        </p>

        <ul class="lg-feats">
          <li v-for="f in FEATS" :key="f.t">
            <span class="lg-feats__ico"><v-icon size="18">{{ f.i }}</v-icon></span>
            <span class="lg-feats__tx">
              <b>{{ f.t }}</b>
              <small>{{ f.d }}</small>
            </span>
          </li>
        </ul>
      </div>

      <footer class="lg-foot lg-foot--dark lg-side__foot">
        <span class="lg-foot__brand"><b>POS 360</b> por <a href="https://sanjuansistemas.com/" target="_blank" rel="noopener">San Juan Sistemas</a></span>
        <span class="lg-foot__copy">© {{ year }}</span>
      </footer>
    </aside>

    <!-- ══ FORMULARIO ══ -->
    <main class="lg-main">
      <div class="lg-form-wrap">
        <img :src="LOGO" alt="POS 360" class="lg-logo" />

        <h2 class="lg-h">Ingresar</h2>
        <p class="lg-sub">Con tu usuario o email de POS 360.</p>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="comfortable"
          class="mb-4 lg-alert"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </v-alert>

        <v-form @submit.prevent="submit" class="lg-form">
          <label class="lg-lbl" for="lg-user">Usuario o email</label>
          <v-text-field
            id="lg-user"
            v-model="identifier"
            placeholder="usuario@comercio.com"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-account-outline"
            autocomplete="username"
            autofocus
            :disabled="loading"
            hide-details="auto"
            class="lg-input"
          />

          <label class="lg-lbl" for="lg-pass">Contraseña</label>
          <v-text-field
            id="lg-pass"
            v-model="password"
            placeholder="••••••••"
            :type="showPwd ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="showPwd ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
            @click:append-inner="showPwd = !showPwd"
            autocomplete="current-password"
            :disabled="loading"
            hide-details="auto"
            class="lg-input"
            @keyup.enter="submit"
          />

          <v-checkbox
            v-model="remember"
            label="Mantener sesión iniciada"
            density="compact"
            hide-details
            color="primary"
            class="lg-check"
          />

          <!-- APK: cerrojo de huella al abrir la app (app/native/huella.js) -->
          <v-switch
            v-if="huellaOk"
            v-model="conHuella"
            label="Entrar con huella la próxima vez"
            color="primary"
            density="compact"
            hide-details
            inset
            class="lg-check"
          />

          <v-btn
            type="submit"
            block
            size="large"
            variant="flat"
            rounded="lg"
            :loading="loading"
            :disabled="!canSubmit"
            class="lg-cta"
          >
            Entrar
            <v-icon end size="18">mdi-arrow-right</v-icon>
          </v-btn>
        </v-form>

        <p class="lg-help">
          ¿Problemas para ingresar?
          <a href="mailto:soporte@sanjuantecnologia.com">Contactar soporte</a>
        </p>
      </div>

      <footer class="lg-foot lg-foot--light lg-main__foot">
        <span class="lg-foot__brand"><b>POS 360</b> por <a href="https://sanjuansistemas.com/" target="_blank" rel="noopener">San Juan Sistemas</a></span>
        <span class="lg-foot__copy">© {{ year }}</span>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";
import { huellaDisponible, activarHuella } from "@/app/native/huella";

const router = useRouter();
const auth = useAuthStore();

// Logo POS 360 (carrito celeste): va sobre fondo blanco.
const LOGO = "https://storage-files.cingulado.org/pos360/media/1777400527242-60fdb9fd89279d42.webp";

const identifier = ref("");
const password   = ref("");
const showPwd    = ref(false);
const remember   = ref(true);

// APK: ofrecer la huella solo si el telefono la tiene configurada.
const huellaOk  = ref(false);
const conHuella = ref(true);
huellaDisponible().then((ok) => { huellaOk.value = ok; });

const loading = ref(false);
const error   = ref(null);

const year = new Date().getFullYear();

const FEATS = [
  { i: "mdi-storefront-outline", t: "Venta omnicanal", d: "Punto de venta y tienda online sincronizados." },
  { i: "mdi-package-variant-closed", t: "Stock en red", d: "Stock real por sucursal y alertas de reposición." },
  { i: "mdi-monitor-eye", t: "Monitoreo remoto", d: "Consultas y estado del sistema al instante." },
  { i: "mdi-chart-box-outline", t: "Reportes de gestión", d: "Ventas y cierres de caja automáticos." },
];

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
    if (huellaOk.value) activarHuella(conHuella.value && remember.value);
    router.replace({ name: "home" });
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "Credenciales incorrectas";
  } finally {
    loading.value = false;
  }
}
</script>
<style scoped>
/* Paleta del logo: navy #121e47 y celeste #1488d1. Login siempre en claro. */
.lg {
  --navy: #121e47;
  --cel: #1488d1;
  --tx: #121e47;
  --tx2: #5b6478;
  --line: #dfe4ec;

  color-scheme: light;
  min-height: 100vh;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(420px, 1fr);
  background: #fff;
  color: var(--tx);

  /* Tokens Vuetify locales: inputs y checkbox no heredan el modo oscuro */
  --v-theme-surface: 255, 255, 255;
  --v-theme-on-surface: 18, 30, 71;
  --v-theme-background: 255, 255, 255;
  --v-theme-on-background: 18, 30, 71;
  --v-border-color: 18, 30, 71;
  --v-border-opacity: 0.14;
}

/* ══ MARCA ══ */
.lg-side {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  padding: 48px 56px;
  background: var(--navy);
  color: #fff;
}
.lg-side__grid {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%);
}
.lg-side__glow {
  position: absolute;
  width: 640px; height: 640px;
  right: -220px; bottom: -260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(20,136,209,.55), transparent 65%);
  filter: blur(20px);
}
.lg-side > :not([aria-hidden]) { position: relative; z-index: 1; }

.lg-side__hero { max-width: 520px; margin: auto 0; }
.lg-title {
  font-size: clamp(32px, 3.6vw, 46px);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: -1px;
  margin: 0 0 18px;
}
.lg-title span { color: #6fc0f2; }
.lg-lead {
  font-size: 15px;
  line-height: 1.55;
  color: rgba(255,255,255,.75);
  margin: 0 0 32px;
  max-width: 440px;
}

.lg-feats {
  list-style: none; margin: 0; padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 22px 28px;
}
.lg-feats li { display: flex; gap: 12px; align-items: flex-start; }
.lg-feats__ico {
  flex-shrink: 0;
  width: 34px; height: 34px;
  display: grid; place-items: center;
  border-radius: 9px;
  background: rgba(20,136,209,.22);
  border: 1px solid rgba(111,192,242,.25);
  color: #8fd0f7;
}
.lg-feats__tx { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.lg-feats__tx b { font-size: 14px; font-weight: 600; }
.lg-feats__tx small { font-size: 12.5px; line-height: 1.4; color: rgba(255,255,255,.62); }

/* Pie: marca a la izquierda, año a la derecha, separado por una línea fina */
.lg-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  font-size: 12.5px;
  letter-spacing: .1px;
}
.lg-foot__brand b { font-weight: 700; letter-spacing: .3px; margin-right: 2px; }
.lg-foot__brand a { color: inherit; text-decoration: none; border-bottom: 1px solid currentColor; padding-bottom: 1px; transition: color .15s; }
.lg-foot--dark .lg-foot__brand a:hover { color: #fff; }
.lg-foot--light .lg-foot__brand a:hover { color: var(--cel); }
.lg-foot__copy { font-variant-numeric: tabular-nums; }
.lg-foot--dark { border-top: 1px solid rgba(255,255,255,.12); color: rgba(255,255,255,.55); }
.lg-foot--dark b { color: #fff; }
.lg-foot--light { border-top: 1px solid var(--line); color: #8a93a5; }
.lg-foot--light b { color: var(--tx); }

/* ══ FORMULARIO ══ */
.lg-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px 24px;
}
.lg-form-wrap {
  width: 100%;
  max-width: 380px;
  margin: auto 0;
  animation: lgIn .45s cubic-bezier(.4,0,.2,1);
}
@keyframes lgIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: none; }
}
.lg-logo {
  display: block;
  width: 132px; height: 132px;
  object-fit: contain;
  margin: 0 0 18px -6px;
}
.lg-h {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -.5px;
  margin: 0 0 4px;
  color: var(--tx);
}
.lg-sub { font-size: 14px; color: var(--tx2); margin: 0 0 26px; }

.lg-form { display: flex; flex-direction: column; }
.lg-lbl {
  font-size: 13px;
  font-weight: 600;
  color: var(--tx);
  margin: 0 0 6px;
}
.lg-input { margin-bottom: 16px; }
.lg-input :deep(.v-field) { border-radius: 10px; background: #f7f9fc; }
.lg-input :deep(.v-field--focused) {
  background: #fff;
  box-shadow: 0 0 0 3px rgba(20,136,209,.16);
}
.lg-input :deep(.v-field--focused .v-field__outline__start),
.lg-input :deep(.v-field--focused .v-field__outline__end),
.lg-input :deep(.v-field--focused .v-field__outline__notch::before),
.lg-input :deep(.v-field--focused .v-field__outline__notch::after) {
  border-color: var(--cel) !important;
}
.lg-input :deep(input::placeholder) { color: #9aa3b2; opacity: 1; }

.lg-check { margin: -4px 0 8px -8px; }
.lg-check :deep(.v-label) { font-size: 13.5px; color: var(--tx2); opacity: 1; }

.lg-cta {
  margin-top: 10px;
  height: 50px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  letter-spacing: .2px;
  text-transform: none;
  background: var(--cel) !important;
  color: #fff !important;
  transition: box-shadow .15s, background .15s;
}
.lg-cta:hover:not(.v-btn--disabled):not(.v-btn--loading) {
  background: #0f78ba !important;
  box-shadow: 0 8px 22px rgba(20,136,209,.32);
}
/* Deshabilitado: gris neutro y legible, no un celeste lavado */
.lg-cta.v-btn--disabled {
  background: #e9edf3 !important;
  color: #8a93a5 !important;
  opacity: 1;
}
.lg-cta.v-btn--disabled :deep(.v-btn__overlay) { opacity: 0; }

.lg-alert :deep(.v-alert__content) { font-size: 13px; }

.lg-help {
  margin: 28px 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 13px;
  color: var(--tx2);
}
.lg-help a { color: var(--cel); font-weight: 600; text-decoration: none; }
.lg-help a:hover { text-decoration: underline; }

.lg-main__foot { display: none; width: 100%; max-width: 380px; margin-top: 28px; }

/* ══ RESPONSIVE ══ */
@media (max-width: 1100px) {
  .lg-side { padding: 40px; }
  .lg-feats { grid-template-columns: 1fr; gap: 16px; }
}
@media (max-width: 860px) {
  .lg { grid-template-columns: 1fr; }
  .lg-side { display: none; }
  .lg-main { padding: calc(32px + env(safe-area-inset-top, 0px)) 22px 20px; }
  .lg-main__foot { display: flex; }
  .lg-logo { width: 108px; height: 108px; }
}
</style>
