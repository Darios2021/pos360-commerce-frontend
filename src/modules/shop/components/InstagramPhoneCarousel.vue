<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramPhoneCarousel.vue -->
<template>
  <v-card class="igs-card" variant="outlined" rounded="xl">
    <!-- HEADER (sutil) -->
    <div class="igs-head">
      <div class="igs-left">
        <div class="igs-ico">
          <v-icon size="18">mdi-instagram</v-icon>
        </div>

        <div class="igs-txt">
          <div class="igs-title">{{ title }}</div>
          <div class="igs-sub" v-if="subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <div class="igs-right">
        <v-btn
          class="igs-pill"
          size="small"
          variant="tonal"
          prepend-icon="mdi-instagram"
          :href="profileUrl || social.instagram || 'https://www.instagram.com/'"
          target="_blank"
          rel="noopener"
        >
          Instagram
        </v-btn>

        <v-btn
          v-if="social.facebook"
          class="igs-icon"
          size="small"
          variant="tonal"
          icon="mdi-facebook"
          :href="social.facebook"
          target="_blank"
          rel="noopener"
        />
        <v-btn
          v-if="social.tiktok"
          class="igs-icon"
          size="small"
          variant="tonal"
          icon="mdi-music-note"
          :href="social.tiktok"
          target="_blank"
          rel="noopener"
        />
        <v-btn
          v-if="social.youtube"
          class="igs-icon"
          size="small"
          variant="tonal"
          icon="mdi-youtube"
          :href="social.youtube"
          target="_blank"
          rel="noopener"
        />
        <v-btn
          v-if="social.whatsapp"
          class="igs-icon"
          size="small"
          variant="tonal"
          icon="mdi-whatsapp"
          :href="social.whatsapp"
          target="_blank"
          rel="noopener"
        />
      </div>
    </div>

    <!-- BODY -->
    <div class="igs-body">
      <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
        {{ error }}
      </v-alert>

      <v-alert v-if="hardBlocked" type="warning" variant="tonal" density="comfortable" class="mb-3">
        Instagram bloqueó el embed en este navegador. Tocá “Instagram” o “Abrir”.
      </v-alert>

      <div v-if="loading" class="py-6 d-flex align-center justify-center ga-3">
        <v-progress-circular indeterminate />
        <div class="text-caption" style="opacity: 0.75">Cargando publicaciones…</div>
      </div>

      <div v-else-if="normalized.length === 0" class="py-6 text-center text-caption" style="opacity: 0.75">
        No hay publicaciones configuradas todavía.
      </div>

      <!-- ✅ Carousel real (NO se mueve el carrusel interno del post) -->
      <div v-else class="igs-wrap">
        <!-- Flechas -->
        <v-btn
          class="igs-nav igs-nav-left"
          icon="mdi-chevron-left"
          variant="elevated"
          size="small"
          :disabled="normalized.length <= 1"
          @click="scrollPrev"
        />
        <v-btn
          class="igs-nav igs-nav-right"
          icon="mdi-chevron-right"
          variant="elevated"
          size="small"
          :disabled="normalized.length <= 1"
          @click="scrollNext"
        />

        <!-- Strip -->
        <div
          ref="stripEl"
          class="igs-strip"
          role="region"
          aria-label="Publicaciones de redes"
          @scroll.passive="onStripScroll"
        >
          <div v-for="(u, i) in normalized" :key="u.key" class="igs-item">
            <v-card class="igs-postCard" variant="outlined" rounded="xl">
              <div class="igs-postFrame">
                <!-- loader por item -->
                <div class="igs-loader" v-if="!loaded[i]">
                  <v-progress-circular indeterminate size="24" />
                  <div class="igs-loaderText">Cargando…</div>
                </div>

                <!-- ✅ IMPORTANTE:
                     - iframe en tamaño "post" (base 320x560)
                     - se escala para que entren varios en desktop y no se rompa en mobile
                     - pointer-events desactivado para que no haga swipe interno (se te “corre” la publicación)
                     - para interactuar -> botón Abrir
                -->
                <div class="igs-embed" :style="{ '--igs-scale': String(scale) }">
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
                </div>
              </div>

              <div class="igs-postActions">
                <v-btn
                  class="igs-open"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-open-in-new"
                  :href="u.originalUrl"
                  target="_blank"
                  rel="noopener"
                >
                  Abrir
                </v-btn>

                <div class="igs-count">{{ i + 1 }} / {{ normalized.length }}</div>
              </div>
            </v-card>
          </div>
        </div>

        <div class="igs-hint">Deslizá horizontal o usá las flechas.</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { publicListLinks } from "@/app/services/public.links.api.js";

const props = defineProps({
  kind: { type: String, default: "INSTAGRAM_POST" }, // shop_links.kind
  title: { type: String, default: "Seguime en redes sociales" },
  subtitle: { type: String, default: "Novedades, promos y sorteos." },
  profileUrl: { type: String, default: "" },
  limit: { type: Number, default: 20 },
  social: {
    type: Object,
    default: () => ({
      instagram: "https://www.instagram.com/",
      facebook: "",
      tiktok: "",
      youtube: "",
      whatsapp: "",
    }),
  },
});

const loading = ref(false);
const error = ref("");
const loaded = ref({});
const hardBlocked = ref(false);

const fetchedUrls = ref([]);
const stripEl = ref(null);

const scale = ref(0.78); // desktop default (entra + de uno)
let ro = null;

function stripIgParams(u) {
  let s = String(u || "").trim();
  if (!s) return "";
  try {
    const url = new URL(s);
    url.search = "";
    url.hash = "";
    s = url.toString();
  } catch {
    // ok
  }
  return s;
}

function parseInstagramUrl(u) {
  const raw = stripIgParams(u);
  if (!raw) return null;

  const m = raw.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;

  const type = String(m[1] || "").toLowerCase();
  const code = String(m[2] || "");

  const embedUrl =
    type === "reel"
      ? `https://www.instagram.com/reel/${code}/embed/captioned/`
      : `https://www.instagram.com/p/${code}/embed/captioned/`;

  const originalUrl =
    type === "reel" ? `https://www.instagram.com/reel/${code}/` : `https://www.instagram.com/p/${code}/`;

  return { key: `${type}_${code}`, type, code, embedUrl, originalUrl };
}

const normalized = computed(() => {
  const arr = Array.isArray(fetchedUrls.value) ? fetchedUrls.value : [];
  return arr.map(parseInstagramUrl).filter(Boolean);
});

function onLoad(i) {
  loaded.value = { ...loaded.value, [i]: true };
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Queremos “tamaño post” para que entren varios.
 * Ajustamos escala según ancho del contenedor:
 * - desktop: 0.78..0.9 (depende)
 * - mobile: 0.68..0.76
 */
function updateScale() {
  const el = stripEl.value;
  if (!el) return;
  const w = el.clientWidth || 0;

  // si hay mucho ancho, podemos subir un poco la escala
  if (w >= 1100) scale.value = 0.9;
  else if (w >= 900) scale.value = 0.84;
  else if (w >= 700) scale.value = 0.78;
  else scale.value = 0.72;

  // safety
  scale.value = clamp(scale.value, 0.68, 0.92);
}

function getStepPx() {
  // ancho “real” del item aprox: (BASE_W * scale) + paddings/gap
  const BASE_W = 320;
  const gap = 14;
  const cardPad = 18; // aprox bordes
  return Math.round(BASE_W * scale.value + gap + cardPad);
}

function scrollNext() {
  const el = stripEl.value;
  if (!el) return;
  el.scrollBy({ left: getStepPx(), behavior: "smooth" });
}

function scrollPrev() {
  const el = stripEl.value;
  if (!el) return;
  el.scrollBy({ left: -getStepPx(), behavior: "smooth" });
}

function onStripScroll() {
  // no-op: queda por si querés luego sincronizar dots/índice
}

async function fetchFromDb() {
  loading.value = true;
  error.value = "";
  try {
    const r = await publicListLinks({
      kind: props.kind || undefined,
      limit: props.limit || 50,
    });

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
  updateScale();

  ro = new ResizeObserver(() => updateScale());
  if (stripEl.value) ro.observe(stripEl.value);

  setTimeout(() => {
    const anyLoaded = Object.values(loaded.value || {}).some(Boolean);
    if (!anyLoaded && normalized.value.length) hardBlocked.value = true;
  }, 4500);
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
    updateScale();
  }
);
</script>

<style scoped>
.igs-card {
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(250, 250, 250, 1), rgba(248, 248, 248, 1));
}

/* header sutil */
.igs-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.igs-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.igs-ico {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.04);
  flex: 0 0 auto;
}
.igs-txt {
  min-width: 0;
}
.igs-title {
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.2px;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.92;
}
.igs-sub {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.66;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.igs-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.igs-pill {
  border-radius: 999px;
}
.igs-icon {
  border-radius: 12px;
}

.igs-body {
  padding: 12px 12px 14px;
}

.igs-wrap {
  position: relative;
  padding: 2px 0 0;
}

/* strip carousel */
.igs-strip {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 10px 8px 4px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.igs-item {
  flex: 0 0 auto;
  scroll-snap-align: center;
}

/* post card */
.igs-postCard {
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
}

/* frame para embed */
.igs-postFrame {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  /* proporción IG embed */
  aspect-ratio: 9 / 16;
  width: calc(320px * var(--igs-scale, 0.78));
  max-width: 340px;
}

/* loader */
.igs-loader {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.96);
  z-index: 2;
}
.igs-loaderText {
  font-size: 12px;
  opacity: 0.7;
}

/* embed escalado */
.igs-embed {
  --igs-scale: 0.78;
  position: absolute;
  inset: 0;
  transform-origin: top left;
}

/* IMPORTANT: bloquea interacción del iframe para que NO haga swipe interno */
.igs-iframe {
  width: 320px;
  height: 560px;
  border: 0;
  display: block;
  background: #fff;
  transform-origin: top left;
  transform: scale(var(--igs-scale, 0.78));
  pointer-events: none; /* <- clave */
}

/* acciones */
.igs-postActions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
}
.igs-open {
  border-radius: 12px;
}
.igs-count {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
}

.igs-hint {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.7;
  text-align: center;
}

/* flechas */
.igs-nav {
  position: absolute;
  top: 45%;
  transform: translateY(-50%);
  z-index: 5;
  border-radius: 999px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
}
.igs-nav-left {
  left: 6px;
}
.igs-nav-right {
  right: 6px;
}

/* mobile */
@media (max-width: 600px) {
  .igs-head {
    padding: 12px 12px 10px;
    flex-direction: column;
    align-items: flex-start;
  }
  .igs-right {
    width: 100%;
    justify-content: flex-start;
  }

  /* en mobile oculto flechas (gesto horizontal + snap) */
  .igs-nav {
    display: none;
  }

  .igs-strip {
    padding: 10px 4px 4px;
  }
}
</style>
