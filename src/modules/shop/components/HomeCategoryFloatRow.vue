<template>
  <div class="float-row">
    <div class="float-inner">
      <div class="wrap">
        <!-- =========================
             MOBILE/TABLET: BUBBLES
             ========================= -->
        <div v-if="isMobile" class="bubbles" ref="bubblesEl" aria-label="Accesos rápidos">
          <button
            v-for="c in featured"
            :key="c.key"
            class="bubble"
            type="button"
            @click.stop="go(c)"
            :title="c.name"
          >
            <span class="ring">
              <span class="avatar">
                <img :src="c.img" :alt="c.name" @error="onImgError" loading="lazy" />
              </span>
            </span>
            <span class="label">{{ c.name }}</span>
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

          <!-- Flechas -->
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

          <!-- Dots -->
          <div class="dots" v-if="maxIndex > 0">
            <span v-for="i in maxIndex + 1" :key="i" class="dot" :class="{ active: i - 1 === index }" />
          </div>
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
   ✅ IDS REALES (LOS QUE ME PASASTE)
   - URL FINAL: /shop/c/:cat?branch_id=3&page=1&sub=:sub
   - ✅ SIN category_id
   - q es opcional (solo lo usamos donde pediste)
   ========================= */
const FIXED_ROUTE = {
  // AUDIO
  parlantes: { cat: 2, sub: 7, q: "PARLANTES" },
  auriculares: { cat: 2, sub: 3, q: null },   // https://sanjuantecnologia.com/shop/c/2?branch_id=3&page=1&sub=3
  microfonos: { cat: 2, sub: 11, q: null },   // https://sanjuantecnologia.com/shop/c/2?branch_id=3&page=1&sub=11

  // ELECTRO
  electro: { cat: 7, sub: 16, q: null },      // https://sanjuantecnologia.com/shop/c/7?branch_id=3&page=1&sub=16

  // CÁMARAS
  camaras: { cat: 11, sub: 23, q: "CAMARAS" }, // querías q=CAMARAS pero SIN category_id
};

const featured = computed(() => [
  { key: "parlantes", name: "PARLANTES", img: IMG_SUB.parlantes || FALLBACK },
  { key: "auriculares", name: "AURICULARES", img: IMG_SUB.auriculares || FALLBACK },
  { key: "microfonos", name: "MICROFONOS", img: IMG_SUB.microfonos || FALLBACK },
  { key: "electro", name: "ELECTRO", img: IMG_SUB.electro || FALLBACK },
  { key: "camaras", name: "CAMARAS DE SEGURIDAD", img: STOCK.camaras || FALLBACK },
]);

/* =========================
   ✅ Navegación: LINKS CORRECTOS
   ========================= */
function go(item) {
  const fixed = FIXED_ROUTE[item?.key] || null;
  if (!fixed?.cat) {
    router.push({ path: "/shop", query: { q: item?.name || "" } });
    return;
  }

  const branch_id = String(route.query.branch_id || "3");

  // ✅ query limpio, SIN category_id
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
const gap = ref(14);
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
  gap.value = 14;

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

/* Drag FIX */
let dragging = false;
let moved = false;
let startX = 0;
let startIndex = 0;
let pointerId = null;
const DRAG_THRESHOLD_PX = 6;

function onPointerDown(e) {
  if (e.button !== 0) return;
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

/* lifecycle */
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
  padding-bottom: 14px;
}

/* MOBILE: BUBBLES */
.bubbles {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 6px 4px 10px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  touch-action: pan-x pan-y;
  overscroll-behavior-x: contain;
  overscroll-behavior-y: auto;
}
.bubbles::-webkit-scrollbar {
  display: none;
}

.bubble {
  flex: 0 0 auto;
  width: 110px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
  scroll-snap-align: start;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

.ring {
  width: 74px;
  height: 74px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(20, 136, 209, 0.22), rgba(7, 28, 48, 0.14));
  display: grid;
  place-items: center;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: #fff;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.85);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.label {
  width: 100%;
  text-align: center;
  font-weight: 900;
  font-size: 11px;
  line-height: 1.1;
  text-transform: uppercase;
  color: rgba(7, 28, 48, 0.96);
  text-shadow: none;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(7, 28, 48, 0.1);
  border-radius: 10px;
  padding: 4px 6px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* DESKTOP: CARDS */
.cards-wrap {
  position: relative;
  pointer-events: auto;
}

.viewport {
  overflow: hidden;
  border-radius: 12px;
  padding: 0 6px 10px;
  touch-action: pan-y;
  pointer-events: auto;
}

.track {
  display: flex;
  gap: 14px;
  will-change: transform;
  transition: transform 180ms ease;
  pointer-events: auto;
}

.card {
  flex: 0 0 auto;
  width: 210px;
  height: 280px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  display: flex;
  flex-direction: column;
  text-align: left;
  padding: 0;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
@media (hover: hover) {
  .card:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.14);
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
  font-weight: 900;
  font-size: 15px;
  text-transform: uppercase;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.1;
}

.media {
  height: 130px;
  background: #f2f2f2;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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
  gap: 10px;
  flex: 1;
  justify-content: space-between;
}
.desc {
  font-size: 12.5px;
  color: rgba(0, 0, 0, 0.72);
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cta {
  display: inline-flex;
  width: fit-content;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(45, 108, 223, 0.12);
  color: #2d6cdf;
  font-weight: 900;
}

/* Flechas */
.arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.14);
  font-size: 28px;
  font-weight: 900;
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
  left: 10px;
}
.arrow.right {
  right: 10px;
}

/* Dots */
.dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 10px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
}
.dot.active {
  background: #2d6cdf;
}

@media (max-width: 1200px) {
  .card {
    width: 200px;
  }
}
</style>
