

<template>
  <section class="promo-shell">
    <div class="promo-inner">
      <!-- Header -->
      <div class="promo-head">
        <div class="promo-head-left">
          <div class="promo-title">{{ title }}</div>
          <div class="promo-sub">{{ subtitle }}</div>
        </div>
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
          No se pudo cargar {{ title }}: {{ error }}
        </v-alert>

        <v-alert v-else-if="!items.length" type="info" variant="tonal" class="mb-2">
          No hay productos para mostrar en {{ title }}.
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
import { useRouter, useRoute } from "vue-router";

import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { isPromoActive } from "@/modules/shop/utils/promo";
import { getPublicCategories } from "@/modules/shop/service/shop.taxonomy.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";
import { buildProductLocation } from "@/modules/shop/utils/productSlug";

const props = defineProps({
  title: { type: String, default: "Hogar / Electro" },
  subtitle: { type: String, default: "Electro y productos para el hogar destacados" },

  // ✅ tu caso real: category_id=7
  categoryId: { type: Number, default: 7 },

  perPage: { type: Number, default: 5 },

  // ✅ si querés buscar por nombre/slug (si algún día cambia el ID)
  categoryKey: { type: String, default: "hogar" },
  categoryAltKey: { type: String, default: "electro" },

  // ✅ total a mostrar en el slider
  limitTotal: { type: Number, default: 24 },

  // ✅ multipage
  pageSize: { type: Number, default: 60 },
  maxPages: { type: Number, default: 6 },

  // ✅ IMPORTANTÍSIMO: branch default para que NUNCA vaya null
  // (poné acá tu sucursal pública default)
  defaultBranchId: { type: Number, default: 3 },

  fallbackImg: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1582582621959-48d27397dc04?auto=format&fit=crop&w=1200&q=80",
  },
});

const router = useRouter();
const route = useRoute();
const cart = useShopCartStore();

const model = ref(0);
const loading = ref(false);
const error = ref(null);
const items = ref([]);

/* =========================
   Helpers UI
========================= */
function open(p) {
  const loc = buildProductLocation(p);
  if (loc) router.push(loc);
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
  if (isPromoActive(p)) return "OFERTA";
  if (toNum(p.price_discount) > 0) return "DESCUENTO";
  if (p.is_new) return "NUEVO";
  return "";
}

function freeShip(p) {
  return Boolean(p.free_shipping) || Boolean(p.is_free_shipping);
}

function imgOf(p) {
  return p?.image_url || p?.image || p?.thumbnail_url || props.fallbackImg;
}

function keyOf(p) {
  return String(p?.product_id ?? p?.id ?? "");
}

/* =========================
   Branch resolver (NO NULL)
========================= */
function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function getBranchFromLocalStorage() {
  const raw = localStorage.getItem("pos360_shop_cart_v1");
  const obj = safeJsonParse(raw);
  const bid = Number(obj?.branch_id || 0);
  return Number.isFinite(bid) && bid > 0 ? bid : null;
}

const branchId = computed(() => {
  // 1) query (?branch_id=)
  const qbid = Number(route.query.branch_id || 0);
  if (Number.isFinite(qbid) && qbid > 0) return qbid;

  // 2) store
  const sbid = Number(cart.branch_id || 0);
  if (Number.isFinite(sbid) && sbid > 0) return sbid;

  // 3) localStorage
  const lbid = getBranchFromLocalStorage();
  if (lbid) return lbid;

  // 4) fallback fijo
  const def = Number(props.defaultBranchId || 0);
  return Number.isFinite(def) && def > 0 ? def : null;
});

/* =========================
   Category resolver (ID fijo + fallback por nombre)
========================= */
function norm(s) {
  const x = String(s || "").trim().toLowerCase().normalize("NFD");
  try {
    return x.replace(/\p{Diacritic}/gu, "");
  } catch {
    return x.replace(/[\u0300-\u036f]/g, "");
  }
}

const resolvedCategoryId = ref(null);

async function resolveCategoryId() {
  // ✅ si ya nos pasaste el ID real, usamos ese
  const id = Number(props.categoryId || 0);
  if (Number.isFinite(id) && id > 0) {
    resolvedCategoryId.value = id;
    return;
  }

  // fallback: buscar por nombre/slug
  const cats = await getPublicCategories();
  const list = Array.isArray(cats) ? cats : [];
  const k1 = norm(props.categoryKey);
  const k2 = norm(props.categoryAltKey);

  const cat =
    list.find((c) => {
      const n = norm(c?.name);
      const sl = norm(c?.slug);
      return (n.includes(k1) && n.includes(k2)) || (sl.includes(k1) && sl.includes(k2));
    }) || null;

  resolvedCategoryId.value = Number(cat?.id) || null;
}

/* =========================
   Fetch (igual que /shop/c/7?category_id=7)
   => SIEMPRE manda branch_id + category_id
========================= */
async function fetchItems() {
  loading.value = true;
  error.value = null;

  try {
    await resolveCategoryId();

    const catId = Number(resolvedCategoryId.value || 0);
    const bId = Number(branchId.value || 0);

    if (!catId) {
      items.value = [];
      return;
    }

    // ✅ clave: no permitir branch null
    if (!bId) {
      items.value = [];
      error.value = "branch_id inválido (null). Seteá defaultBranchId.";
      return;
    }

    const merged = [];
    const seen = new Set();

    for (let pg = 1; pg <= props.maxPages; pg++) {
      const r = await getCatalog({
        search: "",
        page: pg,
        limit: props.pageSize,
        category_id: catId,
        branch_id: bId, // ✅ ESTO ES LO QUE TE FALTABA
      });

      const list = Array.isArray(r?.items) ? r.items : [];
      if (!list.length) break;

      for (const it of list) {
        const k = keyOf(it);
        if (!k || seen.has(k)) continue;
        merged.push(it);
        seen.add(k);
        if (merged.length >= props.limitTotal) break;
      }

      if (merged.length >= props.limitTotal) break;

      const total = Number(r?.total || 0);
      if (total && merged.length >= total) break;
    }

    items.value = merged.slice(0, props.limitTotal);
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

/* =========================
   Dots
========================= */
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

/* =========================
   Mount + Watch
========================= */
onMounted(fetchItems);

// ✅ si cambia sucursal en store/query/localstorage -> recarga
watch(
  () => [branchId.value, props.categoryId, props.limitTotal, props.pageSize, props.maxPages],
  () => fetchItems()
);
</script>

<style scoped>
/* mismo estilo que tus sliders */
.promo-shell { width: 100%; }
.promo-inner {
  background:#fff;border-radius:18px;border:1px solid rgba(0,0,0,.06);
  box-shadow:0 10px 28px rgba(0,0,0,.06);overflow:hidden;
}
.promo-head{padding:16px 18px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.promo-head-left{display:flex;flex-direction:column;gap:4px}
.promo-title{font-size:16px;font-weight: 500;letter-spacing:-.2px;line-height:1.1}
.promo-sub{font-size:12px;opacity:.72}
.promo-divider{opacity:.65}
.promo-body{padding:10px}
.promo-skel{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px}
@media (max-width:1200px){.promo-skel{grid-template-columns:repeat(4,minmax(0,1fr))}}
@media (max-width:960px){.promo-skel{grid-template-columns:repeat(2,minmax(0,1fr))}}
.promo-slide{touch-action:pan-x}
.promo-slide :deep(.v-slide-group__container){overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none}
.promo-slide :deep(.v-slide-group__container::-webkit-scrollbar){display:none}
.promo-slide :deep(.v-slide-group__content){gap:14px;padding:10px 6px 12px}
.promo-slide :deep(.v-slide-group__prev),.promo-slide :deep(.v-slide-group__next){opacity:.95}
.promo-slide :deep(.v-slide-group__prev .v-btn),.promo-slide :deep(.v-slide-group__next .v-btn){
  background:rgba(255,255,255,.92);border:1px solid rgba(0,0,0,.1);box-shadow:0 10px 26px rgba(0,0,0,.1)
}
.promo-item{display:inline-flex}
.promo-card{
  width:210px;border-radius:16px;overflow:hidden;background:#fff;border:1px solid rgba(0,0,0,.06);
  box-shadow:0 6px 16px rgba(0,0,0,.05);cursor:pointer;text-align:left;padding:0;
}
.promo-img{position:relative;width:100%;height:150px;background:#f5f5f5}
.promo-img img{width:100%;height:100%;object-fit:cover;display:block}
.promo-badge{position:absolute;top:10px;left:10px;background:rgba(0,166,80,.95);color:#fff;font-weight: 500;font-size:11px;padding:6px 10px;border-radius:999px}
.promo-info{padding:10px 12px 12px}
.promo-price-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.promo-price{font-size:18px;font-weight: 500;white-space:nowrap}
.promo-off{font-size:12px;font-weight: 500;color:#00a650;white-space:nowrap}
.promo-old{margin-top:2px;font-size:12px;opacity:.6;text-decoration:line-through}
.promo-name{margin-top:8px;font-weight: 400;font-size:12px;line-height:1.15;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.promo-meta{margin-top:6px;font-size:11px;opacity:.7;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden}
.promo-free{margin-top:6px;font-size:12px;font-weight: 500;color:#00a650}
.promo-dots{display:flex;justify-content:center;gap:8px;padding:8px 0 6px}
.dot{width:7px;height:7px;border-radius:999px;border:0;background:rgba(0,0,0,.16);cursor:pointer}
.dot.active{background:rgba(0,0,0,.55)}
@media (max-width:600px){
  .promo-head{padding:12px 14px}
  .promo-title{font-size:14px}
  .promo-sub{display:none}
  .promo-body{padding:10px 8px}
  .promo-slide :deep(.v-slide-group__content){padding-left:18px;padding-right:18px;gap:12px}
  .promo-card{width:min(86vw,340px)}
  .promo-img{height:160px}
}
</style>
