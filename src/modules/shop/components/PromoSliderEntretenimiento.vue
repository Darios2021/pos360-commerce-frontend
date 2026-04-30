<!--
  PromoSliderEntretenimiento — Carousel de productos para entretenimiento
  (TVs, parlantes, gaming, consolas, audio, video). Wrapper sobre
  ShopProductBlock para mantener el estándar visual del shop.
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
      icon="mdi-gamepad-variant-outline"
      :view-all-to="viewAllRoute"
      :items="items"
      :page-size="perPage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getCatalog } from "@/modules/shop/service/shop.public.api";
import { getPublicCategories } from "@/modules/shop/service/shop.taxonomy.api";
import ShopProductBlock from "./ShopProductBlock.vue";

const props = defineProps({
  title:    { type: String, default: "Entretenimiento" },
  subtitle: { type: String, default: "Productos para tu tiempo libre" },
  /** Categoría a traer. Se resuelve por nombre exacto desde el catálogo
      público. Si pasás categoryId directo, salta la resolución. */
  categoryName: { type: String, default: "Entretenimiento" },
  categoryId:   { type: [Number, String], default: null },
  perPage:    { type: Number, default: 6 },
  limitTotal: { type: Number, default: 24 },
  pageSize:   { type: Number, default: 60 },
});

const loading = ref(false);
const error = ref("");
const items = ref([]);

const resolvedCategoryId = ref(null);

const viewAllRoute = computed(() =>
  resolvedCategoryId.value
    ? { name: "shopCategory", params: { id: String(resolvedCategoryId.value) } }
    : { name: "shopHome" }
);

function keyOf(p) { return String(p?.product_id ?? p?.id ?? ""); }

function normalize(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .trim()
    .toLowerCase();
}

async function resolveCategory() {
  if (props.categoryId) {
    resolvedCategoryId.value = Number(props.categoryId) || null;
    return resolvedCategoryId.value;
  }
  try {
    const cats = await getPublicCategories();
    const target = normalize(props.categoryName);

    // 1. match exacto (sin acentos / case-insensitive)
    let hit = (cats || []).find((c) => normalize(c?.name) === target);

    // 2. fallback: la categoría empieza con el target (ej "Entretenimiento Hogar")
    if (!hit) {
      hit = (cats || []).find((c) => normalize(c?.name).startsWith(target));
    }

    // 3. último fallback: contiene el target
    if (!hit) {
      hit = (cats || []).find((c) => normalize(c?.name).includes(target));
    }

    resolvedCategoryId.value = hit?.id ? Number(hit.id) : null;

    if (!resolvedCategoryId.value && cats?.length) {
      // ayuda de debug: si no encontró, lista nombres disponibles
      // eslint-disable-next-line no-console
      console.warn(
        `[PromoSliderEntretenimiento] categoría "${props.categoryName}" no encontrada. Disponibles:`,
        cats.map((c) => c?.name).filter(Boolean)
      );
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[PromoSliderEntretenimiento] error resolviendo categoría:", e);
    resolvedCategoryId.value = null;
  }
  return resolvedCategoryId.value;
}

async function fetchItems() {
  loading.value = true;
  error.value = "";
  try {
    const cid = await resolveCategory();
    if (!cid) { items.value = []; return; }

    const r = await getCatalog({
      page: 1,
      limit: props.pageSize,
      category_id: cid,
    });
    const list = Array.isArray(r?.items) ? r.items : [];
    items.value = list.slice(0, props.limitTotal);
  } catch (e) {
    error.value = e?.message || String(e);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchItems);
watch(() => [props.categoryName, props.categoryId], fetchItems, { deep: true });
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
