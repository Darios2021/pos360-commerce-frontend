<template>
  <v-dialog v-model="model" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="d-flex justify-space-between align-center">
        <div class="text-h6 font-weight-bold">
          {{ mode === "create" ? "Nuevo producto" : "Editar producto" }}
        </div>
        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-3" density="compact">
          {{ error }}
        </v-alert>

        <v-form @submit.prevent="submit">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field v-model="form.sku" label="SKU *" variant="outlined" />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field v-model="form.barcode" label="Barcode" variant="outlined" />
            </v-col>

            <v-col cols="12" md="4">
              <v-switch
                v-model="form.is_active"
                label="Activo"
                color="primary"
                inset
              />
            </v-col>

            <v-col cols="12">
              <v-text-field v-model="form.name" label="Nombre *" variant="outlined" />
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Descripción"
                variant="outlined"
                rows="3"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="form.brand" label="Marca" variant="outlined" />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field v-model="form.model" label="Modelo" variant="outlined" />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.cost"
                label="Costo"
                variant="outlined"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.price"
                label="Precio"
                variant="outlined"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.tax_rate"
                label="IVA (%)"
                variant="outlined"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.warranty_months"
                label="Garantía (meses)"
                variant="outlined"
                type="number"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-switch
                v-model="form.track_stock"
                label="Controla stock"
                color="primary"
                inset
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="form.category_id"
                label="category_id"
                variant="outlined"
                type="number"
                hint="Temporal. Cuando me pases categories.controller, lo cambio a select."
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-end ga-2">
        <v-btn variant="text" @click="close">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" :loading="loading" @click="submit">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "@/app/store/products.store";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create | edit
  productId: { type: [Number, String], default: null },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const store = useProductsStore();
const model = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const loading = ref(false);
const error = ref(null);

const emptyForm = () => ({
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

const form = ref(emptyForm());

function close() {
  model.value = false;
}

async function loadEdit() {
  if (props.mode !== "edit" || !props.productId) return;
  loading.value = true;
  error.value = null;
  try {
    const item = await store.getOne(props.productId);
    form.value = {
      sku: item.sku ?? "",
      barcode: item.barcode ?? "",
      name: item.name ?? "",
      description: item.description ?? "",
      category_id: item.category_id ?? null,
      brand: item.brand ?? "",
      model: item.model ?? "",
      warranty_months: item.warranty_months ?? 0,
      track_stock: !!item.track_stock,
      is_active: !!item.is_active,
      cost: Number(item.cost ?? 0),
      price: Number(item.price ?? 0),
      tax_rate: Number(item.tax_rate ?? 21),
    };
  } catch (e) {
    error.value = "No se pudo cargar el producto";
  } finally {
    loading.value = false;
  }
}

watch(
  () => model.value,
  async (v) => {
    if (!v) return;
    error.value = null;
    form.value = emptyForm();
    await loadEdit();
  }
);

async function submit() {
  loading.value = true;
  error.value = null;

  try {
    if (!form.value.sku || !form.value.name) {
      error.value = "SKU y Nombre son obligatorios";
      return;
    }

    const payload = {
      ...form.value,
      // switches -> 1/0 si tu backend guarda ints
      track_stock: form.value.track_stock ? 1 : 0,
      is_active: form.value.is_active ? 1 : 0,
    };

    if (props.mode === "create") {
      await store.create(payload);
    } else {
      await store.update(props.productId, payload);
    }

    emit("saved");
    close();
  } catch (e) {
    error.value = e?.response?.data?.message || "Error guardando";
  } finally {
    loading.value = false;
  }
}
</script>
