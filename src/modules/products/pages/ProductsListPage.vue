<template>
  <div>
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div>
        <div class="text-h5 font-weight-bold">Productos</div>
        <div class="text-caption text-medium-emphasis">
          Mostrando {{ pagedRows.length }} de {{ filteredAll.length }} · Página {{ page }}/{{ pages }}
        </div>
      </div>

      <div class="d-flex ga-2 align-center flex-wrap">
        <v-btn
          v-if="selectedIds.length"
          :color="isAdmin ? 'red' : 'primary'"
          variant="tonal"
          :prepend-icon="isAdmin ? 'mdi-delete-outline' : 'mdi-eye-off-outline'"
          @click="bulkDisableOrDelete"
        >
          {{ isAdmin ? "Eliminar seleccionados" : "Inactivar seleccionados" }}
        </v-btn>

        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
          Nuevo producto
        </v-btn>
      </div>
    </div>

    <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3">
      {{ products.error }}
    </v-alert>

    <!-- FILTROS -->
    <v-card rounded="xl" class="pa-4 mb-4">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="q"
            label="Buscar por nombre"
            variant="outlined"
            density="comfortable"
            clearable
            @keyup.enter="applyFilters"
          />
        </v-col>

        <!-- Sucursal (solo admin) -->
        <v-col cols="12" md="4" v-if="isAdmin">
          <v-select
            v-model="branchId"
            :items="branchItems"
            item-title="title"
            item-value="value"
            label="Sucursal"
            variant="outlined"
            density="comfortable"
            clearable
          />
        </v-col>

        <v-col cols="12" :md="isAdmin ? 4 : 4">
          <v-select
            v-model="categoryId"
            :items="categoryItems"
            item-title="title"
            item-value="value"
            label="Rubro"
            variant="outlined"
            density="comfortable"
            clearable
            @update:modelValue="onCategoryChange"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="subcategoryId"
            :items="subcategoryItems"
            item-title="title"
            item-value="value"
            label="Subrubro"
            variant="outlined"
            density="comfortable"
            clearable
            :disabled="!categoryId"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="stockFilter"
            :items="stockItems"
            item-title="title"
            item-value="value"
            label="Stock"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="pricePresence"
            :items="pricePresenceItems"
            item-title="title"
            item-value="value"
            label="Precio (lista)"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="6" md="2">
          <v-text-field
            v-model="priceMin"
            label="Precio mín. (lista)"
            variant="outlined"
            density="comfortable"
            type="number"
            clearable
          />
        </v-col>

        <v-col cols="6" md="2">
          <v-text-field
            v-model="priceMax"
            label="Precio máx. (lista)"
            variant="outlined"
            density="comfortable"
            type="number"
            clearable
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="imagesFilter"
            :items="imagesItems"
            item-title="title"
            item-value="value"
            label="Imágenes"
            variant="outlined"
            density="comfortable"
          />
        </v-col>

        <v-col cols="12" class="d-flex ga-2">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" @click="applyFilters">
            Buscar
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-filter-off" @click="clearFilters">
            Limpiar
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- TABLA -->
    <v-card rounded="xl" class="overflow-hidden">
      <v-data-table
        :headers="headers"
        :items="pagedRows"
        item-key="id"
        show-select
        v-model:selected="selectedIds"
        :loading="products.loading"
        class="pos-table"
      >
        <!-- Nombre + estado inactivo -->
        <template #item.name="{ item }">
          <div
            class="font-weight-bold d-flex align-center"
            :style="isInactive(item) ? 'opacity:.55' : ''"
          >
            {{ item.name }}
            <v-chip
              v-if="isInactive(item)"
              class="ml-2"
              size="x-small"
              color="grey"
              variant="tonal"
            >
              Inactivo
            </v-chip>
          </div>
        </template>

        <template v-if="isAdmin" #item.branch="{ item }">
          <v-chip size="small" variant="tonal" :color="branchColor(item.branch_id)">
            {{ branchName(item.branch_id) }}
          </v-chip>
        </template>

        <template #item.rubro="{ item }">
          {{ cleanTrail(item.rubro) || "—" }}
        </template>

        <template #item.subrubro="{ item }">
          {{ cleanTrail(item.subrubro) || "—" }}
        </template>

        <template #item.stock="{ item }">
          <div class="text-right font-weight-bold">{{ stockLabel(item) }}</div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn icon="mdi-eye-outline" variant="text" @click="openDetails(item.id)" />
            <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(item.id)" />

            <!-- Usuario: inactiva / Admin: elimina -->
            <v-btn
              v-if="!isAdmin"
              icon="mdi-eye-off-outline"
              variant="text"
              @click="askDisable(item)"
              :title="'Inactivar'"
            />
            <v-btn
              v-else
              icon="mdi-delete-outline"
              variant="text"
              color="red"
              @click="askDelete(item)"
              :title="'Eliminar'"
              :disabled="isInactive(item)"
            />
          </div>
        </template>

        <template #bottom>
          <div class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
            <div class="text-caption text-medium-emphasis">
              Mostrando {{ pagedRows.length }} de {{ filteredAll.length }}
            </div>
            <v-pagination v-model="page" :length="pages" :total-visible="7" />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- DETAILS / FORM -->
    <ProductDetailsDialog
      v-model:open="detailsOpen"
      :product-id="selectedId"
      @edit="({ id }) => openEdit(id)"
      @deleted="reload"
    />

    <ProductFormDialog
      v-model:open="formOpen"
      :mode="formMode"
      :item="formItem"
      @saved="reload"
      @deleted="reload"
    />

    <!-- CONFIRM: inactivar -->
    <v-dialog v-model="disableOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Inactivar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés inactivar <b>{{ disableItem?.name }}</b> (ID #{{ disableItem?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">
            Se oculta para usuarios y POS (no se borra).
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="disableOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="doDisable" :loading="products.loading">Inactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- CONFIRM: delete -->
    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés eliminar <b>{{ deleteItem?.name }}</b> (ID #{{ deleteItem?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">
            Si falla por ventas/relaciones, se inactiva automáticamente.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDelete" :loading="products.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACK -->
    <v-snackbar v-model="snack.show" :timeout="3500">
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";

import ProductDetailsDialog from "../components/ProductDetailsDialog.vue";
import ProductFormDialog from "../components/ProductFormDialog.vue";

const products = useProductsStore();
const auth = useAuthStore();

/* =========================
   FLAGS / PERMISOS
========================= */
const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

/* =========================
   FILTROS
========================= */
const q = ref("");
const branchId = ref(null);
const categoryId = ref(null);
const subcategoryId = ref(null);

const stockFilter = ref("all");
const pricePresence = ref("all");
const priceMin = ref(null);
const priceMax = ref(null);

const imagesFilter = ref("all");

/* =========================
   UI / PAGINACIÓN
========================= */
const page = ref(1);
const limit = ref(20);
const selectedIds = ref([]);

/* =========================
   DIALOGS
========================= */
const detailsOpen = ref(false);
const selectedId = ref(null);

const formOpen = ref(false);
const formMode = ref("create");
const formItem = ref(null);

const deleteOpen = ref(false);
const deleteItem = ref(null);

const disableOpen = ref(false);
const disableItem = ref(null);

/* =========================
   SNACK
========================= */
const snack = ref({ show: false, text: "" });
function toast(text) {
  snack.value = { show: true, text: String(text || "") };
}

/* =========================
   HELPERS
========================= */
function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function priceListNumber(it) {
  return toNum(it?.price_list, 0);
}

function stockQtyNumber(it) {
  const v = it?.stock_qty ?? it?.stock ?? it?.qty ?? it?.quantity ?? 0;
  return toNum(v, 0);
}

function stockLabel(it) {
  return stockQtyNumber(it).toFixed(3);
}

function cleanTrail(s) {
  if (!s) return "";
  return String(s).replace(/\s*>\s*/g, " / ").trim();
}

function isInactive(it) {
  return it?.is_active === false || Number(it?.is_active) === 0;
}

/** Soporta remove() boolean o {ok,code,message} */
function normalizeRemoveResult(r) {
  if (typeof r === "boolean") {
    return { ok: r, code: r ? null : "DELETE_FAILED", message: r ? null : "No se pudo eliminar" };
  }
  if (r && typeof r === "object") {
    return { ok: !!r.ok, code: r.code || null, message: r.message || null };
  }
  return { ok: false, code: "DELETE_FAILED", message: "No se pudo eliminar" };
}

/* =========================
   BRANCHES
========================= */
const branches = ref([]);

async function loadBranchesSafe() {
  if (typeof products.fetchBranches !== "function") return;
  try {
    const arr = await products.fetchBranches();
    branches.value = Array.isArray(arr) ? arr : [];
  } catch {
    // ignore
  }
}

function branchName(id) {
  const bid = Number(id || 0);
  if (!bid) return "—";
  const found = branches.value.find((b) => Number(b?.id) === bid);
  return found?.name || `Sucursal #${bid}`;
}

function branchColor(id) {
  const bid = Number(id || 0);
  if (!bid) return "grey";
  if (bid === 1) return "primary";
  if (bid === 2) return "green";
  if (bid === 3) return "deep-purple";
  return "blue-grey";
}

/* =========================
   CATEGORÍAS
========================= */
const categoryItems = computed(() => {
  const map = new Map();
  for (const it of products.items || []) {
    const pid = it?.category?.parent?.id ?? null;
    const pname = it?.category?.parent?.name ?? null;
    if (pid && pname) map.set(Number(pid), String(pname));
  }
  const out = [{ title: "Todos", value: null }];
  Array.from(map.entries())
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
    .forEach(([id, name]) => out.push({ title: name, value: id }));
  return out;
});

const subcategoryItems = computed(() => {
  if (!categoryId.value) return [{ title: "Todos", value: null }];
  const pid = Number(categoryId.value);
  const map = new Map();

  for (const it of products.items || []) {
    const itPid = it?.category?.parent?.id ?? null;
    if (Number(itPid) !== pid) continue;

    const cid = it?.category?.id ?? null;
    const cname = it?.category?.name ?? null;
    if (cid && cname) map.set(Number(cid), String(cname));
  }

  const out = [{ title: "Todos", value: null }];
  Array.from(map.entries())
    .sort((a, b) => String(a[1]).localeCompare(String(b[1])))
    .forEach(([id, name]) => out.push({ title: name, value: id }));
  return out;
});

function onCategoryChange() {
  subcategoryId.value = null;
}

/* =========================
   BRANCH FILTER ITEMS (admin)
========================= */
const branchItems = computed(() => {
  const set = new Set();
  for (const it of products.items || []) {
    if (it?.branch_id) set.add(Number(it.branch_id));
  }
  const out = [{ title: "Todas", value: null }];
  Array.from(set)
    .sort((a, b) => a - b)
    .forEach((id) => out.push({ title: branchName(id), value: id }));
  return out;
});

/* =========================
   ROWS NORMALIZADAS
========================= */
const normalized = computed(() => {
  return (products.items || []).map((x) => {
    const rubro = x?.category?.parent?.name || null;
    const subrubro = x?.category?.name || null;

    const imagesCount = Number(x?.images_count ?? x?.images?.length ?? 0);

    return {
      ...x,
      rubro,
      subrubro,
      imagesCount,
      _price_list_num: priceListNumber(x),
      _stock_num: stockQtyNumber(x),
    };
  });
});

/* =========================
   FILTRADO
   ✅ Ocultamos inactivos para TODOS (admin y user)
========================= */
const filteredAll = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  const pid = categoryId.value ? Number(categoryId.value) : null;
  const cid = subcategoryId.value ? Number(subcategoryId.value) : null;

  const pmin = priceMin.value !== null && priceMin.value !== "" ? Number(priceMin.value) : null;
  const pmax = priceMax.value !== null && priceMax.value !== "" ? Number(priceMax.value) : null;

  return normalized.value.filter((it) => {
    // ✅ ocultar inactivos para todos
    if (isInactive(it)) return false;

    if (qq && !String(it.name || "").toLowerCase().includes(qq)) return false;

    if (isAdmin.value && branchId.value && Number(it.branch_id) !== Number(branchId.value)) return false;

    if (pid && Number(it?.category?.parent?.id || 0) !== pid) return false;
    if (cid && Number(it?.category?.id || 0) !== cid) return false;

    if (stockFilter.value === "with" && !(it._stock_num > 0)) return false;
    if (stockFilter.value === "without" && !(it._stock_num <= 0)) return false;

    const pl = it._price_list_num;
    if (pricePresence.value === "with" && !(pl > 0)) return false;
    if (pricePresence.value === "without" && !(pl <= 0)) return false;

    if (pmin !== null && pl < pmin) return false;
    if (pmax !== null && pl > pmax) return false;

    if (imagesFilter.value === "with" && !(it.imagesCount > 0)) return false;
    if (imagesFilter.value === "without" && !(it.imagesCount <= 0)) return false;

    return true;
  });
});

const pages = computed(() => Math.max(1, Math.ceil(filteredAll.value.length / Number(limit.value || 20))));

const pagedRows = computed(() => {
  const l = Number(limit.value || 20);
  const start = (Number(page.value || 1) - 1) * l;
  return filteredAll.value.slice(start, start + l);
});

watch(
  () => [
    q.value,
    branchId.value,
    categoryId.value,
    subcategoryId.value,
    stockFilter.value,
    pricePresence.value,
    priceMin.value,
    priceMax.value,
    imagesFilter.value,
    isAdmin.value,
  ],
  () => {
    page.value = 1;
    selectedIds.value = [];
  }
);

/* =========================
   HEADERS
========================= */
const headers = computed(() => {
  const base = [
    { title: "Nombre", key: "name", sortable: false },
    { title: "Rubro", key: "rubro", sortable: false },
    { title: "Subrubro", key: "subrubro", sortable: false },
    { title: "Stock", key: "stock", sortable: false, align: "end" },
    { title: "", key: "actions", sortable: false, align: "end" },
  ];

  if (!isAdmin.value) return base;

  const out = [...base];
  out.splice(1, 0, { title: "Sucursal", key: "branch", sortable: false });
  return out;
});

/* =========================
   UI CONSTS
========================= */
const stockItems = [
  { title: "Todos", value: "all" },
  { title: "Con stock", value: "with" },
  { title: "Sin stock", value: "without" },
];

const pricePresenceItems = [
  { title: "Todos", value: "all" },
  { title: "Con precio", value: "with" },
  { title: "Sin precio (0)", value: "without" },
];

const imagesItems = [
  { title: "Todas", value: "all" },
  { title: "Con imágenes", value: "with" },
  { title: "Sin imágenes", value: "without" },
];

/* =========================
   ACTIONS
========================= */
function openDetails(id) {
  selectedId.value = id;
  detailsOpen.value = true;
}

async function openEdit(id) {
  if (!auth.isAuthed) return;
  const full = await products.fetchOne(Number(id), { force: true });
  if (!full) return;

  formMode.value = "edit";
  formItem.value = full;
  formOpen.value = true;
}

function openCreate() {
  formMode.value = "create";
  formItem.value = null;
  formOpen.value = true;
}

function applyFilters() {
  page.value = 1;
}

async function clearFilters() {
  q.value = "";
  branchId.value = null;
  categoryId.value = null;
  subcategoryId.value = null;
  stockFilter.value = "all";
  pricePresence.value = "all";
  priceMin.value = null;
  priceMax.value = null;
  imagesFilter.value = "all";
  selectedIds.value = [];
  page.value = 1;
  await reload();
}

function askDelete(item) {
  deleteItem.value = item;
  deleteOpen.value = true;
}

function askDisable(item) {
  disableItem.value = item;
  disableOpen.value = true;
}

async function doDisable() {
  if (!disableItem.value?.id) return;

  try {
    const updated = await products.update(disableItem.value.id, { is_active: false });
    if (!updated?.id) throw new Error(products.error || "No se pudo inactivar");
    toast("Producto inactivado");
  } catch (e) {
    toast(e?.message || "No se pudo inactivar");
  } finally {
    disableOpen.value = false;
    disableItem.value = null;
    await reload();
  }
}

async function doDelete() {
  if (!deleteItem.value?.id) return;

  const id = Number(deleteItem.value.id);

  try {
    const r0 = await products.remove(id);
    const r = normalizeRemoveResult(r0);

    if (r.ok) {
      toast("Producto eliminado");
      return;
    }

    if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
      const updated = await products.update(id, { is_active: false });
      if (!updated?.id) throw new Error(products.error || "No se pudo inactivar (fallback FK)");
      toast("No se pudo borrar (FK). Se inactivó.");
      return;
    }

    throw new Error(r.message || products.error || "No se pudo eliminar");
  } catch (e) {
    toast(e?.message || "No se pudo eliminar");
  } finally {
    deleteOpen.value = false;
    deleteItem.value = null;
    await reload();
  }
}

async function bulkDisableOrDelete() {
  if (!selectedIds.value?.length) return;

  const ids = [...selectedIds.value].map((x) => Number(x)).filter((x) => x > 0);

  let deleted = 0;
  let inactivated = 0;
  let failed = 0;

  for (const id of ids) {
    try {
      if (isAdmin.value) {
        const r = normalizeRemoveResult(await products.remove(id));
        if (r.ok) {
          deleted++;
        } else if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
          const updated = await products.update(id, { is_active: false });
          if (updated?.id) inactivated++;
          else failed++;
        } else {
          failed++;
        }
      } else {
        const updated = await products.update(id, { is_active: false });
        if (updated?.id) inactivated++;
        else failed++;
      }
    } catch {
      failed++;
    }
  }

  selectedIds.value = [];

  if (isAdmin.value) toast(`Eliminados: ${deleted} · Inactivados(FK): ${inactivated} · Fallidos: ${failed}`);
  else toast(`Inactivados: ${inactivated} · Fallidos: ${failed}`);

  await reload();
}

/* =========================
   DATA LOAD
========================= */
async function reload() {
  if (!auth.isAuthed) return;

  await products.fetchList({ q: "", page: 1, limit: 1000 });
  await loadBranchesSafe();
}

onMounted(reload);

watch(
  () => auth.isAuthed,
  (v) => {
    if (v) reload();
  },
  { immediate: true }
);
</script>

<style scoped>
.pos-table :deep(th) {
  font-weight: 800;
}
</style>
