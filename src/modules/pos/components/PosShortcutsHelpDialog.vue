<!-- src/modules/pos/components/PosShortcutsHelpDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="620">
    <v-card rounded="xl">
      <PosDialogHeader
        eyebrow="Ayuda"
        title="Atajos del POS"
        subtitle="Teclas rapidas disponibles en toda la pantalla."
        @close="close"
      />

      <v-divider />

      <v-card-text>
        <div class="text-body-2 text-medium-emphasis mb-4">
          Estos atajos funcionan en toda la pantalla (no dependes del foco).
          Enter confirma, ESC cancela, Backspace vuelve cuando corresponde.
        </div>

        <div
          v-for="group in shortcutGroups"
          :key="group.id"
          class="psh-group"
        >
          <div class="psh-group__title">{{ group.label }}</div>

          <v-list density="compact" class="pa-0 psh-list">
            <v-list-item
              v-for="item in group.items"
              :key="item.key"
              class="psh-item"
            >
              <template #prepend>
                <v-chip size="small" variant="tonal" class="psh-chip">
                  {{ item.key }}
                </v-chip>
              </template>

              <v-list-item-title class="psh-item__title">
                {{ item.label }}
              </v-list-item-title>

              <v-list-item-subtitle class="psh-item__desc">
                {{ item.description }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <div class="psh-group">
          <div class="psh-group__title">Navegacion</div>

          <v-list density="compact" class="pa-0 psh-list">
            <v-list-item class="psh-item">
              <template #prepend>
                <v-chip size="small" variant="tonal" class="psh-chip">PgUp</v-chip>
              </template>
              <v-list-item-title class="psh-item__title">Pagina anterior</v-list-item-title>
            </v-list-item>

            <v-list-item class="psh-item">
              <template #prepend>
                <v-chip size="small" variant="tonal" class="psh-chip">PgDn</v-chip>
              </template>
              <v-list-item-title class="psh-item__title">Pagina siguiente</v-list-item-title>
            </v-list-item>

            <v-list-item class="psh-item">
              <template #prepend>
                <v-chip size="small" variant="tonal" class="psh-chip">Ctrl + K</v-chip>
              </template>
              <v-list-item-title class="psh-item__title">Ir al buscador</v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <v-alert type="info" variant="tonal" class="mt-4" density="compact">
          F1, F4 y F6 funcionan como toggle: misma tecla para abrir y cerrar.
          ESC tambien cierra cualquier ventana abierta.
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
import PosDialogHeader from "./shared/PosDialogHeader.vue";
import {
  POS_SHORTCUTS,
  groupShortcuts,
} from "../config/posShortcuts.config";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const openLocal = computed({
  get: () => !!props.modelValue,
  set: (v) => emit("update:modelValue", !!v),
});

const shortcutGroups = computed(() => groupShortcuts(POS_SHORTCUTS));

function close() {
  openLocal.value = false;
}
</script>

<style scoped>
.psh-group + .psh-group {
  margin-top: 14px;
}

.psh-group__title {
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.62);
  padding: 0 4px 6px;
}

.psh-list {
  background: transparent;
}

.psh-item {
  min-height: 40px;
  border-radius: 8px;
}

.psh-item + .psh-item {
  margin-top: 2px;
}

.psh-chip {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 500;
  margin-right: 10px;
  min-width: 52px;
  justify-content: center;
}

.psh-item__title {
  font-size: 13px;
  font-weight: 400;
}

.psh-item__desc {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.65);
}
</style>
