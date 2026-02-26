<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/panels/ProductStockPanel.vue -->
<template>
  <div class="ps-root">
    <div class="ps-controls">
      <v-text-field
        v-model="q"
        label="Buscar sucursal"
        variant="outlined"
        density="comfortable"
        clearable
        :disabled="disabled || loading"
        class="ps-search"
      />

      <v-btn
        variant="tonal"
        size="small"
        prepend-icon="mdi-refresh"
        @click="refresh"
        :loading="loading"
        :disabled="disabled"
      >
        Refrescar
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="comfortable">
      {{ error }}
    </v-alert>

    <v-card rounded="xl" variant="flat" class="ps-card">
      <v-data-table
        :headers="headers"
        :items="filteredRows"
        item-key="branch_id"
        :items-per-page="10"
        :loading="loading"
        class="ps-table"
      >
        <template #item.branch="{ item }">
          <div class="d-flex flex-column">
            <div class="font-weight-bold">{{ item.branch_name }}</div>
            <div class="text-caption text-medium-emphasis">
              ID {{ item.branch_id }}
              <span v-if="toInt(item.warehouse_id, 0) > 0"> · Depósito {{ item.warehouse_id }}</span>
            </div>
          </div>
        </template>

        <template #item.current_qty="{ item }">
          <div class="text-right font-weight-bold">
            {{ showCurrent ? num(item.current_qty).toFixed(3) : "—" }}
          </div>
        </template>

        <template #item.qty="{ item }">
          <div class="d-flex align-center ga-2">
            <v-tooltip
              v-if="!isEnabled(item)"
              text="Habilitá la sucursal para poder cargar cantidad"
              location="top"
            >
              <template #activator="{ props: tprops }">
                <div v-bind="tprops" class="w-100">
                  <v-text-field
                    v-model="qtyMap[item.branch_id]"
                    type="number"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="ps-qty"
                    :disabled="true"
                    :readonly="true"
                    @update:modelValue="(v) => onQty(item.branch_id, v)"
                  />
                </div>
              </template>
            </v-tooltip>

            <v-text-field
              v-else
              v-model="qtyMap[item.branch_id]"
              type="number"
              variant="outlined"
              density="comfortable"
              hide-details
              class="ps-qty"
              :disabled="disabled || loading"
              @update:modelValue="(v) => onQty(item.branch_id, v)"
            />

            <v-chip
              size="x-small"
              variant="tonal"
              :color="isEnabled(item) ? 'green' : 'grey'"
              class="ps-chip-mini"
            >
              {{ isEnabled(item) ? "editable" : "bloqueado" }}
            </v-chip>
          </div>
        </template>

        <template #item.enabled="{ item }">
          <div class="d-flex align-center justify-end ga-2">
            <v-chip
              size="small"
              :variant="isEnabled(item) ? 'flat' : 'tonal'"
              :color="isEnabled(item) ? 'green' : 'grey'"
              class="ps-chip"
            >
              {{ isEnabled(item) ? "Sí" : "No" }}
            </v-chip>

            <v-switch
              :model-value="isEnabled(item)"
              @update:modelValue="(v) => onEnabled(item.branch_id, v)"
              :disabled="disabled || loading"
              density="comfortable"
              inset
              hide-details
              color="green"
              class="ps-switch"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";
import http from "../../../../app/api/http";

const props = defineProps({
  productId: { type: [Number, String], default: null },
  modelValue: { type: Array, default: () => [] }, // [{branch_id, branch_name, warehouse_id?, current_qty?, qty, enabled}]
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const products = useProductsStore();

const loading = ref(false);
const error = ref(null);

const q = ref("");
const qtyMap = ref({});

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function num(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function toBool(v, d = false) {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return d;
}

const showCurrent = computed(() => toInt(props.productId, 0) > 0);

const rows = computed({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
  set: (v) => emit("update:modelValue", Array.isArray(v) ? v : []),
});

const headers = computed(() => {
  return [
    { title: "Sucursal", key: "branch", sortable: false },
    { title: "Stock", key: "current_qty", sortable: false, align: "end", width: 120 },
    { title: "Cantidad", key: "qty", sortable: false, width: 320 },
    { title: "Habilitada", key: "enabled", sortable: false, align: "end", width: 220 },
  ];
});

const filteredRows = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  if (!qq) return rows.value;
  return rows.value.filter((r) => String(r.branch_name || "").toLowerCase().includes(qq));
});

function isEnabled(item) {
  return toBool(item?.enabled, false);
}

function syncQtyMapFromRows() {
  const map = { ...(qtyMap.value || {}) };
  for (const r of rows.value) {
    const bid = toInt(r.branch_id, 0);
    if (!bid) continue;
    if (map[bid] === undefined || map[bid] === null || map[bid] === "") {
      map[bid] = r.qty !== undefined && r.qty !== null ? r.qty : 0;
    }
  }
  qtyMap.value = map;
}

function writeRowsFromMap() {
  const next = (rows.value || []).map((r) => {
    const bid = toInt(r.branch_id, 0);
    const v = qtyMap.value?.[bid];
    return { ...r, qty: num(v, 0) };
  });
  rows.value = next;
}

function onQty(branchId, v) {
  const bid = toInt(branchId, 0);
  if (!bid) return;
  qtyMap.value = { ...qtyMap.value, [bid]: v };
  writeRowsFromMap();
}

function onEnabled(branchId, v) {
  const bid = toInt(branchId, 0);
  if (!bid) return;

  const enabled = toBool(v, false);

  const next = (rows.value || []).map((r) => {
    if (toInt(r.branch_id, 0) !== bid) return r;
    const qty = enabled ? num(r.qty, 0) : 0;
    qtyMap.value = { ...qtyMap.value, [bid]: qty };
    return { ...r, enabled, qty };
  });

  rows.value = next;
}

async function fetchBranchesSafe() {
  if (products && typeof products.fetchBranches === "function") {
    return await products.fetchBranches();
  }
  const { data } = await http.get("/branches");
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return arr;
}

async function refresh() {
  loading.value = true;
  error.value = null;

  try {
    const pid = toInt(props.productId, 0);

    if (pid > 0) {
      const matrix = await products.fetchBranchesMatrix(pid);

      const arr = (Array.isArray(matrix) ? matrix : []).map((x) => ({
        branch_id: toInt(x.branch_id ?? x.id, 0),
        branch_name: x.branch_name || x.name || "",
        warehouse_id: toInt(x.warehouse_id ?? x.default_warehouse_id ?? x.wid, 0),
        current_qty: num(x.current_qty ?? x.qty ?? x.stock_qty ?? 0, 0),
        qty: num(x.assign_qty ?? x.qty_to_set ?? 0, 0),
        enabled: toBool(x.enabled ?? x.is_active ?? 0, false),
      }));

      const local = Array.isArray(rows.value) ? rows.value : [];
      const localMapQty = new Map(local.map((r) => [toInt(r.branch_id, 0), num(r.qty, 0)]));
      const localMapEnabled = new Map(local.map((r) => [toInt(r.branch_id, 0), toBool(r.enabled, false)]));

      const merged = arr.map((r) => ({
        ...r,
        qty: localMapQty.has(r.branch_id) ? localMapQty.get(r.branch_id) : num(r.qty, 0),
        enabled: localMapEnabled.has(r.branch_id) ? localMapEnabled.get(r.branch_id) : toBool(r.enabled, false),
      }));

      rows.value = merged.filter((r) => r.branch_id > 0 && r.branch_name);
    } else {
      const bs = await fetchBranchesSafe();

      const arr = (Array.isArray(bs) ? bs : []).map((b) => ({
        branch_id: toInt(b.id, 0),
        branch_name: b.name || "",
        warehouse_id: toInt(b.warehouse_id ?? b.default_warehouse_id ?? 0, 0),
        current_qty: 0,
        qty: 0,
        enabled: false,
      }));

      const local = Array.isArray(rows.value) ? rows.value : [];
      const localMapQty = new Map(local.map((r) => [toInt(r.branch_id, 0), num(r.qty, 0)]));
      const localMapEnabled = new Map(local.map((r) => [toInt(r.branch_id, 0), toBool(r.enabled, false)]));

      rows.value = arr
        .map((r) => ({
          ...r,
          qty: localMapQty.has(r.branch_id) ? localMapQty.get(r.branch_id) : 0,
          enabled: localMapEnabled.has(r.branch_id) ? localMapEnabled.get(r.branch_id) : false,
        }))
        .filter((r) => r.branch_id > 0 && r.branch_name);
    }

    syncQtyMapFromRows();
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo refrescar";
  } finally {
    loading.value = false;
  }
}

watch(
  () => rows.value,
  () => syncQtyMapFromRows(),
  { immediate: true, deep: true }
);

watch(
  () => props.productId,
  () => refresh(),
  { immediate: true }
);
</script>

<style scoped>
.ps-root {
  display: grid;
  gap: 12px;
}

/* Controls */
.ps-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.ps-search {
  max-width: 360px;
}

/* Card neutra */
.ps-card {
  border-radius: 16px;
  padding: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(0, 0, 0, 0.01);
}

/* Compactar tabla SOLO dentro de este componente */
.ps-root :deep(.ps-table .v-data-table__td),
.ps-root :deep(.ps-table .v-data-table__th) {
  padding-top: 10px !important;
  padding-bottom: 10px !important;
}

.ps-root :deep(.ps-table th) {
  font-weight: 900;
}

/* Qty input ancho fijo */
.ps-qty {
  width: 200px;
  max-width: 200px;
}
@media (max-width: 720px) {
  .ps-qty {
    width: 150px;
    max-width: 150px;
  }
}
.ps-root :deep(.ps-qty .v-field) {
  border-radius: 12px;
}

/* Chips */
.ps-chip {
  font-weight: 900;
}
.ps-chip-mini {
  opacity: 0.9;
}

/* =================================
   ✅ Switch visible en MODO CLARO
   (aislado: SIEMPRE con .ps-root)
================================= */
.ps-switch {
  transform: scale(0.95);
}

/* track base */
.ps-root :deep(.ps-switch .v-switch__track) {
  opacity: 1 !important;
  border: 1px solid rgba(0, 0, 0, 0.30);
  background: rgba(0, 0, 0, 0.10);
}

/* thumb base */
.ps-root :deep(.ps-switch .v-switch__thumb) {
  opacity: 1 !important;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(0, 0, 0, 0.25);
}

/* ON */
.ps-root :deep(.ps-switch .v-selection-control--dirty .v-switch__track) {
  border-color: rgba(0, 140, 90, 0.70);
  background: rgba(0, 140, 90, 0.25);
}
</style>