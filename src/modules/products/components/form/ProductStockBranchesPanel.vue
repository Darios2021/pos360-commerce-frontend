<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/components/form/ProductStockBranchesPanel.vue -->
<template>
  <div class="psb-root">
    <div class="d-flex align-start justify-space-between ga-2 flex-wrap">
      <div>
        <div class="text-subtitle-1 font-weight-bold">Stock por sucursal (integral)</div>
        <div class="text-caption text-medium-emphasis">
          Se hidrata desde DB (stock_balances sumado por sucursal).
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
        <!-- ✅ FIX REAL: renderizamos un switch + chip con contraste -->
        <template #item.enabled="{ item }">
          <div class="psb-enabled">
            <v-chip
              size="small"
              class="psb-yn"
              :color="item.enabled ? 'primary' : undefined"
              :variant="item.enabled ? 'flat' : 'tonal'"
            >
              {{ item.enabled ? "Sí" : "No" }}
            </v-chip>

            <v-switch
              v-model="item.enabled"
              density="compact"
              inset
              hide-details
              color="primary"
              class="psb-switch"
            />
          </div>
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

const rows = ref([]);

const headers = [
  { title: "Habilitada", key: "enabled", sortable: false, width: 140 },
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
  const map = new Map();
  for (const r of rows.value) {
    map.set(Number(r.branch_id), {
      enabled: !!r.enabled,
      assign_qty: r.assign_qty === "" || r.assign_qty === null || r.assign_qty === undefined ? null : toNum(r.assign_qty, 0),
    });
  }
  return map;
}

async function refresh() {
  const pid = Number(props.productId || 0);
  if (!pid) return;

  loading.value = true;
  error.value = null;

  const prev = buildAssignMap();

  try {
    const matrix = await products.fetchBranchesMatrix(pid);
    const arr = Array.isArray(matrix) ? matrix : [];

    rows.value = arr
      .map((x) => {
        const bid = Number(x?.branch_id || 0);
        const stock = toNum(x?.stock_qty ?? 0, 0);
        const prevRow = prev.get(bid) || null;

        const assign = prevRow && prevRow.assign_qty !== null ? prevRow.assign_qty : stock;

        return {
          branch_id: bid,
          branch_name: x?.branch_name || `Sucursal #${bid}`,
          enabled: prevRow ? prevRow.enabled : true,
          stock_qty: stock,
          assign_qty: Math.max(0, toNum(assign, 0)),
        };
      })
      .filter((r) => r.branch_id > 0)
      .sort((a, b) => a.branch_id - b.branch_id);
  } catch (e) {
    error.value = e?.message || products.error || "No se pudo cargar la matriz";
  } finally {
    loading.value = false;
  }
}

async function applyOne(row) {
  const pid = Number(props.productId || 0);
  if (!pid) return;

  const bid = Number(row?.branch_id || 0);
  if (!bid) return;

  const qty = Math.max(0, toNum(row?.assign_qty, 0));

  applying.value = true;
  error.value = null;

  try {
    const ok = await products.initStock({ product_id: pid, branch_id: bid, qty });
    if (!ok) throw new Error(products.error || "No se pudo aplicar stock");

    const newQty = await products.fetchStockQty(pid, bid);
    row.stock_qty = toNum(newQty, qty);
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

  const enabled = rows.value.filter((r) => !!r.enabled);
  if (!enabled.length) return;

  applying.value = true;
  error.value = null;

  try {
    for (const r of enabled) {
      const qty = Math.max(0, toNum(r.assign_qty, 0));
      const ok = await products.initStock({ product_id: pid, branch_id: r.branch_id, qty });
      if (!ok) throw new Error(products.error || `No se pudo aplicar en sucursal ${r.branch_id}`);
      const newQty = await products.fetchStockQty(pid, r.branch_id);
      r.stock_qty = toNum(newQty, qty);
      r.assign_qty = r.stock_qty;
    }
  } catch (e) {
    error.value = e?.message || "No se pudo aplicar el reparto";
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
.psb-root {
  display: grid;
  gap: 14px;
}

.psb-table :deep(th) {
  font-weight: 900;
}

/* ✅ celda Habilitada: chip + switch alineados */
.psb-enabled {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 44px;
}

/* chip Sí/No legible en dark y light */
.psb-yn {
  font-weight: 900;
  letter-spacing: 0.2px;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 22%, transparent) !important;
}

/* ✅ switch SIEMPRE visible: track + thumb con contraste */
.psb-switch {
  opacity: 1 !important;
}

.psb-switch :deep(.v-selection-control),
.psb-switch :deep(.v-selection-control__wrapper),
.psb-switch :deep(.v-selection-control__input),
.psb-switch :deep(.v-switch__track),
.psb-switch :deep(.v-switch__thumb) {
  opacity: 1 !important;
}

/* OFF: track gris visible */
.psb-switch :deep(.v-switch__track) {
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 16%, transparent) !important;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 38%, transparent) !important;
}

/* OFF: thumb claro */
.psb-switch :deep(.v-switch__thumb) {
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, rgb(var(--v-theme-on-surface)) 10%) !important;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.45) !important;
}

/* ON: track con primary bien marcado */
.psb-switch :deep(input:checked + .v-selection-control__wrapper .v-switch__track) {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 45%, transparent) !important;
  border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 75%, transparent) !important;
}

/* ON: thumb con tinte primary */
.psb-switch :deep(input:checked + .v-selection-control__wrapper .v-switch__thumb) {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 28%, rgb(var(--v-theme-surface)) 72%) !important;
}
/* =========================================================
   ✅ FIX HARD: switches/checkboxes visibles en DARK dentro del dialog
   Aplica a CUALQUIER panel insertado (Step 3 incluido)
========================================================= */

.pf-card :deep(.v-selection-control),
.pf-card :deep(.v-switch),
.pf-card :deep(.v-checkbox),
.pf-card :deep(.v-checkbox-btn) {
  opacity: 1 !important;
}

/* Vuetify suele “lavar” el control con opacidades/overlays */
.pf-card :deep(.v-selection-control__wrapper),
.pf-card :deep(.v-selection-control__input) {
  opacity: 1 !important;
}

/* ✅ Switch track + thumb (contraste real) */
.pf-card :deep(.v-switch__track) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 18%, transparent) !important;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 38%, transparent) !important;
}

.pf-card :deep(.v-switch__thumb) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 92%, rgb(var(--v-theme-on-surface)) 8%) !important;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.45) !important;
}

/* ✅ Estado ON (cuando el input está checked) */
.pf-card :deep(.v-switch input:checked + .v-selection-control__wrapper .v-switch__track) {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 45%, transparent) !important;
  border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 78%, transparent) !important;
}

.pf-card :deep(.v-switch input:checked + .v-selection-control__wrapper .v-switch__thumb) {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 30%, rgb(var(--v-theme-surface)) 70%) !important;
}

/* ✅ Si hay “chip” No/Sí al lado, que no se funda */
.pf-card :deep(.v-chip) {
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 22%, transparent) !important;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 12%, transparent) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
  font-weight: 800;
}
/* =========================================================
   ✅ FIX OFF STATE: que el switch apagado se vea en DARK
========================================================= */

/* OFF: track visible + borde */
.pf-card :deep(.v-switch input:not(:checked) + .v-selection-control__wrapper .v-switch__track) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 22%, transparent) !important;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 45%, transparent) !important;
}

/* OFF: thumb bien claro (contraste) */
.pf-card :deep(.v-switch input:not(:checked) + .v-selection-control__wrapper .v-switch__thumb) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 96%, rgb(var(--v-theme-on-surface)) 4%) !important;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.55) !important;
}

/* OFF: por si Vuetify mete “disabled” visual aunque no esté disabled */
.pf-card :deep(.v-switch .v-selection-control--disabled),
.pf-card :deep(.v-switch.v-input--disabled) {
  opacity: 1 !important;
}

/* OFF: si el track sigue negro por overlay, forzamos outline interno */
.pf-card :deep(.v-switch__track) {
  box-shadow: inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 18%, transparent) !important;
}
/* =========================================================
   ✅ FINAL OVERRIDE (GANA SI O SI): Switch OFF visible en ProductFormDialog
   Motivo: hay reglas duplicadas (psb-switch vs pf-card) y el OFF queda negro
========================================================= */

/* OFF: track + borde bien visibles */
.pf-card :deep(.psb-switch input:not(:checked) + .v-selection-control__wrapper .v-switch__track),
.pf-card :deep(.psb-enabled input:not(:checked) + .v-selection-control__wrapper .v-switch__track),
.pf-card :deep(.v-data-table input:not(:checked) + .v-selection-control__wrapper .v-switch__track) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 28%, transparent) !important;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 55%, transparent) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 20%, transparent) !important;
}

/* OFF: thumb claro y con sombra */
.pf-card :deep(.psb-switch input:not(:checked) + .v-selection-control__wrapper .v-switch__thumb),
.pf-card :deep(.psb-enabled input:not(:checked) + .v-selection-control__wrapper .v-switch__thumb),
.pf-card :deep(.v-data-table input:not(:checked) + .v-selection-control__wrapper .v-switch__thumb) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 97%, rgb(var(--v-theme-on-surface)) 3%) !important;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.65) !important;
}
/* =========================================================
   ✅ DARK ONLY: que el switch OFF se vea (sin tocar LIGHT)
   Vuetify 3 agrega .v-theme--dark en el root
========================================================= */

:deep(.v-theme--dark) .pf-card :deep(.v-selection-control--switch) {
  opacity: 1 !important;
}

:deep(.v-theme--dark) .pf-card :deep(.v-selection-control--switch .v-switch__track) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 26%, transparent) !important;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 55%, transparent) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 18%, transparent) !important;
}

:deep(.v-theme--dark) .pf-card :deep(.v-selection-control--switch .v-switch__thumb) {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 96%, rgb(var(--v-theme-on-surface)) 4%) !important;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.65) !important;
}

/* ✅ OFF (input no checked) aún más fuerte */
:deep(.v-theme--dark) .pf-card :deep(.v-selection-control--switch input:not(:checked) + .v-selection-control__wrapper .v-switch__track) {
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 30%, transparent) !important;
  border-color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 62%, transparent) !important;
}

:deep(.v-theme--dark) .pf-card :deep(.v-selection-control--switch input:not(:checked) + .v-selection-control__wrapper .v-switch__thumb) {
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 98%, rgb(var(--v-theme-on-surface)) 2%) !important;
}
/* =========================================================
   ✅ FIX DEFINITIVO (GLOBAL): Switch OFF visible en DARK dentro del dialog
   Motivo: scoped/:deep con .v-theme--dark a veces no matchea nada.
   Esto sale del scope y pega directo al overlay real.
========================================================= */

/* DARK ONLY dentro del overlay del ProductFormDialog */
:global(.v-theme--dark) .pf-overlay .v-switch__track {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 30%, transparent) !important;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 62%, transparent) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, rgb(var(--v-theme-on-surface)) 18%, transparent) !important;
}

:global(.v-theme--dark) .pf-overlay .v-switch__thumb {
  opacity: 1 !important;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 98%, rgb(var(--v-theme-on-surface)) 2%) !important;
  box-shadow: 0 10px 22px rgba(0, 0, 0, 0.70) !important;
}

/* OFF (apagado) aún más fuerte por si Vuetify lo “oscurece” */
:global(.v-theme--dark) .pf-overlay input:not(:checked) + .v-selection-control__wrapper .v-switch__track {
  background: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 34%, transparent) !important;
  border-color: color-mix(in srgb, rgb(var(--v-theme-on-surface)) 70%, transparent) !important;
}

:global(.v-theme--dark) .pf-overlay input:not(:checked) + .v-selection-control__wrapper .v-switch__thumb {
  background: rgb(var(--v-theme-surface)) !important;
}

/* ON se mantiene (por si el global te lo pisa) */
:global(.v-theme--dark) .pf-overlay input:checked + .v-selection-control__wrapper .v-switch__track {
  background: color-mix(in srgb, rgb(var(--v-theme-primary)) 48%, transparent) !important;
  border-color: color-mix(in srgb, rgb(var(--v-theme-primary)) 80%, transparent) !important;
}
</style>