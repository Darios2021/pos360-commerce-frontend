<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosTopBar.vue -->
<template>
  <div class="ptb">
    <!-- TOP: título + pills -->
    <div class="ptb-top">
      <div class="ptb-title">
        <div class="text-h5 font-weight-bold">Punto de Venta</div>
        <div class="text-caption text-medium-emphasis">Productos · Carrito · Cobro</div>
      </div>

      <div class="ptb-pills">
        <v-chip size="small" variant="tonal" color="primary">
          Sucursal activa: <b class="ml-1">{{ branchChipLabel }}</b>
        </v-chip>

        <v-chip size="small" variant="tonal" color="primary">
          Vendibles: <b class="ml-1">{{ sellableStockTotal }}</b>
        </v-chip>

        <v-chip size="small" variant="tonal" color="surface-variant">
          Stock total: <b class="ml-1">{{ stockOnlyTotal }}</b>
        </v-chip>

        <v-chip v-if="isViewOnly" size="small" variant="tonal" color="amber-darken-2">
          Solo vista (sin permiso POS)
        </v-chip>

        <v-chip v-if="needsBranchPick" size="small" variant="tonal" color="deep-purple-darken-1">
          Elegí sucursal activa para operar
        </v-chip>
      </div>
    </div>

    <!-- MID: cajero + atajos -->
    <div class="ptb-mid">
      <div class="ptb-cashier">
        <v-icon size="16">mdi-account-badge</v-icon>
        <span class="ptb-cashier-txt">Cajero: <b>{{ cashierName }}</b></span>
        <span class="ptb-dot">·</span>
        <v-icon size="16">mdi-clock-outline</v-icon>
        <span class="ptb-cashier-txt">Inicio caja: <b>{{ shiftStartText }}</b></span>
      </div>

      <!-- ✅ ÚNICO botón de ayuda/atajos -->
      <v-btn
        class="ptb-shortcuts"
        variant="tonal"
        density="comfortable"
        prepend-icon="mdi-keyboard-outline"
        @click="$emit('help')"
      >
        Atajos
      </v-btn>
    </div>

    <!-- ACTIONS -->
    <div class="ptb-actions">
      <v-btn class="ptb-btn" variant="tonal" @click="$emit('refresh')" :loading="loadingGlobal">
        <v-icon start>mdi-refresh</v-icon>
        Actualizar
      </v-btn>

      <v-btn
        v-if="hasMultiBranches"
        class="ptb-btn"
        variant="tonal"
        @click="$emit('open-branch-switch')"
        :disabled="cartCount > 0"
        :title="cartCount > 0 ? 'Terminá o vaciá el carrito antes de cambiar sucursal' : ''"
      >
        <v-icon start>mdi-store</v-icon>
        Cambiar sucursal
      </v-btn>

      <!-- ❌ Sacado AYUDA para no duplicar con ATAJOS -->

      <v-btn
        class="ptb-btn ptb-pay"
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
</template>

<script setup>
defineProps({
  // chips
  branchChipLabel: { type: String, default: "—" },
  sellableStockTotal: { type: [Number, String], default: 0 },
  stockOnlyTotal: { type: [Number, String], default: 0 },

  // cashier
  cashierName: { type: String, default: "—" },
  shiftStartText: { type: String, default: "—" },

  // states
  isViewOnly: { type: Boolean, default: false },
  needsBranchPick: { type: Boolean, default: false },
  hasMultiBranches: { type: Boolean, default: false },
  loadingGlobal: { type: Boolean, default: false },

  // cart
  cartCount: { type: Number, default: 0 },
  checkoutDisabled: { type: Boolean, default: false },
});

defineEmits(["refresh", "open-branch-switch", "help", "checkout"]);
</script>

<style scoped>
.ptb {
  padding: 14px;
  border-radius: 18px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* top row */
.ptb-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.ptb-title {
  min-width: 260px;
}
.ptb-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

/* mid row */
.ptb-mid {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.ptb-cashier {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  width: fit-content;
}
.ptb-cashier-txt {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.ptb-dot {
  opacity: 0.55;
}
.ptb-shortcuts {
  border-radius: 999px;
}

/* actions row */
.ptb-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.ptb-btn {
  border-radius: 12px;
  height: 40px;
}
.ptb-pay {
  height: 40px;
  font-weight: 800;
}
.ptb-fkey {
  margin-left: 6px;
  font-weight: 700;
  opacity: 0.85;
}

@media (max-width: 960px) {
  .ptb-actions {
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