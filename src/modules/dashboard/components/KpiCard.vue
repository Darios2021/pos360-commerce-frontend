<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/dashboard/components/KpiCard.vue -->
<template>
  <v-card class="kpi dash-surface" rounded="xl" elevation="0">
    <div class="d-flex align-center justify-space-between ga-4">
      <div class="minw-0">
        <div class="text-caption text-medium-emphasis text-truncate">
          {{ theLabel }}
        </div>

        <div class="text-h6 font-weight-bold mt-1">
          <template v-if="loading">
            <v-skeleton-loader type="text" width="120" />
          </template>
          <template v-else>
            {{ displayValue }}
          </template>
        </div>

        <div v-if="sub && !loading" class="text-caption text-medium-emphasis mt-1 text-truncate">
          {{ sub }}
        </div>
      </div>

      <v-avatar size="44" class="kpi-ico" rounded="xl">
        <v-icon :icon="icon" />
      </v-avatar>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label: { type: String, default: "" },
  title: { type: String, default: "" },

  value: { type: [String, Number], default: "—" },
  sub: { type: String, default: "" },
  icon: { type: String, default: "mdi-chart-box-outline" },

  loading: { type: Boolean, default: false },
  tone: { type: String, default: "primary" },
});

const theLabel = computed(() => props.label || props.title || "");

const displayValue = computed(() => {
  const v = props.value;
  if (v === null || v === undefined || v === "") return "—";
  return v;
});
</script>

<style scoped>
.dash-surface {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.kpi {
  padding: 16px;
}

.kpi-ico {
  background: rgba(var(--v-theme-primary), 0.16);
  border: 1px solid rgba(var(--v-theme-primary), 0.30);
}

.minw-0 { min-width: 0; }
</style>