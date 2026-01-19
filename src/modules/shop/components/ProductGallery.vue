<!-- src/modules/shop/components/ProductGallery.vue -->
<template>
  <v-card class="pg-card rounded-xl" variant="outlined">
    <v-card-text class="pg-pad">
      <div class="gallery">
        <!-- Thumbs desktop -->
        <div class="thumbs" v-if="images.length > 1">
          <button
            v-for="(src, i) in images"
            :key="src + i"
            class="thumb"
            :class="{ active: i === activeIdx }"
            type="button"
            @click="activeIdx = i"
            :title="`Imagen ${i + 1}`"
          >
            <img :src="src" alt="" @error="onImgError(src)" />
          </button>
        </div>

        <!-- Main -->
        <div class="main">
          <div
            class="main-frame"
            role="button"
            @click="openViewer"
            :title="images.length ? 'Ver imágenes' : ''"
          >
            <img
              v-if="activeImage"
              :src="activeImage"
              class="main-img"
              alt=""
              @error="onImgError(activeImage)"
            />
            <div v-else class="main-empty">Sin imagen</div>

            <div v-if="images.length" class="open-hint">
              <v-icon size="18">mdi-magnify-plus-outline</v-icon>
              <span>Ver</span>
            </div>
          </div>

          <div v-if="images.length > 1" class="count-hint">
            {{ activeIdx + 1 }} / {{ images.length }}
          </div>
        </div>
      </div>

      <!-- ✅ Mobile thumbs (SCROLLER PROPIO, sin slide-group) -->
      <div class="thumbs-mobile" v-if="images.length > 1">
        <div class="thumbs-scroll" role="list">
          <button
            v-for="(src, i) in images"
            :key="'m' + src + i"
            class="thumb-m"
            :class="{ active: i === activeIdx }"
            type="button"
            @click="activeIdx = i"
            :title="`Imagen ${i + 1}`"
            role="listitem"
          >
            <img :src="src" alt="" @error="onImgError(src)" />
          </button>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- Viewer -->
  <v-dialog v-model="viewer" max-width="980">
    <v-card class="rounded-xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-subtitle-1 font-weight-bold">Imágenes</div>
        <v-btn icon variant="text" @click="viewer = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-carousel
          v-if="images.length"
          v-model="carouselIdx"
          height="520"
          hide-delimiters
          show-arrows="hover"
        >
          <v-carousel-item v-for="(src, i) in images" :key="'c' + src + i">
            <div class="viewer-frame">
              <img :src="src" class="viewer-img" alt="" @error="onImgError(src)" />
            </div>
          </v-carousel-item>
        </v-carousel>

        <div v-else class="text-center text-medium-emphasis py-8">Sin imágenes</div>

        <div v-if="images.length > 1" class="viewer-thumbs">
          <button
            v-for="(src, i) in images"
            :key="'v' + src + i"
            class="viewer-thumb"
            :class="{ active: i === carouselIdx }"
            type="button"
            @click="carouselIdx = i"
          >
            <img :src="src" alt="" @error="onImgError(src)" />
          </button>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

const activeIdx = ref(0);
const viewer = ref(false);
const carouselIdx = ref(0);

// ✅ URLs rotas
const broken = ref(new Set());

function onImgError(url) {
  const u = String(url || "").trim();
  if (!u) return;
  if (broken.value.has(u)) return;

  const next = new Set(broken.value);
  next.add(u);
  broken.value = next;

  if (activeImage.value === u) {
    const idx = images.value.findIndex((x) => x && !broken.value.has(x));
    activeIdx.value = idx >= 0 ? idx : 0;
  }
}

function uniqUrls(list) {
  const out = [];
  const seen = new Set();
  for (const u of list) {
    const s = String(u || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

/**
 * ✅ NO mezclar image_url con arrays si existen.
 * - p.images: [{url}] o strings
 * - p.image_urls: [url]
 * - fallback: p.image_url
 */
function extractImages(p) {
  if (!p) return [];

  const acc = [];
  const hasImagesArray = Array.isArray(p.images) && p.images.length > 0;
  const hasUrlsArray = Array.isArray(p.image_urls) && p.image_urls.length > 0;

  if (hasImagesArray) {
    for (const it of p.images) {
      const u =
        typeof it === "string"
          ? it
          : it?.url || it?.image_url || it?.src || it?.path;
      if (u) acc.push(u);
    }
  }

  if (hasUrlsArray) {
    for (const u of p.image_urls) if (u) acc.push(u);
  }

  // legacy
  if (p.image_url_2) acc.push(p.image_url_2);
  if (p.image2_url) acc.push(p.image2_url);
  if (p.image_url2) acc.push(p.image_url2);
  if (p.image2) acc.push(p.image2);

  if (!hasImagesArray && !hasUrlsArray) {
    if (p.image_url) acc.push(p.image_url);
  }

  return uniqUrls(acc);
}

const imagesRaw = computed(() => extractImages(props.product));
const images = computed(() => imagesRaw.value.filter((u) => u && !broken.value.has(u)));

const activeImage = computed(() => {
  const list = images.value;
  if (!list.length) return "";
  const idx = Math.min(Math.max(0, Number(activeIdx.value || 0)), list.length - 1);
  return list[idx];
});

function openViewer() {
  if (!images.value.length) return;
  carouselIdx.value = activeIdx.value;
  viewer.value = true;
}

watch(
  () => props.product?.id,
  () => {
    activeIdx.value = 0;
    carouselIdx.value = 0;
    viewer.value = false;
    broken.value = new Set();
  }
);

watch(carouselIdx, (v) => {
  const n = Number(v || 0);
  if (Number.isFinite(n)) activeIdx.value = n;
});
</script>

<style scoped>
.pg-card {
  border-radius: 18px;
  overflow: visible;
}
.pg-pad {
  padding: 16px;
}

.gallery {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

/* Thumbs desktop */
.thumbs {
  width: 78px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.thumb {
  width: 78px;
  height: 78px;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
  display: block;
}
.thumb.active {
  border-color: rgba(25, 118, 210, 0.55);
}

/* Main */
.main {
  flex: 1;
  min-width: 0;
}
.main-frame {
  position: relative;
  width: 100%;
  height: 460px;
  border-radius: 16px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: pointer;
}
.main-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fff;
}
.main-empty {
  color: rgba(0, 0, 0, 0.55);
  font-size: 14px;
}
.open-hint {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.06);
  font-size: 12px;
}
.count-hint {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  text-align: center;
}

/* ✅ Mobile thumbs scroller */
.thumbs-mobile {
  display: none;
  margin-top: 12px;
}
.thumbs-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  overflow-y: visible;
  padding: 6px 2px 2px;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
}
.thumbs-scroll::-webkit-scrollbar {
  height: 8px;
}
.thumb-m {
  width: 78px;
  height: 78px;
  border-radius: 14px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  flex: 0 0 auto;
  scroll-snap-align: start;
}
.thumb-m img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
  display: block;
}
.thumb-m.active {
  border-color: rgba(25, 118, 210, 0.55);
}

/* Viewer */
.viewer-frame {
  width: 100%;
  height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
}
.viewer-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #fff;
}
.viewer-thumbs {
  margin-top: 12px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.viewer-thumb {
  width: 72px;
  height: 72px;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  background: #fff;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
}
.viewer-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #fff;
}
.viewer-thumb.active {
  border-color: rgba(25, 118, 210, 0.55);
}

@media (max-width: 980px) {
  .thumbs {
    display: none;
  }
  .thumbs-mobile {
    display: block;
  }
  .main-frame {
    height: 360px;
  }
  .viewer-frame {
    height: 420px;
  }
}

@media (max-width: 420px) {
  .pg-pad {
    padding: 12px;
  }
  .main-frame {
    height: 320px;
  }
}
</style>
