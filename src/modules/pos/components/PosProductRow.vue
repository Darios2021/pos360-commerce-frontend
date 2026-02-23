<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosProductRow.vue -->
<template>
  <div
    class="prow"
    :class="{ disabled }"
    tabindex="0"
    role="button"
    @click="onRowClick"
    @dblclick.stop="$emit('add', item)"
    @keyup.enter.stop="$emit('add', item)"
  >
    <!-- IMAGE -->
    <div class="prow-img">
      <v-img v-if="image" :src="image" class="img" cover />
      <div v-else class="noimg">
        <v-icon size="28">mdi-package-variant</v-icon>
      </div>
    </div>

    <!-- MAIN -->
    <div class="prow-main">
      <div class="prow-title" :title="name">{{ name }}</div>

      <div class="prow-meta">
        <span v-if="sku" class="pill dark">SKU {{ sku }}</span>

        <span v-if="stkLabel" class="pill" :class="stockClass">
          {{ stkLabel }}
        </span>

        <span v-if="offLabel" class="pill green">{{ offLabel }}</span>

        <span v-if="rubroLabel" class="meta">{{ rubroLabel }}</span>
        <span v-if="subrubroLabel" class="meta">· {{ subrubroLabel }}</span>
      </div>
    </div>

    <!-- PRICE -->
    <div class="prow-price">
      <div class="price-main">{{ money(priceDiscount) }}</div>
      <div v-if="priceList && priceList > priceDiscount" class="price-list">
        {{ money(priceList) }}
      </div>
    </div>

    <!-- ACTIONS -->
    <div class="prow-actions">
      <v-btn
        class="btn-add"
        color="primary"
        size="small"
        :disabled="disabled"
        @click.stop="$emit('add', item)"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <v-btn
        class="btn-eye"
        variant="tonal"
        size="small"
        :disabled="disabled"
        @click.stop="$emit('details', item)"
      >
        <v-icon>mdi-eye</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  item: { type: Object, required: true },
  image: { type: String, default: "" },
  name: { type: String, default: "" },
  sku: { type: String, default: "" },
  stkLabel: { type: String, default: "" },
  offLabel: { type: String, default: "" },
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },
  priceDiscount: { type: Number, default: 0 },
  priceList: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
});

defineEmits(["add", "details"]);

function money(val) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(Number(val || 0));
}

/* stock color dinámico (lee número de "STK 3" o "STK: 3") */
const stockClass = computed(() => {
  if (!props.stkLabel) return "";
  const m = String(props.stkLabel).match(/(\d+([.,]\d+)?)/);
  const num = Number((m?.[1] || "0").replace(",", ".")) || 0;

  if (num <= 0) return "red";
  if (num <= 3) return "orange";
  return "green-soft";
});

function onRowClick() {
  if (props.disabled) return;
  // (click solo foco/feedback; el add lo dejamos en + / dblclick / enter)
}
</script>

<style scoped>
/* =========================
   ROW BASE (estética "carrito")
   Objetivo: ~4 filas visibles
========================= */
.prow {
  display: grid;
  grid-template-columns: 92px 1fr auto auto; /* imagen grande */
  gap: 14px;
  align-items: center;

  padding: 12px 14px;
  border-radius: 18px;

  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);

  /* sombra tipo card como carrito */
  box-shadow:
    0 8px 22px rgba(0,0,0,0.06),
    0 22px 52px rgba(0,0,0,0.08);

  transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, background 160ms ease;
  cursor: pointer;
}

/* hover azul theme (sin “reventar” visualmente) */
.prow:hover {
  background: rgba(var(--v-theme-primary), 0.06);
  border-color: rgba(var(--v-theme-primary), 0.28);

  box-shadow:
    0 12px 26px rgba(var(--v-theme-primary), 0.14),
    0 28px 64px rgba(0,0,0,0.10);

  transform: translateY(-1px);
}

/* focus accesible */
.prow:focus {
  outline: none;
  box-shadow:
    0 0 0 4px rgba(var(--v-theme-primary), 0.25),
    0 12px 26px rgba(0,0,0,0.10);
}

.prow.disabled {
  opacity: 0.58;
  pointer-events: none;
  cursor: default;
}

/* =========================
   IMAGE
========================= */
.prow-img {
  width: 92px;
  height: 74px;
  border-radius: 16px;
  overflow: hidden;

  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.img {
  width: 92px !important;
  height: 74px !important;
}

.noimg {
  display: grid;
  place-items: center;
  height: 100%;
  color: rgba(var(--v-theme-on-surface), 0.52);
}

/* =========================
   TITLE + META
========================= */
.prow-title {
  font-weight: 950;
  font-size: 13.5px;
  line-height: 1.2;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.prow-meta {
  margin-top: 6px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* =========================
   PILLS
========================= */
.pill {
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 999px;
  white-space: nowrap;
  font-weight: 800;
}

.pill.dark {
  background: rgba(0, 0, 0, 0.86);
  color: #fff;
}

.pill.green {
  background: rgba(16, 185, 129, 0.95);
  color: #fff;
}

.pill.green-soft {
  background: rgba(34, 197, 94, 0.14);
  color: rgba(34, 197, 94, 1);
}

.pill.orange {
  background: rgba(251, 146, 60, 0.15);
  color: rgba(251, 146, 60, 1);
}

.pill.red {
  background: rgba(239, 68, 68, 0.15);
  color: rgba(239, 68, 68, 1);
}

.meta {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  white-space: nowrap;
}

/* =========================
   PRICE
========================= */
.prow-price {
  text-align: right;
  padding-right: 6px;
}

.price-main {
  font-weight: 1000;
  font-size: 18px;
  white-space: nowrap;
}

.price-list {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  text-decoration: line-through;
  white-space: nowrap;
}

/* =========================
   ACTIONS
========================= */
.prow-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-add,
.btn-eye {
  min-width: 46px !important;
  width: 46px !important;
  height: 46px !important;
  padding: 0 !important;
  border-radius: 16px !important;
}

/* un poquito más de “peso” al + */
.btn-add {
  box-shadow: 0 8px 18px rgba(0,0,0,0.12);
}
.btn-add:hover {
  box-shadow: 0 12px 26px rgba(0,0,0,0.18);
}

/* responsive */
@media (max-width: 960px) {
  .prow {
    grid-template-columns: 84px 1fr auto;
  }
  .prow-actions {
    gap: 8px;
  }
  .btn-eye {
    display: none;
  }
}
</style>