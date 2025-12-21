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
        <v-alert
          v-if="errorText || localError"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="localError || errorText"
        />

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
                    :disabled="uiBusy"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.code"
                    label="Código"
                    prepend-inner-icon="mdi-barcode"
                    :disabled="uiBusy"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.barcode"
                    label="Barcode"
                    prepend-inner-icon="mdi-barcode-scan"
                    :disabled="uiBusy"
                  />
                </v-col>

                <v-col cols="12" md="8">
                  <v-text-field
                    v-model="form.name"
                    label="Nombre *"
                    prepend-inner-icon="mdi-format-title"
                    :rules="[r.required]"
                    :disabled="uiBusy"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.brand"
                    label="Marca"
                    prepend-inner-icon="mdi-factory"
                    :disabled="uiBusy"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="form.model"
                    label="Modelo"
                    prepend-inner-icon="mdi-cube-outline"
                    :disabled="uiBusy"
                  />
                </v-col>

                <!-- Rubro (padre) -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="form.category_id"
                    label="Rubro"
                    :items="rubrosItems"
                    item-title="name_clean"
                    item-value="id_num"
                    :loading="cats.loading"
                    :disabled="uiBusy"
                    clearable
                    prepend-inner-icon="mdi-shape-outline"
                    @update:modelValue="onRubroChange"
                  />
                </v-col>

                <!-- Subrubro (hijo/hoja) -->
                <v-col cols="12" md="4">
                  <v-select
                    v-model="form.subcategory_id"
                    label="Sub rubro"
                    :items="subrubrosItems"
                    item-title="name_clean"
                    item-value="id_num"
                    :loading="cats.loading"
                    :disabled="uiBusy || !form.category_id"
                    clearable
                    prepend-inner-icon="mdi-shape-plus-outline"
                    :rules="[r.requiredIfRubro]"
                    no-data-text="No hay subrubros para este rubro"
                  />
                  <div
                    v-if="form.category_id && !cats.loading && subrubrosItems.length === 0"
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
                    :disabled="uiBusy"
                  />
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="form.description"
                    label="Descripción"
                    prepend-inner-icon="mdi-text-long"
                    rows="3"
                    auto-grow
                    :disabled="uiBusy"
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
                      <v-text-field
                        v-model.number="form.cost"
                        type="number"
                        label="Costo"
                        prepend-inner-icon="mdi-currency-usd"
                        :disabled="uiBusy"
                      />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="form.price"
                        type="number"
                        label="Precio (general)"
                        prepend-inner-icon="mdi-cash"
                        :disabled="uiBusy"
                      />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="form.tax_rate"
                        type="number"
                        label="IVA (%)"
                        prepend-inner-icon="mdi-percent"
                        :disabled="uiBusy"
                      />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="form.price_list"
                        type="number"
                        label="Precio lista"
                        prepend-inner-icon="mdi-format-list-bulleted"
                        :disabled="uiBusy"
                      />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="form.price_discount"
                        type="number"
                        label="Precio descuento"
                        prepend-inner-icon="mdi-sale"
                        :disabled="uiBusy"
                      />
                    </v-col>

                    <v-col cols="12" md="4">
                      <v-text-field
                        v-model.number="form.price_reseller"
                        type="number"
                        label="Precio revendedor"
                        prepend-inner-icon="mdi-account-tie-outline"
                        :disabled="uiBusy"
                      />
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
                    <v-col cols="12" md="3">
                      <v-switch v-model="form.is_new" label="Artículo nuevo" inset :disabled="uiBusy" />
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-switch v-model="form.is_promo" label="En promoción" inset :disabled="uiBusy" />
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-switch v-model="form.track_stock" label="Controla stock" inset :disabled="uiBusy" />
                    </v-col>
                    <v-col cols="12" md="3">
                      <v-switch v-model="form.is_active" label="Activo" inset :disabled="uiBusy" />
                    </v-col>
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
                    :disabled="uiBusy"
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
                    Al guardar: subimos estas imágenes y guardamos URLs en <b>product_images</b>.
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4 d-flex justify-end ga-2">
        <v-btn variant="text" @click="close" :disabled="uiBusy">Cancelar</v-btn>

        <!-- ✅ BOTÓN CON LOGS VISUALES -->
        <v-btn
          color="primary"
          variant="flat"
          :prepend-inner-icon="uploading ? 'mdi-cloud-upload-outline' : saving ? 'mdi-content-save-outline' : 'mdi-content-save-outline'"
          @click="save"
          :loading="uiBusy"
          :disabled="uiBusy"
        >
          <span v-if="saving">Guardando…</span>
          <span v-else-if="uploading">Subiendo…</span>
          <span v-else>Guardar</span>
        </v-btn>
      </v-card-actions>

      <!-- ✅ SNACKBAR LOG -->
      <v-snackbar v-model="snack" :color="snackColor" timeout="3000">
        {{ snackText }}
      </v-snackbar>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import http from "../../../app/api/http";
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

const localError = ref("");

// ✅ UI logs
const saving = ref(false);
const uploading = ref(false);
const snack = ref(false);
const snackText = ref("");
const snackColor = ref("success");

function toast(msg, color = "success") {
  snackText.value = msg;
  snackColor.value = color;
  snack.value = true;
}

const localOpen = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const loading = computed(() => !!products.loading);
const uiBusy = computed(() => loading.value || saving.value || uploading.value);

const title = computed(() => (props.mode === "edit" ? "Editar producto" : "Nuevo producto"));
const errorText = computed(() => products.error || cats.error || "");

// helpers
function cleanName(v) {
  return String(v ?? "")
    .split(">")
    .pop()
    .replace(/\s+/g, " ")
    .trim();
}
function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function toId(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// form
const form = reactive({
  code: "",
  sku: "",
  barcode: "",
  name: "",
  description: "",
  category_id: null,      // rubro (PADRE)
  subcategory_id: null,   // subrubro (HIJO / HOJA)
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

// stores -> categories (self-referential)
const rubrosItems = computed(() =>
  (cats.items || [])
    .filter((c) => !c.parent_id && Number(c.is_active ?? 1) !== 0)
    .map((c) => ({ ...c, id_num: toId(c.id), name_clean: cleanName(c.name) }))
    .filter((c) => c.id_num !== null)
);

const subrubrosItems = computed(() => {
  const rubroId = toId(form.category_id);
  if (!rubroId) return [];
  return (cats.items || [])
    .filter((c) => toId(c.parent_id) === rubroId && Number(c.is_active ?? 1) !== 0)
    .map((c) => ({ ...c, id_num: toId(c.id), name_clean: cleanName(c.name) }))
    .filter((c) => c.id_num !== null);
});

// images
const imageFiles = ref([]);
const imagePreviews = ref([]);
const imagesError = ref("");

const r = {
  required: (v) => !!String(v ?? "").trim() || "Requerido",
  requiredIfRubro: () => (form.category_id ? (form.subcategory_id ? true : "Elegí un sub rubro") : true),
};

function close() {
  localOpen.value = false;
}

async function ensureCategories() {
  if (typeof cats.fetchAll === "function") await cats.fetchAll();
}

function onRubroChange() {
  form.subcategory_id = null;
}

async function hydrateEditItemIfNeeded() {
  if (props.mode !== "edit") return null;
  const id = toId(props.item?.id);
  if (!id) return null;
  try {
    const full = await products.fetchOne(id, { force: true });
    return full?.data ?? full ?? null;
  } catch {
    return null;
  }
}

function resetForm() {
  form.code = "";
  form.sku = "";
  form.barcode = "";
  form.name = "";
  form.description = "";
  form.category_id = null;
  form.subcategory_id = null;
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

  imageFiles.value = [];
  imagePreviews.value = [];
  imagesError.value = "";
  localError.value = "";
  tab.value = "basic";
}

/**
 * FIX CLAVE:
 * - DB: Product.category_id = HOJA (subrubro)
 * - UI: form.category_id = PADRE, form.subcategory_id = HOJA
 * - Derivo desde item.category + item.category.parent cuando existan.
 */
function fillFormFromItem(item) {
  form.code = item?.code ?? "";
  form.sku = item?.sku ?? "";
  form.barcode = item?.barcode ?? "";
  form.name = item?.name ?? "";
  form.description = item?.description ?? "";

  const leaf = item?.category ?? null;
  const parent = leaf?.parent ?? null;

  const leafId = toId(leaf?.id) ?? toId(item?.subcategory_id) ?? null;
  const parentId = toId(parent?.id) ?? null;

  if (parentId && leafId) {
    form.category_id = parentId;
    form.subcategory_id = leafId;
  } else {
    // fallback
    form.category_id = null;
    form.subcategory_id = toId(item?.category_id);
  }

  form.brand = item?.brand ?? "";
  form.model = item?.model ?? "";
  form.warranty_months = Number(item?.warranty_months ?? 0) || 0;

  form.is_new = !!item?.is_new;
  form.is_promo = !!item?.is_promo;
  form.track_stock = item?.track_stock === undefined ? true : !!item?.track_stock;
  form.is_active = item?.is_active === undefined ? true : !!item?.is_active;

  form.cost = toNum(item?.cost, 0);
  form.price = toNum(item?.price, 0);
  form.price_list = toNum(item?.price_list, 0);
  form.price_discount = toNum(item?.price_discount, 0);
  form.price_reseller = toNum(item?.price_reseller, 0);
  form.tax_rate = toNum(item?.tax_rate, 21);

  imageFiles.value = [];
  imagePreviews.value = [];
  imagesError.value = "";
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

/**
 * ✅ Subida REAL (persistente) contra tu nuevo endpoint:
 * POST /products/:id/images   (FormData files[])
 */
async function uploadImages(productId) {
  const files = imageFiles.value || [];
  if (!files.length) return 0;

  if (imagesError.value) throw new Error(imagesError.value);

  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));

  uploading.value = true;
  try {
    const { data } = await http.post(`/products/${productId}/images`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    });

    if (!data?.ok) throw new Error(data?.message || "UPLOAD_FAILED");
    return Number(data?.uploaded || files.length);
  } finally {
    uploading.value = false;
  }
}

async function save() {
  localError.value = "";
  products.error = null;

  const ok = await formRef.value?.validate?.();
  if (ok && ok.valid === false) return;

  // ✅ payload correcto para tu DB:
  // Product.category_id = HOJA (subrubro) => usamos form.subcategory_id
  const payload = {
    code: form.code || null,
    sku: form.sku,
    barcode: form.barcode || null,
    name: form.name,
    description: form.description || null,

    // ✅ HOJA
    category_id: toId(form.subcategory_id),

    brand: form.brand || null,
    model: form.model || null,
    warranty_months: Number(form.warranty_months ?? 0),
    is_new: form.is_new ? 1 : 0,
    is_promo: form.is_promo ? 1 : 0,
    track_stock: form.track_stock ? 1 : 0,
    is_active: form.is_active ? 1 : 0,

    cost: toNum(form.cost, 0),
    price: toNum(form.price, 0),
    price_list: toNum(form.price_list, 0),
    price_discount: toNum(form.price_discount, 0),
    price_reseller: toNum(form.price_reseller, 0),
    tax_rate: toNum(form.tax_rate, 21),
  };

  saving.value = true;
  try {
    toast("Guardando producto…", "info");

    let productId = toId(props.item?.id);

    if (props.mode === "edit" && productId) {
      const res = await products.update(productId, payload);
      productId = toId(res?.item?.id) ?? productId;
    } else {
      const res = await products.create(payload);
      productId = toId(res?.item?.id) ?? toId(res?.id) ?? productId;
    }

    if (products.error) throw new Error(products.error);
    if (!productId) throw new Error("No pude obtener el ID del producto.");

    // ✅ subir imágenes persistentes
    if ((imageFiles.value || []).length) {
      toast("Producto guardado. Subiendo imágenes…", "info");
      const uploaded = await uploadImages(productId);
      toast(`✅ Imágenes subidas: ${uploaded}`, "success");
    } else {
      toast("✅ Guardado", "success");
    }

    emit("saved", { mode: props.mode, id: productId });
    close();
  } catch (e) {
    console.error(e);
    localError.value = e?.friendlyMessage || e?.message || "ERROR";
    toast(localError.value, "error");
  } finally {
    saving.value = false;
  }
}

watch(
  () => [props.open, props.mode, props.item?.id],
  async ([isOpen, mode]) => {
    if (!isOpen) return;

    await ensureCategories();

    if (mode === "edit" && props.item?.id) {
      const full = await hydrateEditItemIfNeeded();
      fillFormFromItem(full || props.item);
    } else {
      resetForm();
    }
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
