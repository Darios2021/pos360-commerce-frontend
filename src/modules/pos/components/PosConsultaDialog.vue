<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1240"
    persistent
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="consulta-shell">
      <div class="consulta-header">
        <div class="consulta-header__left">
          <div class="consulta-icon-wrap">
            <v-icon size="22">mdi-magnify</v-icon>
          </div>

          <div>
            <div class="consulta-title">Consulta POS</div>
            <div class="consulta-subtitle">
              Consultá productos por nombre, código, SKU o código de barras
            </div>
          </div>
        </div>

        <div class="consulta-header__right">
          <v-chip
            size="small"
            variant="tonal"
            color="primary"
            class="mr-2"
          >
            {{ filteredItems.length }} resultado<span v-if="filteredItems.length !== 1">s</span>
          </v-chip>

          <v-btn
            icon
            variant="text"
            @click="closeDialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-divider />

      <v-card-text class="consulta-body">
        <div class="consulta-layout">
          <!-- PANEL IZQUIERDO -->
          <div class="consulta-panel consulta-panel--search">
            <div class="panel-block">
              <div class="panel-title">
                <v-icon size="18" class="mr-2">mdi-tune-variant</v-icon>
                Búsqueda
              </div>

              <v-tabs
                v-model="searchTab"
                density="comfortable"
                color="primary"
                class="consulta-tabs"
              >
                <v-tab value="manual">
                  <v-icon start size="16">mdi-form-textbox</v-icon>
                  Manual
                </v-tab>
                <v-tab value="barcode">
                  <v-icon start size="16">mdi-barcode-scan</v-icon>
                  Barras
                </v-tab>
              </v-tabs>

              <v-window v-model="searchTab" class="mt-3">
                <!-- MANUAL -->
                <v-window-item value="manual">
                  <div class="search-grid">
                    <v-text-field
                      v-model="manualQuery"
                      label="Buscar producto"
                      placeholder="Nombre, código, SKU, marca..."
                      density="comfortable"
                      variant="outlined"
                      clearable
                      hide-details
                      prepend-inner-icon="mdi-magnify"
                      @keydown.enter.prevent="runManualSearch"
                    />

                    <div class="search-actions">
                      <v-btn
                        color="primary"
                        variant="flat"
                        :loading="loading"
                        @click="runManualSearch"
                      >
                        <v-icon start>mdi-magnify</v-icon>
                        Buscar
                      </v-btn>

                      <v-btn
                        variant="tonal"
                        color="default"
                        @click="clearManual"
                      >
                        <v-icon start>mdi-broom</v-icon>
                        Limpiar
                      </v-btn>
                    </div>
                  </div>
                </v-window-item>

                <!-- BARRAS -->
                <v-window-item value="barcode">
                  <div class="search-grid">
                    <v-text-field
                      ref="barcodeInputRef"
                      v-model="barcodeQuery"
                      label="Código de barras"
                      placeholder="Escaneá o escribí el código"
                      density="comfortable"
                      variant="outlined"
                      clearable
                      hide-details
                      prepend-inner-icon="mdi-barcode-scan"
                      append-inner-icon="mdi-keyboard-outline"
                      @keydown.enter.prevent="runBarcodeSearch"
                    />

                    <div class="search-actions">
                      <v-btn
                        color="warning"
                        variant="flat"
                        :loading="loading"
                        @click="runBarcodeSearch"
                      >
                        <v-icon start>mdi-barcode-scan</v-icon>
                        Consultar
                      </v-btn>

                      <v-btn
                        variant="tonal"
                        color="default"
                        @click="focusBarcode"
                      >
                        <v-icon start>mdi-crosshairs-gps</v-icon>
                        Foco
                      </v-btn>

                      <v-btn
                        variant="tonal"
                        color="default"
                        @click="clearBarcode"
                      >
                        <v-icon start>mdi-broom</v-icon>
                        Limpiar
                      </v-btn>
                    </div>
                  </div>

                  <v-alert
                    class="mt-3"
                    variant="tonal"
                    color="info"
                    density="comfortable"
                  >
                    Si usás pistola lectora, al terminar el escaneo se ejecuta con Enter.
                  </v-alert>
                </v-window-item>
              </v-window>
            </div>

            <div class="panel-block mt-4">
              <div class="panel-title">
                <v-icon size="18" class="mr-2">mdi-filter-variant</v-icon>
                Filtros rápidos
              </div>

              <div class="filters-grid">
                <v-text-field
                  v-model="clientFilter"
                  label="Filtro local"
                  placeholder="Refinar resultados"
                  density="compact"
                  variant="outlined"
                  clearable
                  hide-details
                  prepend-inner-icon="mdi-filter-outline"
                />

                <v-switch
                  v-model="onlyWithStock"
                  color="success"
                  density="compact"
                  hide-details
                  inset
                  label="Solo con stock"
                />
              </div>
            </div>

            <div class="panel-block mt-4">
              <div class="panel-title">
                <v-icon size="18" class="mr-2">mdi-chart-box-outline</v-icon>
                Resumen
              </div>

              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-card__label">Resultados</div>
                  <div class="stat-card__value">{{ filteredItems.length }}</div>
                </div>

                <div class="stat-card stat-card--success">
                  <div class="stat-card__label">Con stock</div>
                  <div class="stat-card__value">{{ itemsWithStock }}</div>
                </div>

                <div class="stat-card stat-card--error">
                  <div class="stat-card__label">Sin stock</div>
                  <div class="stat-card__value">{{ itemsWithoutStock }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- PANEL DERECHO -->
          <div class="consulta-panel consulta-panel--results">
            <div class="panel-block panel-block--fill">
              <div class="results-header">
                <div class="panel-title mb-0">
                  <v-icon size="18" class="mr-2">mdi-package-variant-closed</v-icon>
                  Resultados
                </div>

                <v-chip
                  size="small"
                  variant="tonal"
                  color="primary"
                >
                  {{ filteredItems.length }}
                </v-chip>
              </div>

              <div v-if="loading" class="state-box">
                <v-progress-circular indeterminate color="primary" size="28" />
                <div class="state-box__text">Consultando productos...</div>
              </div>

              <div v-else-if="!filteredItems.length" class="state-box state-box--empty">
                <v-icon size="46">mdi-database-search-outline</v-icon>
                <div class="state-box__title">Sin resultados</div>
                <div class="state-box__text">
                  Realizá una búsqueda manual o escaneá un código de barras.
                </div>
              </div>

              <div v-else class="results-list">
                <div
                  v-for="item in filteredItems"
                  :key="getItemKey(item)"
                  class="result-card"
                  :class="{ 'result-card--selected': isSelected(item) }"
                  @click="selectItem(item)"
                >
                  <div class="result-card__top">
                    <div class="result-card__identity">
                      <div class="result-card__name">
                        {{ getName(item) }}
                      </div>

                      <div class="result-card__meta">
                        <span v-if="getCode(item)">Cód: {{ getCode(item) }}</span>
                        <span v-if="getSku(item)">SKU: {{ getSku(item) }}</span>
                        <span v-if="getBarcode(item)">Barras: {{ getBarcode(item) }}</span>
                      </div>
                    </div>

                    <div class="result-card__chips">
                      <v-chip
                        size="small"
                        :color="getStock(item) > 0 ? 'success' : 'error'"
                        variant="flat"
                      >
                        {{ getStockLabel(item) }}
                      </v-chip>

                      <v-chip
                        v-if="getStatus(item)"
                        size="small"
                        variant="tonal"
                        :color="getStatusColor(item)"
                      >
                        {{ getStatus(item) }}
                      </v-chip>
                    </div>
                  </div>

                  <div class="result-card__body">
                    <div class="result-card__info">
                      <div class="info-pill">
                        <v-icon size="15">mdi-currency-usd</v-icon>
                        <span>{{ formatMoney(getPrice(item)) }}</span>
                      </div>

                      <div class="info-pill" v-if="getCategory(item)">
                        <v-icon size="15">mdi-shape-outline</v-icon>
                        <span>{{ getCategory(item) }}</span>
                      </div>

                      <div class="info-pill" v-if="getBrand(item)">
                        <v-icon size="15">mdi-tag-outline</v-icon>
                        <span>{{ getBrand(item) }}</span>
                      </div>

                      <div class="info-pill" v-if="getBranch(item)">
                        <v-icon size="15">mdi-store-outline</v-icon>
                        <span>{{ getBranch(item) }}</span>
                      </div>
                    </div>

                    <div class="result-card__actions">
                      <v-btn
                        size="small"
                        variant="text"
                        color="primary"
                        @click.stop="openDetail(item)"
                      >
                        <v-icon start size="16">mdi-eye-outline</v-icon>
                        Ver
                      </v-btn>

                      <v-btn
                        size="small"
                        variant="tonal"
                        color="success"
                        :disabled="getStock(item) <= 0"
                        @click.stop="addToCart(item)"
                      >
                        <v-icon start size="16">mdi-cart-plus</v-icon>
                        Agregar
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- DETALLE -->
    <v-dialog
      :model-value="detailOpen"
      max-width="900"
      @update:model-value="detailOpen = $event"
    >
      <v-card class="detail-shell">
        <div class="detail-header">
          <div>
            <div class="detail-title">
              {{ selectedItem ? getName(selectedItem) : "Detalle de producto" }}
            </div>
            <div class="detail-subtitle">
              Información completa del producto consultado
            </div>
          </div>

          <v-btn
            icon
            variant="text"
            @click="detailOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-divider />

        <v-card-text v-if="selectedItem" class="detail-body">
          <div class="detail-grid">
            <div class="detail-main">
              <div class="detail-section">
                <div class="detail-section__title">Datos generales</div>

                <div class="detail-kv-grid">
                  <div class="kv-item">
                    <div class="kv-label">Nombre</div>
                    <div class="kv-value">{{ getName(selectedItem) || "—" }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Código</div>
                    <div class="kv-value">{{ getCode(selectedItem) || "—" }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">SKU</div>
                    <div class="kv-value">{{ getSku(selectedItem) || "—" }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Código de barras</div>
                    <div class="kv-value">{{ getBarcode(selectedItem) || "—" }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Marca</div>
                    <div class="kv-value">{{ getBrand(selectedItem) || "—" }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Categoría</div>
                    <div class="kv-value">{{ getCategory(selectedItem) || "—" }}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-4">
                <div class="detail-section__title">Comercial</div>

                <div class="detail-kv-grid">
                  <div class="kv-item">
                    <div class="kv-label">Precio</div>
                    <div class="kv-value">{{ formatMoney(getPrice(selectedItem)) }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Stock</div>
                    <div class="kv-value">{{ getStock(selectedItem) }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Sucursal</div>
                    <div class="kv-value">{{ getBranch(selectedItem) || "—" }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Estado</div>
                    <div class="kv-value">{{ getStatus(selectedItem) || "—" }}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-4" v-if="getDescription(selectedItem)">
                <div class="detail-section__title">Descripción</div>
                <div class="detail-description">
                  {{ getDescription(selectedItem) }}
                </div>
              </div>
            </div>

            <div class="detail-side">
              <div class="detail-side-card">
                <div class="detail-side-card__title">Acciones</div>

                <v-btn
                  block
                  color="success"
                  variant="flat"
                  :disabled="getStock(selectedItem) <= 0"
                  @click="addToCart(selectedItem)"
                >
                  <v-icon start>mdi-cart-plus</v-icon>
                  Agregar al carrito
                </v-btn>

                <v-btn
                  block
                  class="mt-2"
                  color="primary"
                  variant="tonal"
                  @click="emit('select', selectedItem)"
                >
                  <v-icon start>mdi-check-circle-outline</v-icon>
                  Seleccionar
                </v-btn>
              </div>

              <div class="detail-side-card mt-3">
                <div class="detail-side-card__title">Estado rápido</div>

                <div class="quick-status-list">
                  <div class="quick-status-row">
                    <span>Stock</span>
                    <v-chip
                      size="small"
                      :color="getStock(selectedItem) > 0 ? 'success' : 'error'"
                      variant="flat"
                    >
                      {{ getStockLabel(selectedItem) }}
                    </v-chip>
                  </div>

                  <div class="quick-status-row">
                    <span>Precio</span>
                    <strong>{{ formatMoney(getPrice(selectedItem)) }}</strong>
                  </div>

                  <div class="quick-status-row">
                    <span>Sucursal</span>
                    <strong>{{ getBranch(selectedItem) || "—" }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:modelValue",
  "search",
  "barcode-search",
  "manual-search",
  "select",
  "add-to-cart",
]);

const searchTab = ref("manual");
const manualQuery = ref("");
const barcodeQuery = ref("");
const clientFilter = ref("");
const onlyWithStock = ref(false);
const selectedItem = ref(null);
const detailOpen = ref(false);
const barcodeInputRef = ref(null);

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      await nextTick();
      if (searchTab.value === "barcode") focusBarcode();
    }
  }
);

watch(searchTab, async (tab) => {
  if (tab === "barcode" && props.modelValue) {
    await nextTick();
    focusBarcode();
  }
});

const normalizedItems = computed(() => Array.isArray(props.items) ? props.items : []);

const filteredItems = computed(() => {
  let rows = [...normalizedItems.value];

  const q = (clientFilter.value || "").trim().toLowerCase();
  if (q) {
    rows = rows.filter((item) => {
      const haystack = [
        getName(item),
        getCode(item),
        getSku(item),
        getBarcode(item),
        getBrand(item),
        getCategory(item),
        getBranch(item),
        getDescription(item),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }

  if (onlyWithStock.value) {
    rows = rows.filter((item) => Number(getStock(item) || 0) > 0);
  }

  return rows;
});

const itemsWithStock = computed(() =>
  filteredItems.value.filter((item) => Number(getStock(item) || 0) > 0).length
);

const itemsWithoutStock = computed(() =>
  filteredItems.value.filter((item) => Number(getStock(item) || 0) <= 0).length
);

function closeDialog() {
  emit("update:modelValue", false);
}

function clearManual() {
  manualQuery.value = "";
  clientFilter.value = "";
}

function clearBarcode() {
  barcodeQuery.value = "";
}

function runManualSearch() {
  const query = (manualQuery.value || "").trim();
  emit("manual-search", query);
  emit("search", { type: "manual", query });
}

function runBarcodeSearch() {
  const query = (barcodeQuery.value || "").trim();
  emit("barcode-search", query);
  emit("search", { type: "barcode", query });
}

function focusBarcode() {
  const el = barcodeInputRef.value;
  if (el?.focus) el.focus();
}

function selectItem(item) {
  selectedItem.value = item;
  emit("select", item);
}

function openDetail(item) {
  selectedItem.value = item;
  detailOpen.value = true;
}

function addToCart(item) {
  selectedItem.value = item;
  emit("add-to-cart", item);
}

function isSelected(item) {
  return getItemKey(selectedItem.value) === getItemKey(item);
}

function getItemKey(item) {
  return (
    item?.id ??
    item?.product_id ??
    item?.uuid ??
    item?.code ??
    item?.sku ??
    item?.barcode ??
    JSON.stringify(item)
  );
}

function pick(item, keys = []) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null && item?.[key] !== "") {
      return item[key];
    }
  }
  return null;
}

function getName(item) {
  return (
    pick(item, [
      "name",
      "nombre",
      "title",
      "producto",
      "product_name",
      "descripcion_corta",
    ]) || "Producto sin nombre"
  );
}

function getCode(item) {
  return pick(item, ["code", "codigo", "internal_code", "product_code"]);
}

function getSku(item) {
  return pick(item, ["sku", "SKU"]);
}

function getBarcode(item) {
  return pick(item, ["barcode", "bar_code", "ean", "ean13", "codigo_barras"]);
}

function getBrand(item) {
  const brand = pick(item, ["brand", "marca", "brand_name"]);
  if (typeof brand === "object") {
    return brand?.name || brand?.nombre || null;
  }
  return brand;
}

function getCategory(item) {
  const category = pick(item, ["category", "categoria", "category_name"]);
  if (typeof category === "object") {
    return category?.name || category?.nombre || null;
  }
  return category;
}

function getBranch(item) {
  const branch = pick(item, ["branch_name", "sucursal", "branch", "deposito", "warehouse_name"]);
  if (typeof branch === "object") {
    return branch?.name || branch?.nombre || null;
  }
  return branch;
}

function getPrice(item) {
  const value = pick(item, [
    "final_price",
    "sale_price",
    "precio_venta",
    "price",
    "precio",
    "unit_price",
  ]);
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function getStock(item) {
  const value = pick(item, [
    "stock",
    "current_stock",
    "available_stock",
    "cantidad",
    "qty",
    "quantity",
  ]);
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function getStatus(item) {
  return pick(item, ["status", "estado", "state"]);
}

function getDescription(item) {
  return pick(item, ["description", "descripcion", "detalle", "observaciones"]);
}

function getStockLabel(item) {
  const stock = Number(getStock(item) || 0);
  return stock > 0 ? `Stock: ${stock}` : "Sin stock";
}

function getStatusColor(item) {
  const status = String(getStatus(item) || "").toUpperCase();

  if (["ACTIVE", "ACTIVO", "AVAILABLE", "DISPONIBLE"].includes(status)) return "success";
  if (["INACTIVE", "INACTIVO"].includes(status)) return "grey";
  if (["LOW", "LOW_STOCK", "STOCK_BAJO"].includes(status)) return "warning";
  if (["BLOCKED", "BLOQUEADO"].includes(status)) return "error";

  return "primary";
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(amount);
}
</script>

<style scoped>
.consulta-shell {
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(17, 27, 53, 0.96), rgba(9, 16, 34, 0.98));
  color: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.consulta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.consulta-header__left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.consulta-header__right {
  display: flex;
  align-items: center;
}

.consulta-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: rgba(59, 130, 246, 0.16);
  border: 1px solid rgba(96, 165, 250, 0.22);
}

.consulta-title {
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.1;
}

.consulta-subtitle {
  font-size: 0.84rem;
  opacity: 0.78;
  margin-top: 4px;
}

.consulta-body {
  padding: 18px !important;
}

.consulta-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
}

.consulta-panel {
  min-width: 0;
}

.panel-block {
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 14px;
  backdrop-filter: blur(10px);
}

.panel-block--fill {
  min-height: 620px;
}

.panel-title {
  display: flex;
  align-items: center;
  font-size: 0.95rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.consulta-tabs {
  border-radius: 14px;
  overflow: hidden;
}

.search-grid {
  display: grid;
  gap: 12px;
}

.search-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.filters-grid {
  display: grid;
  gap: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.stat-card {
  border-radius: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.stat-card--success {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.24);
}

.stat-card--error {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.24);
}

.stat-card__label {
  font-size: 0.72rem;
  opacity: 0.75;
  margin-bottom: 4px;
}

.stat-card__value {
  font-size: 1.1rem;
  font-weight: 800;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.state-box {
  min-height: 520px;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 10px;
  opacity: 0.92;
}

.state-box--empty {
  color: rgba(255, 255, 255, 0.76);
}

.state-box__title {
  font-size: 1rem;
  font-weight: 800;
}

.state-box__text {
  font-size: 0.88rem;
  max-width: 420px;
  opacity: 0.75;
}

.results-list {
  display: grid;
  gap: 12px;
  max-height: 620px;
  overflow: auto;
  padding-right: 4px;
}

.results-list::-webkit-scrollbar {
  width: 8px;
}

.results-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.16);
  border-radius: 999px;
}

.result-card {
  border-radius: 18px;
  padding: 14px;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.result-card:hover {
  transform: translateY(-1px);
  border-color: rgba(96, 165, 250, 0.34);
  background: rgba(255, 255, 255, 0.062);
}

.result-card--selected {
  border-color: rgba(96, 165, 250, 0.48);
  background: rgba(59, 130, 246, 0.12);
}

.result-card__top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.result-card__identity {
  min-width: 0;
}

.result-card__name {
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 6px;
}

.result-card__meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 0.78rem;
  opacity: 0.72;
}

.result-card__chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.result-card__body {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-end;
}

.result-card__info {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.info-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  background: rgba(255, 255, 255, 0.055);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.result-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-shell {
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(18, 27, 52, 0.98), rgba(9, 14, 28, 1));
  color: rgba(255, 255, 255, 0.96);
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.detail-title {
  font-size: 1.06rem;
  font-weight: 800;
}

.detail-subtitle {
  font-size: 0.84rem;
  opacity: 0.74;
  margin-top: 4px;
}

.detail-body {
  padding: 18px !important;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
}

.detail-section {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 18px;
  padding: 14px;
}

.detail-section__title,
.detail-side-card__title {
  font-size: 0.9rem;
  font-weight: 800;
  margin-bottom: 12px;
}

.detail-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.kv-item {
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 10px 12px;
}

.kv-label {
  font-size: 0.72rem;
  opacity: 0.7;
  margin-bottom: 4px;
}

.kv-value {
  font-size: 0.92rem;
  font-weight: 700;
  word-break: break-word;
}

.detail-description {
  font-size: 0.9rem;
  line-height: 1.55;
  opacity: 0.92;
}

.detail-side-card {
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 14px;
}

.quick-status-list {
  display: grid;
  gap: 10px;
}

.quick-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.88rem;
}

@media (max-width: 1080px) {
  .consulta-layout {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .panel-block--fill {
    min-height: auto;
  }

  .results-list {
    max-height: 420px;
  }
}

@media (max-width: 720px) {
  .consulta-header,
  .detail-header {
    padding: 14px;
  }

  .consulta-body,
  .detail-body {
    padding: 14px !important;
  }

  .stats-grid,
  .detail-kv-grid {
    grid-template-columns: 1fr;
  }

  .result-card__top,
  .result-card__body {
    flex-direction: column;
    align-items: stretch;
  }

  .result-card__chips {
    justify-content: flex-start;
  }

  .result-card__actions {
    width: 100%;
  }

  .result-card__actions :deep(.v-btn) {
    flex: 1 1 auto;
  }
}
</style>