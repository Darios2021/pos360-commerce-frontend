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
            Elegí Rubro y luego Sub rubro (parametrización). Imágenes listas para MinIO.
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

              <!-- ✅ Rubro / Subrubro -->
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
                <div class="text-caption text-medium-emphasis">Solo admin define stock inicial.</div>
              </div>

              <v-alert v-if="!isAdmin" type="info" variant="tonal" class="mb-3">
                El stock inicial lo define un admin. (Tu sucursal se toma del usuario logueado)
              </v-alert>

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
                        :disabled="products.loading"
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

              <div class="d-flex justify-end mt-3">
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
          <v-btn variant="tonal" @click="close" :disabled="products.loading || uploading">Cancelar</v-btn>

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
          <v-btn variant="tonal" @click="deleteImgOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteImage" :loading="products.loading">Eliminar</v-btn>
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
          <v-btn variant="tonal" @click="deleteOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDeleteProduct" :loading="products.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

// ✅ evita que watchers rompan durante carga
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

const isAdmin = computed(() => (auth.roles || []).includes("admin"));

const catsLoading = computed(() => categories.loading);
const parents = computed(() => categories.parents || []);
const subcategories = computed(() => categories.childrenByParent(model.value.parent_category_id));

/** stock */
const branches = ref([]);
const branchesLoading = ref(false);
const stock = ref({ branch_id: null, initial_qty: 0 });

/** errores */
const fieldErrors = ref({
  name: "",
  sku: "",
  branch_id: "",
  parent_category_id: "",
});

function clearFieldErrors() {
  fieldErrors.value = { name: "", sku: "", branch_id: "", parent_category_id: "" };
}

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

/**
 * ✅ FIX DEFINITIVO:
 * Si viene subrubro (category_id) pero NO viene rubro (parent_category_id),
 * lo inferimos recorriendo parents + childrenByParent.
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

  // si ya hay rubro, ok
  if (pid > 0) return;

  // si hay subrubro pero no rubro, inferimos
  if (cid > 0) {
    const inferred = inferParentIdFromCategoryId(cid);
    if (inferred) model.value.parent_category_id = inferred;
  }
}

async function loadBranchesIfAdmin() {
  if (!isAdmin.value) return;
  branchesLoading.value = true;
  try {
    branches.value = await products.fetchBranches();
  } finally {
    branchesLoading.value = false;
  }
}

async function forceReloadData() {
  try {
    await categories.fetchAll(true);
    // al recargar categorías, volvemos a sincronizar rubro/subrubro
    syncRubroFromSubrubro();
  } catch (e) {}
  try {
    await loadBranchesIfAdmin();
  } catch (e) {}
}

watch(
  () => props.open,
  async (v) => {
    openLocal.value = v;
    if (!v) return;

    hydrating.value = true;
    tab.value = "datos";
    clearFieldErrors();

    await categories.fetchAll(false);

    if (isAdmin.value) await loadBranchesIfAdmin();

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

      // ✅ normalizamos a int para que el v-select matchee bien
      parent_category_id: toInt(it?.parent_category_id, 0) || null,
      category_id: toInt(it?.category_id, 0) || null,
    };

    // ✅ clave: si falta rubro pero hay subrubro, lo reponemos
    syncRubroFromSubrubro();

    stock.value = { branch_id: null, initial_qty: 0 };

    hydrating.value = false;
  },
  { immediate: true }
);

/**
 * ✅ si el usuario cambia el rubro:
 * - NO tocar durante hidratación
 * - solo limpiar category_id si el subrubro actual no pertenece al nuevo rubro
 */
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

/**
 * ✅ si por algún motivo cambia el category_id y el rubro quedó vacío,
 * lo re-sincronizamos (esto te cubre “me fui a STOCK y volví”)
 */
watch(
  () => model.value.category_id,
  () => {
    if (hydrating.value) return;
    syncRubroFromSubrubro();
  }
);

watch(openLocal, (v) => emit("update:open", v));

/** imágenes */
const existingImages = ref([]);
const newFiles = ref([]);
const uploading = ref(false);

const deleteOpen = ref(false);
const deleteImgOpen = ref(false);
const deleteImg = ref(null);

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

  if (props.mode === "create" && isAdmin.value && !stock.value.branch_id) {
    fieldErrors.value.branch_id = "Elegí una sucursal para crear el producto.";
  }

  return (
    !fieldErrors.value.name &&
    !fieldErrors.value.sku &&
    !fieldErrors.value.branch_id &&
    !fieldErrors.value.parent_category_id
  );
}

async function save() {
  if (!auth.isAuthed) return;

  // ✅ antes de validar, re-sincronizamos por si quedó colgado
  syncRubroFromSubrubro();

  if (!validateBeforeSave()) {
    tab.value = fieldErrors.value.branch_id ? "stock" : "datos";
    return;
  }

  const branchIdForProduct = isAdmin.value ? stock.value.branch_id : auth.branchId || null;

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
    branch_id: branchIdForProduct,
    parent_category_id: model.value.parent_category_id,
    category_id: model.value.category_id || null,
  };

  if (props.mode === "edit" && model.value.id) {
    const saved = await products.update(model.value.id, payload);
    if (saved?.id) {
      emit("saved", { id: saved.id });
      close();
    }
    return;
  }

  const saved = await products.create(payload);
  if (saved?.id) {
    model.value.id = saved.id;
    emit("saved", { id: saved.id });
    tab.value = "imagenes";
  }
}

async function uploadSelected() {}
function askRemoveImage(img) { deleteImg.value = img; deleteImgOpen.value = true; }
async function doDeleteImage() {}
async function doDeleteProduct() {}
</script>
