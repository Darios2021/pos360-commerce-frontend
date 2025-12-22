<!-- src/modules/products/pages/ProductsListPage.vue -->
<template>
  <div class="products-page">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-4">
      <div class="min-w-0">
        <div class="d-flex align-center ga-2">
          <div class="text-h5 font-weight-bold">Productos</div>

          <v-chip size="small" variant="tonal">
            Total: {{ products.total }}
          </v-chip>

          <v-chip v-if="auth.branchId" size="small" variant="tonal" color="primary">
            Sucursal #{{ auth.branchId }}
          </v-chip>
        </div>

        <div v-if="products.error" class="text-caption text-red mt-1">
          {{ products.error }}
        </div>
        <div v-else class="text-caption text-medium-emphasis mt-1">
          Página {{ page }} / {{ pages }}
        </div>
      </div>

      <div class="d-flex ga-2 align-center flex-wrap justify-end">
        <v-text-field
          v-model="q"
          density="comfortable"
          variant="outlined"
          hide-details
          class="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Buscar (nombre / sku / barcode / code / marca / modelo)"
          @keyup.enter="search"
          :disabled="!auth.isAuthed || products.loading"
          clearable
          @click:clear="clear"
        />

        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-magnify"
          @click="search"
          :loading="products.loading"
          :disabled="!auth.isAuthed"
        >
          Buscar
        </v-btn>

        <v-btn
          variant="tonal"
          prepend-icon="mdi-filter-off"
          @click="clear"
          :disabled="!auth.isAuthed || products.loading"
        >
          Limpiar
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          @click="openCreate"
          :disabled="!auth.isAuthed"
        >
          Nuevo producto
        </v-btn>
      </div>
    </div>

    <!-- Table -->
    <v-card rounded="xl" class="overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="rows"
        :items-per-page="products.limit"
        :loading="products.loading"
        class="pos-table"
        density="comfortable"
        hover
      >
        <template #item.name="{ item }">
          <div class="font-weight-bold text-truncate">{{ item.name }}</div>
          <div class="text-caption text-medium-emphasis">SKU: {{ item.sku || "—" }}</div>
        </template>

        <template #item.code="{ item }">
          {{ item.code || "—" }}
        </template>

        <template #item.rubro="{ item }">
          {{ item.rubro || "—" }}
        </template>

        <template #item.subrubro="{ item }">
          {{ item.subrubro || "—" }}
        </template>

        <template #item.brand="{ item }">
          {{ item.brand || "—" }}
        </template>

        <template #item.model="{ item }">
          {{ item.model || "—" }}
        </template>

        <template #item.active="{ item }">
          <v-chip size="small" variant="tonal" :color="item.is_active ? 'primary' : 'red'">
            {{ item.is_active ? "Activo" : "Inactivo" }}
          </v-chip>
        </template>

        <template #item.price_list="{ item }">
          {{ money(item.price_list) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-tooltip text="Ver">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-eye-outline"
                  variant="text"
                  @click="openDetails(item.id)"
                  :disabled="!auth.isAuthed"
                />
              </template>
            </v-tooltip>

            <v-tooltip text="Editar">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-pencil-outline"
                  variant="text"
                  @click="openEdit(item.id)"
                  :disabled="!auth.isAuthed"
                />
              </template>
            </v-tooltip>

            <!-- ✅ Eliminar (solo admin) -->
            <v-tooltip v-if="canDelete" text="Eliminar">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-trash-can-outline"
                  variant="text"
                  color="red"
                  @click="askDelete(item)"
                  :disabled="products.loading"
                />
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <div class="pa-8 text-center">
            <div class="text-subtitle-1 font-weight-medium">Sin datos</div>
            <div class="text-caption text-medium-emphasis">
              {{ !auth.isAuthed ? "Iniciá sesión para ver productos." : "Probá con otra búsqueda." }}
            </div>

            <div class="d-flex justify-center ga-2 mt-4" v-if="auth.isAuthed">
              <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="products.loading">
                Recargar
              </v-btn>
              <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
                Crear producto
              </v-btn>
            </div>
          </div>
        </template>

        <template #bottom>
          <div class="d-flex align-center justify-space-between flex-wrap ga-2 pa-4">
            <div class="text-caption text-medium-emphasis">
              Mostrando {{ rows.length }} de {{ products.total }}
            </div>

            <v-pagination
              v-model="page"
              :length="pages"
              :total-visible="7"
              @update:modelValue="onPage"
              :disabled="!auth.isAuthed || products.loading"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Detalle -->
    <ProductDetailsDialog
      v-model:open="detailsOpen"
      :product-id="selectedId"
      @edit="({ id }) => openEdit(id)"
    />

    <!-- Form -->
    <ProductFormDialog
      v-model:open="formOpen"
      :mode="formMode"
      :item="formItem"
      @saved="afterSaved"
    />

    <!-- ✅ Confirm Delete -->
    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          <div class="text-body-2">
            Vas a eliminar <b>{{ deleteItem?.name }}</b> (ID: {{ deleteItem?.id }}).
          </div>
          <div class="text-caption text-medium-emphasis mt-2">
            Esta acción no se puede deshacer.
          </div>
          <div v-if="deleteError" class="text-caption text-red mt-2">
            {{ deleteError }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="deleteOpen = false" :disabled="deleteLoading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="confirmDelete" :loading="deleteLoading">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import ProductDetailsDialog from "../components/ProductDetailsDialog.vue";
import ProductFormDialog from "../components/ProductFormDialog.vue";
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";

const products = useProductsStore();
const auth = useAuthStore();

const q = ref("");
const page = ref(1);

const detailsOpen = ref(false);
const selectedId = ref(null);

const formOpen = ref(false);
const formMode = ref("create");
const formItem = ref(null);

// ✅ delete state
const deleteOpen = ref(false);
const deleteItem = ref(null);
const deleteLoading = ref(false);
const deleteError = ref("");

const canDelete = computed(() => (auth.roles || []).includes("admin"));

const headers = [
  { title: "Nombre / SKU", key: "name", sortable: false, width: 320 },
  { title: "Código", key: "code", sortable: false, width: 120 },
  { title: "Rubro", key: "rubro", sortable: false, width: 180 },
  { title: "Subrubro", key: "subrubro", sortable: false, width: 220 },
  { title: "Marca", key: "brand", sortable: false, width: 140 },
  { title: "Modelo", key: "model", sortable: false, width: 140 },
  { title: "Activo", key: "active", sortable: false, width: 120 },
  { title: "Lista", key: "price_list", sortable: false, align: "end", width: 140 },
  { title: "", key: "actions", sortable: false, align: "end", width: 120 },
];

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function money(n) {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(n, 0));
  } catch {
    return `$ ${toNum(n, 0).toFixed(2)}`;
  }
}

const rows = computed(() =>
  (products.items || []).map((x) => {
    const rubro = x?.category?.parent?.name || null;
    const subrubro = x?.category?.name || null;

    return {
      ...x,
      rubro,
      subrubro,
      price_list: toNum(x.price_list, 0),
    };
  })
);

const pages = computed(() => {
  const total = Number(products.total || 0);
  const limit = Number(products.limit || 20);
  return Math.max(1, Math.ceil(total / limit));
});

async function load() {
  if (!auth.isAuthed) return;
  await products.fetchList({ q: q.value, page: page.value, limit: products.limit });
}

async function search() {
  page.value = 1;
  await load();
}

async function clear() {
  q.value = "";
  page.value = 1;
  await load();
}

async function onPage(p) {
  page.value = p;
  await load();
}

function openDetails(id) {
  selectedId.value = id;
  detailsOpen.value = true;
}

function openCreate() {
  formMode.value = "create";
  formItem.value = null;
  formOpen.value = true;
}

async function openEdit(id) {
  if (!auth.isAuthed) return;
  const full = await products.fetchOne(Number(id), { force: true });
  if (!full) return;

  formMode.value = "edit";
  formItem.value = full;
  formOpen.value = true;
}

async function afterSaved() {
  await load();
}

function askDelete(item) {
  deleteError.value = "";
  deleteItem.value = item;
  deleteOpen.value = true;
}

async function confirmDelete() {
  if (!deleteItem.value?.id) return;

  deleteLoading.value = true;
  deleteError.value = "";
  try {
    // ✅ necesitás tener implementado products.delete(id) en el store + DELETE en backend
    const ok = await products.delete(deleteItem.value.id);
    if (!ok) throw new Error(products.error || "DELETE_FAILED");

    deleteOpen.value = false;
    deleteItem.value = null;
    await load();
  } catch (e) {
    deleteError.value = e?.message || "No se pudo eliminar.";
  } finally {
    deleteLoading.value = false;
  }
}

onMounted(load);

watch(
  () => auth.isAuthed,
  (v) => {
    if (v) load();
  },
  { immediate: true }
);
</script>

<style scoped>
.products-page {
  width: 100%;
}

.search {
  min-width: 420px;
}

@media (max-width: 960px) {
  .search {
    min-width: 240px;
    flex: 1 1 240px;
  }
}

.pos-table :deep(th) {
  font-weight: 700;
}

.pos-table :deep(.v-data-table__td) {
  vertical-align: middle;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
