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

        <v-btn v-if="showSeeAll" variant="text" class="promo-more" @click="$emit('seeAll')">
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

        <v-slide-group
          v-else
          v-model="model"
          show-arrows
          class="promo-slide"
          :mandatory="false"
        >
          <v-slide-group-item
            v-for="(p, idx) in items"
            :key="p.product_id ?? p.id ?? idx"
            v-slot="{ toggle }"
          >
            <div class="promo-item">
              <button class="promo-card" type="button" @click="toggle(); open(p)">
                <div class="promo-img">
                  <img :src="imgOf(p)" alt="" />
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

                  <div class="promo-name">
                    {{ p.name }}
                  </div>

                  <div class="promo-meta">
                    {{ p.category_name || "—" }}
                    <span v-if="p.subcategory_name"> · {{ p.subcategory_name }}</span>
                  </div>

                  <div class="promo-free" v-if="freeShip(p)">
                    Envío gratis
                  </div>
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

import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategories } from "@/modules/shop/service/shop.taxonomy.api";

const props = defineProps({
  // textos
  title: { type: String, default: "Cargadores destacados" },
  subtitle: { type: String, default: "Rápidos, originales y recomendados" },

  // ui
  perPage: { type: Number, default: 5 },
  showSeeAll: { type: Boolean, default: false },

  // búsqueda por categoría/subcategoría (por nombre/slug)
  categoryKey: { type: String, default: "energia" },     // ✅ ENERGIA
  subcategoryKey: { type: String, default: "cargadores" },// ✅ CARGADORES

  // control de cantidad
  limit: { type: Number, default: 40 },

  // fallback imagen
  fallbackImg: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=1200&q=80",
  },
});

defineEmits(["seeAll"]);

const router = useRouter();

const model = ref(0);
const loading = ref(false);
const error = ref(null);
const items = ref([]);

const categoryId = ref(null);
const subcategoryId = ref(null);

function open(p) {
  router.push({ name: "shopProduct", params: { id: p.product_id ?? p.id } });
}

function toNum(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(toNum(v)));
}

function finalPrice(p) {
  const d = toNum(p.price_discount);
  if (d > 0) return d;
  const l = toNum(p.price_list);
  if (l > 0) return l;
  return toNum(p.price);
}

function oldPrice(p) {
  const l = toNum(p.price_list);
  const base = l > 0 ? l : toNum(p.price);
  return base;
}

function showOldPrice(p) {
  const d = toNum(p.price_discount);
  const o = oldPrice(p);
  return d > 0 && o > d;
}

function offPct(p) {
  if (!showOldPrice(p)) return 0;
  const o = oldPrice(p);
  const d = toNum(p.price_discount);
  const pct = Math.round(((o - d) / o) * 100);
  return pct > 0 ? pct : 0;
}

function badgeText(p) {
  if (p.is_promo) return "OFERTA";
  if (toNum(p.price_discount) > 0) return "DESCUENTO";
  if (p.is_new) return "NUEVO";
  return "";
}

function freeShip(p) {
  return Boolean(p.free_shipping) || Boolean(p.is_free_shipping);
}

function imgOf(p) {
  return (
    p?.image_url ||
    p?.image ||
    p?.thumbnail_url ||
    (Array.isArray(p?.images) && p.images[0]?.url) ||
    props.fallbackImg
  );
}

/* =========================
   Taxonomy: resolver IDs
========================= */
function norm(s) {
  // robusto: sin depender de \p{Diacritic} si el engine no soporta
  const x = String(s || "").trim().toLowerCase().normalize("NFD");
  try {
    return x.replace(/\p{Diacritic}/gu, "");
  } catch {
    return x.replace(/[\u0300-\u036f]/g, "");
  }
}

function getCatSubs(cat) {
  if (!cat) return [];
  const candidates = [cat.children, cat.subcategories, cat.subs, cat.items, cat.nodes];
  return (candidates.find((x) => Array.isArray(x)) || []).filter(Boolean);
}

async function resolveEnergyChargersIds() {
  const cats = await getPublicCategories();
  const list = Array.isArray(cats) ? cats : [];

  // buscar categoria ENERGIA por slug o name
  const cKey = norm(props.categoryKey);
  const cat =
    list.find((c) => norm(c?.slug) === cKey) ||
    list.find((c) => norm(c?.name) === cKey) ||
    list.find((c) => norm(c?.name).includes(cKey)) ||
    null;

  if (!cat) {
    categoryId.value = null;
    subcategoryId.value = null;
    return;
  }

  categoryId.value = Number(cat?.id) || null;

  // buscar subcategoria CARGADORES dentro de ENERGIA
  const subs = getCatSubs(cat);
  const sKey = norm(props.subcategoryKey);
  const sub =
    subs.find((s) => norm(s?.slug) === sKey) ||
    subs.find((s) => norm(s?.name) === sKey) ||
    subs.find((s) => norm(s?.name).includes(sKey)) ||
    null;

  subcategoryId.value = Number(sub?.id) || null;
}

async function fetchChargers() {
  loading.value = true;
  error.value = null;

  try {
    await resolveEnergyChargersIds();

    const catId = Number(categoryId.value || 0);
    const subId = Number(subcategoryId.value || 0);

    let r = null;

    // ✅ ideal: por categoria/subcategoria exacta
    if (catId && subId) {
      r = await getCatalog({
        search: "",
        page: 1,
        limit: props.limit,
        category_id: catId,
        subcategory_id: subId,
      });
    } else if (catId) {
      // fallback: solo categoria energia (por si no encuentra la sub)
      r = await getCatalog({
        search: "cargador",
        page: 1,
        limit: props.limit,
        category_id: catId,
        strict_search: 1,
      });
    } else {
      // fallback final: texto
      r = await getCatalog({
        search: "cargador",
        page: 1,
        limit: props.limit,
        strict_search: 1,
      });
    }

    const list = Array.isArray(r?.items) ? r.items : [];
    items.value = list;
  } catch (e) {
    const msg =
      e?.response?.status
        ? `${e.response.status} ${e.response.statusText || ""}`.trim()
        : e?.message || String(e);

    error.value = msg;
    items.value = [];
  } finally {
    loading.value = false;
    model.value = 0;
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

// si cambian keys/limit desde props (por si lo ajustas)
watch(
  () => [props.categoryKey, props.subcategoryKey, props.limit],
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
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.1;
}

.promo-sub {
  font-size: 12px;
  opacity: 0.72;
}

.promo-more {
  font-weight: 900;
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
  font-weight: 950;
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
  font-weight: 950;
  letter-spacing: -0.2px;
  line-height: 1.1;
  white-space: nowrap;
}

.promo-off {
  font-size: 12px;
  font-weight: 950;
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
  font-weight: 850;
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
  font-weight: 900;
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
    font-weight: 950;
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
