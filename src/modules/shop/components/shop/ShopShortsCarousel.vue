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
        <div class="text-caption" style="opacity: 0.75">Cargando videos…</div>
      </div>

      <div v-else-if="items.length === 0" class="py-6 text-center text-caption" style="opacity: 0.75">
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

        <div
          ref="stripEl"
          class="shc-strip"
          role="region"
          aria-label="Videos cortos"
          @scroll.passive="onStripScroll"
        >
          <div v-for="it in items" :key="it.key" class="shc-item">
            <div
              class="shc-frame"
              :style="{
                '--shc-cardw': cardW + 'px',
                '--shc-vh': videoH + 'px',
              }"
            >
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
                      <v-icon size="24">mdi-play</v-icon>
                    </div>
                  </div>
                </button>

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
                  <div class="text-caption" style="opacity: 0.65">—</div>
                </div>
              </div>
            </div>
          </div>
          <!-- NO agrego UI nueva para “loading more” -->
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { publicVideosFeed } from "@/modules/shop/service/shop.videos.public.api.js";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";

const props = defineProps({
  limit: { type: Number, default: 200 },
  pageSize: { type: Number, default: 16 },
});

const HARD_MAX = computed(() => {
  const v = Number(String(import.meta?.env?.VITE_PUBLIC_VIDEOS_FEED_MAX ?? "200"));
  return Number.isFinite(v) && v > 0 ? v : 200;
});

const EFFECTIVE_TOTAL = computed(() => {
  let lim = Number(String(props.limit ?? 0));
  if (!Number.isFinite(lim) || lim < 1) lim = 200;
  if (lim > HARD_MAX.value) lim = HARD_MAX.value;
  return Math.floor(lim);
});

const EFFECTIVE_PAGE = computed(() => {
  let p = Number(String(props.pageSize ?? 0));
  if (!Number.isFinite(p) || p < 8) p = 16;
  if (p > 60) p = 60;
  return Math.floor(p);
});

const router = useRouter();
const route = useRoute();
const cart = useShopCartStore();

const loading = ref(false);
const error = ref("");

const items = ref([]);
const stripEl = ref(null);

const cardW = ref(240);
const videoH = ref(427);

const activePlayKey = ref("");
let ro = null;

const brokenByKey = ref({});

// paging state
const offset = ref(0);
const hasMore = ref(true);
const loadingMore = ref(false);

// ✅ Abort/timeout para que NUNCA quede “loading” eterno
let aborter = null;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function updateSizing() {
  const w = stripEl.value?.clientWidth || 0;

  if (w >= 1200) cardW.value = 240;
  else if (w >= 900) cardW.value = 232;
  else if (w >= 700) cardW.value = 224;
  else cardW.value = clamp(w - 44, 238, 276);

  videoH.value = clamp(Math.round(cardW.value * (16 / 9)), 360, 490);
}

function stepPx() {
  return cardW.value + 10;
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

/* ===================== YOUTUBE ===================== */
function s(x) {
  return String(x || "").trim();
}
function isYouTube(u) {
  const t = s(u);
  return /youtube\.com|youtu\.be/i.test(t);
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
        : prod.images[0]?.url ||
          prod.images[0]?.image_url ||
          prod.images[0]?.src ||
          prod.images[0]?.path
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

/* ===== branch resolver (✅ NO hardcode 3) ===== */
function getBranchIdForLinks() {
  // 1) query actual
  const q = s(route.query.branch_id);
  const qn = Number(q);
  if (Number.isFinite(qn) && qn > 0) return String(qn);

  // 2) localStorage (misma key que tu shop.public.api.js)
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem("shop_branch_id") : "";
    const bid = Number(String(raw || "").trim());
    if (Number.isFinite(bid) && bid > 0) return String(bid);
  } catch {}

  // 3) fallback Casa Central
  return "1";
}

function goProduct(productId) {
  const branch_id = getBranchIdForLinks();
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

/* =========================
   ✅ SAFE REQUEST (timeout + abort + retry + fallback sin offset)
========================= */
function abortInFlight() {
  try {
    if (aborter) aborter.abort();
  } catch {}
  aborter = null;
}

async function safeFeedRequest({ limit, offset }) {
  abortInFlight();
  aborter = new AbortController();

  // timeout real
  const TIMEOUT_MS = 8000;
  const t = setTimeout(() => {
    try {
      aborter?.abort();
    } catch {}
  }, TIMEOUT_MS);

  try {
    // 1) intento con offset
    return await publicVideosFeed({ limit, offset, signal: aborter.signal });
  } finally {
    clearTimeout(t);
  }
}

function parseFeedPayload(r) {
  // soporta {items}, {data}, {ok:true,items}, etc.
  const list =
    Array.isArray(r?.data) ? r.data :
    Array.isArray(r?.items) ? r.items :
    Array.isArray(r?.data?.items) ? r.data.items :
    Array.isArray(r?.data?.data) ? r.data.data :
    Array.isArray(r?.data?.items) ? r.data.items :
    [];

  const meta = r?.meta || r?.data?.meta || r?.data?.pagination || null;
  return { list, meta };
}

async function fetchFirstPage() {
  loading.value = true;
  error.value = "";
  try {
    offset.value = 0;
    hasMore.value = true;

    const take = Math.min(EFFECTIVE_PAGE.value, EFFECTIVE_TOTAL.value);

    let r = null;

    // intento 1
    try {
      r = await safeFeedRequest({ limit: take, offset: 0 });
    } catch (e) {
      // fallback: si el backend no soporta offset, reintento sin offset
      try {
        abortInFlight();
        r = await publicVideosFeed({ limit: take });
      } catch (e2) {
        throw e2 || e;
      }
    }

    const { list, meta } = parseFeedPayload(r);

    items.value = (list || []).map(normalizeItem).filter((x) => x.url);

    offset.value = items.value.length;
    hasMore.value = Boolean(meta?.has_more) && items.value.length < EFFECTIVE_TOTAL.value;
  } catch (e) {
    const msg =
      e?.name === "AbortError"
        ? "Timeout cargando videos (revisar proxy/edge)."
        : e?.message || "No se pudieron cargar los videos";
    error.value = msg;
    items.value = [];
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

async function fetchMore() {
  if (loadingMore.value) return;
  if (!hasMore.value) return;

  if (items.value.length >= EFFECTIVE_TOTAL.value) {
    hasMore.value = false;
    return;
  }

  loadingMore.value = true;
  try {
    const remaining = EFFECTIVE_TOTAL.value - items.value.length;
    const take = Math.max(8, Math.min(EFFECTIVE_PAGE.value, remaining));

    let r = null;
    try {
      r = await safeFeedRequest({ limit: take, offset: offset.value });
    } catch {
      abortInFlight();
      r = await publicVideosFeed({ limit: take }); // fallback sin offset
    }

    const { list, meta } = parseFeedPayload(r);
    const next = (list || []).map(normalizeItem).filter((x) => x.url);

    const seen = new Set(items.value.map((x) => String(x.id || x.key)));
    const dedup = next.filter((x) => !seen.has(String(x.id || x.key)));

    items.value = items.value.concat(dedup);

    offset.value = offset.value + next.length;
    hasMore.value = Boolean(meta?.has_more) && next.length > 0 && items.value.length < EFFECTIVE_TOTAL.value;
  } finally {
    loadingMore.value = false;
  }
}

function onStripScroll() {
  const el = stripEl.value;
  if (!el) return;
  const nearEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 420;
  if (nearEnd) fetchMore();
}

onMounted(async () => {
  await fetchFirstPage();
  await nextTick();
  updateSizing();

  ro = new ResizeObserver(updateSizing);
  if (stripEl.value) ro.observe(stripEl.value);
});

onBeforeUnmount(() => {
  abortInFlight();
  try {
    if (ro && stripEl.value) ro.unobserve(stripEl.value);
  } catch {}
  ro = null;
});

watch(
  () => [props.limit, props.pageSize],
  async () => {
    activePlayKey.value = "";
    brokenByKey.value = {};
    await fetchFirstPage();
    await nextTick();
    updateSizing();
  }
);
</script>

<style scoped>
/* CARD GENERAL */
.shc-card{
  border-radius:18px;
  background:#f3f6fb;
  border:1px solid rgba(0,0,0,.05);
  overflow:visible;
}

/* HEADER */
.shc-head{
  padding:12px 12px 10px;
  background:linear-gradient(180deg,#ffffff,#f6f8fb);
  border-bottom:1px solid rgba(0,0,0,.05);
}

/* BODY */
.shc-body{
  padding:8px 10px 12px;
}

/* WRAP */
.shc-wrap{
  position:relative;
  overflow:visible;
  padding:0 52px;
}

/* STRIP */
.shc-strip{
  display:flex;
  gap:14px;
  overflow-x:auto;
  padding:12px 0 6px;
  scroll-snap-type:x mandatory;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
}

.shc-strip::-webkit-scrollbar{
  display:none;
}

.shc-item{
  flex:0 0 auto;
  scroll-snap-align:center;
}

/* CARD DE CADA SHORT */
.shc-frame{
  width:var(--shc-cardw,240px);
  border-radius:18px;
  background:#ffffff;
  overflow:hidden;
  border:1px solid rgba(0,0,0,.08);
  box-shadow:
    0 10px 26px rgba(0,0,0,.08),
    0 2px 6px rgba(0,0,0,.06);
  transition:.25s;
}

.shc-frame:hover{
  transform:translateY(-3px);
  box-shadow:
    0 18px 40px rgba(0,0,0,.12),
    0 4px 10px rgba(0,0,0,.08);
}

/* VIDEO */
.shc-video{
  height:var(--shc-vh,427px);
  background:linear-gradient(180deg,#111,#000);
  position:relative;
  border-bottom:1px solid rgba(255,255,255,.05);
}

/* THUMB */
.shc-thumbBtn{
  border:0;
  padding:0;
  width:100%;
  height:100%;
  background:#000;
  cursor:pointer;
  position:relative;
  overflow:hidden;
}

.shc-thumb{
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
  display:block;
  transform:scale(1.06);
}

.shc-thumbEmpty{
  height:100%;
  display:grid;
  place-items:center;
  font-size:12px;
  opacity:.6;
  color:#fff;
}

/* PLAY OVERLAY */
.shc-play{
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  background:linear-gradient(
    180deg,
    rgba(0,0,0,.05),
    rgba(0,0,0,.35)
  );
}

.shc-play-ring{
  width:56px;
  height:56px;
  border-radius:999px;
  background:#ffffff;
  display:grid;
  place-items:center;
  box-shadow:
    0 12px 24px rgba(0,0,0,.28);
}

/* IFRAME */
.shc-iframeWrap{
  position:relative;
  width:100%;
  height:100%;
  background:#000;
  overflow:hidden;
}

.shc-ytStage{
  position:relative;
  width:100%;
  height:100%;
  overflow:hidden;
}

.shc-iframe{
  position:absolute;
  inset:0;
  width:100%;
  height:100%;
  border:0;
  display:block;
}

.shc-iframe--ytCover{
  left:50%!important;
  top:50%!important;
  right:auto!important;
  bottom:auto!important;
  width:100%!important;
  height:100%!important;
  transform-origin:center center!important;
  transform:translate(-50%,-50%) scale(1.30)!important;
}

/* BARRA PRODUCTO */
.shc-prodBar{
  background:#ffffff;
  padding:10px 10px 12px;
  border-top:1px solid rgba(0,0,0,.06);
}

/* INFO PRODUCTO */
.prodInfo{
  width:100%;
  border:0;
  background:transparent;
  padding:0;
  cursor:pointer;
  display:grid;
  grid-template-columns:70px 1fr;
  gap:10px;
  align-items:center;
}

.prodImg{
  width:70px;
  height:70px;
  border-radius:14px;
  overflow:hidden;
  background:#f7f7f7;
  border:1px solid rgba(0,0,0,.08);
}

.prodImg img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.prodImgEmpty{
  height:100%;
  display:grid;
  place-items:center;
  font-size:11px;
  opacity:.55;
}

.prodMid{
  text-align:left;
  min-width:0;
}

.prodTitle{
  font-weight:900;
  font-size:11px;
  letter-spacing:.2px;
  text-transform:uppercase;
  line-height:1.15;
  color:#111;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
  overflow:hidden;
}

.prodPrices{
  margin-top:4px;
  display:flex;
  align-items:baseline;
  gap:8px;
  flex-wrap:wrap;
}

.prodPrice{
  font-size:14px;
  font-weight:900;
}

.prodOff{
  font-size:10px;
  font-weight:900;
  color:#00a650;
}

.prodOld{
  font-size:10px;
  opacity:.6;
  text-decoration:line-through;
}

/* BOTONES */
.prodCtas{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  margin-top:10px;
}

/* BOTON PRINCIPAL (marca) */
.ctaBuy{
  width:100%;
  border:none;
  border-radius:12px;
  padding:7px 8px;
  font-weight:900;
  font-size:11px;
  cursor:pointer;
  color:#fff;
  background:#02498b;
  box-shadow:0 6px 14px rgba(2,73,139,.28);
  transition:.2s;
}

.ctaBuy:hover{
  background:#013a6e;
}

/* BOTON SECUNDARIO */
.ctaCart{
  width:100%;
  border:1px solid rgba(0,0,0,.15);
  border-radius:12px;
  padding:7px 8px;
  font-weight:900;
  font-size:11px;
  cursor:pointer;
  color:#222;
  background:#f5f5f5;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:6px;
}

/* NAV */
.shc-nav{
  position:absolute;
  top:calc(var(--shc-vh,427px)/2);
  transform:translateY(-50%);
  background:#ffffff;
  border-radius:999px;
  box-shadow:0 12px 22px rgba(0,0,0,.18);
  z-index:10;
  opacity:.95;
}

.shc-nav-left{ left:10px }
.shc-nav-right{ right:10px }

/* MOBILE */
@media (max-width:600px){
  .shc-body{
    padding:8px 8px 12px;
  }

  .shc-wrap{
    padding:0 34px;
  }

  .shc-strip{
    gap:12px;
    padding:10px 0 6px;
  }

  .shc-frame{
    width:min(76vw, 286px);
    border-radius:18px;
  }

  .shc-video{
    height:clamp(392px, 76vw * 1.78, 488px);
  }

  .shc-prodBar{
    padding:10px 10px 12px;
  }

  .prodInfo{
    grid-template-columns:64px 1fr;
    gap:9px;
  }

  .prodImg{
    width:64px;
    height:64px;
    border-radius:13px;
  }

  .prodTitle{
    font-size:10.5px;
    line-height:1.14;
  }

  .prodPrice{
    font-size:13px;
  }

  .prodOff,
  .prodOld{
    font-size:9.5px;
  }

  .prodCtas{
    gap:7px;
    margin-top:9px;
  }

  .ctaBuy,
  .ctaCart{
    font-size:10.5px;
    padding:7px 8px;
    border-radius:11px;
  }

  .shc-nav{
    width:38px !important;
    height:38px !important;
    min-width:38px !important;
    top:calc(var(--shc-vh,427px)/2);
  }

  .shc-nav-left{
    left:4px;
  }

  .shc-nav-right{
    right:4px;
  }

  .shc-iframe--ytCover{
    transform:translate(-50%,-50%) scale(1.34)!important;
  }
}

@media (max-width:420px){
  .shc-wrap{
    padding:0 30px;
  }

  .shc-frame{
    width:min(78vw, 292px);
  }

  .shc-video{
    height:clamp(396px, 78vw * 1.78, 500px);
  }

  .shc-nav{
    width:36px !important;
    height:36px !important;
    min-width:36px !important;
  }

  .shc-nav-left{
    left:2px;
  }

  .shc-nav-right{
    right:2px;
  }
}
</style>