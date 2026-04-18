<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/form/ProductDataPanel.vue -->
<template>
  <div class="pdp">
    <v-row dense>
      <!-- Nombre -->
      <v-col cols="12" md="8">
        <v-text-field
          v-model="draft.name"
          :disabled="disabled"
          density="comfortable"
          variant="outlined"
          label="Nombre"
          hide-details
        />
      </v-col>

      <!-- Rubro -->
      <v-col cols="12" md="6">
        <v-select
          v-model="categoryId"
          :items="categoriesResolved"
          item-title="name"
          item-value="id"
          :disabled="disabled"
          density="comfortable"
          variant="outlined"
          label="Rubro"
          hide-details
          clearable
          :menu-props="{ maxHeight: 420 }"
        >
          <template #no-data>
            <div class="pa-4 text-caption text-medium-emphasis">
              No hay rubros cargados.
              <div class="mt-2">
                <v-btn size="small" variant="tonal" @click="emit('reload-taxonomies')">
                  <v-icon start size="18">mdi-refresh</v-icon>
                  Recargar
                </v-btn>
              </div>
            </div>
          </template>
        </v-select>
      </v-col>

      <!-- Subrubro -->
      <v-col cols="12" md="6">
        <v-select
          v-model="subcategoryId"
          :items="filteredSubcategories"
          item-title="name"
          item-value="id"
          :disabled="disabled || !categoryId"
          density="comfortable"
          variant="outlined"
          label="Subrubro"
          hide-details
          clearable
          :menu-props="{ maxHeight: 420 }"
        >
          <template #no-data>
            <div class="pa-4 text-caption text-medium-emphasis">
              No hay subrubros para este rubro.
              <div class="mt-2">
                <v-btn size="small" variant="tonal" @click="emit('reload-taxonomies')">
                  <v-icon start size="18">mdi-refresh</v-icon>
                  Recargar
                </v-btn>
              </div>
            </div>
          </template>
        </v-select>
      </v-col>

      <!-- Marca -->
      <v-col cols="12" md="6">
        <v-text-field
          v-model="draft.brand"
          :disabled="disabled"
          density="comfortable"
          variant="outlined"
          label="Marca"
          hide-details
        />
      </v-col>

      <!-- Modelo -->
      <v-col cols="12" md="6">
        <v-text-field
          v-model="draft.model"
          :disabled="disabled"
          density="comfortable"
          variant="outlined"
          label="Modelo"
          hide-details
        />
      </v-col>

      <!-- Descripción -->
      <v-col cols="12">
        <v-textarea
          v-model="draft.description"
          :disabled="disabled"
          density="comfortable"
          variant="outlined"
          label="Descripción"
          auto-grow
          rows="3"
          hide-details
        />
      </v-col>

      <!-- SKU -->
      <v-col cols="12" md="8">
        <v-text-field
          :model-value="skuDisplay"
          density="comfortable"
          variant="outlined"
          label="SKU (auto)"
          readonly
          disabled
          hide-details
          append-inner-icon="mdi-lock"
        />
        <div v-if="skuIsPreview" class="pdp-sku-hint">
          Preview (se fija al final)
        </div>
      </v-col>

      <v-col cols="12" md="4" class="d-flex align-end justify-end">
        <v-btn variant="tonal" class="w-100" disabled>
          <v-icon start>mdi-auto-fix</v-icon>
          SUGERIR
        </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  disabled: { type: Boolean, default: false },
  productId: { type: [Number, String, null], default: null },

  categories: { type: [Array, Object], default: () => [] },
  subcategories: { type: [Array, Object], default: () => [] },

  skuPreview: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "reload-taxonomies"]);

const products = useProductsStore();

const draft = computed({
  get: () => props.modelValue || {},
  set: (v) => emit("update:modelValue", v),
});

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function unwrapArray(input) {
  if (Array.isArray(input)) return input;

  const o = input || {};
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.rows)) return o.rows;
  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.results)) return o.results;

  if (o.data && Array.isArray(o.data.items)) return o.data.items;
  if (o.data && Array.isArray(o.data.rows)) return o.data.rows;

  return [];
}

/* ✅ CATEGORÍAS */
function normalizeCategories(input) {
  return unwrapArray(input)
    .map((x) => {
      const id =
        toInt(x?.category_id, 0) ||
        toInt(x?.rubro_id, 0) ||
        toInt(x?.id, 0) ||
        toInt(x?.value, 0);

      const name = String(
        x?.name ??
          x?.nombre ??
          x?.title ??
          x?.label ??
          x?.text ??
          x?.descripcion ??
          x?.category_name ??
          x?.rubro ??
          ""
      ).trim();

      const parent_id = toInt(x?.parent_id, 0) || null;

      return { id, name, parent_id };
    })
    .filter((x) => x.id > 0 && x.name);
}

/* ✅ SUBCATEGORÍAS */
function normalizeSubcategories(input) {
  return unwrapArray(input)
    .map((x) => {
      const id =
        toInt(x?.subcategory_id, 0) ||
        toInt(x?.subrubro_id, 0) ||
        toInt(x?.id, 0) ||
        toInt(x?.value, 0);

      const name = String(
        x?.name ??
          x?.nombre ??
          x?.title ??
          x?.label ??
          x?.text ??
          x?.descripcion ??
          x?.subcategory_name ??
          x?.subrubro ??
          ""
      ).trim();

      const category_id =
        toInt(x?.category_id, 0) ||
        toInt(x?.categoryId, 0) ||
        toInt(x?.rubro_id, 0) ||
        toInt(x?.parent_id, 0) ||
        0;

      return { id, name, category_id };
    })
    .filter((x) => x.id > 0 && x.name);
}

const categoriesResolved = computed(() => {
  const fromProps = normalizeCategories(props.categories);
  // Only show root categories (no parent) in the Rubro dropdown
  const rootsFromProps = fromProps.filter((c) => !c.parent_id);
  if (rootsFromProps.length) return rootsFromProps;
  if (fromProps.length) return fromProps;

  const fromStore = normalizeCategories(products?.categories || products?.meta?.categories || []);
  const rootsFromStore = fromStore.filter((c) => !c.parent_id);
  return rootsFromStore.length ? rootsFromStore : fromStore;
});

const subcategoriesResolved = computed(() => {
  const fromProps = normalizeSubcategories(props.subcategories);
  if (fromProps.length) return fromProps;

  return normalizeSubcategories(products?.subcategories || products?.meta?.subcategories || []);
});

const categoryId = computed({
  get: () => {
    const v =
      draft.value?.category_id ??
      draft.value?.categoryId ??
      draft.value?.rubro_id ??
      draft.value?.rubroId ??
      null;

    const n = toInt(v, 0);
    return n > 0 ? n : null;
  },
  set: (val) => {
    const v = val ? toInt(val, 0) : null;
    emit("update:modelValue", {
      ...draft.value,
      category_id: v,
      subcategory_id: null,
    });
  },
});

const subcategoryId = computed({
  get: () => {
    const v =
      draft.value?.subcategory_id ??
      draft.value?.subcategoryId ??
      draft.value?.sub_category_id ??
      draft.value?.subrubro_id ??
      draft.value?.subrubroId ??
      null;

    const n = toInt(v, 0);
    return n > 0 ? n : null;
  },
  set: (val) => {
    const v = val ? toInt(val, 0) : null;
    emit("update:modelValue", {
      ...draft.value,
      subcategory_id: v,
    });
  },
});

const filteredSubcategories = computed(() => {
  const cid = toInt(categoryId.value, 0);
  const arr = subcategoriesResolved.value;

  if (!cid) return [];
  return arr.filter((x) => toInt(x?.category_id, 0) === cid);
});

const skuDisplay = computed(() => {
  const real = String(draft.value?.sku || "").trim();
  if (real) return real;

  const prev = String(props.skuPreview || "").trim();
  return prev;
});

const skuIsPreview = computed(() => {
  const real = String(draft.value?.sku || "").trim();
  const prev = String(props.skuPreview || "").trim();
  return !real && !!prev;
});
</script>

<style scoped>
.pdp {
  width: 100%;
}

.pdp-sku-hint {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.75;
}
</style>