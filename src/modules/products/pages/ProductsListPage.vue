<template>
  <v-container fluid class="py-6">
    <v-card class="mx-auto" max-width="1200" rounded="xl" elevation="2">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="d-flex flex-column">
          <div class="text-h6 font-weight-bold">Productos</div>
          <div class="text-caption text-medium-emphasis">
            Listado, búsqueda y gestión básica (alta / edición).
          </div>
        </div>

        <div class="d-flex ga-2 align-center flex-wrap">
          <v-text-field
            v-model="search"
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            label="Buscar (nombre, sku, barcode, marca, modelo)"
            hide-details
            style="min-width: 340px"
            @keyup.enter="onSearch"
          />

          <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" @click="onSearch">
            Buscar
          </v-btn>

          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
            Nuevo
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4">
        <v-alert v-if="store.error" type="error" variant="tonal" class="mb-4">
          {{ store.error }}
        </v-alert>

        <v-data-table-server
          :headers="headers"
          :items="store.items"
          :items-length="store.total"
          :loading="store.loading"
          :items-per-page="store.limit"
          :page="store.page"
          class="rounded-xl"
          @update:options="onOptions"
        >
          <template #item.category="{ item }">
            <span class="text-body-2">{{ item?.category?.name || "—" }}</span>
          </template>

          <template #item.is_active="{ item }">
            <v-chip size="small" :color="item.is_active ? 'green' : 'grey'" variant="tonal">
              {{ item.is_active ? "Activo" : "Inactivo" }}
            </v-chip>
          </template>

          <template #item.price="{ item }">
            <span class="text-body-2 font-weight-medium">{{ money(item.price) }}</span>
          </template>

          <template #item.cost="{ item }">
            <span class="text-body-2">{{ money(item.cost) }}</span>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-1 justify-end">
              <v-btn size="small" variant="text" icon="mdi-pencil" @click="openEdit(item)" :disabled="store.loading" />
              <v-btn size="small" variant="text" icon="mdi-warehouse" @click="goStock(item)" />
            </div>
          </template>

          <template #no-data>
            <div class="py-8 text-medium-emphasis">No hay productos para mostrar.</div>
          </template>
        </v-data-table-server>
      </v-card-text>
    </v-card>

    <ProductFormDialog
      v-model:open="dialog.open"
      :mode="dialog.mode"
      :initial="dialog.item"
      :saving="store.loading"
      :error="store.error"
      @save="saveProduct"
    />
  </v-container>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useProductsStore } from "../../../app/store/products.store";
import ProductFormDialog from "../components/ProductFormDialog.vue";

const router = useRouter();
const store = useProductsStore();

const headers = [
  { title: "ID", key: "id", width: 80 },
  { title: "SKU", key: "sku", width: 140 },
  { title: "Nombre", key: "name", minWidth: 260 },
  { title: "Categoría", key: "category", width: 180 },
  { title: "Marca", key: "brand", width: 150 },
  { title: "Modelo", key: "model", width: 150 },
  { title: "Costo", key: "cost", width: 140, align: "end" },
  { title: "Precio", key: "price", width: 140, align: "end" },
  { title: "Estado", key: "is_active", width: 110, align: "center" },
  { title: "", key: "actions", width: 110, align: "end", sortable: false },
];

const search = ref("");

const dialog = reactive({
  open: false,
  mode: "create",
  item: null,
});

function money(n) {
  const v = Number(n ?? 0);
  return v.toLocaleString("es-AR", { style: "currency", currency: "ARS" });
}

async function onSearch() {
  await store.fetch({ q: search.value, page: 1 });
}

async function onOptions(options) {
  const page = options?.page ?? 1;
  const limit = options?.itemsPerPage ?? store.limit;
  await store.fetch({ page, limit, q: store.q });
}

function openCreate() {
  dialog.mode = "create";
  dialog.item = null;
  dialog.open = true;
}

function openEdit(item) {
  dialog.mode = "edit";
  dialog.item = item;
  dialog.open = true;
}

async function saveProduct(payload) {
  if (dialog.mode === "create") {
    await store.create(payload);
  } else {
    await store.update(dialog.item.id, payload);
  }
  dialog.open = false;
}

function goStock(item) {
  // vamos a stock y filtramos por sku/nombre
  const q = item?.sku || item?.name || "";
  router.push({ name: "stock", query: { q } });
}

onMounted(async () => {
  search.value = store.q || "";
  await store.fetch({ page: 1 });
});
</script>
