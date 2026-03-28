<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1080"
    persistent
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="consulta-shell">
      <div class="consulta-header">
        <div class="consulta-header__left">
          <div class="consulta-icon-wrap">
            <v-icon size="18">mdi-magnify</v-icon>
          </div>

          <div class="min-w-0">
            <div class="consulta-title">Consulta POS</div>
            <div class="consulta-subtitle">
              Buscá un producto y visualizá toda su información en la misma pantalla
            </div>
          </div>
        </div>

        <div class="consulta-header__right">
          <v-chip size="small" variant="tonal" color="primary">
            {{ filteredItems.length }} resultado<span v-if="filteredItems.length !== 1">s</span>
          </v-chip>

          <v-btn icon variant="text" size="small" @click="closeDialog">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-divider />

      <v-card-text class="consulta-body">
        <div class="consulta-layout">
          <!-- COLUMNA IZQUIERDA -->
          <div class="consulta-left">
            <div class="panel-block">
              <div class="panel-title">
                <v-icon size="16" class="mr-2">mdi-magnify</v-icon>
                Buscar producto
              </div>

              <div class="search-grid">
                <v-text-field
                  ref="searchInputRef"
                  v-model="searchQuery"
                  label="Buscar"
                  placeholder="Nombre, código, SKU o código de barras"
                  density="compact"
                  variant="outlined"
                  clearable
                  hide-details
                  prepend-inner-icon="mdi-magnify"
                  append-inner-icon="mdi-barcode-scan"
                  @keydown.enter.prevent="runSearch"
                />

                <div class="search-actions">
                  <v-btn
                    color="primary"
                    variant="flat"
                    size="small"
                    :loading="loading"
                    @click="runSearch"
                  >
                    <v-icon start size="15">mdi-magnify</v-icon>
                    Buscar
                  </v-btn>

                  <v-btn
                    variant="tonal"
                    size="small"
                    @click="clearSearch"
                  >
                    <v-icon start size="15">mdi-broom</v-icon>
                    Limpiar
                  </v-btn>
                </div>

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

            <div class="panel-block mt-3">
              <div class="results-header">
                <div class="panel-title mb-0">
                  <v-icon size="16" class="mr-2">mdi-package-variant-closed</v-icon>
                  Productos
                </div>

                <v-chip size="small" variant="tonal" color="primary">
                  {{ filteredItems.length }}
                </v-chip>
              </div>

              <div v-if="loading" class="state-box">
                <v-progress-circular indeterminate color="primary" size="24" />
                <div class="state-box__text">Consultando productos...</div>
              </div>

              <div v-else-if="!filteredItems.length" class="state-box state-box--empty">
                <v-icon size="36">mdi-database-search-outline</v-icon>
                <div class="state-box__title">Sin resultados</div>
                <div class="state-box__text">
                  Escribí el producto que querés buscar y presioná Enter o Buscar.
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

                    <v-chip
                      size="small"
                      :color="getStock(item) > 0 ? 'success' : 'error'"
                      variant="flat"
                    >
                      {{ getStockLabel(item) }}
                    </v-chip>
                  </div>

                  <div class="result-card__bottom">
                    <div class="info-pill">
                      <v-icon size="14">mdi-currency-usd</v-icon>
                      <span>{{ formatMoney(getPrice(item)) }}</span>
                    </div>

                    <v-btn
                      size="small"
                      variant="tonal"
                      color="success"
                      :disabled="getStock(item) <= 0"
                      @click.stop="addToCart(item)"
                    >
                      <v-icon start size="15">mdi-cart-plus</v-icon>
                      Agregar
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- COLUMNA DERECHA -->
          <div class="consulta-right">
            <div v-if="selectedItem" class="detail-shell-inline">
              <div class="detail-inline-header">
                <div class="min-w-0">
                  <div class="detail-title">
                    {{ getName(selectedItem) }}
                  </div>
                  <div class="detail-subtitle">
                    Información completa del producto seleccionado
                  </div>
                </div>

                <div class="detail-inline-top">
                  <v-chip
                    size="small"
                    :color="getStock(selectedItem) > 0 ? 'success' : 'error'"
                    variant="flat"
                  >
                    {{ getStockLabel(selectedItem) }}
                  </v-chip>

                  <v-chip
                    v-if="getStatus(selectedItem)"
                    size="small"
                    variant="tonal"
                    :color="getStatusColor(selectedItem)"
                  >
                    {{ getStatus(selectedItem) }}
                  </v-chip>
                </div>
              </div>

              <div class="hero-grid">
                <div class="hero-price-card">
                  <div class="hero-price-card__label">Precio</div>
                  <div class="hero-price-card__value">
                    {{ formatMoney(getPrice(selectedItem)) }}
                  </div>
                </div>

                <div class="hero-mini-card">
                  <div class="hero-mini-card__label">Stock</div>
                  <div class="hero-mini-card__value">{{ getStock(selectedItem) }}</div>
                </div>

                <div class="hero-mini-card">
                  <div class="hero-mini-card__label">Sucursal</div>
                  <div class="hero-mini-card__value">{{ getBranch(selectedItem) || "—" }}</div>
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

              <div class="detail-inline-actions">
                <v-btn
                  color="success"
                  variant="flat"
                  size="small"
                  :disabled="getStock(selectedItem) <= 0"
                  @click="addToCart(selectedItem)"
                >
                  <v-icon start size="15">mdi-cart-plus</v-icon>
                  Agregar
                </v-btn>
              </div>
            </div>

            <div v-else class="detail-empty">
              <v-icon size="34">mdi-package-variant-closed</v-icon>
              <div class="detail-empty__title">Detalle del producto</div>
              <div class="detail-empty__text">
                Buscá un producto y tocá el resultado para ver todos sus datos acá mismo.
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
  border-radius: 18px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
}

.consulta-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.consulta-header__left,
.consulta-header__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.consulta-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-primary), 0.1);
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
  color: rgb(var(--v-theme-primary));
  flex: 0 0 auto;
}

.consulta-title,
.detail-title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.1;
}

.consulta-subtitle,
.detail-subtitle {
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.68);
  margin-top: 3px;
  line-height: 1.3;
}

.consulta-body {
  padding: 14px !important;
}

.consulta-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

.panel-block,
.result-card,
.detail-shell-inline,
.detail-empty,
.hero-price-card,
.hero-mini-card,
.kv-item,
.payment-card {
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.panel-block,
.detail-shell-inline,
.detail-empty {
  border-radius: 16px;
  padding: 12px;
}

.panel-title,
.detail-section__title {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 800;
  margin-bottom: 10px;
  color: rgb(var(--v-theme-on-surface));
}

.search-grid {
  display: grid;
  gap: 10px;
}

.search-actions,
.detail-inline-actions,
.detail-inline-top,
.result-card__bottom,
.result-card__meta,
.payment-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.state-box {
  min-height: 260px;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 8px;
}

.state-box--empty {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.state-box__title {
  font-size: 0.94rem;
  font-weight: 800;
}

.state-box__text {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.68);
  max-width: 320px;
}

.results-list {
  display: grid;
  gap: 10px;
  max-height: 560px;
  overflow: auto;
  padding-right: 4px;
}

.results-list::-webkit-scrollbar {
  width: 8px;
}

.results-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.16);
  border-radius: 999px;
}

.result-card {
  border-radius: 14px;
  padding: 11px;
  cursor: pointer;
  transition: 0.16s ease;
}

.result-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.28);
  background: rgba(var(--v-theme-primary), 0.04);
}

.result-card--selected {
  border-color: rgba(var(--v-theme-primary), 0.42);
  background: rgba(var(--v-theme-primary), 0.07);
}

.result-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.result-card__identity {
  min-width: 0;
}

.result-card__name {
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.18;
  margin-bottom: 4px;
  color: rgb(var(--v-theme-on-surface));
}

.result-card__meta {
  font-size: 0.74rem;
  color: rgba(var(--v-theme-on-surface), 0.66);
}

.result-card__bottom {
  align-items: center;
  justify-content: space-between;
}

.info-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.detail-shell-inline {
  position: sticky;
  top: 0;
}

.detail-inline-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 10px;
}

.hero-price-card,
.hero-mini-card {
  border-radius: 14px;
  padding: 12px;
}

.hero-price-card__label,
.hero-mini-card__label,
.kv-label {
  font-size: 0.72rem;
  color: rgba(var(--v-theme-on-surface), 0.64);
  margin-bottom: 4px;
}

.hero-price-card__value {
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1.1;
}

.hero-mini-card__value,
.kv-value {
  font-size: 0.88rem;
  font-weight: 700;
  word-break: break-word;
  color: rgb(var(--v-theme-on-surface));
}

.detail-section {
  margin-top: 12px;
}

.detail-kv-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.kv-item {
  border-radius: 12px;
  padding: 10px;
}

.payment-list {
  display: grid;
  gap: 8px;
}

.payment-card {
  border-radius: 12px;
  padding: 10px;
}

.payment-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.payment-card__name {
  font-size: 0.85rem;
  font-weight: 800;
}

.payment-card__meta {
  font-size: 0.76rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.detail-description {
  font-size: 0.82rem;
  line-height: 1.5;
  color: rgba(var(--v-theme-on-surface), 0.88);
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 12px;
  padding: 10px;
}

.detail-inline-actions {
  margin-top: 14px;
}

.detail-empty {
  min-height: 100%;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.detail-empty__title {
  font-size: 0.92rem;
  font-weight: 800;
}

.detail-empty__text,
.empty-mini {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

@media (max-width: 980px) {
  .consulta-layout {
    grid-template-columns: 1fr;
  }

  .detail-shell-inline {
    position: static;
  }

  .hero-grid,
  .detail-kv-grid {
    grid-template-columns: 1fr;
  }

  .results-list {
    max-height: 360px;
  }
}

@media (max-width: 720px) {
  .consulta-header {
    padding: 12px;
  }

  .consulta-body {
    padding: 12px !important;
  }

  .result-card__top,
  .result-card__bottom,
  .detail-inline-header {
    flex-direction: column;
    align-items: stretch;
  }

  .detail-inline-actions :deep(.v-btn) {
    flex: 1 1 auto;
  }

  .consulta-subtitle,
  .detail-subtitle {
    display: none;
  }
}
</style>