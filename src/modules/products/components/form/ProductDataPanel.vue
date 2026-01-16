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
        :hint="skuHint"
        persistent-hint
        @blur="onSkuBlur"
        @keydown.enter.prevent
        clearable
      >
        <template #append-inner>
          <v-btn
            v-if="!disabled"
            size="small"
            variant="tonal"
            class="ml-2"
            @click="applySuggestedSku"
            :disabled="!suggestedSku"
            title="Generar SKU sugerido"
          >
            <v-icon start size="18">mdi-auto-fix</v-icon>
            Sugerir
          </v-btn>
        </template>
      </v-text-field>
    </div>

    <!-- Row 2: Rubro/Subrubro -->
    <div class="d-flex flex-wrap ga-3">
      <!-- Rubro -->
      <v-select
        v-model="model.category_id"
        :items="rubros"
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
        :items="subrubrosForSelected"
        item-title="name"
        item-value="id"
        label="Subrubro"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-260"
        :disabled="disabled || !model.category_id || catsLoading"
        :loading="catsLoading"
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
        placeholder="Ej: HQ"
        variant="outlined"
        density="comfortable"
        class="flex-1 minw-240"
        :disabled="disabled"
        clearable
      />

      <v-text-field
        v-model.trim="model.model"
        label="Modelo"
        placeholder="Ej: Spirit Boost Pulse"
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
// SKU PRO (normaliza + sugiere)
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

function suggestSkuFromName(name) {
  const base = String(name || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!base) return "";
  const parts = base.split(" ").filter(Boolean).slice(0, 6);
  return normalizeSku(parts.join("-"));
}

const suggestedSku = computed(() => {
  const cur = normalizeSku(skuInput.value);
  if (cur) return "";
  return suggestSkuFromName(model.value?.name);
});

const skuError = computed(() => {
  const back = fieldErr("sku");
  if (back) return back;

  const s = normalizeSku(skuInput.value);
  if (!s) return "SKU requerido (ej: HQ-SPIRIT-BOOST-PULSE)";
  if (s.length < 3) return "SKU muy corto (mínimo 3)";
  if (s.length > 64) return "SKU muy largo (máximo 64)";
  if (!/^[A-Z0-9][A-Z0-9\-_]*$/.test(s)) return "Solo letras/números/guion/underscore";
  return "";
});

const skuHint = computed(() => {
  const s = normalizeSku(skuInput.value);
  if (!s) return "Tip: usá guiones y mayúsculas. Ej: CABLE-ATHENEA-TIPO-C";
  if (skuTouched.value && !skuError.value) return "OK ✅";
  return "Se normaliza automáticamente al salir del campo.";
});

function onSkuBlur() {
  skuTouched.value = true;
  const norm = normalizeSku(skuInput.value);
  if (norm !== skuInput.value) skuInput.value = norm;
}

function applySuggestedSku() {
  if (!suggestedSku.value) return;
  skuInput.value = suggestedSku.value;
  skuTouched.value = true;
  onSkuBlur();
}

// =====================
// CATEGORÍAS (RUBROS Y SUBRUBROS DESDE /categories)
// Tu backend: Category { id, name, parent_id, is_active }
// Rubro = parent_id == null
// Subrubro = parent_id == rubro.id
// =====================
const catsLoading = ref(false);
const allCategories = ref([]);

function unwrapList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.ok === false) return [];
  const v = res.items ?? res.data ?? res.rows ?? res.list ?? res.result ?? null;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.items)) return v.items;
  if (v && Array.isArray(v.rows)) return v.rows;
  return [];
}

function normalizeCats(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (!x) return null;
      const id = toInt(x.id ?? x.value ?? 0, 0);
      const name = String(x.name ?? x.label ?? x.title ?? "").trim();
      const parent_id =
        x.parent_id === null || x.parent_id === undefined || x.parent_id === ""
          ? null
          : toInt(x.parent_id, 0);

      const is_active = x.is_active === undefined ? 1 : toInt(x.is_active, 1);

      if (!id || !name) return null;
      return { ...x, id, name, parent_id, is_active };
    })
    .filter(Boolean);
}

async function fetchCategories() {
  catsLoading.value = true;
  try {
    const { data } = await http.get("/categories");
    allCategories.value = normalizeCats(unwrapList(data));
  } catch {
    allCategories.value = [];
  } finally {
    catsLoading.value = false;
  }
}

const rubros = computed(() => {
  // rubros = categorias sin parent (y activas)
  return (allCategories.value || [])
    .filter((c) => c.is_active === 1 && (c.parent_id === null || c.parent_id === 0))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
});

const subrubrosForSelected = computed(() => {
  const cid = toInt(model.value?.category_id, 0);
  if (!cid) return [];
  return (allCategories.value || [])
    .filter((c) => c.is_active === 1 && toInt(c.parent_id, 0) === cid)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)));
});

// si cambia rubro -> limpiar subrubro si no corresponde
watch(
  () => model.value?.category_id,
  (cid) => {
    const catId = toInt(cid, 0);
    const sid = toInt(model.value?.subcategory_id, 0);
    if (!sid) {
      // nada
    } else {
      const ok = (allCategories.value || []).some(
        (c) => toInt(c.id, 0) === sid && toInt(c.parent_id, 0) === catId
      );
      if (!ok) model.value = { ...model.value, subcategory_id: null };
    }
  }
);

onMounted(async () => {
  await fetchCategories();
});
</script>

<style scoped>
.minw-240 { min-width: 240px; }
.minw-260 { min-width: 260px; }
.minw-320 { min-width: 320px; }
</style>
