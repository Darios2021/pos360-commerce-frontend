<!-- src/modules/reports/pages/ReportsShellPage.vue -->
<template>
  <div class="rpt-shell">
    <AppPageHeader
      icon="mdi-chart-line"
      title="Reportes"
      subtitle="Ventas por sucursal, stock, auditoría de cajas y liquidación de franquicias"
    />

    <v-tabs
      v-model="activeTab"
      density="comfortable"
      color="primary"
      class="rpt-shell__tabs"
      show-arrows
    >
      <v-tab value="sales" class="rpt-tab">
        <v-icon start size="18">mdi-cash-multiple</v-icon>
        Ventas
      </v-tab>
      <v-tab value="stock" class="rpt-tab" disabled>
        <v-icon start size="18">mdi-warehouse</v-icon>
        Stock
        <v-chip size="x-small" class="ml-2" variant="tonal" color="warning">Próximamente</v-chip>
      </v-tab>
      <v-tab value="cashboxes" class="rpt-tab" disabled>
        <v-icon start size="18">mdi-cash-register</v-icon>
        Auditoría de cajas
        <v-chip size="x-small" class="ml-2" variant="tonal" color="warning">Próximamente</v-chip>
      </v-tab>
    </v-tabs>

    <div class="rpt-shell__body">
      <ReportsSalesPage v-if="activeTab === 'sales'" />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import ReportsSalesPage from "./ReportsSalesPage.vue";
import AppPageHeader from "@/app/components/AppPageHeader.vue";

const activeTab = ref("sales");
</script>

<style scoped>
.rpt-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.rpt-shell__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px 2px;
  flex-wrap: wrap;
}

.rpt-shell__title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.rpt-shell__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}

.rpt-shell__title {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

.rpt-shell__subtitle {
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  margin-top: 2px;
}

.rpt-shell__tabs {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.rpt-tab {
  text-transform: none !important;
  font-weight: 400;
  letter-spacing: 0;
  font-size: 13px;
}

.rpt-shell__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
</style>
