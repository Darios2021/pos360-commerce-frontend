<template>
  <div class="ptb">
    <!-- ROW 1 -->
    <div class="ptb-row ptb-row1">
      <div class="ptb-title-wrap">
        <div class="ptb-h">
          <span class="ptb-title-text">Punto de Venta</span>

          <span class="ptb-badge" v-if="isViewOnly">Solo vista</span>
          <span class="ptb-badge warn" v-else-if="needsBranchPick">Elegí sucursal</span>
        </div>
      </div>

      <div class="ptb-pills" aria-label="Indicadores">
        <v-chip class="ptb-chip ptb-chip-branch" size="small" variant="tonal" color="primary">
          <v-icon start size="14">mdi-store</v-icon>
          <span class="ptb-chip-label">Sucursal:</span>
          <b class="ml-1">{{ branchChipLabel }}</b>
        </v-chip>
      </div>
    </div>

    <!-- ROW 2 -->
    <div class="ptb-row ptb-row2">
      <div class="ptb-cashier" title="Turno actual">
        <v-icon size="14">mdi-account-badge</v-icon>
        <span class="ptb-cashier-txt">Cajero: <b>{{ cashierName }}</b></span>

        <span class="ptb-dot">·</span>

        <v-icon size="14">mdi-clock-outline</v-icon>
        <span class="ptb-cashier-txt">Inicio: <b>{{ shiftStartText }}</b></span>
      </div>

      <div class="ptb-actions">
        <v-btn
          class="ptb-btn ptb-btn-soft ptb-help"
          variant="tonal"
          density="compact"
          prepend-icon="mdi-keyboard-outline"
          @click="$emit('help')"
        >
          Atajos
        </v-btn>

        <v-btn
          class="ptb-btn ptb-btn-soft"
          density="compact"
          variant="tonal"
          @click="$emit('refresh')"
          :loading="loadingGlobal"
        >
          <v-icon start size="16">mdi-refresh</v-icon>
          Actualizar
        </v-btn>

        <v-btn
          v-if="hasMultiBranches"
          class="ptb-btn ptb-btn-soft"
          density="compact"
          variant="tonal"
          @click="$emit('open-branch-switch')"
          :disabled="cartCount > 0"
          :title="cartCount > 0 ? 'Terminá o vaciá el carrito antes de cambiar sucursal' : ''"
        >
          <v-icon start size="16">mdi-store</v-icon>
          Cambiar sucursal
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  branchChipLabel: { type: String, default: "—" },

  // compat
  sellableStockTotal: { type: [Number, String], default: 0 },
  stockOnlyTotal: { type: [Number, String], default: 0 },

  cashierName: { type: String, default: "—" },
  shiftStartText: { type: String, default: "—" },

  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },

  cartCount: { type: Number, default: 0 },

  // compat
  checkoutDisabled: { type: Boolean, default: false },
});

defineEmits(["refresh", "open-branch-switch", "help", "checkout"]);
</script>

<style scoped>
.ptb {
  position: relative;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  padding: 10px 12px;
  border-radius: 16px;

  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 0.98) 0%, rgba(var(--v-theme-surface), 1) 100%);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow:
    0 8px 22px rgba(15, 23, 42, 0.06),
    0 2px 6px rgba(15, 23, 42, 0.04);
}

.ptb::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

:global(.v-theme--light) .ptb {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-surface), 0.99) 100%);
  border-color: rgba(var(--v-theme-on-surface), 0.09);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.07),
    0 2px 8px rgba(15, 23, 42, 0.04);
}

:global(.v-theme--dark) .ptb {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.28),
    0 2px 8px rgba(0, 0, 0, 0.18);
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
  min-height: 28px;
}

.ptb-title-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.ptb-h {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ptb-title-text {
  font-size: 14px;
  line-height: 1.1;
  font-weight: 900;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ptb-badge {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;

  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.02em;

  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.11);
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.ptb-badge.warn {
  background: rgba(var(--v-theme-primary), 0.10);
  border-color: rgba(var(--v-theme-primary), 0.22);
  color: rgb(var(--v-theme-primary));
}

.ptb-pills {
  flex: 0 1 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  min-width: 0;
  max-width: 52%;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 1px;
  scrollbar-width: thin;
}

.ptb-pills::-webkit-scrollbar {
  height: 5px;
}

.ptb-pills::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 999px;
}

.ptb-chip {
  height: 24px !important;
  min-height: 24px !important;
  border-radius: 999px !important;
  flex: 0 0 auto;
}

.ptb-chip :deep(.v-chip__content) {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
}

.ptb-chip-label {
  opacity: 0.78;
}

/* =========================
   ROW 2
========================= */
.ptb-row2 {
  align-items: center;
}

.ptb-cashier {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 52%;

  display: inline-flex;
  align-items: center;
  gap: 7px;

  padding: 6px 10px;
  border-radius: 999px;

  background: rgba(var(--v-theme-on-surface), 0.035);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
}

.ptb-cashier-txt {
  min-width: 0;
  font-size: 11.5px;
  line-height: 1;
  color: rgba(var(--v-theme-on-surface), 0.84);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ptb-dot {
  opacity: 0.45;
  font-size: 12px;
  line-height: 1;
}

.ptb-actions {
  flex: 1 1 auto;
  min-width: 0;

  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: nowrap;
}

.ptb-btn {
  flex: 0 0 auto;
  height: 30px !important;
  min-height: 30px !important;
  padding: 0 10px !important;
  border-radius: 12px !important;
  font-size: 11.5px !important;
  font-weight: 800 !important;
  letter-spacing: 0.01em;
  text-transform: none !important;
}

.ptb-btn-soft {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.ptb-help {
  border-radius: 999px !important;
}

/* =========================
   NOTEBOOK / SMALL DESKTOP
========================= */
@media (max-width: 1366px) {
  .ptb {
    padding: 9px 10px;
    gap: 8px;
  }

  .ptb-title-text {
    font-size: 13px;
  }

  .ptb-pills {
    max-width: 48%;
  }

  .ptb-cashier {
    max-width: 48%;
  }

  .ptb-btn {
    height: 28px !important;
    min-height: 28px !important;
    padding: 0 9px !important;
    font-size: 11px !important;
  }
}

@media (max-width: 1180px) {
  .ptb-row {
    gap: 8px;
  }

  .ptb-pills {
    max-width: 44%;
  }

  .ptb-cashier {
    max-width: 44%;
  }

  .ptb-chip {
    height: 22px !important;
    min-height: 22px !important;
  }

  .ptb-chip :deep(.v-chip__content) {
    font-size: 10.5px;
  }

  .ptb-cashier-txt {
    font-size: 11px;
  }
}

/* =========================
   TABLET / MOBILE
========================= */
@media (max-width: 960px) {
  .ptb {
    padding: 10px;
    border-radius: 14px;
  }

  .ptb-row {
    flex-wrap: wrap;
  }

  .ptb-pills,
  .ptb-cashier,
  .ptb-actions {
    width: 100%;
    max-width: 100%;
  }

  .ptb-pills {
    justify-content: flex-start;
  }

  .ptb-actions {
    flex-wrap: wrap;
    justify-content: stretch;
  }

  .ptb-btn {
    flex: 1 1 calc(50% - 4px);
  }
}

@media (max-width: 600px) {
  .ptb-title-text {
    font-size: 13px;
  }

  .ptb-badge {
    font-size: 9.5px;
    padding: 0 7px;
    min-height: 20px;
  }

  .ptb-cashier {
    padding: 6px 9px;
  }

  .ptb-btn {
    flex: 1 1 100%;
  }
}
</style>