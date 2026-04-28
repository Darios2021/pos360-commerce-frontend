<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosProductCard.vue -->
<template>
  <v-card class="pc" rounded="xl" elevation="1">
    <!-- THUMB -->
    <div class="pc-thumb" @click.stop="emit('details', item)">
      <v-img :src="image || undefined" cover class="pc-img" height="92">
        <template #placeholder>
          <div class="pc-ph">
            <v-progress-circular indeterminate size="18" />
          </div>
        </template>
        <template #error>
          <div class="pc-ph">
            <v-icon size="22">mdi-image-off-outline</v-icon>
          </div>
        </template>
      </v-img>

      <!-- TOP BAR: SKU + STK (una sola barra) -->
      <div class="pc-topbar">
        <span class="pc-pill">{{ skuText }}</span>
        <span class="pc-pill">{{ stockText }}</span>

        <span v-if="offPct > 0" class="pc-pill pc-off">{{ offPct }}% OFF</span>
      </div>
    </div>

    <!-- BODY -->
    <div class="pc-body">
      <div class="pc-title" :title="item?.name || ''">{{ item?.name || "—" }}</div>

      <div class="pc-sub" v-if="brandModel">
        {{ brandModel }}
      </div>

      <!-- PRICE -->
      <div class="pc-price">
        <div class="pc-price-main">
          {{ money(priceDiscount) }}
        </div>

        <div class="pc-price-meta">
          <span v-if="hasDiscount" class="pc-list">
            {{ money(priceList) }}
          </span>
          <span v-else class="pc-muted">{{ priceLabel || "Precio" }}</span>
        </div>
      </div>
    </div>

    <!-- ACTIONS (compact vertical) -->
    <div class="pc-actions">
      <v-btn
        class="pc-add"
        color="primary"
        variant="flat"
        size="small"
        title="Agregar"
        @click.stop="emit('add', item)"
      >
        <v-icon size="18">mdi-plus</v-icon>
      </v-btn>

      <v-btn
        class="pc-eye"
        variant="tonal"
        size="small"
        title="Detalle"
        @click.stop="emit('details', item)"
      >
        <v-icon size="18">mdi-eye-outline</v-icon>
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  item: { type: Object, required: true },
  image: { type: String, default: "" },
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },
  priceDiscount: { type: [Number, String], default: 0 },
  priceList: { type: [Number, String], default: 0 },
  priceLabel: { type: String, default: "Descuento" },
});

const emit = defineEmits(["add", "details"]);

function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(val));
}

const skuText = computed(() => {
  const sku = props.item?.sku || props.item?.code || "—";
  return `SKU ${String(sku).slice(0, 12)}`;
});

const stockText = computed(() => {
  const q = toNum(props.item?.qty ?? 0);
  return `STK ${Number.isInteger(q) ? q : q.toFixed(0)}`;
});

const hasDiscount = computed(() => {
  const l = toNum(props.priceList);
  const d = toNum(props.priceDiscount);
  return l > 0 && d > 0 && d < l;
});

const offPct = computed(() => {
  const l = toNum(props.priceList);
  const d = toNum(props.priceDiscount);
  if (!(l > 0 && d > 0 && d < l)) return 0;
  return Math.round(((l - d) / l) * 100);
});

const brandModel = computed(() => {
  const b = String(props.item?.brand || "").trim();
  const m = String(props.item?.model || "").trim();
  if (!b && !m) return "";
  if (b && m) return `${b} · ${m}`;
  return b || m;
});
</script>

<style scoped>
/* ✅ POS card: legible, sin romper precios */
.pc {
  display: grid;
  grid-template-columns: 1fr 46px; /* acciones a la derecha */
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
  /* Contorno estático que NO puede ser pisado por Vuetify.
     Usamos inset box-shadow que respeta el border-radius. */
  box-shadow: inset 0 0 0 1.5px #64748b !important;  /* slate-500 */
}

/* thumb */
.pc-thumb {
  grid-column: 1 / -1;
  position: relative;
  cursor: pointer;
}
.pc-img {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}
.pc-ph {
  height: 92px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgba(var(--v-theme-on-surface), 0.55);
}

/* top bar pills (una sola fila) */
.pc-topbar {
  position: absolute;
  left: 6px;
  right: 6px;
  top: 6px;
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  overflow: hidden;
}
.pc-pill {
  font-size: 10px;
  font-weight: 500;
  padding: 3px 7px;
  border-radius: 999px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  white-space: nowrap;
}
.pc-off {
  background: rgba(16, 185, 129, 0.85);
}

/* body */
.pc-body {
  grid-column: 1 / 2;
  padding: 8px 8px 10px;
  min-width: 0;
}

.pc-title {
  font-weight: 500;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 28px;
}

.pc-sub {
  margin-top: 2px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pc-price {
  margin-top: 6px;
}
.pc-price-main {
  font-weight: 500;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap; /* ✅ NO se corta */
}
.pc-price-meta {
  margin-top: 3px;
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  white-space: nowrap;
}
.pc-list {
  text-decoration: line-through;
  opacity: 0.85;
}
.pc-muted {
  opacity: 0.85;
}

/* actions */
.pc-actions {
  grid-column: 2 / 3;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 8px 10px 0;
  align-items: stretch;
  justify-content: flex-end;
}
.pc-add,
.pc-eye {
  min-width: 38px;
  min-height: 34px;
  padding: 0;
}

/* ultra compact: reduce thumb */
@media (max-width: 600px) {
  .pc-img,
  .pc-ph {
    height: 86px;
  }
}
</style>