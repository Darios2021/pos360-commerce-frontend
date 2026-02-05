<!-- src/modules/shop/components/ProductCardSubcategory.vue -->
<template>
  <v-card class="ml-card" variant="flat" rounded="xl">
    <!-- MEDIA -->
    <div
      class="ml-media"
      @click="openProduct"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <img
        v-if="currentImg"
        :src="currentImg"
        alt=""
        loading="lazy"
        draggable="false"
      />
      <div v-else class="ml-media-empty">Sin imagen</div>

      <!-- Flechas -->
      <button
        v-if="imgs.length > 1"
        class="nav nav-left"
        type="button"
        @click.stop="prev"
        aria-label="Anterior"
      >
        ‹
      </button>

      <button
        v-if="imgs.length > 1"
        class="nav nav-right"
        type="button"
        @click.stop="next"
        aria-label="Siguiente"
      >
        ›
      </button>

      <!-- Dots -->
      <div v-if="imgs.length > 1" class="dots">
        <span
          v-for="(x, i) in imgs"
          :key="i"
          :class="{ active: i === idx }"
        />
      </div>
    </div>

    <!-- BODY -->
    <div class="ml-body">
      <div class="ml-price-row">
        <div class="ml-price">$ {{ fmtMoney(finalPrice) }}</div>
        <div class="ml-off" v-if="offPct">{{ offPct }}% OFF</div>
      </div>

      <div v-if="showOldPrice" class="ml-old">
        $ {{ fmtMoney(oldPrice) }}
      </div>

      <div class="ml-title" :title="p?.name">
        {{ p?.name }}
      </div>

      <div class="ml-meta">
        {{ metaText }}
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";

const props = defineProps({
  p: { type: Object, required: true },
});

const router = useRouter();
const route = useRoute();

/* ======================
   IMÁGENES
====================== */
const imgs = computed(() => {
  if (Array.isArray(props.p?.image_urls) && props.p.image_urls.length) {
    return props.p.image_urls.filter(Boolean);
  }
  if (props.p?.image_url) return [props.p.image_url];
  return [];
});

const idx = ref(0);

const currentImg = computed(() => imgs.value[idx.value] || "");

function prev() {
  idx.value = (idx.value - 1 + imgs.value.length) % imgs.value.length;
}
function next() {
  idx.value = (idx.value + 1) % imgs.value.length;
}

/* swipe mobile */
let startX = null;
function onTouchStart(e) {
  startX = e.changedTouches?.[0]?.clientX ?? null;
}
function onTouchEnd(e) {
  if (startX == null) return;
  const endX = e.changedTouches?.[0]?.clientX ?? null;
  if (endX == null) return;
  const dx = endX - startX;
  startX = null;
  if (Math.abs(dx) < 40) return;
  dx > 0 ? prev() : next();
}

/* ======================
   PRECIOS
====================== */
function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

const finalPrice = computed(() => {
  const d = toNum(props.p?.price_discount);
  if (d > 0) return d;
  return toNum(props.p?.price_list || props.p?.price);
});

const oldPrice = computed(() => {
  return toNum(props.p?.price_list || props.p?.price);
});

const showOldPrice = computed(() => {
  return oldPrice.value > finalPrice.value;
});

const offPct = computed(() => {
  if (!showOldPrice.value) return 0;
  return Math.round(((oldPrice.value - finalPrice.value) / oldPrice.value) * 100);
});

const metaText = computed(() => {
  const c = props.p?.category_name;
  const s = props.p?.subcategory_name;
  return [c, s].filter(Boolean).join(" · ");
});

/* ======================
   NAV
====================== */
function openProduct() {
  const branch_id = route.query.branch_id || "3";
  router.push({
    name: "shopProduct",
    params: { id: String(props.p?.product_id || props.p?.id) },
    query: { branch_id },
  });
}
</script>

<style scoped>
.ml-card {
  background: #fff;
  border: 1px solid rgba(0,0,0,.08);
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  overflow: hidden;
}

.ml-media {
  position: relative;
  height: 180px;
  background: #f4f4f4;
  cursor: pointer;
}

.ml-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
}

.ml-media-empty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 12px;
  opacity: .6;
}

/* Flechas */
.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(0,0,0,.15);
  font-size: 20px;
  font-weight: 900;
  display: grid;
  place-items: center;
  cursor: pointer;
}
.nav-left { left: 8px; }
.nav-right { right: 8px; }

/* Dots */
.dots {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 6px;
}
.dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,.6);
}
.dots span.active {
  background: #1976d2;
}

/* BODY */
.ml-body {
  padding: 12px 14px 14px;
}
.ml-price-row {
  display: flex;
  justify-content: space-between;
}
.ml-price {
  font-size: 20px;
  font-weight: 900;
}
.ml-off {
  font-size: 11px;
  font-weight: 900;
  color: #00a650;
}
.ml-old {
  font-size: 12px;
  opacity: .6;
  text-decoration: line-through;
}
.ml-title {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}
.ml-meta {
  font-size: 11px;
  opacity: .6;
  text-transform: uppercase;
}
</style>
