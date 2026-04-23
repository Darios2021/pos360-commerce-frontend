<!-- src/modules/pos/components/PosBranchSwitchDialog.vue -->
<template>
  <v-dialog
    :model-value="open"
    max-width="560"
    @update:model-value="emitOpen"
  >
    <v-card class="pbs-dialog rounded-xl overflow-hidden">
      <PosDialogHeader
        eyebrow="Sucursal"
        title="Cambiar sucursal activa"
        subtitle="La sucursal activa define desde dónde operás el stock y la venta actual."
        @close="emitOpen(false)"
      />

      <v-divider />

      <v-card-text class="pbs-body pt-3">
        <v-alert
          v-if="cartCount > 0"
          type="warning"
          variant="tonal"
          density="comfortable"
          class="mb-3"
        >
          Tenés un carrito en curso. Terminá la venta o vaciá el carrito antes de cambiar sucursal.
        </v-alert>

        <v-select
          :model-value="selected"
          :items="items"
          item-title="title"
          item-value="value"
          :return-object="false"
          label="Sucursal"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          :disabled="cartCount > 0"
          @update:model-value="emitSelected"
        />
      </v-card-text>

      <v-divider />

      <v-card-actions class="pbs-actions pa-4">
        <v-btn
          variant="text"
          @click="emitOpen(false)"
        >
          Cancelar
        </v-btn>

        <v-spacer />

        <v-btn
          color="primary"
          variant="flat"
          :disabled="!selected || cartCount > 0"
          @click="$emit('confirm')"
        >
          Aplicar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import PosDialogHeader from "./shared/PosDialogHeader.vue";

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  selected: {
    type: [Number, String, null],
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  cartCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits([
  "update:open",
  "update:selected",
  "confirm",
]);

function emitOpen(value) {
  emit("update:open", !!value);
}

function emitSelected(value) {
  emit("update:selected", value);
}
</script>

<style scoped>
.pbs-dialog {
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.pbs-body {
  padding-inline: 18px;
  padding-bottom: 18px;
}

.pbs-actions {
  min-height: 68px;
}

:global(.v-theme--dark) .pbs-dialog {
  border-color: rgba(255, 255, 255, 0.08);
}
</style>