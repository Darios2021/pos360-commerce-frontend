<!-- src/modules/shop/components/ProductGallery.vue -->
<template>
  <v-card class="rounded-xl" variant="outlined">
    <v-card-text>
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
            <img :src="src" alt="" />
          </button>
        </div>

        <!-- Main -->
        <div class="main">
          <div class="main-frame" role="button" @click="openViewer" :title="images.length ? 'Ver imágenes' : ''">
            <img v-if="activeImage" :src="activeImage" class="main-img" alt="" />
            <div v-else class="main-empty">Sin imagen</div>

            <div v-if="images.length" class="open-hint">
              <v-icon size="18">mdi-magnify-plus-outline</v-icon>
              <span>Ver</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Thumbs mobile -->
      <div class="thumbs-mobile" v-if="images.length > 1">
        <v-slide-group show-arrows>
          <v-slide-group-item v-for="(src, i) in images" :key="src + i">
            <v-btn
              variant="text"
              class="thumb-btn"
              :class="{ active: i === activeIdx }"
              @click="activeIdx = i"
            >
              <v-img :src="src" width="72" height="72" cover class="rounded-lg" />
            </v-btn>
          </v-slide-group-item>
        </v-slide-group>
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
          <v-carousel-item v-for="(src, i) in images" :key="src + i">
            <div class="viewer-frame">
              <img :src="src" class="viewer-img" alt="" />
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
            <img :src="src" alt="" />
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

function extractImages(p) {
  if (!p) return [];
  const acc = [];

  if (Array.isArray(p.images)) {
    for (const it of p.images) {
      const u =
        typeof it === "string"
          ? it
          : it?.url || it?.image_url || it?.src || it?.path;
      if (u) acc.push(u);
    }
  }

  if (Array.isArray(p.image_urls)) {
    for (const u of p.image_urls) if (u) acc.push(u);
  }

  if (p.image_url_2) acc.push(p.image_url_2);
  if (p.image2_url) acc.push(p.image2_url);
  if (p.image_url2) acc.push(p.image_url2);
  if (p.image2) acc.push(p.image2);

  if (p.image_url) acc.push(p.image_url);

  return uniqUrls(acc);
}

const images = computed(() => extractImages(props.product));

const activeImage = computed(() => {
  const list = images.value;
  if (!list.length) return props.product?.image_url || "";
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
  }
);
</script>

<style scoped>
.gallery {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

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
  border: 2px solid rgba(0, 0, 0, 0.10);
  background: #fff;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.thumb.active {
  border-color: rgba(25, 118, 210, 0.55);
}

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
  background: rgba(0,0,0,.06);
  font-size: 12px;
}

.thumbs-mobile {
  display: none;
  margin-top: 12px;
}
.thumb-btn {
  border-radius: 14px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  padding: 6px;
}
.thumb-btn.active {
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
  border: 2px solid rgba(0,0,0,.10);
  background: #fff;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
}
.viewer-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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
    height: 380px;
  }
  .viewer-frame {
    height: 420px;
  }
}
</style>
