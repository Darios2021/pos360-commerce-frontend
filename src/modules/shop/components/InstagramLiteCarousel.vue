<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramLiteCarousel.vue -->
<template>
  <v-card class="igx-card" variant="outlined" rounded="xl">
    <!-- Header -->
    <div class="igx-head">
      <div class="d-flex align-center ga-3">
        <div class="igx-ico">
          <v-icon size="18">mdi-instagram</v-icon>
        </div>

        <div class="min-w-0">
          <div class="igx-title">{{ title }}</div>
          <div class="igx-sub" v-if="subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <div class="d-flex align-center ga-2">
        <v-btn
          class="igx-btn"
          variant="tonal"
          density="comfortable"
          size="small"
          prepend-icon="mdi-open-in-new"
          :href="profileUrl || defaultProfileUrl"
          target="_blank"
          rel="noopener"
        >
          Ver perfil
        </v-btn>

        <v-btn
          class="igx-btn"
          variant="tonal"
          density="comfortable"
          size="small"
          prepend-icon="mdi-refresh"
          @click="refresh"
        >
          Actualizar
        </v-btn>
      </div>
    </div>

    <!-- Body -->
    <div class="igx-body">
      <v-alert
        v-if="hardBlocked"
        type="warning"
        variant="tonal"
        density="comfortable"
        class="mb-3"
      >
        Instagram bloqueó el embed en este navegador. Tocá “Ver perfil” para abrirlo directo.
      </v-alert>

      <!-- Window -->
      <div class="igx-window">
        <v-window v-model="index" class="igx-win">
          <v-window-item
            v-for="(u, i) in normalized"
            :key="u.key"
            :value="i"
          >
            <div class="igx-frameWrap">
              <!-- loader -->
              <div class="igx-loader" v-if="!loaded[i]">
                <v-progress-circular indeterminate size="28" />
                <div class="igx-loaderText">Cargando publicación…</div>
              </div>

              <!-- iframe -->
              <iframe
                class="igx-frame"
                :style="{ height: computedHeight + 'px' }"
                :src="u.embedUrl"
                loading="lazy"
                frameborder="0"
                scrolling="no"
                allowtransparency="true"
                allow="encrypted-media; clipboard-write; fullscreen; picture-in-picture"
                sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
                @load="onLoad(i)"
              ></iframe>

              <!-- Footer actions -->
              <div class="igx-foot">
                <div class="igx-footLeft">
                  <v-chip size="x-small" variant="tonal">
                    {{ i + 1 }} / {{ normalized.length }}
                  </v-chip>

                  <span class="igx-hint">
                    Deslizá o usá las flechas.
                  </span>
                </div>

                <v-btn
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-open-in-new"
                  :href="u.originalUrl"
                  target="_blank"
                  rel="noopener"
                >
                  Abrir publicación
                </v-btn>
              </div>
            </div>
          </v-window-item>
        </v-window>

        <!-- Arrows -->
        <div class="igx-arrows" v-if="showArrows && normalized.length > 1">
          <v-btn
            class="igx-arrow"
            variant="elevated"
            size="small"
            icon="mdi-chevron-left"
            @click="prev"
          />
          <v-btn
            class="igx-arrow"
            variant="elevated"
            size="small"
            icon="mdi-chevron-right"
            @click="next"
          />
        </div>
      </div>

      <!-- Dots -->
      <div class="igx-dots" v-if="normalized.length > 1">
        <button
          v-for="(u, i) in normalized"
          :key="u.key + '_dot'"
          class="igx-dot"
          :class="{ 'is-active': i === index }"
          @click="index = i"
          :aria-label="'Ir a publicación ' + (i + 1)"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useDisplay } from "vuetify";

const props = defineProps({
  urls: { type: Array, default: () => [] }, // lista de /p/ o /reel/
  title: { type: String, default: "Sorteooos en Instagram" },
  subtitle: { type: String, default: "Mirá las últimas publicaciones y participá." },

  // altura agradable (no gigante)
  heightDesktop: { type: Number, default: 360 },
  heightMobile: { type: Number, default: 520 },

  showArrowsDesktop: { type: Boolean, default: true },
  profileUrl: { type: String, default: "" }, // opcional: link al perfil
});

const { smAndDown } = useDisplay();
const index = ref(0);
const loaded = ref({});
const hardBlocked = ref(false);

const defaultProfileUrl = "https://www.instagram.com/";

function cleanUrl(u) {
  return String(u || "").trim();
}

function parseInstagramUrl(u) {
  const raw = cleanUrl(u);
  if (!raw) return null;

  // intentamos detectar /p/SHORT/ o /reel/SHORT/
  const m = raw.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;

  const type = String(m[1] || "").toLowerCase();
  const code = String(m[2] || "");

  // embed "captioned" se ve más “completo”
  const embedUrl =
    type === "reel"
      ? `https://www.instagram.com/reel/${code}/embed/captioned/`
      : `https://www.instagram.com/p/${code}/embed/captioned/`;

  // normalizamos el original (sin params)
  const originalUrl =
    type === "reel"
      ? `https://www.instagram.com/reel/${code}/`
      : `https://www.instagram.com/p/${code}/`;

  return {
    key: `${type}_${code}`,
    type,
    code,
    embedUrl,
    originalUrl,
  };
}

const normalized = computed(() => {
  const arr = Array.isArray(props.urls) ? props.urls : [];
  return arr
    .map(parseInstagramUrl)
    .filter(Boolean);
});

const computedHeight = computed(() => (smAndDown.value ? props.heightMobile : props.heightDesktop));
const showArrows = computed(() => (!smAndDown.value ? props.showArrowsDesktop : true));

function markUnloadedAll() {
  loaded.value = {};
  hardBlocked.value = false;
}

function refresh() {
  markUnloadedAll();
  // forzamos recarga cambiando índice ida y vuelta (re-render del iframe)
  const cur = index.value;
  index.value = 0;
  requestAnimationFrame(() => {
    index.value = Math.min(cur, Math.max(normalized.value.length - 1, 0));
  });
}

function onLoad(i) {
  loaded.value = { ...loaded.value, [i]: true };

  // si Meta/IG bloquea, suele cargar “vacío” o redirección rara.
  // no podemos leer contenido por CORS, pero si tarda demasiado y no carga ninguno,
  // activamos warning en fallback.
}

function prev() {
  if (!normalized.value.length) return;
  index.value = (index.value - 1 + normalized.value.length) % normalized.value.length;
}

function next() {
  if (!normalized.value.length) return;
  index.value = (index.value + 1) % normalized.value.length;
}

// Si no hay ninguno cargado tras X segundos => mostramos warning (típico en webview)
onMounted(() => {
  setTimeout(() => {
    const anyLoaded = Object.values(loaded.value || {}).some(Boolean);
    if (!anyLoaded && normalized.value.length) hardBlocked.value = true;
  }, 4500);
});

watch(
  () => props.urls,
  () => {
    index.value = 0;
    markUnloadedAll();
  },
  { deep: true }
);
</script>

<style scoped>
.igx-card {
  overflow: hidden;
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(250, 250, 250, 1), rgba(248, 248, 248, 1));
}

.igx-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.igx-ico {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.04);
  flex: 0 0 auto;
}

.igx-title {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.igx-sub {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.igx-btn {
  border-radius: 12px;
}

.igx-body {
  padding: 12px 12px 14px;
}

.igx-window {
  position: relative;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.igx-win {
  width: 100%;
}

.igx-frameWrap {
  position: relative;
  width: 100%;
}

.igx-frame {
  width: 100%;
  display: block;
  border: 0;
  background: white;
}

.igx-loader {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  z-index: 2;
  padding: 12px;
}

.igx-loaderText {
  font-size: 12px;
  opacity: 0.7;
}

.igx-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 10px 12px;
  background: rgba(255, 255, 255, 0.9);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.igx-footLeft {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.igx-hint {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.igx-arrows {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.igx-arrow {
  pointer-events: auto;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.igx-arrow:first-child {
  left: 10px;
}

.igx-arrow:last-child {
  right: 10px;
}

.igx-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 10px;
}

.igx-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.18);
  transition: transform 120ms ease, background 120ms ease;
}

.igx-dot.is-active {
  background: rgba(0, 0, 0, 0.52);
  transform: scale(1.25);
}

@media (max-width: 600px) {
  .igx-head {
    padding: 12px 12px 10px;
    flex-direction: column;
    align-items: flex-start;
  }
  .igx-head > div:last-child {
    width: 100%;
    justify-content: flex-end;
  }
  .igx-foot {
    flex-direction: column;
    align-items: stretch;
  }
  .igx-hint {
    display: none;
  }
}
</style>
