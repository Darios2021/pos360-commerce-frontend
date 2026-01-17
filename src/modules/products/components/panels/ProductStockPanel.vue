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
        style="max-width: 360px"
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

    <v-card rounded="xl" variant="tonal" class="ps-card">
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
          <v-text-field
            v-model="qtyMap[item.branch_id]"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details
            :disabled="disabled || loading"
            style="max-width: 180px"
            @update:modelValue="(v) => onQty(item.branch_id, v)"
          />
        </template>

        <template #bottom>
          <div class="text-caption text-medium-emphasis pa-3">
            <template v-if="!showCurrent">
              * Esto es <b>preview</b>. Se aplica recién al tocar <b>CREAR</b> en el Resumen.
              <br />
              * Tip: si dejás <b>0</b>, no se envía nada (no pisa stock).
            </template>
            <template v-else>
              * Esto es <b>preview</b>. Se aplica al tocar <b>GUARDAR</b> en el Resumen.
              <br />
              * En edición: se envía el cambio <b>solo si Cantidad != Actual</b> (incluye <b>0</b> si querés dejar stock en cero).
            </template>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";
import http from "../../../../app/api/http"; // ✅ fallback seguro si fetchBranches no existe

const props = defineProps({
  productId: { type: [Number, String], default: null },
  modelValue: { type: Array, default: () => [] }, // [{branch_id, branch_name, warehouse_id?, current_qty?, qty}]
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

const showCurrent = computed(() => toInt(props.productId, 0) > 0);

const rows = computed({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
  set: (v) => emit("update:modelValue", Array.isArray(v) ? v : []),
});

const headers = computed(() => {
  const base = [{ title: "Sucursal", key: "branch", sortable: false }];
  base.push({ title: "Actual", key: "current_qty", sortable: false, align: "end", width: 130 });
  base.push({ title: "Cantidad", key: "qty", sortable: false, width: 220 });
  return base;
});

const filteredRows = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  if (!qq) return rows.value;
  return rows.value.filter((r) => String(r.branch_name || "").toLowerCase().includes(qq));
});

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

// ✅ fallback: si store no tiene fetchBranches, pega a /branches directamente
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

      // ✅ IMPORTANTE: preservamos current_qty REAL (para edición) y warehouse_id default
      const arr = (Array.isArray(matrix) ? matrix : []).map((x) => ({
        branch_id: toInt(x.branch_id ?? x.id, 0),
        branch_name: x.branch_name || x.name || "",
        warehouse_id: toInt(x.warehouse_id ?? x.default_warehouse_id ?? x.wid, 0),
        current_qty: num(x.current_qty ?? x.qty ?? x.stock_qty ?? 0, 0),
        qty: num(x.assign_qty ?? x.qty_to_set ?? 0, 0),
      }));

      // ✅ mantenemos lo que el usuario ya tipeó (qty), pero actualizamos current_qty/warehouse_id/branch_name
      const local = Array.isArray(rows.value) ? rows.value : [];
      const localMapQty = new Map(local.map((r) => [toInt(r.branch_id, 0), num(r.qty, 0)]));

      const merged = arr.map((r) => ({
        ...r,
        qty: localMapQty.has(r.branch_id) ? localMapQty.get(r.branch_id) : num(r.qty, 0),
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
      }));

      const local = Array.isArray(rows.value) ? rows.value : [];
      const localMapQty = new Map(local.map((r) => [toInt(r.branch_id, 0), num(r.qty, 0)]));

      rows.value = arr
        .map((r) => ({ ...r, qty: localMapQty.has(r.branch_id) ? localMapQty.get(r.branch_id) : 0 }))
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

.ps-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.ps-card {
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 8px;
}

.ps-table :deep(th) {
  font-weight: 900;
}
</style>
