<!-- src/modules/products/components/panels/ProductStockPanel.vue -->
<template>
  <div class="ps-root">
    <div class="ps-head">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Stock por sucursal</div>
        <div class="text-caption text-medium-emphasis">
          Cargá cantidades. Para aplicar, si el producto aún no existe, se guarda automáticamente.
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="refresh" :loading="loading">
          Refrescar
        </v-btn>

        <v-btn color="primary" variant="flat" prepend-icon="mdi-check" @click="applyAll" :disabled="loading">
          Aplicar habilitadas
        </v-btn>
      </div>
    </div>

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
      <div class="text-caption text-medium-emphasis">
        * Solo se aplica stock en sucursales <b>habilitadas</b> (product_branches).
      </div>
    </div>

    <v-card rounded="xl" variant="flat" class="ps-card">
      <v-data-table
        :headers="headers"
        :items="filteredRows"
        item-key="branch_id"
        :items-per-page="10"
        class="ps-table"
        :loading="loading"
      >
        <template #item.enabled="{ item }">
          <v-chip size="small" :color="item.enabled ? 'green' : 'grey'" variant="tonal">
            {{ item.enabled ? "Sí" : "No" }}
          </v-chip>
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
            :disabled="loading || !item.enabled"
            @update:modelValue="(v) => (assignNow[item.branch_id] = v)"
          />
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
            <v-btn
              size="small"
              variant="tonal"
              prepend-icon="mdi-checkbox-marked-circle-outline"
              v-if="!item.enabled"
              :disabled="loading"
              @click="enableBranch(item.branch_id)"
            >
              Habilitar
            </v-btn>

            <v-btn
              size="small"
              color="primary"
              variant="flat"
              @click="applyOne(item.branch_id)"
              :loading="rowLoading[item.branch_id] === true"
              :disabled="loading || !item.enabled"
            >
              Aplicar
            </v-btn>
          </div>
        </template>

        <template #bottom>
          <div class="text-caption text-medium-emphasis pa-3">
            * “Habilitar” solo funciona si tu backend permite PATCH con <code>branch_ids</code> (admin).
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";

const props = defineProps({
  productId: { type: [Number, String], default: null },
  modelValue: { type: Array, default: () => [] },
  ensureId: { type: Function, default: null },
});

const emit = defineEmits(["update:modelValue", "applied"]);

const products = useProductsStore();

const loading = ref(false);
const error = ref(null);

const q = ref("");
const assignNow = ref({});
const rowLoading = ref({});

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
  { title: "Habilitada", key: "enabled", sortable: false, width: 120 },
  { title: "Sucursal", key: "branch", sortable: false },
  { title: "Actual", key: "current_qty", sortable: false, align: "end", width: 120 },
  { title: "Cantidad", key: "assign_now", sortable: false, width: 220 },
  { title: "", key: "actions", sortable: false, align: "end", width: 240 },
];

const filteredRows = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();
  if (!qq) return rows.value;
  return rows.value.filter((r) => String(r.branch_name || "").toLowerCase().includes(qq));
});

// precargar inputs con current_qty
watch(
  () => rows.value,
  (arr) => {
    const map = { ...(assignNow.value || {}) };
    for (const r of Array.isArray(arr) ? arr : []) {
      const bid = toInt(r.branch_id, 0);
      if (!bid) continue;
      if (map[bid] === undefined || map[bid] === null || map[bid] === "") {
        map[bid] = num(r.current_qty, 0);
      }
    }
    assignNow.value = map;
  },
  { immediate: true, deep: true }
);

async function ensurePid() {
  const pid = toInt(props.productId, 0);
  if (pid > 0) return pid;

  if (typeof props.ensureId === "function") {
    const createdId = await props.ensureId();
    const cid = toInt(createdId, 0);
    if (cid > 0) return cid;
  }

  throw new Error("Necesitás guardar el producto para aplicar stock.");
}

async function refresh() {
  loading.value = true;
  error.value = null;

  try {
    const pid = toInt(props.productId, 0);

    if (pid > 0) {
      const matrix = await products.fetchBranchesMatrix(pid);
      rows.value = (Array.isArray(matrix) ? matrix : []).map((x) => ({
        branch_id: toInt(x.branch_id ?? x.id, 0),
        branch_name: x.branch_name || x.name || "",
        enabled: x.enabled === true || Number(x.enabled || 0) === 1,
        current_qty: num(x.current_qty ?? x.qty ?? x.stock_qty ?? 0, 0),
      }));
    } else {
      const bs = await products.fetchBranches();
      rows.value = (Array.isArray(bs) ? bs : []).map((b) => ({
        branch_id: toInt(b.id, 0),
        branch_name: b.name || "",
        enabled: true,     // preconfig
        current_qty: 0,
      }));
    }
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo refrescar";
  } finally {
    loading.value = false;
  }
}

async function enableBranch(branchId) {
  error.value = null;
  try {
    const pid = await ensurePid();
    const bid = toInt(branchId, 0);
    if (!bid) return;

    const ok = await products.enableBranches(pid, [bid]); // ✅ nuevo en store
    if (!ok) throw new Error(products.error || "No se pudo habilitar la sucursal");

    await refresh();
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo habilitar";
  }
}

async function applyOne(branchId) {
  const bid = toInt(branchId, 0);
  if (!bid) return;

  rowLoading.value = { ...rowLoading.value, [bid]: true };
  error.value = null;

  try {
    const pid = await ensurePid();

    const row = (rows.value || []).find((r) => toInt(r.branch_id, 0) === bid) || null;
    if (!row?.enabled) throw new Error("Sucursal no habilitada para este producto.");

    const qty = num(assignNow.value[bid], 0);

    const ok = await products.initStock({ product_id: pid, branch_id: bid, qty });
    if (!ok) throw new Error(products.error || "No se pudo aplicar stock");

    await refresh();
    emit("applied");
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo aplicar stock";
  } finally {
    const next = { ...rowLoading.value };
    delete next[bid];
    rowLoading.value = next;
  }
}

async function applyAll() {
  error.value = null;
  loading.value = true;

  try {
    const pid = await ensurePid();

    const enabledRows = (rows.value || []).filter((r) => !!r.enabled);
    for (const r of enabledRows) {
      const bid = toInt(r.branch_id, 0);
      const qty = num(assignNow.value[bid], 0);
      const ok = await products.initStock({ product_id: pid, branch_id: bid, qty });
      if (!ok) throw new Error(products.error || `Falló aplicar stock en branch_id=${bid}`);
    }

    await refresh();
    emit("applied");
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo aplicar";
  } finally {
    loading.value = false;
  }
}

watch(
  () => toInt(props.productId, 0),
  () => refresh(),
  { immediate: true }
);
</script>

<style scoped>
.ps-root { display: grid; gap: 12px; }
.ps-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.ps-controls { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.ps-card { border: 1px solid rgba(255,255,255,.06); padding: 8px; }
.ps-table :deep(th) { font-weight: 800; }
</style>
