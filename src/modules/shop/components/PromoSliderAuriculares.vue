<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/PromoSliderAuriculares.vue -->
<template>
  <section class="auris-shell">
    <div class="auris-inner">
      <!-- Header -->
      <div class="auris-head">
        <div class="auris-head-left">
          <div class="auris-title">
            <img v-if="iconUrl" class="auris-icon" :src="iconUrl" alt="" />
            <span>{{ title }}</span>
          </div>
          <div class="auris-sub">{{ subtitle }}</div>
        </div>

        <button class="auris-more" type="button" @click="goSeeAll">
          VER TODO <span class="auris-arrow">›</span>
        </button>
      </div>

      <v-divider class="auris-divider" />

      <!-- Body -->
      <div class="auris-body">
        <div v-if="loading" class="auris-skel">
          <v-skeleton-loader type="image, article" />
        </div>

        <v-alert v-else-if="error" type="error" variant="tonal" class="mt-2">
          No se pudieron cargar: {{ error }}
        </v-alert>

        <v-alert v-else-if="!safeItems.length" type="info" variant="tonal" class="mt-2">
          No hay productos para mostrar.
        </v-alert>

        <template v-else>
          <v-slide-group v-model="model" show-arrows class="auris-slide" :mandatory="false">
            <v-slide-group-item
              v-for="(p, idx) in safeItems"
              :key="p.product_id ?? p.id ?? idx"
              v-slot="{ toggle }"
            >
              <div class="auris-item">
                <button class="auris-card" type="button" @click="toggle(); open(p)">
                  <div class="auris-img">
                    <img :src="imgOf(p)" alt="" loading="lazy" @error="onImgError($event)" />
                    <div v-if="badgeText(p)" class="auris-badge">{{ badgeText(p) }}</div>
                  </div>

                  <div class="auris-info">
                    <div class="auris-price-row">
                      <div class="auris-price">$ {{ fmtMoney(finalPrice(p)) }}</div>
                      <div class="auris-off" v-if="offPct(p)">{{ offPct(p) }}% OFF</div>
                    </div>

                    <div v-if="showOldPrice(p)" class="auris-old">
                      $ {{ fmtMoney(oldPrice(p)) }}
                    </div>

                    <div class="auris-name">{{ p.name }}</div>

                    <div class="auris-meta">
                      {{ p.category_name || "—" }}
                      <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                    </div>
                  </div>
                </button>
              </div>
            </v-slide-group-item>
          </v-slide-group>

          <!-- dots -->
          <div class="auris-dots" v-if="dotsCount > 1">
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
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { isPromoActive } from "@/modules/shop/utils/promo";

const props = defineProps({
  title: { type: String, default: "Auriculares" },
  subtitle: { type: String, default: "Selección destacada" },

  /** ✅ si el padre pasa items, se usan */
  items: { type: Array, default: null },

  /** ✅ si el padre pasa loading, se respeta */
  loading: { type: Boolean, default: false },

  /** ✅ si items viene vacío, auto-fetch igual */
  autoFetchWhenEmpty: { type: Boolean, default: true },

  /** imagen chica en el título */
  iconUrl: {
    type: String,
    default: "https://storage-files.cingulado.org/pos360/products/54/1766788849600-3802f99d.jpeg",
  },

  /** cuantos items máximo mostrar */
  maxItems: { type: Number, default: 60 },

  /** perPage para dots */
  perPage: { type: Number, default: 5 },

  /** ✅ query de búsqueda (robusto) */
  search: { type: String, default: "auriculares" },

  /** ✅ excluir cosas que ensucian resultados */
  excludeTerms: {
    type: String,
    default: "cargador,cable,energia,energía,usb,adaptador,fuente,powerbank,power bank,charger",
  },

  /** límite de request al catálogo */
  limit: { type: Number, default: 60 },

  /** fallback imagen */
  fallbackImg: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
  },
});

const router = useRouter();

const internalLoading = ref(false);
const internalItems = ref([]);
const internalError = ref("");

const model = ref(0);

const isControlled = computed(() => Array.isArray(props.items));
const canAutoFetchEvenIfControlled = computed(() => {
  if (!props.autoFetchWhenEmpty) return false;
  if (!isControlled.value) return true;
  if (props.loading) return false;
  return (props.items || []).length === 0;
});

const loading = computed(() => {
  if (canAutoFetchEvenIfControlled.value) return internalLoading.value;
  return isControlled.value ? !!props.loading : internalLoading.value;
});

const error = computed(() => {
  if (canAutoFetchEvenIfControlled.value) return internalError.value;
  return internalError.value;
});

const safeItems = computed(() => {
  if (canAutoFetchEvenIfControlled.value) return internalItems.value || [];
  return isControlled.value ? props.items || [] : internalItems.value || [];
});

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

function imgOf(p) {
  return (
    p?.image_url ||
    p?.image ||
    p?.thumbnail_url ||
    (Array.isArray(p?.images) ? (typeof p.images[0] === "string" ? p.images[0] : p.images[0]?.url) : "") ||
    props.fallbackImg
  );
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
  // ✅ ultra-robusto: búsqueda directa
  router.push({ name: "shopHome", query: { q: String(props.search || "auriculares") } });
}

async function fetchAuto() {
  internalLoading.value = true;
  internalError.value = "";
  try {
    const r = await getCatalog({
      search: String(props.search || "auriculares"),
      page: 1,
      limit: Math.max(1, Number(props.limit || 60)),
      strict_search: 1,
      exclude_terms: String(props.excludeTerms || ""),
    });

    const list = Array.isArray(r?.items) ? r.items : [];
    internalItems.value = list.slice(0, Math.max(1, Number(props.maxItems || 60)));
    model.value = 0;
  } catch (e) {
    const msg =
      e?.response?.status
        ? `${e.response.status} ${e.response.statusText || ""}`.trim()
        : e?.message || String(e);

    internalError.value = msg;
    internalItems.value = [];
  } finally {
    internalLoading.value = false;
  }
}

onMounted(() => {
  if (canAutoFetchEvenIfControlled.value) fetchAuto();
  else if (!isControlled.value) fetchAuto();
});

watch(
  () => [props.search, props.excludeTerms, props.limit, props.maxItems],
  () => {
    if (canAutoFetchEvenIfControlled.value) fetchAuto();
    else if (!isControlled.value) fetchAuto();
  }
);

/** dots */
const dotIndex = computed(() => {
  const idx = Number(model.value ?? 0);
  return Math.max(0, Math.floor(idx / props.perPage));
});
const dotsCount = computed(() => {
  const n = (safeItems.value || []).length;
  if (!n) return 0;
  return Math.max(1, Math.ceil(n / props.perPage));
});
function jumpTo(pageIdx) {
  model.value = pageIdx * props.perPage;
}
</script>

<style scoped>
.auris-shell {
  width: 100%;
}

.auris-inner {
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.auris-head {
  padding: 16px 18px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.auris-head-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.auris-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.1;
}

.auris-icon {
  width: 20px;
  height: 20px;
  object-fit: cover;
  border-radius: 6px;
}

.auris-sub {
  font-size: 12px;
  opacity: 0.72;
}

.auris-more {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-weight: 950;
  letter-spacing: 0.6px;
  opacity: 0.9;
}
.auris-arrow {
  display: inline-block;
  margin-left: 6px;
  font-size: 18px;
  line-height: 1;
}

.auris-divider {
  opacity: 0.65;
}

.auris-body {
  padding: 10px 10px 10px;
}

.auris-skel {
  padding: 8px 6px;
}

.auris-slide {
  touch-action: pan-x;
}
.auris-slide :deep(.v-slide-group__container) {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.auris-slide :deep(.v-slide-group__container::-webkit-scrollbar) {
  display: none;
}
.auris-slide :deep(.v-slide-group__content) {
  gap: 14px;
  padding: 10px 6px 12px;
}
.auris-slide :deep(.v-slide-group__prev .v-btn),
.auris-slide :deep(.v-slide-group__next .v-btn) {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.1);
}

.auris-item {
  display: inline-flex;
}

.auris-card {
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
  .auris-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.1);
  }
}

.auris-img {
  position: relative;
  width: 100%;
  height: 150px;
  background: #f5f5f5;
}
.auris-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.auris-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 166, 80, 0.95);
  color: #fff;
  font-weight: 950;
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 999px;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
}

.auris-info {
  padding: 10px 12px 12px;
}

.auris-price-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
}

.auris-price {
  font-size: 18px;
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.1;
  white-space: nowrap;
}

.auris-off {
  font-size: 12px;
  font-weight: 950;
  color: #00a650;
  white-space: nowrap;
}

.auris-old {
  margin-top: 2px;
  font-size: 12px;
  opacity: 0.6;
  text-decoration: line-through;
}

.auris-name {
  margin-top: 8px;
  font-weight: 850;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.auris-meta {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.7;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* dots */
.auris-dots {
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

@media (max-width: 600px) {
  .auris-head {
    padding: 12px 14px;
  }
  .auris-title {
    font-size: 14px;
  }
  .auris-sub {
    display: none;
  }
  .auris-body {
    padding: 10px 8px 10px;
  }
  .auris-slide :deep(.v-slide-group__content) {
    padding-left: 18px;
    padding-right: 18px;
    gap: 12px;
  }
  .auris-card {
    width: min(86vw, 340px);
  }
  .auris-img {
    height: 160px;
  }
  .auris-off {
    font-size: 10px;
  }
}
</style>
