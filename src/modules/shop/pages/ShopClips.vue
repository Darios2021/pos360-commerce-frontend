<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopClips.vue -->
<template>
  <div class="clips" data-page="shop-clips" :style="rootStyle">
    <!-- ✅ Top minimal (solo flecha, sin barra alta) -->
    <header class="clips-top" aria-label="Clips topbar">
      <button class="clips-back" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>
    </header>

    <!-- estados -->
    <v-alert v-if="error" type="error" variant="tonal" class="clips-alert">
      {{ error }}
    </v-alert>

    <div v-if="loading" class="clips-loading">
      <v-progress-circular indeterminate />
      <div class="text-caption" style="opacity: 0.8">Cargando clips…</div>
    </div>

    <!-- FEED vertical (snap 1x1 tipo IG) -->
    <main
      v-else
      ref="feedEl"
      class="clips-feed"
      role="region"
      aria-label="Clips"
      @scroll.passive="onFeedScroll"
      @wheel.prevent="onWheel"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <section v-for="it in items" :key="it.key" class="clip" :data-key="it.key">
        <!-- VIDEO AREA -->
        <div class="clip-stage">
          <!-- ✅ SOLO 1 IFRAME (el activo). El resto queda en thumb -->
          <button
            v-if="activePlayKey !== it.key"
            class="clip-thumbBtn"
            type="button"
            @click="activateByKey(it.key)"
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

          <div v-else class="clip-iframeWrap" @click="toggleMute" :title="muted ? 'Activar sonido' : 'Silenciar'">
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

            <!-- hint sonido (como referencia) -->
            <div class="clip-hint" v-if="muted">
              Tocá para activar el sonido
            </div>
          </div>

          <!-- ✅ acciones derecha: SOLO sonido + compartir -->
          <div class="clip-actions" aria-label="Acciones">
            <button
              class="clip-action"
              type="button"
              @click="toggleMute"
              :title="muted ? 'Activar sonido' : 'Silenciar'"
              aria-label="Sonido"
            >
              <v-icon size="22">{{ muted ? "mdi-volume-off" : "mdi-volume-high" }}</v-icon>
            </button>

            <button class="clip-action" type="button" @click="share(it)" title="Compartir" aria-label="Compartir">
              <v-icon size="22">mdi-share-variant</v-icon>
            </button>
          </div>

          <!-- ✅ Card sutil tipo ML (ÚNICA compra) -->
          <div v-if="resolvedProduct(it)?.id" class="pbar" aria-label="Producto">
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

            <!-- ✅ CTA: icono comprar -->
            <button class="pbar-go" type="button" @click="buyNow(it)" title="Comprar" aria-label="Comprar">
              <v-icon size="18">mdi-lightning-bolt</v-icon>
            </button>
          </div>

          <div v-else class="pbar pbar--empty">
            <div class="pbar-mid">
              <div class="pbar-title">Producto no disponible</div>
              <div class="text-caption" style="opacity: 0.7">—</div>
            </div>
          </div>
        </div>
      </section>

      <div v-if="loadingMore" class="clips-more">
        <v-progress-circular indeterminate size="18" />
        <span class="text-caption" style="opacity: 0.75">Cargando más…</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
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
function s(x) {
  return String(x || "").trim();
}

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/shop");
}

/* =========================
   ✅ medir el mini footer real
========================= */
const bottomNavH = ref(76); // fallback más real que 64
const rootStyle = computed(() => ({
  "--ml-bottom-nav-h": `${bottomNavH.value}px`,
}));

let ro = null;

function findBottomNavEl() {
  // probamos varios selectores típicos
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
  if (h >= 48 && h <= 140) bottomNavH.value = h;
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
   ✅ SNAP 1x1 (tipo IG)
========================= */
const snapping = ref(false);
let snapUnlockT = null;

function viewportH() {
  return Math.max(1, window.innerHeight || 1);
}
function currentIndex() {
  const el = feedEl.value;
  if (!el) return 0;
  return Math.round(el.scrollTop / viewportH());
}
function maxIndex() {
  return Math.max(0, (items.value?.length || 1) - 1);
}
function scrollToIndex(i) {
  const el = feedEl.value;
  if (!el) return;

  const idx = clamp(i, 0, maxIndex());
  snapping.value = true;

  el.scrollTo({ top: idx * viewportH(), behavior: "smooth" });

  clearTimeout(snapUnlockT);
  snapUnlockT = setTimeout(() => {
    snapping.value = false;
    activateByIndex(idx);
  }, 260);
}

function activateByIndex(idx) {
  const it = items.value?.[idx];
  if (!it?.key) return;
  activePlayKey.value = it.key;
}

function activateByKey(key) {
  activePlayKey.value = key;
  const idx = items.value.findIndex((x) => x?.key === key);
  if (idx >= 0) scrollToIndex(idx);
}

/* wheel: 1 por 1 */
let wheelLock = false;
let wheelT = null;
function onWheel(e) {
  if (wheelLock || snapping.value) return;
  wheelLock = true;

  const dy = e?.deltaY || 0;
  const dir = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  if (dir !== 0) scrollToIndex(currentIndex() + dir);

  clearTimeout(wheelT);
  wheelT = setTimeout(() => (wheelLock = false), 240);
}

/* touch swipe: 1 por 1 */
let touchY = 0;
function onTouchStart(ev) {
  touchY = ev?.changedTouches?.[0]?.clientY ?? 0;
}
function onTouchEnd(ev) {
  if (snapping.value) return;
  const endY = ev?.changedTouches?.[0]?.clientY ?? 0;
  const dy = touchY - endY;

  if (Math.abs(dy) < 35) return;
  const dir = dy > 0 ? 1 : -1;
  scrollToIndex(currentIndex() + dir);
}

/* scroll settle */
let settleT = null;
function onFeedScroll() {
  const el = feedEl.value;
  if (!el) return;

  const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 900;
  if (nearBottom) fetchMore();

  if (snapping.value) return;

  clearTimeout(settleT);
  settleT = setTimeout(() => {
    const idx = currentIndex();
    el.scrollTo({ top: idx * viewportH(), behavior: "smooth" });
    activateByIndex(idx);
  }, 140);
}

/* =========================
   Sonido / Share
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
   YouTube embed
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

/* =========================
   Precios
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

/* =========================
   Imagen producto
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

/* =========================
   Comprar
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
  router.push({ name: "shopProduct", params: { id: String(productId) }, query: { branch_id } });
}

/* =========================
   Fetch clips
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

  // ✅ medimos bottom nav (y lo seguimos)
  measureBottomNav();
  setupBottomNavObserver();

  window.addEventListener("resize", measureBottomNav, { passive: true });

  // ✅ arranca en el primer clip
  scrollToIndex(0);
});

onBeforeUnmount(() => {
  clearTimeout(settleT);
  clearTimeout(wheelT);
  clearTimeout(snapUnlockT);

  window.removeEventListener("resize", measureBottomNav);

  try {
    ro?.disconnect?.();
  } catch {}
  ro = null;
});
</script>

<style scoped>
/* Base full screen */
.clips {
  background: #0b0f16;
  color: #fff;
  min-height: 100dvh;
}

/* Top minimal */
.clips-top {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(10px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  z-index: 60;
  pointer-events: none;
}
.clips-back {
  pointer-events: auto;
  position: absolute;
  left: 10px;
  top: calc(6px + env(safe-area-inset-top));
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.22);
  color: #fff;
  display: grid;
  place-items: center;
  backdrop-filter: blur(8px);
}

/* alerts/loading */
.clips-alert {
  margin: calc(12px + 44px + env(safe-area-inset-top)) 12px 12px;
}
.clips-loading {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  gap: 10px;
}

/* ✅ feed snap 1x1
   ✅ padding-bottom para que nunca “pise” la card/footer */
.clips-feed {
  height: 100dvh;
  overflow-y: auto;
  overscroll-behavior: contain;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  padding-bottom: calc(var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom));
}
.clips-feed::-webkit-scrollbar {
  display: none;
}

.clip {
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  position: relative;
}

.clip-stage {
  position: absolute;
  inset: 0;
  background: #000;
}

/* thumb */
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
  transform: scale(1.03);
  display: block;
}
.clip-thumbEmpty {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  opacity: 0.7;
}

.clip-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at center, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.32));
}
.clip-play-ring {
  width: 62px;
  height: 62px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  display: grid;
  place-items: center;
  color: #111;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.35);
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

/* actions right (siempre arriba de card + footer) */
.clip-actions {
  position: absolute;
  right: 10px;
  bottom: calc(var(--ml-bottom-nav-h, 76px) + 126px + env(safe-area-inset-bottom));
  display: grid;
  gap: 10px;
  z-index: 7;
}
.clip-action {
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.34);
  color: #fff;
  display: grid;
  place-items: center;
}

/* hint sound (sube con el footer) */
.clip-hint {
  position: absolute;
  left: 50%;
  bottom: calc(var(--ml-bottom-nav-h, 76px) + 150px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  font-size: 12px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.12);
  z-index: 8;
}

/* ✅ Card ML (NUNCA tapa el footer) */
.pbar {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: calc(var(--ml-bottom-nav-h, 76px) + 10px + env(safe-area-inset-bottom));
  z-index: 10;

  background: rgba(255, 255, 255, 0.96);
  color: #111;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2);

  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 8px 8px;
}

.pbar--empty {
  grid-template-columns: 1fr;
}

.pbar-left {
  border: 0;
  background: transparent;
  padding: 0;
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 10px;
  align-items: center;
  text-align: left;
  cursor: pointer;
  min-width: 0;
}

.pbar-img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  background: #f2f2f2;
  border: 1px solid rgba(0, 0, 0, 0.08);
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
  font-weight: 900;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pbar-priceRow {
  margin-top: 3px;
  display: flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
}
.pbar-price {
  font-weight: 950;
  font-size: 15px;
}
.pbar-off {
  font-weight: 950;
  font-size: 11px;
  color: #00a650;
}
.pbar-old {
  margin-top: 2px;
  font-size: 11px;
  opacity: 0.65;
  text-decoration: line-through;
}

.pbar-go {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: #2d7ff9;
  color: #fff;
  display: grid;
  place-items: center;
  box-shadow: 0 10px 18px rgba(45, 127, 249, 0.22);
}

/* loader more */
.clips-more {
  padding: 14px 12px calc(14px + var(--ml-bottom-nav-h, 76px) + env(safe-area-inset-bottom));
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  background: #0b0f16;
  color: #fff;
}
</style>
