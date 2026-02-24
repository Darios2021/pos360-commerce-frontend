<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosFiltersBar.vue -->
<template>
  <v-card class="pf-root" rounded="xl" elevation="0">
    <v-card-text class="pf-inner">
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
            <v-icon start>mdi-chevron-left</v-icon>
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
            <v-icon end>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </div>

      <div v-if="error" class="mt-2 text-caption text-error">
        {{ error }}
      </div>
    </v-card-text>
  </v-card>
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

/* sync down */
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

/* sync up */
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

/* expose for F2 */
function focusSearch() {
  searchRef.value?.focus?.();
}
defineExpose({ focusSearch });
</script>

<style scoped>
.pf-root {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

/* ✅ menos padding del card (antes 14px) */
.pf-inner {
  padding: 10px 12px;
}

/* ✅ menos aire vertical de la grilla */
.pf-row {
  margin: 0 !important;
}
.pf-row :deep(.v-col) {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}

/* inputs compact firmes */
.pf-field :deep(.v-field) {
  border-radius: 14px;
}

/* ✅ achica altura visual del campo */
.pf-field :deep(.v-field__input) {
  padding-top: 6px;
  padding-bottom: 6px;
  min-height: 38px;
  font-size: 13px;
}

.pf-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 4px rgba(var(--v-theme-primary), 0.12);
}

/* bottom */
.pf-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px; /* ✅ menos alto */
  flex-wrap: wrap;
}

.pf-actions {
  display: flex;
  gap: 10px;
}

/* ✅ botones más compactos */
.pf-btn {
  border-radius: 12px;
  height: 34px;
  padding: 0 12px;
  font-size: 12.5px;
}

.pf-dot {
  opacity: 0.55;
  margin: 0 6px;
}
</style>