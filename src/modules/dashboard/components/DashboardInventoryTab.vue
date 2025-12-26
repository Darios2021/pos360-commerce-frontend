<!-- src/modules/dashboard/components/DashboardInventoryTab.vue -->
<template>
  <v-row dense class="mb-3">
    <v-col cols="12" md="3">
      <KpiCard title="Productos" :value="inv.totalProducts" :loading="loading" icon="mdi-package-variant-closed" tone="primary" />
    </v-col>
    <v-col cols="12" md="3">
      <KpiCard title="Activos" :value="inv.activeProducts" :loading="loading" icon="mdi-check-decagram-outline" tone="success" />
    </v-col>
    <v-col cols="12" md="3">
      <KpiCard title="Sin precio" :value="inv.noPriceProducts" :loading="loading" icon="mdi-tag-off-outline" tone="warning" />
    </v-col>
    <v-col cols="12" md="3">
      <KpiCard title="Categorías" :value="inv.categories" :loading="loading" icon="mdi-shape-outline" tone="info" />
    </v-col>
  </v-row>

  <v-row dense>
    <v-col cols="12">
      <v-card class="rounded-xl" elevation="0" style="background:#fff; border:1px solid rgba(0,0,0,.06);">
        <v-card-title class="text-subtitle-1 font-weight-bold">Últimos productos</v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <v-list density="compact" class="bg-transparent">
              <v-list-item v-for="p in (inv.lastProducts || [])" :key="p.id" class="px-0">
                <v-list-item-title class="text-body-2 font-weight-medium">
                  {{ p.name || `Producto #${p.id}` }}
                </v-list-item-title>

                <v-list-item-subtitle class="text-caption">
                  SKU: {{ p.sku || "—" }}
                  · Cat: {{ p?.category?.name || "—" }}
                  <span v-if="p?.category?.parent?.name"> ({{ p.category.parent.name }})</span>
                </v-list-item-subtitle>

                <template #append>
                  <v-chip
                    size="small"
                    variant="tonal"
                    :color="String(p.is_active ?? 1) === '1' ? 'green' : 'grey'"
                  >
                    {{ String(p.is_active ?? 1) === "1" ? "Activo" : "Inactivo" }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>

            <div v-if="!(inv.lastProducts || []).length" class="text-caption text-medium-emphasis">
              Sin productos.
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import KpiCard from "./KpiCard.vue";

defineProps({
  loading: { type: Boolean, default: false },
  inv: { type: Object, default: () => ({}) },
});
</script>
