<!-- src/modules/shop/components/PromoSlider.vue -->
<template>
  <section class="promo-shell" ref="shell">
    <div class="promo-inner">
      <!-- Header -->
      <div class="promo-head">
        <div class="promo-head-left">
          <div class="promo-title">Productos en promoción</div>
          <div class="promo-sub">Recomendados y ofertas destacadas</div>
        </div>
      </div>

      <v-divider class="promo-divider" />

      <!-- Slider -->
      <div class="promo-body">
        <v-slide-group
          ref="sg"
          v-model="model"
          show-arrows
          class="promo-slide"
          :mandatory="false"
        >
          <v-slide-group-item
            v-for="(p, idx) in items"
            :key="p.product_id ?? p.id ?? idx"
            :value="idx"
          >
            <div class="promo-item">
              <button class="promo-card" type="button" @click="open(p)">
                <div class="promo-img">
                  <img :src="p.image_url" alt="" />
                  <div v-if="badgeText(p)" class="promo-badge">
                    {{ badgeText(p) }}
                  </div>
                </div>

                <div class="promo-info">
                  <div class="promo-price-row">
                    <div class="promo-price">$ {{ fmtMoney(finalPrice(p)) }}</div>
                    <div class="promo-off" v-if="offPct(p)">
                      {{ offPct(p) }}% OFF
                    </div>
                  </div>

                  <div v-if="showOldPrice(p)" class="promo-old">
                    $ {{ fmtMoney(oldPrice(p)) }}
                  </div>

                  <div class="promo-name">
                    {{ p.name }}
                  </div>

                  <div class="promo-meta">
                    {{ p.category_name || "—" }}
                    <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                  </div>

                  <div class="promo-free" v-if="freeShip(p)">
                    Envío gratis
                  </div>
                </div>
              </button>
            </div>
          </v-slide-group-item>
        </v-slide-group>

        <!-- Puntitos (dinámicos por scroll real y centrado) -->
        <div class="promo-dots" v-if="dotsCount > 1">
          <button
            v-for="i in dotsCount"
            :key="i"
            class="dot"
            :class="{ active: i - 1 === dotIndex }"
            @click="jumpTo(i - 1)"
            type="button"
            aria-label="Ir a página"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";

const props = defineProps({
  items: { type: Array, default: () => [] },
  perPage: { type: Number, default: 5 },
});

const router = useRouter();
const model = ref(0);

const sg = ref(null);
const shell = ref(null);

let rootEl = null;
let containerEl = null;
let contentEl = null;

let rafId = 0;
let rafSizeId = 0;

const activeItemIdx = ref(0);

function open(p) {
  router.push({ name: "shopProduct", params: { id: p.product_id ?? p.id } });
}

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}
function finalPrice(p) {
  const d = toNum(p.price_discount);
  if (d > 0) return d;
  const l = toNum(p.price_list);
  if (l > 0) return l;
  return toNum(p.price);
}
function oldPrice(p) {
  const l = toNum(p.price_list);
  const base = l > 0 ? l : toNum(p.price);
  return base;
}
function showOldPrice(p) {
  const d = toNum(p.price_discount);
  const o = oldPrice(p);
  return d > 0 && o > d;
}
function offPct(p) {
  if (!showOldPrice(p)) return 0;
  const o = oldPrice(p);
  const d = toNum(p.price_discount);
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
}
function badgeText(p) {
  if (p.is_promo) return "OFERTA";
  if (toNum(p.price_discount) > 0) return "DESCUENTO";
  if (p.is_new) return "NUEVO";
  return "";
}
function freeShip(p) {
  return Boolean(p.free_shipping) || Boolean(p.is_free_shipping);
}

/* ===============================
   ✅ UTILIDADES
   =============================== */
function getPaddingPx(el, side /* 'Left'|'Right' */) {
  try {
    const cs = window.getComputedStyle(el);
    const v = parseFloat(cs[`padding${side}`] || "0");
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

function getFirstCardWidth() {
  if (!rootEl) return 0;
  const card = rootEl.querySelector(".promo-card");
  const w = card?.offsetWidth || 0;
  return Number.isFinite(w) ? w : 0;
}

/* ===============================
   ✅ CENTRADO REAL: padding lateral dinámico
   =============================== */
function applyCenterPaddingVars() {
  if (!shell.value || !containerEl) return;

  // ancho visible real del carrusel (ya contempla flechas en desktop)
  const cw = containerEl.clientWidth;

  // medimos el ancho real de una card renderizada
  const cardW = getFirstCardWidth();

  // si todavía no hay card, salimos y lo reintenta el resize/nextTick
  if (!cardW || cardW < 50) return;

  // padding para que el item pueda quedar centrado (primer/último incluidos)
  const sidePad = Math.max(0, Math.floor((cw - cardW) / 2));

  shell.value.style.setProperty("--promo-side-pad", `${sidePad}px`);
}

function scheduleApplySize() {
  if (rafSizeId) return;
  rafSizeId = requestAnimationFrame(() => {
    rafSizeId = 0;
    applyCenterPaddingVars();
    recalcActiveFromScroll(); // por si cambió el tamaño
  });
}

/* ===============================
   ✅ DOTS DINÁMICOS: por centro del viewport
   =============================== */
function recalcActiveFromScroll() {
  if (!containerEl || !contentEl) return;

  const kids = contentEl.children;
  if (!kids || !kids.length) {
    activeItemIdx.value = 0;
    return;
  }

  // punto central del viewport del carrusel
  const centerX = containerEl.scrollLeft + containerEl.clientWidth / 2;

  let bestIdx = 0;
  let bestDist = Infinity;

  for (let i = 0; i < kids.length; i++) {
    const it = kids[i];
    const itCenter = it.offsetLeft + it.offsetWidth / 2;
    const dist = Math.abs(itCenter - centerX);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  activeItemIdx.value = bestIdx;
}

function onScroll() {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    recalcActiveFromScroll();
  });
}

function centerItem(idx, behavior = "smooth") {
  if (!containerEl || !contentEl) return;

  const kids = contentEl.children;
  const it = kids?.[idx];
  if (!it) return;

  const target =
    it.offsetLeft + it.offsetWidth / 2 - containerEl.clientWidth / 2;

  containerEl.scrollTo({ left: Math.max(0, target), behavior });
}

/* ===============================
   ✅ BIND / UNBIND
   =============================== */
function bind() {
  rootEl = sg.value?.$el;
  if (!rootEl) return;

  containerEl = rootEl.querySelector(".v-slide-group__container");
  contentEl = rootEl.querySelector(".v-slide-group__content");

  if (!containerEl || !contentEl) return;

  containerEl.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", scheduleApplySize, { passive: true });

  // sizing + active
  applyCenterPaddingVars();
  recalcActiveFromScroll();
}

function unbind() {
  if (containerEl) containerEl.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", scheduleApplySize);

  if (rafId) cancelAnimationFrame(rafId);
  if (rafSizeId) cancelAnimationFrame(rafSizeId);

  rafId = 0;
  rafSizeId = 0;

  rootEl = null;
  containerEl = null;
  contentEl = null;
}

onMounted(async () => {
  await nextTick();
  bind();

  // segundo tick: asegura que ya midió bien el ancho de cards
  await nextTick();
  applyCenterPaddingVars();
  recalcActiveFromScroll();
});

onBeforeUnmount(() => {
  unbind();
});

/* ===============================
   ✅ DOTS
   =============================== */
const dotIndex = computed(() => {
  const idx = Number(activeItemIdx.value ?? 0);
  return Math.max(0, Math.floor(idx / props.perPage));
});

const dotsCount = computed(() => {
  const n = (props.items || []).length;
  if (!n) return 0;
  return Math.max(1, Math.ceil(n / props.perPage));
});

function jumpTo(pageIdx) {
  const targetItem = pageIdx * props.perPage;

  // centramos el primer item de esa "página"
  centerItem(targetItem, "smooth");

  // mantener model alineado (Vuetify) sin forzar scroll target raro
  model.value = targetItem;
  activeItemIdx.value = targetItem;
}

watch(
  () => props.items,
  async () => {
    model.value = 0;
    activeItemIdx.value = 0;

    await nextTick();
    unbind();
    await nextTick();
    bind();

    // centra el primero sin animación
    await nextTick();
    applyCenterPaddingVars();
    centerItem(0, "auto");
    recalcActiveFromScroll();
  }
);
</script>

<style scoped>
.promo-shell {
  width: 100%;
  /* padding dinámico para centrar items (se setea por JS) */
  --promo-side-pad: 18px;
}

/* permitir scroll vertical en todo el bloque */
.promo-shell,
.promo-inner,
.promo-body {
  touch-action: pan-y;
}

.promo-inner {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* header */
.promo-head {
  padding: 16px 18px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.promo-head-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.promo-title {
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.1;
}

.promo-sub {
  font-size: 12px;
  opacity: 0.72;
}

.promo-divider {
  opacity: 0.65;
}

/* body */
.promo-body {
  padding: 10px 10px 10px;
}

/* ===============================
   ✅ CARRUSEL: flechas normales + snap centrado
   =============================== */
.promo-slide {
  touch-action: pan-x pan-y;
}

/* container scrolleable */
.promo-slide :deep(.v-slide-group__container) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  touch-action: pan-x pan-y;

  /* ✅ snap al centro */
  scroll-snap-type: x mandatory;
  scroll-padding-left: var(--promo-side-pad);
  scroll-padding-right: var(--promo-side-pad);
}
.promo-slide :deep(.v-slide-group__container::-webkit-scrollbar) {
  display: none;
}

/* quitar espacios fantasmas de Vuetify */
.promo-slide :deep(.v-slide-group-item) {
  padding: 0 !important;
  margin: 0 !important;
}

/* content con padding dinámico para que el 1° y último puedan centrarse */
.promo-slide :deep(.v-slide-group__content) {
  gap: 14px;
  padding: 10px var(--promo-side-pad) 12px;
  white-space: nowrap;
}

/* cada item snap al centro */
.promo-item {
  display: inline-flex;
  scroll-snap-align: center;
  scroll-snap-stop: always;
}

/* flechas: mantenidas */
.promo-slide :deep(.v-slide-group__prev),
.promo-slide :deep(.v-slide-group__next) {
  opacity: 0.95;
}
.promo-slide :deep(.v-slide-group__prev .v-btn),
.promo-slide :deep(.v-slide-group__next .v-btn) {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
}

/* card */
.promo-card {
  width: 210px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  text-align: left;
  padding: 0;
  transition: transform 0.14s ease, box-shadow 0.14s ease, border-color 0.14s ease;
}

@media (hover: hover) and (pointer: fine) {
  .promo-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.1);
  }
}

/* imagen */
.promo-img {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f5f5f5;
}
.promo-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.promo-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 166, 80, 0.95);
  color: #fff;
  font-weight: 950;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.promo-info {
  padding: 10px 12px 12px;
}

.promo-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
}

.promo-price {
  font-size: 18px;
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.1;
  white-space: nowrap;
}

.promo-off {
  font-size: 12px;
  font-weight: 950;
  color: #00a650;
  white-space: nowrap;
}

.promo-old {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.6;
  text-decoration: line-through;
}

.promo-name {
  margin-top: 8px;
  font-weight: 850;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.promo-meta {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.7;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.promo-free {
  margin-top: 6px;
  font-size: 12px;
  font-weight: 900;
  color: #00a650;
}

/* dots */
.promo-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px 0 6px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  border: 0;
  background: rgba(0, 0, 0, 0.16);
  cursor: pointer;
  transition: transform 0.12s ease, background 0.12s ease;
}

.dot:hover {
  transform: scale(1.15);
}

.dot.active {
  background: rgba(0, 0, 0, 0.55);
}

/* MOBILE: card más grande (pero centrada) */
@media (max-width: 600px) {
  .promo-head {
    padding: 12px 14px;
  }

  .promo-title {
    font-size: 14px;
  }

  .promo-sub {
    display: none;
  }

  .promo-body {
    padding: 10px 8px 10px;
  }

  /* card ocupa más en mobile, pero siempre centrada por side-pad dinámico */
  .promo-card {
    width: min(86vw, 380px);
  }

  .promo-img {
    height: 160px;
  }

  .promo-off {
    font-size: 10px;
  }

  /* un toque más de aire */
  .promo-slide :deep(.v-slide-group__content) {
    gap: 12px;
  }
}
</style>
