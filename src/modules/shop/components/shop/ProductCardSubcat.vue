<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/shop/ProductCardSubcat.vue -->
<template>
  <v-card class="ml-card" variant="flat" rounded="xl">
    <!-- ✅ CAMBIO CLAVE: wrapper DIV (no button) para poder tener botones internos -->
    <div class="ml-media" role="button" tabindex="0" @click="openProduct" @keydown.enter.prevent="openProduct">
      <img v-if="activeImg" :src="activeImg" alt="" loading="lazy" @error="onImgErr" />
      <div v-else class="ml-media-empty">Sin imagen</div>

      <!-- Flechas: SOLO si hay +1 y NO está loading -->
      <button
        v-if="imgs.length > 1 && !loadingMedia"
        class="ml-navpill ml-nav-left"
        type="button"
        aria-label="Anterior"
        @click.stop.prevent="prevImg"
      >
        <v-icon size="24">mdi-chevron-left</v-icon>
      </button>

      <button
        v-if="imgs.length > 1 && !loadingMedia"
        class="ml-navpill ml-nav-right"
        type="button"
        aria-label="Siguiente"
        @click.stop.prevent="nextImg"
      >
        <v-icon size="24">mdi-chevron-right</v-icon>
      </button>

      <!-- Puntitos -->
      <div v-if="imgs.length > 1 && !loadingMedia" class="ml-dots" @click.stop>
        <span
          v-for="(x, i) in dotsCount"
          :key="i"
          class="ml-dot"
          :class="{ active: i === dotActive }"
        />
      </div>

      <!-- Badge descuento -->
      <div v-if="offPct" class="ml-badge">DESCUENTO</div>

      <!-- ❤️ opcional (si querés el corazon como la captura, dejalo) -->
      <button class="ml-fav" type="button" aria-label="Favorito" @click.stop.prevent="toggleFav">
        <v-icon size="18">{{ fav ? "mdi-heart" : "mdi-heart-outline" }}</v-icon>
      </button>
    </div>

    <div class="ml-body">
      <div class="ml-price-row">
        <div class="ml-price">$ {{ fmtMoney(finalPrice) }}</div>
        <div class="ml-off" v-if="offPct">{{ offPct }}% OFF</div>
      </div>

      <div v-if="showOldPrice" class="ml-old">$ {{ fmtMoney(oldPrice) }}</div>

      <div class="ml-title" :title="p?.name || ''">{{ p?.name || "—" }}</div>
      <div class="ml-meta" :title="metaText">{{ metaText }}</div>
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { getPublicProductMedia } from "@/modules/shop/service/shop.public.api";

const props = defineProps({
  p: { type: Object, required: true },
});

const router = useRouter();
const route = useRoute();

function s(x) {
  return String(x || "").trim();
}
function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

const metaText = computed(() => {
  const cat = s(props.p?.category_name);
  const sub = s(props.p?.subcategory_name);
  const parts = [];
  if (cat) parts.push(cat);
  if (sub) parts.push(sub);
  return parts.length ? parts.join(" · ") : "—";
});

const finalPrice = computed(() => {
  const d = toNum(props.p?.price_discount);
  if (d > 0) return d;
  const l = toNum(props.p?.price_list);
  if (l > 0) return l;
  return toNum(props.p?.price);
});

const oldPrice = computed(() => {
  const l = toNum(props.p?.price_list);
  const base = l > 0 ? l : toNum(props.p?.price);
  return base;
});

const showOldPrice = computed(() => {
  const d = toNum(props.p?.price_discount);
  const o = oldPrice.value;
  return d > 0 && o > d;
});

const offPct = computed(() => {
  if (!showOldPrice.value) return 0;
  const o = oldPrice.value;
  const d = toNum(props.p?.price_discount);
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
});

// =========================
// ✅ GALERÍA
// =========================
function extractLocalImgs(p) {
  const out = [];

  if (Array.isArray(p?.image_urls) && p.image_urls.length) {
    for (const u of p.image_urls) if (s(u)) out.push(s(u));
  }

  if (Array.isArray(p?.images) && p.images.length) {
    for (const it of p.images) {
      const u = typeof it === "string" ? it : it?.url || it?.image_url || it?.src;
      if (s(u)) out.push(s(u));
    }
  }

  if (s(p?.image_url)) out.push(s(p.image_url));

  const seen = new Set();
  const uniq = [];
  for (const u of out) {
    if (seen.has(u)) continue;
    seen.add(u);
    uniq.push(u);
  }
  return uniq;
}

const loadingMedia = ref(false);
const imgs = ref(extractLocalImgs(props.p || {}));
const idx = ref(0);
const broken = ref(new Set());

const activeImg = computed(() => {
  const list = imgs.value.filter((u) => !broken.value.has(u));
  if (!list.length) return "";
  const i = Math.min(Math.max(0, Number(idx.value || 0)), list.length - 1);
  return list[i] || "";
});

function prevImg() {
  const list = imgs.value.filter((u) => !broken.value.has(u));
  if (list.length <= 1) return;
  idx.value = (idx.value - 1 + list.length) % list.length;
}

function nextImg() {
  const list = imgs.value.filter((u) => !broken.value.has(u));
  if (list.length <= 1) return;
  idx.value = (idx.value + 1) % list.length;
}

function onImgErr() {
  const u = activeImg.value;
  if (!u) return;
  const next = new Set(broken.value);
  next.add(u);
  broken.value = next;
  idx.value = 0;
}

// puntitos tipo ML (máx 6)
const dotsCount = computed(() => Math.min(6, imgs.value.length));
const dotActive = computed(() => {
  const n = imgs.value.length;
  if (!n) return 0;
  if (n <= 6) return idx.value;
  const t = idx.value / (n - 1);
  return Math.round(t * 5);
});

// ✅ si no hay varias imágenes locales, pedimos media pública (SIN 401)
async function ensureMedia() {
  const pid = props.p?.product_id ?? props.p?.id;
  if (!pid) return;

  const local = extractLocalImgs(props.p || {});
  imgs.value = local;
  idx.value = 0;
  broken.value = new Set();

  if (local.length > 1) return;

  loadingMedia.value = true;
  try {
    const r = await getPublicProductMedia(pid);
    const arr = extractLocalImgs(r || {});
    if (arr.length) imgs.value = arr;
  } catch {
    // silencio
  } finally {
    loadingMedia.value = false;
  }
}

onMounted(ensureMedia);

watch(
  () => props.p?.product_id ?? props.p?.id,
  () => ensureMedia()
);

function openProduct() {
  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";
  router.push({
    name: "shopProduct",
    params: { id: String(props.p?.product_id ?? props.p?.id ?? "") },
    query: { branch_id },
  });
}

/* ❤️ opcional */
const fav = ref(false);
function toggleFav() {
  fav.value = !fav.value;
}
</script>

<style scoped>
.ml-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

/* ✅ ahora es DIV */
.ml-media {
  width: 100%;
  height: var(--media-h);
  background: #f7f7f7;
  cursor: pointer;
  display: block;
  position: relative;
  overflow: hidden;
}

.ml-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ml-media-empty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 12px;
  opacity: 0.55;
}

/* ===== Flechas estilo captura (pill grande) ===== */
.ml-navpill {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 46px;
  height: 56px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.96);
  display: grid;
  place-items: center;
  box-shadow: 0 14px 26px rgba(0, 0, 0, 0.14);
  cursor: pointer;
  z-index: 3;
}

.ml-nav-left {
  left: -18px; /* medio afuera */
}
.ml-nav-right {
  right: -18px; /* medio afuera */
}

.ml-nav-left :deep(.v-icon) {
  color: rgba(0, 0, 0, 0.65);
}
.ml-nav-right :deep(.v-icon) {
  color: #1e66ff;
}

/* Puntitos */
.ml-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 6px;
  pointer-events: none; /* no bloquea clicks */
  z-index: 2;
}
.ml-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
  opacity: 0.8;
}
.ml-dot.active {
  width: 10px;
  opacity: 1;
  background: rgba(255, 255, 255, 0.95);
}

.ml-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #00a650;
  color: #fff;
  font-weight: 900;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  z-index: 3;
}

/* ❤️ (opcional) */
.ml-fav {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.96);
  display: grid;
  place-items: center;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  z-index: 3;
}
.ml-fav :deep(.v-icon) {
  color: #1e66ff;
}

/* body */
.ml-body {
  padding: 12px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.ml-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ml-price {
  font-size: 20px;
  font-weight: 950;
  letter-spacing: -0.2px;
  color: #111;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ml-off {
  font-size: 11px;
  font-weight: 950;
  color: #00a650;
  white-space: nowrap;
  line-height: 1;
  flex: 0 0 auto;
}

.ml-old {
  margin-top: -2px;
  font-size: 12px;
  opacity: 0.6;
  text-decoration: line-through;
}

.ml-title {
  margin-top: 4px;
  font-weight: 950;
  font-size: 13px;
  letter-spacing: 0.2px;
  text-transform: uppercase;
  line-height: 1.15;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #111;
}

.ml-meta {
  font-size: 11px;
  opacity: 0.65;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* responsive */
.ml-card {
  --media-h: 180px;
}

@media (max-width: 960px) {
  .ml-card {
    --media-h: 160px;
  }
}

@media (max-width: 600px) {
  .ml-card {
    --media-h: 150px;
  }

  .ml-price-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .ml-off {
    font-size: 10px;
  }

  .ml-navpill {
    width: 44px;
    height: 52px;
  }
  .ml-nav-left {
    left: -16px;
  }
  .ml-nav-right {
    right: -16px;
  }
}
</style>
