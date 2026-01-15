<!-- src/modules/products/components/ProductFormDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="1100" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <div class="text-h6 font-weight-bold">
            {{ mode === "edit" ? "Editar producto" : "Nuevo producto" }}
          </div>
          <div class="text-caption text-medium-emphasis">
            Elegí Rubro y luego Sub rubro. Imágenes listas para MinIO.
          </div>
        </div>

        <v-btn icon="mdi-close" variant="text" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3">
          {{ products.error }}
        </v-alert>

        <v-tabs v-model="tab" density="comfortable">
          <v-tab value="datos">DATOS</v-tab>
          <v-tab value="precios">PRECIOS</v-tab>
          <v-tab value="estado">ESTADO</v-tab>
          <v-tab value="stock">STOCK</v-tab>
          <v-tab value="imagenes">IMÁGENES</v-tab>
        </v-tabs>

        <v-divider class="my-3" />

        <v-window v-model="tab">
          <!-- DATOS -->
          <v-window-item value="datos">
            <ProductDataPanel
              v-model="form"
              :disabled="loading"
              :product-id="productId"
            />
          </v-window-item>

          <!-- PRECIOS -->
          <v-window-item value="precios">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.price_list"
                  type="number"
                  label="Precio lista"
                  variant="outlined"
                  density="comfortable"
                  :disabled="loading"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.price_discount"
                  type="number"
                  label="Precio descuento"
                  variant="outlined"
                  density="comfortable"
                  :disabled="loading"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="form.price_reseller"
                  type="number"
                  label="Precio revendedor"
                  variant="outlined"
                  density="comfortable"
                  :disabled="loading"
                />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- ESTADO -->
          <v-window-item value="estado">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-switch v-model="form.is_active" label="Activo" inset :disabled="loading" />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- STOCK -->
          <v-window-item value="stock">
            <ProductStockPanel
              v-model="stockMatrix"
              :product-id="productId"
              @applied="onStockApplied"
            />
          </v-window-item>

          <!-- ✅ IMÁGENES -->
          <v-window-item value="imagenes">
            <ProductImagesPanel
              :images="images"
              :loading="imagesLoading || loading"
              :error="imagesError"
              :max="3"
              @upload="onUploadImages"
              @removeOne="askRemoveOneImage"
              @removeAll="askRemoveAllImages"
            />

            <!-- confirm borrar 1 -->
            <v-dialog v-model="deleteImgOpen" max-width="520">
              <v-card rounded="xl">
                <v-card-title class="font-weight-bold">Eliminar imagen</v-card-title>
                <v-card-text>
                  ¿Eliminar imagen ID <b>#{{ deleteImg?.id }}</b>?
                </v-card-text>
                <v-card-actions class="justify-end">
                  <v-btn variant="tonal" @click="deleteImgOpen = false">Cancelar</v-btn>
                  <v-btn color="red" variant="flat" @click="doRemoveOneImage" :loading="imagesLoading">
                    Eliminar
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>

            <!-- confirm borrar todas -->
            <v-dialog v-model="deleteAllOpen" max-width="520">
              <v-card rounded="xl">
                <v-card-title class="font-weight-bold">Eliminar imágenes</v-card-title>
                <v-card-text>
                  ¿Eliminar <b>todas</b> las imágenes del producto?
                  <div class="text-caption text-medium-emphasis mt-2">No se puede deshacer.</div>
                </v-card-text>
                <v-card-actions class="justify-end">
                  <v-btn variant="tonal" @click="deleteAllOpen = false">Cancelar</v-btn>
                  <v-btn color="red" variant="flat" @click="doRemoveAllImages" :loading="imagesLoading">
                    Eliminar todas
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-space-between px-4 py-3">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="reloadFull" :loading="loading">
          Recargar datos
        </v-btn>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" @click="close" :disabled="loading">Cancelar</v-btn>

          <v-btn color="primary" variant="flat" @click="saveOnly" :loading="loading">
            Guardar
          </v-btn>

          <v-btn color="primary" variant="flat" prepend-icon="mdi-check" @click="saveOnly" :loading="loading">
            Guardar (seguir)
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";

import ProductDataPanel from "./ProductDataPanel.vue";
import ProductStockPanel from "./ProductStockPanel.vue";
import ProductImagesPanel from "./ProductImagesPanel.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create | edit
  item: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "saved", "deleted"]);

const products = useProductsStore();

const openLocal = ref(false);
const loading = ref(false);
const tab = ref("datos");

const productId = computed(() => Number(props.item?.id || products.current?.id || 0) || null);

// ✅ form COMPLETO
const form = reactive({
  name: "",
  sku: "",
  code: "",
  brand: "",
  model: "",
  description: "",
  category_id: null,
  track_stock: true,

  price_list: 0,
  price_discount: 0,
  price_reseller: 0,

  is_active: true,

  // opcional: para inferencia del panel
  category: null,
});

const stockMatrix = ref([]);

// =====================
// IMÁGENES state
// =====================
const images = ref([]);
const imagesLoading = ref(false);
const imagesError = ref(null);

const deleteImgOpen = ref(false);
const deleteAllOpen = ref(false);
const deleteImg = ref(null);

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function toInt(v, d = null) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function hydrateForm(p) {
  form.name = p?.name || "";
  form.sku = p?.sku || "";
  form.code = p?.code || "";
  form.brand = p?.brand || "";
  form.model = p?.model || "";
  form.description = p?.description || p?.desc || "";
  form.category_id = toInt(p?.category_id ?? p?.categoryId ?? p?.category?.id, null);
  form.track_stock = p?.track_stock === false || Number(p?.track_stock || 0) === 0 ? false : true;

  form.price_list = toNum(p?.price_list, 0);
  form.price_discount = toNum(p?.price_discount, 0);
  form.price_reseller = toNum(p?.price_reseller, 0);
  form.is_active = p?.is_active === false || Number(p?.is_active || 0) === 0 ? false : true;

  form.category = p?.category || null;
}

function hydrateMatrix(p) {
  const m = Array.isArray(p?.stock_matrix) ? p.stock_matrix : [];
  stockMatrix.value = m.map((x) => ({
    branch_id: Number(x.branch_id || 0),
    branch_name: x.branch_name || "",
    enabled: x.enabled === true || Number(x.enabled || 0) === 1,
    current_qty: toNum(x.current_qty, 0),
  }));
}

// ✅ cargar imágenes reales
async function loadImages(pid) {
  imagesError.value = null;
  if (!pid) {
    images.value = [];
    return;
  }
  imagesLoading.value = true;
  try {
    const arr = await products.fetchImages(pid);
    images.value = Array.isArray(arr) ? arr : [];
  } catch (e) {
    imagesError.value = products.error || e?.message || "No se pudieron cargar imágenes";
    images.value = [];
  } finally {
    imagesLoading.value = false;
  }
}

async function reloadFull() {
  loading.value = true;
  try {
    if (props.mode === "edit" && productId.value) {
      // ✅ producto + matriz (tu store tiene que exponer esto; si no, cambiás a fetchOne + fetchBranchesMatrix)
      const p = typeof products.fetchOneWithStockMatrix === "function"
        ? await products.fetchOneWithStockMatrix(productId.value)
        : await products.fetchOne(productId.value, { force: true });

      if (p) {
        hydrateForm(p);
        hydrateMatrix(p);
      }
      await loadImages(productId.value);
      return;
    }

    // create: si viene item, hidratamos; imágenes vacío
    if (props.item) hydrateForm(props.item);
    await loadImages(productId.value);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  async (v) => {
    openLocal.value = v;
    if (v) {
      tab.value = "datos";
      await reloadFull();
    }
  },
  { immediate: true }
);

watch(openLocal, (v) => emit("update:open", v));

function close() {
  openLocal.value = false;
}

function buildPayload() {
  return {
    name: String(form.name || "").trim(),
    sku: String(form.sku || "").trim(),
    code: String(form.code || "").trim(),
    brand: String(form.brand || "").trim(),
    model: String(form.model || "").trim(),
    description: String(form.description || "").trim(),
    category_id: toInt(form.category_id, null),
    track_stock: !!form.track_stock,

    price_list: toNum(form.price_list, 0),
    price_discount: toNum(form.price_discount, 0),
    price_reseller: toNum(form.price_reseller, 0),

    is_active: !!form.is_active,
  };
}

async function saveOnly() {
  loading.value = true;
  try {
    const payload = buildPayload();

    if (props.mode === "edit" && productId.value) {
      const res = await products.update(productId.value, payload);
      emit("saved", res?.data ?? products.current ?? null);
      await reloadFull();
    } else {
      const res = await products.create(payload);
      emit("saved", res?.data ?? null);
      await reloadFull();
    }
  } finally {
    loading.value = false;
  }
}

// =====================
// STOCK callback
// =====================
async function onStockApplied() {
  const pid = productId.value;
  if (!pid) return;
  if (typeof products.fetchOneWithStockMatrix === "function") {
    const p = await products.fetchOneWithStockMatrix(pid);
    if (p) hydrateMatrix(p);
  }
}

// =====================
// IMÁGENES actions
// =====================
async function onUploadImages(files) {
  const pid = productId.value;
  if (!pid) {
    imagesError.value = "Guardá el producto primero para subir imágenes.";
    return;
  }
  imagesError.value = null;
  imagesLoading.value = true;
  try {
    const r = await products.uploadImages(pid, files);
    if (!r) throw new Error(products.error || "No se pudieron subir imágenes");
    await loadImages(pid);
  } catch (e) {
    imagesError.value = products.error || e?.message || "No se pudieron subir imágenes";
  } finally {
    imagesLoading.value = false;
  }
}

function askRemoveOneImage(img) {
  deleteImg.value = img;
  deleteImgOpen.value = true;
}

async function doRemoveOneImage() {
  const pid = productId.value;
  const iid = Number(deleteImg.value?.id || 0);
  if (!pid || !iid) return;

  imagesError.value = null;
  imagesLoading.value = true;
  try {
    const ok = await products.removeImage(pid, iid);
    if (!ok) throw new Error(products.error || "No se pudo eliminar");
    deleteImgOpen.value = false;
    deleteImg.value = null;
    await loadImages(pid);
  } catch (e) {
    imagesError.value = products.error || e?.message || "No se pudo eliminar";
  } finally {
    imagesLoading.value = false;
  }
}

function askRemoveAllImages() {
  deleteAllOpen.value = true;
}

async function doRemoveAllImages() {
  const pid = productId.value;
  if (!pid) return;

  imagesError.value = null;
  imagesLoading.value = true;
  try {
    // borrar una por una
    for (const img of images.value) {
      const iid = Number(img?.id || 0);
      if (iid) await products.removeImage(pid, iid);
    }
    deleteAllOpen.value = false;
    await loadImages(pid);
  } catch (e) {
    imagesError.value = products.error || e?.message || "No se pudieron eliminar todas";
  } finally {
    imagesLoading.value = false;
  }
}
</script>
