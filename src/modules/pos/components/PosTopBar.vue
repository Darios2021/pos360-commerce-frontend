<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosTopBar.vue -->
<template>
  <div class="pos-top d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
    <div>
      <div class="text-h5 font-weight-bold">Punto de Venta</div>
      <div class="text-caption text-medium-emphasis">Productos · Carrito · Cobro</div>

      <div class="d-flex flex-wrap ga-2 mt-2">
        <v-chip size="small" variant="tonal" color="primary">
          Sucursal: {{ branchName || `Sucursal #${branchId ?? "—"}` }}
        </v-chip>

        <v-chip size="small" variant="tonal" color="primary">
          Productos listos para vender: {{ sellableCount }}
        </v-chip>

        <v-chip v-if="isAdmin" size="small" variant="tonal" color="amber-darken-2">
          Admin: solo vista (no puede vender)
        </v-chip>

        <v-chip v-if="ctxError" size="small" variant="tonal" color="red">
          {{ ctxError }}
        </v-chip>

        <v-chip size="small" variant="tonal" color="grey">
          F1 Ayuda · F2 Buscar · F8 Cobrar · PgUp/PgDn Páginas
        </v-chip>
      </div>

      <div class="pos-cashier mt-2">
        <v-icon size="16">mdi-account-badge</v-icon>
        <span class="pos-cashier-txt">
          Cajero: <b>{{ cashierName }}</b>
        </span>
        <span class="pos-dot">·</span>
        <v-icon size="16">mdi-clock-outline</v-icon>
        <span class="pos-cashier-txt">
          Inicio caja: <b>{{ shiftStartText }}</b>
        </span>
      </div>
    </div>

    <div class="d-flex ga-2 align-center">
      <v-btn variant="tonal" @click="$emit('refresh')" :loading="loadingList">
        <v-icon start>mdi-refresh</v-icon>
        Actualizar
      </v-btn>

      <v-btn variant="tonal" @click="$emit('help')">
        <v-icon start>mdi-help-circle-outline</v-icon>
        Ayuda
      </v-btn>

      <v-btn
        color="primary"
        @click="$emit('checkout')"
        :disabled="cartCount === 0 || !canSell"
        :title="!canSell ? 'El usuario admin no puede vender' : ''"
      >
        <v-icon start>mdi-cash-register</v-icon>
        Cobrar
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  branchName: { type: String, default: "" },
  branchId: { type: [Number, String], default: null },
  sellableCount: { type: Number, default: 0 },
  isAdmin: { type: Boolean, default: false },
  canSell: { type: Boolean, default: true },
  ctxError: { type: String, default: "" },
  cashierName: { type: String, default: "—" },
  shiftStartText: { type: String, default: "" },
  loadingList: { type: Boolean, default: false },
  cartCount: { type: Number, default: 0 },
});
defineEmits(["refresh", "checkout", "help"]);
</script>

<style scoped>
.pos-cashier {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  width: fit-content;
}
.pos-cashier-txt {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.pos-dot {
  opacity: 0.55;
}
</style>