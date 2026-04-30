<!--
  PromoSliderAuriculares — Wrapper sobre ShopProductBlock.
  Mantiene la API original (props: title, subtitle, iconUrl, items, loading,
  search, etc.) para no romper ShopHome.vue, pero delega el render visual al
  componente estándar ShopProductBlock (mismo estilo que el resto de los
  carousels del shop).
-->
<template>
  <div v-if="safeItems.length || loadingState" class="auris-shell">
    <!-- Skeleton durante carga inicial -->
    <div v-if="loadingState && !safeItems.length" class="auris-skel">
      <v-skeleton-loader type="image, article" />
    </div>

    <!-- Bloque estándar -->
    <ShopProductBlock
      v-else-if="!internalError && safeItems.length"
      :title="title"
      :subtitle="subtitle"
      :icon-url="iconUrl"
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
  title:    { type: String, default: "Auriculares" },
  subtitle: { type: String, default: "Selección destacada" },

  /** Si el padre pasa items, se usan tal cual */
  items:    { type: Array, default: null },
  /** Si el padre pasa loading, se respeta */
  loading:  { type: Boolean, default: false },
  /** Si items viene vacío, auto-fetch igual */
  autoFetchWhenEmpty: { type: Boolean, default: true },

  /** imagen chica en el título */
  iconUrl: {
    type: String,
    default: "https://storage-files.cingulado.org/pos360/products/54/1766788849600-3802f99d.jpeg",
  },

  /** límites */
  maxItems: { type: Number, default: 60 },
  perPage:  { type: Number, default: 6 },
  limit:    { type: Number, default: 60 },

  /** búsqueda al backend */
  search:       { type: String, default: "auriculares" },
  excludeTerms: {
    type: String,
    default: "cargador,cable,energia,energía,usb,adaptador,fuente,powerbank,power bank,charger",
  },

  /** ids opcionales para link "Ver todo" */
  categoryId: { type: [Number, String], default: null },
  subIds:     { type: Array, default: () => [] },
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
  query: { q: String(props.search || "auriculares") },
}));

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
    internalItems.value = list;
  } catch (e) {
    internalError.value = e?.message || String(e);
  } finally {
    internalLoading.value = false;
  }
}

onMounted(() => {
  if (canAutoFetch.value) fetchAuto();
});
watch(
  () => [props.search, props.excludeTerms, props.items, props.loading],
  () => { if (canAutoFetch.value) fetchAuto(); },
  { deep: true }
);
</script>

<style scoped>
.auris-shell { display: block; }
.auris-skel {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  min-height: 320px;
}
</style>
