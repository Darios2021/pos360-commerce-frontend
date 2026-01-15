<!-- src/modules/products/components/form/ProductStockBranchesPanel.vue -->
<template>
  <div class="psb-root">
    <div class="d-flex align-start justify-space-between ga-2 flex-wrap">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Stock por sucursal (integral)</div>
        <div class="text-caption text-medium-emphasis">
          Se hidrata desde DB (product_branches + stock_balances).
        </div>
      </div>

      <div class="d-flex ga-2 flex-wrap justify-end">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" :disabled="loading || !productId" @click="refresh">
          Refrescar matriz
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-check"
          :disabled="loading || applying || !productId || !hasAnyEnabled"
          :loading="applying"
          @click="applyReparto"
        >
          Aplicar reparto
        </v-btn>
      </div>
    </div>

    <v-alert type="info" variant="tonal" class="mt-3">
      Podés preconfigurar sucursales y cantidades, pero para aplicar stock necesitás un <b>ID de producto</b>.
    </v-alert>

    <v-alert v-if="!productId" type="info" variant="tonal" class="mt-3">
      Guardá el producto para cargar la matriz real desde DB.
    </v-alert>

    <v-alert v-if="error" type="error" variant="tonal" class="mt-3">
      {{ error }}
    </v-alert>

    <v-card rounded="xl" class="pa-4 mt-3" variant="flat">
      <div class="d-flex flex-wrap ga-2 align-center justify-space-between">
        <v-text-field
          v-model="q"
          label="Buscar sucursal"
          variant="outlined"
          density="comfortable"
          hide-details
          style="max-width: 360px"
        />

        <div class="d-flex ga-2 flex-wrap align-center justify-end">
          <v-chip size="small" variant="tonal">Habilitadas: <b class="ml-1">{{ enabledCount }}</b></v-chip>
          <v-chip size="small" variant="tonal">Total asignar: <b class="ml-1">{{ totalAssign }}</b></v-chip>

          <v-btn variant="tonal" prepend-icon="mdi-broom" :disabled="loading" @click="clearAssign">
            Limpiar asignación
          </v-btn>
          <v-btn variant="tonal" prepend-icon="mdi-checkbox-multiple-marked" :disabled="loading" @click="enableAll">
            Habilitar todas
          </v-btn>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-checkbox-multiple-blank-outline"
            :disabled="loading"
            @click="disableAll"
          >
            Deshabilitar todas
          </v-btn>
        </div>
      </div>
    </v-card>

    <v-card rounded="xl" class="overflow-hidden mt-3" variant="flat">
      <v-data-table
        :headers="headers"
        :items="filteredRows"
        item-key="branch_id"
        :loading="loading"
        class="psb-table"
        density="comfortable"
      >
        <template #item.enabled="{ item }">
          <v-checkbox-btn v-model="item.enabled" />
        </template>

        <template #item.branch="{ item }">
          <div class="font-weight-bold">{{ item.branch_name }}</div>
          <div class="text-caption text-medium-emphasis">ID {{ item.branch_id }}</div>
        </template>

        <template #item.stock_qty="{ item }">
          <div class="text-right font-weight-bold">{{ fmtQty(item.stock_qty) }}</div>
        </template>

        <template #item.assign_qty="{ item }">
          <v-text-field
            v-model="item.assign_qty"
            :disabled="!item.enabled"
            type="number"
            variant="outlined"
            density="compact"
            hide-details
            style="max-width: 140px"
            @blur="normalizeAssign(item)"
          />
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex justify-end ga-1">
            <v-btn size="small" variant="tonal" prepend-icon="mdi-minus" :disabled="!item.enabled" @click="inc(item, -1)">
              -1
            </v-btn>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" :disabled="!item.enabled" @click="inc(item, +1)">
              +1
            </v-btn>

            <v-btn
              size="small"
              color="primary"
              variant="flat"
              prepend-icon="mdi-store"
              :disabled="loading || applying || !productId || !item.enabled"
              @click="applyOne(item)"
            >
              Asignar
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch, defineExpose } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";

const props = defineProps({
  productId: { type: [Number, String], default: null },
});

const products = useProductsStore();

const loading = ref(false);
const applying = ref(false);
const error = ref(null);
const q = ref("");

/**
 * rows:
 * { branch_id, branch_name, enabled, stock_qty, assign_qty }
 *
 * ✅ Persistencia UX en edición:
 * - assign_qty por defecto = stock_qty (lo que hay actualmente)
 * - si el usuario ya había escrito algo, refresh NO lo pisa
 */
const rows = ref([]);

const headers = [
  { title: "Habilitar", key: "enabled", sortable: false, width: 90 },
  { title: "Sucursal", key: "branch", sortable: false },
  { title: "Stock actual", key: "stock_qty", sortable: false, align: "end" },
  { title: "Asignar ahora", key: "assign_qty", sortable: false, align: "end" },
  { title: "Acción", key: "actions", sortable: false, align: "end" },
];

function toNum(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function fmtQty(v) {
  return toNum(v, 0).toFixed(3);
}
function normalizeAssign(it) {
  it.assign_qty = Math.max(0, toNum(it.assign_qty, 0));
}
function inc(it, delta) {
  it.assign_qty = Math.max(0, toNum(it.assign_qty, 0) + Number(delta || 0));
}

const enabledCount = computed(() => rows.value.filter((r) => !!r.enabled).length);
const hasAnyEnabled = computed(() => enabledCount.value > 0);
const totalAssign = computed(() => {
  let s = 0;
  for (const r of rows.value) if (r.enabled) s += toNum(r.assign_qty, 0);
  return s.toFixed(3);
});

const filteredRows = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  if (!qq) return rows.value;
  return rows.value.filter((r) => String(r.branch_name || "").toLowerCase().includes(qq));
});

function clearAssign() {
  rows.value.forEach((r) => (r.assign_qty = 0));
}
function enableAll() {
  rows.value.forEach((r) => (r.enabled = true));
}
function disableAll() {
  rows.value.forEach((r) => (r.enabled = false));
}

function buildAssignMap() {
  // ✅ guardamos lo que el usuario ya escribió para NO pisarlo con refresh()
  const map = new Map();
  for (const r of rows.value) {
    map.set(Number(r.branch_id), {
      enabled: !!r.enabled,
      assign_qty: toNum(r.assign_qty, null), // null si no había
    });
  }
  return map;
}

async function refresh() {
  const pid = Number(props.productId || 0);
  if (!pid) return;

  loading.value = true;
  error.value = null;

  // ✅ antes de refrescar, guardo el estado actual (persistencia UI)
  const prev = buildAssignMap();

  try {
    // ✅ 1) endpoint matriz
    if (typeof products.fetchBranchesMatrix === "function") {
      const matrix = await products.fetchBranchesMatrix(pid);
      const arr = Array.isArray(matrix) ? matrix : [];

      rows.value = arr
        .map((x) => {
          const bid = Number(x?.branch_id || x?.id || 0);
          const stock = toNum(x?.stock_qty ?? x?.qty ?? x?.stock ?? 0, 0);

          const prevRow = prev.get(bid) || null;

          // ✅ assign_qty default = stock actual (persistente en edición)
          // ✅ si el usuario ya escribió algo, se respeta
          const assign =
            prevRow && prevRow.assign_qty !== null
              ? prevRow.assign_qty
              : stock;

          return {
            branch_id: bid,
            branch_name: x?.branch_name || x?.name || `Sucursal #${bid}`,
            enabled:
              prevRow ? prevRow.enabled : (x?.enabled !== false && Number(x?.enabled ?? 1) !== 0),
            stock_qty: stock,
            assign_qty: Math.max(0, toNum(assign, 0)),
          };
        })
        .filter((r) => r.branch_id > 0)
        .sort((a, b) => a.branch_id - b.branch_id);

      return;
    }

    // ✅ 2) fallback branches + stockQty
    const branches = typeof products.fetchBranches === "function" ? await products.fetchBranches() : [];
    const bArr = Array.isArray(branches) ? branches : [];

    const base = bArr
      .map((b) => {
        const bid = Number(b?.id || 0);
        const prevRow = prev.get(bid) || null;

        return {
          branch_id: bid,
          branch_name: b?.name || `Sucursal #${bid}`,
          enabled: prevRow ? prevRow.enabled : true,
          stock_qty: 0,
          assign_qty: prevRow && prevRow.assign_qty !== null ? prevRow.assign_qty : 0,
        };
      })
      .filter((x) => x.branch_id > 0)
      .sort((a, b) => a.branch_id - b.branch_id);

    if (typeof products.fetchStockQty === "function") {
      for (const r of base) {
        r.stock_qty = await products.fetchStockQty(pid, r.branch_id);
        // ✅ si no había valor escrito, default = stock actual
        if (prev.get(r.branch_id)?.assign_qty === null) {
          r.assign_qty = r.stock_qty;
        }
      }
    }

    rows.value = base;
  } catch (e) {
    error.value = e?.message || "No se pudo cargar la matriz";
  } finally {
    loading.value = false;
  }
}

async function applyOne(row) {
  const pid = Number(props.productId || 0);
  if (!pid) return;

  const bid = Number(row?.branch_id || 0);
  if (!bid) return;

  const qty = toNum(row?.assign_qty, 0);

  applying.value = true;
  error.value = null;

  try {
    // ✅ aplica (setea/ajusta) stock
    const ok = await products.initStock({ product_id: pid, branch_id: bid, qty });
    if (!ok) throw new Error(products.error || "No se pudo aplicar stock");

    // ✅ refrescar stock visible
    if (typeof products.fetchStockQty === "function") {
      row.stock_qty = await products.fetchStockQty(pid, bid);
    } else {
      row.stock_qty = qty;
    }

    // ✅ persistencia UX: dejamos el input igual al stock actual
    row.assign_qty = row.stock_qty;
  } catch (e) {
    error.value = e?.message || "No se pudo aplicar";
  } finally {
    applying.value = false;
  }
}

async function applyReparto() {
  const pid = Number(props.productId || 0);
  if (!pid) return;

  applying.value = true;
  error.value = null;

  try {
    const enabled = rows.value.filter((r) => !!r.enabled);
    for (const r of enabled) {
      await applyOne(r);
    }
  } finally {
    applying.value = false;
  }
}

watch(
  () => props.productId,
  (v) => {
    if (Number(v || 0) > 0) refresh();
  },
  { immediate: true }
);

defineExpose({ refresh, applyReparto });
</script>

<style scoped>
.psb-root { display: grid; gap: 14px; }
.psb-table :deep(th) { font-weight: 900; }
</style>
