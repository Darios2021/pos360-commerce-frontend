<template>
  <v-dialog
    :model-value="modelValue"
    max-width="860"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="cart-modal">
      <PosDialogHeader
        eyebrow="Carrito"
        title="Carrito actual"
        :subtitle="itemCountLabel"
        @close="emit('update:modelValue', false)"
      />

      <v-divider />

      <div class="cart-modal__body">
        <div v-if="normalizedItems.length" class="cart-modal__list">
          <div
            v-for="(item, index) in normalizedItems"
            :key="item.id || item.product_id || index"
            class="cart-item"
          >
            <div class="cart-item__main">
              <div class="cart-item__name">
                {{ item.name }}
              </div>

              <div class="cart-item__meta">
                <span v-if="item.sku">SKU: {{ item.sku }}</span>
                <span v-if="item.barcode">Cod: {{ item.barcode }}</span>
              </div>
            </div>

            <div class="cart-item__qty">
              x{{ formatQty(item.qty) }}
            </div>

            <div class="cart-item__price">
              {{ formatMoney(item.unitPrice) }}
            </div>

            <div class="cart-item__total">
              {{ formatMoney(item.lineTotal) }}
            </div>
          </div>
        </div>

        <div v-else class="cart-modal__empty">
          <v-icon size="42">mdi-cart-off</v-icon>
          <div class="cart-modal__empty-title">
            El carrito está vacío
          </div>
          <div class="cart-modal__empty-text">
            Agregá productos para poder avanzar al cobro.
          </div>
        </div>
      </div>

      <v-divider />

      <div class="cart-modal__footer">
        <div class="cart-modal__totals">
          <div class="cart-total-row">
            <span>Ítems</span>
            <strong>{{ totalQty }}</strong>
          </div>

          <div class="cart-total-row cart-total-row--grand">
            <span>Total</span>
            <strong>{{ formatMoney(totalAmountComputed) }}</strong>
          </div>
        </div>

        <div class="cart-modal__actions">
          <v-btn
            variant="outlined"
            @click="emit('update:modelValue', false)"
          >
            Cerrar
          </v-btn>

          <v-btn
            color="success"
            :disabled="!normalizedItems.length"
            @click="handleGoPay"
          >
            Ir a cobrar
          </v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
import PosDialogHeader from "./shared/PosDialogHeader.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  items: { type: Array, default: () => [] },
  totalAmount: { type: Number, default: null },
  currency: { type: String, default: "ARS" },
});

const emit = defineEmits([
  "update:modelValue",
  "go-pay",
]);

const normalizedItems = computed(() => {
  return (props.items || []).map((item, index) => {
    const qty = Number(
      item?.qty ??
      item?.quantity ??
      item?.cant ??
      1
    );

    const unitPrice = Number(
      item?.unit_price ??
      item?.unitPrice ??
      item?.price ??
      item?.precio ??
      0
    );

    const lineTotalRaw =
      item?.line_total ??
      item?.lineTotal ??
      item?.total ??
      item?.subtotal;

    const lineTotal = Number(
      lineTotalRaw ?? (qty * unitPrice)
    );

    return {
      id: item?.id ?? `row-${index}`,
      product_id: item?.product_id ?? item?.productId ?? null,
      name:
        item?.name ??
        item?.nombre ??
        item?.title ??
        item?.product_name ??
        "Producto sin nombre",
      sku: item?.sku ?? item?.code ?? item?.codigo ?? "",
      barcode: item?.barcode ?? item?.bar_code ?? "",
      qty: Number.isFinite(qty) ? qty : 1,
      unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
      lineTotal: Number.isFinite(lineTotal) ? lineTotal : 0,
    };
  });
});

const totalQty = computed(() => {
  return normalizedItems.value.reduce((acc, item) => {
    return acc + Number(item.qty || 0);
  }, 0);
});

const totalAmountComputed = computed(() => {
  if (props.totalAmount !== null && props.totalAmount !== undefined) {
    const explicit = Number(props.totalAmount);
    if (Number.isFinite(explicit)) return explicit;
  }

  return normalizedItems.value.reduce((acc, item) => {
    return acc + Number(item.lineTotal || 0);
  }, 0);
});

const itemCountLabel = computed(() => {
  const count = normalizedItems.value.length;
  if (count === 1) return "1 producto en carrito";
  return `${count} productos en carrito`;
});

function formatQty(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function formatMoney(value) {
  const n = Number(value || 0);

  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: props.currency || "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);
  } catch {
    return `$ ${Number.isFinite(n) ? n.toFixed(2) : "0.00"}`;
  }
}

function handleGoPay() {
  emit("go-pay");
  emit("update:modelValue", false);
}
</script>

<style scoped>
.cart-modal {
  border-radius: 20px;
  overflow: hidden;
}

.cart-modal__body {
  max-height: 60vh;
  overflow: auto;
  padding: 10px 18px 14px;
}

.cart-modal__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cart-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-on-surface), 0.025);
}

.cart-item__main {
  min-width: 0;
}

.cart-item__name {
  font-size: 13px;
  font-weight: 700;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
  word-break: break-word;
}

.cart-item__meta {
  margin-top: 4px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.cart-item__qty,
.cart-item__price,
.cart-item__total {
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
}

.cart-item__qty {
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.cart-item__price {
  color: rgba(var(--v-theme-on-surface), 0.8);
}

.cart-item__total {
  color: rgb(var(--v-theme-primary));
}

.cart-modal__empty {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex-direction: column;
  gap: 10px;
  color: rgba(var(--v-theme-on-surface), 0.64);
}

.cart-modal__empty-title {
  font-size: 15px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.cart-modal__empty-text {
  font-size: 13px;
}

.cart-modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px 16px;
}

.cart-modal__totals {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cart-total-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.cart-total-row--grand {
  font-size: 15px;
  color: rgb(var(--v-theme-on-surface));
}

.cart-modal__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 760px) {
  .cart-item {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .cart-item__qty,
  .cart-item__price,
  .cart-item__total {
    font-size: 12px;
  }

  .cart-modal__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .cart-modal__actions {
    width: 100%;
    justify-content: stretch;
  }

  .cart-modal__actions :deep(.v-btn) {
    flex: 1 1 auto;
  }
}
</style>