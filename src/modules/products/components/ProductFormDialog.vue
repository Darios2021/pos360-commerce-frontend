<!-- src/modules/products/components/ProductFormDialog.vue -->
<template>
  <v-dialog v-model="localOpen" max-width="980" scrollable>
    <v-card class="pos-card">
      <v-card-title class="d-flex align-center justify-space-between py-4">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">{{ title }}</div>
          <div class="text-caption text-medium-emphasis">
            Elegí Rubro y luego Sub rubro (parametrización). Imágenes listas para MinIO.
          </div>
        </div>

        <div class="d-flex ga-2 align-center">
          <v-chip v-if="props.mode === 'edit'" size="small" variant="tonal">
            ID #{{ props.item?.id }}
          </v-chip>
          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert v-if="errorText" type="error" variant="tonal" class="mb-4" :text="errorText" />

        <v-tabs v-model="tab" density="comfortable" class="mb-4">
          <v-tab value="basic" prepend-icon="mdi-text-box-outline">Datos</v-tab>
          <v-tab value="pricing" prepend-icon="mdi-cash-multiple">Precios</v-tab>
          <v-tab value="flags" prepend-icon="mdi-tune-variant">Estado</v-tab>
          <v-tab value="images" prepend-icon="mdi-image-multiple">Imágenes</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- DATOS -->
          <v-window-item value="basic">
            <v-form ref="formRef" @submit.prevent="save">
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.sku"
                    label="SKU *"
                    prepend-inner-icon="mdi-tag-outline"
                    :rules="[r.required]"
                    :disabled="loading"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.code"
                    label="Código"
                    prepend-inner-icon="mdi-barcode"
                    :disabled="loading"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.barcode"
                    label="Barcode"
                    prepend-inner-icon="mdi-barcode-scan"
                    :disabled="loading"
                  />
                </v-col>

                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="form.name"
                    label="Nombre *"
                    prepend-inner-icon="mdi-format-title"
                    :rules="[r.required]"
                    :disabled="loading"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.brand"
                    label="Marca"
                    prepend-inner-icon="mdi-factory"
                    :disabled="loading"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.model"
                    label="Modelo"
                    prepend-inner-icon="mdi-cube-outline"
                    :disabled="loading"
                  />
                </v-col>

                <!-- Rubro -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="rubroId"
                    label="Rubro"
                    :items="rubros"
                    item-title="name"
                    item-value="id"
                    :loading="cats.loading"
                    :disabled="loading"
                    clearable
                    prepend-inner-icon="mdi-shape-outline"
                    @update:modelValue="onRubroChange"
                  />
                </v-col>

                <!-- Subrubro -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="form.category_id"
                    label="Sub rubro"
                    :items="subrubros"
                    item-title="name"
                    item-value="id"
                    :loading="cats.loading"
                    :disabled="loading || !rubroId"
                    clearable
                    prepend-inner-icon="mdi-shape-plus-outline"
                    :rules="[r.requiredIfRubro]"
                    no-data-text="No hay subrubros para este rubro"
                  />
                  <div
                    v-if="rubroId && !cats.loading && subrubros.length === 0"
                    class="text-caption text-medium-emphasis mt-1"
                  >
                    No hay subrubros cargados. Crealos en la parametrización (tabla <b>categories</b> con <b>parent_id</b>).
                  </div>
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="form.warranty_months"
                    type="number"
                    label="Garantía (meses)"
                    prepend-inner-icon="mdi-shield-check-outline"
                    :disabled="loading"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.description"
                    label="Descripción"
                    prepend-inner-icon="mdi-text-long"
                    rows="3"
                    auto-grow
                    :disabled="loading"
                  />
                </v-col>
              </v-row>
            </v-form>
          </v-window-item>

          <!-- PRECIOS -->
          <v-window-item value="pricing">
            <v-row dense>
              <v-col cols="12">
                <v-card variant="tonal" class="pa-4" rounded="xl">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="font-weight-bold">Precios</div>
                    <div class="text-caption text-medium-emphasis">Lista / Descuento / Revendedor</div>
                  </div>

                  <v-row dense>
                    <v-col cols="12" md="4">
                      <v-text-field v-model.number="form.cost" type="number" label="Costo" prepend-inner-icon="mdi-currency-usd" :disabled="loading" />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field v-model.number="form.price" type="number" label="Precio (general)" prepend-inner-icon="mdi-cash" :disabled="loading" />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field v-model.number="form.tax_rate" type="number" label="IVA (%)" prepend-inner-icon="mdi-percent" :disabled="loading" />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field v-model.number="form.price_list" type="number" label="Precio lista" prepend-inner-icon="mdi-format-list-bulleted" :disabled="loading" />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field v-model.number="form.price_discount" type="number" label="Precio descuento" prepend-inner-icon="mdi-sale" :disabled="loading" />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field v-model.number="form.price_reseller" type="number" label="Precio revendedor" prepend-inner-icon="mdi-account-tie-outline" :disabled="loading" />
                    </v-col>
                  </v-row>

                  <v-alert type="info" variant="tonal" density="compact" class="mt-2">
                    Tip: si no usás <b>Precio (general)</b>, podés dejarlo en 0 y trabajar solo con lista/descuento/revendedor.
                  </v-alert>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- ESTADO -->
          <v-window-item value="flags">
            <v-row dense>
              <v-col cols="12">
                <v-card variant="tonal" class="pa-4" rounded="xl">
                  <div class="font-weight-bold mb-3">Estado del producto</div>

                  <v-row dense>
                    <v-col cols="12" md="3"><v-switch v-model="form.is_new" label="Artículo nuevo" inset :disabled="loading" /></v-col>
                    <v-col cols="12" md="3"><v-switch v-model="form.is_promo" label="En promoción" inset :disabled="loading" /></v-col>
                    <v-col cols="12" md="3"><v-switch v-model="form.track_stock" label="Controla stock" inset :disabled="loading" /></v-col>
                    <v-col cols="12" md="3"><v-switch v-model="form.is_active" label="Activo" inset :disabled="loading" /></v-col>
                  </v-row>

                  <v-divider class="my-3" />

                  <div class="d-flex flex-wrap ga-2">
                    <v-chip :color="form.is_active ? 'primary' : 'red'" variant="tonal">
                      {{ form.is_active ? "Activo" : "Inactivo" }}
                    </v-chip>
                    <v-chip :color="form.is_promo ? 'green' : 'grey'" variant="tonal">
                      {{ form.is_promo ? "En promo" : "No promo" }}
                    </v-chip>
                    <v-chip variant="tonal">{{ form.is_new ? "Nuevo" : "Existente" }}</v-chip>
                    <v-chip variant="tonal">{{ form.track_stock ? "Controla stock" : "Sin stock" }}</v-chip>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- IMÁGENES -->
          <v-window-item value="images">
            <v-row dense>
              <v-col cols="12">
                <v-card variant="tonal" class="pa-4" rounded="xl">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="font-weight-bold">Imágenes</div>
                    <div class="text-caption text-medium-emphasis">Máximo 3 · listo para MinIO</div>
                  </div>

                  <v-file-input
                    v-model="imageFiles"
                    accept="image/*"
                    multiple
                    :counter="true"
                    :show-size="true"
                    label="Seleccionar imágenes"
                    prepend-inner-icon="mdi-image-multiple"
                    :disabled="loading"
                    @update:modelValue="onImagesSelected"
                  />

                  <v-alert v-if="imagesError" type="warning" variant="tonal" class="mt-3">
                    {{ imagesError }}
                  </v-alert>

                  <v-row v-if="imagePreviews.length" class="mt-3">
                    <v-col v-for="(src, idx) in imagePreviews" :key="idx" cols="12" sm="6" md="4">
                      <v-card rounded="xl" class="overflow-hidden" elevation="1">
                        <v-img :src="src" height="170" cover />
                        <v-card-actions class="justify-space-between">
                          <div class="text-caption">Imagen #{{ idx + 1 }}</div>
                          <v-btn size="small" variant="text" color="error" @click="removeImage(idx)">Quitar</v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                  </v-row>

                  <v-divider class="my-3" />

                  <div class="text-caption text-medium-emphasis">
                    Cuando esté MinIO: subimos estas imágenes y guardamos URLs en <b>product_images</b>.
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-end ga-2">
        <v-btn variant="text" @click="close" :disabled="loading">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save-outline" @click="save" :loading="loading">
          Guardar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";
import { useCategoriesStore } from "../../../app/store/categories.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  item: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "saved"]);

const products = useProductsStore();
const cats = useCategoriesStore();

const tab = ref("basic");
const formRef = ref(null);
const rubroId = ref(null);

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const loading = computed(() => !!products.loading);
const title = computed(() => (props.mode === "edit" ? "Editar producto" : "Nuevo producto"));
const errorText = computed(() => products.error || cats.error || "");

// ✅ robusto con Number() para evitar string vs number
const rubros = computed(() =>
  (cats.items || []).filter((c) => !c.parent_id && Number(c.is_active ?? 1) !== 0)
);

const subrubros = computed(() =>
  (cats.items || []).filter(
    (c) =>
      Number(c.parent_id ?? 0) === Number(rubroId.value ?? 0) &&
      Number(c.is_active ?? 1) !== 0
  )
);

const form = reactive({
  code: "",
  sku: "",
  barcode: "",
  name: "",
  description: "",
  category_id: null,
  brand: "",
  model: "",
  warranty_months: 0,
  is_new: false,
  is_promo: false,
  track_stock: true,
  is_active: true,
  cost: 0,
  price: 0,
  price_list: 0,
  price_discount: 0,
  price_reseller: 0,
  tax_rate: 21,
});

const imageFiles = ref([]);
const imagePreviews = ref([]);
const imagesError = ref("");

const r = {
  required: (v) => !!String(v ?? "").trim() || "Requerido",
  requiredIfRubro: () => (!!rubroId.value ? (!!form.category_id || "Elegí un sub rubro") : true),
};

function close() {
  localOpen.value = false;
}

async function ensureCategories() {
  await cats.fetchAll?.();
}

function onRubroChange() {
  form.category_id = null;
}

function resetForm() {
  form.code = "";
  form.sku = "";
  form.barcode = "";
  form.name = "";
  form.description = "";
  form.category_id = null;
  form.brand = "";
  form.model = "";
  form.warranty_months = 0;

  form.is_new = false;
  form.is_promo = false;
  form.track_stock = true;
  form.is_active = true;

  form.cost = 0;
  form.price = 0;
  form.price_list = 0;
  form.price_discount = 0;
  form.price_reseller = 0;
  form.tax_rate = 21;

  rubroId.value = null;

  imageFiles.value = [];
  imagePreviews.value = [];
  imagesError.value = "";
  tab.value = "basic";
}

function fillFormFromItem(item) {
  form.code = item?.code ?? "";
  form.sku = item?.sku ?? "";
  form.barcode = item?.barcode ?? "";
  form.name = item?.name ?? "";
  form.description = item?.description ?? "";

  const leafId = item?.category_id ?? item?.category?.id ?? null;
  form.category_id = leafId ? Number(leafId) : null;

  // si no viene parent, lo calculo desde cats.items
  const leaf = form.category_id ? (cats.items || []).find((c) => Number(c.id) === Number(form.category_id)) : null;
  rubroId.value = leaf?.parent_id ? Number(leaf.parent_id) : null;

  form.brand = item?.brand ?? "";
  form.model = item?.model ?? "";
  form.warranty_months = Number(item?.warranty_months ?? 0);

  form.is_new = !!item?.is_new;
  form.is_promo = !!item?.is_promo;
  form.track_stock = !!item?.track_stock;
  form.is_active = !!item?.is_active;

  form.cost = Number(item?.cost ?? 0);
  form.price = Number(item?.price ?? 0);
  form.price_list = Number(item?.price_list ?? 0);
  form.price_discount = Number(item?.price_discount ?? 0);
  form.price_reseller = Number(item?.price_reseller ?? 0);
  form.tax_rate = Number(item?.tax_rate ?? 21);

  tab.value = "basic";
}

function onImagesSelected(files) {
  imagesError.value = "";
  const arr = Array.isArray(files) ? files : files ? [files] : [];
  if (arr.length > 3) imagesError.value = "Máximo 3 imágenes. Quitá alguna.";
  const trimmed = arr.slice(0, 3);
  imageFiles.value = trimmed;
  imagePreviews.value = trimmed.map((f) => URL.createObjectURL(f));
}

function removeImage(idx) {
  const f = [...(imageFiles.value || [])];
  f.splice(idx, 1);
  imageFiles.value = f;

  const p = [...(imagePreviews.value || [])];
  p.splice(idx, 1);
  imagePreviews.value = p;
}

async function save() {
  const ok = await formRef.value?.validate?.();
  if (ok && ok.valid === false) return;

  const payload = {
    code: form.code || null,
    sku: form.sku,
    barcode: form.barcode || null,
    name: form.name,
    description: form.description || null,
    category_id: form.category_id || null,
    brand: form.brand || null,
    model: form.model || null,
    warranty_months: Number(form.warranty_months ?? 0),
    is_new: form.is_new ? 1 : 0,
    is_promo: form.is_promo ? 1 : 0,
    track_stock: form.track_stock ? 1 : 0,
    is_active: form.is_active ? 1 : 0,
    cost: Number(form.cost ?? 0),
    price: Number(form.price ?? 0),
    price_list: Number(form.price_list ?? 0),
    price_discount: Number(form.price_discount ?? 0),
    price_reseller: Number(form.price_reseller ?? 0),
    tax_rate: Number(form.tax_rate ?? 21),
  };

  if (props.mode === "edit" && props.item?.id) await products.update(props.item.id, payload);
  else await products.create(payload);

  if (products.error) return;

  emit("saved", { mode: props.mode, id: props.item?.id ?? null, images: imageFiles.value || [] });
  close();
}

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return;
    await ensureCategories();
    if (props.mode === "edit" && props.item) fillFormFromItem(props.item);
    else resetForm();
  },
  { immediate: true }
);

onMounted(async () => {
  if (props.open) await ensureCategories();
});
</script>

<style scoped>
.pos-card {
  overflow: hidden;
}
</style>
