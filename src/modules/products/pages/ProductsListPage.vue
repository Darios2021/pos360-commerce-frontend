<!-- src/modules/products/pages/ProductsListPage.vue -->
<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div>
        <div class="text-h5 font-weight-bold">Productos</div>
        <div class="text-caption text-medium-emphasis">
          Total: {{ products.total }} · Página {{ page }}/{{ pages }}
        </div>
      </div>

      <div class="d-flex ga-2 align-center flex-wrap">
        <v-text-field
          v-model="q"
          density="comfortable"
          variant="outlined"
          hide-details
          style="min-width: 360px"
          prepend-inner-icon="mdi-magnify"
          placeholder="Buscar (nombre / sku / barcode / code / marca / modelo)"
          @keyup.enter="search"
        />
        <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" @click="search">Buscar</v-btn>
        <v-btn variant="tonal" @click="clear">Limpiar</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">Nuevo producto</v-btn>
      </div>
    </div>

    <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3">
      {{ products.error }}
    </v-alert>

    <v-card rounded="xl" class="overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="rows"
        :items-per-page="products.limit"
        :loading="products.loading"
        class="pos-table"
      >
        <template #item.name="{ item }">
          <div class="font-weight-bold">{{ item.name }}</div>
          <div class="text-caption text-medium-emphasis">SKU: {{ item.sku || "—" }}</div>
        </template>

        <template #item.code="{ item }">{{ item.code || "—" }}</template>
        <template #item.rubro="{ item }">{{ item.rubro || "—" }}</template>
        <template #item.subrubro="{ item }">{{ item.subrubro || "—" }}</template>
        <template #item.brand="{ item }">{{ item.brand || "—" }}</template>
        <template #item.model="{ item }">{{ item.model || "—" }}</template>

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
            <v-btn icon="mdi-eye-outline" variant="text" @click="openDetails(item.id)" />
            <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(item.id)" />
            <v-btn v-if="isAdmin" icon="mdi-delete-outline" variant="text" @click="askDelete(item)" />
          </div>
        </template>

        <template #bottom>
          <div class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
            <div class="text-caption text-medium-emphasis">Mostrando {{ rows.length }} de {{ products.total }}</div>

            <v-pagination v-model="page" :length="pages" :total-visible="7" @update:modelValue="onPage" />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <ProductDetailsDialog
      v-model:open="detailsOpen"
      :product-id="selectedId"
      @edit="({ id }) => openEdit(id)"
      @deleted="afterDeleted"
    />

    <ProductFormDialog
      v-model:open="formOpen"
      :mode="formMode"
      :item="formItem"
      @saved="afterSaved"
      @deleted="afterDeleted"
    />

    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés eliminar <b>{{ deleteItem?.name }}</b> (ID #{{ deleteItem?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">Esta acción no se puede deshacer.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDelete" :loading="products.loading">Eliminar</v-btn>
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

const deleteOpen = ref(false);
const deleteItem = ref(null);

const isAdmin = computed(() => (auth.roles || []).includes("admin"));

const headers = [
  { title: "Nombre / SKU", key: "name", sortable: false },
  { title: "Código", key: "code", sortable: false },
  { title: "Rubro", key: "rubro", sortable: false },
  { title: "Subrubro", key: "subrubro", sortable: false },
  { title: "Marca", key: "brand", sortable: false },
  { title: "Modelo", key: "model", sortable: false },
  { title: "Activo", key: "active", sortable: false },
  { title: "Lista", key: "price_list", sortable: false, align: "end" },
  { title: "", key: "actions", sortable: false, align: "end" },
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

const rows = computed(() => {
  return (products.items || []).map((x) => {
    const rubro = x?.category?.parent?.name || null;
    const subrubro = x?.category?.name || null;

    return {
      ...x,
      rubro,
      subrubro,
      price_list: toNum(x.price_list, 0),
    };
  });
});

const pages = computed(() => Number(products.pages || 1) || 1);

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

function askDelete(item) {
  deleteItem.value = item;
  deleteOpen.value = true;
}

async function doDelete() {
  if (!deleteItem.value?.id) return;
  const ok = await products.remove(deleteItem.value.id);
  if (ok) {
    deleteOpen.value = false;
    deleteItem.value = null;
    await load();
  }
}

async function afterSaved() {
  await load();
}
async function afterDeleted() {
  await load();
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
.pos-table :deep(th) {
  font-weight: 700;
}
</style>
