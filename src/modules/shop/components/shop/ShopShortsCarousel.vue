<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<template>
  <v-card class="shc-card" variant="flat" rounded="xl">
    <div class="shc-head"></div>

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
                <!-- Preview + Play -->
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
                      <v-icon size="24">mdi-play</v-icon>
                    </div>
                  </div>
                </button>

                <!-- Iframe -->
                <div v-else class="shc-iframeWrap">
                  <div class="shc-ytStage">
                    <iframe
                      class="shc-iframe"
                      :class="{ 'shc-iframe--ytCover': shouldCoverYouTube(it.url) }"
                      :src="cleanAutoplayUrl(it.url)"
                      loading="lazy"
                      frameborder="0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowfullscreen
                      title="Video"
                    ></iframe>
                  </div>
                </div>
              </div>

              <!-- PRODUCT BAR -->
              <div class="shc-prodBar">
                <div v-if="resolvedProduct(it)?.id" class="prodRow">
                  <button
                    class="prodInfo"
                    type="button"
                    @click="goProduct(resolvedProduct(it).id)"
                    :title="resolvedProduct(it).name || ''"
                  >
                    <div class="prodImg">
                      <img
                        v-if="productImgFromItem(it)"
                        :src="productImgFromItem(it)"
                        alt=""
                        loading="lazy"
                        @error="onItemImgError(it)"
                      />
                      <div v-else class="prodImgEmpty">Sin imagen</div>
                    </div>

                    <div class="prodMid">
                      <div class="prodTitle">
                        {{ resolvedProduct(it).name || "Producto" }}
                      </div>

                      <div class="prodPrices">
                        <div class="prodPrice">$ {{ fmtMoney(finalPrice(resolvedProduct(it))) }}</div>
                        <div v-if="offPct(resolvedProduct(it))" class="prodOff">
                          {{ offPct(resolvedProduct(it)) }}% OFF
                        </div>
                      </div>

                      <div v-if="showOldPrice(resolvedProduct(it))" class="prodOld">
                        $ {{ fmtMoney(oldPrice(resolvedProduct(it))) }}
                      </div>
                    </div>
                  </button>

                  <div class="prodCtas">
                    <button class="ctaBuy" type="button" @click="buyNow(it)">Comprar</button>
                    <button class="ctaCart" type="button" @click="addToCart(it)">
                      <v-icon size="14">mdi-cart-outline</v-icon>
                      Agregar
                    </button>
                  </div>
                </div>

                <div v-else class="prodEmpty">
                  <div class="prodTitle">Producto no disponible</div>
                  <div class="text-caption" style="opacity:.65">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

const cardW = ref(280);
const videoH = ref(420);

const activePlayKey = ref("");
let ro = null;

const brokenByKey = ref({});

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function updateSizing() {
  const w = stripEl.value?.clientWidth || 0;

  if (w >= 1200) cardW.value = 300;
  else if (w >= 900) cardW.value = 290;
  else if (w >= 700) cardW.value = 270;
  else cardW.value = Math.max(235, w - 64);

  videoH.value = clamp(Math.round(cardW.value * 1.35), 300, 460);
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

/* ===================== YOUTUBE: embed + cover ===================== */
function s(x) {
  return String(x || "").trim();
}

function isYouTube(u) {
  const t = s(u);
  return /youtube\.com|youtu\.be/i.test(t);
}

/* ✅ En este carrusel son “shorts”: cubrimos cualquier YouTube
   (porque el feed puede traer youtu.be o watch?v=...) */
function shouldCoverYouTube(u) {
  return isYouTube(u);
}

function extractYouTubeId(u) {
  const url = s(u);
  if (!url) return "";

  let m = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/i);
  if (m?.[1]) return m[1];

  m = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/i);
  if (m?.[1]) return m[1];

  m = url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/i);
  if (m?.[1]) return m[1];

  try {
    const U = new URL(url);
    const v = U.searchParams.get("v");
    if (v) return v;
  } catch {}

  m = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/i);
  if (m?.[1]) return m[1];

  return "";
}

function addParams(url, paramsObj) {
  const base = s(url);
  if (!base) return base;

  try {
    const u = new URL(base);
    for (const [k, v] of Object.entries(paramsObj)) u.searchParams.set(k, String(v));
    return u.toString();
  } catch {
    const sep = base.includes("?") ? "&" : "?";
    const q = Object.entries(paramsObj)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    return `${base}${sep}${q}`;
  }
}

function toYouTubeEmbedUrl(raw) {
  const base = s(raw);
  if (!base) return base;

  const id = extractYouTubeId(base);
  if (!id) return base;

  return `https://www.youtube-nocookie.com/embed/${id}`;
}

function cleanAutoplayUrl(u) {
  const base = s(u);
  if (!base) return base;

  if (isYouTube(base)) {
    const embed = toYouTubeEmbedUrl(base);
    return addParams(embed, {
      autoplay: 1,
      mute: 0,
      playsinline: 1,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1,
      fs: 0,
    });
  }

  return addParams(base, { autoplay: 1, mute: 0 });
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

/* ===== url resolver (imágenes) ===== */
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

/* ===== producto ===== */
function resolvedProduct(it) {
  const prod = it?.product && typeof it.product === "object" ? it.product : null;
  const id = Number(it?.product_id ?? prod?.id ?? 0);
  if (!id) return null;
  if (prod) return { ...prod, id };

  return {
    id,
    name: it?.product_name || it?.name || it?.title || "",
    price: it?.price ?? 0,
    price_list: it?.price_list ?? 0,
    price_discount: it?.price_discount ?? 0,
    image_url: it?.product_image_url || it?.image_url || it?.product_image || it?.image || "",
    cover_url: it?.cover_url || "",
    images: Array.isArray(it?.images) ? it.images : [],
    image_urls: Array.isArray(it?.image_urls) ? it.image_urls : [],
    storage_key: it?.storage_key || it?.image_key || it?.object_key || it?.file_key || "",
  };
}

function pickFirstImageCandidate(it) {
  const prod = it?.product && typeof it.product === "object" ? it.product : null;
  const all = [
    it?.product_image_url,
    it?.image_url,
    it?.product_image,
    it?.image,
    it?.thumbnail,
    it?.cover_url,
    it?.storage_key,
    prod?.image_url,
    prod?.cover_url,
    prod?.thumbnail,
    prod?.thumb,
    prod?.main_image_url,
    prod?.image,
    prod?.storage_key,
    Array.isArray(prod?.images) && prod.images.length
      ? typeof prod.images[0] === "string"
        ? prod.images[0]
        : prod.images[0]?.url || prod.images[0]?.image_url || prod.images[0]?.src || prod.images[0]?.path
      : "",
    Array.isArray(prod?.image_urls) && prod.image_urls.length ? prod.image_urls[0] : "",
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

/* ===== cart actions ===== */
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

/* ===== go product ===== */
function goProduct(productId) {
  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";
  router.push({ name: "shopProduct", params: { id: String(productId) }, query: { branch_id } });
}

/* ===== normalize ===== */
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
.shc-card {
  border-radius: 18px;
  background: #fbfbfb;
  border: 1px solid rgba(0, 0, 0, 0.04);
  overflow: visible;
}

.shc-head {
  padding: 12px 12px 10px;
  background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(250,250,250,.9));
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.shc-body { padding: 6px 8px 10px; }
.shc-wrap { position: relative; overflow: visible; }

.shc-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 8px 40px 4px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.shc-strip::-webkit-scrollbar { display: none; }
.shc-item { flex: 0 0 auto; scroll-snap-align: center; }

.shc-frame {
  width: var(--shc-cardw, 260px);
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(0,0,0,.05);
  overflow: hidden;
}

/* VIDEO */
.shc-video {
  height: var(--shc-vh, 360px);
  background: #000;
  position: relative;
}

/* ✅ Preview button */
.shc-thumbBtn {
  border: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background: #000; /* ✅ nunca “mosaico” */
  cursor: pointer;
  position: relative;
  overflow: hidden; /* ✅ recorta barras del thumb */
}

/* ✅ Preview SIN barras: cover + micro zoom */
.shc-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;            /* ✅ clave: NO contain */
  object-position: center;
  display: block;
  transform: scale(1.06);       /* ✅ mata líneas/barras finitas */
  transform-origin: center;
}

.shc-thumbEmpty {
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 12px;
  opacity: .6;
  color: #fff;
}

.shc-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.16));
}
.shc-play-ring {
  width: 52px;
  height: 52px;
  border-radius: 999px;
  background: rgba(255,255,255,.94);
  display: grid;
  place-items: center;
  box-shadow: 0 10px 18px rgba(0,0,0,.18);
}

/* ✅ IFRAME: estable */
.shc-iframeWrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
  contain: layout paint size;
}

.shc-ytStage {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
}

.shc-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  border: 0;
  background: #000;
}

/* ✅ COVER REAL (play) - zoom razonable */
.shc-iframe--ytCover {
  left: 50% !important;
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  height: 100% !important;
  transform-origin: center center !important;

  /* ✅ antes era demasiado (1.85 / 2.05). Ahora queda pro sin “comerse” todo */
  transform: translate(-50%, -50%) scale(1.35) !important;
}

/* PRODUCT BAR */
.shc-prodBar {
  background: #fff;
  padding: 8px 8px 10px;
  border-top: 1px solid rgba(0,0,0,.06);
}

.prodInfo {
  width: 100%;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 10px;
  align-items: center;
}

.prodImg {
  width: 72px;
  height: 72px;
  border-radius: 14px;
  overflow: hidden;
  background: #f7f7f7;
  border: 1px solid rgba(0,0,0,.06);
}
.prodImg img { width: 100%; height: 100%; object-fit: cover; display: block; }
.prodImgEmpty { height: 100%; display: grid; place-items: center; font-size: 11px; opacity: .55; }

.prodMid { text-align: center; min-width: 0; }
.prodTitle {
  font-weight: 900;
  font-size: 11px;
  letter-spacing: .18px;
  text-transform: uppercase;
  line-height: 1.12;
  color: #111;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prodPrices { margin-top: 4px; display: flex; justify-content: center; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.prodPrice { font-size: 14px; font-weight: 950; letter-spacing: -0.2px; color: #111; white-space: nowrap; }
.prodOff { font-size: 10px; font-weight: 950; color: #00a650; white-space: nowrap; line-height: 1; }
.prodOld { margin-top: 2px; font-size: 10px; opacity: .6; text-decoration: line-through; }

.prodCtas {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
}

.ctaBuy {
  width: 100%;
  border: 1px solid rgba(0,0,0,.10) !important;
  border-radius: 12px !important;
  padding: 6px 8px !important;
  font-weight: 900 !important;
  font-size: 11px !important;
  line-height: 1.1 !important;
  cursor: pointer;
  color: #fff;
  background: #2680c2;
  box-shadow: 0 3px 8px rgba(38,128,194,.12) !important;
}

.ctaCart {
  width: 100%;
  border: 1px solid rgba(0,0,0,.12) !important;
  border-radius: 12px !important;
  padding: 6px 8px !important;
  font-weight: 900 !important;
  font-size: 11px !important;
  line-height: 1.1 !important;
  cursor: pointer;
  color: #111;
  background: #f3f3f3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.prodEmpty { padding: 4px 2px; text-align: left; }

/* Arrows */
.shc-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #fff;
  border-radius: 999px;
  box-shadow: 0 10px 18px rgba(0,0,0,.12);
  z-index: 10;
  opacity: 0.9;
}
.shc-nav-left { left: -6px; }
.shc-nav-right { right: -6px; }

/* mobile extra-compact */
@media (max-width: 600px) {
  .shc-strip { padding: 8px 36px 4px; gap: 10px; }
  .shc-nav { top: 56%; opacity: 0.85; }
  .shc-nav-left { left: -16px; }
  .shc-nav-right { right: -16px; }

  .prodInfo { grid-template-columns: 68px 1fr; gap: 10px; }
  .prodImg { width: 68px; height: 68px; border-radius: 14px; }

  /* ✅ Mobile suele necesitar un pelín más de cover */
  .shc-iframe--ytCover {
    transform: translate(-50%, -50%) scale(1.45) !important;
  }

  .ctaBuy, .ctaCart { font-size: 10.5px !important; padding: 6px 8px !important; }
}
</style>
