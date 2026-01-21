<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramPhoneCarousel.vue -->
<template>
  <v-card class="igp-card" variant="outlined" rounded="xl">
    <!-- Header -->
    <div class="igp-head">
      <div class="d-flex align-center ga-3 min-w-0">
        <div class="igp-ico">
          <v-icon size="18">mdi-instagram</v-icon>
        </div>

        <div class="min-w-0">
          <div class="igp-title">{{ title }}</div>
          <div class="igp-sub" v-if="subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-btn
          class="igp-btn"
          variant="tonal"
          density="comfortable"
          size="small"
          prepend-icon="mdi-open-in-new"
          :href="profileUrl || 'https://www.instagram.com/'"
          target="_blank"
          rel="noopener"
        >
          Ver perfil
        </v-btn>
      </div>
    </div>

    <!-- Body -->
    <div class="igp-body">
      <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
        {{ error }}
      </v-alert>

      <v-alert v-if="hardBlocked" type="warning" variant="tonal" density="comfortable" class="mb-3">
        Instagram bloqueó el embed en este navegador. Tocá “Ver perfil” para abrirlo directo.
      </v-alert>

      <div v-if="loading" class="py-6 d-flex align-center justify-center ga-3">
        <v-progress-circular indeterminate />
        <div class="text-caption" style="opacity:.75">Cargando publicaciones…</div>
      </div>

      <div v-else-if="normalized.length === 0" class="py-6 text-center text-caption" style="opacity:.75">
        No hay publicaciones configuradas todavía.
      </div>

      <!-- ✅ “Telefonitos” scrolleables -->
      <div v-else class="igp-strip" role="region" aria-label="Instagram publicaciones">
        <div v-for="(u, i) in normalized" :key="u.key" class="igp-item">
          <div class="phone">
            <div class="phone-top"><div class="notch"></div></div>

            <div class="phone-screen">
              <div class="phone-loader" v-if="!loaded[i]">
                <v-progress-circular indeterminate size="26" />
                <div class="phone-loaderText">Cargando…</div>
              </div>

              <div class="iframe-scale">
                <iframe
                  class="ig-iframe"
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

            <div class="phone-bottom"><div class="homebar"></div></div>
          </div>

          <div class="igp-actions">
            <v-btn
              variant="tonal"
              size="small"
              prepend-icon="mdi-open-in-new"
              class="igp-open"
              :href="u.originalUrl"
              target="_blank"
              rel="noopener"
            >
              Abrir
            </v-btn>

            <v-btn variant="text" size="small" class="igp-dotinfo" @click="scrollToIndex(i)">
              {{ i + 1 }} / {{ normalized.length }}
            </v-btn>
          </div>
        </div>
      </div>

      <div v-if="normalized.length" class="igp-hint">Deslizá horizontal para ver más.</div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { publicListLinks } from "@/app/services/public.links.api.js";

const props = defineProps({
  kind: { type: String, default: "INSTAGRAM_POST" }, // shop_links.kind
  title: { type: String, default: "Sorteos en Instagram" },
  subtitle: { type: String, default: "Deslizá para ver publicaciones." },
  profileUrl: { type: String, default: "" },
  limit: { type: Number, default: 20 },
});

const loading = ref(false);
const error = ref("");
const loaded = ref({});
const hardBlocked = ref(false);

const fetchedUrls = ref([]); // urls desde DB

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
    type === "reel"
      ? `https://www.instagram.com/reel/${code}/`
      : `https://www.instagram.com/p/${code}/`;

  return { key: `${type}_${code}`, type, code, embedUrl, originalUrl };
}

const normalized = computed(() => {
  const arr = Array.isArray(fetchedUrls.value) ? fetchedUrls.value : [];
  return arr.map(parseInstagramUrl).filter(Boolean);
});

function onLoad(i) {
  loaded.value = { ...loaded.value, [i]: true };
}

function scrollToIndex(i) {
  const el = document.querySelectorAll(".igp-item")?.[i];
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
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

  setTimeout(() => {
    const anyLoaded = Object.values(loaded.value || {}).some(Boolean);
    if (!anyLoaded && normalized.value.length) hardBlocked.value = true;
  }, 4500);
});

watch(
  () => [props.kind, props.limit],
  async () => {
    loaded.value = {};
    hardBlocked.value = false;
    await fetchFromDb();
  }
);
</script>

<style scoped>
.igp-card {
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(250, 250, 250, 1), rgba(248, 248, 248, 1));
}
.igp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.igp-ico {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.04);
  flex: 0 0 auto;
}
.igp-title {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.igp-sub {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.igp-btn { border-radius: 12px; }
.igp-body { padding: 12px 12px 14px; }

.igp-strip {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding: 8px 4px 2px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.igp-item { flex: 0 0 auto; scroll-snap-align: center; }

.phone {
  width: 270px;
  border-radius: 26px;
  background: #0f1115;
  padding: 10px;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.phone-top {
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.notch {
  width: 92px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
}
.phone-screen {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  aspect-ratio: 9 / 16;
}
.phone-loader {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.96);
  z-index: 2;
}
.phone-loaderText {
  font-size: 12px;
  opacity: 0.7;
}
.iframe-scale {
  transform-origin: top left;
  transform: scale(0.78);
  width: 128%;
  height: 128%;
}
.ig-iframe {
  width: 320px;
  height: 560px;
  border: 0;
  display: block;
  background: #fff;
}
.phone-bottom {
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.homebar {
  width: 110px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}
.igp-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 8px;
}
.igp-open { border-radius: 12px; }
.igp-dotinfo { opacity: 0.75; text-transform: none; }
.igp-hint {
  margin-top: 10px;
  font-size: 12px;
  opacity: 0.7;
  text-align: center;
}

@media (max-width: 600px) {
  .igp-head {
    padding: 12px 12px 10px;
    flex-direction: column;
    align-items: flex-start;
  }
  .igp-head > div:last-child {
    width: 100%;
    justify-content: flex-end;
  }
  .phone { width: 240px; }
  .iframe-scale {
    transform: scale(0.72);
    width: 138%;
    height: 138%;
  }
}
</style>
