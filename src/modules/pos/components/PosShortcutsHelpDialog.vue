<!-- src/modules/pos/components/PosShortcutsHelpDialog.vue -->
<!--
  Dialog de Ayuda del POS (F1).

  Estructura:
   1. Header brand con icon + título.
   2. CTA destacado para abrir el tour interactivo (banner brand).
   3. Grid de atajos agrupados por categoría.
   4. Banner informativo con tips de teclas Enter/ESC.
-->
<template>
  <v-dialog v-model="openLocal" max-width="640" scrollable>
    <v-card class="psh-card" rounded="xl">
      <!-- ════ Header brand ════ -->
      <div class="psh-head">
        <div class="psh-head__icon">
          <v-icon size="22">mdi-keyboard-outline</v-icon>
        </div>
        <div class="psh-head__text">
          <div class="psh-head__eyebrow">Ayuda · F1</div>
          <div class="psh-head__title">Atajos del POS</div>
        </div>
        <button type="button" class="psh-close" aria-label="Cerrar" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <!-- ════ CTA Tour (destacado, arriba) ════ -->
      <button type="button" class="psh-tour-cta" @click="openWizard">
        <div class="psh-tour-cta__icon">
          <v-icon size="20">mdi-school-outline</v-icon>
        </div>
        <div class="psh-tour-cta__body">
          <div class="psh-tour-cta__title">Hacé el tour rápido del POS</div>
          <div class="psh-tour-cta__sub">
            Recorré cada zona del sistema con una venta de prueba · 2 minutos
          </div>
        </div>
        <v-icon size="20" class="psh-tour-cta__chev">mdi-chevron-right</v-icon>
      </button>

      <v-divider />

      <!-- ════ Body con scroll ════ -->
      <v-card-text class="psh-body">
        <!-- Grupos de atajos -->
        <div
          v-for="group in shortcutGroups"
          :key="group.id"
          class="psh-group"
        >
          <div class="psh-group__title">{{ group.label }}</div>
          <div class="psh-grid">
            <div
              v-for="item in group.items"
              :key="item.key"
              class="psh-cell"
            >
              <kbd class="psh-kbd">{{ item.key }}</kbd>
              <div class="psh-cell__body">
                <div class="psh-cell__title">{{ item.label }}</div>
                <div v-if="item.description" class="psh-cell__desc">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="psh-group">
          <div class="psh-group__title">Navegación</div>
          <div class="psh-grid">
            <div class="psh-cell">
              <kbd class="psh-kbd">PgUp</kbd>
              <div class="psh-cell__body">
                <div class="psh-cell__title">Página anterior</div>
              </div>
            </div>
            <div class="psh-cell">
              <kbd class="psh-kbd">PgDn</kbd>
              <div class="psh-cell__body">
                <div class="psh-cell__title">Página siguiente</div>
              </div>
            </div>
            <div class="psh-cell">
              <kbd class="psh-kbd">Ctrl + K</kbd>
              <div class="psh-cell__body">
                <div class="psh-cell__title">Ir al buscador</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tip inferior -->
        <div class="psh-tip">
          <v-icon size="16" class="psh-tip__icon">mdi-information-outline</v-icon>
          <div class="psh-tip__text">
            <b>Enter</b> confirma · <b>ESC</b> cancela · <b>Backspace</b> vuelve atrás cuando corresponde.
            F1, F4 y F6 funcionan como toggle (misma tecla abre y cierra).
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <!-- ════ Footer ════ -->
      <div class="psh-foot">
        <v-btn variant="flat" color="primary" rounded="lg" size="default" @click="close">
          Entendido
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from "vue";
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
function openWizard() {
  openLocal.value = false;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("pos:open-wizard"));
  }
}
</script>

<style scoped>
.psh-card {
  overflow: hidden;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

/* ═══ Header ═══ */
.psh-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 14px;
  flex-shrink: 0;
}
.psh-head__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(20, 136, 209, 0.14);
  color: #1488d1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.v-theme--adminDark .psh-head__icon,
.v-theme--shopDark .psh-head__icon,
.v-theme--dark .psh-head__icon {
  background: rgba(20, 136, 209, 0.20);
}
.psh-head__text { flex: 1 1 auto; min-width: 0; }
.psh-head__eyebrow {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1488d1;
  margin-bottom: 1px;
}
.psh-head__title {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.2px;
  line-height: 1.2;
}
.psh-close {
  background: transparent;
  border: none;
  color: rgba(var(--v-theme-on-surface), 0.55);
  cursor: pointer;
  width: 32px; height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.psh-close:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

/* ═══ Tour CTA destacado ═══ */
.psh-tour-cta {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 32px);
  margin: 0 16px 14px;
  padding: 14px 14px;
  background: linear-gradient(135deg, #1488d1 0%, #0e6ba8 100%);
  color: #fff;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  box-shadow: 0 8px 22px rgba(20, 136, 209, 0.32);
  transition: transform 0.15s, box-shadow 0.15s, filter 0.15s;
}
.psh-tour-cta:hover {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 12px 30px rgba(20, 136, 209, 0.45);
}
.psh-tour-cta:active { transform: translateY(0); }
.psh-tour-cta__icon {
  width: 38px; height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.18);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.psh-tour-cta__body { flex: 1 1 auto; min-width: 0; }
.psh-tour-cta__title {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.1px;
  line-height: 1.2;
}
.psh-tour-cta__sub {
  font-size: 11.5px;
  opacity: 0.85;
  margin-top: 2px;
  line-height: 1.3;
}
.psh-tour-cta__chev {
  flex-shrink: 0;
  opacity: 0.85;
}

/* ═══ Body con scroll ═══ */
.psh-body {
  padding: 4px 16px 12px;
  overflow-y: auto;
  flex: 1 1 auto;
}

.psh-group + .psh-group {
  margin-top: 16px;
}
.psh-group__title {
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  padding: 4px 4px 8px;
}

/* Grid de atajos: 2 columnas en desktop, 1 en mobile */
.psh-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}
@media (max-width: 540px) {
  .psh-grid { grid-template-columns: 1fr; }
}

.psh-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  transition: background 0.15s;
}
.psh-cell:hover {
  background: rgba(20, 136, 209, 0.08);
}
.v-theme--adminDark .psh-cell,
.v-theme--shopDark .psh-cell,
.v-theme--dark .psh-cell {
  background: rgba(255, 255, 255, 0.04);
}
.v-theme--adminDark .psh-cell:hover,
.v-theme--shopDark .psh-cell:hover,
.v-theme--dark .psh-cell:hover {
  background: rgba(20, 136, 209, 0.14);
}

.psh-kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 4px 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: #1488d1;
  background: rgba(20, 136, 209, 0.10);
  border: 1px solid rgba(20, 136, 209, 0.22);
  border-bottom-width: 2px;
  border-radius: 6px;
  flex-shrink: 0;
}
.v-theme--adminDark .psh-kbd,
.v-theme--shopDark .psh-kbd,
.v-theme--dark .psh-kbd {
  background: rgba(20, 136, 209, 0.18);
  border-color: rgba(20, 136, 209, 0.35);
  color: #5eb9e3;
}

.psh-cell__body { flex: 1 1 auto; min-width: 0; }
.psh-cell__title {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.25;
  color: rgb(var(--v-theme-on-surface));
}
.psh-cell__desc {
  font-size: 11.5px;
  line-height: 1.35;
  color: rgba(var(--v-theme-on-surface), 0.62);
  margin-top: 1px;
}

/* ═══ Tip inferior ═══ */
.psh-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  margin-top: 14px;
  border-radius: 10px;
  background: rgba(20, 136, 209, 0.06);
  border: 1px dashed rgba(20, 136, 209, 0.22);
}
.v-theme--adminDark .psh-tip,
.v-theme--shopDark .psh-tip,
.v-theme--dark .psh-tip {
  background: rgba(20, 136, 209, 0.10);
}
.psh-tip__icon {
  color: #1488d1;
  flex-shrink: 0;
  margin-top: 1px;
}
.psh-tip__text {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(var(--v-theme-on-surface), 0.78);
}
.psh-tip__text b { color: #1488d1; font-weight: 500; }

/* ═══ Footer ═══ */
.psh-foot {
  display: flex;
  justify-content: flex-end;
  padding: 10px 16px 12px;
  flex-shrink: 0;
}
</style>
