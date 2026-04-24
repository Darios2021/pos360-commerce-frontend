<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1080"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="consulta-shell">
      <PosDialogHeader
        eyebrow="Consulta"
        title="Buscar producto"
        @close="closeDialog"
      >
        <template #chips>
          <v-chip
            v-if="filteredItems.length"
            size="small"
            variant="tonal"
            color="primary"
          >
            {{ filteredItems.length }} {{ filteredItems.length === 1 ? "resultado" : "resultados" }}
          </v-chip>
        </template>
      </PosDialogHeader>

      <v-divider />

      <v-card-text class="consulta-body">
        <div class="consulta-layout">
          <!-- COLUMNA IZQUIERDA -->
          <div class="consulta-left">
            <!-- Search bar compacta -->
            <div class="search-bar">
              <v-text-field
                ref="searchInputRef"
                v-model="searchQuery"
                placeholder="Nombre, SKU, código o código de barras…"
                density="comfortable"
                variant="outlined"
                clearable
                hide-details
                prepend-inner-icon="mdi-magnify"
                class="search-input"
                :loading="loading"
                @keydown.enter.prevent="runSearch"
                @click:clear="clearSearch"
              />

              <v-btn
                color="primary"
                variant="flat"
                :loading="loading"
                :disabled="loading"
                class="search-submit"
                @click="runSearch"
              >
                <v-icon size="18">mdi-magnify</v-icon>
              </v-btn>
            </div>

            <!-- Toggle de filtros -->
            <div class="search-filters">
              <button
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip--on': onlyWithStock }"
                @click="onlyWithStock = !onlyWithStock"
              >
                <v-icon size="14">
                  {{ onlyWithStock ? "mdi-check-circle" : "mdi-circle-outline" }}
                </v-icon>
                <span>Solo con stock</span>
              </button>
            </div>

            <!-- Resultados -->
            <div class="results-section">
              <div v-if="loading" class="state-box">
                <v-progress-circular indeterminate color="primary" size="28" />
                <div class="state-box__text">Buscando productos…</div>
              </div>

              <div v-else-if="!filteredItems.length" class="state-box state-box--empty">
                <div class="state-box__icon-wrap">
                  <v-icon size="32">mdi-magnify</v-icon>
                </div>
                <div class="state-box__title">
                  {{ searchQuery ? "Sin resultados" : "Empezá tu búsqueda" }}
                </div>
                <div class="state-box__text">
                  {{
                    searchQuery
                      ? "Probá con otro término o limpiá el filtro."
                      : "Escribí nombre, SKU o escaneá el código."
                  }}
                </div>
              </div>

              <div v-else class="results-list">
                <button
                  v-for="item in filteredItems"
                  :key="getItemKey(item)"
                  type="button"
                  class="result-card"
                  :class="{ 'result-card--selected': isSelected(item) }"
                  @click="selectItem(item)"
                >
                  <div class="result-card__main">
                    <div class="result-card__name" :title="getName(item)">
                      {{ getName(item) }}
                    </div>

                    <div class="result-card__meta">
                      <span v-if="getSku(item)" class="result-meta-chip">
                        {{ getSku(item) }}
                      </span>
                      <span
                        class="result-stock-dot"
                        :class="getStock(item) > 0 ? 'is-ok' : 'is-out'"
                        :title="getStockLabel(item)"
                      >
                        <v-icon size="10">
                          {{ getStock(item) > 0 ? "mdi-check-circle" : "mdi-close-circle" }}
                        </v-icon>
                        {{ getStock(item) > 0 ? getStock(item) : "0" }}
                      </span>
                    </div>
                  </div>

                  <div class="result-card__price">
                    {{ formatMoney(getPrice(item)) }}
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA -->
          <div class="consulta-right">
            <div v-if="selectedItem" class="detail-shell-inline">
              <!-- Hero: nombre + chips + precio gigante -->
              <div class="detail-hero">
                <div class="detail-hero__top">
                  <div class="detail-hero__title-wrap">
                    <h2 class="detail-title" :title="getName(selectedItem)">
                      {{ getName(selectedItem) }}
                    </h2>
                    <div class="detail-hero__chips">
                      <span
                        class="detail-chip"
                        :class="getStock(selectedItem) > 0 ? 'is-ok' : 'is-out'"
                      >
                        <v-icon size="12">
                          {{ getStock(selectedItem) > 0 ? "mdi-package-variant-closed" : "mdi-package-variant-closed-remove" }}
                        </v-icon>
                        Stock: {{ getStock(selectedItem) }}
                      </span>
                      <span
                        v-if="getStatus(selectedItem)"
                        class="detail-chip detail-chip--soft"
                      >
                        {{ getStatus(selectedItem) }}
                      </span>
                    </div>
                  </div>

                  <v-btn
                    color="primary"
                    variant="flat"
                    size="small"
                    class="detail-hero__add"
                    :disabled="getStock(selectedItem) <= 0"
                    @click="addToCart(selectedItem)"
                  >
                    <v-icon start size="16">mdi-cart-plus</v-icon>
                    Agregar
                  </v-btn>
                </div>

                <div class="detail-hero__price">
                  <span class="detail-hero__price-label">Precio</span>
                  <span class="detail-hero__price-value">
                    {{ formatMoney(getPrice(selectedItem)) }}
                  </span>
                </div>
              </div>

              <div class="detail-section mt-3">
                <div class="detail-section__title">Datos del producto</div>

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

                  <div class="kv-item">
                    <div class="kv-label">Estado</div>
                    <div class="kv-value">{{ getStatus(selectedItem) || "—" }}</div>
                  </div>

                  <div class="kv-item">
                    <div class="kv-label">Sucursal</div>
                    <div class="kv-value">{{ getBranch(selectedItem) || "—" }}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section mt-3">
                <div class="detail-section__title">Medios de pago</div>

                <div v-if="paymentMethods.length" class="payment-list">
                  <div
                    v-for="(method, index) in paymentMethods"
                    :key="`${method.name}-${index}`"
                    class="payment-card"
                  >
                    <div class="payment-card__head">
                      <div class="payment-card__name">
                        {{ method.name }}
                      </div>

                      <v-chip
                        size="x-small"
                        variant="tonal"
                        :color="method.enabled ? 'success' : 'grey'"
                      >
                        {{ method.enabled ? "Disponible" : "No disponible" }}
                      </v-chip>
                    </div>

                    <div class="payment-card__meta">
                      <span v-if="method.priceLabel">Precio: {{ method.priceLabel }}</span>
                      <span v-if="method.extraLabel">Detalle: {{ method.extraLabel }}</span>
                    </div>
                  </div>
                </div>

                <div v-else class="empty-mini">
                  No hay medios de pago informados para este producto.
                </div>
              </div>

              <div v-if="getDescription(selectedItem)" class="detail-section mt-3">
                <div class="detail-section__title">Descripción</div>
                <div class="detail-description">
                  {{ getDescription(selectedItem) }}
                </div>
              </div>

            </div>

            <div v-else class="detail-empty">
              <div class="detail-empty__icon-wrap">
                <v-icon size="36">mdi-package-variant-closed</v-icon>
              </div>
              <div class="detail-empty__title">Detalle del producto</div>
              <div class="detail-empty__text">
                Buscá a la izquierda y seleccioná un producto para ver toda su información.
              </div>
            </div>
          </div>
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
const selectedItem = ref(null);
const searchInputRef = ref(null);

watch(
  () => props.modelValue,
  async (val) => {
    if (val) {
      await nextTick();
      focusSearch();

      if (!selectedItem.value && props.items?.length) {
        selectedItem.value = props.items[0];
      }
    }
  }
);

watch(
  () => props.items,
  (items) => {
    if (Array.isArray(items) && items.length) {
      const currentKey = getItemKey(selectedItem.value);
      const found = items.find((it) => getItemKey(it) === currentKey);
      selectedItem.value = found || items[0];
    } else {
      selectedItem.value = null;
    }
  },
  { immediate: true }
);

const normalizedItems = computed(() =>
  Array.isArray(props.items) ? props.items : []
);

const filteredItems = computed(() => {
  let rows = [...normalizedItems.value];

  const q = (searchQuery.value || "").trim().toLowerCase();
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

const paymentMethods = computed(() => normalizePaymentMethods(selectedItem.value));

function closeDialog() {
  emit("update:modelValue", false);
}

function focusSearch() {
  const el = searchInputRef.value;
  if (el?.focus) el.focus();
}

function clearSearch() {
  searchQuery.value = "";
  if (normalizedItems.value.length) {
    selectedItem.value = normalizedItems.value[0];
  } else {
    selectedItem.value = null;
  }
}

function runSearch() {
  const query = (searchQuery.value || "").trim();
  emit("manual-search", query);
  emit("search", { type: "mixed", query });
}

function selectItem(item) {
  selectedItem.value = item;
}

function addToCart(item) {
  selectedItem.value = item;
  emit("add-to-cart", item);
}

function isSelected(item) {
  return getItemKey(selectedItem.value) === getItemKey(item);
}

function getItemKey(item) {
  if (!item) return null;
  return (
    item.id ??
    item.product_id ??
    item.uuid ??
    item.code ??
    item.sku ??
    item.barcode ??
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
  const branch = pick(item, [
    "branch_name",
    "sucursal",
    "branch",
    "deposito",
    "warehouse_name",
  ]);
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

function normalizePaymentMethods(item) {
  if (!item) return [];

  const raw =
    item?.payment_methods ??
    item?.paymentMethods ??
    item?.medios_pago ??
    item?.mediosDePago ??
    item?.formas_pago ??
    item?.formasDePago ??
    null;

  if (Array.isArray(raw)) {
    return raw.map((entry) => normalizeSinglePaymentMethod(entry)).filter(Boolean);
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw)
      .map(([key, value]) => normalizeSinglePaymentMethod(value, key))
      .filter(Boolean);
  }

  const fallback = [];

  const cashPrice = pick(item, ["cash_price", "precio_efectivo", "price_cash"]);
  const cardPrice = pick(item, ["card_price", "precio_tarjeta", "price_card"]);
  const transferPrice = pick(item, ["transfer_price", "precio_transferencia", "price_transfer"]);
  const qrPrice = pick(item, ["qr_price", "precio_qr", "price_qr"]);

  if (cashPrice !== null) {
    fallback.push({
      name: "Efectivo",
      enabled: true,
      priceLabel: formatMoney(cashPrice),
      extraLabel: "",
    });
  }

  if (cardPrice !== null) {
    fallback.push({
      name: "Tarjeta",
      enabled: true,
      priceLabel: formatMoney(cardPrice),
      extraLabel: "",
    });
  }

  if (transferPrice !== null) {
    fallback.push({
      name: "Transferencia",
      enabled: true,
      priceLabel: formatMoney(transferPrice),
      extraLabel: "",
    });
  }

  if (qrPrice !== null) {
    fallback.push({
      name: "QR",
      enabled: true,
      priceLabel: formatMoney(qrPrice),
      extraLabel: "",
    });
  }

  return fallback;
}

function normalizeSinglePaymentMethod(entry, fallbackKey = "") {
  if (entry === null || entry === undefined) return null;

  if (typeof entry === "string") {
    return {
      name: formatPaymentName(entry || fallbackKey),
      enabled: true,
      priceLabel: "",
      extraLabel: "",
    };
  }

  if (typeof entry === "number") {
    return {
      name: formatPaymentName(fallbackKey),
      enabled: true,
      priceLabel: formatMoney(entry),
      extraLabel: "",
    };
  }

  if (typeof entry === "object") {
    const name =
      entry?.name ??
      entry?.nombre ??
      entry?.method ??
      entry?.medio ??
      fallbackKey;

    const enabled =
      entry?.enabled ??
      entry?.activo ??
      entry?.available ??
      entry?.disponible ??
      true;

    const rawPrice =
      entry?.price ??
      entry?.precio ??
      entry?.amount ??
      entry?.importe ??
      entry?.value ??
      null;

    const installments =
      entry?.installments ??
      entry?.cuotas ??
      entry?.installment_text ??
      entry?.detalle ??
      entry?.note ??
      "";

    return {
      name: formatPaymentName(name),
      enabled: Boolean(enabled),
      priceLabel: rawPrice !== null && rawPrice !== "" ? formatMoney(rawPrice) : "",
      extraLabel: String(installments || ""),
    };
  }

  return null;
}

function formatPaymentName(value) {
  const key = String(value || "").trim().toUpperCase();

  const map = {
    CASH: "Efectivo",
    EFECTIVO: "Efectivo",
    CARD: "Tarjeta",
    TARJETA: "Tarjeta",
    CREDIT_CARD: "Tarjeta crédito",
    DEBIT_CARD: "Tarjeta débito",
    TRANSFER: "Transferencia",
    TRANSFERENCIA: "Transferencia",
    QR: "QR",
    MERCADOPAGO: "Mercado Pago",
    MERCADO_PAGO: "Mercado Pago",
  };

  return map[key] || String(value || "Medio de pago");
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
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

/* ─── Columna izquierda ─────────────────────────────────────── */
.consulta-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.search-bar {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.search-input {
  flex: 1 1 auto;
  min-width: 0;
}

.search-input :deep(.v-field) {
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  min-height: 44px;
}

.search-input :deep(.v-field__input) {
  font-size: 13px;
  font-weight: 500;
  min-height: 44px;
  padding-top: 0;
  padding-bottom: 0;
}

.search-submit {
  min-width: 44px !important;
  width: 44px !important;
  height: 44px !important;
  border-radius: 10px !important;
  box-shadow: 0 2px 10px rgba(var(--v-theme-primary), 0.32) !important;
}

.search-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-chip {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-size: 12px;
  font-weight: 700;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.filter-chip:hover {
  background: rgba(var(--v-theme-on-surface), 0.1);
}

.filter-chip--on {
  background: rgba(var(--v-theme-success), 0.14);
  border-color: rgba(var(--v-theme-success), 0.4);
  color: rgb(var(--v-theme-success));
}

.results-section {
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 8px;
  min-height: 360px;
}

/* ─── Result cards ──────────────────────────────────────────── */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 2px;
}

.results-list::-webkit-scrollbar {
  width: 8px;
}

.results-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.35);
  border-radius: 999px;
}

.result-card {
  all: unset;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  cursor: pointer;
  transition:
    background 0.14s ease,
    border-color 0.14s ease,
    box-shadow 0.14s ease;
}

.result-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
  background: rgba(var(--v-theme-primary), 0.04);
}

.result-card--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.1);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.16);
}

.result-card:focus-visible {
  outline: none;
  border-color: rgb(var(--v-theme-primary));
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.32);
}

.result-card__main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.result-card__name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-card__meta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.result-meta-chip {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.4;
}

.result-stock-dot {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  line-height: 1.4;
  font-feature-settings: "tnum";
}

.result-stock-dot.is-ok {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.result-stock-dot.is-out {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

.result-card__price {
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-primary));
  white-space: nowrap;
  font-feature-settings: "tnum";
}

.result-card--selected .result-card__price {
  color: rgb(var(--v-theme-primary));
}

/* ─── Empty/loading states ─────────────────────────────────── */
.state-box {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 20px;
}

.state-box__icon-wrap {
  width: 56px;
  height: 56px;
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
  max-width: 260px;
  line-height: 1.4;
}

/* ─── Columna derecha (detalle) ──────────────────────────────── */
.consulta-right {
  min-width: 0;
}

.detail-shell-inline {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  background: transparent;
  border: none;
}

.detail-hero {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-on-surface), 0.03) 100%
  );
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.detail-hero__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.detail-hero__title-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  flex: 1 1 auto;
}

.detail-title {
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.detail-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.01em;
  line-height: 1.4;
}

.detail-chip.is-ok {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}

.detail-chip.is-out {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}

.detail-chip--soft {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.72);
  text-transform: uppercase;
  font-size: 10px;
}

.detail-hero__add {
  flex-shrink: 0;
  min-height: 36px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  letter-spacing: 0 !important;
  font-weight: 800 !important;
  box-shadow: 0 2px 10px rgba(var(--v-theme-primary), 0.32) !important;
}

.detail-hero__price {
  display: flex;
  align-items: baseline;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.detail-hero__price-label {
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.detail-hero__price-value {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-primary));
  font-feature-settings: "tnum";
  margin-left: auto;
}

/* ─── Secciones de detalle ─────────────────────────────────── */
.detail-section {
  padding: 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.detail-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 10px;
}

.detail-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.kv-item {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.kv-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 2px;
}

.kv-value {
  font-size: 12.5px;
  font-weight: 700;
  word-break: break-word;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.25;
}

.payment-list {
  display: grid;
  gap: 6px;
}

.payment-card {
  padding: 9px 11px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.payment-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.payment-card__name {
  font-size: 12.5px;
  font-weight: 700;
}

.payment-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.detail-description {
  font-size: 12.5px;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.85);
}

.empty-mini {
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 8px 2px;
}

/* ─── Empty state de detalle ───────────────────────────────── */
.detail-empty {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 30px 20px;
  border-radius: 14px;
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.detail-empty__icon-wrap {
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

.detail-empty__title {
  font-size: 14px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.detail-empty__text {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  max-width: 280px;
  line-height: 1.4;
}

/* ─── Responsive ───────────────────────────────────────────── */
@media (max-width: 980px) {
  .consulta-layout {
    grid-template-columns: 1fr;
  }

  .detail-shell-inline {
    position: static;
  }

  .detail-kv-grid {
    grid-template-columns: 1fr;
  }

  .results-list {
    max-height: 320px;
  }
}

@media (max-width: 720px) {
  .consulta-body {
    padding: 12px !important;
  }

  .detail-hero__top {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-hero__price-value {
    font-size: 22px;
  }
}
</style>