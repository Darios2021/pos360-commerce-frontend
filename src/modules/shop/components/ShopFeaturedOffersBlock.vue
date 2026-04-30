<!-- Bloque "Oferta del día" + carrusel "Ofertas" estilo Mercado Libre -->
<template>
  <section class="fob" v-if="bestOffer || sideOffers.length">
    <!-- IZQUIERDA: oferta del día -->
    <article v-if="bestOffer" class="fob-hero" @click="goProduct(bestOffer)">
      <header class="fob-head">
        <h3 class="fob-title">Oferta del día</h3>
      </header>

      <div class="fob-hero-media">
        <img v-if="imgFor(bestOffer)" :src="imgFor(bestOffer)" :alt="bestOffer.name || ''" loading="lazy" />
        <div v-else class="fob-empty">Sin imagen</div>
      </div>

      <div class="fob-hero-body">
        <div class="fob-name" :title="bestOffer.name">{{ bestOffer.name }}</div>

        <div v-if="oldPriceOf(bestOffer)" class="fob-old">$ {{ fmt(oldPriceOf(bestOffer)) }}</div>

        <div class="fob-price-row">
          <span class="fob-price">$ {{ fmt(priceOf(bestOffer)) }}</span>
          <span v-if="offPctOf(bestOffer)" class="fob-off">{{ offPctOf(bestOffer) }}% OFF</span>
        </div>

        <div v-if="installmentsTextOf(bestOffer)" class="fob-meta">
          {{ installmentsTextOf(bestOffer) }}
        </div>

        <div v-if="hasFreeShipping(bestOffer)" class="fob-ship">Envío gratis</div>
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
          v-show="canPrev"
          type="button"
          class="fob-arrow fob-arrow--prev"
          aria-label="Ofertas anteriores"
          @click="prev"
        >
          <v-icon size="22">mdi-chevron-left</v-icon>
        </button>

        <div ref="railRef" class="fob-rail" @scroll.passive="onScroll">
          <div
            v-for="p in sideOffers"
            :key="p.product_id ?? p.id"
            class="fob-card"
            @click="goProduct(p)"
          >
            <div class="fob-card-media">
              <img v-if="imgFor(p)" :src="imgFor(p)" :alt="p.name || ''" loading="lazy" />
              <div v-else class="fob-empty">Sin imagen</div>
            </div>

            <div class="fob-card-body">
              <div class="fob-card-name" :title="p.name">{{ p.name }}</div>

              <div v-if="oldPriceOf(p)" class="fob-old">$ {{ fmt(oldPriceOf(p)) }}</div>

              <div class="fob-price-row">
                <span class="fob-price fob-price--sm">$ {{ fmt(priceOf(p)) }}</span>
                <span v-if="offPctOf(p)" class="fob-off fob-off--sm">{{ offPctOf(p) }}% OFF</span>
              </div>

              <div v-if="installmentsTextOf(p)" class="fob-meta">
                {{ installmentsTextOf(p) }}
              </div>

              <div class="fob-foot-row">
                <span v-if="hasFreeShipping(p)" class="fob-ship">Envío gratis</span>
                <span v-if="hasFullShipping(p)" class="fob-full">FULL</span>
              </div>
            </div>
          </div>
        </div>

        <button
          v-show="canNext"
          type="button"
          class="fob-arrow fob-arrow--next"
          aria-label="Más ofertas"
          @click="next"
        >
          <v-icon size="22">mdi-chevron-right</v-icon>
        </button>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { isPromoActive } from "@/modules/shop/utils/promo";
import { buildProductLocation } from "@/modules/shop/utils/productSlug";

const props = defineProps({
  items: { type: Array, default: () => [] },
});

defineEmits(["seeAll"]);

const router = useRouter();
const route = useRoute();

const railRef = ref(null);
const scrollLeft = ref(0);
const scrollMax = ref(0);
const cardStep = ref(0);

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function fmt(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

function imgFor(p) {
  return String(p?.image_url || p?.image || "").trim();
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
function installmentsTextOf(p) {
  const max = Number(p?.max_installments || p?.installments_max || 0);
  const base = priceOf(p);
  if (base >= 150000) {
    return `Mismo precio en cuotas de $ ${fmt(base / 3)}`;
  }
  if (max >= 2 && max <= 24) {
    return `Hasta ${max} cuotas`;
  }
  return "";
}
function hasFreeShipping(p) {
  return Boolean(p?.free_shipping || p?.shipping_free || p?.is_free_shipping || p?.is_full || p?.full || p?.shipping_full);
}
function hasFullShipping(p) {
  return Boolean(p?.is_full || p?.full || p?.shipping_full);
}

const offers = computed(() => {
  const arr = Array.isArray(props.items) ? props.items.slice() : [];
  return arr
    .filter((p) => offPctOf(p) > 0 || isPromoActive(p))
    .sort((a, b) => offPctOf(b) - offPctOf(a));
});

const bestOffer = computed(() => offers.value[0] || null);
const sideOffers = computed(() => offers.value.slice(1, 25));

function goProduct(p) {
  const loc = buildProductLocation(p, {
    branchId: route.query.branch_id ? String(route.query.branch_id) : "3",
  });
  if (loc) router.push(loc);
}

/* rail navigation */
function measure() {
  const el = railRef.value;
  if (!el) return;
  const card = el.querySelector(".fob-card");
  const gap = parseFloat(getComputedStyle(el).columnGap || "12") || 12;
  const cardW = card ? card.getBoundingClientRect().width : 240;
  cardStep.value = cardW + gap;
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
const canNext = computed(() => scrollLeft.value < scrollMax.value - 4);

let ro = null;
onMounted(async () => {
  await nextTick();
  measure();
  if (typeof ResizeObserver !== "undefined" && railRef.value) {
    ro = new ResizeObserver(() => measure());
    ro.observe(railRef.value);
  }
  window.addEventListener("resize", measure);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", measure);
  if (ro) ro.disconnect();
});
</script>

<style scoped>
.fob {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.fob *,
.fob :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
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

.fob-hero {
  cursor: pointer;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease;
}
.fob-hero:hover {
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
  transform: translateY(-1px);
  border-color: rgba(15, 23, 42, 0.1);
}

.fob-side {
  position: relative;
  min-width: 0;
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

/* hero (oferta del día) */
.fob-hero-media {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 12px;
  padding: 8px;
  min-height: 280px;
  max-height: 320px;
}
.fob-hero-media img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  display: block;
}
.fob-empty {
  font-size: 12px;
  color: rgba(15, 23, 42, 0.4);
  padding: 28px 0;
}

.fob-hero-body {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.fob-name {
  font-size: 14px;
  font-weight: 420;
  color: rgba(17, 24, 39, 0.86);
  line-height: 1.32;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}

.fob-old {
  font-size: 12.5px;
  color: rgba(15, 23, 42, 0.42);
  text-decoration: line-through;
  line-height: 1;
}

.fob-price-row {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.fob-price {
  font-size: 26px;
  font-weight: 460;
  color: rgba(17, 24, 39, 0.94);
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.fob-price--sm {
  font-size: 19px;
}
.fob-off {
  font-size: 12px;
  font-weight: 500;
  color: rgb(0, 153, 102);
  letter-spacing: 0.01em;
}
.fob-off--sm {
  font-size: 11.5px;
}

.fob-meta {
  font-size: 12.5px;
  color: rgb(0, 153, 102);
  font-weight: 460;
}

.fob-ship {
  font-size: 12.5px;
  color: rgb(0, 153, 102);
  font-weight: 500;
}

.fob-full {
  display: inline-block;
  background: rgb(0, 153, 102);
  color: #fff;
  font-size: 10px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.04em;
  line-height: 1.5;
}

.fob-foot-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-height: 18px;
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

.fob-card {
  flex: 0 0 calc((100% - 12px * 3) / 4);
  min-width: 0;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  padding: 8px 6px 10px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.fob-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.fob-card-media {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}
.fob-card-media img {
  max-width: 92%;
  max-height: 168px;
  object-fit: contain;
  display: block;
}

.fob-card-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.fob-card-name {
  font-size: 13px;
  font-weight: 420;
  color: rgba(17, 24, 39, 0.82);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 33px;
  margin-bottom: 2px;
}

/* arrows flotantes (estilo ML) */
.fob-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(21, 101, 192, 0.95);
  z-index: 2;
  transition: background 0.16s ease, transform 0.16s ease;
}
.fob-arrow:hover {
  background: rgb(245, 247, 250);
  transform: translateY(-50%) scale(1.05);
}
.fob-arrow--prev {
  left: -14px;
}
.fob-arrow--next {
  right: -14px;
}

/* responsive */
@media (max-width: 1200px) {
  .fob-card {
    flex-basis: calc((100% - 12px * 2) / 3);
  }
}

@media (max-width: 960px) {
  .fob {
    grid-template-columns: 1fr;
  }
  .fob-card {
    flex-basis: calc((100% - 12px) / 2);
  }
  .fob-arrow--prev { left: -8px; }
  .fob-arrow--next { right: -8px; }
}

@media (max-width: 600px) {
  .fob-hero,
  .fob-side {
    padding: 14px;
    border-radius: 14px;
  }
  .fob-hero-media {
    min-height: 220px;
  }
  .fob-hero-media img {
    max-height: 220px;
  }
  .fob-price {
    font-size: 22px;
  }
  .fob-card {
    flex-basis: 70%;
  }
  .fob-arrow {
    display: none;
  }
}
</style>
