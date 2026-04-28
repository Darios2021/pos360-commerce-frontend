<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/PromoSliderCargadores.vue -->
<template>
  <section class="promo-shell">
    <div class="promo-inner">
      <!-- Header -->
      <div class="promo-head">
        <div class="promo-head-left">
          <div class="promo-title">{{ title }}</div>
          <div class="promo-sub">{{ subtitle }}</div>
        </div>

        <v-btn v-if="showSeeAll" variant="text" class="promo-more" @click="goSeeAll">
          Ver todos
        </v-btn>
      </div>

      <v-divider class="promo-divider" />

      <!-- Body -->
      <div class="promo-body">
        <div v-if="loading" class="promo-skel">
          <div v-for="n in 6" :key="n">
            <v-skeleton-loader type="image, article" />
          </div>
        </div>

        <v-alert v-else-if="error" type="error" variant="tonal" class="mb-2">
          No se pudieron cargar cargadores: {{ error }}
        </v-alert>

        <v-alert v-else-if="!items.length" type="info" variant="tonal" class="mb-2">
          No hay cargadores para mostrar.
        </v-alert>

        <v-slide-group v-else v-model="model" show-arrows class="promo-slide" :mandatory="false">
          <v-slide-group-item
            v-for="(p, idx) in items"
            :key="p.product_id ?? p.id ?? idx"
            v-slot="{ toggle }"
          >
            <div class="promo-item">
              <button class="promo-card" type="button" @click="toggle(); open(p)">
                <div class="promo-img">
                  <img :src="imgOf(p)" alt="" loading="lazy" @error="onImgError($event)" />
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

                  <div class="promo-name">{{ p.name }}</div>

                  <div class="promo-meta">
                    {{ p.category_name || "—" }}
                    <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                  </div>

                  <div class="promo-free" v-if="freeShip(p)">Envío gratis</div>
                </div>
              </button>
            </div>
          </v-slide-group-item>
        </v-slide-group>

        <!-- Puntitos -->
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { isPromoActive } from "@/modules/shop/utils/promo";

const props = defineProps({
  // textos
  title: { type: String, default: "Cargadores destacados" },
  subtitle: { type: String, default: "Rápidos, originales y recomendados" },

  // ui
  perPage: { type: Number, default: 5 },
  showSeeAll: { type: Boolean, default: false },

  // búsqueda robusta
  search: { type: String, default: "cargador" },
  strict: { type: [Number, String, Boolean], default: 1 },
  excludeTerms: {
    type: String,
    default: "auriculares,parlantes,audio,televisor,tv,mouse,teclado",
  },

  // control de cantidad
  limit: { type: Number, default: 40 },

  // timeout+retry (para evitar ECONNABORTED)
  timeoutMs: { type: Number, default: 45000 },
  retries: { type: Number, default: 1 },

  // fallback imagen
  fallbackImg: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80",
  },
});

const router = useRouter();

const model = ref(0);
const loading = ref(false);
const error = ref("");
const items = ref([]);

/** ✅ axios local (no depende del timeout 20000 del api global) */
function trimSlashesEnd(s) {
  return String(s || "").replace(/\/+$/, "");
}
function normalizeApiV1Base(input) {
  let s = trimSlashesEnd(input);
  if (!s) return "/api/v1";

  if (s.startsWith("/")) {
    if (/^\/api$/i.test(s)) return "/api/v1";
    if (/^\/api\/v\d+$/i.test(s)) return s;
    if (/\/api\/v\d+/i.test(s)) return s;
    return s;
  }

  try {
    const u = new URL(s);
    const p = trimSlashesEnd(u.pathname || "");
    if (/^\/api$/i.test(p)) {
      u.pathname = "/api/v1";
      return trimSlashesEnd(u.toString());
    }
    if (/\/api\/v\d+/i.test(p)) return trimSlashesEnd(u.toString());
    return trimSlashesEnd(u.origin + "/api/v1");
  } catch {
    return "/api/v1";
  }
}
function buildPublicBase(apiV1Base) {
  return `${trimSlashesEnd(apiV1Base)}/public`;
}

const baseRaw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
let basePath = normalizeApiV1Base(baseRaw);
if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();
  const sameOrigin =
    String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim() === "1" ||
    String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim().toLowerCase() === "true";

  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com" || sameOrigin) {
    basePath = "/api/v1";
  }
  basePath = normalizeApiV1Base(basePath);
}

const api = axios.create({
  baseURL: buildPublicBase(basePath), // .../api/v1/public
  timeout: Math.max(5000, Number(props.timeoutMs || 45000)),
});

// anti-preflight headers
api.interceptors.request.use((config) => {
  const h = config.headers || {};
  delete h["Cache-Control"];
  delete h["cache-control"];
  delete h["Pragma"];
  delete h["pragma"];
  config.headers = h;
  return config;
});

/* ===== utils ===== */
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
function badgeText(p) {
  if (isPromoActive(p)) return "OFERTA";
  if (toNum(p?.price_discount) > 0) return "DESCUENTO";
  if (p?.is_new) return "NUEVO";
  return "";
}
function freeShip(p) {
  return Boolean(p?.free_shipping) || Boolean(p?.is_free_shipping);
}
function imgOf(p) {
  const first =
    p?.image_url ||
    p?.image ||
    p?.thumbnail_url ||
    (Array.isArray(p?.images)
      ? typeof p.images[0] === "string"
        ? p.images[0]
        : p.images[0]?.url
      : "") ||
    "";
  return first || props.fallbackImg;
}
function onImgError(e) {
  try {
    const el = e?.target;
    if (el && el.src !== props.fallbackImg) el.src = props.fallbackImg;
  } catch {}
}

function open(p) {
  const id = p?.product_id ?? p?.id;
  if (!id) return;
  router.push({ name: "shopProduct", params: { id: String(id) } });
}

function goSeeAll() {
  router.push({ name: "shopHome", query: { q: String(props.search || "cargador") } });
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseAxiosErr(e) {
  if (e?.code === "ECONNABORTED") return "Timeout (API lenta). Probá de nuevo.";
  if (e?.response?.status) return `${e.response.status} ${e.response.statusText || ""}`.trim();
  return e?.message || String(e);
}

/** ✅ Fetch robusto por texto (no taxonomy) */
async function fetchChargers() {
  loading.value = true;
  error.value = "";
  items.value = [];

  const limit = Math.max(1, Math.min(120, Number(props.limit || 40)));
  const strict_search =
    props.strict === true || String(props.strict) === "1" || String(props.strict).toLowerCase() === "true" ? 1 : 0;

  const tries = [
    { search: String(props.search || "cargador"), strict_search },
    { search: "cargadores", strict_search: 1 },
    { search: "charger", strict_search: 1 },
    { search: "cargador usb", strict_search: 1 },
  ];

  const exclude_terms = String(props.excludeTerms || "").trim();

  let lastErr = "";

  try {
    for (let t = 0; t < tries.length; t++) {
      const q = tries[t];

      for (let attempt = 0; attempt <= Math.max(0, Number(props.retries || 0)); attempt++) {
        try {
          const r = await api.get("/catalog", {
            params: {
              page: 1,
              limit,
              search: q.search,
              strict_search: q.strict_search,
              exclude_terms: exclude_terms || undefined,
            },
          });

          const list = Array.isArray(r.data?.items) ? r.data.items : [];
          if (list.length) {
            items.value = list;
            model.value = 0;
            return;
          }

          // si no hay resultados, probamos siguiente búsqueda
          break;
        } catch (e) {
          lastErr = parseAxiosErr(e);

          // retry con backoff
          if (attempt < Math.max(0, Number(props.retries || 0))) {
            await sleep(450 + attempt * 350);
            continue;
          }

          // si fue timeout o red, probamos la próxima "query" también
          break;
        }
      }
    }

    // si llegamos acá, no encontramos nada
    if (lastErr) error.value = lastErr;
  } finally {
    loading.value = false;
  }
}

/** Puntitos */
const dotIndex = computed(() => {
  const idx = Number(model.value ?? 0);
  return Math.max(0, Math.floor(idx / props.perPage));
});

const dotsCount = computed(() => {
  const n = items.value.length;
  if (!n) return 0;
  return Math.max(1, Math.ceil(n / props.perPage));
});

function jumpTo(pageIdx) {
  model.value = pageIdx * props.perPage;
}

onMounted(fetchChargers);

watch(
  () => [props.search, props.strict, props.excludeTerms, props.limit, props.timeoutMs, props.retries],
  () => fetchChargers()
);
</script>

<style scoped>
.promo-shell {
  width: 100%;
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
  font-weight: 500;
  letter-spacing: -0.2px;
  line-height: 1.1;
}

.promo-sub {
  font-size: 12px;
  opacity: 0.72;
}

.promo-more {
  font-weight: 500;
  opacity: 0.9;
}

.promo-divider {
  opacity: 0.65;
}

/* body */
.promo-body {
  padding: 10px 10px 10px;
}

/* skeleton grid */
.promo-skel {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}
@media (max-width: 1200px) {
  .promo-skel {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
@media (max-width: 960px) {
  .promo-skel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* ✅ Drag OK */
.promo-slide {
  touch-action: pan-x;
}

.promo-slide :deep(.v-slide-group__container) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.promo-slide :deep(.v-slide-group__container::-webkit-scrollbar) {
  display: none;
}

.promo-slide :deep(.v-slide-group__content) {
  gap: 14px;
  padding: 10px 6px 12px;
}

/* flechas */
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

.promo-item {
  display: inline-flex;
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
  font-weight: 500;
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
  font-weight: 500;
  letter-spacing: -0.2px;
  line-height: 1.1;
  white-space: nowrap;
}

.promo-off {
  font-size: 12px;
  font-weight: 500;
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
  font-weight: 400;
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
  font-weight: 500;
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

/* ✅ MOBILE */
@media (max-width: 600px) {
  .promo-head {
    padding: 12px 14px;
  }

  .promo-title {
    font-size: 14px;
    font-weight: 500;
  }

  .promo-sub {
    display: none;
  }

  .promo-body {
    padding: 10px 8px 10px;
  }

  .promo-slide :deep(.v-slide-group__content) {
    padding-left: 18px;
    padding-right: 18px;
    gap: 12px;
  }

  .promo-card {
    width: min(86vw, 340px);
  }

  .promo-img {
    height: 160px;
  }

  .promo-off {
    font-size: 10px;
  }

  .promo-slide :deep(.v-slide-group__prev),
  .promo-slide :deep(.v-slide-group__next) {
    width: 36px;
  }

  .promo-slide :deep(.v-slide-group__prev) {
    margin-left: -6px;
  }
  .promo-slide :deep(.v-slide-group__next) {
    margin-right: -6px;
  }
}
</style>
