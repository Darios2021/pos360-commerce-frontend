<template>
  <v-card class="shc-card" variant="flat" rounded="xl">
    <!-- Header (IG-like) -->
    <div class="shc-head">
      <div class="shc-head-text">
        <div class="shc-head-title">Shorts</div>
        <div class="shc-head-sub">Novedades en video</div>
      </div>

      <v-btn
        class="shc-reload"
        icon="mdi-refresh"
        variant="text"
        size="small"
        :loading="loading"
        title="Recargar"
        @click="fetchFeed"
      />
    </div>

    <!-- Body -->
    <div class="shc-body">
      <v-alert v-if="error" type="error" variant="tonal" density="comfortable" class="mb-3">
        {{ error }}
      </v-alert>

      <div v-if="loading" class="py-6 d-flex align-center justify-center ga-3">
        <v-progress-circular indeterminate />
        <div class="text-caption" style="opacity:0.75">Cargando videos…</div>
      </div>

      <div
        v-else-if="items.length === 0"
        class="py-6 text-center text-caption"
        style="opacity:0.75"
      >
        No hay videos configurados todavía.
      </div>

      <div v-else class="shc-wrap">
        <!-- Flechas externas (IG-like) -->
        <v-btn
          class="shc-nav shc-nav-left"
          icon="mdi-chevron-left"
          variant="elevated"
          size="small"
          :disabled="items.length <= 1"
          @click="goPrev"
        />
        <v-btn
          class="shc-nav shc-nav-right"
          icon="mdi-chevron-right"
          variant="elevated"
          size="small"
          :disabled="items.length <= 1"
          @click="goNext"
        />

        <!-- Strip -->
        <div ref="stripEl" class="shc-strip" role="region" aria-label="Videos cortos">
          <div v-for="it in items" :key="it.key" class="shc-item">
            <div
              class="shc-frame"
              :style="{
                '--shc-cardw': cardW + 'px',
                '--shc-vh': videoH + 'px',
              }"
            >
              <!-- VIDEO -->
              <div class="shc-video">
                <button
                  v-if="activePlayKey !== it.key"
                  class="shc-thumbBtn"
                  type="button"
                  :title="it.title || 'Reproducir'"
                  @click="play(it.key)"
                >
                  <img v-if="it.thumb" class="shc-thumb" :src="it.thumb" alt="" loading="lazy" />
                  <div v-else class="shc-thumbEmpty">Video</div>

                  <div class="shc-play">
                    <div class="shc-play-ring">
                      <v-icon size="28">mdi-play</v-icon>
                    </div>
                  </div>
                </button>

                <div v-else class="shc-iframeWrap">
                  <iframe
                    class="shc-iframe"
                    :src="autoplayUrl(it.url)"
                    loading="lazy"
                    frameborder="0"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowfullscreen
                    title="Video"
                  ></iframe>
                </div>
              </div>

              <!-- PRODUCT + CTAs (mismo componente) -->
              <div class="shc-prodCard">
                <div v-if="resolvedProduct(it)?.id" class="prodBlock">
                  <!-- Card producto (clickeable para ir al producto) -->
                  <button
                    class="pcard"
                    type="button"
                    @click="goProduct(resolvedProduct(it).id)"
                    :title="resolvedProduct(it).name || ''"
                  >
                    <div class="pcard-left">
                      <div class="pcard-img">
                        <img
                          v-if="productImgFromItem(it)"
                          :src="productImgFromItem(it)"
                          alt=""
                          loading="lazy"
                          @error="onItemImgError(it, $event)"
                        />
                        <div v-else class="pcard-img-empty">Sin imagen</div>
                      </div>
                    </div>

                    <div class="pcard-mid">
                      <div class="pcard-title">
                        {{ resolvedProduct(it).name || "Producto" }}
                      </div>

                      <div class="pcard-prices">
                        <div class="pcard-price">$ {{ fmtMoney(finalPrice(resolvedProduct(it))) }}</div>
                        <div v-if="offPct(resolvedProduct(it))" class="pcard-off">
                          {{ offPct(resolvedProduct(it)) }}% OFF
                        </div>
                      </div>

                      <div v-if="showOldPrice(resolvedProduct(it))" class="pcard-old">
                        $ {{ fmtMoney(oldPrice(resolvedProduct(it))) }}
                      </div>
                    </div>
                  </button>

                  <!-- ✅ CTAs chicos -->
                  <div class="pcard-ctaRow">
                    <button class="ctaBuy" type="button" @click="buyNow(it)">
                      Comprar
                    </button>

                    <button class="ctaCart" type="button" @click="addToCart(it)">
                      <v-icon size="16">mdi-cart-outline</v-icon>
                      Agregar
                    </button>
                  </div>
                </div>

                <div v-else class="pcard pcard-empty">
                  <div class="pcard-mid">
                    <div class="pcard-title">Producto no disponible</div>
                    <div class="text-caption" style="opacity:.65">—</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="shc-hint">Usá las flechas para cambiar de video.</div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import { useRouter, useRoute } from "vue-router";
import { publicVideosFeed } from "@/modules/shop/service/shop.videos.public.api.js";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const props = defineProps({
  limit: { type: Number, default: 12 },
});

const router = useRouter();
const route = useRoute();
const cart = useShopCartStore();

const loading = ref(false);
const error = ref("");

const items = ref([]);
const stripEl = ref(null);

const cardW = ref(300);
const videoH = ref(520);

const activePlayKey = ref("");
let ro = null;

const brokenByKey = ref({}); // key -> true

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/* ===== sizing (IG-like) ===== */
function updateSizing() {
  const w = stripEl.value?.clientWidth || 0;

  if (w >= 1200) cardW.value = 310;
  else if (w >= 900) cardW.value = 300;
  else if (w >= 700) cardW.value = 280;
  else cardW.value = Math.max(260, w - 28);

  videoH.value = clamp(Math.round(cardW.value * 1.52), 420, 560);
}

function stepPx() {
  return cardW.value + 12;
}
function currentIndex() {
  return Math.round((stripEl.value?.scrollLeft || 0) / stepPx());
}
function goNext() {
  activePlayKey.value = "";
  stripEl.value?.scrollTo({ left: (currentIndex() + 1) * stepPx(), behavior: "smooth" });
}
function goPrev() {
  activePlayKey.value = "";
  stripEl.value?.scrollTo({ left: (currentIndex() - 1) * stepPx(), behavior: "smooth" });
}

function play(key) {
  activePlayKey.value = key;
}

function autoplayUrl(u) {
  const s = String(u || "");
  if (!s) return s;
  return s.includes("?") ? `${s}&autoplay=1&mute=0` : `${s}?autoplay=1&mute=0`;
}

/* ===== precios ===== */
function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}
function finalPrice(p) {
  const d = toNum(p?.price_discount);
  if (d > 0) return d;
  const l = toNum(p?.price_list);
  if (l > 0) return l;
  return toNum(p?.price);
}
function oldPrice(p) {
  const l = toNum(p?.price_list);
  const base = l > 0 ? l : toNum(p?.price);
  return base;
}
function showOldPrice(p) {
  const d = toNum(p?.price_discount);
  const o = oldPrice(p);
  return d > 0 && o > d;
}
function offPct(p) {
  if (!showOldPrice(p)) return 0;
  const o = oldPrice(p);
  const d = toNum(p?.price_discount);
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
}

/* ===== resolver URL media (para keys / rutas relativas) ===== */
function s(x) {
  return String(x || "").trim();
}

function resolveUrl(raw) {
  let u = s(raw);
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || u.startsWith("data:")) return u;

  const publicBase = s(import.meta?.env?.VITE_PUBLIC_BASE_URL);
  const mediaBase = s(import.meta?.env?.VITE_MEDIA_PUBLIC_BASE);

  const origin =
    publicBase || (typeof window !== "undefined" && window.location ? window.location.origin : "");

  const base = (mediaBase || origin || "").replace(/\/$/, "");
  if (!base) return u;

  u = u.replace(/^\//, "");
  if (u.startsWith("pos360/") && /\/pos360$/i.test(base)) u = u.slice("pos360/".length);
  if (u.startsWith("media/")) return `${base}/${u}`;
  if (u.includes("/media/")) return `${base}/${u}`;
  return `${base}/media/${u}`;
}

/* ===== producto resuelto ===== */
function resolvedProduct(it) {
  const prod = it?.product && typeof it.product === "object" ? it.product : null;
  const id = Number(it?.product_id ?? prod?.id ?? 0);
  if (!id) return null;

  if (prod) return { ...prod, id };

  return {
    id,
    name: it?.product_name || it?.name || it?.title || "",
    price: it?.price ?? it?.product_price ?? 0,
    price_list: it?.price_list ?? it?.product_price_list ?? 0,
    price_discount: it?.price_discount ?? it?.product_price_discount ?? 0,
    image_url: it?.product_image_url || it?.image_url || it?.product_image || it?.image || "",
    cover_url: it?.cover_url || "",
    images: Array.isArray(it?.images) ? it.images : [],
    image_urls: Array.isArray(it?.image_urls) ? it.image_urls : [],
    storage_key: it?.storage_key || it?.image_key || it?.object_key || it?.file_key || "",
  };
}

function pickFirstImageCandidate(it) {
  const prod = it?.product && typeof it.product === "object" ? it.product : null;

  const itemCands = [
    it?.product_image_url,
    it?.image_url,
    it?.product_image,
    it?.image,
    it?.thumb_product,
    it?.product_thumb,
    it?.product_thumbnail,
    it?.thumbnail,
    it?.cover_url,
    it?.storage_key,
    it?.image_key,
    it?.object_key,
    it?.file_key,
  ];

  const prodCands = [
    prod?.image_url,
    prod?.cover_url,
    prod?.image_url_2,
    prod?.thumbnail,
    prod?.thumb,
    prod?.main_image_url,
    prod?.image,
    prod?.storage_key,
    prod?.image_key,
    prod?.object_key,
    prod?.file_key,
  ];

  const arrFromProdImages =
    Array.isArray(prod?.images) && prod.images.length
      ? [
          typeof prod.images[0] === "string"
            ? prod.images[0]
            : prod.images[0]?.url ||
              prod.images[0]?.image_url ||
              prod.images[0]?.src ||
              prod.images[0]?.path ||
              prod.images[0]?.storage_key,
        ]
      : [];

  const arrFromProdImageUrls =
    Array.isArray(prod?.image_urls) && prod.image_urls.length ? [prod.image_urls[0]] : [];

  const arrFromItemImages =
    Array.isArray(it?.images) && it.images.length
      ? [
          typeof it.images[0] === "string"
            ? it.images[0]
            : it.images[0]?.url ||
              it.images[0]?.image_url ||
              it.images[0]?.src ||
              it.images[0]?.path ||
              it.images[0]?.storage_key,
        ]
      : [];

  const arrFromItemImageUrls =
    Array.isArray(it?.image_urls) && it.image_urls.length ? [it.image_urls[0]] : [];

  const all = [
    ...itemCands,
    ...arrFromItemImages,
    ...arrFromItemImageUrls,
    ...prodCands,
    ...arrFromProdImages,
    ...arrFromProdImageUrls,
  ]
    .map((x) => s(x))
    .filter(Boolean);

  return all[0] || "";
}

function productImgFromItem(it) {
  if (!it?.key) return "";
  if (brokenByKey.value[it.key]) return "";
  const raw = pickFirstImageCandidate(it);
  return raw ? resolveUrl(raw) : "";
}

function onItemImgError(it) {
  const key = it?.key;
  if (!key) return;
  brokenByKey.value = { ...brokenByKey.value, [key]: true };
}

/* ===== acciones carrito ===== */
function addToCart(it) {
  const p = resolvedProduct(it);
  if (!p?.id) return;
  cart.add(p, 1);
}

function buyNow(it) {
  const p = resolvedProduct(it);
  if (!p?.id) return;
  cart.add(p, 1);
  cart.closeDrawer?.();
  router.push("/shop/cart");
}

/* ===== navegación a producto ===== */
function goProduct(productId) {
  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";
  router.push({
    name: "shopProduct",
    params: { id: String(productId) },
    query: { branch_id },
  });
}

/* ===== normalize feed ===== */
function normalizeItem(x) {
  const id = Number(x?.id || 0);
  const key = `v_${id || Math.random().toString(36).slice(2)}`;
  const prod = x?.product && typeof x.product === "object" ? x.product : null;

  return {
    key,
    id: id || null,
    product_id: x?.product_id ?? prod?.id ?? null,
    provider: x?.provider || null,
    title: x?.title || null,
    url: x?.url || null,
    thumb: x?.thumb || null,
    product_image_url: x?.product_image_url ?? x?.image_url ?? null,
    product_image: x?.product_image ?? x?.image ?? null,
    product_thumb: x?.product_thumb ?? x?.thumb_product ?? null,
    product_name: x?.product_name ?? x?.name ?? null,
    price: x?.price ?? null,
    price_list: x?.price_list ?? null,
    price_discount: x?.price_discount ?? null,
    storage_key: x?.storage_key ?? x?.image_key ?? x?.object_key ?? x?.file_key ?? null,
    product: prod,
  };
}

async function fetchFeed() {
  loading.value = true;
  error.value = "";
  try {
    const r = await publicVideosFeed({ limit: props.limit });
    const list = Array.isArray(r?.data) ? r.data : Array.isArray(r?.items) ? r.items : [];
    items.value = list.map(normalizeItem).filter((x) => x.url);
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar los videos";
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchFeed();
  await nextTick();
  updateSizing();

  ro = new ResizeObserver(updateSizing);
  if (stripEl.value) ro.observe(stripEl.value);
});

onBeforeUnmount(() => {
  try {
    if (ro && stripEl.value) ro.unobserve(stripEl.value);
  } catch {}
  ro = null;
});

watch(
  () => props.limit,
  async () => {
    activePlayKey.value = "";
    brokenByKey.value = {};
    await fetchFeed();
    await nextTick();
    updateSizing();
  }
);
</script>

<style scoped>
/* ===============================
   Shorts Carousel (IG-like)
   =============================== */

.shc-card {
  border-radius: 18px;
  background: #fbfbfb;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: visible;
}

/* Header */
.shc-head {
  padding: 14px 14px 12px;
  background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(250,250,250,.9));
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.shc-head-text { display: flex; flex-direction: column; gap: 4px; }
.shc-head-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -0.2px;
  color: rgba(0, 0, 0, 0.88);
  text-transform: uppercase;
}
.shc-head-sub {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
}

.shc-body { padding: 8px 10px 10px; }
.shc-wrap { position: relative; overflow: visible; }

/* Strip */
.shc-strip {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 10px 48px 4px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.shc-strip::-webkit-scrollbar { display: none; }
.shc-item { flex: 0 0 auto; scroll-snap-align: center; }

/* Frame */
.shc-frame {
  position: relative;
  width: var(--shc-cardw, 300px);
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.05);
  overflow: hidden;
}

/* Video */
.shc-video {
  height: var(--shc-vh, 520px);
  background: #f7f7f7;
  position: relative;
}
.shc-thumbBtn {
  border: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  cursor: pointer;
  position: relative;
}
.shc-thumb { width: 100%; height: 100%; object-fit: cover; display: block; }
.shc-thumbEmpty { height: 100%; display: grid; place-items: center; font-size: 12px; opacity: .6; }
.shc-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.18));
}
.shc-play-ring {
  width: 58px;
  height: 58px;
  border-radius: 999px;
  background: rgba(255,255,255,.94);
  display: grid;
  place-items: center;
  box-shadow: 0 10px 18px rgba(0,0,0,.18);
}
.shc-iframeWrap { width: 100%; height: 100%; background: #000; }
.shc-iframe { width: 100%; height: 100%; border: 0; display: block; }

/* Product area */
.shc-prodCard {
  padding: 10px 10px 12px;
  border-top: 1px solid rgba(0,0,0,.06);
  background: #fff;
}

/* ✅ Producto: imagen más grande + centro prolijo */
.pcard {
  width: 100%;
  border: 1px solid rgba(0,0,0,.08);
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
  padding: 10px;
  cursor: pointer;
  display: grid;
  grid-template-columns: 90px 1fr; /* ✅ más espacio a imagen */
  gap: 12px;
  align-items: center;
}

.pcard-img {
  width: 90px;   /* ✅ más grande */
  height: 90px;  /* ✅ más grande */
  border-radius: 16px;
  overflow: hidden;
  background: #f7f7f7;
  border: 1px solid rgba(0,0,0,.06);
}
.pcard-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.pcard-img-empty { height: 100%; display: grid; place-items: center; font-size: 11px; opacity: .55; }

.pcard-mid {
  text-align: center; /* ✅ centrado */
  min-width: 0;
}

.pcard-title {
  font-weight: 900;
  font-size: 12px;
  letter-spacing: .2px;
  text-transform: uppercase;
  line-height: 1.15;
  color: #111;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pcard-prices {
  margin-top: 6px;
  display: flex;
  justify-content: center; /* ✅ centrado */
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}
.pcard-price {
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.2px;
  color: #111;
  white-space: nowrap;
}
.pcard-off {
  font-size: 10px;
  font-weight: 950;
  color: #00a650;
  white-space: nowrap;
  line-height: 1;
}
.pcard-old {
  margin-top: 2px;
  font-size: 11px;
  opacity: .6;
  text-decoration: line-through;
}

.pcard-empty {
  cursor: default;
  grid-template-columns: 1fr;
}

/* ✅ CTAs más chicos */
.pcard-ctaRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
}

.ctaBuy {
  width: 100%;
  border: 1px solid rgba(0,0,0,.10) !important;
  border-radius: 12px !important;
  padding: 7px 10px !important; /* ✅ más chico */
  font-weight: 900 !important;
  font-size: 12px !important;
  line-height: 1.1 !important;
  text-transform: none !important;
  cursor: pointer;
  color: #fff;
  background: #2680c2;
  box-shadow: 0 4px 10px rgba(38, 128, 194, 0.14) !important;
}

.ctaCart {
  width: 100%;
  border: 1px solid rgba(0,0,0,.12) !important;
  border-radius: 12px !important;
  padding: 7px 10px !important; /* ✅ más chico */
  font-weight: 900 !important;
  font-size: 12px !important;
  line-height: 1.1 !important;
  text-transform: none !important;
  cursor: pointer;
  color: #111;
  background: #f3f3f3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* Arrows */
.shc-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 999px;
  box-shadow: 0 10px 18px rgba(0, 0, 0, 0.12);
  z-index: 10;
  opacity: 0.9;
}
.shc-nav-left { left: -6px; }
.shc-nav-right { right: -6px; }

.shc-hint {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.6;
  text-align: center;
}

/* Mobile */
@media (max-width: 600px) {
  .shc-head { padding: 12px 12px 10px; }
  .shc-head-title { font-size: 14px; }
  .shc-head-sub { font-size: 12px; }

  .shc-strip { padding: 10px 44px 4px; gap: 10px; }

  .shc-nav { top: 60%; opacity: 0.85; }
  .shc-nav-left { left: -18px; }
  .shc-nav-right { right: -18px; }

  .pcard {
    grid-template-columns: 86px 1fr;
    gap: 10px;
  }
  .pcard-img {
    width: 86px;
    height: 86px;
    border-radius: 16px;
  }

  .ctaBuy, .ctaCart {
    font-size: 11px !important;
    padding: 7px 10px !important;
  }
}
</style>
