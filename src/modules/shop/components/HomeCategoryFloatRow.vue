<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/HomeCategoryFloatRow.vue -->
<template>
  <div class="float-row">
    <div class="float-inner">
      <div class="wrap">
        <!-- =========================
             MOBILE/TABLET: bubbles (NO TOCAR)
        ========================== -->
        <div v-if="isMobile" class="ml-bubbles" aria-label="Accesos rápidos">
          <button
            v-for="c in featured"
            :key="c.key"
            class="ml-bubble"
            type="button"
            @click.stop="go(c)"
            :title="c.name"
          >
            <span class="ml-bubble-avatar" aria-hidden="true">
              <img :src="c.img" :alt="c.name" @error="onImgError" loading="lazy" />
            </span>
            <span class="ml-bubble-label">{{ c.shortLabel }}</span>
          </button>
        </div>

        <!-- =========================
             DESKTOP: cards + flechas ML
        ========================== -->
        <div v-else class="cards-wrap">
          <div ref="viewportEl" class="viewport" :style="viewportStyle">
            <div class="track" :style="trackStyle">
              <button
                v-for="c in featured"
                :key="c.key"
                class="card"
                type="button"
                @click.stop="go(c)"
                :title="c.name"
              >
                <div class="head">
                  <div class="title">{{ c.name }}</div>
                </div>

                <div class="media">
                  <img :src="c.img" :alt="c.name" @error="onImgError" loading="lazy" />
                </div>

                <div class="body">
                  <div class="desc">Explorá subrubros y productos de {{ c.name }}.</div>
                  <span class="cta">Ver productos</span>
                </div>
              </button>
            </div>
          </div>

          <!-- ✅ Flechas + dots SOLO si hay overflow real -->
          <template v-if="maxIndex > 0">
            <button class="arrow left" type="button" aria-label="Anterior" @click="prev" :disabled="index <= 0">
              ‹
            </button>
            <button
              class="arrow right"
              type="button"
              aria-label="Siguiente"
              @click="next"
              :disabled="index >= maxIndex"
            >
              ›
            </button>

            <div class="dots">
              <span v-for="i in maxIndex + 1" :key="i" class="dot" :class="{ active: i - 1 === index }" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

/* =========================
   Responsive
========================= */
const winW = ref(typeof window !== "undefined" ? window.innerWidth : 9999);
const isMobile = computed(() => winW.value <= 900);

function onWinResize() {
  winW.value = window.innerWidth;
  if (!isMobile.value) measure();
}

/* =========================
   Imágenes
========================= */
const FALLBACK =
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop";

const IMG_SUB = {
  parlantes: "https://storage-files.cingulado.org/pos360/products/17/1766780472298-78438395.jpeg",
  auriculares: "https://storage-files.cingulado.org/pos360/products/54/1766788849600-3802f99d.jpeg",
  microfonos: "https://storage-files.cingulado.org/pos360/products/28/1766786438106-89dda16c.jpeg",
  electro: "https://storage-files.cingulado.org/pos360/products/68/1766793570645-acbcae20.jpg",
  camaras: "https://storage-files.cingulado.org/pos360/products/156/1767564820325-624a77bd.jpg",

  // ✅ NUEVAS (si querés después las cambiamos por URLs reales de tus productos)
  telefonos: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
  led: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1200&auto=format&fit=crop",
};

/* =========================
   Rutas limpias (sin category_id, sin subcategory_id)
========================= */
const FIXED_ROUTE = {
  parlantes: { cat: 2, sub: 7 },
  auriculares: { cat: 2, sub: 3 },
  microfonos: { cat: 2, sub: 11 },
  electro: { cat: 7, sub: 16 },
  camaras: { cat: 11, sub: 23 },

  // ✅ según tus URLs
  telefonos: { cat: 53, sub: null }, // /shop/c/53?page=1
  led: { cat: 8, sub: 25 },          // /shop/c/8?sub=25&page=1
};

/* =========================
   Featured
========================= */
const featured = computed(() => [
  { key: "parlantes", name: "PARLANTES", shortLabel: "Parlantes", img: IMG_SUB.parlantes || FALLBACK },
  { key: "auriculares", name: "AURICULARES", shortLabel: "Auriculares", img: IMG_SUB.auriculares || FALLBACK },
  { key: "microfonos", name: "MICRÓFONOS", shortLabel: "Micrófonos", img: IMG_SUB.microfonos || FALLBACK },
  { key: "electro", name: "ELECTRO", shortLabel: "Electro", img: IMG_SUB.electro || FALLBACK },
  { key: "camaras", name: "CÁMARAS", shortLabel: "Cámaras", img: IMG_SUB.camaras || FALLBACK },
  { key: "telefonos", name: "TELÉFONOS", shortLabel: "Teléfonos", img: IMG_SUB.telefonos || FALLBACK },
  { key: "led", name: "ILUMINACIÓN LED", shortLabel: "LED", img: IMG_SUB.led || FALLBACK },
]);

function go(item) {
  const fixed = FIXED_ROUTE[item.key];
  const branch_id = String(route.query.branch_id || "3");

  const query = {
    branch_id,
    page: "1",
    ...(fixed.sub ? { sub: String(fixed.sub) } : {}),
  };

  router.push({
    path: `/shop/c/${String(fixed.cat)}`,
    query,
  });
}

function onImgError(e) {
  const el = e?.target;
  if (el && el.tagName === "IMG") el.src = FALLBACK;
}

/* =========================
   Desktop slider (✅ bien medido)
========================= */
const viewportEl = ref(null);
const index = ref(0);

const cardW = ref(196);
const gap = ref(16);
const visibleCount = ref(1);
const viewportMaxPx = ref(null);

/**
 * ✅ CLAVE ML:
 * limitamos el viewport para que no entren “todas” las cards en desktop gigante,
 * así se genera overflow real y aparecen flechas.
 */
const viewportStyle = computed(() => {
  return viewportMaxPx.value
    ? { maxWidth: `${viewportMaxPx.value}px`, margin: "0 auto" }
    : { maxWidth: "100%" };
});

const maxIndex = computed(() => Math.max(0, featured.value.length - visibleCount.value));

function measure() {
  const vp = viewportEl.value;
  if (!vp) return;

  const w = window.innerWidth;
  cardW.value = w <= 1200 ? 190 : 196;
  gap.value = 16;

  const available = vp.parentElement?.clientWidth || vp.clientWidth || 1;

  // ✅ ML feel: no “full bleed”, tope 1180
  const hardMax = Math.min(available, 1180);

  const count = Math.max(1, Math.floor((hardMax + gap.value) / (cardW.value + gap.value)));
  visibleCount.value = count;

  const exact = count * cardW.value + (count - 1) * gap.value;
  viewportMaxPx.value = Math.min(exact, hardMax);

  if (index.value > maxIndex.value) index.value = maxIndex.value;
}

const trackStyle = computed(() => {
  const step = cardW.value + gap.value;
  const x = -index.value * step;
  return { transform: `translate3d(${x}px,0,0)` };
});

function next() {
  index.value = Math.min(maxIndex.value, index.value + 1);
}
function prev() {
  index.value = Math.max(0, index.value - 1);
}

onMounted(async () => {
  await nextTick();
  winW.value = window.innerWidth;
  index.value = 0;
  if (!isMobile.value) measure();
  window.addEventListener("resize", onWinResize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onWinResize);
});

watch(
  () => isMobile.value,
  async (m) => {
    await nextTick();
    index.value = 0;
    if (!m) measure();
  }
);

watch(
  () => featured.value.length,
  async () => {
    await nextTick();
    index.value = 0;
    if (!isMobile.value) measure();
  }
);
</script>

<style scoped>
/* Wrapper */
.float-row {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
.float-inner {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
}
.wrap {
  position: relative;
}

/* MOBILE bubbles — círculos más grandes, anillo celeste (stories style) */
.ml-bubbles {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px 6px 14px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
}
.ml-bubbles::-webkit-scrollbar { display: none; }

.ml-bubble {
  flex: 0 0 auto;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  scroll-snap-align: start;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.12s ease;
}
.ml-bubble:active { transform: scale(0.94); }

/* Anillo color brand del header + avatar interno */
.ml-bubble-avatar {
  position: relative;
  flex-shrink: 0;
  width: 68px;
  height: 68px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  overflow: hidden;
  box-shadow: 0 4px 12px -6px rgba(0, 0, 0, 0.18);
  box-sizing: border-box;
}
.ml-bubble-avatar img {
  position: absolute;
  top: 2.5px;
  left: 2.5px;
  width: calc(100% - 5px);
  height: calc(100% - 5px);
  border-radius: 999px;
  object-fit: cover;
  display: block;
  background: #fff;
}

.ml-bubble-label {
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.15;
  font-weight: 600;
  color: #111;
  letter-spacing: -0.005em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* DESKTOP cards */
.cards-wrap {
  position: relative;
}
.viewport {
  overflow: hidden; /* ✅ oculta el track fuera del viewport */
}
.track {
  display: flex;
  gap: 16px;
  will-change: transform;
  transition: transform 180ms ease;
}

/* Card */
.card {
  flex: 0 0 auto;
  width: 196px;
  height: 252px;
  border-radius: 10px;
  border: 1px solid #e6e6e6;
  background: #fff;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  box-shadow: none;
  transition: border-color 0.12s ease, transform 0.12s ease;
}
@media (hover: hover) {
  .card:hover {
    border-color: #d4d4d4;
    transform: translateY(-1px);
  }
}

.head {
  padding: 10px 12px 8px;
  min-height: 44px;
  display: flex;
  align-items: center;
}
.title {
  font-size: 13px;
  font-weight: 400;
  text-transform: uppercase;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.media {
  height: 112px;
  background: #f5f5f5;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}
.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.body {
  padding: 10px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  justify-content: space-between;
}
.desc {
  font-size: 12px;
  color: #666;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cta {
  display: inline-flex;
  width: fit-content;
  padding: 7px 11px;
  border-radius: 6px;
  background: #e7f0ff;
  color: #2968c8;
  font-weight: 400;
  font-size: 12px;
}

/* Flechas ML (✅ ahora no desaparecen cuando hay overflow real) */
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid #e6e6e6;
  background: rgba(255, 255, 255, 0.96);
  font-size: 24px;
  font-weight: 400;
  line-height: 1;
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.12);
}
.arrow:disabled {
  opacity: 0.45;
  cursor: default;
  box-shadow: none;
}
.arrow.left {
  left: -10px;
}
.arrow.right {
  right: -10px;
}

/* Dots */
.dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding-top: 10px;
}
.dot {
  width: 6px;
  height: 6px;
  background: #d0d0d0;
  border-radius: 999px;
}
.dot.active {
  background: #2968c8;
}

@media (max-width: 1200px) {
  .card {
    width: 190px;
  }
}
</style>
