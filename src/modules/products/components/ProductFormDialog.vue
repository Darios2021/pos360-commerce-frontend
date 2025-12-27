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
        <!-- ✅ Mensaje global de error (store) -->
        <v-alert v-if="products.error" type="error" variant="tonal" class="mb-4">
          {{ products.error }}
        </v-alert>

        <!-- ✅ Success en create -->
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
                <div class="font-weight-bold">Sucursal + Stock</div>
                <div class="text-caption text-medium-emphasis">
                  Admin elige sucursal · Usuario usa su sucursal fija
                </div>
              </div>

              <!-- ✅ Sucursal dueña actual (readonly) -->
              <v-row dense class="mb-2" v-if="mode === 'edit' && model?.id">
                <v-col cols="12" md="8">
                  <v-text-field
                    :model-value="productOwnerBranchLabel"
                    label="Sucursal dueña (actual)"
                    variant="outlined"
                    readonly
                    hint="Esto es el branch_id guardado en products (dueño). No es el depósito de stock."
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    :model-value="String(stock.current_qty)"
                    label="Stock actual (sucursal efectiva)"
                    variant="outlined"
                    readonly
                    hint="Suma de stock_balances en depósitos de esa sucursal."
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <!-- ✅ USER -->
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
                    v-model.number="stock.assign_qty"
                    label="Cantidad a asignar ahora"
                    type="number"
                    variant="outlined"
                    hint="Esto NO es el stock actual; es lo que vas a asignar con el botón."
                    persistent-hint
                  />
                </v-col>
              </v-row>

              <!-- ✅ ADMIN -->
              <v-row dense v-else>
                <v-col cols="12" md="8">
                  <v-select
                    v-model="stock.branch_id"
                    :items="branches"
                    item-title="name"
                    item-value="id"
                    label="Sucursal destino de stock *"
                    variant="outlined"
                    :loading="branchesLoading"
                    :disabled="branchesLoading"
                    clearable
                    no-data-text="No hay sucursales"
                    :error="!!fieldErrors.branch_id"
                    :error-messages="fieldErrors.branch_id"
                    hint="Esta selección define: 1) sucursal donde mirar/poner stock 2) sucursal dueña del producto si guardás."
                    persistent-hint
                  />
                </v-col>

                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="stock.assign_qty"
                    label="Cantidad a asignar ahora"
                    type="number"
                    variant="outlined"
                    :disabled="!stock.branch_id"
                    hint="Esto NO es el stock actual; es lo que vas a asignar con el botón."
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
                  <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="loadImages" :disabled="!model?.id || uploading">
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
          <v-btn variant="tonal" @click="close" :disabled="products.loading || uploading || savingStock">
            Cancelar
          </v-btn>

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
const hydrating = ref(false);

/**
 * UI model:
 * - parent_category_id: Rubro (DB/API: category_id)
 * - category_id:        Subrubro (DB/API: subcategory_id)
 */
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
  parent_category_id: null, // Rubro (categories.id)
  category_id: null,        // Subrubro (subcategories.id) (en UI)
});

// ✅ admin detector robusto
const isAdmin = computed(() => {
  const u = auth?.user || {};
  const roles = Array.isArray(u.roles) ? u.roles : (Array.isArray(auth.roles) ? auth.roles : []);
  const roleNames = roles
    .map((r) => (typeof r === "string" ? r : (r?.name || r?.role || "")))
    .map((s) => String(s).toLowerCase());
  return (
    roleNames.some((r) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(r)) ||
    u?.is_admin === true
  );
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

const stock = ref({
  branch_id: null,
  current_qty: 0,
  assign_qty: 0,
});

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

const productOwnerBranchLabel = computed(() => {
  const bid =
    Number(props?.item?.branch_id || 0) ||
    Number((products.current || {})?.branch_id || 0) ||
    Number(stock.value.branch_id || 0) ||
    0;
  if (!bid) return "—";
  const found = (branches.value || []).find((b) => Number(b?.id) === Number(bid));
  return found?.name ? `${found.name} (ID ${found.id})` : `Sucursal ID ${bid}`;
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
    args
      .map((a) => {
        try {
          return typeof a === "string" ? a : JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(" ");
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
 * Si viene subrubro sin rubro, lo inferimos mirando parents->children.
 * (solo aplica si tu store de categories expone childrenByParent)
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

/**
 * ✅ Normaliza error de API para:
 * - mostrar snack al usuario
 * - loguear payload y errores por campo si vienen
 */
function normalizeApiError(e) {
  const d = e?.response?.data || e?.data || null;
  const msg = d?.message || d?.error || e?.message || "Error inesperado. Revisá consola/servidor.";
  return { data: d, message: String(msg) };
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

// ✅ trae stock actual real (según effectiveBranchId)
async function refreshCurrentStock() {
  const pid = toInt(model.value.id, 0);
  const bid = toInt(effectiveBranchId.value, 0);
  if (!pid || !bid) {
    stock.value.current_qty = 0;
    return;
  }

  try {
    const qty = await products.fetchStockQty(pid, bid);
    stock.value.current_qty = Number(qty || 0);
    debugLog("stock_qty refreshed", { product_id: pid, branch_id: bid, qty: stock.value.current_qty });
  } catch (e) {
    stock.value.current_qty = 0;
    debugLog("ERROR refresh stock_qty", e?.message || e);
  }
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

    // ✅ cloná el item (no lo uses directo) para no mutar el listado
    const it = props.item ? JSON.parse(JSON.stringify(props.item)) : null;

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

      // ✅ MAPEO REAL DB/API -> UI
      // DB/API: category_id (rubro) / subcategory_id (subrubro)
      parent_category_id: toInt(it?.category_id, 0) || null,
      category_id: toInt(it?.subcategory_id, 0) || null,
    };

    syncRubroFromSubrubro();

    // ✅ stock defaults
    stock.value = { branch_id: null, current_qty: 0, assign_qty: 0 };

    if (isAdmin.value) {
      // admin: por defecto ver stock según branch_id actual del producto (si viene)
      stock.value.branch_id = toInt(it?.branch_id, 0) || null;
    } else {
      // user: su branch fijo
      stock.value.branch_id = userBranchId.value;
    }

    // ✅ si es edit, pedí el producto con stock_qty del backend (si lo soporta)
    if (model.value.id) {
      await products.fetchOne(model.value.id, { force: true, branch_id: effectiveBranchId.value || undefined });
      await refreshCurrentStock();
    }

    // imágenes
    existingImages.value = [];
    newFiles.value = [];
    if (model.value.id) await loadImages();

    hydrating.value = false;
  },
  { immediate: true }
);

// ✅ cuando cambia la sucursal efectiva (admin cambia select), refrescá stock actual
watch(
  () => effectiveBranchId.value,
  async () => {
    if (hydrating.value) return;
    await refreshCurrentStock();
  }
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

  // ✅ Admin: en create exigimos sucursal (porque define branch_id del producto)
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
  const qty = Number(stock.value.assign_qty || 0);
  if (!bid) return "";
  if (!qty) return "Sin asignación pendiente (0). Podés asignar stock ahora o después.";
  return `Se asignará ${qty} a la sucursal ID ${bid}. Stock actual: ${Number(stock.value.current_qty || 0)}.`;
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
    const { message, data } = normalizeApiError(e);
    debugLog("ERROR removeImage", { message, data });
    snack.value = { show: true, text: message || "No se pudo eliminar la imagen" };
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
    const { message, data } = normalizeApiError(e);
    debugLog("ERROR uploadImages", { message, data });
    snack.value = { show: true, text: message || "No se pudieron subir las imágenes" };
  } finally {
    uploading.value = false;
  }
}

/** stock init */
async function saveStockNow() {
  const pid = model.value.id;
  const bid = effectiveBranchId.value;
  const qty = Number(stock.value.assign_qty || 0);

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

    snack.value = { show: true, text: "Stock asignado OK" };
    stock.value.assign_qty = 0;

    await refreshCurrentStock();
  } catch (e) {
    const { message, data } = normalizeApiError(e);
    debugLog("ERROR initStock", { message, data });
    snack.value = { show: true, text: message || "No se pudo asignar stock" };
  } finally {
    savingStock.value = false;
  }
}

async function doDeleteProduct() {
  const pid = model.value.id;
  if (!pid) return;
  try {
    debugLog("remove(product)", { product_id: pid });
    const r = await products.remove(pid);
    if (!r?.ok) throw new Error(r?.message || products.error || "DELETE_PRODUCT_FAILED");
    deleteOpen.value = false;
    emit("deleted", { id: pid });
    snack.value = { show: true, text: "Producto eliminado" };
    close();
  } catch (e) {
    const { message, data } = normalizeApiError(e);
    debugLog("ERROR delete product", { message, data });
    snack.value = { show: true, text: message || "No se pudo eliminar el producto" };
  }
}

function normalizeEntity(res) {
  // Acepta: {id...} o {ok:true,data:{id...}} o {data:{id...}}
  if (!res) return null;
  if (res?.id) return res;
  if (res?.data?.id) return res.data;
  return null;
}

async function save() {
  if (!auth.isAuthed) return;

  syncRubroFromSubrubro();

  if (!validateBeforeSave()) {
    tab.value = fieldErrors.value.branch_id ? "stock" : "datos";
    debugLog("VALIDATION FAIL", fieldErrors.value);
    snack.value = { show: true, text: "Revisá los campos marcados en rojo." };
    return;
  }

  // ✅ IMPORTANTE: backend/DB tiene category_id + subcategory_id + branch_id (NOT NULL)
  const payload = {
    name: String(model.value.name || "").trim(),
    sku: String(model.value.sku || "").trim(),
    code: model.value.code || null,
    barcode: model.value.barcode || null,
    description: model.value.description || null,
    brand: model.value.brand || null,
    model: model.value.model || null,
    is_active: !!model.value.is_active,
    is_new: !!model.value.is_new,
    is_promo: !!model.value.is_promo,
    price_list: Number(model.value.price_list || 0),
    price_discount: Number(model.value.price_discount || 0),
    price_reseller: Number(model.value.price_reseller || 0),

    // ✅ UI -> DB/API
    category_id: model.value.parent_category_id ? toInt(model.value.parent_category_id, null) : null,
    subcategory_id: model.value.category_id ? toInt(model.value.category_id, null) : null,
  };

  // ✅ branch_id es obligatorio en DB:
  // - admin lo define con select
  // - user lo mandamos desde su cuenta para no depender de middleware
  if (isAdmin.value) {
    const bid = toInt(stock.value.branch_id, 0);
    if (bid > 0) payload.branch_id = bid;
  } else if (userBranchId.value) {
    payload.branch_id = toInt(userBranchId.value, 0);
  }

  debugLog("SAVE start", {
    mode: props.mode,
    payload,
    stock: { branch_id: stock.value.branch_id, current_qty: stock.value.current_qty, assign_qty: stock.value.assign_qty },
  });

  try {
    // EDIT
    if (props.mode === "edit" && model.value.id) {
      const res = await products.update(model.value.id, payload);
      debugLog("UPDATE result", res);

      const updated = normalizeEntity(res);
      if (updated?.id) {
        emit("saved", { id: updated.id });
        snack.value = { show: true, text: "Producto actualizado" };
        close();
      } else {
        const msg = products.error || "No se pudo actualizar.";
        snack.value = { show: true, text: msg };
        products.error = msg;
      }
      return;
    }

    // CREATE
    const res = await products.create(payload);
    debugLog("CREATE result", res);

    const created = normalizeEntity(res);
    if (created?.id) {
      model.value.id = created.id;
      emit("saved", { id: created.id });

      snack.value = { show: true, text: "Producto creado OK" };

      tab.value = "imagenes";
      if (newFiles.value?.length) {
        await uploadSelected();
      } else {
        await loadImages();
      }
    } else {
      const msg = products.error || "No se pudo crear el producto.";
      snack.value = { show: true, text: msg };
      products.error = msg;
    }
  } catch (e) {
    const { data, message } = normalizeApiError(e);
    debugLog("SAVE ERROR", { message, data });

    // ✅ Si backend manda errores por campo: { errors: { sku: "...", name:"...", branch_id:"...", category_id:"..." } }
    const errs = data?.errors || null;
    if (errs && typeof errs === "object") {
      if (errs.name) fieldErrors.value.name = String(errs.name);
      if (errs.sku) fieldErrors.value.sku = String(errs.sku);
      if (errs.branch_id) fieldErrors.value.branch_id = String(errs.branch_id);

      // backend: category_id (rubro)
      if (errs.category_id) fieldErrors.value.parent_category_id = String(errs.category_id);

      // Si alguna vez querés mostrar error específico de subrubro:
      // if (errs.subcategory_id) { ... }
    }

    // ✅ Mensaje visible al usuario + store alert arriba
    snack.value = { show: true, text: message };
    products.error = message;

    // Si hay error de rubro/sucursal, llevá a esa tab:
    if (errs?.branch_id) tab.value = "stock";
    else if (errs?.category_id || errs?.name || errs?.sku) tab.value = "datos";
  }
}
</script>

<style scoped>
.json {
  font-size: 12px;
  background: rgba(0, 0, 0, 0.04);
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  max-height: 220px;
}
</style>
