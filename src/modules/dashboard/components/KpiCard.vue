<!-- src/modules/dashboard/components/KpiCard.vue -->
<template>
  <v-card class="kpi" rounded="xl" elevation="0">
    <div class="d-flex align-center justify-space-between">
      <div>
        <div class="text-caption text-medium-emphasis">{{ theLabel }}</div>

        <div class="text-h6 font-weight-bold mt-1">
          <template v-if="loading">
            <v-skeleton-loader type="text" width="120" />
          </template>
          <template v-else>
            {{ value }}
          </template>
        </div>

        <div v-if="sub && !loading" class="text-caption text-medium-emphasis mt-1">
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
  // compat
  label: { type: String, default: "" },
  title: { type: String, default: "" },

  value: { type: [String, Number], default: "—" },
  sub: { type: String, default: "" },
  icon: { type: String, default: "mdi-chart-box-outline" },

  loading: { type: Boolean, default: false },
  tone: { type: String, default: "primary" }, // primary/success/info/warning/error/indigo...
});

const theLabel = computed(() => props.label || props.title || "");
</script>

<style scoped>
.kpi {
  padding: 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
.kpi-ico {
  background: rgba(25, 118, 210, 0.15);
  border: 1px solid rgba(25, 118, 210, 0.35);
}
</style>
