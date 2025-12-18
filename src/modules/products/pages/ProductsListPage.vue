<template>
  <div class="page-wrap">
    <!-- Header -->
    <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Productos</div>
        <div class="text-caption text-medium-emphasis">
          Total: <b>{{ products.total }}</b>
        </div>
      </div>

      <div class="d-flex flex-wrap ga-2 align-center">
        <v-text-field
          v-model="q"
          label="Buscar (nombre / sku / barcode / código)"
          prepend-inner-icon="mdi-magnify"
          hide-details
          style="min-width: 320px; max-width: 520px"
          @keyup.enter="doSearch"
        />
        <v-btn color="primary" prepend-icon="mdi-magnify" @click="doSearch">Buscar</v-btn>
        <v-btn variant="tonal" @click="clearSearch">Limpiar</v-btn>
        <v-btn variant="flat" color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Nuevo producto
        </v-btn>
      </div>
    </div>

    <v-alert v-if="products.error" type="error" variant="tonal" class="mb-4">
      {{ products.error }}
    </v-alert>

    <!-- Table container (controla ancho + scroll) -->
    <v-card class="table-card">
      <div class="table-scroll">
        <v-data-table-server
          :headers="headers"
          :items="products.items"
          :items-length="products.total"
          :loading="products.loading"
          :items-per-page="products.limit"
          :page="products.page"
          hover
          @update:options="onOptionsUpdate"
        >
          <template #item.name="{ item }">
            <div class="d-flex flex-column text-left">
              <div class="font-weight-bold">
                {{ item.name || "—" }}
              </div>
              <div class="text-caption text-medium-emphasis">
                SKU: <b>{{ item.sku }}</b>
                <span v-if="item.barcode"> · Barcode: <b>{{ item.barcode }}</b></span>
              </div>
            </div>
          </template>

          <template #item.category="{ item }">
            <span>{{ item.category?.name || (item.category_id ? `#${item.category_id}` : "—") }}</span>
          </template>

          <template #item.is_new="{ item }">
            <v-chip size="small">{{ item.is_new ? "Nuevo" : "Existente" }}</v-chip>
          </template>

          <template #item.is_promo="{ item }">
            <v-chip size="small" :color="item.is_promo ? 'green' : 'grey'">
              {{ item.is_promo ? "En promo" : "No" }}
            </v-chip>
          </template>

          <template #item.is_active="{ item }">
            <v-chip size="small" :color="item.is_active ? 'primary' : 'red'">
              {{ item.is_active ? "Activo" : "Inactivo" }}
            </v-chip>
          </template>

          <template #item.price_list="{ item }">
            <span class="text-no-wrap">{{ money(item.price_list) }}</span>
          </template>
          <template #item.price_discount="{ item }">
            <span class="text-no-wrap">{{ money(item.price_discount) }}</span>
          </template>
          <template #item.price_reseller="{ item }">
            <span class="text-no-wrap">{{ money(item.price_reseller) }}</span>
          </template>

          <!-- Actions -->
          <template #item.actions="{ item }">
            <div class="d-flex ga-1 justify-end">
              <v-btn icon="mdi-eye-outline" variant="text" size="small" title="Ver" @click="openView(item)" />
              <v-btn icon="mdi-pencil-outline" variant="text" size="small" title="Editar" @click="openEdit(item)" />

              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
                </template>
                <v-list density="compact" min-width="220">
                  <v-list-item prepend-icon="mdi-content-copy" title="Copiar SKU" @click="copyToClipboard(item.sku)" />
                  <v-list-item
                    v-if="item.barcode"
                    prepend-icon="mdi-barcode-scan"
                    title="Copiar Barcode"
                    @click="copyToClipboard(item.barcode)"
                  />
                  <v-list-item
                    prepend-icon="mdi-warehouse"
                    :disabled="!item.track_stock"
                    title="Ver stock"
                    @click="openStock(item)"
                  />
                  <v-divider />
                  <v-list-item
                    :prepend-icon="item.is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                    :title="item.is_active ? 'Desactivar' : 'Activar'"
                    @click="toggleActive(item)"
                  />
                </v-list>
              </v-menu>
            </div>
          </template>

          <template #no-data>
            <div class="py-10 text-center text-medium-emphasis">
              No hay productos para mostrar.
            </div>
          </template>
        </v-data-table-server>
      </div>
    </v-card>

    <!-- VIEW -->
    <v-dialog v-model="viewDialog" max-width="900">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="font-weight-bold">Producto</div>
          <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-caption text-medium-emphasis">Nombre</div>
              <div class="font-weight-bold">{{ selected?.name || "—" }}</div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption text-medium-emphasis">Código</div>
              <div class="font-weight-bold">{{ selected?.code || "—" }}</div>
            </v-col>
            <v-col cols="12" md="3">
              <div class="text-caption text-medium-emphasis">SKU</div>
              <div class="font-weight-bold">{{ selected?.sku || "—" }}</div>
            </v-col>

            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis">Rubro</div>
              <div class="font-weight-bold">
                {{ selected?.category?.name || (selected?.category_id ? `#${selected?.category_id}` : "—") }}
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis">Sub rubro</div>
              <div class="font-weight-bold">{{ selected?.sub_rubro || "—" }}</div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="text-caption text-medium-emphasis">Marca</div>
              <div class="font-weight-bold">{{ selected?.brand || "—" }}</div>
            </v-col>

            <v-col cols="12">
              <div class="text-caption text-medium-emphasis">Descripción</div>
              <div>{{ selected?.description || "—" }}</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- CREATE -->
    <v-dialog v-model="createDialog" max-width="960" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="font-weight-bold">Nuevo producto</div>
          <v-btn icon="mdi-close" variant="text" :disabled="saving" @click="closeCreate" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="createError" type="error" variant="tonal" class="mb-4">
            {{ createError }}
          </v-alert>

          <v-form @submit.prevent="saveCreate">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="createForm.name" label="Nombre" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="createForm.code" label="Código" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="createForm.sku" label="SKU (obligatorio)" />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="createForm.category_id"
                  label="Rubro (category_id)"
                  type="number"
                  hint="Luego lo pasamos a selector de categorías"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="createForm.sub_rubro" label="Sub rubro" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="createForm.brand" label="Marca" />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="createForm.description" label="Descripción" rows="3" />
              </v-col>

              <v-col cols="12" md="3">
                <v-switch v-model="createForm.is_new" label="Artículo nuevo" inset />
              </v-col>
              <v-col cols="12" md="3">
                <v-switch v-model="createForm.is_promo" label="En promoción" inset />
              </v-col>
              <v-col cols="12" md="3">
                <v-switch v-model="createForm.track_stock" label="Controla stock" inset />
              </v-col>
              <v-col cols="12" md="3">
                <v-switch v-model="createForm.is_active" label="Activo" inset />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model.number="createForm.price_list" label="Precio lista" type="number" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="createForm.price_discount" label="Precio descuento" type="number" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="createForm.price_reseller" label="Precio revendedor" type="number" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-4 py-3">
          <v-btn variant="tonal" :disabled="saving" @click="closeCreate">Cancelar</v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="saving" @click="saveCreate">Crear</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- EDIT (seguís usando el tuyo si ya lo tenías) -->
    <v-dialog v-model="editDialog" max-width="960" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="font-weight-bold">Editar producto</div>
          <v-btn icon="mdi-close" variant="text" :disabled="saving" @click="closeEdit" />
        </v-card-title>
        <v-divider />
        <v-card-text class="pt-4">
          <v-alert v-if="editError" type="error" variant="tonal" class="mb-4">
            {{ editError }}
          </v-alert>

          <v-form @submit.prevent="saveEdit">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field v-model="form.name" label="Nombre" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.code" label="Código" />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field v-model="form.sku" label="SKU" />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.category_id" label="Rubro (category_id)" type="number" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.sub_rubro" label="Sub rubro" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model="form.brand" label="Marca" />
              </v-col>

              <v-col cols="12">
                <v-textarea v-model="form.description" label="Descripción" rows="3" />
              </v-col>

              <v-col cols="12" md="3">
                <v-switch v-model="form.is_new" label="Artículo nuevo" inset />
              </v-col>
              <v-col cols="12" md="3">
                <v-switch v-model="form.is_promo" label="En promoción" inset />
              </v-col>
              <v-col cols="12" md="3">
                <v-switch v-model="form.track_stock" label="Controla stock" inset />
              </v-col>
              <v-col cols="12" md="3">
                <v-switch v-model="form.is_active" label="Activo" inset />
              </v-col>

              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.price_list" label="Precio lista" type="number" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.price_discount" label="Precio descuento" type="number" />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field v-model.number="form.price_reseller" label="Precio revendedor" type="number" />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-4 py-3">
          <v-btn variant="tonal" :disabled="saving" @click="closeEdit">Cancelar</v-btn>
          <v-spacer />
          <v-btn color="primary" :loading="saving" @click="saveEdit">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :timeout="2500">
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useProductsStore } from "../../../app/store/products.store";

const router = useRouter();
const products = useProductsStore();
const { mobile } = useDisplay();
const isMobile = computed(() => mobile.value);

const q = ref(products.q || "");

const headers = computed(() => {
  // En mobile recortamos columnas para que no “explote”
  if (isMobile.value) {
    return [
      { title: "Nombre / SKU", key: "name", sortable: false, width: 320 },
      { title: "Rubro", key: "category", sortable: false, width: 140 },
      { title: "Activo", key: "is_active", sortable: false, width: 110 },
      { title: "", key: "actions", sortable: false, align: "end", width: 120 },
    ];
  }

  return [
    { title: "Nombre / SKU", key: "name", sortable: false, width: 340 },
    { title: "Código", key: "code", sortable: false, width: 120 },
    { title: "Rubro", key: "category", sortable: false, width: 160 },
    { title: "Sub rubro", key: "sub_rubro", sortable: false, width: 160 },
    { title: "Marca", key: "brand", sortable: false, width: 140 },
    { title: "Artículo", key: "is_new", sortable: false, width: 110 },
    { title: "Promo", key: "is_promo", sortable: false, width: 110 },
    { title: "Activo", key: "is_active", sortable: false, width: 110 },
    { title: "Precio lista", key: "price_list", sortable: false, align: "end", width: 130 },
    { title: "Dto.", key: "price_discount", sortable: false, align: "end", width: 110 },
    { title: "Rev.", key: "price_reseller", sortable: false, align: "end", width: 110 },
    { title: "", key: "actions", sortable: false, align: "end", width: 120 },
  ];
});

const viewDialog = ref(false);
const createDialog = ref(false);
const editDialog = ref(false);
const selected = ref(null);

const saving = ref(false);
const createError = ref("");
const editError = ref("");

const snackbar = reactive({ show: false, text: "" });

const createForm = reactive({
  name: "",
  code: "",
  sku: "",
  category_id: null,
  sub_rubro: "",
  brand: "",
  description: "",
  is_new: false,
  is_promo: false,
  track_stock: true,
  is_active: true,
  price_list: 0,
  price_discount: 0,
  price_reseller: 0,
});

const form = reactive({
  id: null,
  name: "",
  code: "",
  sku: "",
  category_id: null,
  sub_rubro: "",
  brand: "",
  description: "",
  is_new: false,
  is_promo: false,
  track_stock: true,
  is_active: true,
  price_list: 0,
  price_discount: 0,
  price_reseller: 0,
});

onMounted(async () => {
  await products.fetch({ page: products.page || 1, limit: products.limit || 20, q: products.q || "" });
});

async function onOptionsUpdate(options) {
  const page = options?.page ?? 1;
  const limit = options?.itemsPerPage ?? products.limit ?? 20;
  await products.fetch({ page, limit, q: q.value });
}

async function doSearch() {
  await products.fetch({ page: 1, q: q.value });
}

async function clearSearch() {
  q.value = "";
  await products.fetch({ page: 1, q: "" });
}

function openView(item) {
  selected.value = item;
  viewDialog.value = true;
}

function openCreate() {
  createError.value = "";
  Object.assign(createForm, {
    name: "",
    code: "",
    sku: "",
    category_id: null,
    sub_rubro: "",
    brand: "",
    description: "",
    is_new: false,
    is_promo: false,
    track_stock: true,
    is_active: true,
    price_list: 0,
    price_discount: 0,
    price_reseller: 0,
  });
  createDialog.value = true;
}

function closeCreate() {
  if (saving.value) return;
  createDialog.value = false;
}

async function saveCreate() {
  saving.value = true;
  createError.value = "";

  try {
    if (!createForm.sku) throw new Error("SKU es obligatorio");
    if (!createForm.name) throw new Error("Nombre es obligatorio");

    const payload = {
      name: createForm.name,
      code: createForm.code || null,
      sku: createForm.sku,
      category_id: createForm.category_id || null,
      sub_rubro: createForm.sub_rubro || null,
      brand: createForm.brand || null,
      description: createForm.description || null,
      is_new: createForm.is_new ? 1 : 0,
      is_promo: createForm.is_promo ? 1 : 0,
      track_stock: createForm.track_stock ? 1 : 0,
      is_active: createForm.is_active ? 1 : 0,
      price_list: Number(createForm.price_list ?? 0),
      price_discount: Number(createForm.price_discount ?? 0),
      price_reseller: Number(createForm.price_reseller ?? 0),
    };

    await products.create(payload);

    snackbar.text = "✅ Producto creado";
    snackbar.show = true;
    createDialog.value = false;
  } catch (e) {
    createError.value = e?.friendlyMessage || e?.message || "Error creando producto";
  } finally {
    saving.value = false;
  }
}

function openEdit(item) {
  selected.value = item;
  viewDialog.value = false;

  form.id = item.id;
  form.name = item.name ?? "";
  form.code = item.code ?? "";
  form.sku = item.sku ?? "";
  form.category_id = item.category_id ?? null;
  form.sub_rubro = item.sub_rubro ?? "";
  form.brand = item.brand ?? "";
  form.description = item.description ?? "";
  form.is_new = !!item.is_new;
  form.is_promo = !!item.is_promo;
  form.track_stock = !!item.track_stock;
  form.is_active = !!item.is_active;
  form.price_list = Number(item.price_list ?? 0);
  form.price_discount = Number(item.price_discount ?? 0);
  form.price_reseller = Number(item.price_reseller ?? 0);

  editError.value = "";
  editDialog.value = true;
}

function closeEdit() {
  if (saving.value) return;
  editDialog.value = false;
}

async function saveEdit() {
  if (!form.id) return;

  saving.value = true;
  editError.value = "";

  try {
    const payload = {
      name: form.name,
      code: form.code || null,
      sku: form.sku,
      category_id: form.category_id || null,
      sub_rubro: form.sub_rubro || null,
      brand: form.brand || null,
      description: form.description || null,
      is_new: form.is_new ? 1 : 0,
      is_promo: form.is_promo ? 1 : 0,
      track_stock: form.track_stock ? 1 : 0,
      is_active: form.is_active ? 1 : 0,
      price_list: Number(form.price_list ?? 0),
      price_discount: Number(form.price_discount ?? 0),
      price_reseller: Number(form.price_reseller ?? 0),
    };

    await products.update(form.id, payload);

    snackbar.text = "✅ Producto actualizado";
    snackbar.show = true;
    editDialog.value = false;
  } catch (e) {
    editError.value = e?.friendlyMessage || e?.message || "Error guardando";
  } finally {
    saving.value = false;
  }
}

async function toggleActive(item) {
  try {
    const newVal = item.is_active ? 0 : 1;
    await products.update(item.id, { is_active: newVal });

    snackbar.text = newVal ? "✅ Producto activado" : "⛔ Producto desactivado";
    snackbar.show = true;
  } catch (e) {
    snackbar.text = e?.friendlyMessage || e?.message || "Error cambiando estado";
    snackbar.show = true;
  }
}

function openStock(item) {
  router.push({ name: "stock", query: { productId: String(item.id) } });
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(String(text ?? ""));
    snackbar.text = "📋 Copiado";
    snackbar.show = true;
  } catch {
    snackbar.text = "No se pudo copiar";
    snackbar.show = true;
  }
}

function money(val) {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
</script>

<style scoped>
.page-wrap {
  /* esto evita que la tabla “se vaya” en pantallas grandes */
  max-width: 1400px;
  margin: 0 auto;
}

.table-card {
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto; /* clave para muchas columnas */
}

.text-no-wrap {
  white-space: nowrap;
}
</style>
