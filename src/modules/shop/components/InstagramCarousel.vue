<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/InstagramCarousel.vue -->
<template>
  <section class="igc-wrap">
    <v-card class="igc-card" variant="outlined" rounded="xl">
      <!-- Header -->
      <div class="igc-head">
        <div class="igc-left">
          <span class="igc-dot" aria-hidden="true"></span>
          <v-icon size="18" class="igc-icon">mdi-instagram</v-icon>

          <div class="igc-copy">
            <div class="igc-title">{{ title }}</div>
            <div class="igc-subtitle" v-if="subtitle">{{ subtitle }}</div>
          </div>
        </div>

        <div class="igc-right">
          <v-btn
            v-if="activePermalink"
            class="igc-btn"
            size="small"
            variant="flat"
            color="primary"
            prepend-icon="mdi-open-in-new"
            :href="activePermalink"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver en Instagram
          </v-btn>
        </div>
      </div>

      <!-- Carousel -->
      <div class="igc-body" :style="frameVars">
        <v-carousel
          v-model="idx"
          class="igc-carousel"
          :show-arrows="showArrows"
          hide-delimiters="false"
          :cycle="false"
          :continuous="false"
          :touch="true"
          :height="carouselHeight"
        >
          <v-carousel-item v-for="(u, i) in normalizedUrls" :key="u + '_' + i">
            <div class="igc-item">
              <div class="igc-frame">
                <iframe
                  class="igc-iframe"
                  :src="toEmbed(u)"
                  :title="`Instagram embed ${i + 1}`"
                  loading="lazy"
                  allowfullscreen
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  referrerpolicy="strict-origin-when-cross-origin"
                ></iframe>
              </div>

              <div class="igc-foot">
                <v-btn
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-open-in-new"
                  :href="u"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir publicación
                </v-btn>

                <div class="igc-hint text-caption text-medium-emphasis">
                  Deslizá para ver más • {{ i + 1 }} / {{ normalizedUrls.length }}
                </div>
              </div>
            </div>
          </v-carousel-item>
        </v-carousel>
      </div>
    </v-card>
  </section>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";

const props = defineProps({
  // Array de permalinks (p o reel). Acepta con query y sin slash final.
  urls: { type: Array, default: () => [] },

  title: { type: String, default: "🎁 Sorteooos y publicaciones" },
  subtitle: { type: String, default: "Deslizá para ver todas las publicaciones." },

  // alturas (controladas para que no sea gigante)
  heightDesktop: { type: Number, default: 380 },
  heightMobile: { type: Number, default: 440 },

  // comportamiento
  startIndex: { type: Number, default: 0 },
  showArrowsDesktop: { type: Boolean, default: true },
});

const idx = ref(0);

function normalizePermalink(u) {
  const s = String(u || "").trim();
  if (!s) return "";

  const noQuery = s.split("?")[0].split("#")[0];

  let url = noQuery;
  if (url.startsWith("http://")) url = url.replace("http://", "https://");
  if (!url.startsWith("https://")) return ""; // seguridad mínima

  if (!url.endsWith("/")) url += "/";
  return url;
}

const normalizedUrls = computed(() => {
  const arr = Array.isArray(props.urls) ? props.urls : [];
  return arr
    .map(normalizePermalink)
    .filter((x) => x && x.includes("instagram.com/"));
});

function toEmbed(permalink) {
  // embed oficial
  return String(permalink || "") + "embed/";
}

const isMobile = ref(false);

function computeIsMobile() {
  isMobile.value = window.matchMedia("(max-width: 600px)").matches;
}

onMounted(() => {
  computeIsMobile();
  window.addEventListener("resize", computeIsMobile, { passive: true });
  idx.value = Math.max(0, Math.min(Number(props.startIndex || 0), normalizedUrls.value.length - 1));
});

const carouselHeight = computed(() => (isMobile.value ? props.heightMobile : props.heightDesktop));
const frameVars = computed(() => ({
  "--igc-h": `${carouselHeight.value}px`,
}));

const showArrows = computed(() => (isMobile.value ? false : !!props.showArrowsDesktop));

const activePermalink = computed(() => normalizedUrls.value[idx.value] || "");
</script>

<style scoped>
.igc-wrap {
  width: 100%;
}

.igc-card {
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.06),
    0 2px 8px rgba(0, 0, 0, 0.04);
}

.igc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px 10px 16px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.03), rgba(0, 0, 0, 0));
}

.igc-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.igc-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 0, 128, 0.55), rgba(255, 153, 0, 0.45));
  box-shadow: 0 0 0 6px rgba(255, 0, 128, 0.08);
}

.igc-icon {
  opacity: 0.9;
}

.igc-copy {
  min-width: 0;
}

.igc-title {
  font-weight: 900;
  font-size: 14px;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.igc-subtitle {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.igc-btn {
  border-radius: 999px !important;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
}

.igc-body {
  padding: 0 16px 14px 16px;
}

/* carousel */
.igc-carousel {
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

/* cada item */
.igc-item {
  height: var(--igc-h);
  display: flex;
  flex-direction: column;
}

.igc-frame {
  flex: 1;
  min-height: 0;
}

.igc-iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #fff;
}

/* footer del item */
.igc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(0, 0, 0, 0.015);
}

.igc-hint {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 600px) {
  .igc-head {
    padding: 12px 12px 8px 12px;
  }
  .igc-body {
    padding: 0 12px 12px 12px;
  }
  .igc-carousel {
    border-radius: 16px;
  }
  .igc-foot {
    padding: 8px 10px;
  }
}
</style>
