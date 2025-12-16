<!-- src/modules/products/components/ProductFormDialog.vue -->
<template>
  <v-dialog v-model="localOpen" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="text-h6 font-weight-bold">
          {{ title }}
        </div>

        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert
          v-if="errorText"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="errorText"
        />

        <v-form ref="formRef" @submit.prevent="save">
          <v-row dense>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.sku"
                label="SKU *"
                variant="outlined"
                density="comfortable"
                :rules="[r.required]"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.barcode"
                label="Barcode"
                variant="outlined"
                density="comfortable"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.brand"
                label="Marca"
                variant="outlined"
                density="comfortable"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="8">
              <v-text-field
                v-model="form.name"
                label="Nombre *"
                variant="outlined"
                density="comfortable"
                :rules="[r.required]"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.model"
                label="Modelo"
                variant="outlined"
                density="comfortable"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="8">
              <v-select
                v-model="form.category_id"
                label="Categoría"
                variant="outlined"
                density="comfortable"
                :items="cats.items || []"
                item-title="name"
                item-value="id"
                :loading="cats.loading"
                :disabled="loading"
                clearable
                prepend-inner-icon="mdi-shape-outline"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.warranty_months"
                type="number"
                label="Garantía (meses)"
                variant="outlined"
                density="comfortable"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Descripción"
                variant="outlined"
                density="comfortable"
                rows="3"
                auto-grow
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.cost"
                type="number"
                label="Costo"
                variant="outlined"
                density="comfortable"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.price"
                type="number"
                label="Precio"
                variant="outlined"
                density="comfortable"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.tax_rate"
                type="number"
                label="IVA (%)"
                variant="outlined"
                density="comfortable"
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-switch
                v-model="form.track_stock"
                label="Controla stock"
                density="comfortable"
                inset
                :disabled="loading"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-switch
                v-model="form.is_active"
                label="Activo"
                density="comfortable"
                inset
                :disabled="loading"
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-end ga-2">
        <v-btn variant="text" @click="close" :disabled="loading">
          Cancelar
        </v-btn>
        <v-btn color="primary" variant="flat" @click="save" :loading="loading">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";

// stores
import { useProductsStore } from "../../../app/store/products.store";
import { useCategoriesStore } from "../../../app/store/categories.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create | edit
  item: { type: Object, default: null },     // producto a editar
});

const emit = defineEmits(["update:open", "saved"]);

const products = useProductsStore();
const cats = useCategoriesStore();

const formRef = ref(null);

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const loading = computed(() => !!products.loading);

const title = computed(() =>
  props.mode === "edit" ? "Editar producto" : "Nuevo producto"
);

const errorText = computed(() => products.error || cats.error || "");

const form = reactive({
  sku: "",
  barcode: "",
  name: "",
  description: "",
  category_id: null,
  brand: "",
  model: "",
  warranty_months: 0,
  track_stock: true,
  is_active: true,
  cost: 0,
  price: 0,
  tax_rate: 21,
});

const r = {
  required: (v) => !!String(v ?? "").trim() || "Requerido",
};

function resetForm() {
  form.sku = "";
  form.barcode = "";
  form.name = "";
  form.description = "";
  form.category_id = null;
  form.brand = "";
  form.model = "";
  form.warranty_months = 0;
  form.track_stock = true;
  form.is_active = true;
  form.cost = 0;
  form.price = 0;
  form.tax_rate = 21;
}

function fillFormFromItem(item) {
  form.sku = item?.sku ?? "";
  form.barcode = item?.barcode ?? "";
  form.name = item?.name ?? "";
  form.description = item?.description ?? "";
  form.category_id = item?.category_id ?? item?.category?.id ?? null;
  form.brand = item?.brand ?? "";
  form.model = item?.model ?? "";
  form.warranty_months = Number(item?.warranty_months ?? 0);
  form.track_stock = !!item?.track_stock;
  form.is_active = !!item?.is_active;
  form.cost = Number(item?.cost ?? 0);
  form.price = Number(item?.price ?? 0);
  form.tax_rate = Number(item?.tax_rate ?? 21);
}

function close() {
  localOpen.value = false;
}

async function ensureCategories() {
  // ✅ Soporta distintos nombres de método en tu store
  const fn =
    cats.fetchAll ||
    cats.fetch ||
    cats.list;

  if (typeof fn !== "function") return;

  if (!Array.isArray(cats.items) || cats.items.length === 0) {
    await fn.call(cats);
  }
}

async function save() {
  const ok = await formRef.value?.validate?.();
  if (ok && ok.valid === false) return;

  const payload = {
    sku: form.sku,
    barcode: form.barcode || null,
    name: form.name,
    description: form.description || null,
    category_id: form.category_id || null,
    brand: form.brand || null,
    model: form.model || null,
    warranty_months: Number(form.warranty_months ?? 0),
    track_stock: form.track_stock ? 1 : 0,
    is_active: form.is_active ? 1 : 0,
    cost: Number(form.cost ?? 0),
    price: Number(form.price ?? 0),
    tax_rate: Number(form.tax_rate ?? 21),
  };

  if (props.mode === "edit" && props.item?.id) {
    await products.update(props.item.id, payload);
  } else {
    await products.create(payload);
  }

  // si hubo error, no cierro
  if (products.error) return;

  emit("saved");
  close();
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;

    // al abrir, cargo categorías y seteo form
    await ensureCategories();

    if (props.mode === "edit" && props.item) {
      fillFormFromItem(props.item);
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  // por si abre sin watch en alguna navegación rara
  if (props.open) await ensureCategories();
});
</script>
