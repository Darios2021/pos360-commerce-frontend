<template>
  <div class="pf-root">
    <div class="pf-inner">
      <v-row dense class="pf-row">
        <v-col cols="12" md="6">
          <v-text-field
            ref="searchRef"
            v-model="qLocal"
            label="Buscar productos"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :disabled="disabledAll"
            placeholder="SKU, nombre, código…"
            class="pf-field pf-search"
            @keyup.enter="$emit('enter')"
            @keyup.esc="onEsc"
            @click:clear="onClear"
            @update:model-value="onTyping"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="rubroLocal"
            :items="rubroItems"
            item-title="title"
            item-value="value"
            label="Rubro"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            :disabled="disabledAll"
            class="pf-field"
            @update:model-value="onRubroChangeLocal"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="subrubroLocal"
            :items="subrubroItems"
            item-title="title"
            item-value="value"
            label="Subrubro"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="pf-field"
            :disabled="disabledAll || !rubroLocal || (subrubroItems?.length || 0) === 0"
            :no-data-text="subrubroNoDataText"
          />
        </v-col>
      </v-row>

      <div class="pf-bottom">
        <div class="pf-stats text-caption text-medium-emphasis">
          Mostrando <b>{{ showingText }}</b>
          <span class="pf-dot">·</span>
          Stock total (incluye sin precio): <b>{{ stockOnlyTotal }}</b>
        </div>

        <div class="pf-actions">
          <v-btn
            size="small"
            density="compact"
            variant="tonal"
            class="pf-btn"
            @click="$emit('prev')"
            :disabled="disabledAll || page <= 1"
          >
            <v-icon start size="16">mdi-chevron-left</v-icon>
            Anterior
          </v-btn>

          <v-btn
            size="small"
            density="compact"
            variant="tonal"
            class="pf-btn"
            @click="$emit('next')"
            :disabled="disabledAll || page >= pages"
          >
            Siguiente
            <v-icon end size="16">mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </div>

      <div v-if="error" class="pf-error text-caption text-error">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  q: { type: String, default: "" },
  rubroId: { type: [Number, String, null], default: null },
  subrubroId: { type: [Number, String, null], default: null },

  rubroItems: { type: Array, default: () => [] },
  subrubroItems: { type: Array, default: () => [] },
  subrubroNoDataText: { type: String, default: "Elegí un rubro primero" },

  page: { type: Number, default: 1 },
  pages: { type: Number, default: 1 },
  shownCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },

  stockOnlyTotal: { type: Number, default: 0 },

  error: { type: [String, null], default: null },
  disabledAll: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:q",
  "update:rubro-id",
  "update:subrubro-id",
  "typing",
  "enter",
  "clear",
  "rubro-change",
  "prev",
  "next",
]);

const searchRef = ref(null);

const qLocal = ref(props.q || "");
const rubroLocal = ref(props.rubroId ?? null);
const subrubroLocal = ref(props.subrubroId ?? null);

watch(
  () => props.q,
  (v) => {
    const nv = String(v ?? "");
    if (nv !== String(qLocal.value ?? "")) qLocal.value = nv;
  }
);

watch(
  () => props.rubroId,
  (v) => {
    const nv = v ?? null;
    if (nv !== rubroLocal.value) rubroLocal.value = nv;
  }
);

watch(
  () => props.subrubroId,
  (v) => {
    const nv = v ?? null;
    if (nv !== subrubroLocal.value) subrubroLocal.value = nv;
  }
);

watch(qLocal, (v) => emit("update:q", String(v ?? "")));
watch(rubroLocal, (v) => emit("update:rubro-id", v ?? null));
watch(subrubroLocal, (v) => emit("update:subrubro-id", v ?? null));

function onTyping() {
  emit("typing");
}

function onClear() {
  qLocal.value = "";
  emit("clear");
}

function onEsc() {
  if (props.disabledAll) return;
  if (!String(qLocal.value || "").trim()) return;
  onClear();
}

function onRubroChangeLocal() {
  subrubroLocal.value = null;
  emit("rubro-change");
}

const showingText = computed(() => {
  const shown = Math.max(0, Number(props.shownCount || 0));
  const total = Math.max(0, Number(props.totalCount || 0));
  const page = Math.max(1, Number(props.page || 1));
  const pages = Math.max(1, Number(props.pages || 1));

  if (total <= 0) return `0 de 0 · Página ${page}/${pages}`;
  return `${shown} de ${total} · Página ${page}/${pages}`;
});

function focusSearch() {
  searchRef.value?.focus?.();
}
defineExpose({ focusSearch });
</script>

<style scoped>
.pf-root {
  position: relative;
  border-radius: 16px;
  overflow: hidden;

  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 0.99) 0%, rgba(var(--v-theme-surface), 1) 100%);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  box-shadow:
    0 8px 22px rgba(15, 23, 42, 0.05),
    0 2px 6px rgba(15, 23, 42, 0.03);
}

:global(.v-theme--light) .pf-root {
  border-color: rgba(var(--v-theme-on-surface), 0.09);
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.06),
    0 2px 8px rgba(15, 23, 42, 0.035);
}

:global(.v-theme--dark) .pf-root {
  border-color: rgba(255, 255, 255, 0.07);
  box-shadow:
    0 10px 24px rgba(0, 0, 0, 0.22),
    0 2px 6px rgba(0, 0, 0, 0.14);
}

.pf-inner {
  padding: 8px 10px 9px;
}

.pf-row {
  margin: 0 !important;
}

.pf-row :deep(.v-col) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.pf-field {
  --pf-field-radius: 13px;
}

.pf-field :deep(.v-field) {
  border-radius: var(--pf-field-radius);
  background: rgba(var(--v-theme-background), 0.16);
  transition:
    box-shadow 0.16s ease,
    border-color 0.16s ease,
    background-color 0.16s ease;
}

:global(.v-theme--light) .pf-field :deep(.v-field) {
  background: rgba(var(--v-theme-background), 0.28);
}

:global(.v-theme--dark) .pf-field :deep(.v-field) {
  background: rgba(255, 255, 255, 0.015);
}

.pf-field :deep(.v-field__prepend-inner) {
  padding-top: 0;
}

.pf-field :deep(.v-label) {
  font-size: 12px;
}

.pf-field :deep(.v-field__input) {
  min-height: 34px;
  padding-top: 4px;
  padding-bottom: 4px;
  font-size: 12.5px;
}

.pf-field :deep(input) {
  font-size: 12.5px;
}

.pf-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.10);
}

.pf-search :deep(.v-field__input) {
  font-weight: 500;
}

.pf-bottom {
  margin-top: 6px;
  padding-top: 6px;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.05);
}

.pf-stats {
  font-size: 11.5px !important;
  line-height: 1.2;
}

.pf-dot {
  margin: 0 5px;
  opacity: 0.45;
}

.pf-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pf-btn {
  height: 30px !important;
  min-height: 30px !important;
  padding: 0 10px !important;
  border-radius: 11px !important;
  font-size: 11.5px !important;
  font-weight: 800 !important;
  text-transform: none !important;
}

.pf-error {
  margin-top: 6px;
  line-height: 1.2;
}

/* NOTEBOOK */
@media (max-width: 1366px) {
  .pf-inner {
    padding: 7px 9px 8px;
  }

  .pf-field :deep(.v-field__input) {
    min-height: 32px;
    font-size: 12px;
  }

  .pf-field :deep(input) {
    font-size: 12px;
  }

  .pf-btn {
    height: 28px !important;
    min-height: 28px !important;
    padding: 0 9px !important;
    font-size: 11px !important;
  }

  .pf-stats {
    font-size: 11px !important;
  }
}

@media (max-width: 960px) {
  .pf-root {
    border-radius: 14px;
  }

  .pf-inner {
    padding: 9px;
  }

  .pf-bottom {
    align-items: stretch;
  }

  .pf-actions {
    width: 100%;
    justify-content: stretch;
  }

  .pf-btn {
    flex: 1 1 calc(50% - 4px);
  }
}

@media (max-width: 600px) {
  .pf-btn {
    flex: 1 1 100%;
  }

  .pf-stats {
    width: 100%;
  }
}
</style>