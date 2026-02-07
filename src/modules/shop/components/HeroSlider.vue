<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/HeroSlider.vue -->
<template>
  <section class="ml-hero">
    <div class="ml-hero-inner">
      <v-window v-model="idx" class="ml-window" :show-arrows="false" :touch="true">
        <v-window-item v-for="(s, i) in slidesSafe" :key="i">
          <div class="ml-slide" @click="emitClick(s)">
            <img class="ml-bg" :src="getSlideImage(s)" :alt="s.title || 'slide'" />
            <div v-if="showOverlay" class="ml-overlay" />

            <div v-if="showText" class="ml-content">
              <div class="ml-pill" v-if="s.pill">{{ s.pill }}</div>
              <h1 class="ml-title">{{ s.title || "" }}</h1>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";

const router = useRouter();

/* ✅ CLAVE: SOLO XS usa mobileImage (no smAndDown) */
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

/* fallback */
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

/* ✅ Desktop SIEMPRE image, Mobile SOLO XS usa imageMobile */
function getSlideImage(slide) {
  const base = slide?.image || "";
  const mobile = slide?.imageMobile || slide?.mobileImage || "";
  return xs.value ? mobile || base : base;
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
/* full-bleed */
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

/* vuetify window */
.ml-window {
  width: 100%;
  overflow: hidden;
  border-radius: 0 0 22px 22px;
  position: relative;
  display: block;
}

/* Vuetify internals: evitamos alto extra */
.ml-window :deep(.v-window__container),
.ml-window :deep(.v-window-item),
.ml-window :deep(.v-window-item__content) {
  height: 100% !important;
  min-height: 0 !important;
}

/* slide */
.ml-slide {
  position: relative;
  width: 100%;
  height: 380px;
  cursor: pointer;

  /* ✅ NO agregamos relleno/colores en los costados */
  background: transparent;
}

/* ✅ Imagen sin zoom artificial, full-bleed */
.ml-bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;      /* ✅ llena sin “bandas” */
  object-position: center;
  transform: none;        /* ✅ nada de scale */
}

/* overlay opcional */
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

/* contenido (si se usa) */
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

/* flechas ML */
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
  z-index: 6;
  display: grid;
  place-items: center;
  border-radius: 999px;
}
.ml-mlarrow.left {
  left: -18px;
  padding-left: 18px;
}
.ml-mlarrow.right {
  right: -18px;
  padding-right: 18px;
}
.ml-mlarrow-svg {
  width: 22px;
  height: 22px;
  fill: #1e6bd6;
}

/* dots */
.ml-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 12px;
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
  transition: width 0.15s ease, background 0.15s ease;
}
.ml-dot.active {
  width: 20px;
  background: rgba(255, 255, 255, 0.95);
}

/* responsive */
@media (max-width: 960px) {
  .ml-slide {
    height: 330px;
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

@media (max-width: 600px) {
  .ml-slide {
    height: 300px;
  }
  .ml-mlarrow {
    width: 48px;
    height: 78px;
  }
  .ml-mlarrow.left {
    left: -14px;
    padding-left: 14px;
  }
  .ml-mlarrow.right {
    right: -14px;
    padding-right: 14px;
  }
}
</style>
