<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1100"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="consulta-shell">
      <PosDialogHeader
        eyebrow="Consulta"
        title="Buscar por filtros"
        @close="closeDialog"
      >
        <template #chips>
          <v-chip
            v-if="filteredItems.length"
            size="small"
            variant="tonal"
            color="primary"
          >
            {{ filteredItems.length }} {{ filteredItems.length === 1 ? "producto" : "productos" }}
          </v-chip>
        </template>
      </PosDialogHeader>

      <v-divider />

      <v-card-text class="consulta-body">
        <div class="consulta-layout">
          <!-- COLUMNA IZQUIERDA: filtros -->
          <aside class="consulta-filters">
            <div class="filters-head">
              <div class="filters-title">
                <v-icon size="14">mdi-filter-variant</v-icon>
                Filtros
              </div>
              <button
                v-if="hasAnyFilter"
                type="button"
                class="filters-clear"
                @click="clearAllFilters"
              >
                Limpiar
              </button>
            </div>

            <v-text-field
              ref="searchInputRef"
              v-model="searchQuery"
              placeholder="Buscar por nombre…"
              density="comfortable"
              variant="outlined"
              clearable
              hide-details
              prepend-inner-icon="mdi-magnify"
              class="filter-input"
            />

            <label class="filter-field">
              <span class="filter-label">Categoría</span>
              <v-select
                v-model="selectedCategory"
                :items="categoryOptions"
                item-title="title"
                item-value="value"
                placeholder="Todas"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                :menu-props="{ maxHeight: 320 }"
              />
            </label>

            <label class="filter-field">
              <span class="filter-label">
                Subcategoría
                <span v-if="!selectedCategory" class="filter-label-hint">
                  · elegí rubro
                </span>
              </span>
              <v-select
                v-model="selectedSubcategory"
                :items="subcategoryOptions"
                item-title="title"
                item-value="value"
                placeholder="Todas"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                :disabled="!selectedCategory || !subcategoryOptions.length"
                :menu-props="{ maxHeight: 320 }"
              />
            </label>

            <label class="filter-field">
              <span class="filter-label">Marca</span>
              <v-select
                v-model="selectedBrand"
                :items="brandOptions"
                item-title="title"
                item-value="value"
                placeholder="Todas"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                :disabled="!brandOptions.length"
                :menu-props="{ maxHeight: 320 }"
              />
            </label>

            <label class="filter-field">
              <span class="filter-label">Modelo</span>
              <v-select
                v-model="selectedModel"
                :items="modelOptions"
                item-title="title"
                item-value="value"
                placeholder="Todos"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                :disabled="!modelOptions.length"
                :menu-props="{ maxHeight: 320 }"
              />
            </label>

            <button
              type="button"
              class="stock-toggle"
              :class="{ 'stock-toggle--on': onlyWithStock }"
              @click="onlyWithStock = !onlyWithStock"
            >
              <v-icon size="14">
                {{ onlyWithStock ? "mdi-check-circle" : "mdi-circle-outline" }}
              </v-icon>
              <span>Solo con stock</span>
            </button>
          </aside>

          <!-- COLUMNA DERECHA: resultados -->
          <section class="consulta-results">
            <div class="results-summary" v-if="hasAnyFilter || filteredItems.length">
              <span class="results-summary__count">
                <strong>{{ filteredItems.length }}</strong>
                {{ filteredItems.length === 1 ? "producto" : "productos" }}
              </span>
              <div class="results-summary__chips">
                <span v-if="selectedCategoryLabel" class="active-chip">
                  <v-icon size="11">mdi-shape-outline</v-icon>
                  {{ selectedCategoryLabel }}
                  <button type="button" @click="selectedCategory = null">
                    <v-icon size="10">mdi-close</v-icon>
                  </button>
                </span>
                <span v-if="selectedSubcategoryLabel" class="active-chip">
                  <v-icon size="11">mdi-tag-outline</v-icon>
                  {{ selectedSubcategoryLabel }}
                  <button type="button" @click="selectedSubcategory = null">
                    <v-icon size="10">mdi-close</v-icon>
                  </button>
                </span>
                <span v-if="selectedBrand" class="active-chip">
                  <v-icon size="11">mdi-label-outline</v-icon>
                  {{ selectedBrand }}
                  <button type="button" @click="selectedBrand = null">
                    <v-icon size="10">mdi-close</v-icon>
                  </button>
                </span>
                <span v-if="selectedModel" class="active-chip">
                  <v-icon size="11">mdi-barcode</v-icon>
                  {{ selectedModel }}
                  <button type="button" @click="selectedModel = null">
                    <v-icon size="10">mdi-close</v-icon>
                  </button>
                </span>
              </div>
            </div>

            <div v-if="loading" class="state-box">
              <v-progress-circular indeterminate color="primary" size="30" />
              <div class="state-box__text">Cargando catálogo…</div>
            </div>

            <div v-else-if="!filteredItems.length" class="state-box state-box--empty">
              <div class="state-box__icon-wrap">
                <v-icon size="34">mdi-filter-variant-remove</v-icon>
              </div>
              <div class="state-box__title">
                {{ hasAnyFilter ? "Sin coincidencias" : "Empezá a filtrar" }}
              </div>
              <div class="state-box__text">
                {{
                  hasAnyFilter
                    ? "Probá con menos filtros o cambiá alguno."
                    : "Elegí una categoría, marca o escribí un nombre para filtrar el catálogo."
                }}
              </div>
            </div>

            <div v-else class="results-grid">
              <article
                v-for="item in filteredItems"
                :key="getItemKey(item)"
                class="product-card"
              >
                <div class="product-card__head">
                  <div class="product-card__name" :title="getName(item)">
                    {{ getName(item) }}
                  </div>
                  <div class="product-card__price">
                    {{ formatMoney(getPrice(item)) }}
                  </div>
                </div>

                <!-- Barcode destacado -->
                <div class="product-card__barcode" v-if="getBarcode(item)">
                  <v-icon size="14">mdi-barcode</v-icon>
                  <span class="barcode-value">{{ getBarcode(item) }}</span>
                  <button
                    type="button"
                    class="barcode-copy"
                    :title="copiedKey === getItemKey(item) ? '¡Copiado!' : 'Copiar código'"
                    @click="copyBarcode(item)"
                  >
                    <v-icon size="12">
                      {{ copiedKey === getItemKey(item) ? "mdi-check" : "mdi-content-copy" }}
                    </v-icon>
                  </button>
                </div>

                <!-- Meta chips -->
                <div class="product-card__meta">
                  <span v-if="getBrand(item)" class="meta-chip meta-chip--brand">
                    {{ getBrand(item) }}
                  </span>
                  <span v-if="getModel(item)" class="meta-chip">
                    {{ getModel(item) }}
                  </span>
                  <span v-if="getCategory(item)" class="meta-chip meta-chip--muted">
                    {{ getCategory(item) }}
                  </span>
                  <span v-if="getSubcategory(item)" class="meta-chip meta-chip--muted">
                    {{ getSubcategory(item) }}
                  </span>
                  <span v-if="getSku(item)" class="meta-chip meta-chip--sku">
                    SKU · {{ getSku(item) }}
                  </span>
                </div>

                <!-- Footer: stock + agregar -->
                <div class="product-card__footer">
                  <span
                    class="stock-pill"
                    :class="getStock(item) > 0 ? 'is-ok' : 'is-out'"
                  >
                    <v-icon size="12">
                      {{ getStock(item) > 0 ? "mdi-package-variant-closed" : "mdi-package-variant-closed-remove" }}
                    </v-icon>
                    {{ getStock(item) > 0 ? `Stock: ${getStock(item)}` : "Sin stock" }}
                  </span>

                  <v-btn
                    size="small"
                    variant="flat"
                    color="primary"
                    :disabled="getStock(item) <= 0"
                    @click="addToCart(item)"
                    class="add-btn"
                  >
                    <v-icon start size="15">mdi-cart-plus</v-icon>
                    Agregar
                  </v-btn>
                </div>
              </article>
            </div>
          </section>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";
import PosDialogHeader from "./shared/PosDialogHeader.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "search",
  "manual-search",
  "barcode-search",
  "add-to-cart",
]);

const searchQuery = ref("");
const onlyWithStock = ref(false);
const selectedCategory = ref(null);
const selectedSubcategory = ref(null);
const selectedBrand = ref(null);
const selectedModel = ref(null);
const searchInputRef = ref(null);
const copiedKey = ref(null);

let copyResetTimer = null;

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      await nextTick();
      focusSearch();
      // Al abrir, si no hay items aún, disparar una búsqueda vacía para traer catálogo
      if (!props.items.length) {
        emit("manual-search", "");
      }
    }
  }
);

// Reset subcategoría/marca/modelo en cascada cuando cambia el padre
watch(selectedCategory, () => {
  selectedSubcategory.value = null;
  selectedBrand.value = null;
  selectedModel.value = null;
});

watch(selectedSubcategory, () => {
  selectedBrand.value = null;
  selectedModel.value = null;
});

watch(selectedBrand, () => {
  selectedModel.value = null;
});

// ─── Data helpers ────────────────────────────────────────────
function normalizeStr(v) {
  return String(v || "").trim();
}

function getItemKey(item) {
  if (!item) return null;
  return (
    item.id ??
    item.product_id ??
    item.code ??
    item.sku ??
    item.barcode ??
    JSON.stringify(item)
  );
}

function pick(item, keys = []) {
  for (const key of keys) {
    const v = item?.[key];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
}

function getName(item) {
  return (
    pick(item, ["name", "nombre", "title", "product_name"]) ||
    "Producto sin nombre"
  );
}

function getSku(item) {
  return normalizeStr(pick(item, ["sku", "SKU"]));
}

function getCode(item) {
  return normalizeStr(pick(item, ["code", "codigo", "product_code"]));
}

function getBarcode(item) {
  return normalizeStr(
    pick(item, ["barcode", "bar_code", "ean", "ean13", "codigo_barras"])
  );
}

function getBrand(item) {
  const brand = pick(item, ["brand", "marca", "brand_name"]);
  if (typeof brand === "object") return brand?.name || brand?.nombre || "";
  return normalizeStr(brand);
}

function getModel(item) {
  const model = pick(item, ["model", "modelo", "model_name"]);
  if (typeof model === "object") return model?.name || model?.nombre || "";
  return normalizeStr(model);
}

function getCategoryId(item) {
  const id = pick(item, ["category_id", "categoryId"]);
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function getCategoryName(item) {
  const name = pick(item, [
    "category_name",
    "category",
    "categoria",
    "rubro",
  ]);
  if (typeof name === "object") return name?.name || name?.nombre || "";
  return normalizeStr(name);
}

function getCategory(item) {
  return getCategoryName(item);
}

function getSubcategoryId(item) {
  const id = pick(item, ["subcategory_id", "subcategoryId"]);
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

function getSubcategoryName(item) {
  const name = pick(item, [
    "subcategory_name",
    "subcategory",
    "subcategoria",
    "subrubro",
  ]);
  if (typeof name === "object") return name?.name || name?.nombre || "";
  return normalizeStr(name);
}

function getSubcategory(item) {
  return getSubcategoryName(item);
}

function getPrice(item) {
  const v = pick(item, [
    "effective_price",
    "price_discount",
    "price",
    "sale_price",
    "precio_venta",
    "unit_price",
  ]);
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function getStock(item) {
  const v = pick(item, [
    "qty",
    "stock",
    "stock_qty",
    "current_stock",
    "cantidad",
    "quantity",
  ]);
  const n = Number(v || 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function formatMoney(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));
}

// ─── Facets dinámicos ───────────────────────────────────────
const allItems = computed(() =>
  Array.isArray(props.items) ? props.items : []
);

function buildFacet(list, getId, getLabel) {
  const seen = new Map();
  for (const it of list) {
    const id = getId(it);
    const label = normalizeStr(getLabel(it));
    const value = id != null ? id : label;
    if (!value || seen.has(value)) continue;
    seen.set(value, label || String(value));
  }
  return Array.from(seen.entries())
    .map(([value, title]) => ({ value, title }))
    .sort((a, b) => a.title.localeCompare(b.title, "es"));
}

function buildTextFacet(list, getLabel) {
  const seen = new Set();
  const out = [];
  for (const it of list) {
    const label = normalizeStr(getLabel(it));
    if (!label || seen.has(label.toLowerCase())) continue;
    seen.add(label.toLowerCase());
    out.push({ value: label, title: label });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title, "es"));
}

const categoryOptions = computed(() =>
  buildFacet(allItems.value, getCategoryId, getCategoryName)
);

const itemsForSubcategoryFacet = computed(() => {
  if (!selectedCategory.value) return [];
  return allItems.value.filter(
    (it) => getCategoryId(it) === selectedCategory.value
  );
});

const subcategoryOptions = computed(() =>
  buildFacet(itemsForSubcategoryFacet.value, getSubcategoryId, getSubcategoryName)
);

const itemsForBrandFacet = computed(() => {
  let list = allItems.value;
  if (selectedCategory.value != null) {
    list = list.filter((it) => getCategoryId(it) === selectedCategory.value);
  }
  if (selectedSubcategory.value != null) {
    list = list.filter(
      (it) => getSubcategoryId(it) === selectedSubcategory.value
    );
  }
  return list;
});

const brandOptions = computed(() =>
  buildTextFacet(itemsForBrandFacet.value, getBrand)
);

const itemsForModelFacet = computed(() => {
  let list = itemsForBrandFacet.value;
  if (selectedBrand.value) {
    const b = selectedBrand.value.toLowerCase();
    list = list.filter((it) => getBrand(it).toLowerCase() === b);
  }
  return list;
});

const modelOptions = computed(() =>
  buildTextFacet(itemsForModelFacet.value, getModel)
);

const selectedCategoryLabel = computed(() => {
  if (selectedCategory.value == null) return "";
  return (
    categoryOptions.value.find((o) => o.value === selectedCategory.value)
      ?.title || ""
  );
});

const selectedSubcategoryLabel = computed(() => {
  if (selectedSubcategory.value == null) return "";
  return (
    subcategoryOptions.value.find((o) => o.value === selectedSubcategory.value)
      ?.title || ""
  );
});

// ─── Filtrado ───────────────────────────────────────────────
const hasAnyFilter = computed(() => {
  return (
    !!normalizeStr(searchQuery.value) ||
    selectedCategory.value != null ||
    selectedSubcategory.value != null ||
    !!selectedBrand.value ||
    !!selectedModel.value ||
    onlyWithStock.value
  );
});

const filteredItems = computed(() => {
  let list = allItems.value;

  if (selectedCategory.value != null) {
    list = list.filter((it) => getCategoryId(it) === selectedCategory.value);
  }
  if (selectedSubcategory.value != null) {
    list = list.filter(
      (it) => getSubcategoryId(it) === selectedSubcategory.value
    );
  }
  if (selectedBrand.value) {
    const b = selectedBrand.value.toLowerCase();
    list = list.filter((it) => getBrand(it).toLowerCase() === b);
  }
  if (selectedModel.value) {
    const m = selectedModel.value.toLowerCase();
    list = list.filter((it) => getModel(it).toLowerCase() === m);
  }

  const q = normalizeStr(searchQuery.value).toLowerCase();
  if (q) {
    list = list.filter((it) => {
      const haystack = [
        getName(it),
        getSku(it),
        getCode(it),
        getBarcode(it),
        getBrand(it),
        getModel(it),
        getCategoryName(it),
        getSubcategoryName(it),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  if (onlyWithStock.value) {
    list = list.filter((it) => getStock(it) > 0);
  }

  return list;
});

// ─── Acciones ───────────────────────────────────────────────
function closeDialog() {
  emit("update:modelValue", false);
}

function focusSearch() {
  searchInputRef.value?.focus?.();
}

function clearAllFilters() {
  searchQuery.value = "";
  selectedCategory.value = null;
  selectedSubcategory.value = null;
  selectedBrand.value = null;
  selectedModel.value = null;
  onlyWithStock.value = false;
}

function addToCart(item) {
  emit("add-to-cart", item);
}

async function copyBarcode(item) {
  const code = getBarcode(item);
  if (!code) return;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
    }
    copiedKey.value = getItemKey(item);
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copiedKey.value = null;
      copyResetTimer = null;
    }, 1500);
  } catch (err) {
    console.warn("[POS] copy barcode error", err);
  }
}
</script>

<style scoped>
.consulta-shell {
  border-radius: 16px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
}

.consulta-body {
  padding: 14px !important;
}

.consulta-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
  min-height: 500px;
}

/* ─── Panel de filtros (columna izquierda) ─────────────────── */
.consulta-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  position: sticky;
  top: 0;
}

.filters-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.filters-title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.filters-clear {
  all: unset;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
  padding: 2px 6px;
  border-radius: 5px;
  transition: background 0.14s ease;
}

.filters-clear:hover {
  background: rgba(var(--v-theme-primary), 0.1);
}

.filter-input :deep(.v-field),
.filter-field :deep(.v-field) {
  border-radius: 9px;
  min-height: 40px;
  background: rgb(var(--v-theme-surface));
}

.filter-input :deep(.v-field__input),
.filter-field :deep(.v-field__input) {
  min-height: 40px;
  font-size: 12.5px;
  padding-top: 0;
  padding-bottom: 0;
}

.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.66);
}

.filter-label-hint {
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: rgba(var(--v-theme-on-surface), 0.4);
  font-size: 10.5px;
}

.stock-toggle {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-size: 12px;
  font-weight: 700;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    color 0.14s ease;
}

.stock-toggle:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.stock-toggle--on {
  background: rgba(var(--v-theme-success), 0.14);
  border-color: rgba(var(--v-theme-success), 0.4);
  color: rgb(var(--v-theme-success));
}

/* ─── Columna de resultados ────────────────────────────────── */
.consulta-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.results-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 4px;
}

.results-summary__count {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.results-summary__count strong {
  font-size: 14px;
  color: rgb(var(--v-theme-on-surface));
  font-weight: 800;
  letter-spacing: -0.01em;
}

.results-summary__chips {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 5px;
}

.active-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 5px 3px 9px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.22);
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.3;
}

.active-chip button {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
  transition: background 0.12s ease;
}

.active-chip button:hover {
  background: rgba(var(--v-theme-primary), 0.3);
}

/* ─── Grid de resultados ───────────────────────────────────── */
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
  max-height: 560px;
  overflow-y: auto;
  padding: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.4) transparent;
}

.results-grid::-webkit-scrollbar {
  width: 8px;
}

.results-grid::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.4);
  border-radius: 999px;
}

.product-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition:
    border-color 0.14s ease,
    box-shadow 0.14s ease;
}

.product-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.32);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
}

.product-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.product-card__name {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.005em;
  color: rgb(var(--v-theme-on-surface));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-card__price {
  flex-shrink: 0;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-primary));
  font-feature-settings: "tnum";
  white-space: nowrap;
}

/* ─── Barcode destacado ────────────────────────────────────── */
.product-card__barcode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.18);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.85);
  letter-spacing: 0.03em;
  align-self: stretch;
  min-width: 0;
}

.product-card__barcode :deep(.v-icon) {
  color: rgb(var(--v-theme-primary));
  opacity: 0.85;
  flex-shrink: 0;
}

.barcode-value {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.barcode-copy {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  transition: background 0.14s ease, color 0.14s ease;
  flex-shrink: 0;
}

.barcode-copy:hover {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

/* ─── Meta chips ───────────────────────────────────────────── */
.product-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 5px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

.meta-chip--brand {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  text-transform: uppercase;
}

.meta-chip--muted {
  background: transparent;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.58);
  text-transform: none;
}

.meta-chip--sku {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  text-transform: none;
  letter-spacing: 0;
}

/* ─── Footer del card ──────────────────────────────────────── */
.product-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}

.stock-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
}

.stock-pill.is-ok {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.stock-pill.is-out {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

.add-btn {
  min-height: 32px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
  box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.3) !important;
}

/* ─── Estados vacíos ───────────────────────────────────────── */
.state-box {
  min-height: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 30px 20px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.14);
}

.state-box__icon-wrap {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  margin-bottom: 4px;
}

.state-box__title {
  font-size: 14px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.state-box__text {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  max-width: 300px;
  line-height: 1.4;
}

/* ─── Responsive ───────────────────────────────────────────── */
@media (max-width: 900px) {
  .consulta-layout {
    grid-template-columns: 1fr;
  }

  .consulta-filters {
    position: static;
  }

  .results-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    max-height: 420px;
  }
}

@media (max-width: 560px) {
  .consulta-body {
    padding: 10px !important;
  }

  .results-grid {
    grid-template-columns: 1fr;
  }

  .product-card__head {
    flex-direction: column;
    gap: 4px;
  }

  .product-card__price {
    font-size: 14px;
  }
}
</style>
