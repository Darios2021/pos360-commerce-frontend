<template>
  <v-card class="ppc-card" rounded="xl" elevation="1">
    <!-- Imagen + badges -->
    <div class="ppc-thumb">
      <v-img :src="image || undefined" cover class="ppc-img" height="150">
        <template #placeholder>
          <div class="ppc-thumb-empty">
            <v-progress-circular indeterminate size="24" />
          </div>
        </template>
        <template #error>
          <div class="ppc-thumb-empty">
            <v-icon size="34">mdi-image-off-outline</v-icon>
          </div>
        </template>
      </v-img>

      <!-- ✅ Barra badges (SIEMPRE visible) -->
      <div class="ppc-badges-bar">
        <v-chip size="x-small" variant="flat" class="ppc-chip">
          SKU: <b class="ml-1">{{ item?.sku || item?.code || "—" }}</b>
        </v-chip>

        <v-chip size="x-small" variant="flat" class="ppc-chip">
          Stock: <b class="ml-1">{{ qty3(item?.qty ?? 0) }}</b>
        </v-chip>

        <v-chip v-if="hasDiscount" size="x-small" variant="flat" class="ppc-chip-off">
          <v-icon start size="14">mdi-tag-outline</v-icon>
          {{ offPct }}% OFF
        </v-chip>
      </div>
    </div>

    <!-- Info -->
    <v-card-text class="ppc-body">
      <div class="ppc-title line-clamp-2" :title="item?.name || ''">
        {{ item?.name || "—" }}
      </div>

      <div class="ppc-meta">
        <div class="ppc-row">
          <span class="muted">Marca:</span> <b>{{ item?.brand || "—" }}</b>
          <span class="dot">·</span>
          <span class="muted">Modelo:</span> <b>{{ item?.model || "—" }}</b>
        </div>

        <div class="ppc-row">
          <span class="muted">Rubro:</span> <b>{{ rubro || "—" }}</b>
          <span class="dot">·</span>
          <span class="muted">Subrubro:</span> <b>{{ subrubro || "—" }}</b>
        </div>
      </div>

      <!-- ✅ PRECIOS: principal = descuento -->
      <div class="ppc-price-row">
        <div class="d-flex flex-column">
          <div class="ppc-price">{{ money(priceDiscount) }}</div>

          <div v-if="hasDiscount" class="ppc-price-sub">
            <span class="muted">Lista:</span>
            <span class="ppc-strike">{{ money(priceList) }}</span>
          </div>
          <div v-else class="ppc-price-sub">
            <span class="muted">Precio:</span>
            <span class="muted">{{ priceLabel }}</span>
          </div>
        </div>

        <v-chip size="small" variant="tonal">
          {{ hasDiscount ? "Descuento" : priceLabel }}
        </v-chip>
      </div>
    </v-card-text>

    <!-- Acciones (icono) -->
    <v-card-actions class="ppc-actions">
      <v-btn
        icon
        size="large"
        variant="tonal"
        color="primary"
        class="ppc-action-btn"
        title="Agregar"
        @click.stop="emit('add', item)"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>

      <v-spacer />

      <v-btn
        icon
        size="large"
        variant="tonal"
        class="ppc-action-btn"
        title="Ver detalle"
        @click.stop="emit('details', item)"
      >
        <v-icon>mdi-eye-outline</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  item: { type: Object, required: true },
  image: { type: String, default: "" },
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },

  // ✅ ahora la card recibe descuento + lista (y muestra descuento como principal)
  priceDiscount: { type: [Number, String], default: 0 },
  priceList: { type: [Number, String], default: 0 },
  priceLabel: { type: String, default: "Precio" },
});

const emit = defineEmits(["add", "details"]);

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function qty3(n) {
  return Number(n || 0).toFixed(3);
}
function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const rubro = computed(() => String(props.rubroLabel || "").trim());
const subrubro = computed(() => String(props.subrubroLabel || "").trim());

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
.ppc-card {
  overflow: hidden;
  border-radius: 18px;

  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.04);

  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.ppc-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(var(--v-theme-primary), 0.35);
}

.ppc-thumb {
  position: relative;
  height: 150px;
  background: rgba(0, 0, 0, 0.25);
}

.ppc-img {
  height: 150px;
}

.ppc-badges-bar {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 10px;

  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  padding: 8px 10px;
  border-radius: 999px;

  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  z-index: 5;
}

.ppc-chip {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  font-weight: 600;
}

.ppc-chip-off {
  color: #fff !important;
  background: rgba(0, 200, 83, 0.18) !important;
  border: 1px solid rgba(0, 200, 83, 0.35) !important;
  font-weight: 800;
}

.ppc-body {
  padding-top: 14px !important;
  padding-bottom: 12px !important;
}

.ppc-title {
  font-weight: 900;
  font-size: 13.5px;
  line-height: 1.25;
  min-height: 34px;
  color: #fff;
}

.ppc-meta {
  margin-top: 10px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.72);
}

.ppc-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.muted {
  color: rgba(255, 255, 255, 0.55);
}

.dot {
  margin: 0 6px;
  opacity: 0.5;
}

.ppc-price-row {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ppc-price {
  font-weight: 900;
  font-size: 17px;
  color: #fff;
}

.ppc-price-sub {
  font-size: 11px;
  margin-top: 2px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.ppc-strike {
  text-decoration: line-through;
  opacity: 0.85;
}

.ppc-actions {
  padding: 12px;
  gap: 12px;
}

.ppc-action-btn {
  min-width: 52px;
  min-height: 52px;

  background: rgba(255, 255, 255, 0.08) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
}

.ppc-action-btn:hover {
  background: rgba(var(--v-theme-primary), 0.25) !important;
  border-color: rgba(var(--v-theme-primary), 0.6) !important;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
