<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosProductCard.vue -->
<template>
  <v-card class="ppc" rounded="lg" elevation="1">
    <!-- Thumb -->
    <div class="ppc-thumb">
      <v-img :src="image || undefined" cover class="ppc-img">
        <template #placeholder>
          <div class="ppc-ph">
            <v-progress-circular indeterminate size="18" />
          </div>
        </template>
        <template #error>
          <div class="ppc-ph">
            <v-icon size="26">mdi-image-off-outline</v-icon>
          </div>
        </template>
      </v-img>

      <!-- badges (compactos) -->
      <div class="ppc-badges">
        <span class="ppc-badge">SKU {{ item?.sku || item?.code || "—" }}</span>
        <span class="ppc-badge">STK {{ qtyPretty(item?.qty ?? 0) }}</span>
        <span v-if="hasDiscount" class="ppc-badge ppc-badge-off">{{ offPct }}% OFF</span>
      </div>
    </div>

    <!-- Body -->
    <div class="ppc-body">
      <div class="ppc-title" :title="item?.name || ''">{{ item?.name || "—" }}</div>

      <div class="ppc-sub">
        <span class="ppc-subtxt">{{ item?.brand || "—" }}</span>
        <span class="dot">·</span>
        <span class="ppc-subtxt">{{ item?.model || "—" }}</span>
      </div>

      <div class="ppc-price">
        <div class="ppc-price-main">{{ money(priceDiscount) }}</div>
        <div class="ppc-price-sub" v-if="hasDiscount">
          <span class="muted">Lista</span>
          <span class="strike">{{ money(priceList) }}</span>
        </div>
        <div class="ppc-price-sub" v-else>
          <span class="muted">{{ priceLabel }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="ppc-actions">
      <v-btn
        icon
        size="small"
        variant="tonal"
        color="primary"
        class="ppc-btn"
        title="Agregar"
        @click.stop="emit('add', item)"
      >
        <v-icon size="18">mdi-plus</v-icon>
      </v-btn>

      <v-btn
        icon
        size="small"
        variant="tonal"
        class="ppc-btn"
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
  priceLabel: { type: String, default: "Precio" },
});

const emit = defineEmits(["add", "details"]);

function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}

function qtyPretty(n) {
  const x = toNum(n);
  return Number.isInteger(x) ? String(x) : x.toFixed(3);
}

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
</script>

<style scoped>
/* ✅ Compact POS card (safe en claro/oscuro) */
.ppc {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.ppc-thumb {
  position: relative;
  height: 92px; /* ✅ chico para ver muchas cards */
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.ppc-img {
  height: 92px;
}
.ppc-ph {
  height: 92px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.ppc-badges {
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

.ppc-badge {
  font-size: 10px;
  font-weight: 800;
  padding: 3px 7px;
  border-radius: 999px;
  background: rgba(var(--v-theme-surface), 0.92);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.14);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.ppc-badge-off {
  background: rgba(var(--v-theme-success), 0.14);
  border-color: rgba(var(--v-theme-success), 0.28);
}

.ppc-body {
  padding: 10px 10px 8px;
  display: grid;
  gap: 4px;
}

.ppc-title {
  font-weight: 950;
  font-size: 12px;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 28px;
}

.ppc-sub {
  font-size: 10.5px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ppc-subtxt {
  font-weight: 700;
}
.dot {
  margin: 0 6px;
  opacity: 0.5;
}

.ppc-price {
  display: grid;
  gap: 2px;
  margin-top: 2px;
}
.ppc-price-main {
  font-weight: 950;
  font-size: 14px;
}
.ppc-price-sub {
  font-size: 10px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  display: flex;
  gap: 6px;
  align-items: center;
}
.muted {
  opacity: 0.85;
}
.strike {
  text-decoration: line-through;
  opacity: 0.8;
}

.ppc-actions {
  padding: 8px 10px 10px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}
.ppc-btn {
  min-width: 36px;
  min-height: 36px;
}
</style>
