<!-- src/modules/shop/components/PromoSliderSeguridad.vue -->
<template>
  <section class="promo-shell">
    <div class="promo-inner">
      <div class="promo-head">
        <div class="promo-head-left">
          <div class="promo-title">
            <v-icon size="18" color="primary" class="mr-1">mdi-shield-lock</v-icon>
            {{ title }}
          </div>
          <div class="promo-sub">{{ subtitle }}</div>
        </div>
        <v-btn variant="text" class="promo-more" @click="goSeeAll">Ver todos</v-btn>
      </div>

      <v-divider class="promo-divider" />

      <div class="promo-body">
        <div v-if="loading" class="promo-skel">
          <div v-for="n in 6" :key="n">
            <v-skeleton-loader type="image, article" />
          </div>
        </div>

        <v-alert v-else-if="error" type="error" variant="tonal" class="mb-2">
          No se pudieron cargar productos: {{ error }}
        </v-alert>

        <v-alert v-else-if="!items.length" type="info" variant="tonal" class="mb-2">
          No hay productos para mostrar.
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
                  <div v-if="badgeText(p)" class="promo-badge">{{ badgeText(p) }}</div>
                </div>
                <div class="promo-info">
                  <div class="promo-price-row">
                    <div class="promo-price">$ {{ fmtMoney(finalPrice(p)) }}</div>
                    <div class="promo-off" v-if="offPct(p)">{{ offPct(p) }}% OFF</div>
                  </div>
                  <div v-if="showOldPrice(p)" class="promo-old">$ {{ fmtMoney(oldPrice(p)) }}</div>
                  <div class="promo-name">{{ p.name }}</div>
                  <div class="promo-meta">
                    {{ p.category_name || "—" }}
                    <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                  </div>
                </div>
              </button>
            </div>
          </v-slide-group-item>
        </v-slide-group>

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
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { isPromoActive } from "@/modules/shop/utils/promo";

const props = defineProps({
  title:    { type: String, default: "Seguridad Electrónica" },
  subtitle: { type: String, default: "Cámaras, alarmas y control de acceso" },
  categoryId: { type: Number, default: 11 },
  limit:    { type: Number, default: 40 },
  perPage:  { type: Number, default: 5 },
  fallbackImg: {
    type: String,
    default: "https://storage-files.cingulado.org/pos360/media/1773003110927-1897e885ea435e0d.webp",
  },
});

const router = useRouter();
const model  = ref(0);
const loading = ref(false);
const error   = ref("");
const items   = ref([]);

function trimSlash(s) { return String(s || "").replace(/\/+$/, ""); }
function normalizeBase(input) {
  let s = trimSlash(input);
  if (!s) return "/api/v1";
  if (s.startsWith("/")) return /^\/api\/v\d+$/i.test(s) ? s : s;
  try {
    const u = new URL(s);
    return /\/api\/v\d+/i.test(u.pathname) ? trimSlash(u.toString()) : trimSlash(u.origin + "/api/v1");
  } catch { return "/api/v1"; }
}

const baseRaw = String(import.meta.env.VITE_API_BASE_URL || "").trim();
let basePath  = normalizeBase(baseRaw);
if (typeof window !== "undefined") {
  const host = String(window.location.hostname || "").toLowerCase();
  const sameOrigin = ["1","true"].includes(String(import.meta.env.VITE_SHOP_API_SAME_ORIGIN || "").trim().toLowerCase());
  if (host === "sanjuantecnologia.com" || host === "www.sanjuantecnologia.com" || sameOrigin) basePath = "/api/v1";
}

const api = axios.create({ baseURL: `${trimSlash(basePath)}/public`, timeout: 30000 });
api.interceptors.request.use((cfg) => {
  const h = cfg.headers || {};
  delete h["Cache-Control"]; delete h["cache-control"]; delete h["Pragma"]; delete h["pragma"];
  cfg.headers = h; return cfg;
});

function toNum(v) { const n = Number(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; }
function fmtMoney(v) { return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v))); }
function finalPrice(p) { const d = toNum(p?.price_discount); return d > 0 ? d : (toNum(p?.price_list) || toNum(p?.price)); }
function oldPrice(p)   { return toNum(p?.price_list) || toNum(p?.price); }
function showOldPrice(p) { const d = toNum(p?.price_discount), o = oldPrice(p); return d > 0 && o > d; }
function offPct(p) {
  if (!showOldPrice(p)) return 0;
  const pct = Math.round(((oldPrice(p) - toNum(p?.price_discount)) / oldPrice(p)) * 100);
  return pct > 0 ? pct : 0;
}
function badgeText(p) {
  if (isPromoActive(p)) return "OFERTA";
  if (toNum(p?.price_discount) > 0) return "DESCUENTO";
  if (p?.is_new) return "NUEVO";
  return "";
}
function imgOf(p) {
  return p?.image_url || p?.image || p?.thumbnail_url
    || (Array.isArray(p?.images) ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.url) : "")
    || props.fallbackImg;
}
function onImgError(e) { try { if (e?.target?.src !== props.fallbackImg) e.target.src = props.fallbackImg; } catch {} }
function open(p) { const id = p?.product_id ?? p?.id; if (id) router.push({ name: "shopProduct", params: { id: String(id) } }); }
function goSeeAll() { router.push({ name: "shopCategory", params: { id: String(props.categoryId) } }); }

async function fetchItems() {
  loading.value = true;
  error.value   = "";
  items.value   = [];
  try {
    const r = await api.get("/catalog", {
      params: { page: 1, limit: props.limit, category_id: props.categoryId },
    });
    items.value = Array.isArray(r.data?.items) ? r.data.items : [];
    model.value = 0;
  } catch (e) {
    // fallback: text search
    try {
      const r2 = await api.get("/catalog", { params: { page: 1, limit: props.limit, search: "camara seguridad" } });
      items.value = Array.isArray(r2.data?.items) ? r2.data.items : [];
    } catch (e2) {
      error.value = e2?.message || String(e2);
    }
  } finally {
    loading.value = false;
  }
}

const dotIndex  = computed(() => Math.max(0, Math.floor(Number(model.value ?? 0) / props.perPage)));
const dotsCount = computed(() => items.value.length ? Math.ceil(items.value.length / props.perPage) : 0);
function jumpTo(pageIdx) { model.value = pageIdx * props.perPage; }

onMounted(fetchItems);
</script>

<style scoped>
.promo-shell { width: 100%; }
.promo-inner {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 10px 28px rgba(0,0,0,0.06);
  overflow: hidden;
}
.promo-head {
  padding: 16px 18px 14px;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.promo-head-left { display: flex; flex-direction: column; gap: 4px; }
.promo-title { font-size: 16px; font-weight: 500; letter-spacing: -0.2px; line-height: 1.1; display: flex; align-items: center; }
.promo-sub   { font-size: 12px; opacity: 0.72; }
.promo-more  { font-weight: 500; opacity: 0.9; }
.promo-divider { opacity: 0.65; }
.promo-body { padding: 10px; }
.promo-skel {
  display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px;
}
@media (max-width: 1200px) { .promo-skel { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
@media (max-width: 960px)  { .promo-skel { grid-template-columns: repeat(2, minmax(0, 1fr)); } }

.promo-slide { touch-action: pan-x; }
.promo-slide :deep(.v-slide-group__container) { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.promo-slide :deep(.v-slide-group__container::-webkit-scrollbar) { display: none; }
.promo-slide :deep(.v-slide-group__content) { gap: 14px; padding: 10px 6px 12px; }
.promo-slide :deep(.v-slide-group__prev .v-btn),
.promo-slide :deep(.v-slide-group__next .v-btn) {
  background: rgba(255,255,255,0.92); border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 10px 26px rgba(0,0,0,0.1);
}

.promo-item { display: inline-flex; }
.promo-card {
  width: 210px; border-radius: 16px; overflow: hidden;
  background: #fff; border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 6px 16px rgba(0,0,0,0.05);
  cursor: pointer; text-align: left; padding: 0;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
}
@media (hover: hover) and (pointer: fine) {
  .promo-card:hover { transform: translateY(-2px); box-shadow: 0 14px 34px rgba(0,0,0,0.1); }
}
.promo-img { position: relative; width: 100%; height: 150px; background: #f5f5f5; }
.promo-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.promo-badge {
  position: absolute; top: 10px; left: 10px;
  background: rgba(0,166,80,0.95); color: #fff;
  font-weight: 500; font-size: 11px; padding: 6px 10px; border-radius: 999px;
}
.promo-info { padding: 10px 12px 12px; }
.promo-price-row { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
.promo-price { font-size: 18px; font-weight: 500; letter-spacing: -0.2px; white-space: nowrap; }
.promo-off   { font-size: 12px; font-weight: 500; color: #00a650; white-space: nowrap; }
.promo-old   { margin-top: 2px; font-size: 12px; opacity: 0.6; text-decoration: line-through; }
.promo-name  { margin-top: 8px; font-weight: 400; font-size: 12px; line-height: 1.15; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.promo-meta  { margin-top: 6px; font-size: 11px; opacity: 0.7; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }

.promo-dots  { display: flex; justify-content: center; gap: 8px; padding: 8px 0 6px; }
.dot { width: 7px; height: 7px; border-radius: 999px; border: 0; background: rgba(0,0,0,0.16); cursor: pointer; transition: transform 0.12s ease, background 0.12s ease; }
.dot:hover  { transform: scale(1.15); }
.dot.active { background: rgba(0,0,0,0.55); }

@media (max-width: 600px) {
  .promo-head  { padding: 12px 14px; }
  .promo-title { font-size: 14px; }
  .promo-sub   { display: none; }
  .promo-body  { padding: 10px 8px; }
  .promo-slide :deep(.v-slide-group__content) { padding-left: 18px; padding-right: 18px; gap: 12px; }
  .promo-card  { width: min(86vw, 340px); }
  .promo-img   { height: 160px; }
}
</style>
