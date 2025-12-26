<!-- src/modules/dashboard/components/DashboardStockTab.vue -->
<template>
  <v-row dense class="mb-3">
    <v-col cols="12" md="4">
      <KpiCard
        title="Sin stock"
        :value="stock.outOfStockCount"
        :loading="loading"
        icon="mdi-close-octagon-outline"
        tone="error"
      />
    </v-col>
    <v-col cols="12" md="4">
      <KpiCard
        title="Stock bajo"
        :value="stock.lowStockCount"
        :loading="loading"
        icon="mdi-alert-outline"
        tone="warning"
      />
    </v-col>
    <v-col cols="12" md="4">
      <KpiCard
        title="Productos con stock (track)"
        :value="stock.trackedProducts"
        :loading="loading"
        icon="mdi-radar"
        tone="primary"
      />
    </v-col>
  </v-row>

  <v-row dense>
    <!-- Stock por sucursal (barras simples) -->
    <v-col cols="12" lg="5">
      <v-card class="rounded-xl" elevation="0" style="background:rgba(0,0,0,.02); border:1px solid rgba(0,0,0,.06);">
        <v-card-title class="text-subtitle-1 font-weight-bold">
          Estado de stock por sucursal
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <div v-if="!rows.length" class="text-caption text-medium-emphasis">
              Sin datos (falta <code>/dashboard/stock</code>).
            </div>

            <div v-else class="d-flex flex-column ga-3">
              <div v-for="r in rows" :key="r.key">
                <div class="d-flex align-center justify-space-between">
                  <div class="text-body-2 font-weight-medium">{{ r.label }}</div>
                  <div class="text-caption text-medium-emphasis">
                    Out: <b>{{ r.out }}</b> · Low: <b>{{ r.low }}</b> · OK: <b>{{ r.ok }}</b>
                  </div>
                </div>

                <v-progress-linear :model-value="pct(r.out, r.total)" color="red" height="10" rounded />
                <v-progress-linear :model-value="pct(r.low, r.total)" color="orange" height="10" rounded class="mt-1" />
                <v-progress-linear :model-value="pct(r.ok, r.total)" color="green" height="10" rounded class="mt-1" />
              </div>

              <v-alert type="info" variant="tonal" class="rounded-xl mt-2">
                Las 3 barras representan proporción dentro de cada sucursal (sin stock / bajo / ok).
              </v-alert>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>

    <!-- Tabla stock bajo -->
    <v-col cols="12" lg="7">
      <v-card class="rounded-xl" elevation="0" style="background:#fff; border:1px solid rgba(0,0,0,.06);">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="text-subtitle-1 font-weight-bold">Productos críticos (stock bajo / 0)</div>
          <v-chip size="small" variant="tonal">Scope: <b class="ml-1">{{ scopeLabel }}</b></v-chip>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <div v-if="loading" class="py-8 d-flex justify-center">
            <v-progress-circular indeterminate />
          </div>

          <div v-else>
            <v-data-table
              :headers="headers"
              :items="stock.lowStockItems || []"
              item-key="product_id"
              density="comfortable"
              class="elevation-0 rounded-xl"
            >
              <template #item.product="{ item }">
                <div class="font-weight-bold">{{ item.name || `Producto #${item.product_id}` }}</div>
                <div class="text-caption text-medium-emphasis">SKU: {{ item.sku || "—" }}</div>
              </template>

              <template #item.scope="{ item }">
                <div class="text-body-2 font-weight-medium">
                  {{ item.branch_name || (item.branch_id ? `Sucursal #${item.branch_id}` : "—") }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.warehouse_name || (item.warehouse_id ? `Depósito #${item.warehouse_id}` : "—") }}
                </div>
              </template>

              <template #item.stock="{ item }">
                <v-chip size="small" variant="tonal" :color="Number(item.stock || 0) <= 0 ? 'red' : 'orange'">
                  {{ Number(item.stock || 0) }}
                </v-chip>
                <div class="text-caption text-medium-emphasis">
                  Mín: {{ Number(item.min_stock || 0) }}
                </div>
              </template>

              <template #bottom />
            </v-data-table>

            <div v-if="!(stock.lowStockItems || []).length" class="text-caption text-medium-emphasis">
              Sin críticos (bien ahí).
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from "vue";
import KpiCard from "./KpiCard.vue";

const props = defineProps({
  loading: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  scopeLabel: { type: String, default: "" },
  stock: { type: Object, default: () => ({}) },
});

const headers = [
  { title: "Producto", key: "product", sortable: false },
  { title: "Sucursal / Depósito", key: "scope", sortable: false, width: 260 },
  { title: "Stock", key: "stock", sortable: false, width: 140 },
];

function pct(part, total) {
  const p = Number(part || 0);
  const t = Number(total || 0);
  if (t <= 0) return 0;
  return Math.max(0, Math.min(100, (p / t) * 100));
}

const rows = computed(() => {
  const arr = Array.isArray(props.stock?.stockByBranch) ? props.stock.stockByBranch : [];
  return arr.map((r) => {
    const out = Number(r.out || 0);
    const low = Number(r.low || 0);
    const ok = Number(r.ok || 0);
    return {
      key: String(r.branch_id ?? ""),
      label: r.branch_name || `Sucursal #${r.branch_id}`,
      out, low, ok,
      total: out + low + ok,
    };
  });
});
</script>
