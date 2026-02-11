<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/HeroSlider.vue -->
<template>
  <section class="ml-hero">
    <div class="ml-hero-inner">
      <v-window v-model="idx" class="ml-window" :show-arrows="false" :touch="true">
        <v-window-item v-for="(s, i) in slidesSafe" :key="i">
          <div class="ml-slide" :style="slideRatioStyle(i, s)" @click="emitClick(s)">
            <img class="ml-bg" :src="getSlideImage(s)" :alt="s.title || 'slide'" />

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

      <!-- ✅ Flechas estilo MercadoLibre (píldora lateral) -->
      <button
        v-if="slidesSafe.length > 1"
        class="ml-mlarrow left"
        type="button"
        aria-label="Anterior"
        @click.stop="prev"
      >
        <svg class="ml-mlarrow-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M14.5 5.5a1 1 0 0 1 0 1.4L10.4 11l4.1 4.1a1 1 0 1 1-1.4 1.4l-4.8-4.8a1 1 0 0 1 0-1.4l4.8-4.8a1 1 0 0 1 1.4 0Z"
          />
        </svg>
      </button>

      <button
        v-if="slidesSafe.length > 1"
        class="ml-mlarrow right"
        type="button"
        aria-label="Siguiente"
        @click.stop="next"
      >
        <svg class="ml-mlarrow-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9.5 18.5a1 1 0 0 1 0-1.4L13.6 13 9.5 8.9a1 1 0 1 1 1.4-1.4l4.8 4.8a1 1 0 0 1 0 1.4l-4.8 4.8a1 1 0 0 1-1.4 0Z"
          />
        </svg>
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
  slides: { type: Array, default: () => [] },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 6500 },
  branchId: { type: [Number, String], default: 3 },

  showText: { type: Boolean, default: true },
  showCtas: { type: Boolean, default: true },
  showOverlay: { type: Boolean, default: true },
});

const emit = defineEmits(["goShop", "clickSlide"]);

/* ✅ MOBILE: SOLO ESTOS 2 SLIDES */
const MOBILE_ONLY_SLIDES = [
  {
    imageMobile:
      "https://storage-files.cingulado.org/pos360/media/1770832986182-4fde29ff0d46728d.webp",
    noText: true,
    noOverlay: true,
    action: { type: "shop" },
  },
  {
    imageMobile:
      "https://storage-files.cingulado.org/pos360/media/1770833315750-9981b710d7186de3.webp",
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

/* fallback SOLO si no hay slides */
const FALLBACK_SLIDES = [
  {
    pill: "NOVEDADES",
    title: "Gadgets y accesorios\nnuevos",
    subtitle: "Descubrí productos recién ingresados en el catálogo.",
    image: "https://storage-files.cingulado.org/pos360/products/296/1768880552898-f845ccb64617.webp",
    primaryCta: "Ver más",
    secondaryCta: "Ir al catálogo",
    primaryAction: { type: "shop" },
    secondaryAction: { type: "shop" },
  },
];

const rawSlides = computed(() => (Array.isArray(props.slides) ? props.slides : []).filter(Boolean));

/* ✅ Inserta 1 slide solo-en-mobile al inicio SOLO cuando xs */
const slidesSafe = computed(() => {
  const base = rawSlides.value.length ? rawSlides.value : FALLBACK_SLIDES;

  if (xs.value) {
    return MOBILE_ONLY_SLIDES; // ✅ SOLO estos 2 en mobile
  }

  return base;
});



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
    // ✅ cuando cambia modo (desktop<->mobile), volvemos al primer slide
    idx.value = 0;
  }
);

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
    if (w > 0 && h > 0) {
      ratios.value = { ...ratios.value, [key]: w / h };
    }
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

  const fallback = mode === "m" ? 1.6 : 4.0;
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
}

/* tapa hairline del header */
.ml-hero::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 3px;
  background: #1488d1;
  z-index: 2;
  pointer-events: none;
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
}

.ml-window :deep(.v-window__container),
.ml-window :deep(.v-window-item),
.ml-window :deep(.v-window-item__content) {
  height: 100% !important;
  min-height: 0 !important;
}

/* =========================
   SLIDE (Desktop)
   ========================= */
.ml-slide {
  position: relative;
  width: 100%;
  height: 420px;
  cursor: pointer;
  background: transparent;
  overflow: hidden;
}

/* =========================
   IMAGEN
   ========================= */
.ml-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: none;
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
   FLECHAS ML (hover desktop)
   ========================= */
.ml-mlarrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 92px;
  border: 0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
  z-index: 20;
  display: grid;
  place-items: center;
  border-radius: 999px;

  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 160ms ease, transform 160ms ease, visibility 0ms linear 160ms;
}

.ml-mlarrow.left {
  left: -18px;
  padding-left: 18px;
  transform: translateY(-50%) translateX(-6px);
}

.ml-mlarrow.right {
  right: -18px;
  padding-right: 18px;
  transform: translateY(-50%) translateX(6px);
}

.ml-hero-inner:hover .ml-mlarrow,
.ml-window:hover .ml-mlarrow {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transition: opacity 160ms ease, transform 160ms ease, visibility 0ms;
}

.ml-hero-inner:hover .ml-mlarrow.left,
.ml-window:hover .ml-mlarrow.left {
  transform: translateY(-50%) translateX(0);
}

.ml-hero-inner:hover .ml-mlarrow.right,
.ml-window:hover .ml-mlarrow.right {
  transform: translateY(-50%) translateX(0);
}

.ml-mlarrow:active {
  transform: translateY(-50%) scale(0.98);
}

.ml-mlarrow-svg {
  width: 22px;
  height: 22px;
  fill: #1e6bd6;
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
   TABLET
   ========================= */
@media (max-width: 960px) {
  .ml-slide {
    height: 360px;
  }

  .ml-bg {
    transform: none;
  }

  .ml-mlarrow {
    width: 52px;
    height: 84px;
  }

  .ml-mlarrow.left {
    left: -16px;
    padding-left: 16px;
  }

  .ml-mlarrow.right {
    right: -16px;
    padding-right: 16px;
  }
}

/* =========================
   MOBILE
   ✅ 4:5 REAL (1080x1350)
   ✅ SIN VH (no se va a la mierda de alto)
   ========================= */
@media (max-width: 600px) {
  .ml-slide {
    height: auto;          /* ✅ que lo defina el ratio */
    aspect-ratio: 4 / 5;   /* ✅ 1080x1350 */
    max-height: 560px;     /* ✅ “tope” suave (ajustable) */
  }

  .ml-bg {
    object-fit: cover;
    object-position: center;
    transform: none;
  }

  .ml-mlarrow {
    display: none;
  }
}
</style>
