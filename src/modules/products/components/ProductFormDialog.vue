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

        <div class="d-flex align-center ga-2">
          <v-chip v-if="model?.id" size="small" variant="tonal">ID #{{ model.id }}</v-chip>

          <v-btn
            v-if="mode === 'edit' && isAdmin"
            color="red"
            variant="tonal"
            prepend-icon="mdi-delete-outline"
            @click="deleteOpen = true"
          >
            Eliminar
          </v-btn>

          <v-btn icon="mdi-close" variant="text" @click="close" />
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert v-if="products.error" type="error" variant="tonal" class="mb-4">
          {{ products.error }}
        </v-alert>

        <v-alert v-if="mode === 'create' && model?.id" type="success" variant="tonal" class="mb-4">
          Producto creado (ID #{{ model.id }}). Podés seguir subiendo imágenes o presionar <b>Finalizar</b>.
        </v-alert>

        <!-- ✅ LOGS -->
        <v-expansion-panels class="mb-4" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title class="text-caption text-medium-emphasis">
              Logs (debug)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex justify-end mb-2">
                <v-btn size="small" variant="tonal" @click="debugClear">
                  <v-icon start>mdi-broom</v-icon>
                  Limpiar
                </v-btn>
              </div>
              <pre class="json">{{ debugText }}</pre>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <v-tabs v-model="tab" density="comfortable">
          <v-tab value="datos" prepend-icon="mdi-text-box-outline">DATOS</v-tab>
          <v-tab value="precios" prepend-icon="mdi-cash">PRECIOS</v-tab>
          <v-tab value="estado" prepend-icon="mdi-toggle-switch-outline">ESTADO</v-tab>
          <v-tab value="stock" prepend-icon="mdi-warehouse">STOCK</v-tab>
          <v-tab value="imagenes" prepend-icon="mdi-image-multiple-outline">IMÁGENES</v-tab>
        </v-tabs>

        <v-window v-model="tab" class="mt-4">
          <!-- DATOS -->
          <v-window-item value="datos">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="model.name"
                  label="Nombre *"
                  variant="outlined"
                  :error="!!fieldErrors.name"
                  :error-messages="fieldErrors.name"
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-text-field
                  v-model="model.sku"
                  label="SKU *"
                  variant="outlined"
                  :error="!!fieldErrors.sku"
                  :error-messages="fieldErrors.sku"
                />
              </v-col>

              <v-col cols="12" md="3">
                <v-text-field v-model="model.code" label="Código" variant="outlined" />
              </v-col>

              <!-- Rubro / Subrubro -->
              <v-col cols="12" md="6">
                <v-select
                  v-model="model.parent_category_id"
                  :items="parents"
                  item-title="name"
                  item-value="id"
                  label="Rubro *"
                  variant="outlined"
                  :loading="catsLoading"
                  :disabled="catsLoading"
                  clearable
                  no-data-text="No hay rubros"
                  :error="!!fieldErrors.parent_category_id"
                  :error-messages="fieldErrors.parent_category_id"
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="model.category_id"
                  :items="subcategories"
                  item-title="name"
                  item-value="id"
                  label="Subrubro"
                  variant="outlined"
                  :loading="catsLoading"
                  :disabled="catsLoading || !model.parent_category_id"
                  clearable
                  no-data-text="No hay subrubros"
                  hint="Se filtra según el Rubro."
                  persistent-hint
                />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model="model.brand" label="Marca" variant="outlined" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="model.model" label="Modelo" variant="outlined" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="model.barcode" label="Barcode" variant="outlined" />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="model.description" label="Descripción" variant="outlined" rows="3" />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- PRECIOS -->
          <v-window-item value="precios">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="model.price_list" label="Precio Lista" type="number" variant="outlined" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="model.price_discount"
                  label="Precio Descuento"
                  type="number"
                  variant="outlined"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="model.price_reseller"
                  label="Precio Revendedor"
                  type="number"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- ESTADO -->
          <v-window-item value="estado">
            <v-row dense>
              <v-col cols="12" md="4">
                <v-switch v-model="model.is_active" label="Activo" color="primary" inset />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch v-model="model.is_new" label="Nuevo" color="primary" inset />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch v-model="model.is_promo" label="En promo" color="primary" inset />
              </v-col>
            </v-row>
          </v-window-item>

          <!-- STOCK -->
          <v-window-item value="stock">
            <v-card rounded="xl" variant="tonal" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="font-weight-bold">Sucursal + Stock inicial</div>
                <div class="text-caption text-medium-emphasis">
                  Admin elige sucursal · Usuario usa su sucursal fija
                </div>
              </div>

              <!-- ✅ USER: NO elige sucursal, PERO sí asigna stock -->
              <v-row dense v-if="!isAdmin">
                <v-col cols="12" md="8">
                  <v-text-field
                    :model-value="userBranchLabel"
                    label="Sucursal"
                    variant="outlined"
                    readonly
                    hint="Se toma de tu usuario (no editable)."
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="stock.initial_qty"
                    label="Stock inicial"
                    type="number"
                    variant="outlined"
                    hint="Se asigna a tu sucursal."
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <!-- ✅ ADMIN: elige sucursal -->
              <v-row dense v-else>
                <v-col cols="12" md="8">
                  <v-select
                    v-model="stock.branch_id"
                    :items="branches"
                    item-title="name"
                    item-value="id"
                    label="Sucursal *"
                    variant="outlined"
                    :loading="branchesLoading"
                    :disabled="branchesLoading"
                    clearable
                    no-data-text="No hay sucursales"
                    :error="!!fieldErrors.branch_id"
                    :error-messages="fieldErrors.branch_id"
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="stock.initial_qty"
                    label="Stock inicial"
                    type="number"
                    variant="outlined"
                    :disabled="!stock.branch_id"
                    hint="Cantidad inicial para la sucursal seleccionada."
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <v-alert v-if="stockInfo" type="info" variant="tonal" class="mt-3">
                {{ stockInfo }}
              </v-alert>

              <div class="d-flex justify-end mt-2">
                <v-btn
                  color="primary"
                  variant="flat"
                  prepend-icon="mdi-warehouse"
                  :disabled="!model?.id || !effectiveBranchId || savingStock"
                  :loading="savingStock"
                  @click="saveStockNow"
                >
                  Asignar stock ahora
                </v-btn>
              </div>
            </v-card>
          </v-window-item>

          <!-- IMÁGENES -->
          <v-window-item value="imagenes">
            <v-card rounded="xl" variant="tonal" class="pa-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="font-weight-bold">Imágenes</div>
                <div class="text-caption text-medium-emphasis">Máximo 3 · listo para MinIO</div>
              </div>

              <v-row dense v-if="existingImages.length">
                <v-col v-for="img in existingImages" :key="img.id" cols="12" sm="6" md="4">
                  <v-card rounded="lg" class="overflow-hidden">
                    <v-img :src="img.url" height="160" cover />
                    <v-divider />
                    <v-card-actions class="justify-space-between">
                      <div class="text-caption text-medium-emphasis">ID {{ img.id }}</div>
                      <v-btn
                        icon="mdi-delete-outline"
                        variant="text"
                        color="red"
                        @click="askRemoveImage(img)"
                        :disabled="products.loading || uploading"
                      />
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>

              <v-alert v-else type="info" variant="tonal" class="mb-3">
                Este producto no tiene imágenes cargadas todavía.
              </v-alert>

              <v-file-input
                v-model="newFiles"
                label="Seleccionar imágenes (opcional)"
                variant="outlined"
                prepend-icon="mdi-image-plus"
                multiple
                accept="image/*"
                :hint="!model?.id ? 'Podés elegirlas ahora: se suben automáticamente al guardar el producto.' : ''"
                persistent-hint
              />

              <div class="d-flex justify-space-between align-center mt-3">
                <div class="text-caption text-medium-emphasis">
                  Seleccionadas: <b>{{ newFiles.length }}</b> · Existentes: <b>{{ existingImages.length }}</b>
                </div>

                <div class="d-flex ga-2">
                  <v-btn
                    variant="tonal"
                    prepend-icon="mdi-refresh"
                    @click="loadImages"
                    :disabled="!model?.id || uploading"
                  >
                    Refrescar
                  </v-btn>

                  <v-btn
                    color="primary"
                    variant="flat"
                    prepend-icon="mdi-cloud-upload-outline"
                    @click="uploadSelected"
                    :disabled="!model?.id || !newFiles.length"
                    :loading="uploading"
                  >
                    Subir seleccionadas
                  </v-btn>
                </div>
              </div>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-space-between">
        <v-btn variant="text" @click="forceReloadData" :disabled="catsLoading || branchesLoading">
          <v-icon start>mdi-refresh</v-icon>
          Recargar datos
        </v-btn>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" @click="close" :disabled="products.loading || uploading || savingStock">Cancelar</v-btn>

          <v-btn
            v-if="mode === 'create' && model?.id"
            color="primary"
            variant="flat"
            prepend-icon="mdi-check"
            @click="finalize"
          >
            Finalizar
          </v-btn>

          <v-btn v-else color="primary" variant="flat" @click="save" :loading="products.loading">
            Guardar
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>

    <!-- Confirm delete imagen -->
    <v-dialog v-model="deleteImgOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar imagen</v-card-title>
        <v-card-text>¿Eliminar la imagen ID <b>#{{ deleteImg?.id }}</b>?</v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteImgOpen = false" :disabled="products.loading || uploading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteImage" :loading="uploading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm delete producto -->
    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés eliminar <b>{{ model?.name }}</b> (ID #{{ model?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">No se puede deshacer.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteOpen = false" :disabled="products.loading || uploading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteProduct" :loading="products.loading || uploading">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500">
      {{ snack.text }}
    </v-snackbar>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";
import { useCategoriesStore } from "../../../app/store/categories.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: "create" }, // create | edit
  item: { type: Object, default: null },
});

const emit = defineEmits(["update:open", "saved", "deleted"]);

const products = useProductsStore();
const auth = useAuthStore();
const categories = useCategoriesStore();

const openLocal = ref(false);
const tab = ref("datos");

// evita que watchers rompan durante carga
const hydrating = ref(false);

const model = ref({
  id: null,
  name: "",
  sku: "",
  code: "",
  barcode: null,
  description: null,
  brand: null,
  model: null,
  is_active: true,
  is_new: false,
  is_promo: false,
  price_list: 0,
  price_discount: 0,
  price_reseller: 0,
  parent_category_id: null,
  category_id: null,
});

// ✅ admin detector robusto (sin depender de un formato único)
const isAdmin = computed(() => {
  const u = auth?.user || {};
  const roles = Array.isArray(u.roles) ? u.roles : (Array.isArray(auth.roles) ? auth.roles : []);
  const roleNames = roles.map((r) => (typeof r === "string" ? r : (r?.name || r?.role || ""))).map((s) => String(s).toLowerCase());
  return roleNames.some((r) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(r)) || u?.is_admin === true;
});

const userBranchId = computed(() => {
  const u = auth?.user || {};
  const v = Number(u.branch_id || auth.branchId || 0);
  return Number.isFinite(v) && v > 0 ? v : null;
});

const catsLoading = computed(() => categories.loading);
const parents = computed(() => categories.parents || []);
const subcategories = computed(() => categories.childrenByParent(model.value.parent_category_id));

/** stock */
const branches = ref([]);
const branchesLoading = ref(false);
const stock = ref({ branch_id: null, initial_qty: 0 });
const savingStock = ref(false);

const effectiveBranchId = computed(() => {
  if (isAdmin.value) return Number(stock.value.branch_id || 0) || null;
  return userBranchId.value;
});

const userBranchLabel = computed(() => {
  const id = userBranchId.value;
  if (!id) return "—";
  const found = (branches.value || []).find((b) => Number(b?.id) === Number(id));
  return found?.name ? `${found.name} (ID ${found.id})` : `Sucursal ID ${id}`;
});

/** errores */
const fieldErrors = ref({
  name: "",
  sku: "",
  branch_id: "",
  parent_category_id: "",
});

const snack = ref({ show: false, text: "" });

/** logs */
const debugLines = ref([]);
const debugText = computed(() => debugLines.value.join("\n"));
function debugLog(...args) {
  const line =
    `[${new Date().toISOString()}] ` +
    args.map((a) => {
      try { return typeof a === "string" ? a : JSON.stringify(a); }
      catch { return String(a); }
    }).join(" ");
  debugLines.value.unshift(line);
  // eslint-disable-next-line no-console
  console.debug("[ProductFormDialog]", ...args);
}
function debugClear() {
  debugLines.value = [];
}

function clearFieldErrors() {
  fieldErrors.value = { name: "", sku: "", branch_id: "", parent_category_id: "" };
}

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

/**
 * Si viene category_id sin parent_category_id, lo inferimos.
 */
function inferParentIdFromCategoryId(categoryId) {
  const cid = toInt(categoryId, 0);
  if (!cid) return null;

  const ps = parents.value || [];
  for (const p of ps) {
    const pid = toInt(p?.id, 0);
    if (!pid) continue;
    const children = categories.childrenByParent(pid) || [];
    if (children.some((c) => toInt(c?.id, 0) === cid)) return pid;
  }
  return null;
}

function syncRubroFromSubrubro() {
  const pid = toInt(model.value.parent_category_id, 0);
  const cid = toInt(model.value.category_id, 0);
  if (pid > 0) return;
  if (cid > 0) {
    const inferred = inferParentIdFromCategoryId(cid);
    if (inferred) {
      model.value.parent_category_id = inferred;
      debugLog("Inferí parent_category_id desde category_id", { cid, inferred });
    }
  }
}

async function loadBranches() {
  branchesLoading.value = true;
  try {
    const arr = await products.fetchBranches();
    branches.value = Array.isArray(arr) ? arr : [];
    debugLog("Branches cargadas", { count: branches.value.length });
  } catch (e) {
    debugLog("ERROR branches", e?.message || e);
  } finally {
    branchesLoading.value = false;
  }
}

async function forceReloadData() {
  try {
    debugLog("Recargando categorías...");
    await categories.fetchAll(true);
    syncRubroFromSubrubro();
  } catch (e) {
    debugLog("ERROR recargando categorías", e?.message || e);
  }

  await loadBranches();
}

watch(
  () => props.open,
  async (v) => {
    openLocal.value = v;
    if (!v) return;

    hydrating.value = true;
    tab.value = "datos";
    clearFieldErrors();
    debugClear();
    debugLog("OPEN", { mode: props.mode });

    await categories.fetchAll(false);
    await loadBranches();

    const it = props.item || null;

    model.value = {
      id: it?.id ?? null,
      name: it?.name ?? "",
      sku: it?.sku ?? "",
      code: it?.code ?? null,
      barcode: it?.barcode ?? null,
      description: it?.description ?? null,
      brand: it?.brand ?? null,
      model: it?.model ?? null,
      is_active: !!(it?.is_active ?? true),
      is_new: !!(it?.is_new ?? false),
      is_promo: !!(it?.is_promo ?? false),
      price_list: Number(it?.price_list ?? 0),
      price_discount: Number(it?.price_discount ?? 0),
      price_reseller: Number(it?.price_reseller ?? 0),
      parent_category_id: toInt(it?.parent_category_id, 0) || null,
      category_id: toInt(it?.category_id, 0) || null,
    };

    syncRubroFromSubrubro();

    // stock defaults
    stock.value = { branch_id: null, initial_qty: 0 };
    if (!isAdmin.value) stock.value.branch_id = userBranchId.value;

    // imágenes
    existingImages.value = [];
    newFiles.value = [];
    if (model.value.id) await loadImages();

    hydrating.value = false;
  },
  { immediate: true }
);

watch(
  () => model.value.parent_category_id,
  (newVal, oldVal) => {
    if (hydrating.value) return;
    const newPid = toInt(newVal, 0);
    const oldPid = toInt(oldVal, 0);
    if (newPid === oldPid) return;

    const currentCid = toInt(model.value.category_id, 0);
    if (!currentCid) {
      model.value.category_id = null;
      return;
    }

    const allowed = categories.childrenByParent(newPid) || [];
    const ok = allowed.some((c) => toInt(c?.id, 0) === currentCid);
    if (!ok) model.value.category_id = null;
  }
);

watch(
  () => model.value.category_id,
  () => {
    if (hydrating.value) return;
    syncRubroFromSubrubro();
  }
);

watch(openLocal, (v) => emit("update:open", v));

function close() {
  openLocal.value = false;
}

function finalize() {
  close();
}

function validateBeforeSave() {
  clearFieldErrors();

  if (!String(model.value.name || "").trim()) fieldErrors.value.name = "El nombre es obligatorio.";
  if (!String(model.value.sku || "").trim()) fieldErrors.value.sku = "El SKU es obligatorio.";
  if (!model.value.parent_category_id) fieldErrors.value.parent_category_id = "Elegí un rubro.";

  // ✅ Admin: elegí sucursal si querés setear stock inicial desde acá (lo dejamos obligatorio al crear)
  if (props.mode === "create" && isAdmin.value && !stock.value.branch_id) {
    fieldErrors.value.branch_id = "Elegí una sucursal.";
  }

  return (
    !fieldErrors.value.name &&
    !fieldErrors.value.sku &&
    !fieldErrors.value.branch_id &&
    !fieldErrors.value.parent_category_id
  );
}

const stockInfo = computed(() => {
  const bid = Number(effectiveBranchId.value || 0);
  const qty = Number(stock.value.initial_qty || 0);
  if (!bid) return "";
  if (!qty) return "Sin stock inicial (0). Podés asignarlo ahora o después.";
  return `Se asignará stock inicial ${qty} a la sucursal ID ${bid}.`;
});

/** imágenes */
const existingImages = ref([]);
const newFiles = ref([]);
const uploading = ref(false);

const deleteOpen = ref(false);
const deleteImgOpen = ref(false);
const deleteImg = ref(null);

function normalizeImages(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return list
    .map((x) => ({
      id: x?.id ?? x?.image_id ?? x?.product_image_id,
      url: x?.url ?? x?.src ?? x?.path ?? x?.image_url,
    }))
    .filter((x) => !!x.id && !!x.url);
}

async function loadImages() {
  if (!model.value.id) return;
  debugLog("fetchImages()", { product_id: model.value.id });
  const imgs = await products.fetchImages(model.value.id);
  existingImages.value = normalizeImages(imgs);
  debugLog("images loaded", { count: existingImages.value.length });
}

function askRemoveImage(img) {
  deleteImg.value = img;
  deleteImgOpen.value = true;
}

async function doDeleteImage() {
  const pid = model.value.id;
  const img = deleteImg.value;
  if (!pid || !img?.id) return;

  uploading.value = true;
  try {
    debugLog("removeImage()", { product_id: pid, image_id: img.id });
    const ok = await products.removeImage(pid, img.id);
    if (!ok) throw new Error(products.error || "DELETE_IMAGE_FAILED");
    deleteImgOpen.value = false;
    deleteImg.value = null;
    await loadImages();
    snack.value = { show: true, text: "Imagen eliminada" };
  } catch (e) {
    debugLog("ERROR removeImage", e?.message || e);
    snack.value = { show: true, text: e?.message || "No se pudo eliminar la imagen" };
  } finally {
    uploading.value = false;
  }
}

async function uploadSelected() {
  const pid = model.value.id;
  if (!pid || !newFiles.value?.length) return;

  const total = (existingImages.value?.length || 0) + (newFiles.value?.length || 0);
  if (total > 3) {
    snack.value = { show: true, text: "Máximo 3 imágenes por producto." };
    tab.value = "imagenes";
    return;
  }

  uploading.value = true;
  try {
    debugLog("uploadImages()", { product_id: pid, files: newFiles.value.length });
    const res = await products.uploadImages(pid, newFiles.value);
    debugLog("uploadImages result", res);

    if (!res) throw new Error(products.error || "UPLOAD_IMAGES_FAILED");

    newFiles.value = [];
    await loadImages();
    snack.value = { show: true, text: "Imágenes subidas OK" };
  } catch (e) {
    debugLog("ERROR uploadImages", e?.message || e);
    snack.value = { show: true, text: e?.message || "No se pudieron subir las imágenes" };
  } finally {
    uploading.value = false;
  }
}

/** stock init */
async function saveStockNow() {
  const pid = model.value.id;
  const bid = effectiveBranchId.value;
  const qty = Number(stock.value.initial_qty || 0);

  if (!pid) {
    snack.value = { show: true, text: "Primero guardá el producto." };
    return;
  }
  if (!bid) {
    snack.value = { show: true, text: "No hay sucursal efectiva." };
    return;
  }

  savingStock.value = true;
  try {
    debugLog("initStock()", { product_id: pid, branch_id: bid, qty });
    const ok = await products.initStock({ product_id: pid, branch_id: bid, qty });
    if (!ok) throw new Error(products.error || "INIT_STOCK_FAILED");
    snack.value = { show: true, text: "Stock inicial asignado OK" };
  } catch (e) {
    debugLog("ERROR initStock", e?.message || e);
    snack.value = { show: true, text: e?.message || "No se pudo asignar stock" };
  } finally {
    savingStock.value = false;
  }
}

async function doDeleteProduct() {
  const pid = model.value.id;
  if (!pid) return;
  try {
    debugLog("remove(product)", { product_id: pid });
    const ok = await products.remove(pid);
    if (!ok) throw new Error(products.error || "DELETE_PRODUCT_FAILED");
    deleteOpen.value = false;
    emit("deleted", { id: pid });
    snack.value = { show: true, text: "Producto eliminado" };
    close();
  } catch (e) {
    debugLog("ERROR delete product", e?.message || e);
    snack.value = { show: true, text: e?.message || "No se pudo eliminar el producto" };
  }
}

async function save() {
  if (!auth.isAuthed) return;

  syncRubroFromSubrubro();

  if (!validateBeforeSave()) {
    tab.value = fieldErrors.value.branch_id ? "stock" : "datos";
    debugLog("VALIDATION FAIL", fieldErrors.value);
    return;
  }

  const payload = {
    name: model.value.name,
    sku: model.value.sku,
    code: model.value.code,
    barcode: model.value.barcode,
    description: model.value.description,
    brand: model.value.brand,
    model: model.value.model,
    is_active: model.value.is_active,
    is_new: model.value.is_new,
    is_promo: model.value.is_promo,
    price_list: model.value.price_list,
    price_discount: model.value.price_discount,
    price_reseller: model.value.price_reseller,
    parent_category_id: model.value.parent_category_id,
    category_id: model.value.category_id || null,
  };

  debugLog("SAVE start", { mode: props.mode, payload });

  // EDIT
  if (props.mode === "edit" && model.value.id) {
    const updated = await products.update(model.value.id, payload);
    debugLog("UPDATE result", updated);

    if (updated?.id) {
      emit("saved", { id: updated.id });

      // si cargaron qty, lo dejamos listo con botón “Asignar stock ahora”
      if (Number(stock.value.initial_qty || 0) > 0) {
        tab.value = "stock";
        snack.value = { show: true, text: "Producto actualizado. Asigná stock con el botón." };
      } else {
        close();
      }
    }
    return;
  }

  // CREATE
  const created = await products.create(payload);
  debugLog("CREATE result", created);

  if (created?.id) {
    model.value.id = created.id;
    emit("saved", { id: created.id });

    // ✅ si hay stock qty, asignalo ya (usa tu endpoint /stock/init)
    if (Number(stock.value.initial_qty || 0) > 0) {
      tab.value = "stock";
      await saveStockNow();
    }

    // ✅ auto-upload si eligió imágenes antes
    tab.value = "imagenes";
    if (newFiles.value?.length) {
      await uploadSelected();
    } else {
      await loadImages();
    }
  }
}
</script>

<style scoped>
.json {
  font-size: 12px;
  background: rgba(0,0,0,.04);
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  max-height: 220px;
}
</style>
