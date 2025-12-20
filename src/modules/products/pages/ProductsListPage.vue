<!-- src/modules/products/pages/ProductsListPage.vue -->
<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Productos</div>
        <div class="text-caption text-medium-emphasis">Total: {{ products.total }}</div>
      </div>

      <div class="d-flex ga-2 align-center">
        <v-text-field
          v-model="q"
          density="comfortable"
          variant="outlined"
          hide-details
          style="min-width: 420px"
          prepend-inner-icon="mdi-magnify"
          placeholder="Buscar (nombre / sku / barcode / code / marca / modelo)"
          @keyup.enter="search"
        />
        <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" @click="search">Buscar</v-btn>
        <v-btn variant="tonal" @click="clear">Limpiar</v-btn>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">Nuevo producto</v-btn>
      </div>
    </div>

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
          <div class="text-caption text-medium-emphasis">SKU: {{ item.sku }}</div>
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

        <template #item.flags="{ item }">
          <v-chip size="small" variant="tonal">{{ item.is_new ? "Nuevo" : "Existente" }}</v-chip>
        </template>

        <template #item.promo="{ item }">
          <v-chip size="small" variant="tonal">{{ item.is_promo ? "Sí" : "No" }}</v-chip>
        </template>

        <template #item.active="{ item }">
          <v-chip size="small" variant="tonal" :color="item.is_active ? 'primary' : 'red'">
            {{ item.is_active ? "Activo" : "Inactivo" }}
          </v-chip>
        </template>

        <template #item.price_list="{ item }">
          {{ money(item.price_list) }}
        </template>

        <template #item.price_discount="{ item }">
          {{ money(item.price_discount) }}
        </template>

        <template #item.price_reseller="{ item }">
          {{ money(item.price_reseller) }}
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-2">
            <v-btn icon="mdi-eye-outline" variant="text" @click="openDetails(item.id)" />
            <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(item.id)" />
          </div>
        </template>

        <template #bottom>
          <div class="d-flex align-center justify-end pa-4">
            <v-pagination
              v-model="page"
              :length="pages"
              :total-visible="7"
              @update:modelValue="onPage"
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import ProductDetailsDialog from "../components/ProductDetailsDialog.vue";
import ProductFormDialog from "../components/ProductFormDialog.vue";
import { useProductsStore } from "../../../app/store/products.store";

const products = useProductsStore();

const q = ref("");
const page = ref(1);

const detailsOpen = ref(false);
const selectedId = ref(null);

const formOpen = ref(false);
const formMode = ref("create");
const formItem = ref(null);

const headers = [
  { title: "Nombre / SKU", key: "name", sortable: false },
  { title: "Código", key: "code", sortable: false },
  { title: "Rubro", key: "rubro", sortable: false },
  { title: "Subrubro", key: "subrubro", sortable: false },
  { title: "Marca", key: "brand", sortable: false },
  { title: "Modelo", key: "model", sortable: false },
  { title: "Artículo", key: "flags", sortable: false },
  { title: "Promo", key: "promo", sortable: false },
  { title: "Activo", key: "active", sortable: false },
  { title: "Lista", key: "price_list", sortable: false, align: "end" },
  { title: "Dto.", key: "price_discount", sortable: false, align: "end" },
  { title: "Rev.", key: "price_reseller", sortable: false, align: "end" },
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
      price_discount: toNum(x.price_discount, 0),
      price_reseller: toNum(x.price_reseller, 0),
    };
  });
});

const pages = computed(() => {
  const total = Number(products.total || 0);
  const limit = Number(products.limit || 20);
  return Math.max(1, Math.ceil(total / limit));
});

async function load() {
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
  const full = await products.fetchOne(Number(id), { force: true });
  if (!full) return;

  formMode.value = "edit";
  formItem.value = full;
  formOpen.value = true;
}

async function afterSaved() {
  await load();
}

onMounted(load);
</script>

<style scoped>
.pos-table :deep(th) {
  font-weight: 700;
}
</style>
