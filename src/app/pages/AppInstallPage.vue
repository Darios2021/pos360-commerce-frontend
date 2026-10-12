<template>
  <div class="install-page">
    <header class="install-page__header">
      <img :src="LOGO" alt="San Juan Tecnología" class="install-page__logo" />
    </header>

    <main class="install-page__main">
      <section class="install-hero">
        <v-icon size="48" color="primary" class="install-hero__icon">mdi-android</v-icon>
        <h1 class="install-hero__title">San Juan Tecnología para Android</h1>
        <p class="install-hero__sub">
          Más rápida, en pantalla completa y con acceso directo.
        </p>

        <v-btn
          :href="apkUrl"
          target="_blank"
          rel="noopener"
          color="primary"
          variant="flat"
          size="large"
          class="install-hero__cta"
          prepend-icon="mdi-download"
        >
          Descargar APK
        </v-btn>

        <!-- Desde la 2.0 la firma es otra: Android no la instala encima de una
             versión anterior y responde "No se instaló la app". -->
        <p class="install-hero__warn">
          <v-icon size="16">mdi-information-outline</v-icon>
          Si hay una versión anterior, desinstalarla primero.
        </p>

        <p v-if="!isAndroid" class="install-hero__warn">
          <v-icon size="16">mdi-information-outline</v-icon>
          Solo para Android.
        </p>
      </section>

      <section class="install-steps">
        <h2 class="install-steps__title">Instalación</h2>

        <ol class="install-steps__list">
          <li class="install-step">
            <div class="install-step__num">1</div>
            <div class="install-step__body">
              <strong>Descargar el APK</strong>
            </div>
          </li>

          <li class="install-step">
            <div class="install-step__num">2</div>
            <div class="install-step__body">
              <strong>Abrir el archivo descargado</strong>
              <span>
                Si Android lo pide: <em>Configuración</em>, <em>Permitir desde esta fuente</em>.
              </span>
            </div>
          </li>

          <li class="install-step">
            <div class="install-step__num">3</div>
            <div class="install-step__body">
              <strong>Instalar</strong>
            </div>
          </li>

          <li class="install-step">
            <div class="install-step__num">4</div>
            <div class="install-step__body">
              <strong>Abrir la app</strong>
              <span>Mismo usuario y contraseña de la web.</span>
            </div>
          </li>
        </ol>
      </section>

      <footer class="install-page__footer">
        <router-link to="/app" class="install-page__back">
          <v-icon size="16">mdi-arrow-left</v-icon>
          Volver al sistema
        </router-link>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useHead } from "@vueuse/head";
import { getApkDownloadUrl, isAndroidUA } from "@/app/utils/runtime";

const LOGO =
  "https://storage-files.cingulado.org/pos360/media/1777345911123-fc15363786567e40.webp";

const apkUrl = computed(() => getApkDownloadUrl());
const isAndroid = ref(true);

onMounted(() => {
  isAndroid.value = isAndroidUA();
});

useHead({
  title: "Instalar app · San Juan Tecnología",
  meta: [
    {
      name: "description",
      content:
        "App Android de San Juan Tecnología.",
    },
    { name: "robots", content: "noindex" },
  ],
});
</script>

<style scoped>
.install-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  display: flex;
  flex-direction: column;
}

.install-page__header {
  display: flex;
  justify-content: center;
  padding: 18px 16px 8px;
  background: #1488d1;
}
.install-page__logo {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.install-page__main {
  flex: 1;
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  padding: 24px 18px 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* Hero */
.install-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
}
.install-hero__icon {
  background: rgba(var(--v-theme-primary), 0.1);
  border-radius: 50%;
  padding: 18px;
  width: 84px !important;
  height: 84px !important;
}
.install-hero__title {
  font-size: 24px;
  font-weight: 540;
  letter-spacing: -0.01em;
  line-height: 1.2;
  margin: 0;
}
.install-hero__sub {
  font-size: 14.5px;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.7);
  margin: 0;
  max-width: 420px;
}
.install-hero__cta {
  margin-top: 8px;
  border-radius: 999px !important;
  font-weight: 540 !important;
  text-transform: none;
  letter-spacing: 0.01em;
  padding-inline: 28px !important;
  height: 48px !important;
}
.install-hero__warn {
  font-size: 12.5px;
  line-height: 1.35;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin: 4px 0 0;
}
.install-hero__warn .v-icon {
  margin-right: 4px;
  vertical-align: -3px;
}

/* Steps */
.install-steps__title {
  font-size: 16px;
  font-weight: 540;
  margin: 0 0 14px;
  color: rgba(var(--v-theme-on-surface), 0.92);
}
.install-steps__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.install-step {
  display: flex;
  gap: 14px;
  padding: 14px 14px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.install-step__num {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 540;
}
.install-step__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13.5px;
  line-height: 1.4;
}
.install-step__body strong {
  font-weight: 540;
  color: rgba(var(--v-theme-on-surface), 0.95);
}
.install-step__body span {
  color: rgba(var(--v-theme-on-surface), 0.65);
}
.install-step__body em {
  font-style: normal;
  font-weight: 540;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

/* Footer */
.install-page__footer {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}
.install-page__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: rgb(var(--v-theme-primary));
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 999px;
}
.install-page__back:hover {
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
