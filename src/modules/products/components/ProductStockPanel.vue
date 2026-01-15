<!-- src/modules/products/components/ProductStockPanel.vue -->
<template>
  <div class="ps-root">
    <div class="ps-head">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Stock por sucursal (integral)</div>
        <div class="text-caption text-medium-emphasis">
          Se hidrata desde DB (product_branches + stock_balances).
        </div>
      </div>

      <div class="d-flex ga-2 flex-wrap justify-end">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="refresh" :loading="loading">
          Refrescar matriz
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-check"
          @click="emitApply"
          :disabled="!productId || loading"
        >
          Aplicar reparto
        </v-btn>
      </div>
    </div>

    <v-alert type="info" variant="tonal" class="mb-3">
      Podés preconfigurar sucursales y cantidades, pero para aplicar stock necesitás un <b>ID de producto</b>.
      <div class="mt-1 text-caption">
        Tip: en edición, “Asignar ahora” arranca con el stock actual para que refleje la realidad.
      </div>
    </v-alert>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
      {{ error }}
    </v-alert>

    <div class="ps-controls">
      <v-text-field
        v-model="q"
        label="Buscar sucursal"
        variant="outlined"
        density="comfortable"
        clearable
        style="max-width: 340px"
      />

      <v-chip size="small" variant="tonal">Habilitadas: {{ enabledCount }}</v-chip>
      <v-chip size="small" variant="tonal">Total asignar: {{ totalAssign.toFixed(3) }}</v-chip>

      <div class="d-flex ga-2 flex-wrap justify-end">
        <v-btn variant="tonal" prepend-icon="mdi-broom" @click="resetAssign" :disabled="loading">
          Reset asignación
        </v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-checkbox-multiple-marked" @click="enableAll" :disabled="loading">
          Habilitar todas
        </v-btn>
        <v-btn variant="tonal" prepend-icon="mdi-checkbox-multiple-blank-outline" @click="disableAll" :disabled="loading">
          Deshabilitar todas
        </v-btn>
      </div>
    </div>

    <v-card rounded="xl" class="ps-card" variant="flat">
      <v-data-table
        :headers="headers"
        :items="filteredRows"
        item-key="branch_id"
        :items-per-page="10"
        class="ps-table"
        :loading="loading"
      >
        <template #item.enabled="{ item }">
          <v-checkbox-btn v-model="item.enabled" />
        </template>

        <template #item.branch="{ item }">
          <div class="d-flex flex-column">
            <div class="font-weight-bold">{{ item.branch_name }}</div>
            <div class="text-caption text-medium-emphasis">ID {{ item.branch_id }}</div>
          </div>
        </template>

        <template #item.current_qty="{ item }">
          <div class="text-right font-weight-bold">{{ num(item.current_qty).toFixed(3) }}</div>
        </template>

        <template #item.assign_now="{ item }">
          <v-text-field
            v-model="assignNow[item.branch_id]"
            type="number"
            variant="outlined"
            density="comfortable"
            hide-details
            style="max-width: 160px"
            :disabled="!item.enabled || loading"
            @update:modelValue="(v) => onAssignTyping(item.branch_id, v)"
          />
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-1 justify-end">
            <v-btn
              size="small"
              variant="tonal"
              @click="step(item.branch_id, -1)"
              :disabled="!item.enabled || loading"
            >
              -1
            </v-btn>
            <v-btn
              size="small"
              variant="tonal"
              @click="step(item.branch_id, +1)"
              :disabled="!item.enabled || loading"
            >
              +1
            </v-btn>

            <v-btn
              size="small"
              color="primary"
              variant="flat"
              @click="applyOne(item.branch_id)"
              :disabled="!productId || !item.enabled || loading"
            >
              Asignar
            </v-btn>
          </div>
        </template>

        <template #bottom>
          <div class="text-caption text-medium-emphasis pa-3">
            * “Asignar” crea/ajusta stock por sucursal. “Aplicar reparto” aplica a todas las habilitadas.
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../app/store/products.store";

const props = defineProps({
  productId: { type: [Number, String], default: null },
  // rows: [{branch_id, branch_name, enabled, current_qty}]
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:modelValue", "applied"]);

const products = useProductsStore();

const loading = ref(false);
const error = ref(null);

const q = ref("");
const assignNow = ref({}); // { [branch_id]: number|string }

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}
function num(v, d = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

const rows = computed({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
  set: (v) => emit("update:modelValue", Array.isArray(v) ? v : []),
});

const headers = [
  { title: "Habilitar", key: "enabled", sortable: false, width: 90 },
  { title: "Sucursal", key: "branch", sortable: false },
  { title: "Stock actual", key: "current_qty", sortable: false, align: "end", width: 140 },
  { title: "Asignar ahora", key: "assign_now", sortable: false, width: 220 },
  { title: "Acción", key: "actions", sortable: false, align: "end", width: 220 },
];

const filteredRows = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  if (!qq) return rows.value;
  return rows.value.filter((r) => String(r.branch_name || "").toLowerCase().includes(qq));
});

const enabledCount = computed(() => rows.value.filter((r) => !!r.enabled).length);

const totalAssign = computed(() => {
  let sum = 0;
  for (const r of rows.value) {
    if (!r.enabled) continue;
    const bid = toInt(r.branch_id, 0);
    sum += num(assignNow.value[bid], 0);
  }
  return sum;
});

// ✅ cada vez que cambia la matriz, precargamos asignación con current_qty (refleja realidad)
watch(
  () => props.modelValue,
  (arr) => {
    const map = { ...(assignNow.value || {}) };
    for (const r of Array.isArray(arr) ? arr : []) {
      const bid = toInt(r.branch_id, 0);
      if (!bid) continue;
      // si no existe aún, lo seteamos al stock actual (clave para "edición")
      if (map[bid] === undefined || map[bid] === null || map[bid] === "") {
        map[bid] = num(r.current_qty, 0);
      }
    }
    assignNow.value = map;
  },
  { immediate: true, deep: true }
);

function onAssignTyping(branchId, v) {
  const bid = toInt(branchId, 0);
  assignNow.value[bid] = v;
}

function step(branchId, delta) {
  const bid = toInt(branchId, 0);
  const cur = num(assignNow.value[bid], 0);
  assignNow.value[bid] = Math.max(0, cur + Number(delta || 0));
}

function enableAll() {
  rows.value = rows.value.map((r) => ({ ...r, enabled: true }));
}
function disableAll() {
  rows.value = rows.value.map((r) => ({ ...r, enabled: false }));
}
function resetAssign() {
  const map = {};
  for (const r of rows.value) {
    map[toInt(r.branch_id, 0)] = num(r.current_qty, 0);
  }
  assignNow.value = map;
}

async function refresh() {
  const pid = toInt(props.productId, 0);
  if (!pid) return;

  loading.value = true;
  error.value = null;
  try {
    const matrix = await products.fetchBranchesMatrix(pid);
    rows.value = (Array.isArray(matrix) ? matrix : []).map((x) => ({
      branch_id: toInt(x.branch_id ?? x.id, 0),
      branch_name: x.branch_name || x.name || "",
      enabled: x.enabled === true || Number(x.enabled || 0) === 1,
      current_qty: num(x.current_qty ?? x.qty ?? 0, 0),
    }));

    // ✅ precargamos asignación = stock actual (así se ve lo existente)
    const map = {};
    for (const r of rows.value) map[r.branch_id] = num(r.current_qty, 0);
    assignNow.value = map;
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo refrescar matriz";
  } finally {
    loading.value = false;
  }
}

// ✅ aplica una sucursal: manda qty FINAL (lo que está en el input)
async function applyOne(branchId) {
  const pid = toInt(props.productId, 0);
  const bid = toInt(branchId, 0);
  if (!pid || !bid) return;

  loading.value = true;
  error.value = null;
  try {
    const qty = num(assignNow.value[bid], 0);
    const ok = await products.initStock({ product_id: pid, branch_id: bid, qty });
    if (!ok) throw new Error(products.error || "No se pudo aplicar stock");

    await refresh();
    emit("applied");
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo aplicar stock";
  } finally {
    loading.value = false;
  }
}

// ✅ aplica todas las habilitadas
async function emitApply() {
  const pid = toInt(props.productId, 0);
  if (!pid) {
    error.value = "Necesitás un ID de producto para aplicar stock.";
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const enabled = rows.value.filter((r) => !!r.enabled);
    for (const r of enabled) {
      const bid = toInt(r.branch_id, 0);
      const qty = num(assignNow.value[bid], 0);
      const ok = await products.initStock({ product_id: pid, branch_id: bid, qty });
      if (!ok) throw new Error(products.error || `Falló aplicar stock en branch_id=${bid}`);
    }

    await refresh();
    emit("applied");
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo aplicar reparto";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.ps-root { display: grid; gap: 14px; }
.ps-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.ps-controls { display:flex; align-items:center; gap:10px; flex-wrap:wrap; justify-content:space-between; }
.ps-card { border: 1px solid rgba(255,255,255,.06); padding: 8px; }
.ps-table :deep(th) { font-weight: 800; }
</style>
