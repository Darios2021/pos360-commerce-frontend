<template>
  <div v-if="show" class="apk-banner" role="region" aria-label="Descargar app Android">
    <div class="apk-banner__inner">
      <v-icon class="apk-banner__icon" size="22">mdi-android</v-icon>
      <div class="apk-banner__text">
        <strong>Descargá la app</strong>
        <span class="apk-banner__sub">Mejor experiencia desde tu Android</span>
      </div>
      <v-btn
        :to="{ name: 'appInstall' }"
        color="primary"
        variant="flat"
        size="small"
        class="apk-banner__cta"
        @click="onInstall"
      >
        Instalar
      </v-btn>
      <v-btn
        icon
        variant="text"
        size="small"
        density="comfortable"
        class="apk-banner__close"
        :title="'Ocultar'"
        aria-label="Ocultar banner"
        @click="onDismiss"
      >
        <v-icon size="18">mdi-close</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { isMobileBrowser } from "@/app/utils/runtime";

const STORAGE_KEY = "pos.apkBanner.dismissedAt";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

const route = useRoute();
const visible = ref(false);

function isDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch (_) {
    return false;
  }
}

function onDismiss() {
  visible.value = false;
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch (_) {}
}

function onInstall() {
  // Si el usuario inicia la descarga, también ocultamos el banner para no
  // ser repetitivos. Si no se instala, vuelve a aparecer en la próxima sesión
  // (no aplicamos TTL acá — solo en dismiss explícito).
  visible.value = false;
}

// No mostrar el banner en la propia página de instalación.
const show = computed(() => visible.value && route.name !== "appInstall");

onMounted(() => {
  if (!isMobileBrowser()) return;
  if (isDismissed()) return;
  visible.value = true;
});
</script>

<style scoped>
.apk-banner {
  position: fixed;
  left: 8px;
  right: 8px;
  bottom: calc(8px + env(safe-area-inset-bottom, 0px));
  z-index: 1500;
  pointer-events: none;
}

/* En desktop nunca se muestra (extra-safety por si alguien cambia el guard JS) */
@media (min-width: 601px) {
  .apk-banner { display: none; }
}

.apk-banner__inner {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px 10px 14px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  color: rgb(var(--v-theme-on-surface));
}

.apk-banner__icon {
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.apk-banner__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.2;
}
.apk-banner__text strong {
  font-size: 13.5px;
  font-weight: 540;
}
.apk-banner__sub {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.apk-banner__cta {
  border-radius: 999px !important;
  font-weight: 500 !important;
  text-transform: none;
  letter-spacing: 0.01em;
  padding-inline: 14px !important;
}

.apk-banner__close {
  color: rgba(var(--v-theme-on-surface), 0.6);
}
</style>
