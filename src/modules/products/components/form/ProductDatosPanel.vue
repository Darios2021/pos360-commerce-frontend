<!-- src/modules/products/components/form/ProductDatosPanel.vue -->
<template>
  <v-row dense>
    <v-col cols="12" md="8">
      <v-text-field
        v-model="m.name"
        label="Nombre"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('name')"
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="m.sku"
        label="SKU"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('sku')"
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="m.code"
        label="Código"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('code')"
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="m.brand"
        label="Marca"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('brand')"
      />
    </v-col>

    <v-col cols="12" md="4">
      <v-text-field
        v-model="m.model"
        label="Modelo"
        variant="outlined"
        density="comfortable"
        :error-messages="fieldErr('model')"
      />
    </v-col>

    <!-- Rubro / Subrubro -->
    <v-col cols="12" md="6">
      <v-select
        v-model="parentId"
        :items="parentItems"
        item-title="title"
        item-value="value"
        label="Rubro"
        variant="outlined"
        density="comfortable"
        clearable
        @update:modelValue="onParentChange"
      />
    </v-col>

    <v-col cols="12" md="6">
      <v-select
        v-model="childId"
        :items="childItems"
        item-title="title"
        item-value="value"
        label="Subrubro"
        variant="outlined"
        density="comfortable"
        clearable
        :disabled="!parentId"
        @update:modelValue="onChildChange"
      />
    </v-col>

    <v-col cols="12">
      <v-textarea
        v-model="m.description"
        label="Descripción"
        variant="outlined"
        density="comfortable"
        auto-grow
        :error-messages="fieldErr('description')"
      />
    </v-col>
  </v-row>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useCategoriesStore } from "../../../../app/store/categories.store";
import { useProductsStore } from "../../../../app/store/products.store";

const props = defineProps({
  modelValue: { type: Object, required: true },
});
const emit = defineEmits(["update:modelValue"]);

const categories = useCategoriesStore();
const products = useProductsStore();

const m = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

function fieldErr(key) {
  const map = products.lastFieldErrors || null;
  if (!map) return [];
  const v = map[key];
  return v ? [String(v)] : [];
}

// ✅ cargar categorías si hace falta
async function ensureCats() {
  try {
    if (typeof categories.fetchAll === "function") await categories.fetchAll(true);
  } catch {
    // ignore
  }
}
ensureCats();

const parentId = ref(null);
const childId = ref(null);

// ✅ inferir IDs si el item ya viene con category / category.parent
watch(
  () => m.value,
  (it) => {
    const cat = it?.category || null;
    const parent = cat?.parent || null;

    // Si ya viene armado desde backend
    const pid = parent?.id ? Number(parent.id) : null;
    const cid = parent?.id ? (cat?.id ? Number(cat.id) : null) : (cat?.id ? Number(cat.id) : null);

    // Si guardamos category_id plano
    const plain = Number(it?.category_id || 0) || null;

    if (pid) {
      parentId.value = pid;
      childId.value = cid;
      m.value.category_id = cid || null;
    } else if (plain && !parentId.value && !childId.value) {
      // sin parent info, no adivinamos, dejamos category_id como vino
      childId.value = plain;
      m.value.category_id = plain;
    }
  },
  { immediate: true, deep: true }
);

const parentItems = computed(() => {
  const out = [{ title: "—", value: null }];
  const parents = Array.isArray(categories.parents) ? categories.parents : [];
  parents
    .map((c) => ({ id: Number(c?.id || 0), name: String(c?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));
  return out;
});

const childItems = computed(() => {
  const out = [{ title: "—", value: null }];
  if (!parentId.value) return out;

  const pid = Number(parentId.value);
  const children = typeof categories.childrenByParent === "function" ? categories.childrenByParent(pid) : [];
  children
    .map((c) => ({ id: Number(c?.id || 0), name: String(c?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));

  return out;
});

function onParentChange() {
  childId.value = null;
  // si el rubro no tiene subrubro seleccionado, no seteamos category_id todavía
  m.value.category_id = null;
}
function onChildChange() {
  const cid = childId.value ? Number(childId.value) : null;
  m.value.category_id = cid;
}
</script>
