<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductGallery.vue -->
<template>
  <v-card class="pg-card" variant="flat">
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

            <!-- contador ML -->
            <div v-if="images.length > 1" class="ml-count-pill">
              {{ activeIdx + 1 }} / {{ images.length }}
            </div>

            <!-- ver -->
            <div v-if="images.length" class="open-hint">
              <v-icon size="18">mdi-magnify-plus-outline</v-icon>
              <span>Ver</span>
            </div>
          </div>

          <!-- Thumbs mobile -->
          <div class="thumbs-mobile" v-if="images.length > 1">
            <div class="thumbs-scroll">
              <button
                v-for="(src, i) in images"
                :key="'m' + src + i"
                class="thumb-m"
                :class="{ active: i === activeIdx }"
                type="button"
                @click="activeIdx = i"
              >
                <img :src="src" alt="" @error="onImgError(src)" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- Viewer -->
  <v-dialog v-model="viewer" max-width="980">
    <v-card class="pg-viewer-card" variant="flat">
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
              <img :src="src" class="viewer-img" alt="" />
            </div>
          </v-carousel-item>
        </v-carousel>
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
const broken = ref(new Set());

function onImgError(url) {
  const u = String(url || "").trim();
  if (!u || broken.value.has(u)) return;
  broken.value.add(u);
}

function extractImages(p) {
  if (!p) return [];
  const acc = [];
  if (Array.isArray(p.images)) {
    p.images.forEach(it => {
      const u = typeof it === "string" ? it : it?.url;
      if (u) acc.push(u);
    });
  }
  if (Array.isArray(p.image_urls)) acc.push(...p.image_urls);
  if (!acc.length && p.image_url) acc.push(p.image_url);
  return [...new Set(acc)];
}

const images = computed(() =>
  extractImages(props.product).filter(u => !broken.value.has(u))
);

const activeImage = computed(() => images.value[activeIdx.value] || "");

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
</script>

<style scoped>
/* Card */
.pg-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.pg-pad {
  padding: 14px;
}

/* 🔥 GALERÍA CENTRADA */
.gallery {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 14px;

  max-width: 640px;   /* ML feel */
  margin: 0 auto;     /* CENTRADO */
}

/* Thumbs desktop */
.thumbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.thumb {
  width: 86px;
  aspect-ratio: 1/1;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.1);
  background: #fff;
  overflow: hidden;
  cursor: pointer;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.thumb.active {
  border-color: rgba(25,118,210,.6);
}

/* Main */
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 🔥 IMAGEN GRANDE, OCUPA ANCHO */
.main-frame {
  position: relative;
  width: 100%;
  max-width: 520px;
  height: 520px;

  border-radius: 16px;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  background: #fff;

  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.main-img {
  width: 100%;
  height: 100%;
  object-fit: cover;      /* DESKTOP: llena */
}

/* Contador ML */
.ml-count-pill {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  background: rgba(255,255,255,.85);
  border: 1px solid rgba(0,0,0,.06);
}

/* Ver */
.open-hint {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255,255,255,.85);
  border: 1px solid rgba(0,0,0,.06);
  display: flex;
  gap: 6px;
  align-items: center;
}

/* Thumbs mobile */
.thumbs-mobile {
  margin-top: 12px;
  width: 100%;
}
.thumbs-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}
.thumb-m {
  width: 64px;
  aspect-ratio: 1/1;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.1);
  background: #fff;
  flex: 0 0 auto;
}
.thumb-m img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.thumb-m.active {
  border-color: rgba(25,118,210,.6);
}

/* Viewer */
.viewer-frame {
  height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.viewer-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 🔥 MOBILE PERFECTO */
@media (max-width: 980px) {
  .gallery {
    grid-template-columns: 1fr;
    max-width: 100%;
    justify-items: center;
  }
  .thumbs {
    display: none;
  }
  .main-frame {
    height: min(92vw, 420px);
  }
  .main-img {
    object-fit: contain;   /* MOBILE: sin recorte */
  }
}
</style>
