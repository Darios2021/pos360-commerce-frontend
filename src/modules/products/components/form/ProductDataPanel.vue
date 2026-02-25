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
                <v-btn size="small" variant="tonal" @click="$emit('reload-taxonomies')">
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
                <v-btn size="small" variant="tonal" @click="$emit('reload-taxonomies')">
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

      <!-- ✅ SKU ABAJO + BLOQUEADO -->
      <v-col cols="12" md="8">
        <v-text-field
          :model-value="draft.sku"
          density="comfortable"
          variant="outlined"
          label="SKU (auto)"
          readonly
          disabled
          hide-details
          append-inner-icon="mdi-lock"
        />
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

  // ✅ vienen del dialog
  categories: { type: Array, default: () => [] },
  subcategories: { type: Array, default: () => [] },
});

defineEmits(["update:modelValue", "reload-taxonomies"]);

const products = useProductsStore();

const draft = computed({
  get: () => props.modelValue || {},
  set: (v) => emit("update:modelValue", v),
});

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

/**
 * ✅ Normaliza MUCHAS variantes:
 * - id / value / category_id / subcategory_id
 * - name / nombre / title / label / descripcion / category_name / subcategory_name
 * - category_id / categoryId / rubro_id / parent_id
 */
function normalizeList(arr) {
  const a = Array.isArray(arr) ? arr : [];
  return a
    .map((x) => {
      const id =
        toInt(x?.id, 0) ||
        toInt(x?.value, 0) ||
        toInt(x?.category_id, 0) ||
        toInt(x?.subcategory_id, 0) ||
        toInt(x?.rubro_id, 0) ||
        toInt(x?.subrubro_id, 0);

      const name = String(
        x?.name ??
          x?.nombre ??
          x?.title ??
          x?.label ??
          x?.text ??
          x?.descripcion ??
          x?.category_name ??
          x?.subcategory_name ??
          x?.rubro ??
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
  const p = normalizeList(props.categories);
  if (p.length) return p;
  return normalizeList(products?.categories || products?.meta?.categories || []);
});

const subcategoriesResolved = computed(() => {
  const p = normalizeList(props.subcategories);
  if (p.length) return p;
  return normalizeList(products?.subcategories || products?.meta?.subcategories || []);
});

const categoryId = computed({
  get: () => (draft.value?.category_id ? toInt(draft.value.category_id, 0) : null),
  set: (val) => {
    const v = val ? toInt(val, 0) : null;
    // al cambiar rubro => limpiar subrubro
    emit("update:modelValue", { ...draft.value, category_id: v, subcategory_id: null });
  },
});

const subcategoryId = computed({
  get: () => (draft.value?.subcategory_id ? toInt(draft.value.subcategory_id, 0) : null),
  set: (val) => {
    const v = val ? toInt(val, 0) : null;
    emit("update:modelValue", { ...draft.value, subcategory_id: v });
  },
});

const filteredSubcategories = computed(() => {
  const cid = categoryId.value ? toInt(categoryId.value, 0) : 0;
  const arr = subcategoriesResolved.value;

  if (!cid) return arr;

  const hasCat = arr.some((x) => toInt(x?.category_id, 0) > 0);
  if (!hasCat) return arr;

  return arr.filter((x) => toInt(x?.category_id, 0) === cid);
});
</script>

<style scoped>
.pdp {
  width: 100%;
}
</style>