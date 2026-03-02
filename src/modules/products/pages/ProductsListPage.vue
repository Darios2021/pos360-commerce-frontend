<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductsListPage.vue -->
<!-- FIX:
  ✅ Quita columna "Creación" (creador/fecha)
  ✅ Acciones: 1 SOLO ícono (menú ⋮) que contiene Ver / Editar / Inactivar o Eliminar
  ✅ Mantiene anti-desborde: wrap con scroll + truncados
-->

<template>
  <div class="plp">
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div class="minw-0">
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
            label="Buscar (nombre / sku / barcode / code / marca / modelo)"
            variant="outlined"
            density="comfortable"
            clearable
            @keyup.enter="applyFilters"
          />
        </v-col>

        <v-col cols="12" md="4" v-if="isAdmin">
          <v-select
            v-model="branchId"
            :items="branchItems"
            item-title="title"
            item-value="value"
            label="Sucursal (stock en sucursal)"
            variant="outlined"
            density="comfortable"
            clearable
            @update:modelValue="applyFilters"
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
            @update:modelValue="() => { onCategoryChange(); applyFilters(); }"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="subcategoryValue"
            :items="subcategoryItems"
            item-title="title"
            item-value="value"
            label="Subrubro"
            variant="outlined"
            density="comfortable"
            clearable
            :disabled="!categoryId"
            @update:modelValue="applyFilters"
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
            @update:modelValue="applyFilters"
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
            @update:modelValue="applyFilters"
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
            @keyup.enter="applyFilters"
            @blur="applyFilters"
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
            @keyup.enter="applyFilters"
            @blur="applyFilters"
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
        </v-col>
      </v-row>
    </v-card>

    <!-- TABLA (wrap con scroll) -->
    <v-card rounded="xl" class="plp-table-card">
      <div class="plp-table-wrap">
        <v-data-table
          :headers="headers"
          :items="pagedRows"
          item-key="id"
          show-select
          v-model:selected="selectedIds"
          :loading="loadingAll || products.loading"
          class="pos-table plp-table"
          fixed-header
          height="560"
        >
          <!-- Nombre + estado inactivo -->
          <template #item.name="{ item }">
            <div class="name-cell" :style="isInactive(item) ? 'opacity:.55' : ''">
              <span class="text-truncate name-text" :title="item.name">{{ item.name }}</span>
              <v-chip v-if="isInactive(item)" class="ml-2" size="x-small" color="grey" variant="tonal">
                Inactivo
              </v-chip>
            </div>
          </template>

          <!-- ✅ sucursal dueña (admin) -->
          <template v-if="isAdmin" #item.branch="{ item }">
            <div class="cell-truncate">
              <v-chip size="small" variant="tonal" :color="branchColor(item.branch_id)">
                {{ branchName(item.branch_id) }}
              </v-chip>
            </div>
          </template>

          <template #item.rubro="{ item }">
            <div class="cell-truncate" :title="cleanTrail(item.rubro) || '—'">
              {{ cleanTrail(item.rubro) || "—" }}
            </div>
          </template>

          <template #item.subrubro="{ item }">
            <div class="cell-truncate" :title="cleanTrail(item.subrubro) || '—'">
              {{ cleanTrail(item.subrubro) || "—" }}
            </div>
          </template>

          <!-- ✅ ACCIONES: 1 ícono (menú) -->
          <template #item.actions="{ item }">
            <div class="actions-cell">
              <v-menu location="bottom end" :close-on-content-click="true">
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    class="act-btn"
                    :title="'Acciones'"
                  />
                </template>

                <v-list density="comfortable" min-width="210">
                  <v-list-item @click="openView(item.id)">
                    <template #prepend><v-icon size="18">mdi-eye-outline</v-icon></template>
                    <v-list-item-title>Ver</v-list-item-title>
                  </v-list-item>

                  <v-list-item @click="openEdit(item.id)">
                    <template #prepend><v-icon size="18">mdi-pencil-outline</v-icon></template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>

                  <v-divider />

                  <v-list-item v-if="!isAdmin" @click="askDisable(item)">
                    <template #prepend><v-icon size="18">mdi-eye-off-outline</v-icon></template>
                    <v-list-item-title>Inactivar</v-list-item-title>
                  </v-list-item>

                  <v-list-item v-else @click="askDelete(item)">
                    <template #prepend><v-icon size="18" color="red">mdi-delete-outline</v-icon></template>
                    <v-list-item-title class="text-red">Eliminar</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
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
      </div>
    </v-card>

    <!-- FORM -->
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
          <div class="text-caption text-medium-emphasis mt-2">Se oculta para usuarios y POS (no se borra).</div>
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

    <v-snackbar v-model="snack.show" :timeout="3500">
      {{ snack.text }}
    </v-snackbar>
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

/* =========================
   FLAGS / PERMISOS
========================= */
const isAdmin = computed(() => {
  const r = auth.roles || [];
  return r.includes("admin") || r.includes("super_admin");
});

const userBranchId = computed(() => {
  const u = auth?.user || {};
  const bid = Number(u?.branch_id || 0) || Number(auth?.branchId || 0) || 0;
  return bid > 0 ? bid : null;
});

/* =========================
   FILTROS
========================= */
const q = ref("");
const branchId = ref(null);
const categoryId = ref(null);

/**
 * ✅ subcategoryValue puede ser:
 * - number (subcategory_id)
 * - string (name lower) si no hay id
 */
const subcategoryValue = ref(null);

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
   FORM
========================= */
const formOpen = ref(false);
const formMode = ref("create");
const formItem = ref(null);

/* =========================
   CONFIRMS
========================= */
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
function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function priceListNumber(it) {
  return toNum(it?.price_list, 0);
}
function stockQtyNumber(it) {
  const v = it?.stock_qty ?? it?.stock ?? it?.qty ?? it?.quantity ?? 0;
  return toNum(v, 0);
}
function cleanTrail(s) {
  if (!s) return "";
  return String(s).replace(/\s*>\s*/g, " / ").trim();
}
function isInactive(it) {
  return it?.is_active === false || Number(it?.is_active) === 0;
}

function pickStr(...vals) {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function matchText(it, needle) {
  if (!needle) return true;
  const n = String(needle).toLowerCase();

  const hay = [
    pickStr(it?.name),
    pickStr(it?.sku),
    pickStr(it?.barcode),
    pickStr(it?.code),
    pickStr(it?.brand),
    pickStr(it?.model),
  ]
    .join(" ")
    .toLowerCase();

  return hay.includes(n);
}

function normalizeRemoveResult(r) {
  if (typeof r === "boolean") {
    return { ok: r, code: r ? null : "DELETE_FAILED", message: r ? null : "No se pudo eliminar" };
  }
  if (r && typeof r === "object") {
    return { ok: !!r.ok, code: r.code || null, message: r.message || null };
  }
  return { ok: false, code: "DELETE_FAILED", message: "No se pudo eliminar" };
}

/** ✅ FIX BORRADO: soporta distintos nombres de método en el store */
async function callRemoveProduct(id) {
  const fn =
    (products && typeof products.remove === "function" && products.remove) ||
    (products && typeof products.delete === "function" && products.delete) ||
    (products && typeof products.destroy === "function" && products.destroy) ||
    null;

  if (!fn) {
    return { ok: false, code: "CLIENT_NO_METHOD", message: "Store: falta método remove/delete/destroy" };
  }

  try {
    const out = await fn(id);
    return normalizeRemoveResult(out);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "No se pudo eliminar";
    const code = e?.response?.data?.code || e?.code || "DELETE_FAILED";
    return { ok: false, code, message: msg };
  }
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

const branchItems = computed(() => {
  const out = [{ title: "Todas", value: null }];
  const arr = (branches.value || [])
    .map((b) => ({ title: b?.name || `Sucursal #${b?.id}`, value: Number(b?.id) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value);
  return out.concat(arr);
});

/* =========================
   CATEGORIES
========================= */
async function loadCategoriesSafe() {
  try {
    if (typeof categories.fetchAll === "function") {
      await categories.fetchAll(true);
      return;
    }
  } catch {
    // ignore
  }
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

function onCategoryChange() {
  subcategoryValue.value = null;
  page.value = 1;
}

/* =========================
   DATASET LOCAL (FIX: traer TODO cuando hay filtros)
========================= */
const loadingAll = ref(false);
const allItems = ref([]);

/** detecta filtros activos */
const hasActiveFilters = computed(() => {
  const qq = String(q.value || "").trim();
  const pmin = priceMin.value !== null && priceMin.value !== "" ? Number(priceMin.value) : null;
  const pmax = priceMax.value !== null && priceMax.value !== "" ? Number(priceMax.value) : null;

  return !!(
    qq ||
    branchId.value ||
    categoryId.value ||
    subcategoryValue.value ||
    stockFilter.value !== "all" ||
    pricePresence.value !== "all" ||
    imagesFilter.value !== "all" ||
    pmin !== null ||
    pmax !== null
  );
});

async function loadAll() {
  if (!auth.isAuthed) return;
  if (loadingAll.value) return;

  loadingAll.value = true;
  try {
    const qq = String(q.value || "").trim();

    const bid = isAdmin.value
      ? branchId.value
        ? Number(branchId.value)
        : null
      : userBranchId.value
        ? Number(userBranchId.value)
        : null;

    const subVal = subcategoryValue.value;
    const subId = typeof subVal === "number" && Number.isFinite(subVal) ? Number(subVal) : null;

    const serverParams = {
      q: qq || "",
      category_id: categoryId.value ? Number(categoryId.value) : null,
      subcategory_id: subId,
      branch_id: bid,
    };

    allItems.value = [];

    if (!hasActiveFilters.value) {
      await products.fetchList({ q: "", page: 1, limit: 1000, branch_id: bid });
      allItems.value = Array.isArray(products.items) ? products.items : [];
      return;
    }

    const LIMIT = 200;
    let p = 1;
    let pagesServer = 1;

    const MAX_PAGES = 80;
    const MAX_ITEMS = 16000;

    do {
      await products.fetchList({ ...serverParams, page: p, limit: LIMIT });

      const items = Array.isArray(products.items) ? products.items : [];
      const totalPages = Number(products.pages || 1) || 1;

      if (p === 1) pagesServer = totalPages;

      allItems.value = allItems.value.concat(items);

      if (allItems.value.length >= MAX_ITEMS) break;

      p++;
    } while (p <= pagesServer && p <= MAX_PAGES);
  } finally {
    loadingAll.value = false;
  }
}

/* =========================
   NORMALIZADAS
========================= */
const normalized = computed(() => {
  return (allItems.value || []).map((x) => {
    const cid = toInt(x?.category_id, 0) || null;
    const sid = toInt(x?.subcategory_id, 0) || null;

    const rubro =
      x?.category?.name ||
      x?.rubro ||
      x?.category_name ||
      x?.categoryName ||
      null;

    const subrubro =
      x?.subcategory?.name ||
      x?.subrubro ||
      x?.subcategory_name ||
      x?.subcategoryName ||
      null;

    const imagesCount = Number(x?.images_count ?? x?.images?.length ?? x?.media?.images?.length ?? 0);

    return {
      ...x,
      rubro,
      subrubro,
      rubro_id: cid,
      subrubro_id: sid,
      subrubro_key: String(subrubro || "").trim().toLowerCase() || null,
      imagesCount,
      _price_list_num: priceListNumber(x),
      _stock_num: stockQtyNumber(x),
    };
  });
});

/* =========================
   SUBRUBROS (items para select)
========================= */
const subcategoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  const pid = categoryId.value ? Number(categoryId.value) : 0;
  if (!pid) return out;

  const map = new Map();
  for (const it of normalized.value) {
    if (Number(it?.rubro_id || 0) !== pid) continue;

    const name = String(it?.subrubro || "").trim();
    const sid = Number(it?.subrubro_id || 0) || 0;

    if (sid > 0) {
      if (!map.has(`id:${sid}`)) map.set(`id:${sid}`, { id: sid, name: name || `Subrubro #${sid}` });
      continue;
    }

    if (!name) continue;
    const key = `name:${name.toLowerCase()}`;
    if (!map.has(key)) map.set(key, { id: null, name });
  }

  const arr = Array.from(map.values()).sort((a, b) => String(a.name).localeCompare(String(b.name), "es"));
  for (const x of arr) {
    out.push({
      title: x.name,
      value: x.id ? x.id : String(x.name).trim().toLowerCase(),
    });
  }

  return out;
});

/* =========================
   FILTRADO
========================= */
const filteredAll = computed(() => {
  const qq = String(q.value || "").trim();
  const pid = categoryId.value ? Number(categoryId.value) : null;

  const subVal = subcategoryValue.value;
  const subIsId = typeof subVal === "number" && Number.isFinite(subVal);
  const subId = subIsId ? Number(subVal) : null;
  const subKey = !subIsId && subVal ? String(subVal).toLowerCase() : null;

  const pmin = priceMin.value !== null && priceMin.value !== "" ? Number(priceMin.value) : null;
  const pmax = priceMax.value !== null && priceMax.value !== "" ? Number(priceMax.value) : null;

  return normalized.value.filter((it) => {
    if (isInactive(it)) return false;

    if (qq && !matchText(it, qq)) return false;
    if (pid && Number(it?.rubro_id || 0) !== pid) return false;

    if (subId && Number(it?.subrubro_id || 0) !== subId) return false;
    if (subKey && String(it?.subrubro_key || "") !== subKey) return false;

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
    subcategoryValue.value,
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
    { title: "Nombre", key: "name", sortable: false, width: 420 },
    { title: "Rubro", key: "rubro", sortable: false, width: 240 },
    { title: "Subrubro", key: "subrubro", sortable: false, width: 240 },
    { title: "", key: "actions", sortable: false, align: "end", width: 96 },
  ];

  if (!isAdmin.value) return base;

  const out = [...base];
  out.splice(1, 0, { title: "Sucursal dueña", key: "branch", sortable: false, width: 200 });
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
function openView(id) {
  const pid = Number(id || 0);
  if (!pid) return;
  router.push({ name: "productView", params: { id: pid } });
}

async function openEdit(id) {
  if (!auth.isAuthed) return;

  const bid = isAdmin.value
    ? branchId.value
      ? Number(branchId.value)
      : null
    : userBranchId.value
      ? Number(userBranchId.value)
      : null;

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

async function applyFilters() {
  page.value = 1;
  await loadAll();
}

async function clearFilters() {
  q.value = "";
  branchId.value = null;
  categoryId.value = null;
  subcategoryValue.value = null;
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
        const r = await callRemoveProduct(id);
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

  await loadCategoriesSafe();
  await loadBranchesSafe();
  await loadAll();
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
.plp {
  min-width: 0;
}

.plp-table-card {
  overflow: hidden;
}

.plp-table-wrap {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ✅ fuerza scroll en pantallas chicas en vez de romper */
.plp-table {
  min-width: 900px;
}

.pos-table :deep(th) {
  font-weight: 900;
  white-space: nowrap;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-truncate {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ✅ acciones: 1 botón */
.actions-cell {
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 44px;
}
.act-btn {
  width: 34px;
  height: 34px;
}

@media (max-width: 520px) {
  .plp-table {
    min-width: 840px;
  }
  .act-btn {
    width: 32px;
    height: 32px;
  }
}
</style>