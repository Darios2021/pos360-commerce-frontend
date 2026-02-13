<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopClips.vue -->
<template>
  <div class="clips" data-page="shop-clips">
    <!-- Topbar (tipo ML / reels) -->
    <header class="clips-top">
      <button class="clips-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>
      <div class="clips-title">Clips</div>
      <div class="clips-spacer" />
    </header>

    <!-- estados -->
    <v-alert v-if="error" type="error" variant="tonal" class="clips-alert">
      {{ error }}
    </v-alert>

    <div v-if="loading" class="clips-loading">
      <v-progress-circular indeterminate />
      <div class="text-caption" style="opacity:.8">Cargando clips…</div>
    </div>

    <!-- FEED vertical -->
    <main
      v-else
      ref="feedEl"
      class="clips-feed"
      role="region"
      aria-label="Clips"
      @scroll.passive="onFeedScroll"
    >
      <section
        v-for="it in items"
        :key="it.key"
        class="clip"
        :data-key="it.key"
      >
        <!-- VIDEO AREA (full) -->
        <div class="clip-stage">
          <!-- thumb -> play -->
          <button
            v-if="activePlayKey !== it.key"
            class="clip-thumbBtn"
            type="button"
            @click="play(it.key)"
            :title="it.title || 'Reproducir'"
          >
            <img v-if="it.thumb" class="clip-thumb" :src="it.thumb" alt="" loading="lazy" />
            <div v-else class="clip-thumbEmpty">Video</div>

            <div class="clip-play">
              <div class="clip-play-ring">
                <v-icon size="28">mdi-play</v-icon>
              </div>
            </div>
          </button>

          <!-- iframe -->
          <div v-else class="clip-iframeWrap">
            <iframe
              class="clip-iframe"
              :class="{ 'clip-iframe--ytCover': shouldCoverYouTube(it.url) }"
              :src="cleanAutoplayUrl(it.url)"
              loading="lazy"
              frameborder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowfullscreen
              title="Video"
            ></iframe>
          </div>

          <!-- overlay derecha (acciones) -->
          <div class="clip-actions">
            <button class="clip-action" type="button" @click="toggleMute" :title="muted ? 'Activar sonido' : 'Silenciar'">
              <v-icon size="22">{{ muted ? "mdi-volume-off" : "mdi-volume-high" }}</v-icon>
            </button>

            <button class="clip-action" type="button" @click="share(it)" title="Compartir">
              <v-icon size="22">mdi-share-variant</v-icon>
            </button>

            <button class="clip-action" type="button" @click="goProduct(resolvedProduct(it)?.id)" title="Ver producto">
              <v-icon size="22">mdi-open-in-new</v-icon>
            </button>
          </div>

          <!-- hint sonido -->
          <div class="clip-hint" v-if="activePlayKey === it.key && muted">
            Tocá para activar el sonido
          </div>
        </div>

        <!-- PRODUCT BAR (abajo) -->
        <div class="clip-productBar" v-if="resolvedProduct(it)?.id">
          <button class="pbar-left" type="button" @click="goProduct(resolvedProduct(it).id)">
            <div class="pbar-img">
              <img
                v-if="productImgFromItem(it)"
                :src="productImgFromItem(it)"
                alt=""
                loading="lazy"
                @error="onItemImgError(it)"
              />
              <div v-else class="pbar-imgEmpty">Sin</div>
            </div>

            <div class="pbar-mid">
              <div class="pbar-title">{{ resolvedProduct(it).name || "Producto" }}</div>
              <div class="pbar-priceRow">
                <div class="pbar-price">$ {{ fmtMoney(finalPrice(resolvedProduct(it))) }}</div>
                <div v-if="offPct(resolvedProduct(it))" class="pbar-off">
                  {{ offPct(resolvedProduct(it)) }}% OFF
                </div>
              </div>
              <div v-if="showOldPrice(resolvedProduct(it))" class="pbar-old">
                $ {{ fmtMoney(oldPrice(resolvedProduct(it))) }}
              </div>
            </div>
          </button>

          <div class="pbar-ctas">
            <button class="pbar-buy" type="button" @click="buyNow(it)">Comprar</button>
            <button class="pbar-add" type="button" @click="addToCart(it)">
              <v-icon size="16">mdi-cart-outline</v-icon>
              Agregar
            </button>
          </div>
        </div>

        <div class="clip-productBar clip-productBar--empty" v-else>
          <div class="pbar-mid">
            <div class="pbar-title">Producto no disponible</div>
            <div class="text-caption" style="opacity:.7">—</div>
          </div>
        </div>
      </section>

      <!-- loader more -->
      <div v-if="loadingMore" class="clips-more">
        <v-progress-circular indeterminate size="18" />
        <span class="text-caption" style="opacity:.75">Cargando más…</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { publicVideosFeed } from "@/modules/shop/service/shop.videos.public.api.js";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const router = useRouter();
const route = useRoute();
const cart = useShopCartStore();

const loading = ref(false);
const loadingMore = ref(false);
const error = ref("");

const items = ref([]);
const feedEl = ref(null);

const activePlayKey = ref("");
const muted = ref(true);

// paging
const offset = ref(0);
const hasMore = ref(true);

const HARD_MAX = computed(() => {
  const v = Number(String(import.meta?.env?.VITE_PUBLIC_VIDEOS_FEED_MAX ?? "200"));
  return Number.isFinite(v) && v > 0 ? v : 200;
});

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

/* ====== helpers ====== */
function s(x) {
  return String(x || "").trim();
}

function goBack() {
  // si venís de otra ruta, back; si no, a /shop
  if (window.history.length > 1) router.back();
  else router.push("/shop");
}

function play(key) {
  activePlayKey.value = key;
}

function toggleMute() {
  muted.value = !muted.value;
}

/* ===== YouTube embed ===== */
function isYouTube(u) {
  return /youtube\.com|youtu\.be/i.test(s(u));
}
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
      mute: muted.value ? 1 : 0,
      playsinline: 1,
      controls: 0,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      disablekb: 1,
      fs: 0,
    });
  }

  return addParams(base, { autoplay: 1, mute: muted.value ? 1 : 0 });
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

/* ===== url resolver img ===== */
function resolveUrl(raw) {
  let u = s(raw);
  if (!u) return "";
  if (/^https?:\/\//i.test(u) || u.startsWith("data:")) return u;

  const publicBase = s(import.meta?.env?.VITE_PUBLIC_BASE_URL);
  const mediaBase = s(import.meta?.env?.VITE_MEDIA_PUBLIC_BASE);
  const origin = publicBase || (typeof window !== "undefined" && window.location ? window.location.origin : "");
  const base = (mediaBase || origin || "").replace(/\/$/, "");
  if (!base) return u;

  u = u.replace(/^\//, "");
  if (u.startsWith("pos360/") && /\/pos360$/i.test(base)) u = u.slice("pos360/".length);
  if (u.startsWith("media/")) return `${base}/${u}`;
  if (u.includes("/media/")) return `${base}/${u}`;
  return `${base}/media/${u}`;
}

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

const brokenByKey = ref({});

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
function goProduct(productId) {
  if (!productId) return;
  const branch_id = route.query.branch_id ? String(route.query.branch_id) : "3";
  router.push({ name: "shopProduct", params: { id: String(productId) }, query: { branch_id } });
}

async function share(it) {
  try {
    const p = resolvedProduct(it);
    const url = p?.id ? `${window.location.origin}/shop/product/${p.id}` : window.location.href;

    if (navigator.share) {
      await navigator.share({ title: "San Juan Tecnología", text: p?.name || "Producto", url });
      return;
    }
    await navigator.clipboard?.writeText?.(url);
  } catch {}
}

/* ===== normalize + fetch ===== */
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

async function fetchFirstPage() {
  loading.value = true;
  error.value = "";
  try {
    offset.value = 0;
    hasMore.value = true;

    const take = clamp(Number(import.meta?.env?.VITE_PUBLIC_VIDEOS_FEED_PAGE_SIZE || 8), 6, 18);
    const r = await publicVideosFeed({ limit: take, offset: 0 });

    const list = Array.isArray(r?.data) ? r.data : Array.isArray(r?.items) ? r.items : [];
    items.value = list.map(normalizeItem).filter((x) => x.url);

    offset.value = items.value.length;
    hasMore.value = Boolean(r?.meta?.has_more) && items.value.length < HARD_MAX.value;
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar los clips";
    items.value = [];
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

async function fetchMore() {
  if (loadingMore.value) return;
  if (!hasMore.value) return;
  if (items.value.length >= HARD_MAX.value) {
    hasMore.value = false;
    return;
  }

  loadingMore.value = true;
  try {
    const take = clamp(Number(import.meta?.env?.VITE_PUBLIC_VIDEOS_FEED_PAGE_SIZE || 8), 6, 18);

    const r = await publicVideosFeed({ limit: take, offset: offset.value });
    const list = Array.isArray(r?.data) ? r.data : Array.isArray(r?.items) ? r.items : [];
    const next = list.map(normalizeItem).filter((x) => x.url);

    const seen = new Set(items.value.map((x) => String(x.id || x.key)));
    const dedup = next.filter((x) => !seen.has(String(x.id || x.key)));

    items.value = items.value.concat(dedup);
    offset.value = offset.value + next.length;

    hasMore.value = Boolean(r?.meta?.has_more) && next.length > 0 && items.value.length < HARD_MAX.value;
  } finally {
    loadingMore.value = false;
  }
}

function onFeedScroll() {
  const el = feedEl.value;
  if (!el) return;

  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 600;
  if (nearBottom) fetchMore();
}

/* ✅ auto-play del clip visible (simple) */
let io = null;
function setupIntersectionAutoplay() {
  const root = feedEl.value;
  if (!root) return;

  if (io) io.disconnect();

  io = new IntersectionObserver(
    (entries) => {
      // elegir el más visible
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => (b.intersectionRatio || 0) - (a.intersectionRatio || 0))[0];

      const key = visible?.target?.getAttribute?.("data-key") || "";
      if (key && key !== activePlayKey.value) activePlayKey.value = key;
    },
    { root, threshold: [0.6, 0.75, 0.9] }
  );

  const cards = root.querySelectorAll(".clip");
  cards.forEach((c) => io.observe(c));
}

onMounted(async () => {
  await fetchFirstPage();
  await nextTick();
  setupIntersectionAutoplay();
});

onBeforeUnmount(() => {
  try {
    if (io) io.disconnect();
  } catch {}
  io = null;
});

watch(
  () => items.value.length,
  async () => {
    await nextTick();
    setupIntersectionAutoplay();
  }
);
</script>

<style scoped>
/* Layout base full screen */
.clips {
  background: #0b0f16;
  color: #fff;
  min-height: 100dvh;
}

/* Topbar: sticky, safe area */
.clips-top {
  position: sticky;
  top: 0;
  z-index: 50;
  height: calc(54px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  background: rgba(11, 15, 22, 0.88);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.clips-back {
  width: 44px;
  height: 44px;
  border: 0;
  background: transparent;
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
}

.clips-title {
  text-align: center;
  font-weight: 900;
  letter-spacing: 0.2px;
}

.clips-spacer { width: 44px; height: 44px; }

.clips-alert {
  margin: 12px;
}

.clips-loading {
  min-height: calc(100dvh - 54px);
  display: grid;
  place-items: center;
  gap: 10px;
}

/* Feed: scroll vertical + snap */
.clips-feed {
  height: calc(100dvh - (54px + env(safe-area-inset-top)));
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
}
.clips-feed::-webkit-scrollbar { display: none; }

.clip {
  height: calc(100dvh - (54px + env(safe-area-inset-top)));
  scroll-snap-align: start;
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
}

/* Stage video full */
.clip-stage {
  position: relative;
  background: #000;
}

/* thumb/play */
.clip-thumbBtn {
  width: 100%;
  height: 100%;
  border: 0;
  padding: 0;
  background: #000;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.clip-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.04);
  display: block;
}
.clip-thumbEmpty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  opacity: .7;
}

.clip-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(0,0,0,0.12), rgba(0,0,0,0.35));
}
.clip-play-ring {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: rgba(255,255,255,0.95);
  display: grid;
  place-items: center;
  color: #111;
  box-shadow: 0 14px 28px rgba(0,0,0,0.35);
}

/* iframe */
.clip-iframeWrap {
  position: absolute;
  inset: 0;
  background: #000;
  overflow: hidden;
}
.clip-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.clip-iframe--ytCover {
  left: 50% !important;
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  height: 100% !important;
  transform-origin: center center !important;
  transform: translate(-50%, -50%) scale(1.32) !important;
}

/* actions right */
.clip-actions {
  position: absolute;
  right: 10px;
  bottom: 110px; /* arriba del product bar */
  display: grid;
  gap: 10px;
  z-index: 5;
}
.clip-action {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.14);
  background: rgba(0,0,0,0.35);
  color: #fff;
  display: grid;
  place-items: center;
}

/* hint sound */
.clip-hint {
  position: absolute;
  left: 50%;
  bottom: 120px;
  transform: translateX(-50%);
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(0,0,0,0.55);
  border: 1px solid rgba(255,255,255,0.12);
  z-index: 6;
}

/* product bar bottom (sticky per clip) */
.clip-productBar {
  background: rgba(255,255,255,0.94);
  color: #111;
  border-top: 1px solid rgba(0,0,0,0.08);
  padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.clip-productBar--empty {
  grid-template-columns: 1fr;
}

.pbar-left {
  border: 0;
  background: transparent;
  padding: 0;
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.pbar-img {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  overflow: hidden;
  background: #f2f2f2;
  border: 1px solid rgba(0,0,0,0.08);
}
.pbar-img img { width:100%; height:100%; object-fit: cover; display:block; }
.pbar-imgEmpty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 11px;
  opacity: .6;
}

.pbar-mid { min-width: 0; }
.pbar-title {
  font-weight: 900;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pbar-priceRow {
  margin-top: 4px;
  display: flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
}
.pbar-price { font-weight: 950; font-size: 16px; }
.pbar-off { font-weight: 950; font-size: 11px; color: #00a650; }
.pbar-old { margin-top: 2px; font-size: 11px; opacity: .65; text-decoration: line-through; }

.pbar-ctas {
  display: grid;
  grid-template-columns: 116px;
  gap: 8px;
  align-content: center;
}
.pbar-buy {
  border: 0;
  border-radius: 12px;
  padding: 10px 10px;
  font-weight: 900;
  background: #2680c2;
  color: #fff;
}
.pbar-add {
  border: 1px solid rgba(0,0,0,0.14);
  border-radius: 12px;
  padding: 10px 10px;
  font-weight: 900;
  background: #f3f3f3;
  color: #111;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* loader more */
.clips-more {
  padding: 14px 12px calc(14px + env(safe-area-inset-bottom));
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}
</style>
