<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosTopBar.vue -->

<template>
  <div class="ptb">
    <!-- ROW 1: título + pills (solo lo esencial) -->
    <div class="ptb-row ptb-row1">
      <div class="ptb-title">
        <div class="ptb-h">
          Punto de Venta
          <span class="ptb-badge" v-if="isViewOnly">Solo vista</span>
          <span class="ptb-badge warn" v-else-if="needsBranchPick">Elegí sucursal</span>
        </div>
      </div>

      <div class="ptb-pills" aria-label="Indicadores">
        <!-- ✅ este está OK -->
        <v-chip class="ptb-chip ptb-chip-branch" size="small" variant="tonal" color="primary">
          <v-icon start size="16">mdi-store</v-icon>
          Sucursal: <b class="ml-1">{{ branchChipLabel }}</b>
        </v-chip>

        <!-- ❌ sacamos “Vendibles/Stock” porque confunde -->
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

        <!-- ✅ COBRAR: lo sacamos (ya está abajo) -->
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  branchChipLabel: { type: String, default: "—" },

  // (se mantienen por compatibilidad aunque ya no se muestran)
  sellableStockTotal: { type: [Number, String], default: 0 },
  stockOnlyTotal: { type: [Number, String], default: 0 },

  cashierName: { type: String, default: "—" },
  shiftStartText: { type: String, default: "—" },

  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },

  cartCount: { type: Number, default: 0 },

  // (se mantiene por compatibilidad aunque ya no hay botón)
  checkoutDisabled: { type: Boolean, default: false },
});

defineEmits(["refresh", "open-branch-switch", "help", "checkout"]);
</script>

<style scoped>
.ptb {
  padding: 10px 12px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);

  display: flex;
  flex-direction: column;
  gap: 8px;
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
  align-items: center;
}

.ptb-title {
  min-width: 220px;
  min-width: 0;
}

.ptb-h {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  line-height: 1.05;
  font-weight: 950;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* badge tipo “pill” */
.ptb-badge {
  font-size: 11px;
  font-weight: 900;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.75);
  flex: 0 0 auto;
}

.ptb-badge.warn {
  background: rgba(var(--v-theme-primary), 0.08);
  border-color: rgba(var(--v-theme-primary), 0.22);
  color: rgb(var(--v-theme-primary));
}

/* Pills: limpio, sin “vendibles/stock” */
.ptb-pills {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;

  min-width: 0;
  max-width: 62%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
  scrollbar-width: thin;
}

.ptb-pills::-webkit-scrollbar {
  height: 6px;
}
.ptb-pills::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 999px;
}

.ptb-chip {
  height: 26px !important;
  flex: 0 0 auto;
}
.ptb-chip :deep(.v-chip__content) {
  font-size: 12px;
  line-height: 1;
}

.ptb-chip-branch {
  border-radius: 999px !important;
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

  padding: 6px 12px;
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
  font-size: 12.5px;
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
  flex-wrap: nowrap;
  min-width: 0;
}

.ptb-btn {
  border-radius: 14px !important;
  height: 34px !important;
  padding: 0 12px !important;
  font-size: 12.5px !important;
  flex: 0 0 auto;
}

.ptb-help {
  border-radius: 999px !important;
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
    flex-wrap: wrap;
    justify-content: stretch;
  }

  .ptb-btn {
    flex: 1 1 auto;
  }
}
</style>