<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosShortcutsHelpDialog.vue -->

<template>
  <v-dialog v-model="openLocal" max-width="560" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-2">
          <v-icon>mdi-keyboard</v-icon>
          <span class="font-weight-bold">Atajos del POS</span>
        </div>

        <v-btn icon variant="text" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Estos atajos funcionan en toda la pantalla (no dependés del foco).
        </div>

        <v-list density="compact" class="pa-0">
          <v-list-item>
            <template #prepend>
              <v-chip size="small" variant="tonal" class="mr-3">F1</v-chip>
            </template>
            <v-list-item-title>Abrir esta ayuda</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-chip size="small" variant="tonal" class="mr-3">F2</v-chip>
            </template>
            <v-list-item-title>Ir al buscador</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-chip size="small" variant="tonal" class="mr-3">F8</v-chip>
            </template>
            <v-list-item-title>Cobrar</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-chip size="small" variant="tonal" class="mr-3">PgUp</v-chip>
            </template>
            <v-list-item-title>Página anterior</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-chip size="small" variant="tonal" class="mr-3">PgDn</v-chip>
            </template>
            <v-list-item-title>Página siguiente</v-list-item-title>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-chip size="small" variant="tonal" class="mr-3">Ctrl + K</v-chip>
            </template>
            <v-list-item-title>Ir al buscador (alternativo)</v-list-item-title>
          </v-list-item>
        </v-list>

        <v-alert type="info" variant="tonal" class="mt-4" density="compact">
          Tip: si el navegador te abría su ayuda con F1, ahora queda bloqueado para el POS.
        </v-alert>
      </v-card-text>

      <v-divider />

      <v-card-actions class="justify-end">
        <v-btn variant="flat" color="primary" @click="close">
          Entendido
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const openLocal = computed({
  get: () => !!props.modelValue,
  set: (v) => emit("update:modelValue", !!v),
});

function close() {
  openLocal.value = false;
}
</script>