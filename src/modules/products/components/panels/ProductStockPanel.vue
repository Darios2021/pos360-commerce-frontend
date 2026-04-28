<!-- src/modules/products/components/panels/ProductStockPanel.vue -->
<template>
  <div class="ps-root">

    <!-- Loading skeleton -->
    <div v-if="loading" class="ps-skeleton-list">
      <div v-for="n in 3" :key="n" class="ps-skeleton-row" />
    </div>

    <!-- Error -->
    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="ma-3">
      {{ error }}
      <template #append>
        <v-btn size="x-small" variant="text" @click="refresh">Reintentar</v-btn>
      </template>
    </v-alert>

    <!-- Empty -->
    <div v-else-if="!rows.length" class="ps-empty">
      <v-icon size="32" color="medium-emphasis">mdi-store-off-outline</v-icon>
      <div class="ps-empty-text">Sin sucursales configuradas</div>
      <v-btn size="small" variant="tonal" @click="refresh" class="mt-2">
        <v-icon start size="16">mdi-refresh</v-icon>Recargar
      </v-btn>
    </div>

    <!-- Branch list -->
    <div v-else class="ps-list">
      <div
        v-for="row in rows"
        :key="row.branch_id"
        class="ps-row"
        :class="{ 'ps-row--active': getQty(row) > 0 }"
      >
        <!-- Branch info -->
        <div class="ps-branch">
          <div class="ps-branch-icon" :class="{ active: getQty(row) > 0 }">
            <v-icon size="14" :color="getQty(row) > 0 ? 'white' : undefined">mdi-store-outline</v-icon>
          </div>
          <div class="ps-branch-info">
            <div class="ps-branch-name">{{ row.branch_name }}</div>
            <div class="ps-branch-sub" v-if="showCurrent">
              Stock actual:
              <span :class="num(row.current_qty) > 0 ? 'ps-stock-ok' : 'ps-stock-zero'">
                {{ num(row.current_qty) }}
              </span>
            </div>
            <div class="ps-branch-sub" v-else>Sin stock previo</div>
          </div>
        </div>

        <!-- Stepper -->
        <div class="ps-stepper">
          <button
            class="ps-step-btn ps-step-btn--minus"
            @click="decrement(row.branch_id)"
            :disabled="disabled || getQty(row) <= 0"
            type="button"
          >
            <v-icon size="16">mdi-minus</v-icon>
          </button>
          <input
            class="ps-qty-input"
            type="number"
            min="0"
            :value="qtyMap[row.branch_id] ?? 0"
            :disabled="disabled"
            @change="onInput(row.branch_id, $event.target.value)"
            @focus="$event.target.select()"
          />
          <button
            class="ps-step-btn ps-step-btn--plus"
            @click="increment(row.branch_id)"
            :disabled="disabled"
            type="button"
          >
            <v-icon size="16">mdi-plus</v-icon>
          </button>
        </div>

        <!-- Badge -->
        <div class="ps-badge-wrap">
          <!-- Modo edición: badge según diferencia con stock actual -->
          <template v-if="showCurrent">
            <span v-if="getDiff(row) === 0" class="ps-badge ps-badge--neutral" title="No cambia">
              <v-icon size="10">mdi-equal</v-icon>
              Sin cambios
            </span>
            <span v-else-if="getDiff(row) > 0" class="ps-badge ps-badge--up" :title="`Aumenta ${getDiff(row)}`">
              <v-icon size="10">mdi-arrow-up-bold</v-icon>
              +{{ getDiff(row) }}
            </span>
            <span v-else class="ps-badge ps-badge--down" :title="`Baja ${Math.abs(getDiff(row))}`">
              <v-icon size="10">mdi-arrow-down-bold</v-icon>
              {{ getDiff(row) }}
            </span>
          </template>
          <!-- Modo creación: badge clásico -->
          <template v-else>
            <span v-if="getQty(row) > 0" class="ps-badge ps-badge--green">
              <v-icon size="10">mdi-check</v-icon>
              {{ getQty(row) }} uds
            </span>
            <span v-else class="ps-badge ps-badge--grey">sin stock</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Footer: total + acciones -->
    <div v-if="rows.length && !loading" class="ps-footer">
      <div class="ps-total">
        <v-icon size="14" color="primary">mdi-sigma</v-icon>
        Total: <strong>{{ totalQty }}</strong> unidades en {{ activeBranches }} sucursal{{ activeBranches !== 1 ? 'es' : '' }}
        <span v-if="showCurrent && hasChanges" class="ps-changes-badge" title="Hay cambios sin guardar">
          <v-icon size="11">mdi-pencil</v-icon>
          {{ changedCount }} cambio{{ changedCount !== 1 ? 's' : '' }}
        </span>
      </div>
      <div class="ps-footer-actions">
        <v-btn
          v-if="showCurrent && hasChanges"
          size="x-small"
          variant="text"
          @click="restoreCurrent"
          :disabled="disabled"
          class="ps-reset-btn"
          title="Volver a los valores actuales en DB"
        >
          <v-icon size="14" start>mdi-restore</v-icon>
          Restaurar al actual
        </v-btn>
        <v-btn
          v-if="totalQty > 0"
          size="x-small"
          variant="text"
          @click="resetAll"
          :disabled="disabled"
          class="ps-reset-btn"
        >
          Limpiar todo
        </v-btn>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useProductsStore } from "../../../../app/store/products.store";
import { useAuthStore } from "../../../../app/store/auth.store";
import http from "../../../../app/api/http";

const props = defineProps({
  productId: { type: [Number, String], default: null },
  modelValue: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);
const products = useProductsStore();
const auth = useAuthStore();

// ✅ Set de branches que el user puede operar.
// - super_admin / admin sin scope: vacío → no se filtra (ve todas).
// - user con scope: solo las que tiene en auth.user.branches.
function getUserBranchIdsSet() {
  const user = auth?.user || {};
  const isSuperAdmin = String(user?.role || "").toLowerCase() === "super_admin"
    || (Array.isArray(user?.roles) && user.roles.map((r) => String(r).toLowerCase()).includes("super_admin"));
  if (isSuperAdmin) return null; // null = sin filtro

  const arr = Array.isArray(user?.branches) ? user.branches : [];
  const ids = arr.map((x) => {
    if (typeof x === "object") return Number(x?.id ?? x?.branch_id ?? 0);
    return Number(x) || 0;
  }).filter((n) => n > 0);

  if (!ids.length) return null; // sin info → no filtrar (que decida el backend)
  return new Set(ids);
}

const loading = ref(false);
const error = ref(null);
const qtyMap = ref({});
// Track del productId que cargó las rows actuales — para detectar carga stale
let lastLoadedPid = 0;
// Flag por row: true cuando el usuario tocó el input (no pisar al re-cargar)
const touched = ref({});

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
  return s === "true" || s === "1" ? true : s === "false" || s === "0" ? false : d;
}

const showCurrent = computed(() => toInt(props.productId, 0) > 0);

const rows = computed({
  get: () => (Array.isArray(props.modelValue) ? props.modelValue : []),
  set: (v) => emit("update:modelValue", Array.isArray(v) ? v : []),
});

function getQty(row) {
  const bid = toInt(row.branch_id, 0);
  return num(qtyMap.value[bid], 0);
}

// Diferencia entre el input actual y el stock real en DB
function getDiff(row) {
  return getQty(row) - num(row.current_qty, 0);
}

const totalQty = computed(() => rows.value.reduce((s, r) => s + getQty(r), 0));
const activeBranches = computed(() => rows.value.filter((r) => getQty(r) > 0).length);

const changedCount = computed(() =>
  rows.value.filter((r) => getDiff(r) !== 0).length
);
const hasChanges = computed(() => changedCount.value > 0);

function syncQtyMapFromRows() {
  const map = { ...qtyMap.value };
  for (const r of rows.value) {
    const bid = toInt(r.branch_id, 0);
    if (!bid) continue;
    if (map[bid] === undefined || map[bid] === null) {
      map[bid] = num(r.qty, 0);
    }
  }
  qtyMap.value = map;
}

function writeBack() {
  const next = rows.value.map((r) => {
    const bid = toInt(r.branch_id, 0);
    const qty = num(qtyMap.value[bid], 0);
    return { ...r, qty, enabled: qty > 0 };
  });
  rows.value = next;
}

function markTouched(bid) {
  if (!bid) return;
  touched.value = { ...touched.value, [bid]: true };
}

function onInput(branchId, raw) {
  const bid = toInt(branchId, 0);
  if (!bid) return;
  const v = Math.max(0, num(raw, 0));
  qtyMap.value = { ...qtyMap.value, [bid]: v };
  markTouched(bid);
  writeBack();
}

function increment(branchId) {
  const bid = toInt(branchId, 0);
  if (!bid) return;
  const cur = num(qtyMap.value[bid], 0);
  qtyMap.value = { ...qtyMap.value, [bid]: cur + 1 };
  markTouched(bid);
  writeBack();
}

function decrement(branchId) {
  const bid = toInt(branchId, 0);
  if (!bid) return;
  const cur = num(qtyMap.value[bid], 0);
  if (cur <= 0) return;
  qtyMap.value = { ...qtyMap.value, [bid]: cur - 1 };
  markTouched(bid);
  writeBack();
}

function resetAll() {
  const map = {};
  for (const r of rows.value) {
    const bid = toInt(r.branch_id, 0);
    if (bid) map[bid] = 0;
  }
  qtyMap.value = map;
  writeBack();
}

// Vuelve los inputs a los valores reales actuales (deshace cambios sin guardar)
function restoreCurrent() {
  const map = {};
  for (const r of rows.value) {
    const bid = toInt(r.branch_id, 0);
    if (bid) map[bid] = num(r.current_qty, 0);
  }
  qtyMap.value = map;
  touched.value = {}; // limpiar marcas de "tocado"
  writeBack();
}

async function fetchBranchesSafe() {
  if (products && typeof products.fetchBranches === "function") return await products.fetchBranches();
  const { data } = await http.get("/branches");
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return arr;
}

async function refresh() {
  loading.value = true;
  error.value = null;
  try {
    // ✅ Filtro por scope del user actual (admin = ve todo, user = sus branches)
    const allowedSet = getUserBranchIdsSet();

    const pid = toInt(props.productId, 0);
    if (pid > 0) {
      const matrix = await products.fetchBranchesMatrix(pid);
      const arr = (Array.isArray(matrix) ? matrix : []).map((x) => ({
        branch_id: toInt(x.branch_id ?? x.id, 0),
        branch_name: x.branch_name || x.name || "",
        warehouse_id: toInt(x.warehouse_id ?? x.default_warehouse_id ?? 0, 0),
        current_qty: num(x.current_qty ?? x.qty ?? 0, 0),
        qty: num(x.assign_qty ?? x.qty_to_set ?? 0, 0),
        enabled: toBool(x.enabled ?? x.is_active ?? 0, false),
      })).filter((r) => !allowedSet || allowedSet.has(r.branch_id));

      // ✅ Solo respetamos los valores locales si:
      //   - ya cargamos para ESTE producto antes (no son de un load stale), Y
      //   - el usuario tocó el input (touched=true).
      // Sino, pre-cargamos el stock ACTUAL real para que no se pise con 0.
      const sameProduct = lastLoadedPid === pid;
      const local = Array.isArray(rows.value) ? rows.value : [];
      const localMap = sameProduct
        ? new Map(
            local
              .filter((r) => touched.value[toInt(r.branch_id, 0)])
              .map((r) => [
                toInt(r.branch_id, 0),
                { qty: num(r.qty, 0), enabled: toBool(r.enabled, false) },
              ])
          )
        : new Map();

      rows.value = arr
        .map((r) => {
          if (localMap.has(r.branch_id)) {
            const lo = localMap.get(r.branch_id);
            return { ...r, qty: lo.qty, enabled: lo.enabled };
          }
          const initialQty = num(r.current_qty, 0);
          return { ...r, qty: initialQty, enabled: initialQty > 0 };
        })
        .filter((r) => r.branch_id > 0 && r.branch_name);

      lastLoadedPid = pid;
      // Reset touched al cargar un producto nuevo (sino se carga sólo el que tocó)
      if (!sameProduct) {
        touched.value = {};
        // ✅ Forzar regeneración de qtyMap desde rows.qty (sino quedan los 0 viejos)
        const fresh = {};
        for (const r of rows.value) {
          const bid = toInt(r.branch_id, 0);
          if (bid) fresh[bid] = num(r.qty, 0);
        }
        qtyMap.value = fresh;
      }
    } else {
      const bs = await fetchBranchesSafe();
      const arr = (Array.isArray(bs) ? bs : [])
        .map((b) => ({
          branch_id: toInt(b.id, 0), branch_name: b.name || "",
          warehouse_id: toInt(b.warehouse_id ?? 0, 0), current_qty: 0, qty: 0, enabled: false,
        }))
        .filter((r) => !allowedSet || allowedSet.has(r.branch_id));
      const local = Array.isArray(rows.value) ? rows.value : [];
      const localMap = new Map(local.map((r) => [toInt(r.branch_id, 0), num(r.qty, 0)]));
      rows.value = arr
        .map((r) => ({ ...r, qty: localMap.has(r.branch_id) ? localMap.get(r.branch_id) : 0 }))
        .filter((r) => r.branch_id > 0 && r.branch_name);
    }
    syncQtyMapFromRows();
  } catch (e) {
    error.value = products.error || e?.message || "No se pudo cargar";
  } finally {
    loading.value = false;
  }
}

watch(() => rows.value, () => syncQtyMapFromRows(), { immediate: true, deep: true });
watch(() => props.productId, () => refresh(), { immediate: true });
</script>

<style scoped>
.ps-root {
  display: flex;
  flex-direction: column;
}

/* Skeleton */
.ps-skeleton-list { display: flex; flex-direction: column; gap: 1px; padding: 8px; }
.ps-skeleton-row  { height: 52px; border-radius: 8px; background: rgba(var(--v-theme-on-surface), 0.06); animation: ps-pulse 1.4s ease infinite; }
@keyframes ps-pulse { 0%,100%{ opacity:0.5 } 50%{ opacity:1 } }

/* Empty */
.ps-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 32px 16px; gap: 6px; }
.ps-empty-text { font-size: 13px; opacity: 0.5; }

/* List */
.ps-list { display: flex; flex-direction: column; }

.ps-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  transition: background 0.15s;
}
.ps-row:last-child { border-bottom: none; }
.ps-row--active { background: rgba(var(--v-theme-success), 0.04); }

/* Branch info */
.ps-branch { display: flex; align-items: center; gap: 9px; flex: 1; min-width: 0; }
.ps-branch-icon {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: grid; place-items: center;
  background: rgba(var(--v-theme-on-surface), 0.1);
  transition: background 0.2s;
}
.ps-branch-icon.active { background: rgb(var(--v-theme-success)); }
.ps-branch-name { font-size: 13px; font-weight: 400; line-height: 1.2; }
.ps-branch-sub  { font-size: 11px; opacity: 0.55; }
.ps-stock-ok   { color: rgb(var(--v-theme-success)); font-weight: 400; }
.ps-stock-zero { opacity: 0.4; }

/* Stepper */
.ps-stepper {
  display: flex;
  align-items: center;
  border: 1.5px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 1.5));
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
  background: rgb(var(--v-theme-surface));
}
.ps-step-btn {
  width: 32px; height: 36px;
  display: grid; place-items: center;
  border: none; cursor: pointer; background: transparent;
  color: inherit; transition: background 0.12s;
}
.ps-step-btn:hover:not(:disabled) { background: rgba(var(--v-theme-primary), 0.1); }
.ps-step-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.ps-step-btn--minus { border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.ps-step-btn--plus  { border-left:  1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }

.ps-qty-input {
  width: 52px; height: 36px;
  text-align: center; font-size: 14px; font-weight: 500;
  border: none; outline: none; background: transparent; color: inherit;
  -moz-appearance: textfield;
}
.ps-qty-input::-webkit-inner-spin-button,
.ps-qty-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }

/* Badge */
.ps-badge-wrap { flex-shrink: 0; min-width: 64px; text-align: right; }
.ps-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 10px; font-weight: 400; padding: 2px 7px; border-radius: 999px;
}
.ps-badge--green { background: rgba(var(--v-theme-success), 0.15); color: rgb(var(--v-theme-success)); }
.ps-badge--grey  { background: rgba(var(--v-theme-on-surface), 0.07); opacity: 0.55; }
/* Badges modo edición */
.ps-badge--neutral {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.ps-badge--up {
  background: rgba(var(--v-theme-success), 0.15);
  color: rgb(var(--v-theme-success));
}
.ps-badge--down {
  background: rgba(var(--v-theme-warning), 0.18);
  color: rgb(var(--v-theme-warning));
}

/* Footer */
.ps-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-surface-variant), 0.2);
}
.ps-total { font-size: 11px; opacity: 0.65; display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.ps-changes-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(var(--v-theme-warning), 0.15);
  color: rgb(var(--v-theme-warning));
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 400;
  opacity: 1;
  margin-left: 4px;
}
.ps-footer-actions { display: flex; align-items: center; gap: 4px; }
.ps-reset-btn { font-size: 11px; opacity: 0.7; }
.ps-reset-btn:hover { opacity: 1; }

/* Mobile */
@media (max-width: 480px) {
  .ps-row { padding: 8px 10px; gap: 8px; }
  .ps-badge-wrap { display: none; }
  .ps-qty-input { width: 44px; }
}
</style>
