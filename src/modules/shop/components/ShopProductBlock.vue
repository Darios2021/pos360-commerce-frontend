<!--
  ShopProductBlock — Bloque de productos con carousel horizontal estilo ML.
  Props:
    title:    string    — Título del bloque ("Inspirado en lo último que viste")
    items:    Array     — Productos a mostrar
    pageSize: Number?   — Cuántos por slide (default 6 en desktop, auto en mobile)

  Usa ProductCard para mantener el mismo estilo del catálogo.
-->
<template>
  <section v-if="items?.length" class="spb">
    <!-- Header: icono + título + subtítulo + (Ver todo / dots) -->
    <header class="spb-head">
      <div class="spb-head__left">
        <img v-if="iconUrl" :src="iconUrl" :alt="title" class="spb-icon" />
        <v-icon v-else-if="icon" size="22" class="spb-icon spb-icon--mdi">{{ icon }}</v-icon>
        <div class="spb-head__text">
          <h2 class="spb-title">{{ title }}</h2>
          <div v-if="subtitle" class="spb-subtitle">{{ subtitle }}</div>
        </div>
      </div>

      <div class="spb-head__right">
        <component
          v-if="viewAllTo"
          :is="typeof viewAllTo === 'string' ? 'a' : 'router-link'"
          :to="typeof viewAllTo === 'object' ? viewAllTo : undefined"
          :href="typeof viewAllTo === 'string' ? viewAllTo : undefined"
          class="spb-view-all"
        >
          Ver todo
          <v-icon size="16">mdi-chevron-right</v-icon>
        </component>
        <div v-else-if="pages > 1" class="spb-dots" aria-hidden="true">
          <span
            v-for="i in pages"
            :key="i"
            class="spb-dot"
            :class="{ 'is-active': i - 1 === activePage }"
          />
        </div>
      </div>
    </header>

    <!-- Track del carousel -->
    <div class="spb-stage">
      <button
        type="button"
        class="spb-arrow spb-arrow--left"
        :class="{ 'is-disabled': !canPrev }"
        :disabled="!canPrev"
        aria-label="Anterior"
        @click="prev"
      >
        <v-icon size="28">mdi-chevron-left</v-icon>
      </button>

      <div ref="viewportRef" class="spb-viewport">
        <div class="spb-track" :style="trackStyle">
          <div v-for="p in items" :key="p.product_id || p.id" class="spb-cell">
            <ProductCard :p="p" />
          </div>
        </div>
      </div>

      <button
        type="button"
        class="spb-arrow spb-arrow--right"
        :class="{ 'is-disabled': !canNext }"
        :disabled="!canNext"
        aria-label="Siguiente"
        @click="next"
      >
        <v-icon size="28">mdi-chevron-right</v-icon>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, nextTick } from "vue";
import ProductCard from "./ProductCard.vue";

const props = defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: "" },
  icon:     { type: String, default: "" },         // mdi-* opcional
  iconUrl:  { type: String, default: "" },         // url de imagen opcional
  viewAllTo:{ type: [String, Object], default: null }, // path o RouterLocation
  items:    { type: Array,  default: () => [] },
  pageSize: { type: Number, default: 6 },
});

const viewportRef = ref(null);
const index = ref(0);
const visibleCount = ref(props.pageSize);

function measure() {
  const vp = viewportRef.value;
  if (!vp) return;
  const w = window.innerWidth;
  if (w >= 1280) visibleCount.value = props.pageSize;
  else if (w >= 1024) visibleCount.value = Math.min(5, props.pageSize);
  else if (w >= 768) visibleCount.value = 4;
  else if (w >= 560) visibleCount.value = 3;
  else visibleCount.value = 2;
  if (index.value > maxIndex.value) index.value = maxIndex.value;
}

const maxIndex = computed(() => Math.max(0, props.items.length - visibleCount.value));
const canPrev = computed(() => index.value > 0);
const canNext = computed(() => index.value < maxIndex.value);

const pages = computed(() => {
  const total = props.items.length;
  const per = visibleCount.value || 1;
  return Math.max(1, Math.ceil(total / per));
});
const activePage = computed(() => {
  const per = visibleCount.value || 1;
  return Math.min(pages.value - 1, Math.floor(index.value / per));
});

const trackStyle = computed(() => {
  const cellPct = 100 / Math.max(1, visibleCount.value);
  const x = -index.value * cellPct;
  return {
    transform: `translate3d(${x}%, 0, 0)`,
    "--spb-cell-w": `${cellPct}%`,
  };
});

function prev() {
  index.value = Math.max(0, index.value - visibleCount.value);
}
function next() {
  index.value = Math.min(maxIndex.value, index.value + visibleCount.value);
}

let resizeTimer = null;
function onResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => measure(), 80);
}

onMounted(async () => {
  await nextTick();
  measure();
  window.addEventListener("resize", onResize, { passive: true });
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
  clearTimeout(resizeTimer);
});
</script>

<style scoped>
/* ────── Bloque-card contenedor ────── */
.spb {
  background: #fff;
  border-radius: 12px;
  padding: 18px 20px 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* ────── Header ────── */
.spb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.spb-head__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}
.spb-head__right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.spb-head__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.spb-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}
.spb-icon--mdi {
  width: auto;
  height: auto;
  background: transparent;
  color: rgb(var(--v-theme-primary));
}
.spb-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.015em;
  color: #1a1a1a;
  line-height: 1.2;
  margin: 0;
}
.spb-subtitle {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.2;
  margin-top: 2px;
}

/* "Ver todo ›" — link tonal sutil */
.spb-view-all {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.7);
  text-decoration: none;
  transition: background 0.14s, color 0.14s;
}
.spb-view-all:hover {
  color: rgb(var(--v-theme-primary));
  background: rgba(20, 136, 209, 0.08);
}

/* Dots */
.spb-dots {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.spb-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.18);
  transition: background 0.18s, transform 0.18s;
}
.spb-dot.is-active {
  background: rgb(var(--v-theme-primary));
  transform: scale(1.15);
}

/* ────── Stage (track + flechas) ────── */
.spb-stage {
  position: relative;
}
.spb-viewport {
  overflow: hidden;
  margin: 0 -2px;
}
.spb-track {
  display: flex;
  will-change: transform;
  transition: transform 0.32s cubic-bezier(0.22, 0.7, 0.32, 1);
}
.spb-cell {
  flex: 0 0 var(--spb-cell-w, 16.6667%);
  width: var(--spb-cell-w, 16.6667%);
  padding: 0 6px;
  box-sizing: border-box;
  min-width: 0;
}
.spb-cell :deep(.mlx) {
  height: 100%;
}

/* ────── Flechas — círculo blanco grande con icon celeste (estilo ML) ────── */
.spb-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
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
  transition: background 0.15s, color 0.15s, opacity 0.15s, transform 0.15s, box-shadow 0.15s;
}
.spb-arrow--left { left: -28px; }
.spb-arrow--right { right: -28px; }
.spb-arrow:hover {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  transform: translateY(-50%) scale(1.04);
}
.spb-arrow:active { transform: translateY(-50%) scale(0.94); }
.spb-arrow.is-disabled,
.spb-arrow:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* ────── Mobile ────── */
@media (max-width: 600px) {
  .spb {
    padding: 14px 12px 16px;
    border-radius: 10px;
  }
  .spb-title { font-size: 15px; }
  .spb-arrow { display: none; }       /* en mobile usamos swipe natural */
  .spb-viewport {
    overflow-x: auto;
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }
  .spb-viewport::-webkit-scrollbar { display: none; }
  .spb-track {
    transition: none;
    transform: none !important;
  }
  .spb-cell {
    scroll-snap-align: start;
  }
}
</style>
