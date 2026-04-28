<!--
  PosDialogHeader.vue

  Header reutilizable para dialogs POS. Provee una estructura consistente
  de eyebrow (kicker), título semántico (h3), subtítulo opcional y un botón
  de cierre alineado a la derecha.

  Props:
    - title     String          Título principal del dialog
    - subtitle  String?         Texto de apoyo bajo el título
    - eyebrow   String?         Kicker pequeño en uppercase arriba del título
    - closable  Boolean=true    Muestra el botón de cierre

  Slots:
    - #title     override del título
    - #subtitle  override del subtítulo
    - #chips     chips/indicadores inline al lado del título
    - #actions   override del botón de cierre (acciones custom)

  Emits:
    - close      el usuario pidió cerrar el dialog
-->
<template>
  <header class="pdh">
    <div class="pdh__texts">
      <p v-if="hasEyebrow" class="pdh__eyebrow">
        <slot name="eyebrow">{{ eyebrow }}</slot>
      </p>

      <div class="pdh__title-row">
        <h3 class="pdh__title">
          <slot name="title">{{ title }}</slot>
        </h3>

        <div v-if="$slots.chips" class="pdh__chips">
          <slot name="chips" />
        </div>
      </div>

      <p v-if="hasSubtitle" class="pdh__subtitle">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>

    <div class="pdh__actions">
      <slot name="actions">
        <v-btn
          v-if="closable"
          icon="mdi-close"
          size="small"
          variant="text"
          aria-label="Cerrar"
          @click="$emit('close')"
        />
      </slot>
    </div>
  </header>
</template>

<script setup>
import { computed, useSlots } from "vue";

const props = defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  eyebrow: { type: String, default: "" },
  closable: { type: Boolean, default: true },
});

defineEmits(["close"]);

const slots = useSlots();
const hasEyebrow = computed(() => !!props.eyebrow || !!slots.eyebrow);
const hasSubtitle = computed(() => !!props.subtitle || !!slots.subtitle);
</script>

<style scoped>
.pdh {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
  border-top-left-radius: var(--pos-radius-lg, 16px);
  border-top-right-radius: var(--pos-radius-lg, 16px);
}

.pdh__texts {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pdh__eyebrow {
  margin: 0;
  font-size: var(--pos-text-xs, 11px);
  font-weight: var(--pos-font-semibold, 700);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-primary));
}

.pdh__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
}

.pdh__title {
  margin: 0;
  font-size: var(--pos-text-xl, 20px);
  font-weight: 500;
  line-height: 1.15;
  color: rgb(var(--v-theme-on-surface));
  min-width: 0;
  overflow-wrap: anywhere;
}

.pdh__chips {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pdh__subtitle {
  margin: 2px 0 0;
  font-size: var(--pos-text-sm, 12px);
  line-height: 1.35;
  color: rgba(var(--v-theme-on-surface), 0.62);
}

.pdh__actions {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 460px) {
  .pdh {
    padding: 12px 14px 10px;
  }
  .pdh__title {
    font-size: var(--pos-text-lg, 16px);
  }
}
</style>
