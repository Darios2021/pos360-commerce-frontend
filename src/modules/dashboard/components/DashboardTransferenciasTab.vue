<template>
  <div class="tr-tab">
    <!-- Header row -->
    <div class="tr-header">
      <div class="tr-filters">
        <button
          v-for="s in statusFilters" :key="s.value"
          class="tr-status-pill"
          :class="{ 'tr-status-pill--active': statusFilter === s.value }"
          @click="statusFilter = s.value; loadList()"
        >{{ s.label }}</button>
      </div>
      <v-btn v-if="isAdmin || isCentral" color="primary" size="small" variant="flat" rounded="lg" prepend-icon="mdi-plus" @click="openCreate">
        Nueva derivación
      </v-btn>
    </div>

    <!-- Lista -->
    <div v-if="loading" class="tr-loading">
      <v-progress-circular indeterminate color="primary" size="28" />
    </div>

    <div v-else-if="!transfers.length" class="tr-empty">
      <v-icon size="48" color="secondary" class="mb-3">mdi-truck-outline</v-icon>
      <p>No hay derivaciones{{ statusFilter ? ` con estado "${currentStatusLabel}"` : "" }}</p>
    </div>

    <div v-else class="tr-list">
      <div v-for="tr in transfers" :key="tr.id" class="tr-card" @click="openDetail(tr)">
        <div class="tr-card__head">
          <span class="tr-card__number">{{ tr.number }}</span>
          <span class="tr-card__status" :class="`tr-status--${tr.status}`">{{ statusLabel(tr.status) }}</span>
        </div>
        <div class="tr-card__route">
          <v-icon size="14">mdi-store-outline</v-icon>
          <span>{{ tr.fromWarehouse?.branch?.name || "—" }}</span>
          <v-icon size="14" class="mx-1">mdi-arrow-right</v-icon>
          <v-icon size="14">mdi-store</v-icon>
          <span>{{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || "—" }}</span>
        </div>
        <div class="tr-card__meta">
          <span>{{ tr.items?.length || 0 }} producto{{ tr.items?.length !== 1 ? "s" : "" }}</span>
          <span class="tr-card__dot">·</span>
          <span>{{ fmtDate(tr.created_at) }}</span>
          <span v-if="tr.dispatched_at" class="tr-card__dot">·</span>
          <span v-if="tr.dispatched_at">Despachado {{ fmtDate(tr.dispatched_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="total > limit" class="tr-pagination">
      <v-btn variant="text" size="small" :disabled="page <= 1" @click="page--; loadList()">Anterior</v-btn>
      <span class="tr-page-info">{{ page }} / {{ Math.ceil(total / limit) }}</span>
      <v-btn variant="text" size="small" :disabled="page >= Math.ceil(total / limit)" @click="page++; loadList()">Siguiente</v-btn>
    </div>

    <!-- Dialog: Detalle / acciones -->
    <v-dialog v-model="showDetail" max-width="680" scrollable>
      <TransferDetail
        v-if="selected"
        :transfer="selected"
        :is-admin="isAdmin"
        :is-central="isCentral"
        :current-branch-id="currentBranchId"
        @dispatch="onDispatch"
        @receive="onReceive"
        @cancel="onCancel"
        @close="showDetail = false"
      />
    </v-dialog>

    <!-- Dialog: Crear -->
    <v-dialog v-model="showCreate" max-width="720" scrollable persistent>
      <TransferForm
        :current-warehouse-id="currentWarehouseId"
        :current-branch-id="currentBranchId"
        @created="onCreated"
        @close="showCreate = false"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { listTransfers } from "../service/stockTransfer.api";
import TransferDetail from "./TransferDetail.vue";
import TransferForm from "./TransferForm.vue";

const props = defineProps({
  isAdmin:          { type: Boolean, default: false },
  isCentral:        { type: Boolean, default: false },
  currentBranchId:  { type: Number, default: null },
  currentWarehouseId:{ type: Number, default: null },
});

// ── state ──
const transfers   = ref([]);
const loading     = ref(false);
const total       = ref(0);
const page        = ref(1);
const limit       = ref(20);
const statusFilter = ref("");
const showDetail   = ref(false);
const showCreate   = ref(false);
const selected     = ref(null);

const statusFilters = [
  { value: "",           label: "Todas" },
  { value: "draft",      label: "Borrador" },
  { value: "dispatched", label: "En tránsito" },
  { value: "received",   label: "Recibidas" },
  { value: "partial",    label: "Parciales" },
  { value: "cancelled",  label: "Canceladas" },
];

const currentStatusLabel = computed(
  () => statusFilters.find((s) => s.value === statusFilter.value)?.label || ""
);

// ── helpers ──
function statusLabel(s) {
  const map = { draft:"Borrador", dispatched:"En tránsito", received:"Recibida",
                partial:"Parcial", rejected:"Rechazada", cancelled:"Cancelada" };
  return map[s] || s;
}

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-AR", { day:"2-digit", month:"short", year:"numeric" });
}

// ── API ──
async function loadList() {
  loading.value = true;
  try {
    const params = { page: page.value, limit: limit.value };
    if (statusFilter.value) params.status = statusFilter.value;
    const { data } = await listTransfers(params);
    transfers.value = data.transfers || [];
    total.value = data.total || 0;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function openDetail(tr) { selected.value = tr; showDetail.value = true; }
function openCreate() { showCreate.value = true; }

async function refreshSelected(id) {
  const { data } = await listTransfers({ page: 1, limit: 1 });
  await loadList();
  if (id) {
    const { data: d2 } = await import("../service/stockTransfer.api").then(m => m.getTransfer(id));
    if (d2?.transfer) selected.value = d2.transfer;
  }
}

async function onDispatch(id) { await refreshSelected(id); }
async function onReceive(id)  { await refreshSelected(id); }
async function onCancel(id)   { showDetail.value = false; await loadList(); }
function onCreated()          { showCreate.value = false; loadList(); }

onMounted(loadList);
</script>

<style scoped>
.tr-tab { padding: 16px 0; }

.tr-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
}
.tr-filters { display: flex; gap: 6px; flex-wrap: wrap; }

.tr-status-pill {
  padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
  color: rgba(var(--v-theme-on-surface), 0.65);
  background: transparent; cursor: pointer; transition: all .15s;
}
.tr-status-pill--active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: #fff;
}

.tr-loading { display: flex; justify-content: center; padding: 40px; }
.tr-empty   { display: flex; flex-direction: column; align-items: center;
              padding: 48px 16px; color: rgba(var(--v-theme-on-surface),.45); text-align: center; }

.tr-list { display: flex; flex-direction: column; gap: 8px; }

.tr-card {
  padding: 14px 16px; border-radius: 12px; cursor: pointer;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface-variant), 0.4);
  transition: background .15s;
}
.tr-card:hover { background: rgba(var(--v-theme-surface-variant), 0.8); }

.tr-card__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.tr-card__number { font-weight: 700; font-size: 13px; }
.tr-card__status {
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px;
}
.tr-status--draft      { background: rgba(var(--v-theme-on-surface),.08); }
.tr-status--dispatched { background: #e3f2fd; color: #1565c0; }
.tr-status--received   { background: #e8f5e9; color: #2e7d32; }
.tr-status--partial    { background: #fff8e1; color: #f57f17; }
.tr-status--rejected   { background: #ffebee; color: #c62828; }
.tr-status--cancelled  { background: rgba(var(--v-theme-on-surface),.06); color: rgba(var(--v-theme-on-surface),.4); }

.tr-card__route {
  display: flex; align-items: center; gap: 4px; font-size: 12px;
  color: rgba(var(--v-theme-on-surface),.7); margin-bottom: 4px;
}
.tr-card__meta {
  display: flex; align-items: center; gap: 6px; font-size: 11px;
  color: rgba(var(--v-theme-on-surface),.45);
}
.tr-card__dot { opacity: .4; }

.tr-pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 16px;
}
.tr-page-info { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
</style>
