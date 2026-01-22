<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramPhoneCarousel.vue -->
<template>
  <v-card class="igs-card" variant="flat" rounded="xl">
    <!-- ✅ UNICO HEADER (sin “Sorteos…”, sin subtítulo, sin chips) -->
    <div class="igs-head">
      <div class="igs-title-only">Seguinos en redes sociales</div>
    </div>

    <!-- Body -->
    <div class="igs-body">
      <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
        {{ error }}
      </v-alert>

      <v-alert v-if="hardBlocked" type="warning" variant="tonal" density="comfortable" class="mb-3">
        Instagram bloqueó el embed en este navegador.
      </v-alert>

      <div v-if="loading" class="py-6 d-flex align-center justify-center ga-3">
        <v-progress-circular indeterminate />
        <div class="text-caption" style="opacity:0.75">Cargando publicaciones…</div>
      </div>

      <div v-else-if="normalized.length === 0" class="py-6 text-center text-caption" style="opacity:0.75">
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
              </div>
            </div>
          </div>
        </div>

        <div class="igs-hint">Usá las flechas para cambiar de publicación.</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { publicListLinks } from "@/app/services/public.links.api.js";

const props = defineProps({
  kind: { type: String, default: "INSTAGRAM_POST" },
  limit: { type: Number, default: 20 },
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
    embedUrl:
      type === "reel"
        ? `https://www.instagram.com/reel/${code}/embed/`
        : `https://www.instagram.com/p/${code}/embed/`,
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
  stripEl.value?.scrollTo({ left: (currentIndex() + 1) * stepPx(), behavior: "smooth" });
}

function goPrev() {
  stripEl.value?.scrollTo({ left: (currentIndex() - 1) * stepPx(), behavior: "smooth" });
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

  setTimeout(() => {
    if (!Object.values(loaded.value).some(Boolean) && normalized.value.length) {
      hardBlocked.value = true;
    }
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
  overflow: visible; /* ✅ NO recorta flechas externas */
}

/* ---------- Header ---------- */
.igs-head {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.7);
  border-top-left-radius: 18px;
  border-top-right-radius: 18px;
}

.igs-title-only {
  font-weight: 800;
  font-size: 14px;
  line-height: 1.2;
  opacity: 0.9;
}

/* ---------- Body ---------- */
.igs-body {
  padding: 8px 10px 10px;
}

.igs-wrap {
  position: relative;
  overflow: visible; /* ✅ NO recorta flechas */
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
  height: 520px; /* altura fija tipo feed IG */
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden; /* ✅ recorta comentarios (SOLO acá) */
}

/* ---------- Loader ---------- */
.igs-loader {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.94);
  z-index: 2;
}

.igs-loaderText {
  font-size: 12px;
  opacity: 0.7;
}

/* ---------- Fit ---------- */
.igs-fit {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
}

/* ---------- Iframe Instagram ---------- */
.igs-iframe {
  width: 320px;
  height: 780px; /* alto para reels */
  transform-origin: top center;
  transform: scale(var(--igs-scale, 0.8));
  border: 0;
  display: block;
  background: #fff;
  pointer-events: auto;
}

/* ---------- Flechas del carrusel ---------- */
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
  left: -6px; /* afuera */
}

.igs-nav-right {
  right: -6px; /* afuera */
}

/* ---------- Hint ---------- */
.igs-hint {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.6;
  text-align: center;
}

/* ===============================
   MOBILE – ajuste fino FINAL
   =============================== */
@media (max-width: 600px) {
  .igs-head {
    padding: 8px 10px;
  }

  .igs-title-only {
    font-size: 13px;
  }

  .igs-body {
    padding: 8px;
  }

  .igs-strip {
    padding: 10px 44px 4px; /* un toque menos */
    gap: 10px;
  }

  .igs-frame {
    height: 460px;
  }

  /* Flechas: externas, visibles y sin superposición */
  .igs-nav {
    top: 60%;
    opacity: 0.85;
  }

  .igs-nav-left {
    left: -18px; /* afuera pero visible */
  }

  .igs-nav-right {
    right: -18px;
  }
}


</style>
