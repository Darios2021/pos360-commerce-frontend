<!-- src/modules/dashboard/components/DashboardCharts.vue -->
<template>
  <v-card class="dash-card" rounded="xl" elevation="0">
    <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
      <div class="text-subtitle-1 font-weight-bold">{{ titleLeft }}</div>
      <div class="d-flex align-center ga-2">
        <slot name="right" />
      </div>
    </div>

    <div class="px-2 pb-3">
      <div v-if="!ready" class="px-4 py-8 text-medium-emphasis">
        Sin datos para graficar.
      </div>

      <ApexChart
        v-else
        :key="chartKey"
        :type="type"
        :height="height"
        :series="seriesSafe"
        :options="optionsSafe"
      />
    </div>
  </v-card>
</template>

<script setup>
import { computed } from "vue";
import ApexChart from "vue3-apexcharts";

const props = defineProps({
  titleLeft: { type: String, default: "" },
  type: { type: String, default: "line" },
  height: { type: [Number, String], default: 320 },

  // Apex:
  // - series: [{ name, data: [] }] o [number] si donut/pie
  series: { type: Array, default: () => [] },
  options: { type: Object, default: () => ({}) },

  ready: { type: Boolean, default: false },
});

const seriesSafe = computed(() => props.series || []);
const optionsSafe = computed(() => props.options || {});

// ✅ evita "Element not found" + fuerza re-mount cuando cambian datos
const chartKey = computed(() => {
  const s = JSON.stringify(seriesSafe.value ?? []).slice(0, 2500);
  const o = JSON.stringify(optionsSafe.value ?? {}).slice(0, 2500);
  return `${props.type}-${props.height}-${s.length}-${o.length}`;
});
</script>

<style scoped>
.dash-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.06);
}
</style>
