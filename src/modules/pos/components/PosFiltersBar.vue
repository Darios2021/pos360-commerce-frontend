<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosFiltersBar.vue -->
<template>
  <v-card class="pf-root" rounded="xl" elevation="0">
    <v-card-text class="pf-inner">
      <v-row dense>
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
            @keyup.enter="$emit('enter')"
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
            :disabled="disabledAll || !rubroLocal || (subrubroItems?.length || 0) === 0"
            :no-data-text="subrubroNoDataText"
          />
        </v-col>
      </v-row>

      <div class="pf-bottom">
        <div class="pf-stats text-caption text-medium-emphasis">
          Mostrando {{ showingText }}
          <span class="pf-dot">·</span>
          Stock total (incluye sin precio): {{ stockOnlyTotal }}
        </div>

        <div class="pf-actions">
          <v-btn size="small" variant="tonal" @click="$emit('prev')" :disabled="disabledAll || page <= 1">
            <v-icon start>mdi-chevron-left</v-icon>
            Anterior
          </v-btn>

          <v-btn size="small" variant="tonal" @click="$emit('next')" :disabled="disabledAll || page >= pages">
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
  // v-models
  q: { type: String, default: "" },
  rubroId: { type: [Number, String, null], default: null },
  subrubroId: { type: [Number, String, null], default: null },

  // items
  rubroItems: { type: Array, default: () => [] },
  subrubroItems: { type: Array, default: () => [] },
  subrubroNoDataText: { type: String, default: "Elegí un rubro primero" },

  // pagination / counts
  page: { type: Number, default: 1 },
  pages: { type: Number, default: 1 },
  shownCount: { type: Number, default: 0 }, // pagedItems.length
  totalCount: { type: Number, default: 0 }, // total filtrado

  stockOnlyTotal: { type: Number, default: 0 },

  error: { type: [String, null], default: null },
  disabledAll: { type: Boolean, default: false },
});

const emit = defineEmits([
  // v-model updates
  "update:q",
  "update:rubro-id",
  "update:subrubro-id",
  // events
  "typing",
  "enter",
  "clear",
  "rubro-change",
  "prev",
  "next",
]);

const searchRef = ref(null);

/* locals (NO mutar props) */
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

function onRubroChangeLocal() {
  subrubroLocal.value = null;
  emit("rubro-change");
}

/* ✅ texto POS clásico */
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
.pf-inner {
  padding: 14px;
}
.pf-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.pf-actions {
  display: flex;
  gap: 10px;
}
.pf-dot {
  opacity: 0.55;
  margin: 0 6px;
}
</style>