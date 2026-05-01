<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/HeroSlider.vue -->
<template>
  <section class="ml-hero">
    <div class="ml-hero-inner">
      <v-window v-model="idx" class="ml-window" :show-arrows="false" :touch="true">
        <v-window-item v-for="(s, i) in slidesSafe" :key="i">
          <div class="ml-slide" :style="slideRatioStyle(i, s)" @click="emitClick(s)">
            <img class="ml-bg" :src="getSlideImage(s)" :alt="s.title || 'slide'" loading="eager" />

            <!-- ✅ overlay por slide -->
            <div v-if="showOverlay && !s.noOverlay" class="ml-overlay" />

            <!-- ✅ texto por slide -->
            <div v-if="showText && !s.noText" class="ml-content">
              <div class="ml-pill" v-if="s.pill">{{ s.pill }}</div>
              <h1 v-if="s.title" class="ml-title">{{ s.title }}</h1>

              <p class="ml-subtitle" v-if="s.subtitle">
                {{ s.subtitle }}
              </p>

              <div class="ml-actions" v-if="showCtas">
                <button class="ml-cta primary" type="button" @click.stop="goPrimary(s)">
                  {{ s.primaryCta || "Ver más" }}
                </button>
                <button class="ml-cta ghost" type="button" @click.stop="goSecondary(s)">
                  {{ s.secondaryCta || "Ir al catálogo" }}
                </button>
              </div>
            </div>

            <img v-if="s.art" class="ml-art" :src="s.art" :alt="s.title || 'art'" />
          </div>
        </v-window-item>
      </v-window>

      <!-- ✅ Flechas — mismo estilo que los carruseles del shop
           (círculo blanco 56×56 con icon en color primary, estilo ML) -->
      <button
        v-if="slidesSafe.length > 1"
        class="ml-mlarrow left"
        type="button"
        aria-label="Anterior"
        @click.stop="prev"
      >
        <v-icon size="28">mdi-chevron-left</v-icon>
      </button>

      <button
        v-if="slidesSafe.length > 1"
        class="ml-mlarrow right"
        type="button"
        aria-label="Siguiente"
        @click.stop="next"
      >
        <v-icon size="28">mdi-chevron-right</v-icon>
      </button>

      <!-- dots -->
      <div class="ml-dots" v-if="slidesSafe.length > 1">
        <button
          v-for="(_, i) in slidesSafe"
          :key="i"
          class="ml-dot"
          :class="{ active: idx === i }"
          @click="idx = i"
          aria-label="slide"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

const router = useRouter();

/* ✅ CLAVE: SOLO XS usa mobileImage */
const { xs } = useDisplay();

const props = defineProps({
  slides: { type: Array, default: () => [] }, // (no se usa en desktop en esta versión)
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 6500 },
  branchId: { type: [Number, String], default: 3 },

  showText: { type: Boolean, default: true },
  showCtas: { type: Boolean, default: true },
  showOverlay: { type: Boolean, default: true },
});

const emit = defineEmits(["goShop", "clickSlide"]);

/* ✅ MOBILE: SOLO ESTOS 4 SLIDES (orden fijo) */
const MOBILE_ONLY_SLIDES = [
  {
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770903361128-e181e4da4c3a662d.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
  {
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770903354672-fc7932f140df70df.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
  {
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770903349299-716cc26c9ef934fa.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
  {
    imageMobile: "https://storage-files.cingulado.org/pos360/media/1770903342999-ce655b383b8f5793.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
];

/* ✅ DESKTOP: SOLO ESTOS 4 NUEVOS SLIDES */
const DESKTOP_ONLY_SLIDES = [
  {
    image: "https://storage-files.cingulado.org/pos360/media/1772940300994-b27df50809df4046.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
  {
    image: "https://storage-files.cingulado.org/pos360/media/1772940323537-24e8ab20edd1d7e2.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
  {
    image: "https://storage-files.cingulado.org/pos360/media/1772940332137-90f5e1e086afaf92.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
  {
    image: "https://storage-files.cingulado.org/pos360/media/1772940340936-8bab7563cfc89e28.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
];

/* rutas */
function goToShopCategory(catId, subId = null, q = null) {
  if (!catId) return;
  router.push({
    path: `/shop/c/${String(catId)}`,
    query: {
      branch_id: String(props.branchId),
      page: "1",
      ...(subId ? { sub: String(subId) } : {}),
      ...(q ? { q: String(q) } : {}),
    },
  });
}

function goToSearch(q) {
  router.push({
    path: "/shop",
    query: { branch_id: String(props.branchId), page: "1", ...(q ? { q: String(q) } : {}) },
  });
}

function emitClick(slide) {
  emit("clickSlide", slide);
  if (slide?.action) runAction(slide.action);
}

/* ✅ Desktop SIEMPRE image, Mobile SOLO XS usa imageMobile */
function getSlideImage(slide) {
  const base = slide?.image || "";
  const mobile = slide?.imageMobile || slide?.mobileImage || "";
  return xs.value ? mobile || base : base;
}

/* ✅ Fuente de slides: Mobile(XS)=4 fijos | Desktop=4 fijos */
const slidesSafe = computed(() => (xs.value ? MOBILE_ONLY_SLIDES : DESKTOP_ONLY_SLIDES));

const idx = ref(0);

watch(
  () => slidesSafe.value.length,
  (n) => {
    if (idx.value >= n) idx.value = 0;
  }
);

watch(
  () => xs.value,
  () => {
    idx.value = 0;
  }
);

/* ===========================
   ✅ Aspect Ratio REAL por slide
   =========================== */
const ratios = ref({}); // key: `${i}|${mode}` => ratioNumber

function ratioKey(i, mode) {
  return `${i}|${mode}`;
}
function currentMode() {
  return xs.value ? "m" : "d";
}

function ensureRatio(i, url, mode) {
  if (!url) return;
  const key = ratioKey(i, mode);
  if (ratios.value[key]) return;

  const img = new Image();
  img.decoding = "async";
  img.loading = "eager";
  img.onload = () => {
    const w = Number(img.naturalWidth || 0);
    const h = Number(img.naturalHeight || 0);
    if (w > 0 && h > 0) ratios.value = { ...ratios.value, [key]: w / h };
  };
  img.src = url;
}

watchEffect(() => {
  const mode = currentMode();
  slidesSafe.value.forEach((s, i) => {
    const url = mode === "m" ? (s?.imageMobile || s?.mobileImage || s?.image || "") : (s?.image || "");
    ensureRatio(i, url, mode);
  });
});

function slideRatioStyle(i, slide) {
  const mode = currentMode();
  const url = getSlideImage(slide);

  // fallbacks: mobile 4:5 (0.8) | desktop 1920x600 (3.2)
  const fallback = mode === "m" ? 0.8 : 3.2;
  const key = ratioKey(i, mode);
  const r = Number(ratios.value[key] || 0) || fallback;

  ensureRatio(i, url, mode);

  return {
    "--ml-ar": String(r),
  };
}

/* acciones */
function runAction(action) {
  if (!action || typeof action !== "object") {
    emit("goShop");
    return;
  }
  if (action.type === "category") {
    goToShopCategory(action.cat, action.sub || null, action.q || null);
    return;
  }
  if (action.type === "search") {
    goToSearch(action.q || "");
    return;
  }
  emit("goShop");
}

function goPrimary(slide) {
  runAction(slide?.primaryAction || slide?.action);
}
function goSecondary(slide) {
  runAction(slide?.secondaryAction || slide?.action);
}

/* nav */
function next() {
  idx.value = (idx.value + 1) % slidesSafe.value.length;
}
function prev() {
  idx.value = (idx.value - 1 + slidesSafe.value.length) % slidesSafe.value.length;
}

/* autoplay */
let t = null;
function startAuto() {
  stopAuto();
  if (!props.autoplay || slidesSafe.value.length <= 1) return;
  t = window.setInterval(() => next(), Math.max(2500, Number(props.interval) || 6500));
}
function stopAuto() {
  if (t) {
    clearInterval(t);
    t = null;
  }
}

onMounted(() => startAuto());
onBeforeUnmount(() => stopAuto());

watch(
  () => [props.autoplay, props.interval, slidesSafe.value.length],
  () => startAuto()
);
</script>

<style scoped>
/* =========================
   HERO FULL BLEED
   ========================= */
.ml-hero {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  position: relative;
  z-index: 1;
  top: -1px;
  background: transparent;
}

.ml-hero::before {
  display: none !important;
  content: none !important;
}

.ml-hero-inner {
  position: relative;
}

/* =========================
   V-WINDOW FIX (Vuetify)
   ========================= */
.ml-window {
  width: 100%;
  overflow: hidden;
  border-radius: 0 0 22px 22px;
  position: relative;
  display: block;
  background: transparent;
}

.ml-window :deep(.v-window__container),
.ml-window :deep(.v-window-item),
.ml-window :deep(.v-window-item__content) {
  height: auto !important;
  min-height: 0 !important;
}

/* =========================
   SLIDE
   ✅ SIN RECORTE (usa ratio real)
   ========================= */
.ml-slide {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: var(--ml-ar);
  cursor: pointer;
  background: transparent;
  overflow: hidden;
}

/* =========================
   IMAGEN
   ✅ PROHIBIDO RECORTAR => contain
   ========================= */
.ml-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  transform: none;
  background: transparent;
}

/* =========================
   OVERLAY
   ========================= */
.ml-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.28) 0%,
    rgba(0, 0, 0, 0.1) 55%,
    rgba(0, 0, 0, 0.05) 100%
  );
}

/* =========================
   CONTENIDO
   ========================= */
.ml-content {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  color: #fff;
  left: clamp(72px, 5.5vw, 104px);
  right: clamp(72px, 5.5vw, 104px);
  max-width: 860px;
}

/* =========================
   FLECHAS — círculo blanco grande con icon en color primary,
   estilo ML. Aparecen sólo cuando el cursor entra al hero
   (deslizamiento sutil desde el borde lateral).
   ========================= */
.ml-mlarrow {
  position: absolute;
  top: 50%;
  z-index: 20;
  width: 56px;
  height: 56px;
  border-radius: 999px;
  border: 0;
  background: #fff;
  color: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);

  /* hidden por defecto, slide-in en hover */
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    box-shadow 0.15s,
    visibility 0ms linear 180ms;
}

/* el hero es full-bleed (100vw) — las flechas se asoman desde el
   borde y deslizan hacia adentro al hacer hover */
.ml-mlarrow.left {
  left: 18px;
  transform: translateY(-50%) translateX(-12px);
}
.ml-mlarrow.right {
  right: 18px;
  transform: translateY(-50%) translateX(12px);
}

.ml-hero-inner:hover .ml-mlarrow,
.ml-window:hover .ml-mlarrow {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition:
    opacity 180ms ease,
    transform 180ms ease,
    box-shadow 0.15s,
    visibility 0ms;
}
.ml-hero-inner:hover .ml-mlarrow.left,
.ml-window:hover .ml-mlarrow.left {
  transform: translateY(-50%) translateX(0);
}
.ml-hero-inner:hover .ml-mlarrow.right,
.ml-window:hover .ml-mlarrow.right {
  transform: translateY(-50%) translateX(0);
}

.ml-mlarrow:hover {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
}
.ml-mlarrow.left:hover {
  transform: translateY(-50%) translateX(0) scale(1.04);
}
.ml-mlarrow.right:hover {
  transform: translateY(-50%) translateX(0) scale(1.04);
}
.ml-mlarrow.left:active {
  transform: translateY(-50%) translateX(0) scale(0.94);
}
.ml-mlarrow.right:active {
  transform: translateY(-50%) translateX(0) scale(0.94);
}

/* =========================
   DOTS
   ========================= */
.ml-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  display: flex;
  justify-content: center;
  gap: 7px;
  z-index: 6;
}

.ml-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.45);
}

.ml-dot.active {
  width: 20px;
  background: rgba(255, 255, 255, 0.95);
}

/* =========================
   TABLET — flecha un poco más chica y bien dentro del viewport
   ========================= */
@media (max-width: 960px) {
  .ml-mlarrow {
    width: 48px;
    height: 48px;
  }
  .ml-mlarrow.left { left: 12px; }
  .ml-mlarrow.right { right: 12px; }
}

/* =========================
   MOBILE
   ✅ sin hover => no flechas
   ========================= */
@media (max-width: 600px) {
  .ml-mlarrow {
    display: none;
  }
}
</style>