<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/ProductGallery.vue -->
<template>
  <v-card class="pg-card" variant="outlined">
    <v-card-text class="pg-pad">
      <div class="gallery">
        <!-- Thumbs desktop (SIEMPRE, aunque haya 1 sola imagen) -->
        <div class="thumbs" aria-label="Miniaturas">
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
            tabindex="0"
            @click="openViewer"
            @keydown.enter.prevent="openViewer"
            @keydown.space.prevent="openViewer"
            :title="images.length ? 'Ver imágenes' : ''"
          >
            <img
              v-if="activeImage"
              :key="'main-' + activeImage"
              class="main-img"
              :src="activeImage"
              alt=""
              @error="onImgError(activeImage)"
              decoding="async"
              loading="eager"
            />
            <div v-else class="main-empty">Sin imagen</div>

            <div v-if="images.length" class="open-hint">
              <v-icon size="18">mdi-magnify-plus-outline</v-icon>
              <span>Ver</span>
            </div>

            <div v-if="images.length > 1" class="count-pill">
              {{ activeIdx + 1 }} / {{ images.length }}
            </div>
          </div>

          <!-- Thumbs mobile -->
          <div v-if="images.length > 1" class="thumbs-mobile" aria-label="Miniaturas (mobile)">
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
        </div>
      </div>
    </v-card-text>
  </v-card>

  <!-- ✅ Visor ML-like (overlay nativo, centrado, sin zoom raro, swipe en mobile) -->
  <teleport to="body">
    <div
      v-if="viewer"
      class="mlv-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="closeViewer"
      @keydown.esc.prevent="closeViewer"
      @keydown.left.prevent="prev"
      @keydown.right.prevent="next"
      tabindex="0"
      ref="overlayEl"
    >
      <div class="mlv-topbar">
        <div class="mlv-title">Imágenes</div>

        <div class="mlv-right">
          <div class="mlv-counter" v-if="images.length">
            {{ viewerIdx + 1 }} / {{ images.length }}
          </div>

          <button class="mlv-close" type="button" @click="closeViewer" aria-label="Cerrar">
            <v-icon size="22">mdi-close</v-icon>
          </button>
        </div>
      </div>

      <!-- Flechas (desktop) -->
      <button
        v-if="images.length > 1"
        class="mlv-nav mlv-nav-left"
        type="button"
        @click.stop="prev"
        aria-label="Anterior"
      >
        <v-icon size="26">mdi-chevron-left</v-icon>
      </button>

      <button
        v-if="images.length > 1"
        class="mlv-nav mlv-nav-right"
        type="button"
        @click.stop="next"
        aria-label="Siguiente"
      >
        <v-icon size="26">mdi-chevron-right</v-icon>
      </button>

      <!-- Imagen centrada (contain), swipe en mobile -->
      <div
        class="mlv-stage"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <img
          v-if="images.length"
          :key="'v-' + images[viewerIdx]"
          class="mlv-img"
          :src="images[viewerIdx]"
          alt=""
          @error="onImgError(images[viewerIdx])"
          draggable="false"
        />
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  product: { type: Object, default: null },
});

const activeIdx = ref(0);
const viewer = ref(false);
const viewerIdx = ref(0);
const overlayEl = ref(null);

// URLs rotas
const broken = ref(new Set());

function toUrl(x) {
  return String(x || "").trim();
}

function uniq(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr) {
    const s = toUrl(v);
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

function extractImages(p) {
  if (!p) return [];
  const out = [];

  // arrays modernos
  if (Array.isArray(p.images) && p.images.length) {
    for (const it of p.images) {
      const u =
        typeof it === "string"
          ? it
          : it?.url || it?.image_url || it?.src || it?.path;
      if (u) out.push(u);
    }
  }

  if (Array.isArray(p.image_urls) && p.image_urls.length) {
    for (const u of p.image_urls) if (u) out.push(u);
  }

  // legacy
  if (p.image_url) out.push(p.image_url);
  if (p.image_url_2) out.push(p.image_url_2);
  if (p.image2_url) out.push(p.image2_url);
  if (p.image_url2) out.push(p.image_url2);
  if (p.image2) out.push(p.image2);

  return uniq(out);
}

const imagesRaw = computed(() => extractImages(props.product));
const images = computed(() => imagesRaw.value.filter((u) => u && !broken.value.has(u)));

const activeImage = computed(() => {
  const list = images.value;
  if (!list.length) return "";
  const idx = Math.min(Math.max(0, Number(activeIdx.value || 0)), list.length - 1);
  return list[idx];
});

function onImgError(url) {
  const u = toUrl(url);
  if (!u) return;
  if (broken.value.has(u)) return;

  const next = new Set(broken.value);
  next.add(u);
  broken.value = next;

  // si la activa se rompió, saltar a la primera válida
  const list = imagesRaw.value.filter((x) => x && !next.has(x));
  if (!list.length) {
    activeIdx.value = 0;
    viewerIdx.value = 0;
    return;
  }

  activeIdx.value = 0;
  viewerIdx.value = 0;
}

function openViewer() {
  if (!images.value.length) return;
  viewerIdx.value = Math.min(activeIdx.value, images.value.length - 1);
  viewer.value = true;

  // focus overlay para que ESC/←/→ funcionen
  nextTick(() => {
    try {
      overlayEl.value?.focus?.();
    } catch {}
  });

  lockBodyScroll(true);
}

function closeViewer() {
  viewer.value = false;
  lockBodyScroll(false);
}

function prev() {
  if (!images.value.length) return;
  if (images.value.length === 1) return;
  viewerIdx.value = (viewerIdx.value - 1 + images.value.length) % images.value.length;
  activeIdx.value = viewerIdx.value;
}

function next() {
  if (!images.value.length) return;
  if (images.value.length === 1) return;
  viewerIdx.value = (viewerIdx.value + 1) % images.value.length;
  activeIdx.value = viewerIdx.value;
}

// ===== Swipe mobile =====
const touchStartX = ref(null);

function onTouchStart(e) {
  const t = e?.changedTouches?.[0];
  if (!t) return;
  touchStartX.value = t.clientX;
}

function onTouchEnd(e) {
  const startX = touchStartX.value;
  touchStartX.value = null;
  if (startX == null) return;

  const t = e?.changedTouches?.[0];
  if (!t) return;

  const dx = t.clientX - startX;
  if (Math.abs(dx) < 45) return; // umbral

  if (dx > 0) prev();
  else next();
}

// ===== Scroll lock =====
let prevBodyOverflow = "";

function lockBodyScroll(lock) {
  const body = document?.body;
  if (!body) return;

  if (lock) {
    prevBodyOverflow = body.style.overflow || "";
    body.style.overflow = "hidden";
  } else {
    body.style.overflow = prevBodyOverflow;
  }
}

onBeforeUnmount(() => {
  lockBodyScroll(false);
});

// reseteos
watch(
  () => props.product?.id,
  () => {
    activeIdx.value = 0;
    viewerIdx.value = 0;
    viewer.value = false;
    broken.value = new Set();
    lockBodyScroll(false);
  }
);

watch(viewerIdx, (v) => {
  const n = Number(v || 0);
  if (Number.isFinite(n)) activeIdx.value = n;
});
</script>

<style scoped>
/* =========================
   Card
   ========================= */
.pg-card {
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.pg-pad { padding: 14px; }

/* =========================
   Layout
   ========================= */
.gallery {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  gap: 14px;
  max-width: 980px;
  margin: 0 auto;
  align-items: start;
}

/* =========================
   Thumbs desktop
   ========================= */
.thumbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.thumb {
  width: 86px;
  height: 86px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,.12);
  background: #fff;
  overflow: hidden;
  padding: 0;
  cursor: pointer;
}
.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
.thumb.active { border-color: rgba(25,118,210,.7); }

/* =========================
   Main
   ========================= */
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.main-frame {
  position: relative;
  width: min(760px, 100%);
  height: 520px;

  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.06);
  box-shadow: 0 1px 2px rgba(0,0,0,.04);

  overflow: hidden;
  cursor: pointer;
}

.main-img {
  position: absolute;
  inset: 0;
  width: 100% !important;
  height: 100% !important;
  display: block !important;

  object-fit: cover !important;              /* Desktop: cover */
  object-position: center center !important; /* centrado real */
  transform: none !important;
}

/* vacío */
.main-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(0,0,0,.55);
  font-size: 14px;
}

.open-hint {
  position: absolute;
  z-index: 2;
  bottom: 10px;
  right: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(0,0,0,.08);
  font-size: 12px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.count-pill {
  position: absolute;
  z-index: 2;
  top: 10px;
  left: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(0,0,0,.08);
  font-size: 12px;
  font-weight: 800;
}

/* =========================
   Mobile thumbs (fila abajo)
   ========================= */
.thumbs-mobile {
  display: none;
  margin-top: 10px;
  width: 100%;
}

/* ✅ FIX: que no “se rompa” abajo:
   - altura estable
   - scroll suave
   - padding para que no tape el borde
*/
.thumbs-scroll {
  display: flex;
  flex-wrap: nowrap;
  gap: 10px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;

  padding: 6px 6px 10px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}

.thumbs-scroll::-webkit-scrollbar { height: 8px; }
.thumbs-scroll::-webkit-scrollbar-thumb { border-radius: 999px; }

.thumb-m {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  border: 1px solid rgba(0,0,0,.12);
  background: #fff;
  overflow: hidden;
  flex: 0 0 auto;
  padding: 0;
  scroll-snap-align: start;
}

.thumb-m img {
  width: 100%;
  height: 100%;
  object-fit: cover;           /* ✅ miniaturas sin “letterbox” */
  object-position: center;
  display: block;
}

.thumb-m.active {
  border-color: rgba(25,118,210,.7);
  box-shadow: 0 0 0 2px rgba(25,118,210,.12);
}

/* =========================
   Visor overlay (si lo usás)
   ========================= */
.mlv-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,.72);
  display: grid;
  grid-template-rows: auto 1fr;
  outline: none;
}

.mlv-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  color: #fff;
}

.mlv-title { font-weight: 800; font-size: 16px; }

.mlv-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.mlv-counter { font-weight: 800; font-size: 13px; opacity: .9; }

.mlv-close {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(0,0,0,.22);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.mlv-stage {
  position: relative;
  display: grid;
  place-items: center;
  padding: 18px 16px 22px;
}

.mlv-img {
  max-width: min(980px, 92vw);
  max-height: 78vh;
  width: auto;
  height: auto;
  object-fit: contain;
  object-position: center;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(0,0,0,.35);
  user-select: none;
  -webkit-user-drag: none;
}

.mlv-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(0,0,0,.18);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.mlv-nav-left { left: 18px; }
.mlv-nav-right { right: 18px; }

/* =========================
   Responsive (mobile)
   ========================= */
@media (max-width: 980px) {
  .gallery {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  .thumbs { display: none; }
  .thumbs-mobile { display: block; }

  /* ✅ MAIN en mobile: cover + alto estable */
  .main-frame {
    width: 96vw;
    max-width: 560px;
    height: min(92vw, 520px);   /* alto estable, no “aplastado” */
  }

  /* ✅ Mobile: también cover (como pediste) */
  .main-img {
    object-fit: cover !important;
    object-position: center center !important;
  }

  /* ✅ barra de thumbs: que no se corte */
  .thumbs-scroll {
    padding-bottom: 12px;
  }

  .mlv-img {
    max-width: 92vw;
    max-height: 72vh;
  }

  .mlv-nav { width: 42px; height: 42px; opacity: .9; }
  .mlv-nav-left { left: 10px; }
  .mlv-nav-right { right: 10px; }
}

@media (max-width: 420px) {
  .pg-pad { padding: 12px; }
  .thumb-m { width: 68px; height: 68px; }
}
</style>

