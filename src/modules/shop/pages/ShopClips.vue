<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopClips.vue -->
<template>
  <div class="clips" data-page="shop-clips" :style="rootStyle">
    <!-- Top -->
    <header class="clips-top" aria-label="Clips topbar">
      <button class="clips-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>
    </header>

    <v-alert v-if="error" type="error" variant="tonal" class="clips-alert">
      {{ error }}
    </v-alert>

    <div v-if="loading" class="clips-loading">
      <v-progress-circular indeterminate />
      <div class="text-caption" style="opacity: 0.8">Cargando clips…</div>
    </div>

    <!-- Feed -->
    <main
      v-else
      ref="feedEl"
      class="clips-feed"
      role="region"
      aria-label="Clips"
      @scroll.passive="onScroll"
    >
      <section
        v-for="(it, idx) in items"
        :key="it.key"
        class="clip"
        :data-key="it.key"
        :data-index="idx"
      >
        <div class="clip-stage">
          <!-- Fondo liviano -->
          <img
            v-if="it.thumb"
            class="clip-thumb"
            :src="it.thumb"
            alt=""
            :loading="idx <= 1 ? 'eager' : 'lazy'"
            decoding="async"
          />
          <div v-else class="clip-thumbEmpty">Video</div>

          <div class="clip-shadowTop"></div>
          <div class="clip-shadowBottom"></div>

          <!-- Placeholder mientras no asienta -->
          <div v-if="activeKey !== it.key || !isSettled" class="clip-playGhost">
            <div class="clip-play-ring">
              <v-icon size="28">mdi-play</v-icon>
            </div>
          </div>
        </div>
      </section>

      <div v-if="loadingMore" class="clips-more">
        <v-progress-circular indeterminate size="18" />
        <span class="text-caption" style="opacity: 0.75">Cargando más…</span>
      </div>
    </main>

    <!-- ✅ PLAYER GLOBAL: NO captura swipe -->
    <div v-if="activeItem && isSettled" class="clip-playerGlobal" :style="playerStyle">
      <iframe
        :key="iframeKey"
        class="clip-iframe"
        :class="{ 'clip-iframe--ytCover': shouldCoverYouTube(activeItem.url) }"
        :src="cleanAutoplayUrl(activeItem.url)"
        loading="eager"
        frameborder="0"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        title="Video"
      ></iframe>

      <div class="clip-shadowTop"></div>
      <div class="clip-shadowBottom"></div>
    </div>

    <!-- acciones globales -->
    <div v-if="activeItem" class="clip-actions" aria-label="Acciones">
      <button
        class="clip-action"
        type="button"
        @click.stop="toggleMute"
        :title="muted ? 'Activar sonido' : 'Silenciar'"
        aria-label="Sonido"
      >
        <v-icon size="22">{{ muted ? "mdi-volume-off" : "mdi-volume-high" }}</v-icon>
      </button>

      <button
        class="clip-action"
        type="button"
        @click.stop="share(activeItem)"
        title="Compartir"
        aria-label="Compartir"
      >
        <v-icon size="22">mdi-share-variant</v-icon>
      </button>
    </div>

    <div v-if="activeItem && muted" class="clip-hint">
      Tocá el botón para activar el sonido
    </div>

    <!-- CARD GLOBAL FIJA -->
    <div v-if="activeProduct?.id" class="pbar" aria-label="Producto">
      <button class="pbar-left" type="button" @click="goProduct(activeProduct.id)">
        <div class="pbar-img">
          <img
            v-if="activeProductImg"
            :src="activeProductImg"
            alt=""
            loading="lazy"
            @error="onActiveImgError"
          />
          <div v-else class="pbar-imgEmpty">Sin</div>
        </div>

        <div class="pbar-mid">
          <div class="pbar-title">{{ activeProduct.name || "Producto" }}</div>

          <div class="pbar-priceRow">
            <div class="pbar-price">$ {{ fmtMoney(finalPrice(activeProduct)) }}</div>
            <div v-if="offPct(activeProduct)" class="pbar-off">
              {{ offPct(activeProduct) }}% OFF
            </div>
          </div>

          <div v-if="showOldPrice(activeProduct)" class="pbar-old">
            $ {{ fmtMoney(oldPrice(activeProduct)) }}
          </div>
        </div>
      </button>

      <button
        class="pbar-go"
        type="button"
        @click="buyNow(activeItem)"
        title="Comprar"
        aria-label="Comprar"
      >
        <v-icon size="18">mdi-lightning-bolt</v-icon>
      </button>
    </div>

    <div v-else-if="activeItem" class="pbar pbar--empty">
      <div class="pbar-mid">
        <div class="pbar-title">Producto no disponible</div>
        <div class="text-caption" style="opacity: 0.7">—</div>
      </div>
    </div>
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

const activeKey = ref("");
const muted = ref(true);
const iframeKey = ref("if_0");
const isSettled = ref(false);

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
function s(x) {
  return String(x || "").trim();
}
function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/shop");
}

/* =========================
   bottom nav real
========================= */
const bottomNavH = ref(76);
const rootStyle = computed(() => ({
  "--ml-bottom-nav-h": `${bottomNavH.value}px`,
}));

let ro = null;

function findBottomNavEl() {
  return (
    document.querySelector("[data-shop-bottom-nav]") ||
    document.querySelector(".shop-bottom-nav") ||
    document.querySelector(".ml-bottomnav") ||
    document.querySelector(".ml-bottom-nav") ||
    document.querySelector("footer .v-bottom-navigation") ||
    document.querySelector(".v-bottom-navigation") ||
    null
  );
}

function measureBottomNav() {
  const el = findBottomNavEl();
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const h = Math.round(rect.height || 0);
  if (h >= 48 && h <= 180) bottomNavH.value = h;
}

function setupBottomNavObserver() {
  const el = findBottomNavEl();
  if (!el) return;

  try {
    ro?.disconnect?.();
  } catch {}

  ro = new ResizeObserver(() => measureBottomNav());
  ro.observe(el);
}

/* =========================
   viewport / active
========================= */
function viewportH() {
  return Math.max(1, window.innerHeight || 1);
}

function currentIndexFromScroll() {
  const el = feedEl.value;
  if (!el) return 0;
  return clamp(Math.round(el.scrollTop / viewportH()), 0, Math.max(0, items.value.length - 1));
}

function setActiveByIndex(idx) {
  const it = items.value?.[idx];
  if (!it?.key) return;

  if (activeKey.value !== it.key) {
    activeKey.value = it.key;
    activeImgBroken.value = false;
  }
}

function scrollToIndex(idx, behavior = "smooth") {
  const el = feedEl.value;
  if (!el) return;
  el.scrollTo({
    top: idx * viewportH(),
    behavior,
  });
}

function activateByKey(key) {
  const idx = items.value.findIndex((x) => x?.key === key);
  if (idx < 0) return;

  isSettled.value = false;
  setActiveByIndex(idx);
  scrollToIndex(idx, "smooth");
}

/* =========================
   scroll settle
========================= */
let scrollRaf = 0;
let settleTimer = 0;

function onScroll() {
  isSettled.value = false;

  if (scrollRaf) return;
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = 0;

    const idx = currentIndexFromScroll();
    setActiveByIndex(idx);

    const el = feedEl.value;
    if (el) {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1400;
      if (nearBottom) fetchMore();
    }

    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      const finalIdx = currentIndexFromScroll();
      setActiveByIndex(finalIdx);

      // ✅ corrige que quede entre slides
      scrollToIndex(finalIdx, "smooth");

      window.setTimeout(() => {
        isSettled.value = true;
      }, 120);
    }, 120);
  });
}

/* =========================
   active item / player position
========================= */
const activeIndex = computed(() => {
  const idx = items.value.findIndex((x) => x?.key === activeKey.value);
  return idx >= 0 ? idx : 0;
});

const activeItem = computed(() => items.value?.[activeIndex.value] || null);

const playerStyle = computed(() => {
  const top = activeIndex.value * viewportH();
  return {
    transform: `translate3d(0, ${top}px, 0)`,
  };
});

watch(
  () => [activeKey.value, muted.value, isSettled.value],
  () => {
    if (!activeItem.value?.key || !isSettled.value) return;
    iframeKey.value = `if_${activeItem.value.key}_${muted.value ? 1 : 0}_${Date.now()}`;
  }
);

/* =========================
   sonido / share
========================= */
function toggleMute() {
  muted.value = !muted.value;
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

/* =========================
   youtube embed
========================= */
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
    for (const [k, v] of Object.entries(paramsObj)) {
      u.searchParams.set(k, String(v));
    }
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

  return addParams(base, {
    autoplay: 1,
    mute: muted.value ? 1 : 0,
  });
}

/* =========================
   precios
========================= */
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
  return l > 0 ? l : toNum(p?.price);
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

/* =========================
   imagen producto
========================= */
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

const activeImgBroken = ref(false);

const activeProduct = computed(() => resolvedProduct(activeItem.value));
const activeProductImg = computed(() => {
  if (!activeItem.value || activeImgBroken.value) return "";
  const raw = pickFirstImageCandidate(activeItem.value);
  return raw ? resolveUrl(raw) : "";
});

function onActiveImgError() {
  activeImgBroken.value = true;
}

/* =========================
   comprar / navegación
========================= */
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
  router.push({
    name: "shopProduct",
    params: { id: String(productId) },
    query: { branch_id },
  });
}

/* =========================
   fetch
========================= */
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

    const take = clamp(Number(import.meta?.env?.VITE_PUBLIC_VIDEOS_FEED_PAGE_SIZE || 7), 5, 12);
    const r = await publicVideosFeed({ limit: take, offset: 0 });

    const list = Array.isArray(r?.data) ? r.data : Array.isArray(r?.items) ? r.items : [];
    items.value = list.map(normalizeItem).filter((x) => x.url);

    offset.value = items.value.length;
    hasMore.value = Boolean(r?.meta?.has_more) && items.value.length < HARD_MAX.value;

    if (items.value?.[0]?.key) {
      activeKey.value = items.value[0].key;
    }
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
    const take = clamp(Number(import.meta?.env?.VITE_PUBLIC_VIDEOS_FEED_PAGE_SIZE || 7), 5, 12);
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

onMounted(async () => {
  await fetchFirstPage();
  await nextTick();

  measureBottomNav();
  setupBottomNavObserver();

  activeImgBroken.value = false;
  isSettled.value = true;

  window.addEventListener("resize", measureBottomNav, { passive: true });
});

onBeforeUnmount(() => {
  clearTimeout(settleTimer);
  if (scrollRaf) cancelAnimationFrame(scrollRaf);

  window.removeEventListener("resize", measureBottomNav);

  try {
    ro?.disconnect?.();
  } catch {}
  ro = null;
});
</script>

<style scoped>
.clips {
  background: #000;
  color: #fff;
  min-height: 100svh;
  min-height: 100dvh;
  overflow: hidden;
  position: relative;
}

/* top */
.clips-top {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 80;
  pointer-events: none;
  height: calc(10px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
}

.clips-back {
  pointer-events: auto;
  position: absolute;
  left: 12px;
  top: calc(8px + env(safe-area-inset-top));
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  color: #111;
  display: grid;
  place-items: center;
  backdrop-filter: blur(8px);
}

/* states */
.clips-alert {
  margin: calc(14px + 44px + env(safe-area-inset-top)) 12px 12px;
  position: relative;
  z-index: 90;
}

.clips-loading {
  min-height: 100svh;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  gap: 10px;
}

/* feed */
.clips-feed {
  height: 100svh;
  height: 100dvh;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  position: relative;
  z-index: 1;
  touch-action: pan-y;
}
.clips-feed::-webkit-scrollbar {
  display: none;
}

.clip {
  position: relative;
  height: 100svh;
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

.clip-stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #000;
}

.clip-thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  background: #000;
}

.clip-thumbEmpty {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  opacity: 0.7;
  background: linear-gradient(180deg, #171717, #060606);
}

.clip-playGhost {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 4;
  pointer-events: none;
}

.clip-play-ring {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #111;
  display: grid;
  place-items: center;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.34);
}

.clip-playerGlobal {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 100svh;
  height: 100dvh;
  z-index: 6;
  overflow: hidden;
  will-change: transform;
  pointer-events: none; /* ✅ CLAVE */
}

.clip-iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #000;
  pointer-events: none; /* ✅ CLAVE */
}

.clip-iframe--ytCover {
  left: 50% !important;
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  width: 100% !important;
  height: 100% !important;
  transform-origin: center center !important;
  transform: translate(-50%, -50%) scale(1.28) !important;
}

.clip-shadowTop {
  position: absolute;
  inset: 0 0 auto 0;
  height: 140px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0));
  pointer-events: none;
  z-index: 7;
}

.clip-shadowBottom {
  position: absolute;
  inset: auto 0 0 0;
  height: 270px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
  pointer-events: none;
  z-index: 7;
}

/* acciones */
.clip-actions {
  position: fixed;
  right: 12px;
  bottom: calc(var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom) + 146px);
  display: grid;
  gap: 10px;
  z-index: 95;
}

.clip-action {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.38);
  color: #fff;
  display: grid;
  place-items: center;
  backdrop-filter: blur(10px);
}

.clip-hint {
  position: fixed;
  left: 50%;
  bottom: calc(var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom) + 162px);
  transform: translateX(-50%);
  font-size: 12px;
  line-height: 1;
  padding: 10px 14px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 96;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  pointer-events: none;
}

/* card global fija */
.pbar {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom) + 16px);
  z-index: 97;

  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: center;

  background: rgba(255, 255, 255, 0.97);
  color: #111;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 18px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.24);
  padding: 10px;
  backdrop-filter: blur(10px);
}

.pbar--empty {
  grid-template-columns: 1fr;
}

.pbar-left {
  border: 0;
  background: transparent;
  padding: 0;
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.pbar-img {
  width: 54px;
  height: 54px;
  border-radius: 14px;
  overflow: hidden;
  background: #f2f2f2;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.pbar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.pbar-imgEmpty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  font-size: 11px;
  opacity: 0.6;
}

.pbar-mid {
  min-width: 0;
}

.pbar-title {
  font-size: 12px;
  line-height: 1.18;
  font-weight: 900;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pbar-priceRow {
  margin-top: 4px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.pbar-price {
  font-size: 14px;
  line-height: 1;
  font-weight: 950;
}

.pbar-off {
  font-size: 11px;
  line-height: 1;
  font-weight: 950;
  color: #00a650;
}

.pbar-old {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1;
  opacity: 0.64;
  text-decoration: line-through;
}

.pbar-go {
  width: 46px;
  height: 46px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: #2d7ff9;
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 20px rgba(45, 127, 249, 0.24);
}

/* more */
.clips-more {
  padding: 18px 12px calc(18px + var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom));
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  background: #0b0f16;
  color: #fff;
}

/* mobile */
@media (max-width: 420px) {
  .clip-actions {
    right: 10px;
    bottom: calc(var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom) + 138px);
  }

  .clip-hint {
    bottom: calc(var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom) + 154px);
    font-size: 11px;
    padding: 9px 12px;
  }

  .pbar {
    left: 10px;
    right: 10px;
    bottom: calc(var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom) + 12px);
    border-radius: 16px;
    padding: 9px;
  }

  .pbar-left {
    grid-template-columns: 50px minmax(0, 1fr);
    gap: 9px;
  }

  .pbar-img {
    width: 50px;
    height: 50px;
    border-radius: 12px;
  }

  .pbar-title {
    font-size: 11.5px;
  }

  .pbar-price {
    font-size: 13px;
  }

  .pbar-go {
    width: 42px;
    height: 42px;
  }
}
</style>