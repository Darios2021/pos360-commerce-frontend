<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosTopBar.vue -->

<template>
  <div class="ptb">
    <!-- ROW 1: título + pills -->
    <div class="ptb-row ptb-row1">
      <div class="ptb-title">
        <div class="ptb-h">Punto de Venta</div>
        <div class="ptb-sub">Productos · Carrito · Cobro</div>
      </div>

      <div class="ptb-pills" aria-label="Indicadores">
        <v-chip class="ptb-chip" size="small" variant="tonal" color="primary">
          Sucursal: <b class="ml-1">{{ branchChipLabel }}</b>
        </v-chip>

        <v-chip class="ptb-chip" size="small" variant="tonal" color="primary">
          Vendibles: <b class="ml-1">{{ sellableStockTotal }}</b>
        </v-chip>

        <v-chip class="ptb-chip" size="small" variant="tonal" color="surface-variant">
          Stock: <b class="ml-1">{{ stockOnlyTotal }}</b>
        </v-chip>

        <v-chip v-if="isViewOnly" class="ptb-chip" size="small" variant="tonal" color="amber-darken-2">
          Solo vista
        </v-chip>

        <v-chip v-if="needsBranchPick" class="ptb-chip" size="small" variant="tonal" color="deep-purple-darken-1">
          Elegí sucursal
        </v-chip>
      </div>
    </div>

    <!-- ROW 2: cajero + acciones -->
    <div class="ptb-row ptb-row2">
      <div class="ptb-cashier" title="Turno actual">
        <v-icon size="16">mdi-account-badge</v-icon>
        <span class="ptb-cashier-txt">Cajero: <b>{{ cashierName }}</b></span>
        <span class="ptb-dot">·</span>
        <v-icon size="16">mdi-clock-outline</v-icon>
        <span class="ptb-cashier-txt">Inicio: <b>{{ shiftStartText }}</b></span>
      </div>

      <div class="ptb-actions">
        <v-btn
          class="ptb-btn ptb-help"
          variant="tonal"
          density="compact"
          prepend-icon="mdi-keyboard-outline"
          @click="$emit('help')"
        >
          Atajos
        </v-btn>

        <v-btn class="ptb-btn" density="compact" variant="tonal" @click="$emit('refresh')" :loading="loadingGlobal">
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
        </v-btn>

        <v-btn
          v-if="hasMultiBranches"
          class="ptb-btn"
          density="compact"
          variant="tonal"
          @click="$emit('open-branch-switch')"
          :disabled="cartCount > 0"
          :title="cartCount > 0 ? 'Terminá o vaciá el carrito antes de cambiar sucursal' : ''"
        >
          <v-icon start>mdi-store</v-icon>
          Cambiar sucursal
        </v-btn>

        <v-btn
          class="ptb-btn ptb-pay"
          density="compact"
          color="primary"
          variant="flat"
          @click="$emit('checkout')"
          :disabled="checkoutDisabled"
        >
          <v-icon start>mdi-cash-register</v-icon>
          Cobrar <span class="ptb-fkey">(F8)</span>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  branchChipLabel: { type: String, default: "—" },
  sellableStockTotal: { type: [Number, String], default: 0 },
  stockOnlyTotal: { type: [Number, String], default: 0 },

  cashierName: { type: String, default: "—" },
  shiftStartText: { type: String, default: "—" },

  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },

  cartCount: { type: Number, default: 0 },
  checkoutDisabled: { type: Boolean, default: false },
});

defineEmits(["refresh", "open-branch-switch", "help", "checkout"]);
</script>

<style scoped>
.ptb {
  padding: 10px 12px; /* ✅ más bajo */
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);

  display: flex;
  flex-direction: column;
  gap: 8px; /* ✅ menos alto total */
  min-width: 0;
}

.ptb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

/* =========================
   ROW 1
========================= */
.ptb-row1 {
  align-items: flex-start;
}

.ptb-title {
  min-width: 220px;
  line-height: 1.05;
}

.ptb-h {
  font-size: 18px; /* ✅ antes 22 */
  line-height: 1.05;
  font-weight: 950;
  margin: 0;
}
.ptb-sub {
  font-size: 11px; /* ✅ más chico */
  line-height: 1.1;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

/* ✅ Pills: una sola línea con scroll (NO WRAP) */
.ptb-pills {
  display: flex;
  flex-wrap: nowrap;          /* ✅ clave */
  gap: 8px;
  justify-content: flex-end;
  align-items: center;

  min-width: 0;
  max-width: 62%;
  overflow-x: auto;           /* ✅ clave */
  overflow-y: hidden;
  padding-bottom: 2px;        /* evita corte del scroll */
  scrollbar-width: thin;
}

/* scrollbar suave (webkit) */
.ptb-pills::-webkit-scrollbar {
  height: 6px;
}
.ptb-pills::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 999px;
}

.ptb-chip {
  height: 24px !important; /* ✅ más bajo */
  flex: 0 0 auto;
}
.ptb-chip :deep(.v-chip__content) {
  font-size: 11.5px;
  line-height: 1;
}

/* =========================
   ROW 2
========================= */
.ptb-row2 {
  align-items: center;
}

.ptb-cashier {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 5px 10px; /* ✅ más bajito */
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);

  width: fit-content;
  max-width: 55%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ptb-cashier-txt {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.ptb-dot {
  opacity: 0.55;
}

.ptb-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;       /* ✅ no aumenta altura */
  min-width: 0;
}

.ptb-btn {
  border-radius: 14px !important;
  height: 34px !important; /* ✅ antes 38 */
  padding: 0 12px !important;
  font-size: 12.5px !important;
  flex: 0 0 auto;
}

.ptb-help {
  border-radius: 999px !important;
}

.ptb-pay {
  height: 34px !important;
  font-weight: 900;
}

.ptb-fkey {
  margin-left: 6px;
  font-weight: 800;
  opacity: 0.85;
}

/* =========================
   Responsive
========================= */
@media (max-width: 1200px) {
  .ptb-pills {
    max-width: 58%;
  }
  .ptb-cashier {
    max-width: 50%;
  }
}

@media (max-width: 960px) {
  .ptb {
    padding: 10px 12px;
  }

  .ptb-row {
    flex-wrap: wrap;
  }

  .ptb-pills {
    max-width: 100%;
    width: 100%;
    justify-content: flex-start;
  }

  .ptb-cashier {
    max-width: 100%;
    width: 100%;
  }

  .ptb-actions {
    width: 100%;
    flex-wrap: wrap; /* en mobile sí, pero controlado */
    justify-content: stretch;
  }

  .ptb-btn {
    flex: 1 1 auto;
  }

  .ptb-pay {
    flex: 1 1 100%;
  }
}
</style>