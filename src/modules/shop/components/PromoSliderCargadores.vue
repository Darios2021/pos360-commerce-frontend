<!--
  PromoSliderCargadores — Wrapper sobre ShopProductBlock.
-->
<template>
  <div v-if="safeItems.length || loadingState" class="promo-shell">
    <div v-if="loadingState && !safeItems.length" class="promo-skel">
      <v-skeleton-loader type="image, article" />
    </div>
    <ShopProductBlock
      v-else-if="!internalError && safeItems.length"
      :title="title"
      :subtitle="subtitle"
      icon="mdi-power-plug"
      :view-all-to="viewAllRoute"
      :items="safeItems"
      :page-size="perPage"
    />
    <v-alert v-else-if="internalError" type="error" variant="tonal" density="compact" class="my-2">
      No se pudieron cargar productos.
    </v-alert>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import ShopProductBlock from "./ShopProductBlock.vue";

const props = defineProps({
  title:    { type: String, default: "Cargadores destacados" },
  subtitle: { type: String, default: "Rápidos, originales y recomendados" },
  items:    { type: Array, default: null },
  loading:  { type: Boolean, default: false },
  autoFetchWhenEmpty: { type: Boolean, default: true },
  maxItems: { type: Number, default: 60 },
  perPage:  { type: Number, default: 6 },
  limit:    { type: Number, default: 60 },
  search:   { type: String, default: "cargador" },
  excludeTerms: { type: String, default: "" },
});

const internalLoading = ref(false);
const internalItems = ref([]);
const internalError = ref("");

const isControlled = computed(() => Array.isArray(props.items));
const canAutoFetch = computed(() => {
  if (!props.autoFetchWhenEmpty) return false;
  if (!isControlled.value) return true;
  if (props.loading) return false;
  return (props.items || []).length === 0;
});

const loadingState = computed(() =>
  canAutoFetch.value ? internalLoading.value : (isControlled.value ? !!props.loading : internalLoading.value)
);
const safeItems = computed(() => {
  const list = canAutoFetch.value
    ? internalItems.value
    : (isControlled.value ? (props.items || []) : internalItems.value);
  return (list || []).slice(0, props.maxItems);
});

const viewAllRoute = computed(() => ({
  name: "shopHome",
  query: { q: String(props.search || "cargador") },
}));

async function fetchAuto() {
  internalLoading.value = true;
  internalError.value = "";
  try {
    const r = await getCatalog({
      search: String(props.search || "cargador"),
      page: 1,
      limit: Math.max(1, Number(props.limit || 60)),
      strict_search: 1,
      exclude_terms: String(props.excludeTerms || ""),
    });
    internalItems.value = Array.isArray(r?.items) ? r.items : [];
  } catch (e) {
    internalError.value = e?.message || String(e);
  } finally {
    internalLoading.value = false;
  }
}

onMounted(() => { if (canAutoFetch.value) fetchAuto(); });
watch(
  () => [props.search, props.excludeTerms, props.items, props.loading],
  () => { if (canAutoFetch.value) fetchAuto(); },
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
