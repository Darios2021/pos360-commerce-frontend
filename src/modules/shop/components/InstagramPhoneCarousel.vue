<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramPhoneCarousel.vue -->
<template>
  <v-card class="igs-card" variant="flat" rounded="xl">
    <!-- Header bonito -->
    <div class="igs-head">
      <div class="igs-head-text">
        <div class="igs-head-title">Seguinos en nuestras redes sociales</div>
        <div class="igs-head-sub">Participá en nuestros sorteos y ganá premios</div>
      </div>
    </div>

    <!-- Body -->
    <div class="igs-body">
      <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
        {{ error }}
      </v-alert>

      <!-- ✅ SOLO DEV/TEST (no producción) -->
      <v-alert
        v-if="SHOW_DEBUG && hardBlocked"
        type="warning"
        variant="tonal"
        density="comfortable"
        class="mb-3"
      >
        Instagram bloqueó el embed en este navegador (debug).
      </v-alert>

      <div v-if="loading" class="py-6 d-flex align-center justify-center ga-3">
        <v-progress-circular indeterminate />
        <div class="text-caption" style="opacity: 0.75">Cargando publicaciones…</div>
      </div>

      <div v-else-if="normalized.length === 0" class="py-6 text-center text-caption" style="opacity: 0.75">
        No hay publicaciones configuradas todavía.
      </div>

      <div v-else class="igs-wrap">
        <!-- Flechas externas -->
        <v-btn
          class="igs-nav igs-nav-left"
          icon="mdi-chevron-left"
          variant="elevated"
          size="small"
          :disabled="normalized.length <= 1"
          @click="goPrev"
        />
        <v-btn
          class="igs-nav igs-nav-right"
          icon="mdi-chevron-right"
          variant="elevated"
          size="small"
          :disabled="normalized.length <= 1"
          @click="goNext"
        />

        <!-- Strip -->
        <div ref="stripEl" class="igs-strip" role="region" aria-label="Publicaciones de Instagram">
          <div v-for="(u, i) in normalized" :key="u.key" class="igs-item">
            <div
              class="igs-frame"
              :style="{
                '--igs-cardw': cardW + 'px',
                '--igs-scale': String(scale),
              }"
            >
              <div class="igs-loader" v-if="!loaded[i]">
                <v-progress-circular indeterminate size="24" />
                <div class="igs-loaderText">Cargando…</div>
              </div>

              <div class="igs-fit">
                <iframe
                  class="igs-iframe"
                  :src="u.embedUrl"
                  loading="lazy"
                  frameborder="0"
                  scrolling="no"
                  allowtransparency="true"
                  allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                  @load="onLoad(i)"
                ></iframe>

                <!-- ✅ SHIELD TOP: captura tap en header "Ver perfil" (SIN romper carrusel) -->
                <button
                  class="igs-shield igs-shield-top"
                  type="button"
                  @click.stop.prevent="askOpen(profileUrl)"
                  aria-label="Ver perfil (confirmación)"
                />

                <!-- ✅ SHIELD BOTTOM: captura tap en "Ver más en Instagram" (SIN romper carrusel) -->
                <button
                  class="igs-shield igs-shield-bottom"
                  type="button"
                  @click.stop.prevent="askOpen(u.externalUrl)"
                  aria-label="Ver en Instagram (confirmación)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="igs-hint">Usá las flechas para cambiar de publicación.</div>
      </div>
    </div>

    <!-- ✅ Modal confirmación simple (sutil, mobile OK) -->
    <v-dialog v-model="confirmDlg" max-width="420" width="92vw">
      <v-card class="igs-confirm" rounded="xl">
        <div class="igs-confirm-body">
          <v-icon size="28" class="mb-2">mdi-open-in-new</v-icon>

          <!-- ✅ Texto pedido -->
          <div class="igs-confirm-title">Vas a salir de San Juan Tecnología</div>
          <div class="igs-confirm-text">Se abrirá Instagram en una nueva pestaña.</div>
        </div>

        <v-divider />

        <div class="igs-confirm-actions">
          <v-btn variant="text" @click="confirmDlg = false">Cancelar</v-btn>
          <v-spacer />

          <!-- ✅ Botón pedido -->
          <v-btn color="primary" variant="flat" @click="confirmOpen">
            Salís de San Juan Tecnología
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { publicListLinks } from "@/app/services/public.links.api.js";

/** ✅ debug solo testing */
const SHOW_DEBUG = Boolean(import.meta.env.DEV) || String(import.meta.env.VITE_IG_DEBUG || "").trim() === "1";

const props = defineProps({
  kind: { type: String, default: "INSTAGRAM_POST" },
  limit: { type: Number, default: 20 },
  profileUsername: { type: String, default: "sanjuan.tecnologia" },
});

const loading = ref(false);
const error = ref("");
const loaded = ref({});
const hardBlocked = ref(false);

const fetchedUrls = ref([]);
const stripEl = ref(null);

const IFRAME_W = 320;
const IFRAME_H = 780;

const cardW = ref(300);
const scale = ref(0.8);

let ro = null;

/* ===== confirm modal ===== */
const confirmDlg = ref(false);
const pendingUrl = ref("");

const profileUrl = computed(() => `https://www.instagram.com/${String(props.profileUsername || "").trim()}/`);

function askOpen(url) {
  pendingUrl.value = String(url || "");
  confirmDlg.value = true;
}

function confirmOpen() {
  // ✅ SIEMPRE nueva pestaña (no te saca del sitio)
  if (pendingUrl.value) window.open(pendingUrl.value, "_blank", "noopener,noreferrer");
  confirmDlg.value = false;
}

/* ===== helpers ===== */
function stripIgParams(u) {
  let s = String(u || "").trim();
  try {
    const url = new URL(s);
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return s;
  }
}

function parseInstagramUrl(u) {
  const raw = stripIgParams(u);
  const m = raw.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;

  const type = m[1].toLowerCase();
  const code = m[2];

  return {
    key: `${type}_${code}`,
    embedUrl: type === "reel" ? `https://www.instagram.com/reel/${code}/embed/` : `https://www.instagram.com/p/${code}/embed/`,
    externalUrl: type === "reel" ? `https://www.instagram.com/reel/${code}/` : `https://www.instagram.com/p/${code}/`,
  };
}

const normalized = computed(() => fetchedUrls.value.map(parseInstagramUrl).filter(Boolean));

function onLoad(i) {
  loaded.value = { ...loaded.value, [i]: true };
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function updateSizing() {
  const w = stripEl.value?.clientWidth || 0;

  if (w >= 1200) cardW.value = 310;
  else if (w >= 900) cardW.value = 300;
  else if (w >= 700) cardW.value = 280;
  else cardW.value = Math.max(260, w - 28);

  scale.value = clamp((cardW.value / IFRAME_W) * 0.995, 0.6, 1);
}

function stepPx() {
  return cardW.value + 12;
}

function currentIndex() {
  return Math.round((stripEl.value?.scrollLeft || 0) / stepPx());
}

function goNext() {
  stripEl.value?.scrollTo({
    left: (currentIndex() + 1) * stepPx(),
    behavior: "smooth",
  });
}

function goPrev() {
  stripEl.value?.scrollTo({
    left: (currentIndex() - 1) * stepPx(),
    behavior: "smooth",
  });
}

async function fetchFromDb() {
  loading.value = true;
  error.value = "";
  try {
    const r = await publicListLinks({ kind: props.kind, limit: props.limit });
    const items = Array.isArray(r?.items) ? r.items : Array.isArray(r?.data) ? r.data : [];
    fetchedUrls.value = items.map((x) => x?.url).filter(Boolean);
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar las publicaciones";
    fetchedUrls.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchFromDb();
  await nextTick();
  updateSizing();

  ro = new ResizeObserver(updateSizing);
  if (stripEl.value) ro.observe(stripEl.value);

  if (SHOW_DEBUG) {
    setTimeout(() => {
      if (!Object.values(loaded.value).some(Boolean) && normalized.value.length) {
        hardBlocked.value = true;
      }
    }, 4500);
  }
});

onBeforeUnmount(() => {
  try {
    if (ro && stripEl.value) ro.unobserve(stripEl.value);
  } catch {}
  ro = null;
});

watch(
  () => [props.kind, props.limit],
  async () => {
    loaded.value = {};
    hardBlocked.value = false;
    await fetchFromDb();
    await nextTick();
    updateSizing();
  }
);
</script>

<style scoped>
/* ===============================
   Instagram Carousel – FINAL
   =============================== */

.igs-card {
  border-radius: 18px;
  background: #fbfbfb;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: visible;
}

/* ---------- Header bonito ---------- */
.igs-head {
  padding: 14px 14px 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(250, 250, 250, 0.9));
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.igs-head-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.igs-head-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
  color: rgba(0, 0, 0, 0.88);
}

.igs-head-sub {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
}

/* ---------- Body ---------- */
.igs-body {
  padding: 8px 10px 10px;
}

.igs-wrap {
  position: relative;
  overflow: visible;
}

/* ---------- Strip ---------- */
.igs-strip {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 10px 48px 4px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.igs-strip::-webkit-scrollbar {
  display: none;
}

.igs-item {
  flex: 0 0 auto;
  scroll-snap-align: center;
}

/* ---------- Frame del post ---------- */
.igs-frame {
  position: relative;
  width: var(--igs-cardw, 300px);
  height: 520px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* ---------- Loader ---------- */
.igs-loader {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.94);
  z-index: 3;
}

.igs-loaderText {
  font-size: 12px;
  opacity: 0.7;
}

/* ---------- Fit ---------- */
.igs-fit {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
}

/* ---------- Iframe ---------- */
.igs-iframe {
  width: 320px;
  height: 780px;
  transform-origin: top center;
  transform: scale(var(--igs-scale, 0.8));
  border: 0;
  display: block;
  background: #fff;
}

/* ✅ Shields invisibles (no se ven, no rompen diseño) */
.igs-shield {
  position: absolute;
  left: 0;
  width: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;
  z-index: 2;
}

/* Header “Ver perfil” (zona superior) */
.igs-shield-top {
  top: 0;
  height: 72px;
}

/* Link “Ver más en Instagram” (zona inferior del embed) */
.igs-shield-bottom {
  bottom: 120px; /* ajusta para caer arriba del área “comentario” */
  height: 70px;
}

/* ---------- Flechas ---------- */
.igs-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 999px;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
  z-index: 10;
  opacity: 0.9;
}

.igs-nav-left {
  left: -6px;
}

.igs-nav-right {
  right: -6px;
}

/* ---------- Hint ---------- */
.igs-hint {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.6;
  text-align: center;
}

/* =========================
   Confirm modal minimal
   ========================= */
.igs-confirm {
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.igs-confirm-body {
  padding: 22px 18px;
  text-align: center;
}
.igs-confirm-title {
  font-weight: 800;
  font-size: 15px;
  margin-bottom: 6px;
}
.igs-confirm-text {
  font-size: 13px;
  opacity: 0.65;
}
.igs-confirm-actions {
  padding: 10px 14px;
  display: flex;
  align-items: center;
}

/* ---------- Mobile ---------- */
@media (max-width: 600px) {
  .igs-head {
    padding: 12px 12px 10px;
  }

  .igs-head-title {
    font-size: 14px;
  }

  .igs-head-sub {
    font-size: 12px;
  }

  .igs-strip {
    padding: 10px 44px 4px;
    gap: 10px;
  }

  .igs-frame {
    height: 460px;
  }

  .igs-nav {
    top: 60%;
    opacity: 0.85;
  }

  .igs-nav-left {
    left: -18px;
  }

  .igs-nav-right {
    right: -18px;
  }

  /* En mobile el embed cambia un toque el layout: ajustamos shields */
  .igs-shield-top {
    height: 64px;
  }
  .igs-shield-bottom {
    bottom: 108px;
    height: 64px;
  }
}
</style>
