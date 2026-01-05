<!-- src/modules/shop/components/HeroSlider.vue -->
<template>
  <section class="ml-hero">
    <div class="ml-hero-inner">
      <v-window v-model="idx" class="ml-window" :show-arrows="false" :touch="true">
        <v-window-item v-for="(s, i) in slidesSafe" :key="i">
          <div class="ml-slide" @click="emitClick(s)">
            <img class="ml-bg" :src="s.image" :alt="s.title || 'slide'" />
            <div class="ml-overlay" />

            <div class="ml-content">
              <div class="ml-pill" v-if="s.pill">{{ s.pill }}</div>

              <h1 class="ml-title">{{ s.title || "" }}</h1>

              <p class="ml-subtitle" v-if="s.subtitle">
                {{ s.subtitle }}
              </p>

              <div class="ml-actions">
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

      <!-- ✅ Flechas ML -->
      <button
        v-if="slidesSafe.length > 1"
        class="ml-arrow left"
        type="button"
        aria-label="Anterior"
        @click.stop="prev"
      >
        <svg class="ml-arrow-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M14.7 5.3a1 1 0 0 1 0 1.4L10.41 11l4.29 4.3a1 1 0 1 1-1.4 1.4l-5-5a1 1 0 0 1 0-1.4l5-5a1 1 0 0 1 1.4 0Z"
          />
        </svg>
      </button>

      <button
        v-if="slidesSafe.length > 1"
        class="ml-arrow right"
        type="button"
        aria-label="Siguiente"
        @click.stop="next"
      >
        <svg class="ml-arrow-svg" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9.3 18.7a1 1 0 0 1 0-1.4L13.59 13 9.3 8.7a1 1 0 1 1 1.4-1.4l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4 0Z"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const props = defineProps({
  slides: { type: Array, default: () => [] },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 6500 },
  branchId: { type: [Number, String], default: 3 }, // ✅ por si querés cambiarlo luego
});

const emit = defineEmits(["goShop", "clickSlide"]);

/* =========================================
   Rutas reales (como venís usando)
   ========================================= */
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
    query: {
      branch_id: String(props.branchId),
      page: "1",
      ...(q ? { q: String(q) } : {}),
    },
  });
}

/* =========================================
   Slides fallback (6) con CTA reales
   ========================================= */
const FALLBACK_SLIDES = [
  {
    pill: "NOVEDADES",
    title: "Gadgets y accesorios\nnuevos",
    subtitle: "Descubrí productos recién ingresados en el catálogo.",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=2400&q=80",
    primaryCta: "Ver más",
    secondaryCta: "Ir al catálogo",
    primaryAction: { type: "shop" }, // usa emit goShop si querés
    secondaryAction: { type: "shop" },
  },
  {
    pill: "AUDIO",
    title: "Parlantes, auriculares\ny micrófonos",
    subtitle: "Equipá tu setup con lo mejor en sonido.",
    image: "https://images.unsplash.com/photo-1518441902117-f0aee7d1b04c?auto=format&fit=crop&w=2400&q=80",
    primaryCta: "Ver audio",
    secondaryCta: "Ir al catálogo",
    primaryAction: { type: "category", cat: 2, sub: null, q: "AUDIO" },
    secondaryAction: { type: "shop" },
  },
  {
    pill: "SEGURIDAD",
    title: "Cámaras y monitoreo",
    subtitle: "Armá tu sistema de seguridad con instalación simple.",
    image: "https://images.unsplash.com/photo-1580894894513-541e068a3d6b?auto=format&fit=crop&w=2400&q=80",
    primaryCta: "Ver cámaras",
    secondaryCta: "Ir al catálogo",
    primaryAction: { type: "category", cat: 11, sub: 58, q: "CAMARAS" },
    secondaryAction: { type: "shop" },
  },
  {
    pill: "ELECTRO",
    title: "Accesorios\npara el hogar",
    subtitle: "Productos útiles para el día a día.",
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=2400&q=80",
    primaryCta: "Ver electro",
    secondaryCta: "Ir al catálogo",
    primaryAction: { type: "category", cat: 7, sub: 38, q: "ELECTRO" },
    secondaryAction: { type: "shop" },
  },
  {
    pill: "CELULARES",
    title: "Teléfonos y\naccesorios",
    subtitle: "Fundas, cargadores, power banks y más.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=2400&q=80",
    primaryCta: "Ver teléfonos",
    secondaryCta: "Ir al catálogo",
    // ✅ si todavía no tenés cat/sub para teléfonos, al menos busca por q
    primaryAction: { type: "search", q: "TELEFONOS" },
    secondaryAction: { type: "shop" },
  },
  {
    pill: "ENVÍOS",
    title: "Comprá online",
    subtitle: "Buscá productos, agregalos al carrito y elegí sucursal al finalizar.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=2400&q=80",
    primaryCta: "Empezar",
    secondaryCta: "Catálogo",
    primaryAction: { type: "shop" },
    secondaryAction: { type: "shop" },
  },
];

const rawSlides = computed(() => (Array.isArray(props.slides) ? props.slides : []).filter(Boolean));

const slidesSafe = computed(() => {
  const s = rawSlides.value;
  if (s.length >= 6) return s;
  const filled = [...s];
  for (let i = filled.length; i < 6; i++) filled.push(FALLBACK_SLIDES[i]);
  return filled;
});

const idx = ref(0);

watch(
  () => slidesSafe.value.length,
  (n) => {
    if (idx.value >= n) idx.value = 0;
  }
);

function emitClick(slide) {
  emit("clickSlide", slide);
}

/* ✅ acciones reales */
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
  // default
  emit("goShop");
}

function goPrimary(slide) {
  runAction(slide?.primaryAction);
}
function goSecondary(slide) {
  runAction(slide?.secondaryAction);
}

/* arrows */
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
/* =========================================================
   ✅ FIX DEFINITIVO "línea blanca":
   - el hero se monta 1px arriba
   - pseudo-elemento tapa hairline residual
   ========================================================= */
.ml-hero {
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);

  position: relative;
  z-index: 1;

  /* ✅ se monta encima del borde inferior del header */
  top: -1px;
}

/* tapa cualquier pixel residual del borde/padding del header o del v-main */
.ml-hero::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;

  /* ✅ 3px por si el “hairline” es más visible en algunos zooms */
  height: 3px;

  /* lo mismo que el header */
  background: #1488d1;
  z-index: 2;
  pointer-events: none;
}

/* Window */
.ml-window {
  width: 100%;
  overflow: hidden;
  border-radius: 0 0 22px 22px;
}

/* Slide */
.ml-slide {
  position: relative;
  width: 100%;
  height: 620px;
  cursor: pointer;
}

/* Background */
.ml-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;

  /* micro zoom para evitar bordes/blancos por scaling */
  transform: scale(1.03);
}

/* Overlay */
.ml-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(1300px 620px at 22% 52%, rgba(0, 0, 0, 0.60) 0%, rgba(0, 0, 0, 0.18) 56%, rgba(0, 0, 0, 0.06) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.48) 0%, rgba(0, 0, 0, 0.14) 54%, rgba(0, 0, 0, 0.05) 100%);
}

/* contenido (safe area para flechas) */
.ml-content {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  color: #fff;

  left: clamp(76px, 6.2vw, 110px);
  right: clamp(76px, 6.2vw, 110px);

  max-width: 860px;
}

.ml-pill {
  display: inline-flex;
  align-items: center;
  padding: 7px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.20);
  font-weight: 900;
  letter-spacing: 0.5px;
  margin-bottom: 14px;
  text-transform: uppercase;
  font-size: 12px;
}

.ml-title {
  white-space: pre-line;
  font-size: clamp(36px, 4.9vw, 66px);
  line-height: 1.02;
  font-weight: 1000;
  margin: 0 0 10px 0;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.ml-subtitle {
  margin: 0 0 18px 0;
  font-size: 16px;
  line-height: 1.4;
  opacity: 0.95;
  max-width: 680px;
}

.ml-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ml-cta {
  border: 0;
  cursor: pointer;
  font-weight: 1000;
  border-radius: 10px;
  padding: 11px 18px;
  line-height: 1;
  user-select: none;
}

.ml-cta.primary {
  background: #1488d1;
  color: #fff;
  box-shadow: 0 16px 26px rgba(0, 0, 0, 0.22);
}

.ml-cta.ghost {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

/* Flechas ML */
.ml-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 64px;
  height: 64px;
  border-radius: 999px;
  border: 2px solid rgba(20, 136, 209, 0.55);
  cursor: pointer;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.14);
  display: grid;
  place-items: center;
  z-index: 6;
}

.ml-arrow.left {
  left: 16px;
}
.ml-arrow.right {
  right: 16px;
}

.ml-arrow-svg {
  width: 26px;
  height: 26px;
  fill: #1488d1;
}

/* Dots */
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
  width: 7px;
  height: 7px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.45);
  transition: width 0.15s ease, background 0.15s ease;
}
.ml-dot.active {
  width: 22px;
  background: rgba(255, 255, 255, 0.95);
}

/* Responsive */
@media (max-width: 960px) {
  .ml-slide {
    height: 470px;
  }
  .ml-window {
    border-radius: 0 0 18px 18px;
  }
  .ml-arrow {
    width: 58px;
    height: 58px;
  }
  .ml-arrow-svg {
    width: 24px;
    height: 24px;
  }
  .ml-content {
    left: 64px;
    right: 64px;
  }
}

@media (max-width: 600px) {
  .ml-slide {
    height: 400px;
  }
  .ml-subtitle {
    font-size: 14px;
  }
  .ml-arrow {
    width: 54px;
    height: 54px;
  }
  .ml-content {
    left: 54px;
    right: 54px;
  }
}
</style>
