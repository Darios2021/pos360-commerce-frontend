<!--
  PromoSliderAudioMicrofonos — Wrapper sobre ShopProductBlock.
  Mantiene la lógica de fetch por category_id + subcategory_id + branch_id.
-->
<template>
  <div v-if="items.length || loading" class="promo-shell">
    <div v-if="loading && !items.length" class="promo-skel">
      <v-skeleton-loader type="image, article" />
    </div>
    <ShopProductBlock
      v-else-if="!error && items.length"
      :title="title"
      :subtitle="subtitle"
      icon="mdi-microphone-outline"
      :view-all-to="viewAllRoute"
      :items="items"
      :page-size="perPage"
    />
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="my-2">
      No se pudieron cargar productos.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";
import { getPublicSubcategoriesByCategory } from "@/modules/shop/service/shop.taxonomy.api";
import ShopProductBlock from "./ShopProductBlock.vue";

const props = defineProps({
  title:    { type: String, default: "Audio / Micrófonos" },
  subtitle: { type: String, default: "Micrófonos destacados y recomendados" },
  perPage:  { type: Number, default: 6 },
  categoryId:    { type: Number, default: 2 },
  subcategoryId: { type: Number, default: 11 },
  subcategoryNameFallback: { type: String, default: "MICROFONOS" },
  limitTotal:    { type: Number, default: 24 },
  pageSize:      { type: Number, default: 60 },
  maxPages:      { type: Number, default: 6 },
  defaultBranchId: { type: Number, default: 3 },
});

const route = useRoute();
const cart = useShopCartStore();

const loading = ref(false);
const error = ref(null);
const items = ref([]);

function safeJsonParse(s) { try { return JSON.parse(s); } catch { return null; } }
function getBranchFromLocalStorage() {
  const raw = localStorage.getItem("pos360_shop_cart_v1");
  const obj = safeJsonParse(raw);
  const bid = Number(obj?.branch_id || 0);
  return Number.isFinite(bid) && bid > 0 ? bid : null;
}
const branchId = computed(() => {
  const qbid = Number(route.query.branch_id || 0);
  if (qbid > 0) return qbid;
  const sbid = Number(cart.branch_id || 0);
  if (sbid > 0) return sbid;
  const lbid = getBranchFromLocalStorage();
  if (lbid) return lbid;
  const def = Number(props.defaultBranchId || 0);
  return def > 0 ? def : null;
});

async function resolveSubcategoryId() {
  const cid = Number(props.categoryId || 0);
  const sid = Number(props.subcategoryId || 0);
  if (cid > 0 && sid > 0) return sid;
  const name = String(props.subcategoryNameFallback || "").trim().toLowerCase();
  if (!cid || !name) return 0;
  const subs = await getPublicSubcategoriesByCategory(cid);
  const hit = (subs || []).find((x) => String(x?.name || "").trim().toLowerCase() === name);
  return Number(hit?.id || 0) || 0;
}

const viewAllRoute = computed(() => ({
  name: "shopCategory",
  params: { id: String(props.categoryId) },
}));

function keyOf(p) { return String(p?.product_id ?? p?.id ?? ""); }

async function fetchItems() {
  loading.value = true;
  error.value = null;
  try {
    const catId = Number(props.categoryId || 0);
    const subId = await resolveSubcategoryId();
    const bId = Number(branchId.value || 0);
    if (!catId || !subId || !bId) { items.value = []; return; }

    const merged = [];
    const seen = new Set();
    for (let pg = 1; pg <= props.maxPages; pg++) {
      const r = await getCatalog({
        search: "",
        page: pg,
        limit: props.pageSize,
        category_id: catId,
        subcategory_id: subId,
        branch_id: bId,
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
    error.value = e?.message || String(e);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchItems);
watch(
  () => [branchId.value, props.categoryId, props.subcategoryId, props.subcategoryNameFallback],
  fetchItems,
  { deep: true }
);
</script>

<style scoped>
.promo-shell { display: block; }
.promo-skel {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-height: 320px;
}
</style>
