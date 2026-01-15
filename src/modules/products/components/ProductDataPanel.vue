<!-- src/modules/products/components/ProductDataPanel.vue -->
<template>
  <div class="pd-root">
    <v-row dense>
      <!-- Nombre -->
      <v-col cols="12" md="6">
        <v-text-field
          v-model="model.name"
          label="Nombre"
          variant="outlined"
          density="comfortable"
          :disabled="disabled"
        />
      </v-col>

      <!-- SKU -->
      <v-col cols="12" md="3">
        <v-text-field
          v-model="model.sku"
          label="SKU"
          variant="outlined"
          density="comfortable"
          :disabled="disabled"
        />
      </v-col>

      <!-- Código -->
      <v-col cols="12" md="3">
        <v-text-field
          v-model="model.code"
          label="Código"
          variant="outlined"
          density="comfortable"
          :disabled="disabled"
        />
      </v-col>

      <!-- Rubro (parent) -->
      <v-col cols="12" md="4">
        <v-select
          v-model="rubroId"
          :items="categoryItems"
          item-title="title"
          item-value="value"
          label="Rubro"
          variant="outlined"
          density="comfortable"
          clearable
          :disabled="disabled || categoriesLoading"
          @update:modelValue="onRubroChange"
        />
      </v-col>

      <!-- Subrubro (child) -->
      <v-col cols="12" md="4">
        <v-select
          v-model="subrubroId"
          :items="subcategoryItems"
          item-title="title"
          item-value="value"
          label="Subrubro"
          variant="outlined"
          density="comfortable"
          clearable
          :disabled="disabled || categoriesLoading || !rubroId"
          @update:modelValue="onSubrubroChange"
        />
      </v-col>

      <!-- Track stock (si lo tenías) -->
      <v-col cols="12" md="4">
        <v-switch
          v-model="model.track_stock"
          inset
          label="Controlar stock"
          :disabled="disabled"
        />
      </v-col>

      <!-- Marca -->
      <v-col cols="12" md="6">
        <v-text-field
          v-model="model.brand"
          label="Marca"
          variant="outlined"
          density="comfortable"
          :disabled="disabled"
        />
      </v-col>

      <!-- Modelo -->
      <v-col cols="12" md="6">
        <v-text-field
          v-model="model.model"
          label="Modelo"
          variant="outlined"
          density="comfortable"
          :disabled="disabled"
        />
      </v-col>

      <!-- Descripción -->
      <v-col cols="12">
        <v-textarea
          v-model="model.description"
          label="Descripción"
          variant="outlined"
          density="comfortable"
          auto-grow
          rows="3"
          :disabled="disabled"
        />
      </v-col>

      <v-col cols="12" class="text-caption text-medium-emphasis">
        ID producto: <b>{{ productId || "—" }}</b>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useCategoriesStore } from "../../../app/store/categories.store";

const props = defineProps({
  modelValue: { type: Object, required: true }, // form reactive
  disabled: { type: Boolean, default: false },
  productId: { type: [Number, String], default: null },
});

const emit = defineEmits(["update:modelValue"]);

const categories = useCategoriesStore();
const categoriesLoading = ref(false);

// two-way for object (keep reference stable)
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function toInt(v, d = null) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

// UI ids
const rubroId = ref(null);
const subrubroId = ref(null);

async function loadCategories() {
  try {
    categoriesLoading.value = true;
    if (typeof categories.fetchAll === "function") {
      await categories.fetchAll(true);
    }
  } finally {
    categoriesLoading.value = false;
  }
}

const categoryItems = computed(() => {
  const out = [{ title: "—", value: null }];
  const parents = Array.isArray(categories.parents) ? categories.parents : [];
  parents
    .map((c) => ({ id: toInt(c?.id, 0), name: String(c?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));
  return out;
});

const subcategoryItems = computed(() => {
  const out = [{ title: "—", value: null }];
  const pid = toInt(rubroId.value, 0);
  if (!pid) return out;

  const children =
    typeof categories.childrenByParent === "function"
      ? categories.childrenByParent(pid)
      : [];

  children
    .map((c) => ({ id: toInt(c?.id, 0), name: String(c?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));

  return out;
});

/**
 * ✅ Hidratación inteligente:
 * Si viene model.category_id (subrubro) => deducimos rubro por parent.
 * Si viene model.category (obj con parent) => también.
 */
function inferCategoryIdsFromModel() {
  const catId = toInt(model.value.category_id, null);
  const catObj = model.value.category || null;

  // Caso 1: viene category object con parent
  if (catObj?.id) {
    const subId = toInt(catObj.id, null);
    const parentId = toInt(catObj?.parent?.id, null);

    if (parentId) {
      rubroId.value = parentId;
      subrubroId.value = subId;
      model.value.category_id = subId;
      return;
    }

    // si no hay parent => es rubro directo
    rubroId.value = subId;
    subrubroId.value = null;
    model.value.category_id = subId;
    return;
  }

  // Caso 2: solo category_id (sub)
  if (catId) {
    // si childrenByParent existe, buscamos el parent que lo contiene
    const parents = Array.isArray(categories.parents) ? categories.parents : [];
    for (const p of parents) {
      const pid = toInt(p?.id, 0);
      if (!pid) continue;
      const children =
        typeof categories.childrenByParent === "function"
          ? categories.childrenByParent(pid)
          : [];
      const found = (children || []).find((c) => toInt(c?.id, 0) === catId);
      if (found) {
        rubroId.value = pid;
        subrubroId.value = catId;
        return;
      }
    }

    // si no lo encontramos como hijo, lo tratamos como rubro directo
    rubroId.value = catId;
    subrubroId.value = null;
  } else {
    rubroId.value = null;
    subrubroId.value = null;
  }
}

function onRubroChange(v) {
  const rid = toInt(v, null);
  rubroId.value = rid;
  subrubroId.value = null;

  // si el rubro no tiene sub, category_id puede ser rubro
  model.value.category_id = rid;

  // si cambia rubro, limpiamos sub en model
}

function onSubrubroChange(v) {
  const sid = toInt(v, null);
  subrubroId.value = sid;

  // si elige sub => category_id = sub
  model.value.category_id = sid || rubroId.value || null;
}

onMounted(async () => {
  await loadCategories();
  inferCategoryIdsFromModel();
});

// si cambia el modelValue (edit load), re-inferimos
watch(
  () => model.value?.category_id,
  () => {
    // si todavía no cargaron categorías, defer
    if (categoriesLoading.value) return;
    inferCategoryIdsFromModel();
  }
);

// si cambia el objeto category (cuando fetchOne trae includes)
watch(
  () => model.value?.category,
  () => {
    if (categoriesLoading.value) return;
    inferCategoryIdsFromModel();
  },
  { deep: true }
);
</script>

<style scoped>
.pd-root { padding-top: 2px; }
</style>
