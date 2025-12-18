<!-- src/modules/products/pages/ProductsListPage.vue -->
<template>
  <div class="page">
    <div class="topbar">
      <div>
        <div class="text-h5 font-weight-bold">Productos</div>
        <div class="text-caption text-medium-emphasis">
          Total: <b>{{ products.total }}</b>
        </div>
      </div>

      <div class="actions">
        <v-text-field
          v-model="q"
          label="Buscar (nombre / sku / barcode / código)"
          prepend-inner-icon="mdi-magnify"
          hide-details
          class="search"
          @keyup.enter="doSearch"
        />
        <v-btn color="primary" prepend-icon="mdi-magnify" @click="doSearch">Buscar</v-btn>
        <v-btn variant="tonal" @click="clearSearch">Limpiar</v-btn>

        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">
          Nuevo producto
        </v-btn>
      </div>
    </div>

    <v-alert v-if="products.error" type="error" variant="tonal" class="mb-4">
      {{ products.error }}
    </v-alert>

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
              <div class="font-weight-bold">{{ row(item).name || "—" }}</div>
              <div class="text-caption text-medium-emphasis">
                SKU: <b>{{ row(item).sku }}</b>
                <span v-if="row(item).barcode"> · Barcode: <b>{{ row(item).barcode }}</b></span>
              </div>
            </div>
          </template>

          <template #item.category="{ item }">
            <span>{{ row(item).category?.name || (row(item).category_id ? `#${row(item).category_id}` : "—") }}</span>
          </template>

          <template #item.is_new="{ item }">
            <v-chip size="small" variant="tonal">{{ row(item).is_new ? "Nuevo" : "Existente" }}</v-chip>
          </template>

          <template #item.is_promo="{ item }">
            <v-chip size="small" :color="row(item).is_promo ? 'green' : 'grey'" variant="tonal">
              {{ row(item).is_promo ? "Promo" : "No" }}
            </v-chip>
          </template>

          <template #item.is_active="{ item }">
            <v-chip size="small" :color="row(item).is_active ? 'primary' : 'red'" variant="tonal">
              {{ row(item).is_active ? "Activo" : "Inactivo" }}
            </v-chip>
          </template>

          <template #item.price_list="{ item }">
            <span class="nowrap">{{ money(row(item).price_list) }}</span>
          </template>

          <template #item.price_discount="{ item }">
            <span class="nowrap">{{ money(row(item).price_discount) }}</span>
          </template>

          <template #item.price_reseller="{ item }">
            <span class="nowrap">{{ money(row(item).price_reseller) }}</span>
          </template>

          <!-- ✅ ACCIONES -->
          <template #item.actions="{ item }">
            <div class="d-flex ga-1 justify-end">
              <!-- VER -->
              <v-btn
                icon="mdi-eye-outline"
                variant="text"
                size="small"
                title="Ver"
                @click="openView(row(item))"
              />

              <!-- EDITAR -->
              <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                title="Editar"
                @click="openEdit(row(item))"
              />

              <!-- MENU -->
              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" />
                </template>
                <v-list density="compact" min-width="220">
                  <v-list-item
                    :prepend-icon="row(item).is_active ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                    :title="row(item).is_active ? 'Desactivar' : 'Activar'"
                    @click="toggleActive(row(item))"
                  />
                </v-list>
              </v-menu>
            </div>
          </template>

          <template #no-data>
            <div class="py-10 text-center text-medium-emphasis">No hay productos para mostrar.</div>
          </template>
        </v-data-table-server>
      </div>
    </v-card>

    <!-- Dialog Form (Create/Edit) -->
    <ProductFormDialog
      v-model:open="formOpen"
      :mode="formMode"
      :item="formItem"
      @saved="onSaved"
    />

    <!-- ✅ Dialog View -->
    <ProductDetailsDialog
      v-model:open="viewOpen"
      :product="viewItem"
      :error-text="products.error || ''"
      @edit="editFromView"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useProductsStore } from "../../../app/store/products.store";
import ProductFormDialog from "../components/ProductFormDialog.vue";
import ProductDetailsDialog from "../components/ProductDetailsDialog.vue";

const products = useProductsStore();
const q = ref(products.q || "");

// dialog state (create/edit)
const formOpen = ref(false);
const formMode = ref("create");
const formItem = ref(null);

// dialog state (view)
const viewOpen = ref(false);
const viewItem = ref(null);

const headers = computed(() => [
  { title: "Nombre / SKU", key: "name", sortable: false, width: 340 },
  { title: "Código", key: "code", sortable: false, width: 120 },
  { title: "Rubro", key: "category", sortable: false, width: 160 },
  { title: "Marca", key: "brand", sortable: false, width: 140 },
  { title: "Artículo", key: "is_new", sortable: false, width: 110 },
  { title: "Promo", key: "is_promo", sortable: false, width: 100 },
  { title: "Activo", key: "is_active", sortable: false, width: 110 },
  { title: "Lista", key: "price_list", sortable: false, align: "end", width: 120 },
  { title: "Dto.", key: "price_discount", sortable: false, align: "end", width: 110 },
  { title: "Rev.", key: "price_reseller", sortable: false, align: "end", width: 110 },
  { title: "", key: "actions", sortable: false, align: "end", width: 140 },
]);

onMounted(async () => {
  await products.fetch({ page: 1, limit: products.limit || 20, q: products.q || "" });
});

// ✅ Vuetify 3: el item puede venir como wrapper
function row(item) {
  return item?.raw ?? item;
}

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

function openCreate() {
  formMode.value = "create";
  formItem.value = null;
  formOpen.value = true;
}

function openEdit(item) {
  formMode.value = "edit";
  formItem.value = item;
  formOpen.value = true;
}

async function openView(item) {
  // si querés traer full detalle del backend:
  if (item?.id) {
    await products.getOne(item.id);
    viewItem.value = products.current || item;
  } else {
    viewItem.value = item;
  }
  viewOpen.value = true;
}

function editFromView(p) {
  viewOpen.value = false;
  openEdit(p);
}

async function toggleActive(item) {
  const newVal = item.is_active ? 0 : 1;
  await products.update(item.id, { is_active: newVal });
}

async function onSaved() {
  await products.fetch({ page: products.page, q: q.value });
}

function money(val) {
  const n = Number(val ?? 0);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}
</script>

<style scoped>
.page {
  padding-bottom: 80px;
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.search {
  min-width: 320px;
  max-width: 520px;
}

.table-card {
  overflow: hidden;
}

.table-scroll {
  overflow-x: auto;
}

.nowrap {
  white-space: nowrap;
}
</style>
