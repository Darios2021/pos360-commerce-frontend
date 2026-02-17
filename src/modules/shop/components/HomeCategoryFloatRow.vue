<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/HomeCategoryFloatRow.vue -->
<template>
  <div class="float-row">
    <div class="float-inner">
      <div class="wrap">
        <!-- =========================
             MOBILE/TABLET: ML BUBBLES
             ========================= -->
        <div v-if="isMobile" class="ml-bubbles" ref="bubblesEl" aria-label="Accesos rápidos">
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
            <span class="ml-bubble-label">{{ c.shortLabel || c.name }}</span>
          </button>
        </div>

        <!-- =========================
             DESKTOP: CARDS
             ========================= -->
        <div v-else class="cards-wrap">
          <div
            ref="viewportEl"
            class="viewport"
            :style="viewportStyle"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
            @pointerleave="onPointerUp"
          >
            <div ref="trackEl" class="track" :style="trackStyle">
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

          <!-- ✅ Flechas + dots SOLO si hay scroll -->
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

const props = defineProps({
  categories: { type: Array, default: () => [] },
  max: { type: Number, default: 6 },
});

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
  "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1400&q=80";

const IMG_SUB = {
  parlantes: "https://storage-files.cingulado.org/pos360/products/17/1766780472298-78438395.jpeg",
  auriculares: "https://storage-files.cingulado.org/pos360/products/54/1766788849600-3802f99d.jpeg",
  microfonos: "https://storage-files.cingulado.org/pos360/products/28/1766786438106-89dda16c.jpeg",
  electro: "https://storage-files.cingulado.org/pos360/products/68/1766793570645-acbcae20.jpg",
};

const STOCK = {
  camaras: "https://storage-files.cingulado.org/pos360/products/156/1767564820325-624a77bd.jpg",
};

/* =========================
   ✅ IDS REALES
   - URL FINAL: /shop/c/:cat?branch_id=3&page=1&sub=:sub
   - ✅ SIN category_id
   ========================= */
const FIXED_ROUTE = {
  parlantes: { cat: 2, sub: 7, q: "PARLANTES" },
  auriculares: { cat: 2, sub: 3, q: null },
  microfonos: { cat: 2, sub: 11, q: null },
  electro: { cat: 7, sub: 16, q: null },
  camaras: { cat: 11, sub: 23, q: "CAMARAS" },
};

/* =========================
   Featured (con labels cortos mobile)
   ========================= */
const featured = computed(() => [
  { key: "parlantes", name: "PARLANTES", shortLabel: "Parlantes", img: IMG_SUB.parlantes || FALLBACK },
  { key: "auriculares", name: "AURICULARES", shortLabel: "Auriculares", img: IMG_SUB.auriculares || FALLBACK },
  { key: "microfonos", name: "MICROFONOS", shortLabel: "Micrófonos", img: IMG_SUB.microfonos || FALLBACK },
  { key: "electro", name: "ELECTRO", shortLabel: "Electro", img: IMG_SUB.electro || FALLBACK },
  { key: "camaras", name: "CAMARAS DE SEGURIDAD", shortLabel: "Cámaras", img: STOCK.camaras || FALLBACK },
]);

/* =========================
   Navegación
   ========================= */
function go(item) {
  const fixed = FIXED_ROUTE[item?.key] || null;
  if (!fixed?.cat) {
    router.push({ path: "/shop", query: { q: item?.name || "" } });
    return;
  }

  const branch_id = String(route.query.branch_id || "3");

  const query = {
    branch_id,
    page: "1",
    ...(fixed.sub ? { sub: String(fixed.sub) } : {}),
    ...(fixed.q ? { q: String(fixed.q) } : {}),
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
   Desktop slider (cards)
   ========================= */
const viewportEl = ref(null);
const trackEl = ref(null);
const bubblesEl = ref(null);

const index = ref(0);
const cardW = ref(210);
const gap = ref(16);
const visibleCount = ref(1);

const viewportMaxPx = ref(null);
const viewportStyle = computed(() => {
  return viewportMaxPx.value ? { maxWidth: `${viewportMaxPx.value}px`, margin: "0 auto" } : { maxWidth: "100%" };
});

const maxIndex = computed(() => Math.max(0, featured.value.length - visibleCount.value));

function measure() {
  const vp = viewportEl.value;
  if (!vp) return;

  const w = window.innerWidth;
  cardW.value = w <= 1200 ? 200 : 210;
  gap.value = 16;

  const available = vp.parentElement?.clientWidth || vp.clientWidth || 1;
  const count = Math.max(1, Math.floor((available + gap.value) / (cardW.value + gap.value)));
  visibleCount.value = count;

  const exact = count * cardW.value + (count - 1) * gap.value;
  viewportMaxPx.value = Math.min(exact, available);

  if (index.value > maxIndex.value) index.value = maxIndex.value;
}

const trackStyle = computed(() => {
  const step = cardW.value + gap.value;
  const x = -index.value * step;
  return { transform: `translate3d(${x}px, 0, 0)` };
});

function next() {
  index.value = Math.min(maxIndex.value, index.value + 1);
}
function prev() {
  index.value = Math.max(0, index.value - 1);
}

/* Drag */
let dragging = false;
let moved = false;
let startX = 0;
let startIndex = 0;
let pointerId = null;
const DRAG_THRESHOLD_PX = 6;

function onPointerDown(e) {
  if (e.button !== 0) return;
  if (maxIndex.value <= 0) return; // ✅ si no hay scroll, no hay drag
  if (e.target?.closest?.(".card")) return;

  dragging = true;
  moved = false;
  startX = e.clientX;
  startIndex = index.value;
  pointerId = e.pointerId;

  try {
    e.currentTarget.setPointerCapture(e.pointerId);
  } catch {}
}

function onPointerMove(e) {
  if (!dragging) return;

  const dx = e.clientX - startX;
  if (!moved && Math.abs(dx) >= DRAG_THRESHOLD_PX) moved = true;
  if (!moved) return;

  const step = cardW.value + gap.value;
  const delta = Math.round(-dx / step);
  const target = startIndex + delta;
  index.value = Math.max(0, Math.min(maxIndex.value, target));
}

function onPointerUp(e) {
  if (!dragging) return;
  dragging = false;

  try {
    if (pointerId != null) e.currentTarget?.releasePointerCapture?.(pointerId);
  } catch {}

  pointerId = null;
}

onMounted(async () => {
  await nextTick();
  index.value = 0;
  if (!isMobile.value) measure();
  window.addEventListener("resize", onWinResize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onWinResize);
});

watch(
  () => props.categories,
  async () => {
    await nextTick();
    index.value = 0;
    if (!isMobile.value) measure();
  },
  { deep: true }
);

watch(
  () => isMobile.value,
  async (m) => {
    await nextTick();
    index.value = 0;
    if (!m) measure();
  }
);
</script>

<style scoped>
/* =========================
   WRAPPER
========================= */
.float-row {
  width: 100%;
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 20;
  pointer-events: auto;
  margin-top: 14px;
}
@media (min-width: 901px) {
  .float-row {
    margin-top: 34px;
  }
}

.float-inner {
  width: min(var(--shop-max, 1200px), calc(100% - 24px));
  margin: 0 auto;
  pointer-events: auto;
}

.wrap {
  position: relative;
  width: 100%;
  padding-bottom: 10px;
}

/* =========================
   MOBILE: ML BUBBLES
========================= */
.ml-bubbles {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 8px 4px 10px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  scroll-snap-type: x mandatory;
}
.ml-bubbles::-webkit-scrollbar {
  display: none;
}

.ml-bubble {
  flex: 0 0 auto;
  width: 82px;                 /* ✅ ML: angosto */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  scroll-snap-align: start;
  -webkit-tap-highlight-color: transparent;
}

.ml-bubble-avatar {
  width: 54px;                 /* ✅ ML: círculo chico */
  height: 54px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid #e6e6e6;
  overflow: hidden;
  display: grid;
  place-items: center;
}

.ml-bubble-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ml-bubble-label {
  width: 100%;
  text-align: center;
  font-size: 12px;
  line-height: 1.05;
  font-weight: 500;            /* ✅ ML: nada de bold pesado */
  color: #7a7a7a;              /* ✅ ML: gris */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* =========================
   DESKTOP: CARDS
========================= */
.cards-wrap {
  position: relative;
  pointer-events: auto;
}

.viewport {
  overflow: hidden;
  padding: 0;
  border-radius: 0;
  touch-action: pan-y;
}

.track {
  display: flex;
  gap: 16px;
  will-change: transform;
  transition: transform 180ms ease;
}

/* Card ML (limpio) */
.card {
  flex: 0 0 auto;
  width: 210px;
  height: 280px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #e6e6e6;
  background: #fff;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0;
  box-shadow: none;
  transition: border-color 0.12s ease;
}
@media (hover: hover) {
  .card:hover {
    border-color: #d4d4d4;
  }
}

.head {
  padding: 10px 12px 8px;
  min-height: 48px;
  display: flex;
  align-items: center;
}

.title {
  width: 100%;
  font-weight: 700;
  font-size: 14px;
  text-transform: uppercase;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
  color: #333;
}

.media {
  height: 130px;
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
  padding: 8px 12px;
  border-radius: 6px;
  background: #e7f0ff;
  color: #2968c8;
  font-weight: 600;
  font-size: 13px;
}

/* Flechas (solo si hay scroll) */
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 1px solid #e6e6e6;
  cursor: pointer;
  background: #fff;
  font-size: 22px;
  font-weight: 600;
  line-height: 1;
  display: grid;
  place-items: center;
  z-index: 2;
}
.arrow:disabled {
  opacity: 0.45;
  cursor: default;
}
.arrow.left {
  left: 8px;
}
.arrow.right {
  right: 8px;
}

/* Dots */
.dots {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding-top: 8px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: #d0d0d0;
}
.dot.active {
  background: #2968c8;
}

@media (max-width: 1200px) {
  .card {
    width: 200px;
  }
}
</style>
