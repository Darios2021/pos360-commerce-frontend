<!-- src/modules/products/pages/ProductsListPage.vue -->

<template>
  <div class="plp">

    <!-- TOP BAR -->
    <div class="plp-top">
      <div class="plp-top-left">
        <div class="plp-title">Productos</div>
        <div class="plp-meta">{{ meta.total.toLocaleString('es') }} productos · Pág. {{ meta.page }}/{{ meta.pages || 1 }}</div>
      </div>
      <div class="plp-top-right">
        <v-btn v-if="selectedIds.length" :color="isAdmin ? 'error' : 'warning'" variant="tonal" size="small" rounded="lg"
          :prepend-icon="isAdmin ? 'mdi-delete-outline' : 'mdi-eye-off-outline'" @click="bulkDisableOrDelete">
          {{ isAdmin ? 'Eliminar' : 'Inactivar' }} ({{ selectedIds.length }})
        </v-btn>
        <v-btn-toggle v-model="viewMode" mandatory density="compact" rounded="lg" class="plp-view-toggle" v-if="smAndUp">
          <v-btn value="grid" size="small"><v-icon size="18">mdi-view-grid-outline</v-icon></v-btn>
          <v-btn value="list" size="small"><v-icon size="18">mdi-format-list-bulleted</v-icon></v-btn>
        </v-btn-toggle>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate" rounded="lg" size="small">
          Nuevo
        </v-btn>
      </div>
    </div>

    <!-- SEARCH + FILTER TOGGLE -->
    <div class="plp-searchbar">
      <v-text-field v-model="f.q" placeholder="Buscar por nombre, SKU, marca, modelo..." variant="outlined"
        density="compact" hide-details clearable prepend-inner-icon="mdi-magnify" class="plp-search-input"
        @input="debouncedSearch" @click:clear="clearSearch" @keyup.enter="applyFilters" />
      <v-btn :variant="filtersOpen ? 'flat' : 'tonal'" :color="activeFiltersCount > 0 ? 'primary' : undefined"
        density="compact" rounded="lg" class="plp-filter-btn" @click="filtersOpen = !filtersOpen">
        <v-icon start size="16">{{ filtersOpen ? 'mdi-filter-off' : 'mdi-filter-outline' }}</v-icon>
        Filtros
        <v-badge v-if="activeFiltersCount > 0" :content="String(activeFiltersCount)" color="primary" inline class="ml-1" />
      </v-btn>
    </div>

    <!-- ACTIVE CHIP ROW -->
    <div class="plp-chips" v-if="activeFilterChips.length">
      <v-chip v-for="chip in activeFilterChips" :key="chip.key" size="small" closable variant="tonal"
        color="primary" class="plp-chip" @click:close="removeFilter(chip.key)">
        {{ chip.label }}
      </v-chip>
      <button class="plp-chip-clear" @click="clearFilters">Limpiar todo</button>
    </div>

    <!-- FILTER PANEL -->
    <v-expand-transition>
      <div v-if="filtersOpen" class="plp-filter-panel">
        <v-row dense>
          <v-col v-if="isAdmin" cols="12" sm="6" md="3">
            <v-select v-model="f.branch_id" :items="branchItems" item-title="title" item-value="value"
              label="Sucursal" variant="outlined" density="compact" hide-details clearable @update:modelValue="applyFilters" />
          </v-col>
          <v-col cols="12" sm="6" :md="isAdmin ? 3 : 4">
            <v-select v-model="f.category_id" :items="categoryItems" item-title="title" item-value="value"
              label="Rubro" variant="outlined" density="compact" hide-details clearable @update:modelValue="onCategoryChange" />
          </v-col>
          <v-col cols="12" sm="6" :md="isAdmin ? 3 : 4">
            <v-select v-model="f.subcategory_id" :items="subcategoryItems" item-title="title" item-value="value"
              label="Subrubro" variant="outlined" density="compact" hide-details clearable
              :disabled="!f.category_id" @update:modelValue="applyFilters" />
          </v-col>
          <v-col cols="12" sm="6" :md="isAdmin ? 3 : 4">
            <v-select v-model="f.status" :items="statusItems" item-title="title" item-value="value"
              label="Estado" variant="outlined" density="compact" hide-details @update:modelValue="applyFilters" />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-select v-model="f.stock" :items="stockItems" item-title="title" item-value="value"
              label="Stock" variant="outlined" density="compact" hide-details @update:modelValue="applyFilters" />
          </v-col>
          <v-col cols="12" sm="4" md="2">
            <v-select v-model="f.price_presence" :items="pricePresenceItems" item-title="title" item-value="value"
              label="Precio" variant="outlined" density="compact" hide-details @update:modelValue="applyFilters" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="f.price_min" label="Mín $" variant="outlined" density="compact"
              type="number" hide-details clearable @keyup.enter="applyFilters" @blur="applyFilters" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-text-field v-model="f.price_max" label="Máx $" variant="outlined" density="compact"
              type="number" hide-details clearable @keyup.enter="applyFilters" @blur="applyFilters" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="f.images" :items="imagesItems" item-title="title" item-value="value"
              label="Imágenes" variant="outlined" density="compact" hide-details @update:modelValue="applyFilters" />
          </v-col>
          <v-col cols="6" sm="4" md="2">
            <v-select v-model="limit" :items="[10,20,50,100]" label="Por pág." variant="outlined"
              density="compact" hide-details @update:modelValue="onLimitChange" />
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>

    <!-- ERROR -->
    <v-alert v-if="products.error" type="error" variant="tonal" class="mb-3" density="compact">{{ products.error }}</v-alert>

    <!-- SKELETON -->
    <div v-if="loading && !items.length" class="plp-skeleton-grid">
      <div v-for="n in 8" :key="n" class="plp-skeleton-card" />
    </div>

    <!-- EMPTY -->
    <div v-else-if="!loading && !items.length" class="plp-empty">
      <v-icon size="52" color="medium-emphasis">mdi-package-variant-closed</v-icon>
      <div class="plp-empty-title">Sin resultados</div>
      <div class="plp-empty-sub">Probá con otros filtros o creá un nuevo producto</div>
      <div class="d-flex ga-2 mt-4">
        <v-btn variant="tonal" rounded="lg" @click="clearFilters">Limpiar filtros</v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" @click="openCreate">Nuevo producto</v-btn>
      </div>
    </div>

    <!-- GRID VIEW (estilo PosProductRow) -->
    <div v-else-if="viewMode === 'grid' || !smAndUp" class="plp-grid" :class="{ 'plp-grid--loading': loading }">
      <div v-for="item in items" :key="item.id" class="plp-card"
        :class="{ 'plp-card--inactive': isInactive(item) }" @click="openView(item.id)">

        <!-- Imagen cuadrada arriba con badges flotantes -->
        <div class="plp-card-media">
          <img v-if="getProductImage(item)" :src="getProductImage(item)" :alt="item.name" class="plp-card-img" />
          <div v-else class="plp-card-noimg">
            <v-icon size="38">mdi-package-variant-closed</v-icon>
          </div>

          <!-- Badge stock semáforo arriba-izq -->
          <span
            class="plp-stock-badge"
            :class="stockLevelClass(item)"
            :title="getStockLabel(item)"
          >
            <v-icon size="12">
              {{ getStockQty(item) > 0 ? 'mdi-package-variant-closed' : 'mdi-close-circle' }}
            </v-icon>
            {{ getStockQty(item) }}
          </span>

          <!-- Checkbox de selección arriba-der -->
          <div class="plp-card-check" @click.stop>
            <v-checkbox-btn :model-value="selectedIds.includes(item.id)" @update:modelValue="toggleSelect(item.id)"
              density="compact" hide-details />
          </div>

          <!-- Badge inactivo -->
          <span v-if="isInactive(item)" class="plp-inactive-badge">Inactivo</span>
        </div>

        <!-- Info compacta -->
        <div class="plp-card-info">
          <div class="plp-card-name" :title="item.name">{{ item.name }}</div>

          <div v-if="item.sku || item.code" class="plp-card-sku">
            <v-icon size="11">mdi-barcode</v-icon>
            <span>{{ item.sku || item.code }}</span>
          </div>

          <div v-if="item.brand || item.model || item.category?.name || item.rubro" class="plp-card-meta">
            <span v-if="item.brand" class="meta-chip meta-chip--brand">{{ item.brand }}</span>
            <span v-if="item.model" class="meta-chip meta-chip--muted">{{ item.model }}</span>
            <span v-if="item.category?.name || item.rubro" class="meta-chip meta-chip--cat">
              {{ item.category?.name || item.rubro }}
            </span>
          </div>

          <!-- Sucursales como mini chips -->
          <div v-if="enabledBranches(item).length || Number(item.branch_id || 0) > 0" class="plp-card-branches">
            <template v-if="enabledBranches(item).length">
              <span
                v-for="(b,i) in visibleBranches(enabledBranches(item))"
                :key="`${item.id}-b${b.id}-${i}`"
                class="plp-br-pill"
                :style="{ '--br-color': branchCssColor(b.id) }"
              >
                <v-icon size="10">mdi-store-outline</v-icon>
                {{ branchInitials(b.name) }}
              </span>
              <span v-if="hiddenBranchesCount(enabledBranches(item)) > 0" class="plp-br-pill plp-br-pill--more">
                +{{ hiddenBranchesCount(enabledBranches(item)) }}
              </span>
            </template>
            <span v-else class="plp-br-pill" :style="{ '--br-color': branchCssColor(item.branch_id) }">
              <v-icon size="10">mdi-store-outline</v-icon>
              {{ branchInitials(branchName(item.branch_id)) }}
            </span>
          </div>

          <!-- Footer: precio + acciones -->
          <div class="plp-card-footer">
            <div class="plp-card-price" v-if="Number(item.price_list) > 0">
              {{ fmtPrice(item.price_list) }}
            </div>
            <div class="plp-card-price plp-card-price--none" v-else>
              Sin precio
            </div>

            <div class="plp-card-actions" @click.stop>
              <v-btn icon size="x-small" variant="text" title="Ver" @click.stop="openView(item.id)">
                <v-icon size="16">mdi-eye-outline</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" title="Editar" @click.stop="openEdit(item.id)">
                <v-icon size="16">mdi-pencil-outline</v-icon>
              </v-btn>
              <v-menu location="bottom end" :close-on-content-click="true">
                <template #activator="{ props }">
                  <v-btn v-bind="props" icon size="x-small" variant="text" @click.stop>
                    <v-icon size="16">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact" min-width="160">
                  <v-list-item @click="openEdit(item.id)">
                    <template #prepend><v-icon size="16">mdi-pencil-outline</v-icon></template>
                    <v-list-item-title>Editar</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item v-if="!isAdmin" @click="askDisable(item)">
                    <template #prepend><v-icon size="16">mdi-eye-off-outline</v-icon></template>
                    <v-list-item-title>Inactivar</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-else @click="askDelete(item)">
                    <template #prepend><v-icon size="16" color="error">mdi-delete-outline</v-icon></template>
                    <v-list-item-title class="text-error">Eliminar</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- LIST VIEW -->
    <div v-else class="plp-list-wrap" :class="{ 'plp-list--loading': loading }">
      <div class="plp-list-head">
        <div class="plp-lh-check">
          <v-checkbox-btn :model-value="allSelected" @update:modelValue="toggleSelectAll" density="compact" hide-details />
        </div>
        <div class="plp-lh-name">Nombre</div>
        <div class="plp-lh-cat">Rubro · Subrubro</div>
        <div class="plp-lh-branches">Sucursales</div>
        <div class="plp-lh-price">Precio</div>
        <div class="plp-lh-stock">Stock</div>
        <div class="plp-lh-actions"></div>
      </div>
      <div v-for="item in items" :key="item.id" class="plp-list-row"
        :class="{ 'plp-list-row--inactive': isInactive(item) }" @click="openView(item.id)">
        <div class="plp-lh-check" @click.stop>
          <v-checkbox-btn :model-value="selectedIds.includes(item.id)" @update:modelValue="toggleSelect(item.id)"
            density="compact" hide-details />
        </div>
        <div class="plp-row-name">
          <div class="plp-row-name-text">{{ item.name }}</div>
          <div class="plp-row-sku" v-if="item.sku || item.brand">{{ item.sku || '' }}{{ item.sku && item.brand ? ' · ' : '' }}{{ item.brand || '' }}</div>
        </div>
        <div class="plp-row-cat">
          <span class="plp-tag plp-tag--cat" v-if="item.category?.name || item.rubro">{{ item.category?.name || item.rubro }}</span>
          <span class="plp-tag plp-tag--sub" v-if="item.subcategory?.name || item.subrubro">{{ item.subcategory?.name || item.subrubro }}</span>
        </div>
        <div class="plp-row-branches">
          <template v-if="enabledBranches(item).length">
            <v-chip v-for="(b,i) in visibleBranches(enabledBranches(item))" :key="`${item.id}-r${b.id}-${i}`"
              size="x-small" variant="tonal" :color="branchColor(b.id)" label class="plp-br-chip">
              {{ branchInitials(b.name) }}
            </v-chip>
            <span v-if="hiddenBranchesCount(enabledBranches(item)) > 0" class="plp-more">+{{ hiddenBranchesCount(enabledBranches(item)) }}</span>
          </template>
          <template v-else-if="Number(item.branch_id || 0) > 0">
            <v-chip size="x-small" variant="tonal" :color="branchColor(item.branch_id)" label class="plp-br-chip">
              {{ branchInitials(branchName(item.branch_id)) }}
            </v-chip>
          </template>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </div>
        <div class="plp-row-price">
          <span v-if="Number(item.price_list) > 0" class="plp-price-val">${{ fmtPrice(item.price_list) }}</span>
          <span v-else class="text-medium-emphasis text-caption">—</span>
        </div>
        <div class="plp-row-stock" :class="getStockClass(item)">
          <span class="st-dot" /><span>{{ getStockLabel(item) }}</span>
        </div>
        <div class="plp-row-actions" @click.stop>
          <v-btn icon size="x-small" variant="text" @click.stop="openView(item.id)"><v-icon size="16">mdi-eye-outline</v-icon></v-btn>
          <v-menu location="bottom end" :close-on-content-click="true">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon size="x-small" variant="text" @click.stop><v-icon size="16">mdi-dots-vertical</v-icon></v-btn>
            </template>
            <v-list density="compact" min-width="160">
              <v-list-item @click="openEdit(item.id)">
                <template #prepend><v-icon size="16">mdi-pencil-outline</v-icon></template>
                <v-list-item-title>Editar</v-list-item-title>
              </v-list-item>
              <v-divider />
              <v-list-item v-if="!isAdmin" @click="askDisable(item)">
                <template #prepend><v-icon size="16">mdi-eye-off-outline</v-icon></template>
                <v-list-item-title>Inactivar</v-list-item-title>
              </v-list-item>
              <v-list-item v-else @click="askDelete(item)">
                <template #prepend><v-icon size="16" color="error">mdi-delete-outline</v-icon></template>
                <v-list-item-title class="text-error">Eliminar</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </div>
    </div>

    <!-- PAGINATION -->
    <div class="plp-pagination" v-if="meta.total > 0">
      <span class="plp-pag-info">{{ items.length }} de {{ meta.total }}</span>
      <v-pagination v-model="page" :length="meta.pages || 1" :total-visible="smAndUp ? 7 : 4"
        rounded="lg" @update:modelValue="fetchNow" size="small" />
    </div>

    <!-- Dialogs -->
    <v-dialog v-model="disableOpen" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold pt-5 px-5">Inactivar producto</v-card-title>
        <v-card-text class="px-5">¿Inactivar <b>{{ disableItem?.name }}</b>?
          <div class="text-caption text-medium-emphasis mt-1">Se oculta del catálogo y del POS. No se borra.</div>
        </v-card-text>
        <v-card-actions class="justify-end px-5 pb-5">
          <v-btn variant="tonal" @click="disableOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="warning" variant="flat" rounded="lg" @click="doDisable" :loading="products.loading">Inactivar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="460">
      <v-card rounded="xl">
        <v-card-title class="font-weight-bold pt-5 px-5">Eliminar producto</v-card-title>
        <v-card-text class="px-5">¿Eliminar <b>{{ deleteItem?.name }}</b>?
          <div class="text-caption text-medium-emphasis mt-1">Si tiene ventas relacionadas, se inactiva automáticamente.</div>
        </v-card-text>
        <v-card-actions class="justify-end px-5 pb-5">
          <v-btn variant="tonal" @click="deleteOpen = false" :disabled="products.loading">Cancelar</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="doDelete" :loading="products.loading">Eliminar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500" location="bottom right" rounded="lg">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDisplay } from "vuetify";
import { useProductsStore } from "@/app/store/products.store";
import { useAuthStore } from "@/app/store/auth.store";
import { useCategoriesStore } from "@/app/store/categories.store";

const router = useRouter();
const products = useProductsStore();
const auth = useAuthStore();
const categories = useCategoriesStore();
const { smAndUp } = useDisplay();

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
  status: isAdmin.value ? "all" : "active", // admin ve TODO por defecto
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
  if (!isAdmin.value) {
    return [
      { title: "Activos", value: "active" },
      { title: "Inactivos", value: "inactive" },
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

    // Estado -> backend
    // all => include_inactive=1
    // inactive => is_active=0
    // active => (no mandamos nada, backend default is_active=1)
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
function openEdit(id) {
  const pid = Number(id || 0);
  if (!pid || !auth.isAuthed) return;
  router.push({ name: "productEdit", params: { id: pid } });
}
function openCreate() {
  router.push({ name: "productNew" });
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
  let needRefetch = false;
  try {
    const r = await callRemoveProduct(id);
    if (r.ok) {
      // store.remove() already removed the item from products.items locally.
      // Calling fetchNow() here would re-add soft-deleted items when admin
      // has include_inactive=1 active (default "all" status filter).
      toast("Producto eliminado");
      return;
    }
    if (String(r.code || "").toUpperCase() === "FK_CONSTRAINT") {
      const updated = await products.update(id, { is_active: false });
      if (!updated?.id) throw new Error(products.error || "No se pudo inactivar (fallback FK)");
      toast("No se pudo borrar (FK). Se inactivó.");
      needRefetch = true;
      return;
    }
    throw new Error(r.message || products.error || "No se pudo eliminar");
  } catch (e) {
    toast(e?.message || "No se pudo eliminar");
    needRefetch = true;
  } finally {
    deleteOpen.value = false;
    deleteItem.value = null;
    if (needRefetch) await fetchNow();
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

/* ── NEW UI HELPERS ── */
const viewMode = ref('grid'); // 'grid' | 'list'
const filtersOpen = ref(false);
let _searchTimer = null;
function debouncedSearch() { clearTimeout(_searchTimer); _searchTimer = setTimeout(() => applyFilters(), 400); }
function clearSearch() { f.value.q = ''; applyFilters(); }

const activeFiltersCount = computed(() => {
  let n = 0;
  if (f.value.branch_id) n++;
  if (f.value.category_id) n++;
  if (f.value.subcategory_id) n++;
  if (f.value.stock !== 'all') n++;
  if (f.value.price_presence !== 'all') n++;
  if (f.value.images !== 'all') n++;
  if (f.value.price_min) n++;
  if (f.value.price_max) n++;
  const defStatus = isAdmin.value ? 'all' : 'active';
  if (f.value.status !== defStatus) n++;
  return n;
});

const activeFilterChips = computed(() => {
  const chips = [];
  if (f.value.branch_id) { const b = branchItems.value.find(x => x.value === f.value.branch_id); chips.push({ key: 'branch_id', label: `Sucursal: ${b?.title || f.value.branch_id}` }); }
  if (f.value.category_id) { const c = categoryItems.value.find(x => x.value === f.value.category_id); chips.push({ key: 'category_id', label: `Rubro: ${c?.title || f.value.category_id}` }); }
  if (f.value.subcategory_id) { const s = subcategoryItems.value.find(x => x.value === f.value.subcategory_id); chips.push({ key: 'subcategory_id', label: `Subrubro: ${s?.title || f.value.subcategory_id}` }); }
  if (f.value.stock !== 'all') chips.push({ key: 'stock', label: stockItems.find(x => x.value === f.value.stock)?.title });
  if (f.value.price_presence !== 'all') chips.push({ key: 'price_presence', label: pricePresenceItems.find(x => x.value === f.value.price_presence)?.title });
  if (f.value.images !== 'all') chips.push({ key: 'images', label: imagesItems.find(x => x.value === f.value.images)?.title });
  if (f.value.price_min) chips.push({ key: 'price_min', label: `Mín $${f.value.price_min}` });
  if (f.value.price_max) chips.push({ key: 'price_max', label: `Máx $${f.value.price_max}` });
  const defStatus = isAdmin.value ? 'all' : 'active';
  if (f.value.status !== defStatus) { const s = statusItems.value.find(x => x.value === f.value.status); chips.push({ key: 'status', label: s?.title }); }
  return chips.filter(c => c.label);
});

function removeFilter(key) {
  const defaults = { branch_id: null, category_id: null, subcategory_id: null, stock: 'all', price_presence: 'all', images: 'all', price_min: null, price_max: null, status: isAdmin.value ? 'all' : 'active' };
  f.value[key] = defaults[key];
  if (key === 'category_id') f.value.subcategory_id = null;
  applyFilters();
}

function toggleSelect(id) {
  const idx = selectedIds.value.indexOf(id);
  if (idx >= 0) selectedIds.value.splice(idx, 1);
  else selectedIds.value.push(id);
}

const allSelected = computed(() => items.value.length > 0 && items.value.every(it => selectedIds.value.includes(it.id)));
function toggleSelectAll(val) { selectedIds.value = val ? items.value.map(it => it.id) : []; }

const CAT_COLORS = ['#6366f1','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4'];
function getCategoryColor(item) { const id = Number(item?.category_id || 0); return id ? CAT_COLORS[id % CAT_COLORS.length] : '#6b7280'; }

function getProductImage(item) {
  const imgs = item?.images;
  if (Array.isArray(imgs) && imgs.length) { const f = imgs[0]; return typeof f === 'string' ? f : f?.url || f?.thumbnail || null; }
  return item?.thumbnail || item?.image_url || item?.image || null;
}

function fmtPrice(v) { const n = Number(v||0); if(!n) return '—'; return new Intl.NumberFormat('es-AR').format(Math.round(n)); }

function getStockClass(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? -1);
  if (qty < 0) return 'st-unknown'; if (qty === 0) return 'st-zero'; return 'st-ok';
}
function getStockLabel(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? -1);
  if (qty < 0) return '—'; if (qty === 0) return 'Sin stock'; return `${qty} uds`;
}
function getStockQty(item) {
  const qty = Number(item?.stock_total ?? item?.stock_qty ?? item?.stock ?? item?.qty ?? 0);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}
// Semáforo de stock: >10 verde, 5-10 amarillo, <5 rojo, 0 rojo
function stockLevelClass(item) {
  const n = getStockQty(item);
  if (n <= 0) return 'level-out';
  if (n < 5) return 'level-low';
  if (n <= 10) return 'level-mid';
  return 'level-high';
}
// Devuelve un color CSS concreto (no token de Vuetify) para usar en --br-color
function branchCssColor(id) {
  const bid = Number(id || 0);
  if (bid === 1) return 'rgb(var(--v-theme-primary))';
  if (bid === 2) return '#16a34a';
  if (bid === 3) return '#7c3aed';
  return '#6b7280';
}
</script>

<style scoped>
/* root */
.plp { display: flex; flex-direction: column; gap: 12px; min-width: 0; }

/* TOP BAR */
.plp-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.plp-top-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.plp-title { font-size: 22px; font-weight: 900; line-height: 1.1; }
.plp-meta { font-size: 12px; opacity: 0.5; margin-top: 2px; }
.plp-view-toggle { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

/* SEARCH BAR */
.plp-searchbar { display: flex; gap: 8px; align-items: center; }
.plp-search-input { flex: 1; }
.plp-filter-btn { height: 40px !important; flex-shrink: 0; }

/* CHIPS */
.plp-chips { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.plp-chip { font-size: 11px !important; }
.plp-chip-clear { font-size: 11px; opacity: 0.5; background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 6px; color: inherit; }
.plp-chip-clear:hover { opacity: 0.9; }

/* FILTER PANEL */
.plp-filter-panel {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

/* SKELETON */
.plp-skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
.plp-skeleton-card { height: 240px; border-radius: 14px; background: rgba(var(--v-theme-on-surface), 0.06); animation: plp-pulse 1.4s ease infinite; }
@keyframes plp-pulse { 0%,100%{ opacity:.5 } 50%{ opacity:1 } }

/* EMPTY */
.plp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; gap: 8px; text-align: center; }
.plp-empty-title { font-size: 17px; font-weight: 800; }
.plp-empty-sub { font-size: 13px; opacity: 0.5; }

/* GRID — compacto estilo PosProductRow */
.plp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  transition: opacity 0.2s;
}
.plp-grid--loading { opacity: 0.5; pointer-events: none; }

/* CARD */
.plp-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: 12px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease,
    transform 0.14s ease;
}
.plp-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.45);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.plp-card--inactive { opacity: 0.6; }

/* ─── Media (imagen cuadrada + badges flotantes) ─────────── */
.plp-card-media {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  overflow: hidden;
}

.plp-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.plp-card-noimg {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.3);
}

/* Badge de stock flotante (semáforo) */
.plp-stock-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 8px;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  line-height: 1.2;
  font-feature-settings: "tnum";
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.22);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  z-index: 2;
}
.plp-stock-badge.level-high  { background: rgb(var(--v-theme-success)); }
.plp-stock-badge.level-mid   { background: rgb(var(--v-theme-warning)); }
.plp-stock-badge.level-low,
.plp-stock-badge.level-out   { background: rgb(var(--v-theme-error)); }

/* Checkbox flotante arriba-derecha */
.plp-card-check {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 6px;
  backdrop-filter: blur(4px);
  padding: 2px;
}

/* Badge inactivo */
.plp-inactive-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-error), 0.9);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.24);
  z-index: 2;
}

/* ─── Info debajo de la imagen ──────────────────────────── */
.plp-card-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 10px 10px;
  flex: 1 1 auto;
  min-height: 0;
}

.plp-card-name {
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.005em;
  color: rgb(var(--v-theme-on-surface));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
  min-height: 2.4em;
}

.plp-card-sku {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.16);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10.5px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.75);
  letter-spacing: 0.02em;
  width: fit-content;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plp-card-sku :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: 0.8;
  flex-shrink: 0;
}

.plp-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.01em;
  text-transform: uppercase;
  line-height: 1.4;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-chip--brand {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.meta-chip--muted {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.72);
  text-transform: none;
}

.meta-chip--cat {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.62);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  text-transform: none;
}

/* Sucursales como pills compactas */
.plp-card-branches {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.plp-br-pill {
  --br-color: rgb(var(--v-theme-primary));
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px 1px 4px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--br-color) 14%, transparent);
  color: var(--br-color);
  font-size: 9.5px;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1.4;
  white-space: nowrap;
}

.plp-br-pill :deep(.v-icon) {
  opacity: 0.72;
}

.plp-br-pill--more {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

/* Footer: precio + acciones */
.plp-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
  padding-top: 4px;
}

.plp-card-price {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-success));
  font-feature-settings: "tnum";
}

.plp-card-price::before {
  content: "$ ";
  opacity: 0.72;
  font-weight: 700;
}

.plp-card-price--none {
  font-size: 11px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-style: italic;
}

.plp-card-price--none::before {
  content: "";
}

.plp-card-actions {
  display: flex;
  align-items: center;
  gap: 0;
  flex-shrink: 0;
}

.plp-card-actions :deep(.v-btn) {
  width: 26px !important;
  height: 26px !important;
  min-width: 26px !important;
}

/* STOCK DOT */
.st-dot { width: 7px; height: 7px; border-radius: 999px; flex-shrink: 0; }
.st-ok .st-dot { background: rgb(var(--v-theme-success)); }
.st-zero .st-dot { background: rgba(var(--v-theme-on-surface), 0.25); }
.st-unknown .st-dot { background: rgba(var(--v-theme-on-surface), 0.15); }
.st-ok { color: rgb(var(--v-theme-success)); }
.st-zero { opacity: 0.5; }
.st-unknown { opacity: 0.35; }

/* LIST VIEW */
.plp-list-wrap { border-radius: 12px; overflow: hidden; border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); background: rgb(var(--v-theme-surface)); }
.plp-list--loading { opacity: 0.5; pointer-events: none; }
.plp-list-head, .plp-list-row { display: grid; align-items: center; gap: 8px; padding: 10px 14px; }
.plp-list-head { grid-template-columns: 32px 1fr 180px 140px 90px 80px 64px; background: rgba(var(--v-theme-surface-variant), 0.4); border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; }
.plp-list-row { grid-template-columns: 32px 1fr 180px 140px 90px 80px 64px; cursor: pointer; border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.6)); transition: background 0.12s; }
.plp-list-row:last-child { border-bottom: none; }
.plp-list-row:hover { background: rgba(var(--v-theme-on-surface), 0.035); }
.plp-list-row--inactive { opacity: 0.5; }

.plp-lh-check { display: flex; align-items: center; justify-content: center; }
.plp-lh-name,.plp-row-name { min-width: 0; }
.plp-row-name-text { font-size: 13px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.plp-row-sku { font-size: 10px; opacity: 0.45; font-family: monospace; }
.plp-row-cat { display: flex; flex-wrap: wrap; gap: 3px; min-width: 0; }
.plp-row-branches { display: flex; flex-wrap: wrap; gap: 3px; }
.plp-row-price .plp-price-val { font-size: 13px; font-weight: 800; color: rgb(var(--v-theme-success)); }
.plp-row-stock { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; }
.plp-row-actions { display: flex; align-items: center; justify-content: flex-end; gap: 0; }

/* LIST without admin branches */
.plp-list-head:not(:has(.plp-lh-branches)),
.plp-list-row:not(:has(.plp-row-branches)) {
  grid-template-columns: 32px 1fr 200px 100px 90px 64px;
}

/* PAGINATION */
.plp-pagination { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding-top: 4px; }
.plp-pag-info { font-size: 12px; opacity: 0.5; }

/* TABLET */
@media (max-width: 768px) {
  .plp-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
  .plp-list-head, .plp-list-row { grid-template-columns: 32px 1fr 120px 70px 64px; }
  .plp-lh-cat,.plp-row-cat { display: none; }
}

/* MOBILE */
@media (max-width: 480px) {
  .plp-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .plp-card-name { font-size: 12px; }
  .plp-card-price { font-size: 14px; }
  .plp-pagination { flex-direction: column; align-items: center; }
}

@media (max-width: 360px) {
  .plp-grid { grid-template-columns: 1fr; }
}
</style>
