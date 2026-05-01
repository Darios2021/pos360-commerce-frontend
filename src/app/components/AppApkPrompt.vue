<template>
  <Teleport v-if="show" to="body">
    <div class="apk-prompt" role="dialog" aria-modal="true" aria-labelledby="apk-prompt-title">
      <div class="apk-prompt__backdrop" />

      <div class="apk-prompt__panel">
        <div class="apk-prompt__hero">
          <img :src="LOGO" alt="" class="apk-prompt__logo" />
        </div>

        <div class="apk-prompt__body">
          <h2 id="apk-prompt-title" class="apk-prompt__title">
            Mejor experiencia con la app
          </h2>
          <p class="apk-prompt__sub">
            Estás usando la versión web. Instalá la app para Android y obtené:
          </p>

          <ul class="apk-prompt__perks">
            <li>
              <v-icon size="18" color="primary">mdi-flash-outline</v-icon>
              Carga más rápida
            </li>
            <li>
              <v-icon size="18" color="primary">mdi-cellphone-link</v-icon>
              Acceso directo desde el cel
            </li>
            <li>
              <v-icon size="18" color="primary">mdi-barcode-scan</v-icon>
              Lector de barras nativo
            </li>
            <li>
              <v-icon size="18" color="primary">mdi-fullscreen</v-icon>
              Pantalla completa, sin barra del navegador
            </li>
          </ul>
        </div>

        <div class="apk-prompt__actions">
          <v-btn
            block
            color="primary"
            variant="flat"
            size="large"
            class="apk-prompt__cta-primary"
            prepend-icon="mdi-download"
            @click="goInstall"
          >
            Instalar app
          </v-btn>

          <button class="apk-prompt__cta-skip" @click="onSkip">
            Seguir en el navegador por ahora
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { isMobileBrowser } from "@/app/utils/runtime";

const STORAGE_KEY = "pos.apkPrompt.skippedAt";
// 24h: el "saltear" no es para siempre. Si el usuario lo posterga, le
// volvemos a mostrar al día siguiente para insistir.
const SKIP_TTL_MS = 24 * 60 * 60 * 1000;

const LOGO =
  "https://storage-files.cingulado.org/pos360/products/224/1768522749202-af8d19f07dd9.webp";

const route = useRoute();
const router = useRouter();
const visible = ref(false);

function isSkipped() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < SKIP_TTL_MS;
  } catch (_) {
    return false;
  }
}

function shouldShow() {
  if (!isMobileBrowser()) return false;
  if (route.name === "appInstall") return false;
  if (route.meta?.public) return false;
  if (isSkipped()) return false;
  return true;
}

function onSkip() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch (_) {}
  visible.value = false;
}

function goInstall() {
  visible.value = false;
  router.push({ name: "appInstall" });
}

const show = computed(() => visible.value);

onMounted(() => {
  if (shouldShow()) visible.value = true;
});

// Si el usuario navega entre rutas del backoffice y reaparece la condición
// (ej: refresh del SPA), volver a evaluar. No re-aparece si ya está skipped.
watch(
  () => route.fullPath,
  () => {
    if (visible.value) return;
    if (shouldShow()) visible.value = true;
  }
);
</script>

<style scoped>
.apk-prompt {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: center;
}

/* En desktop nunca se muestra */
@media (min-width: 601px) {
  .apk-prompt { display: none; }
}

.apk-prompt__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
}

.apk-prompt__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 480px;
  margin: auto;
  display: flex;
  flex-direction: column;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 22px 22px 0 0;
  align-self: flex-end;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.35);
}

/* Hero con fondo celeste y logo grande */
.apk-prompt__hero {
  background: linear-gradient(135deg, #1488d1 0%, #2bb0f3 100%);
  padding: 28px 16px 22px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.apk-prompt__logo {
  width: 100px;
  height: 100px;
  border-radius: 22px;
  background: #fff;
  padding: 8px;
  object-fit: contain;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
}

/* Body */
.apk-prompt__body {
  padding: 22px 22px 8px;
}
.apk-prompt__title {
  font-size: 22px;
  font-weight: 540;
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0 0 8px;
  text-align: center;
}
.apk-prompt__sub {
  font-size: 14px;
  line-height: 1.45;
  margin: 0 0 16px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  text-align: center;
}

.apk-prompt__perks {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.apk-prompt__perks li {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(var(--v-theme-on-surface), 0.92);
  padding: 10px 12px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-radius: 12px;
}

/* Actions */
.apk-prompt__actions {
  padding: 16px 18px calc(20px + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.apk-prompt__cta-primary {
  border-radius: 999px !important;
  height: 50px !important;
  font-weight: 540 !important;
  font-size: 15px;
  text-transform: none;
  letter-spacing: 0.01em;
}
.apk-prompt__cta-skip {
  background: transparent;
  border: 0;
  cursor: pointer;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 10px 12px;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.apk-prompt__cta-skip:hover {
  color: rgba(var(--v-theme-on-surface), 0.85);
}
</style>
