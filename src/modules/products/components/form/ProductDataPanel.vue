<template>
  <div class="d-flex flex-column ga-4">
    <!-- Row 1 -->
    <div class="d-flex flex-wrap ga-3">
      <!-- Nombre -->
      <v-text-field
        v-model.trim="model.name"
        label="Nombre del producto"
        placeholder="Ej: Auriculares HQ Spirit Boost"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-320"
        :disabled="disabled"
        :error="!!fieldErr('name')"
        :error-messages="fieldErr('name')"
        clearable
      />

      <!-- SKU -->
      <v-text-field
        v-model="skuInput"
        label="SKU"
        placeholder="Ej: HQ-SPIRIT-BOOST-PULSE"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-260"
        :disabled="disabled"
        :error="skuTouched && !!skuError"
        :error-messages="skuTouched ? skuError : ''"
        hint="Se normaliza automáticamente"
        persistent-hint
        @blur="onSkuBlur"
        clearable
      />
    </div>

    <!-- Row 2 -->
    <div class="d-flex flex-wrap ga-3">
      <!-- Rubro -->
      <v-select
        v-model="model.category_id"
        :items="categories"
        item-title="name"
        item-value="id"
        label="Rubro"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-260"
        :disabled="disabled || catsLoading"
        :loading="catsLoading"
        :error="!!fieldErr('category_id')"
        :error-messages="fieldErr('category_id')"
        clearable
        no-data-text="No hay rubros cargados"
      />

      <!-- Subrubro -->
      <v-select
        v-model="model.subcategory_id"
        :items="subcategoriesForSelected"
        item-title="name"
        item-value="id"
        label="Subrubro"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-260"
        :disabled="disabled || !model.category_id || subsLoading"
        :loading="subsLoading"
        :error="!!fieldErr('subcategory_id')"
        :error-messages="fieldErr('subcategory_id')"
        clearable
        no-data-text="No hay subrubros para este rubro"
      />
    </div>

    <!-- Row 3 -->
    <div class="d-flex flex-wrap ga-3">
      <v-text-field
        v-model.trim="model.brand"
        label="Marca"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-240"
        :disabled="disabled"
        clearable
      />

      <v-text-field
        v-model.trim="model.model"
        label="Modelo"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-240"
        :disabled="disabled"
        clearable
      />
    </div>

    <!-- Descripción -->
    <v-textarea
      v-model.trim="model.description"
      label="Descripción"
      placeholder="Descripción clara para venta..."
      variant="outlined"
      density="comfortable"
      :disabled="disabled"
      rows="3"
      auto-grow
      clearable
    />
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from "vue";
import http from "../../../../app/api/http";
import { useProductsStore } from "../../../../app/store/products.store";

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  productId: { type: [Number, String], default: null },
});

const emit = defineEmits(["update:modelValue"]);
const productsStore = useProductsStore();

const model = computed({
  get: () => props.modelValue || {},
  set: (v) => emit("update:modelValue", v),
});

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function fieldErr(field) {
  return productsStore?.lastFieldErrors?.[field] || "";
}

// =====================
// SKU
// =====================
const skuInput = ref(String(model.value?.sku || ""));
const skuTouched = ref(false);

watch(
  () => model.value?.sku,
  (v) => {
    const s = String(v || "");
    if (s !== skuInput.value) skuInput.value = s;
  }
);

watch(
  () => skuInput.value,
  (v) => {
    model.value = { ...model.value, sku: String(v || "") };
  }
);

function normalizeSku(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "");
}

const skuError = computed(() => {
  const back = fieldErr("sku");
  if (back) return back;

  const s = normalizeSku(skuInput.value);
  if (!s) return "SKU requerido";
  if (s.length < 3) return "SKU muy corto (mínimo 3)";
  if (s.length > 64) return "SKU muy largo (máximo 64)";
  return "";
});

function onSkuBlur() {
  skuTouched.value = true;
  const norm = normalizeSku(skuInput.value);
  if (norm !== skuInput.value) skuInput.value = norm;
}

// =====================
// Normalizadores de items
// =====================
function unwrapList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.ok === false) return [];
  const v = res.data ?? res.items ?? res.rows ?? res.list ?? res.result ?? null;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.items)) return v.items;
  if (v && Array.isArray(v.rows)) return v.rows;
  return [];
}

function normalizeCategoryList(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (!x) return null;
      const id = toInt(x.id ?? x.value ?? 0, 0);
      const name = String(x.name ?? x.label ?? x.title ?? "").trim();
      if (!id || !name) return null;
      return { ...x, id, name };
    })
    .filter(Boolean);
}

function normalizeSubcategoryList(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (!x) return null;
      const id = toInt(x.id ?? x.value ?? x.subcategory_id ?? 0, 0);
      const name = String(x.name ?? x.label ?? x.title ?? "").trim();
      if (!id || !name) return null;

      // mapear category_id venga como venga
      const category_id =
        toInt(x.category_id, 0) ||
        toInt(x.categoryId, 0) ||
        toInt(x.rubro_id, 0) ||
        toInt(x.category?.id, 0) ||
        toInt(x.category, 0) ||
        null;

      return { ...x, id, name, category_id };
    })
    .filter(Boolean);
}

// =====================
// Rubros / Subrubros (POR RUBRO seleccionado)
// =====================
const catsLoading = ref(false);
const subsLoading = ref(false);

const categories = ref([]);
const subsByCat = ref({}); // { [catId]: [subcats] }

async function fetchCategories() {
  catsLoading.value = true;
  try {
    const { data } = await http.get("/categories");
    categories.value = normalizeCategoryList(unwrapList(data));
  } catch {
    categories.value = [];
  } finally {
    catsLoading.value = false;
  }
}

/**
 * Carga subrubros SOLO para el rubro seleccionado.
 * Soporta múltiples rutas posibles.
 */
async function fetchSubcategoriesForCategory(catId) {
  const cid = toInt(catId, 0);
  if (!cid) return;

  if (Array.isArray(subsByCat.value[cid]) && subsByCat.value[cid].length) return;

  subsLoading.value = true;

  const tries = [
    // 1) query param
    () => http.get("/subcategories", { params: { category_id: cid } }),
    () => http.get("/subcategories", { params: { categoryId: cid } }),
    // 2) nested route
    () => http.get(`/categories/${cid}/subcategories`),
    () => http.get(`/categories/${cid}/subcategories/list`),
  ];

  try {
    for (const fn of tries) {
      try {
        const { data } = await fn();
        const list = normalizeSubcategoryList(unwrapList(data));

        // si la ruta devuelve todos, filtramos por category_id
        const filtered = list.filter((s) => toInt(s.category_id, 0) === cid);

        // prioridad: si ya viene filtrado, usarlo; si no, usar el filtered
        const finalList = (filtered.length ? filtered : list).filter((s) => toInt(s.category_id, 0) === cid);

        subsByCat.value = { ...subsByCat.value, [cid]: finalList };
        break;
      } catch {
        // intentar siguiente ruta
      }
    }

    if (!Array.isArray(subsByCat.value[cid])) {
      subsByCat.value = { ...subsByCat.value, [cid]: [] };
    }
  } finally {
    subsLoading.value = false;
  }
}

const subcategoriesForSelected = computed(() => {
  const cid = toInt(model.value?.category_id, 0);
  if (!cid) return [];
  return subsByCat.value[cid] || [];
});

// si cambia rubro -> cargar subrubros y limpiar subrubro si no corresponde
watch(
  () => model.value?.category_id,
  async (cid) => {
    const catId = toInt(cid, 0);

    // al cambiar rubro, limpiar selección previa
    model.value = { ...model.value, subcategory_id: null };

    if (!catId) return;
    await fetchSubcategoriesForCategory(catId);
  },
  { immediate: true }
);

onMounted(async () => {
  await fetchCategories();

  const cid = toInt(model.value?.category_id, 0);
  if (cid) await fetchSubcategoriesForCategory(cid);
});
</script>

<style scoped>
.minw-240 { min-width: 240px; }
.minw-260 { min-width: 260px; }
.minw-320 { min-width: 320px; }
</style>
