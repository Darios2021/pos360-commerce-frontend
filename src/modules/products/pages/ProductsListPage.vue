<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductsListPage.vue -->
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
            @update:modelValue="onCategoryChange"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            v-model="subcategoryName"
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
          <div class="font-weight-bold d-flex align-center minw-0" :style="isInactive(item) ? 'opacity:.55' : ''">
            <span class="text-truncate">{{ item.name }}</span>
            <v-chip v-if="isInactive(item)" class="ml-2" size="x-small" color="grey" variant="tonal">
              Inactivo
            </v-chip>
          </div>
        </template>

        <!-- ✅ mostramos sucursal dueña (products.branch_id) SOLO COMO INFO -->
        <template v-if="isAdmin" #item.branch="{ item }">
          <v-chip size="small" variant="tonal" :color="branchColor(item.branch_id)">
            {{ branchName(item.branch_id) }}
          </v-chip>
        </template>

        <template #item.rubro="{ item }">
          <span class="text-truncate d-inline-block" style="max-width: 260px">
            {{ cleanTrail(item.rubro) || "—" }}
          </span>
        </template>

        <template #item.subrubro="{ item }">
          <span class="text-truncate d-inline-block" style="max-width: 260px">
            {{ cleanTrail(item.subrubro) || "—" }}
          </span>
        </template>

        <!-- ✅ CREACIÓN COMPACTA (sin romper estética / sin "a. m.") -->
        <template #item.created="{ item }">
          <div class="created-compact">
            <span class="created-user">{{ creatorLabel(item) || "—" }}</span>
            <span class="created-sep">·</span>
            <span class="created-date">
              {{ fmtDateTimeShort(item?.created_at || item?.createdAt || item?.created_on || item?.createdOn) || "—" }}
            </span>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn icon="mdi-eye-outline" variant="text" @click="openDetails(item.id)" />
            <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(item.id)" />

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
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";
import { useCategoriesStore } from "../../../app/store/categories.store";

import ProductDetailsDialog from "../components/ProductDetailsDialog.vue";
import ProductFormDialog from "../components/ProductFormDialog.vue";

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

// ✅ Subrubro por NOMBRE (robusto, no depende de IDs cruzados)
const subcategoryName = ref(null);

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

/** ✅ compacto y sin "a. m." (24h) */
function fmtDateTimeShort(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
}

function creatorLabel(it) {
  const x =
    it?.created_by_user ||
    it?.createdByUser ||
    it?.created_by ||
    it?.createdBy ||
    it?.creator ||
    it?.user ||
    null;

  if (x && typeof x === "object") {
    return (
      x.username ||
      x.email ||
      [x.first_name, x.last_name].filter(Boolean).join(" ") ||
      x.name ||
      x.id ||
      ""
    );
  }

  if (typeof x === "string" && x.trim()) return x.trim();
  if (typeof x === "number" && x > 0) return `User #${x}`;

  const alt =
    it?.created_by_name ||
    it?.createdByName ||
    it?.created_by_email ||
    it?.createdByEmail ||
    it?.created_by_username ||
    it?.createdByUsername ||
    null;

  return alt ? String(alt) : "";
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
  subcategoryName.value = null;
}

/* =========================
   ROWS NORMALIZADAS (✅ usa subcategory REAL si viene)
========================= */
const normalized = computed(() => {
  return (products.items || []).map((x) => {
    const cid = toInt(x?.category_id, 0) || null;

    // ✅ Rubro: preferimos category.name (es tu rubro real)
    const rubro =
      x?.category?.name ||
      x?.rubro ||
      x?.category_name ||
      x?.categoryName ||
      null;

    // ✅ Subrubro: preferimos subcategory.name (tabla subcategories)
    const subrubro =
      x?.subcategory?.name ||
      x?.subrubro ||
      x?.subcategory_name ||
      x?.subcategoryName ||
      null;

    const imagesCount = Number(x?.images_count ?? x?.images?.length ?? 0);

    return {
      ...x,
      rubro,
      subrubro,
      rubro_id: cid,
      subrubro_key: String(subrubro || "").trim().toLowerCase() || null,
      imagesCount,
      _price_list_num: priceListNumber(x),
      _stock_num: stockQtyNumber(x),
    };
  });
});

/* =========================
   SUBRUBROS (✅ del listado real)
   - evita depender de IDs cruzados categories/subcategories
========================= */
const subcategoryItems = computed(() => {
  const out = [{ title: "Todos", value: null }];
  const pid = categoryId.value ? Number(categoryId.value) : 0;
  if (!pid) return out;

  const set = new Map(); // key lower -> label
  for (const it of normalized.value) {
    if (Number(it?.rubro_id || 0) !== pid) continue;
    const name = String(it?.subrubro || "").trim();
    if (!name) continue;
    set.set(name.toLowerCase(), name);
  }

  const arr = Array.from(set.values()).sort((a, b) => a.localeCompare(b, "es"));
  for (const name of arr) out.push({ title: name, value: name.toLowerCase() });

  return out;
});

/* =========================
   FILTRADO
========================= */
const filteredAll = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  const pid = categoryId.value ? Number(categoryId.value) : null;
  const subKey = subcategoryName.value ? String(subcategoryName.value).toLowerCase() : null;

  const pmin = priceMin.value !== null && priceMin.value !== "" ? Number(priceMin.value) : null;
  const pmax = priceMax.value !== null && priceMax.value !== "" ? Number(priceMax.value) : null;

  return normalized.value.filter((it) => {
    if (isInactive(it)) return false;

    if (qq && !String(it.name || "").toLowerCase().includes(qq)) return false;

    // si elegís sucursal, sólo mostramos con stock en esa sucursal (extra)
    if (isAdmin.value && branchId.value) {
      if (!(it._stock_num > 0)) return false;
    }

    if (pid && Number(it?.rubro_id || 0) !== pid) return false;

    // ✅ subrubro por NOMBRE normalizado
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
    subcategoryName.value,
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
   HEADERS (✅ SIN STOCK, ✅ CREACIÓN COMPACTA)
========================= */
const headers = computed(() => {
  const base = [
    { title: "Nombre", key: "name", sortable: false },
    { title: "Rubro", key: "rubro", sortable: false },
    { title: "Subrubro", key: "subrubro", sortable: false },
    { title: "Creación", key: "created", sortable: false },
    { title: "", key: "actions", sortable: false, align: "end" },
  ];

  if (!isAdmin.value) return base;

  const out = [...base];
  out.splice(1, 0, { title: "Sucursal dueña", key: "branch", sortable: false });
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

const branchItems = computed(() => {
  const out = [{ title: "Todas", value: null }];
  const arr = (branches.value || [])
    .map((b) => ({ title: b?.name || `Sucursal #${b?.id}`, value: Number(b?.id) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => a.value - b.value);
  return out.concat(arr);
});

/* =========================
   ACTIONS
========================= */
function openDetails(id) {
  selectedId.value = id;
  detailsOpen.value = true;
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
  await reload();
}

async function clearFilters() {
  q.value = "";
  branchId.value = null;
  categoryId.value = null;
  subcategoryName.value = null;
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

  const bid = isAdmin.value
    ? branchId.value
      ? Number(branchId.value)
      : null
    : userBranchId.value
      ? Number(userBranchId.value)
      : null;

  await loadCategoriesSafe();
  await products.fetchList({ q: "", page: 1, limit: 1000, branch_id: bid });
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

/* ✅ evita que "Creación" rompa a 2 líneas */
.created-compact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  max-width: 360px;
}

.created-user {
  font-size: 12px;
  opacity: 0.9;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.created-sep {
  opacity: 0.5;
}

.created-date {
  font-size: 12px;
  opacity: 0.9;
}
</style>
