<!-- Bloque "Oferta del día" + carrusel "Ofertas" — promos definidas desde backoffice -->
<template>
  <section class="fob-wrap" v-if="bestOffer || sideOffers.length">
    <!-- =================== DESKTOP =================== -->
    <section class="fob" v-if="!isMobile">
      <!-- IZQUIERDA: oferta del día (usa ProductCard para heredar
           badges PROMO/KIT/descuento, botón favorito y mismo look) -->
      <article v-if="bestOffer" class="fob-hero">
        <header class="fob-head">
          <h3 class="fob-title">Oferta del día</h3>
        </header>

        <div class="fob-hero-card">
          <ProductCard :p="bestOffer" />
        </div>
      </article>

      <!-- DERECHA: carrusel de ofertas -->
      <article class="fob-side" v-if="sideOffers.length">
        <header class="fob-head fob-head--row">
          <div class="fob-head-left">
            <h3 class="fob-title">Ofertas</h3>
            <button type="button" class="fob-link" @click="$emit('seeAll')">Mostrar todas las ofertas</button>
          </div>

          <div class="fob-dots" v-if="pagesCount > 1">
            <button
              v-for="i in pagesCount"
              :key="i"
              class="fob-dot"
              :class="{ active: i - 1 === pageIndex }"
              type="button"
              :aria-label="`Ir a página ${i}`"
              @click="goPage(i - 1)"
            />
          </div>
        </header>

        <div class="fob-rail-wrap">
          <button
            type="button"
            class="fob-arrow fob-arrow--prev"
            :class="{ 'is-disabled': !canPrev }"
            :disabled="!canPrev"
            aria-label="Ofertas anteriores"
            @click="prev"
          >
            <v-icon size="28">mdi-chevron-left</v-icon>
          </button>

          <div ref="railRef" class="fob-rail" @scroll.passive="onScroll">
            <div
              v-for="p in sideOffers"
              :key="p.product_id ?? p.id"
              class="fob-cell"
            >
              <ProductCard :p="p" />
            </div>
          </div>

          <button
            type="button"
            class="fob-arrow fob-arrow--next"
            :class="{ 'is-disabled': !canNext }"
            :disabled="!canNext"
            aria-label="Más ofertas"
            @click="next"
          >
            <v-icon size="28">mdi-chevron-right</v-icon>
          </button>
        </div>
      </article>
    </section>

    <!-- =================== MOBILE =================== -->
    <!-- Carrusel común y corriente, alineado con el resto del shop -->
    <section class="fob-m" v-else>
      <header class="fob-m-head">
        <h3 class="fob-m-title">Ofertas</h3>
        <button type="button" class="fob-m-link" @click="$emit('seeAll')">Ver todas</button>
      </header>

      <div class="fob-m-rail">
        <div
          v-for="p in mobileOffers"
          :key="p.product_id ?? p.id"
          class="fob-m-cell"
        >
          <ProductCard :p="p" />
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { isPromoActive } from "@/modules/shop/utils/promo";
import ProductCard from "./ProductCard.vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
});

defineEmits(["seeAll"]);

const railRef = ref(null);
const scrollLeft = ref(0);
const scrollMax = ref(0);
const cardStep = ref(0);

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function priceOf(p) {
  if (isPromoActive(p) && toNum(p?.promo_price) > 0) return toNum(p.promo_price);
  if (toNum(p?.price_discount) > 0) return toNum(p.price_discount);
  if (toNum(p?.price_list) > 0) return toNum(p.price_list);
  return toNum(p?.price);
}
function oldPriceOf(p) {
  const list = toNum(p?.price_list) || toNum(p?.price);
  const cur = priceOf(p);
  return list > cur && cur > 0 ? list : 0;
}
function offPctOf(p) {
  const o = oldPriceOf(p);
  const d = priceOf(p);
  if (o <= 0 || d <= 0 || o <= d) return 0;
  return Math.round(((o - d) / o) * 100);
}

const offers = computed(() => {
  const arr = Array.isArray(props.items) ? props.items.slice() : [];
  return arr
    .filter((p) => offPctOf(p) > 0 || isPromoActive(p))
    .sort((a, b) => offPctOf(b) - offPctOf(a));
});

const bestOffer = computed(() => offers.value[0] || null);
const sideOffers = computed(() => offers.value.slice(1, 25));

/* breakpoint mobile (≤ 720px) — carrusel simple sin tratamiento promo */
const MOBILE_BP = 720;
const isMobile = ref(typeof window !== "undefined" ? window.innerWidth <= MOBILE_BP : false);
function onResize() {
  if (typeof window !== "undefined") isMobile.value = window.innerWidth <= MOBILE_BP;
}

/* en mobile incluimos la oferta del día dentro del carrusel para no
   duplicar tratamientos visuales */
const mobileOffers = computed(() => offers.value.slice(0, 25));

/* rail navigation */
function measure() {
  const el = railRef.value;
  if (!el) return;
  const cell = el.querySelector(".fob-cell");
  const gap = parseFloat(getComputedStyle(el).columnGap || "12") || 12;
  const cellW = cell ? cell.getBoundingClientRect().width : 240;
  cardStep.value = cellW + gap;
  scrollMax.value = el.scrollWidth - el.clientWidth;
  scrollLeft.value = el.scrollLeft;
}

function onScroll() {
  const el = railRef.value;
  if (!el) return;
  scrollLeft.value = el.scrollLeft;
  scrollMax.value = el.scrollWidth - el.clientWidth;
}

function visibleCount() {
  const el = railRef.value;
  if (!el || !cardStep.value) return 1;
  return Math.max(1, Math.floor(el.clientWidth / cardStep.value));
}

function next() {
  const el = railRef.value;
  if (!el) return;
  const step = cardStep.value * visibleCount();
  el.scrollBy({ left: step, behavior: "smooth" });
}

function prev() {
  const el = railRef.value;
  if (!el) return;
  const step = cardStep.value * visibleCount();
  el.scrollBy({ left: -step, behavior: "smooth" });
}

const pagesCount = computed(() => {
  const total = sideOffers.value.length;
  const v = Math.max(1, visibleCount());
  return Math.max(1, Math.ceil(total / v));
});

const pageIndex = computed(() => {
  if (!cardStep.value) return 0;
  const v = Math.max(1, visibleCount());
  const pageW = cardStep.value * v;
  if (pageW <= 0) return 0;
  return Math.min(pagesCount.value - 1, Math.round(scrollLeft.value / pageW));
});

function goPage(idx) {
  const el = railRef.value;
  if (!el) return;
  const v = Math.max(1, visibleCount());
  const pageW = cardStep.value * v;
  el.scrollTo({ left: pageW * idx, behavior: "smooth" });
}

const canPrev = computed(() => scrollLeft.value > 4);
const canNext = computed(() => {
  // Caso normal: mediciones ya disponibles
  if (scrollMax.value > 0) return scrollLeft.value < scrollMax.value - 4;
  // Fallback en el primer render (antes de que termine el layout):
  // si hay más items de los que entran visualmente, mostramos la flecha
  // así el usuario percibe que hay más para ver desde el inicio.
  if (cardStep.value > 0 && railRef.value) {
    const fits = Math.max(1, Math.floor(railRef.value.clientWidth / cardStep.value));
    return sideOffers.value.length > fits;
  }
  return sideOffers.value.length > 4;
});

let ro = null;
onMounted(async () => {
  await nextTick();
  measure();
  // re-medir después del primer paint para capturar scrollWidth real
  // (imágenes lazy, fonts, etc. pueden alterar el layout inicial)
  requestAnimationFrame(() => measure());
  if (typeof ResizeObserver !== "undefined" && railRef.value) {
    ro = new ResizeObserver(() => measure());
    ro.observe(railRef.value);
  }
  window.addEventListener("resize", measure);
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", measure);
  window.removeEventListener("resize", onResize);
  if (ro) ro.disconnect();
});
</script>

<style scoped>
/* Wrapper transparente — el bloque hereda el bg del contenedor padre.
   La diferenciación promo se da por la interacción (carousel, dots,
   arrows) y los precios destacados, no por un "envoltorio" llamativo. */
.fob-wrap {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  position: relative;
}
.fob-wrap *,
.fob-wrap :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.fob {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
}

/* contenedor general (cards) */
.fob-hero,
.fob-side {
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.fob-side {
  position: relative;
  min-width: 0;
}

/* contenedor del ProductCard dentro del hero — le da el ancho completo
   y deja que el card herede toda su estética (badges, fav, layout) */
.fob-hero-card {
  display: flex;
  flex: 1 1 auto;
}
.fob-hero-card :deep(.mlx) {
  width: 100%;
  height: 100%;
}

/* heads */
.fob-head {
  margin-bottom: 12px;
}
.fob-head--row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.fob-head-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.fob-title {
  font-size: 18px;
  font-weight: 540;
  letter-spacing: -0.01em;
  color: rgba(17, 24, 39, 0.92);
  margin: 0;
}

.fob-link {
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  font-size: 13px;
  font-weight: 460;
  color: rgba(21, 101, 192, 0.95);
  transition: color 0.16s ease;
}
.fob-link:hover {
  color: rgba(21, 101, 192, 1);
  text-decoration: underline;
}

/* dots */
.fob-dots {
  display: inline-flex;
  gap: 6px;
}
.fob-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.16);
  border: 0;
  padding: 0;
  cursor: pointer;
  transition: background 0.16s ease, transform 0.16s ease;
}
.fob-dot:hover {
  background: rgba(15, 23, 42, 0.3);
}
.fob-dot.active {
  background: rgba(21, 101, 192, 0.95);
  transform: scale(1.1);
}

/* rail / cards */
.fob-rail-wrap {
  position: relative;
  display: flex;
  align-items: stretch;
  min-width: 0;
  flex: 1 1 auto;
}

.fob-rail {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 4px 2px 6px;
  width: 100%;
}
.fob-rail::-webkit-scrollbar {
  display: none;
}

/* celda contenedora del rail desktop — define el ancho de cada
   ProductCard. 4 cards visibles en pantallas grandes. */
.fob-cell {
  flex: 0 0 calc((100% - 12px * 3) / 4);
  min-width: 0;
  scroll-snap-align: start;
  display: flex;
}
.fob-cell :deep(.mlx) {
  width: 100%;
  height: 100%;
}

/* ────── Flechas — mismo estilo que ShopProductBlock (círculo blanco
   grande con icon en color primary, estilo ML) ────── */
.fob-arrow {
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
.fob-arrow--prev { left: -28px; }
.fob-arrow--next { right: -28px; }
.fob-arrow:hover {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.22);
  transform: translateY(-50%) scale(1.04);
}
.fob-arrow:active { transform: translateY(-50%) scale(0.94); }
.fob-arrow.is-disabled,
.fob-arrow:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* responsive */
@media (max-width: 1200px) {
  .fob-cell {
    flex-basis: calc((100% - 12px * 2) / 3);
  }
}

@media (max-width: 960px) {
  .fob {
    grid-template-columns: 1fr;
  }
  .fob-cell {
    flex-basis: calc((100% - 12px) / 2);
  }
  /* las flechas se acercan al borde del card cuando hay menos espacio */
  .fob-arrow--prev { left: -18px; }
  .fob-arrow--next { right: -18px; }
}

/* =====================================================================
   MOBILE (≤ 720px): se renderiza como UN bloque más del home, con la
   misma estética de card-wrapper que ShopProductBlock (fondo blanco,
   borde sutil, padding, shadow). La oferta del día entra como una
   card más dentro del rail.
   ===================================================================== */
.fob-m {
  background: #fff;
  border-radius: 12px;
  padding: 16px 14px 14px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}
.fob-m-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 12px;
}
.fob-m-title {
  font-size: 17px;
  font-weight: 540;
  letter-spacing: -0.015em;
  color: #1a1a1a;
  line-height: 1.2;
  margin: 0;
}
.fob-m-link {
  background: transparent;
  border: 0;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.7);
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.14s, color 0.14s;
}
.fob-m-link:hover,
.fob-m-link:active {
  color: rgb(var(--v-theme-primary));
  background: rgba(20, 136, 209, 0.08);
}

.fob-m-rail {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding: 2px 2px 6px;
  /* margin negativo para que las cards "respiren" hasta el borde
     interno del wrapper sin romper el padding visual */
  margin: 0 -2px;
  -webkit-overflow-scrolling: touch;
}
.fob-m-rail::-webkit-scrollbar {
  display: none;
}

.fob-m-cell {
  flex: 0 0 46%;
  max-width: 240px;
  scroll-snap-align: start;
  display: flex;
}
.fob-m-cell :deep(.mlx) {
  width: 100%;
}

@media (max-width: 420px) {
  .fob-m-cell {
    flex-basis: 56%;
  }
}

</style>
