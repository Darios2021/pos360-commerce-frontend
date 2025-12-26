<!-- src/modules/inventory/pages/InventoryPage.vue -->
<template>
  <div>
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
      <div>
        <div class="text-h5 font-weight-bold">Inventario</div>
        <div class="text-caption text-medium-emphasis">
          Total: {{ filteredCount }} · Página {{ page }}/{{ pages }}
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

        <v-btn color="primary" variant="flat" prepend-icon="mdi-magnify" @click="search">
          Buscar
        </v-btn>

        <v-btn variant="tonal" @click="clear">
          Limpiar
        </v-btn>

        <v-btn variant="tonal" prepend-icon="mdi-filter-variant" @click="advanced = !advanced">
          Más filtros
        </v-btn>

        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate">
          Nuevo producto
        </v-btn>
      </div>
    </div>

    <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3">
      {{ products.error }}
    </v-alert>

    <!-- FILTERS -->
    <v-card rounded="xl" class="mb-4 pa-4" variant="tonal">
      <v-row dense>
        <!-- Sucursal (solo admin) -->
        <v-col cols="12" md="3" v-if="isAdmin">
          <v-select
            v-model="branchId"
            :items="branchItems"
            item-title="title"
            item-value="value"
            label="Sucursal"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
          />
        </v-col>

        <!-- Rubro -->
        <v-col cols="12" md="3">
          <v-select
            v-model="rubroId"
            :items="rubroItems"
            item-title="title"
            item-value="value"
            label="Rubro"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            no-data-text="No hay rubros"
            @update:modelValue="onRubroChange"
          />
        </v-col>

        <!-- Subrubro -->
        <v-col cols="12" md="3">
          <v-select
            v-model="subrubroId"
            :items="subrubroItems"
            item-title="title"
            item-value="value"
            label="Subrubro"
            variant="outlined"
            density="comfortable"
            clearable
            hide-details
            :disabled="!rubroId"
            no-data-text="No hay subrubros"
          />
        </v-col>

        <!-- Stock -->
        <v-col cols="12" md="3">
          <v-select
            v-model="stockMode"
            :items="stockModes"
            item-title="title"
            item-value="value"
            label="Stock"
            variant="outlined"
            density="comfortable"
            hide-details
          />
        </v-col>

        <!-- Advanced -->
        <template v-if="advanced">
          <!-- Precio: presencia -->
          <v-col cols="12" md="3">
            <v-select
              v-model="pricePresence"
              :items="pricePresenceItems"
              item-title="title"
              item-value="value"
              label="Precio (lista)"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <!-- Precio min -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="priceMin"
              label="Precio mín. (lista)"
              variant="outlined"
              density="comfortable"
              hide-details
              type="number"
              inputmode="decimal"
            />
          </v-col>

          <!-- Precio max -->
          <v-col cols="12" md="3">
            <v-text-field
              v-model="priceMax"
              label="Precio máx. (lista)"
              variant="outlined"
              density="comfortable"
              hide-details
              type="number"
              inputmode="decimal"
            />
          </v-col>

          <!-- Imágenes -->
          <v-col cols="12" md="3">
            <v-select
              v-model="imagesMode"
              :items="imagesModeItems"
              item-title="title"
              item-value="value"
              label="Imágenes"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>

          <!-- Faltantes -->
          <v-col cols="12">
            <v-select
              v-model="missing"
              :items="missingItems"
              item-title="title"
              item-value="value"
              label="Faltantes (datos vacíos)"
              variant="outlined"
              density="comfortable"
              multiple
              chips
              closable-chips
              hide-details
            />
          </v-col>
        </template>
      </v-row>

      <div v-if="chips.length" class="d-flex flex-wrap ga-2 mt-3">
        <v-chip
          v-for="c in chips"
          :key="c.key"
          size="small"
          variant="tonal"
          closable
          @click:close="c.onClose"
        >
          {{ c.label }}
        </v-chip>
      </div>
    </v-card>

    <!-- BULK ACTIONS -->
    <v-card v-if="selectedIds.length" rounded="xl" class="mb-3 pa-3" variant="tonal">
      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="text-body-2">
          Seleccionados: <b>{{ selectedIds.length }}</b>
        </div>

        <div class="d-flex ga-2 flex-wrap justify-end">
          <v-btn variant="tonal" prepend-icon="mdi-close" @click="selectedIds = []">
            Limpiar selección
          </v-btn>

          <!-- Para TODOS: “eliminar” = inactivar -->
          <v-btn color="red" variant="flat" prepend-icon="mdi-eye-off-outline" @click="bulkInactivate">
            Inactivar seleccionados
          </v-btn>

          <!-- Admin: borrar real (si no se puede por FK, cae a inactivar) -->
          <v-btn
            v-if="isAdmin"
            color="red"
            variant="tonal"
            prepend-icon="mdi-delete-outline"
            @click="bulkDelete"
          >
            Eliminar (admin)
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- TABLE -->
    <v-card rounded="xl" class="overflow-hidden">
      <v-data-table
        v-model="selectedIds"
        show-select
        :headers="headers"
        :items="pagedRows"
        :items-per-page="pageSize"
        :loading="loadingAll || products.loading"
        class="pos-table"
        item-value="id"
      >
        <!-- Nombre -->
        <template #item.name="{ item }">
          <div class="font-weight-bold">{{ item.name || "—" }}</div>
        </template>

        <!-- Sucursal -->
        <template #item.branch="{ item }">
          <v-chip size="small" variant="tonal" :color="branchColor(item.branch_id)">
            {{ branchName(item.branch_id) }}
          </v-chip>
        </template>

        <template #item.rubro="{ item }">{{ item.rubro || "—" }}</template>
        <template #item.subrubro="{ item }">{{ item.subrubro || "—" }}</template>

        <!-- Stock -->
        <template #item.stock="{ item }">
          <div class="text-right">
            <span class="font-weight-bold">{{ stockLabel(item) }}</span>
          </div>
        </template>

        <!-- Acciones -->
        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn icon="mdi-eye-outline" variant="text" @click="openDetails(item.id)" />
            <v-btn icon="mdi-pencil-outline" variant="text" @click="openEdit(item.id)" />

            <!-- Usuario: inactivar (no borrar) -->
            <v-btn
              v-if="!isAdmin"
              icon="mdi-eye-off-outline"
              variant="text"
              color="red"
              @click="askInactivate(item)"
            />

            <!-- Admin: borrar (puede fallar por FK -> fallback a inactivar) -->
            <v-btn
              v-else
              icon="mdi-delete-outline"
              variant="text"
              color="red"
              @click="askDelete(item)"
            />
          </div>
        </template>

        <!-- Paginación real (según filtro) -->
        <template #bottom>
          <div class="d-flex align-center justify-space-between pa-4 flex-wrap ga-2">
            <div class="text-caption text-medium-emphasis">
              Mostrando {{ pagedRows.length }} de {{ filteredCount }}
            </div>
            <v-pagination v-model="page" :length="pages" :total-visible="7" />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- DIALOGS (reusamos los de products) -->
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

    <!-- Confirm inactivate -->
    <v-dialog v-model="inactiveOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Inactivar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés inactivar <b>{{ inactiveItem?.name }}</b> (ID #{{ inactiveItem?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">
            No se borra: queda invisible para usuarios y POS.
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="inactiveOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="red" variant="flat" @click="doInactivate" :loading="products.loading">Inactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm delete -->
    <v-dialog v-model="deleteOpen" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold">Eliminar producto</v-card-title>
        <v-card-text>
          ¿Seguro que querés eliminar <b>{{ deleteItem?.name }}</b> (ID #{{ deleteItem?.id }})?
          <div class="text-caption text-medium-emphasis mt-2">
            Si falla por ventas (FK), lo vamos a inactivar automáticamente.
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

// Reusamos componentes existentes del módulo products
import ProductDetailsDialog from "../../products/components/ProductDetailsDialog.vue";
import ProductFormDialog from "../../products/components/ProductFormDialog.vue";

const products = useProductsStore();
const auth = useAuthStore();

/** UI */
const q = ref("");
const advanced = ref(false);

/** filtros */
const branchId = ref(null);
const rubroId = ref(null);       // parent_category_id
const subrubroId = ref(null);    // category_id

// stock (según lo que venga en list)
const stockMode = ref("all"); // all | gt0 | eq0 | lt0 | missing
const stockModes = [
  { title: "Todos", value: "all" },
  { title: "Con stock (> 0)", value: "gt0" },
  { title: "Sin stock (= 0)", value: "eq0" },
  { title: "Stock negativo (< 0)", value: "lt0" },
  { title: "Stock sin dato", value: "missing" },
];

// precio (lista)
const pricePresence = ref("all"); // all | with | without
const priceMin = ref("");
const priceMax = ref("");
const pricePresenceItems = [
  { title: "Todos", value: "all" },
  { title: "Con precio", value: "with" },
  { title: "Sin precio", value: "without" },
];

// imágenes
const imagesMode = ref("all"); // all | with | without
const imagesModeItems = [
  { title: "Todas", value: "all" },
  { title: "Con imágenes", value: "with" },
  { title: "Sin imágenes", value: "without" },
];

// faltantes
const missing = ref([]);
const missingItems = [
  { title: "Sin rubro/categoría", value: "category" },
  { title: "Sin subrubro", value: "subcategory" },
  { title: "Sin marca", value: "brand" },
  { title: "Sin modelo", value: "model" },
  { title: "Sin precio", value: "price_list" },
];

/** admin */
const isAdmin = computed(() => {
  const u = auth?.user || {};
  const roles = Array.isArray(u.roles) ? u.roles : (Array.isArray(auth.roles) ? auth.roles : []);
  const roleNames = roles
    .map((r) => (typeof r === "string" ? r : (r?.name || r?.role || "")))
    .map((s) => String(s).toLowerCase());
  return roleNames.some((r) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(r)) || u?.is_admin === true;
});

/** data local (para paginación real con filtros) */
const loadingAll = ref(false);
const allItems = ref([]); // cache full list segun q
const branches = ref([]); // para mostrar nombre sucursal (si endpoint existe)
const branchesLoaded = ref(false);

/** selección múltiple */
const selectedIds = ref([]);

/** dialogs */
const detailsOpen = ref(false);
const selectedId = ref(null);

const formOpen = ref(false);
const formMode = ref("create");
const formItem = ref(null);

const deleteOpen = ref(false);
const deleteItem = ref(null);

const inactiveOpen = ref(false);
const inactiveItem = ref(null);

const snack = ref({ show: false, text: "" });

/** paginación real (cliente) */
const page = ref(1);
const pageSize = 25;

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function toMaybeNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function cleanCatName(s) {
  if (!s) return "";
  return String(s).replace(/\s*>\s*/g, " / ").replace(/\s+/g, " ").trim();
}

function branchName(branch_id) {
  const id = Number(branch_id || 0);
  if (!id) return "—";
  const found = (branches.value || []).find((b) => Number(b?.id) === id);
  return found?.name ? found.name : `Sucursal #${id}`;
}

function branchColor(branch_id) {
  const id = Number(branch_id || 0);
  if (!id) return "grey";
  if (id === 1) return "primary";
  if (id === 2) return "green";
  if (id === 3) return "deep-purple";
  return "blue-grey";
}

/** stock: no está en columns -> usamos lo que venga en list o sheet_stock_label */
function stockNumber(item) {
  const v =
    item?.stock_qty ??
    item?.stock ??
    item?.qty ??
    item?.quantity ??
    item?.sheet_stock_label ??
    null;

  if (v === null || v === undefined || v === "") return null;

  // si viene string tipo "10.000" -> parse
  const n = Number(String(v).replace(",", "."));
  if (Number.isFinite(n)) return n;

  // si es texto no numérico -> sin dato
  return null;
}

function stockLabel(item) {
  const n = stockNumber(item);
  if (n === null) return "—";
  return n.toFixed(3);
}

/** precio lista para filtros */
function priceListNumber(item) {
  return toNum(item?.price_list, 0);
}

/** imágenes: cache + prefetch por página */
const imagesCountCache = ref(new Map()); // id -> count

function hasImagesSync(item) {
  const id = Number(item?.id || 0);
  if (!id) return null;

  // si backend trae info en list:
  const c1 = Number(item?.images_count ?? item?.image_count ?? 0);
  if (Number.isFinite(c1) && c1 > 0) return true;
  if (item?.has_images === true) return true;
  if (Array.isArray(item?.product_images) && item.product_images.length > 0) return true;

  // cache
  if (imagesCountCache.value.has(id)) {
    const c = Number(imagesCountCache.value.get(id) || 0);
    return c > 0;
  }

  return null; // unknown
}

async function prefetchImagesForItems(items) {
  // solo cuando user filtra por imágenes
  if (imagesMode.value === "all") return;

  const list = (items || [])
    .map((x) => Number(x?.id || 0))
    .filter((id) => id > 0 && !imagesCountCache.value.has(id));

  // limitamos para no matar el server
  const batch = list.slice(0, 25);
  if (!batch.length) return;

  await Promise.all(
    batch.map(async (id) => {
      try {
        const imgs = await products.fetchImages(id);
        const count = Array.isArray(imgs) ? imgs.length : 0;
        imagesCountCache.value.set(id, count);
      } catch {
        imagesCountCache.value.set(id, 0);
      }
    })
  );
}

/** headers mínimos */
const headers = computed(() => {
  const base = [
    { title: "Nombre", key: "name", sortable: false },
    { title: "Sucursal", key: "branch", sortable: false },
    { title: "Rubro", key: "rubro", sortable: false },
    { title: "Subrubro", key: "subrubro", sortable: false },
    { title: "Stock", key: "stock", sortable: false, align: "end" },
    { title: "", key: "actions", sortable: false, align: "end" },
  ];

  // si no es admin, igual mostramos sucursal (ya viene) porque inventario admin/gestion.
  return base;
});

/** Normalización rubro/subrubro */
const normalizedAll = computed(() => {
  return (allItems.value || []).map((x) => {
    // tus asociaciones suelen ser: x.category.name y x.category.parent.name
    const rubroName =
      x?.category?.parent?.name ||
      x?.parent_category?.name ||
      x?.rubro ||
      null;

    const subName =
      x?.category?.name ||
      x?.subcategory?.name ||
      x?.sub_rubro ||
      x?.subrubro ||
      null;

    // IDs reales para filtrar (si existen)
    const pid = Number(x?.parent_category_id || x?.category?.parent?.id || 0) || null;
    const cid = Number(x?.category_id || x?.category?.id || 0) || null;

    return {
      ...x,
      parent_category_id: pid ?? x?.parent_category_id ?? null,
      category_id: cid ?? x?.category_id ?? null,
      rubro: rubroName ? cleanCatName(rubroName) : null,
      subrubro: subName ? cleanCatName(subName) : null,
    };
  });
});

/** items rubro/subrubro para selects */
const rubroItems = computed(() => {
  const map = new Map();
  for (const it of normalizedAll.value) {
    const pid = Number(it?.parent_category_id || 0);
    const name = it?.rubro || null;
    if (pid && name) map.set(pid, name);
  }
  const out = Array.from(map.entries())
    .map(([value, title]) => ({ value, title }))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  return out;
});

const subrubroItems = computed(() => {
  const pid = Number(rubroId.value || 0);
  if (!pid) return [];

  const map = new Map();
  for (const it of normalizedAll.value) {
    const itPid = Number(it?.parent_category_id || 0);
    if (itPid !== pid) continue;
    const cid = Number(it?.category_id || 0);
    const title = it?.subrubro || null;
    if (cid && title) map.set(cid, title);
  }
  const out = Array.from(map.entries())
    .map(([value, title]) => ({ value, title }))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));
  return out;
});

function onRubroChange() {
  subrubroId.value = null;
  page.value = 1;
}

/** branches dropdown */
const branchItems = computed(() => {
  const set = new Set();
  for (const it of normalizedAll.value) {
    if (it?.branch_id) set.add(Number(it.branch_id));
  }
  const out = [{ title: "Todas", value: null }];
  Array.from(set)
    .sort((a, b) => a - b)
    .forEach((id) => out.push({ title: branchName(id), value: id }));
  return out;
});

/** chips */
const chips = computed(() => {
  const out = [];
  if (q.value?.trim()) out.push({ key: "q", label: `Buscar: ${q.value}`, onClose: () => (q.value = "") });

  if (isAdmin.value && branchId.value) out.push({
    key: "branch",
    label: `Sucursal: ${branchName(branchId.value)}`,
    onClose: () => (branchId.value = null),
  });

  if (rubroId.value) {
    const r = rubroItems.value.find((x) => Number(x.value) === Number(rubroId.value));
    out.push({ key: "rubro", label: `Rubro: ${r?.title || rubroId.value}`, onClose: () => (rubroId.value = null) });
  }

  if (subrubroId.value) {
    const s = subrubroItems.value.find((x) => Number(x.value) === Number(subrubroId.value));
    out.push({ key: "sub", label: `Subrubro: ${s?.title || subrubroId.value}`, onClose: () => (subrubroId.value = null) });
  }

  if (stockMode.value !== "all") {
    const m = stockModes.find((x) => x.value === stockMode.value);
    out.push({ key: "stock", label: `Stock: ${m?.title || stockMode.value}`, onClose: () => (stockMode.value = "all") });
  }

  if (advanced.value) {
    if (pricePresence.value !== "all") {
      const p = pricePresenceItems.find((x) => x.value === pricePresence.value);
      out.push({ key: "pp", label: `Precio: ${p?.title}`, onClose: () => (pricePresence.value = "all") });
    }
    if (toMaybeNumber(priceMin.value) !== null) out.push({ key: "pmin", label: `Precio mín: ${priceMin.value}`, onClose: () => (priceMin.value = "") });
    if (toMaybeNumber(priceMax.value) !== null) out.push({ key: "pmax", label: `Precio máx: ${priceMax.value}`, onClose: () => (priceMax.value = "") });

    if (imagesMode.value !== "all") {
      const im = imagesModeItems.find((x) => x.value === imagesMode.value);
      out.push({ key: "img", label: `Imágenes: ${im?.title}`, onClose: () => (imagesMode.value = "all") });
    }

    if (missing.value?.length) out.push({
      key: "missing",
      label: `Faltantes: ${missing.value.join(", ")}`,
      onClose: () => (missing.value = []),
    });
  }

  return out;
});

/** filtro principal (inactivos SIEMPRE fuera) */
const filteredAll = computed(() => {
  const pmin = toMaybeNumber(priceMin.value);
  const pmax = toMaybeNumber(priceMax.value);

  return normalizedAll.value.filter((it) => {
    // invisible si inactivo
    if (it?.is_active === false || Number(it?.is_active) === 0) return false;

    // branch (solo admin)
    if (isAdmin.value && branchId.value && Number(it.branch_id) !== Number(branchId.value)) return false;

    // rubro/sub
    if (rubroId.value && Number(it.parent_category_id || 0) !== Number(rubroId.value)) return false;
    if (subrubroId.value && Number(it.category_id || 0) !== Number(subrubroId.value)) return false;

    // stock
    if (stockMode.value !== "all") {
      const s = stockNumber(it);
      if (stockMode.value === "missing" && s !== null) return false;
      if (stockMode.value !== "missing" && s === null) return false;
      if (stockMode.value === "gt0" && !(s > 0)) return false;
      if (stockMode.value === "eq0" && !(s === 0)) return false;
      if (stockMode.value === "lt0" && !(s < 0)) return false;
    }

    // precio presencia + rango (precio lista)
    const pl = priceListNumber(it);
    if (pricePresence.value === "with" && !(pl > 0)) return false;
    if (pricePresence.value === "without" && !(pl <= 0)) return false;

    if (pmin !== null && pl < pmin) return false;
    if (pmax !== null && pl > pmax) return false;

    // imágenes
    if (imagesMode.value !== "all") {
      const has = hasImagesSync(it); // true/false/null
      // si no sabemos aún, lo dejamos pasar; cuando cachee, se ajusta solo
      if (has !== null) {
        if (imagesMode.value === "with" && has !== true) return false;
        if (imagesMode.value === "without" && has !== false) return false;
      }
    }

    // faltantes
    if (missing.value?.length) {
      for (const m of missing.value) {
        if (m === "category" && it.parent_category_id) return false;
        if (m === "subcategory" && it.category_id) return false;
        if (m === "brand" && String(it.brand || "").trim()) return false;
        if (m === "model" && String(it.model || "").trim()) return false;
        if (m === "price_list" && priceListNumber(it) > 0) return false;
      }
    }

    return true;
  });
});

const filteredCount = computed(() => filteredAll.value.length);

/** paginación real según filtrado */
const pages = computed(() => Math.max(1, Math.ceil(filteredAll.value.length / pageSize)));

watch(pages, (p) => {
  if (page.value > p) page.value = p;
});

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredAll.value.slice(start, start + pageSize);
});

/** cuando cambia página o filtro de imágenes, prefetch para la página visible */
watch(
  () => [imagesMode.value, page.value, filteredCount.value],
  async () => {
    if (imagesMode.value === "all") return;
    await prefetchImagesForItems(pagedRows.value);
  },
  { immediate: true }
);

/** Load ALL list (para que la paginación sea coherente al filtrar) */
async function loadAll() {
  if (!auth.isAuthed) return;

  loadingAll.value = true;
  try {
    allItems.value = [];
    imagesCountCache.value = new Map();
    selectedIds.value = [];
    page.value = 1;

    // si tu endpoint soporta limit grande, intentamos 1000
    const LIMIT = 1000;
    let p = 1;
    let pagesServer = 1;

    do {
      await products.fetchList({ q: q.value, page: p, limit: LIMIT });

      const items = Array.isArray(products.items) ? products.items : [];
      const totalPages = Number(products.pages || 1) || 1;

      if (p === 1) pagesServer = totalPages;

      allItems.value = allItems.value.concat(items);

      p++;
    } while (p <= pagesServer && p < 50); // safety

    // branches (si existe endpoint)
    if (!branchesLoaded.value) await loadBranchesSafe();
  } finally {
    loadingAll.value = false;
  }
}

/** branches safe */
async function loadBranchesSafe() {
  branchesLoaded.value = true;
  try {
    if (typeof products.fetchBranches === "function") {
      const arr = await products.fetchBranches();
      branches.value = Array.isArray(arr) ? arr : [];
    } else {
      branches.value = [];
    }
  } catch {
    branches.value = [];
  }
}

/** actions */
function openDetails(id) {
  selectedId.value = Number(id);
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
  snack.value = { show: true, text: "Guardado OK" };
  await loadAll();
}
async function afterDeleted() {
  snack.value = { show: true, text: "Actualizado" };
  await loadAll();
}

async function search() {
  await loadAll();
}

async function clear() {
  q.value = "";
  branchId.value = null;
  rubroId.value = null;
  subrubroId.value = null;
  stockMode.value = "all";
  pricePresence.value = "all";
  priceMin.value = "";
  priceMax.value = "";
  imagesMode.value = "all";
  missing.value = [];
  advanced.value = false;

  await loadAll();
}

/** inactivate/delete */
function askInactivate(item) {
  inactiveItem.value = item;
  inactiveOpen.value = true;
}

async function doInactivate() {
  const it = inactiveItem.value;
  if (!it?.id) return;

  try {
    const updated = await products.update(Number(it.id), { is_active: false });
    if (!updated?.id && products.error) throw new Error(products.error);
    snack.value = { show: true, text: "Producto inactivado" };
    inactiveOpen.value = false;
    inactiveItem.value = null;
    await loadAll();
  } catch (e) {
    snack.value = { show: true, text: e?.message || "No se pudo inactivar" };
  }
}

function askDelete(item) {
  deleteItem.value = item;
  deleteOpen.value = true;
}

async function doDelete() {
  const it = deleteItem.value;
  if (!it?.id) return;

  try {
    const ok = await products.remove(Number(it.id));
    if (!ok) throw new Error(products.error || "No se pudo eliminar");
    snack.value = { show: true, text: "Producto eliminado" };
  } catch (e) {
    // fallback por FK: inactivar
    try {
      const updated = await products.update(Number(it.id), { is_active: false });
      if (!updated?.id && products.error) throw new Error(products.error);
      snack.value = { show: true, text: "No se pudo borrar (FK). Se inactivó." };
    } catch (e2) {
      snack.value = { show: true, text: e2?.message || e?.message || "No se pudo eliminar" };
    }
  } finally {
    deleteOpen.value = false;
    deleteItem.value = null;
    await loadAll();
  }
}

/** bulk */
async function bulkInactivate() {
  const ids = (selectedIds.value || []).map((x) => Number(x)).filter((x) => x > 0);
  if (!ids.length) return;

  let ok = 0;
  for (const id of ids) {
    try {
      const updated = await products.update(id, { is_active: false });
      if (updated?.id) ok++;
    } catch {}
  }
  snack.value = { show: true, text: `Inactivados: ${ok}/${ids.length}` };
  selectedIds.value = [];
  await loadAll();
}

async function bulkDelete() {
  const ids = (selectedIds.value || []).map((x) => Number(x)).filter((x) => x > 0);
  if (!ids.length) return;

  let deleted = 0;
  let inactivated = 0;

  for (const id of ids) {
    try {
      const ok = await products.remove(id);
      if (ok) deleted++;
      else throw new Error(products.error || "DELETE_FAIL");
    } catch {
      try {
        const updated = await products.update(id, { is_active: false });
        if (updated?.id) inactivated++;
      } catch {}
    }
  }

  snack.value = { show: true, text: `Eliminados: ${deleted} · Inactivados (fallback): ${inactivated}` };
  selectedIds.value = [];
  await loadAll();
}

onMounted(async () => {
  await loadAll();
});

watch(
  () => auth.isAuthed,
  async (v) => {
    if (v) await loadAll();
  },
  { immediate: true }
);
</script>

<style scoped>
.pos-table :deep(th) {
  font-weight: 800;
}
</style>
