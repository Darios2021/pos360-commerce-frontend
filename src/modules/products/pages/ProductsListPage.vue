<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductsListPage.vue -->
<!--
✅ Server-side real:
- Paginación real con meta.total/meta.pages del backend
- Filtros reales SQL
- ✅ Estado (Activos / Inactivos / Todos)
  - admin default: Todos (include_inactive=1) => 314
  - no-admin default: Activos => 265
-->

<template>
  <div class="plp">
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div class="minw-0">
        <div class="text-h5 font-weight-bold">Productos</div>
        <div class="text-caption text-medium-emphasis">
          Mostrando {{ items.length }} de {{ meta.total }} · Página {{ meta.page }}/{{ meta.pages || 1 }}
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

    <!-- FILTROS (server-side) -->
    <v-card rounded="xl" class="pa-4 mb-4">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="f.q"
            label="Buscar (nombre / sku / barcode / code / marca / modelo)"
            variant="outlined"
            density="comfortable"
            clearable
            @keyup.enter="applyFilters"
          />
        </v-col>

        <v-col cols="12" md="4" v-if="isAdmin">
          <v-select
            v-model="f.branch_id"
            :items="branchItems"
            item-title="title"
            item-value="value"
            label="Sucursal (scope/stock)"
            variant="outlined"
            density="comfortable"
            clearable
            @update:modelValue="applyFilters"
          />
        </v-col>

        <v-col cols="12" :md="isAdmin ? 4 : 4">
          <v-select
            v-model="f.category_id"
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
            v-model="f.subcategory_id"
            :items="subcategoryItems"
            item-title="title"
            item-value="value"
            label="Subrubro"
            variant="outlined"
            density="comfortable"
            clearable
            :disabled="!f.category_id"
            @update:modelValue="applyFilters"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="f.stock"
            :items="stockItems"
            item-title="title"
            item-value="value"
            label="Stock"
            variant="outlined"
            density="comfortable"
            @update:modelValue="applyFilters"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="f.price_presence"
            :items="pricePresenceItems"
            item-title="title"
            item-value="value"
            label="Precio (lista)"
            variant="outlined"
            density="comfortable"
            @update:modelValue="applyFilters"
          />
        </v-col>

        <!-- ✅ ESTADO -->
        <v-col cols="12" md="4">
          <v-select
            v-model="f.status"
            :items="statusItems"
            item-title="title"
            item-value="value"
            label="Estado"
            variant="outlined"
            density="comfortable"
            @update:modelValue="applyFilters"
          />
        </v-col>

        <v-col cols="6" md="2">
          <v-text-field
            v-model="f.price_min"
            label="Precio mín."
            variant="outlined"
            density="comfortable"
            type="number"
            clearable
            @keyup.enter="applyFilters"
            @blur="applyFilters"
          />
        </v-col>

        <v-col cols="6" md="2">
          <v-text-field
            v-model="f.price_max"
            label="Precio máx."
            variant="outlined"
            density="comfortable"
            type="number"
            clearable
            @keyup.enter="applyFilters"
            @blur="applyFilters"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="f.images"
            :items="imagesItems"
            item-title="title"
            item-value="value"
            label="Imágenes"
            variant="outlined"
            density="comfortable"
            @update:modelValue="applyFilters"
          />
        </v-col>

        <v-col cols="12" class="d-flex ga-2">
          <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" @click="applyFilters">
            Buscar
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-filter-off" @click="clearFilters">
            Limpiar
          </v-btn>

          <v-spacer />

          <v-select
            v-model="limit"
            :items="[10, 20, 50, 100, 200]"
            label="Filas"
            variant="outlined"
            density="comfortable"
            style="max-width: 140px"
            @update:modelValue="onLimitChange"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- TABLA -->
    <v-card rounded="xl" class="plp-table-card">
      <div class="plp-table-wrap">
        <v-data-table
          :headers="headers"
          :items="items"
          item-key="id"
          show-select
          v-model:selected="selectedIds"
          :loading="products.loading || loading"
          class="pos-table plp-table"
          fixed-header
          height="560"
          @click:row="onRowClick"
        >
          <template #item.name="{ item }">
            <div class="font-weight-bold d-flex align-center minw-0" :style="isInactive(rowRaw(item)) ? 'opacity:.55' : ''">
              <span class="text-truncate">{{ rowRaw(item)?.name }}</span>
              <v-chip v-if="isInactive(rowRaw(item))" class="ml-2" size="x-small" color="grey" variant="tonal">
                Inactivo
              </v-chip>
            </div>
          </template>

          <template v-if="isAdmin" #item.branch="{ item }">
            <div class="cell-truncate">
              <template v-if="Number(rowRaw(item)?.branch_id || 0) > 0">
                <v-chip size="x-small" variant="tonal" :color="branchColor(rowRaw(item).branch_id)">
                  {{ branchName(rowRaw(item).branch_id) }}
                </v-chip>
              </template>
              <template v-else>
                <span class="text-caption text-medium-emphasis">—</span>
              </template>
            </div>
          </template>

          <template v-if="isAdmin" #item.branches="{ item }">
            <div class="branches-cell">
              <template v-if="enabledBranches(rowRaw(item)).length">
                <v-tooltip
                  v-for="(b, i) in visibleBranches(enabledBranches(rowRaw(item)))"
                  :key="`b-${rowRaw(item)?.id}-${b.id}-${i}`"
                  location="top"
                >
                  <template #activator="{ props }">
                    <v-chip v-bind="props" class="br-chip" size="x-small" variant="tonal" :color="branchColor(b.id)" label>
                      {{ branchInitials(b.name) }}
                    </v-chip>
                  </template>
                  <span>{{ b.name }}</span>
                </v-tooltip>

                <v-tooltip v-if="hiddenBranchesCount(enabledBranches(rowRaw(item))) > 0" location="top">
                  <template #activator="{ props }">
                    <v-chip v-bind="props" class="br-chip br-more" size="x-small" variant="tonal" label>
                      +{{ hiddenBranchesCount(enabledBranches(rowRaw(item))) }}
                    </v-chip>
                  </template>
                  <span>{{ hiddenBranchesText(enabledBranches(rowRaw(item))) }}</span>
                </v-tooltip>
              </template>

              <template v-else>
                <template v-if="Number(rowRaw(item)?.branch_id || 0) > 0">
                  <v-chip class="br-chip" size="x-small" variant="tonal" :color="branchColor(rowRaw(item).branch_id)" label>
                    {{ branchInitials(branchName(rowRaw(item).branch_id)) }}
                  </v-chip>
                </template>
                <template v-else>
                  <span class="text-caption text-medium-emphasis">—</span>
                </template>
              </template>
            </div>
          </template>

          <template #item.rubro="{ item }">
            <div class="cell-truncate">
              {{ rowRaw(item)?.category?.name || rowRaw(item)?.rubro || "—" }}
            </div>
          </template>

          <template #item.subrubro="{ item }">
            <div class="cell-truncate">
              {{ rowRaw(item)?.subcategory?.name || rowRaw(item)?.subrubro || "—" }}
            </div>
          </template>

          <template #item.actions="{ item }">
            <div class="actions-cell">
              <v-btn icon="mdi-eye-outline" variant="text" class="act-btn" title="Ver" @click.stop="openView(rowRaw(item).id)" />
              <v-menu location="bottom end" :close-on-content-click="true">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" class="act-btn" title="Opciones" @click.stop />
                </template>

                <v-list density="comfortable" min-width="220">
                  <v-list-item @click="openEdit(rowRaw(item).id)">
                    <template #prepend><v-icon size="18">mdi-pencil-outline</v-icon></template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>

                  <v-divider />

                  <v-list-item v-if="!isAdmin" @click="askDisable(rowRaw(item))">
                    <template #prepend><v-icon size="18">mdi-eye-off-outline</v-icon></template>
                    <v-list-item-title>Inactivar</v-list-item-title>
                  </v-list-item>

                  <v-list-item v-else @click="askDelete(rowRaw(item))">
                    <template #prepend><v-icon size="18" color="red">mdi-delete-outline</v-icon></template>
                    <v-list-item-title class="text-red">Eliminar</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>

          <template #bottom>
            <div class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
              <div class="text-caption text-medium-emphasis">Mostrando {{ items.length }} de {{ meta.total }}</div>
              <v-pagination v-model="page" :length="meta.pages || 1" :total-visible="7" @update:modelValue="fetchNow" />
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <ProductFormDialog v-model:open="formOpen" :mode="formMode" :item="formItem" @saved="fetchNow" @deleted="fetchNow" />

    <v-dialog v-model="disableOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Inactivar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés inactivar <b>{{ disableItem?.name }}</b> (ID #{{ disableItem?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">Se oculta para usuarios y POS (no se borra).</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="disableOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="doDisable" :loading="products.loading">Inactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés eliminar <b>{{ deleteItem?.name }}</b> (ID #{{ deleteItem?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">Si falla por ventas/relaciones, se inactiva automáticamente.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="deleteOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doDelete" :loading="products.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";
import { useCategoriesStore } from "@/app/store/categories.store";
import ProductFormDialog from "../components/ProductFormDialog.vue";

const router = useRouter();
const products = useProductsStore();
const auth = useAuthStore();
const categories = useCategoriesStore();

const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

const loading = ref(false);
const items = computed(() => (Array.isArray(products.items) ? products.items : []));

const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });
const page = ref(1);
const limit = ref(20);
const selectedIds = ref([]);

const formOpen = ref(false);
const formMode = ref("create");
const formItem = ref(null);

const deleteOpen = ref(false);
const deleteItem = ref(null);
const disableOpen = ref(false);
const disableItem = ref(null);

const snack = ref({ show: false, text: "" });
function toast(text) {
  snack.value = { show: true, text: String(text || "") };
}

function rowRaw(slotItem) {
  return slotItem?.raw ?? slotItem ?? {};
}
function isInactive(it) {
  return it?.is_active === false || Number(it?.is_active) === 0;
}

/* Branches */
const branches = ref([]);
async function loadBranchesSafe() {
  if (typeof products.fetchBranches !== "function") return;
  try {
    const arr = await products.fetchBranches();
    branches.value = Array.isArray(arr) ? arr : [];
  } catch {}
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
const branchItems = computed(() => {
  const out = [{ title: "Todas", value: null }];
  (branches.value || [])
    .map((b) => ({ title: b?.name || `Sucursal #${b?.id}`, value: Number(b?.id) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value)
    .forEach((x) => out.push(x));
  return out;
});

/* Multi-sucursal chips */
function branchInitials(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
}
function enabledBranches(it) {
  const gc = String(it?.branches_gc || "").trim();
  if (!gc) return [];
  return gc
    .split("|")
    .map((pair) => {
      const idx = pair.indexOf(":");
      if (idx <= 0) return null;
      const id = Number(pair.slice(0, idx));
      const name = String(pair.slice(idx + 1) || "").trim();
      if (!id) return null;
      return { id, name: name || branchName(id) };
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id);
}
function visibleBranches(list) {
  return (list || []).slice(0, 4);
}
function hiddenBranchesCount(list) {
  const n = (list || []).length;
  return n > 4 ? n - 4 : 0;
}
function hiddenBranchesText(list) {
  const rest = (list || []).slice(4).map((b) => b.name).filter(Boolean);
  return rest.length ? rest.join(" · ") : "—";
}

/* Categories */
async function loadCategoriesSafe() {
  try {
    if (typeof categories.fetchAll === "function") await categories.fetchAll(true);
  } catch {}
}
const parentList = computed(() => (Array.isArray(categories.parents) ? categories.parents : []));
const categoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  parentList.value
    .map((c) => ({ id: Number(c?.id || 0), name: String(c?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));
  return out;
});
const subcategoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  const pid = Number(f.value.category_id || 0);
  if (!pid) return out;

  const kids = Array.isArray(categories.children) ? categories.children : [];
  kids
    .filter((x) => Number(x?.category_id || x?.parent_id || 0) === pid || Number(x?.parent_id || 0) === pid)
    .map((x) => ({ id: Number(x?.id || 0), name: String(x?.name || "").trim() }))
    .filter((x) => x.id > 0 && x.name)
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .forEach((x) => out.push({ title: x.name, value: x.id }));

  return out;
});

/* Filtros */
const f = ref({
  q: "",
  branch_id: null,
  category_id: null,
  subcategory_id: null,
  stock: "all",
  price_presence: "all",
  status: isAdmin.value ? "all" : "active", // ✅ admin ve TODO por defecto
  price_min: null,
  price_max: null,
  images: "all",
});

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
const statusItems = computed(() => {
  // no-admin: no tiene sentido "Todos" si no querés que vean inactivos.
  if (!isAdmin.value) {
    return [
      { title: "Activos", value: "active" },
      { title: "Inactivos", value: "inactive" }, // por si lo querés permitir
    ];
  }
  return [
    { title: "Todos (activos + inactivos)", value: "all" },
    { title: "Activos", value: "active" },
    { title: "Inactivos", value: "inactive" },
  ];
});

function onCategoryChange() {
  f.value.subcategory_id = null;
  applyFilters();
}
function onLimitChange() {
  page.value = 1;
  fetchNow();
}
async function applyFilters() {
  page.value = 1;
  selectedIds.value = [];
  await fetchNow();
}
async function clearFilters() {
  f.value = {
    q: "",
    branch_id: null,
    category_id: null,
    subcategory_id: null,
    stock: "all",
    price_presence: "all",
    status: isAdmin.value ? "all" : "active",
    price_min: null,
    price_max: null,
    images: "all",
  };
  page.value = 1;
  selectedIds.value = [];
  await fetchNow();
}

/* Fetch */
async function fetchNow() {
  if (!auth.isAuthed) return;
  if (loading.value) return;

  loading.value = true;
  try {
    const params = {
      page: Number(page.value || 1),
      limit: Number(limit.value || 20),
      q: String(f.value.q || "").trim(),

      branch_id: isAdmin.value ? (f.value.branch_id ? Number(f.value.branch_id) : null) : null,

      category_id: f.value.category_id ? Number(f.value.category_id) : null,
      subcategory_id: f.value.subcategory_id ? Number(f.value.subcategory_id) : null,

      stock: f.value.stock,
      price_presence: f.value.price_presence,
      price_min: f.value.price_min !== "" && f.value.price_min != null ? Number(f.value.price_min) : null,
      price_max: f.value.price_max !== "" && f.value.price_max != null ? Number(f.value.price_max) : null,
      images: f.value.images,
    };

    // ✅ Estado -> backend
    // all => include_inactive=1
    // inactive => is_active=0
    // active => (no mandamos nada, backend default is_active=1) o mandamos is_active=1 si querés
    if (String(f.value.status) === "all") {
      params.include_inactive = 1;
    } else if (String(f.value.status) === "inactive") {
      params.is_active = 0;
    } else if (String(f.value.status) === "active") {
      // opcional: params.is_active = 1;
    }

    const r = await products.fetchList(params);

    const m =
      (r && r.meta) ||
      (r && r.data && r.meta) ||
      products.meta ||
      {
        page: params.page,
        limit: params.limit,
        total: Array.isArray(products.items) ? products.items.length : 0,
        pages: products.pages || 1,
      };

    meta.value = {
      page: Number(m.page || params.page),
      limit: Number(m.limit || params.limit),
      total: Number(m.total || 0),
      pages: Number(m.pages || 1) || 1,
    };

    if (page.value > meta.value.pages) page.value = meta.value.pages;
  } finally {
    loading.value = false;
  }
}

function onRowClick(e, row) {
  const item = row?.item?.raw ?? row?.item ?? row;
  const t = e?.target;
  if (t?.closest?.("button, a, input, label, textarea, select, .v-btn, .v-selection-control, .v-menu")) return;
  openView(item?.id);
}

const headers = computed(() => {
  const base = [
    { title: "Nombre", key: "name", sortable: false, width: 520 },
    { title: "Rubro", key: "rubro", sortable: false, width: 260 },
    { title: "Subrubro", key: "subrubro", sortable: false, width: 260 },
    { title: "", key: "actions", sortable: false, align: "end", width: 96 },
  ];
  if (!isAdmin.value) return base;

  const out = [...base];
  out.splice(1, 0, { title: "Sucursal dueña", key: "branch", sortable: false, width: 220 });
  out.splice(2, 0, { title: "Sucursales", key: "branches", sortable: false, width: 190 });
  return out;
});

function openView(id) {
  const pid = Number(id || 0);
  if (!pid) return;
  router.push({ name: "productView", params: { id: pid } });
}
async function openEdit(id) {
  if (!auth.isAuthed) return;
  const bid = isAdmin.value ? (f.value.branch_id ? Number(f.value.branch_id) : null) : null;
  const full = await products.fetchOne(Number(id), { force: true, branch_id: bid });
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
function askDelete(item) {
  deleteItem.value = item;
  deleteOpen.value = true;
}
function askDisable(item) {
  disableItem.value = item;
  disableOpen.value = true;
}

function normalizeRemoveResult(r) {
  if (typeof r === "boolean") return { ok: r, code: r ? null : "DELETE_FAILED", message: r ? null : "No se pudo eliminar" };
  if (r && typeof r === "object") return { ok: !!r.ok, code: r.code || null, message: r.message || null };
  return { ok: false, code: "DELETE_FAILED", message: "No se pudo eliminar" };
}
async function callRemoveProduct(id) {
  const fn =
    (products && typeof products.remove === "function" && products.remove) ||
    (products && typeof products.delete === "function" && products.delete) ||
    (products && typeof products.destroy === "function" && products.destroy) ||
    null;

  if (!fn) return { ok: false, code: "CLIENT_NO_METHOD", message: "Store: falta método remove/delete/destroy" };

  try {
    const out = await fn(id);
    return normalizeRemoveResult(out);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "No se pudo eliminar";
    const code = e?.response?.data?.code || e?.code || "DELETE_FAILED";
    return { ok: false, code, message: msg };
  }
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
    await fetchNow();
  }
}
async function doDelete() {
  if (!deleteItem.value?.id) return;
  const id = Number(deleteItem.value.id);
  try {
    const r = await callRemoveProduct(id);
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
    await fetchNow();
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
        const r = await callRemoveProduct(id);
        if (r.ok) deleted++;
        else if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
          const updated = await products.update(id, { is_active: false });
          if (updated?.id) inactivated++;
          else failed++;
        } else failed++;
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
  toast(isAdmin.value ? `Eliminados: ${deleted} · Inactivados(FK): ${inactivated} · Fallidos: ${failed}` : `Inactivados: ${inactivated} · Fallidos: ${failed}`);
  await fetchNow();
}

async function reload() {
  if (!auth.isAuthed) return;
  await loadCategoriesSafe();
  await loadBranchesSafe();
  await fetchNow();
}

onMounted(reload);

watch(
  () => auth.isAuthed,
  (v) => {
    if (v) reload();
  },
  { immediate: true }
);

watch(
  () => [page.value],
  () => {
    selectedIds.value = [];
  }
);
</script>

<style scoped>
.plp { min-width: 0; }
.plp-table-card { overflow: hidden; }
.plp-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.plp-table { min-width: 980px; }

.pos-table :deep(th) { font-weight: 900; white-space: nowrap; }

.pos-table :deep(tbody tr) { cursor: pointer; transition: background-color 120ms ease; }
.pos-table :deep(tbody tr:hover) { background: rgba(var(--v-theme-on-surface), 0.045); }
.pos-table :deep(tbody tr.v-data-table__selected) { background: rgba(var(--v-theme-primary), 0.10) !important; }

.cell-truncate { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.actions-cell { display: inline-flex; justify-content: flex-end; align-items: center; gap: 0px; min-width: 76px; }
.act-btn { width: 32px; height: 32px; margin-left: -2px; }
.actions-cell .act-btn:first-child { margin-left: 0; }

.branches-cell { display: inline-flex; align-items: center; gap: 6px; flex-wrap: nowrap; min-width: 160px; }
.br-chip { font-weight: 900; letter-spacing: 0.2px; padding-inline: 6px; border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 18%, transparent) !important; }
.br-more { opacity: 0.9; }

.pos-table :deep(.v-btn),
.pos-table :deep(.v-selection-control) { cursor: pointer; }

@media (max-width: 520px) {
  .plp-table { min-width: 900px; }
  .act-btn { width: 30px; height: 30px; }
}
</style>