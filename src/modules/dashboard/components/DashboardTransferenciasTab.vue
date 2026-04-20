<template>
  <div class="tr-tab">

    <!-- ═══ Sección: PENDIENTES DE RECEPCIÓN (solo para destinos) ═══ -->
    <div v-if="pendingForMe.length && !isAdmin" class="tr-urgent-section">
      <div class="tr-urgent-header">
        <v-icon size="18" color="warning" class="mr-2">mdi-alert-circle-outline</v-icon>
        <span class="tr-urgent-title">Pendientes de recepción ({{ pendingForMe.length }})</span>
      </div>
      <div class="tr-urgent-list">
        <div
          v-for="t in pendingForMe" :key="'urgent-'+t.id"
          class="tr-urgent-card"
          @click="openDetail(t)"
        >
          <div class="tr-urgent-card__left">
            <div class="tr-urgent-card__pulse"></div>
            <v-icon size="22" color="warning">mdi-package-variant-closed</v-icon>
          </div>
          <div class="tr-urgent-card__body">
            <div class="tr-urgent-card__top">
              <span class="tr-urgent-card__number">{{ t.number }}</span>
              <span class="tr-urgent-card__time">{{ timeAgo(t.dispatched_at) }}</span>
            </div>
            <div class="tr-urgent-card__from">
              <v-icon size="13">mdi-store-outline</v-icon>
              {{ t.fromWarehouse?.branch?.name || "—" }}
              <template v-if="t.dispatcher">
                · por {{ userName(t.dispatcher) }}
              </template>
            </div>
            <div class="tr-urgent-card__items">
              {{ t.items?.length || 0 }} producto{{ t.items?.length !== 1 ? "s" : "" }}
              <template v-if="t.note"> · "{{ t.note }}"</template>
            </div>
          </div>
          <v-btn color="warning" variant="flat" size="small" rounded="lg" class="flex-shrink-0">
            Recepcionar
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ═══ Header con filtros ═══ -->
    <div class="tr-header">
      <div class="tr-filters">
        <button
          v-for="s in statusFilters" :key="s.value"
          class="tr-filter-pill"
          :class="{ 'tr-filter-pill--active': statusFilter === s.value }"
          @click="statusFilter = s.value; page = 1; loadList()"
        >
          <v-icon size="13">{{ s.icon }}</v-icon>
          <span class="tr-filter-pill__label">{{ s.label }}</span>
          <span v-if="s.count" class="tr-filter-pill__count">{{ s.count }}</span>
        </button>
      </div>
      <div class="tr-header__actions">
        <v-btn icon size="small" variant="text" title="Actualizar" @click="loadList()">
          <v-icon size="18">mdi-refresh</v-icon>
        </v-btn>
        <v-btn
          color="primary" size="small" variant="flat" rounded="lg"
          prepend-icon="mdi-plus"
          @click="openCreate"
        >
          Nueva derivación
        </v-btn>
      </div>
    </div>

    <!-- Lista -->
    <div v-if="loading" class="tr-loading">
      <v-progress-circular indeterminate color="primary" size="28" />
    </div>

    <div v-else-if="!transfers.length" class="tr-empty">
      <v-icon size="52" color="secondary" class="mb-3">mdi-truck-outline</v-icon>
      <p>No hay derivaciones{{ statusFilter ? ` con estado "${currentStatusLabel}"` : "" }}</p>
    </div>

    <div v-else class="tr-list">
      <div
        v-for="tr in transfers" :key="tr.id"
        class="tr-card"
        @click="openDetail(tr)"
      >
        <!-- Barra lateral coloreada por estado -->
        <div class="tr-card__bar" :class="`tr-bar--${tr.status}`" />

        <div class="tr-card__content">

          <!-- Fila superior: número · estado · fecha -->
          <div class="tr-card__top">
            <span class="tr-card__number">{{ tr.number }}</span>
            <span class="tr-card__badge" :class="`tr-badge--${tr.status}`">
              <v-icon size="12">{{ statusIcon(tr.status) }}</v-icon>
              {{ statusLabel(tr.status) }}
            </span>
            <span class="tr-card__date">{{ fmtDate(tr.created_at) }}</span>
          </div>

          <!-- Ruta: Origen → Destino -->
          <div class="tr-card__route">
            <span class="tr-branch tr-branch--from">
              <v-icon size="13">mdi-store-outline</v-icon>
              {{ tr.fromWarehouse?.branch?.name || "—" }}
            </span>
            <v-icon size="16" class="tr-arrow">mdi-arrow-right</v-icon>
            <span class="tr-branch tr-branch--to">
              <v-icon size="13">mdi-store</v-icon>
              {{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || "—" }}
            </span>
          </div>

          <!-- Stepper de 3 pasos -->
          <div v-if="tr.status !== 'cancelled'" class="tr-steps">
            <div class="tr-step-item" :class="stepClass(tr.status, 1)">
              <div class="tr-step-item__circle">
                <v-icon size="11">mdi-pencil-outline</v-icon>
              </div>
              <span>Borrador</span>
            </div>
            <div class="tr-step-track" :class="{ active: stepperStep(tr.status) >= 2 }" />
            <div class="tr-step-item" :class="stepClass(tr.status, 2)">
              <div class="tr-step-item__circle">
                <v-icon size="11">mdi-truck-fast-outline</v-icon>
              </div>
              <span>En camino</span>
            </div>
            <div class="tr-step-track" :class="{ active: stepperStep(tr.status) >= 3 }" />
            <div class="tr-step-item" :class="[stepClass(tr.status, 3), tr.status === 'partial' ? 'partial' : '']">
              <div class="tr-step-item__circle">
                <v-icon size="11">{{ tr.status === 'partial' ? 'mdi-alert' : 'mdi-check' }}</v-icon>
              </div>
              <span>{{ tr.status === 'partial' ? 'Parcial' : 'Recibido' }}</span>
            </div>
          </div>

          <!-- Footer: items · quién despachó · quién recibió -->
          <div class="tr-card__footer">
            <span class="tr-foot-item">
              <v-icon size="12">mdi-package-variant-closed</v-icon>
              {{ tr.items?.length || 0 }} producto{{ tr.items?.length !== 1 ? "s" : "" }}
            </span>
            <span v-if="tr.dispatcher" class="tr-foot-item">
              <v-icon size="12">mdi-account-arrow-right-outline</v-icon>
              {{ userName(tr.dispatcher) }}
            </span>
            <span v-if="tr.receiver" class="tr-foot-item tr-foot-item--ok">
              <v-icon size="12">mdi-account-check-outline</v-icon>
              {{ userName(tr.receiver) }}
            </span>
            <span v-if="tr.note" class="tr-foot-item tr-foot-item--note">
              <v-icon size="12">mdi-note-text-outline</v-icon>
              {{ tr.note }}
            </span>
          </div>

        </div>
      </div>
    </div>

    <!-- Paginación -->
    <div v-if="total > limit" class="tr-pagination">
      <v-btn variant="text" size="small" :disabled="page <= 1" @click="page--; loadList()">
        <v-icon start>mdi-chevron-left</v-icon>Anterior
      </v-btn>
      <span class="tr-page-info">Pág. {{ page }} de {{ Math.ceil(total / limit) }}</span>
      <v-btn variant="text" size="small" :disabled="page >= Math.ceil(total / limit)" @click="page++; loadList()">
        Siguiente<v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </div>

    <!-- Dialog: Detalle -->
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
import { useTransferNotifications } from "../composables/useTransferNotifications";
import TransferDetail from "./TransferDetail.vue";
import TransferForm   from "./TransferForm.vue";

const props = defineProps({
  isAdmin:           { type: Boolean, default: false },
  isCentral:         { type: Boolean, default: false },
  currentBranchId:   { type: Number,  default: null  },
  currentWarehouseId:{ type: Number,  default: null  },
});

// Notificaciones (también refresca la sección "urgente")
const { pendingForMe } = useTransferNotifications();

// ── state ──
const transfers    = ref([]);
const loading      = ref(false);
const total        = ref(0);
const page         = ref(1);
const limit        = ref(20);
const statusFilter = ref("");
const showDetail   = ref(false);
const showCreate   = ref(false);
const selected     = ref(null);

// Conteos por estado para los filtros
const counts = ref({});

const statusFilters = computed(() => [
  { value: "",           label: "Todas",         icon: "mdi-view-list-outline",    count: null },
  { value: "draft",      label: "Borrador",       icon: "mdi-clock-edit-outline",   count: counts.value.draft      || null },
  { value: "dispatched", label: "En camino",      icon: "mdi-truck-fast-outline",   count: counts.value.dispatched || null },
  { value: "received",   label: "Entregadas",     icon: "mdi-check-circle-outline", count: counts.value.received   || null },
  { value: "partial",    label: "Con diferencia", icon: "mdi-alert-outline",        count: counts.value.partial    || null },
  { value: "cancelled",  label: "Canceladas",     icon: "mdi-cancel",               count: null },
]);

const currentStatusLabel = computed(
  () => statusFilters.value.find((s) => s.value === statusFilter.value)?.label || ""
);

// ── helpers ──
function statusLabel(s) {
  return { draft:"Borrador", dispatched:"En camino", received:"Recibido",
           partial:"Parcial", rejected:"Rechazada", cancelled:"Cancelada" }[s] || s;
}
function statusIcon(s) {
  return { draft:"mdi-clock-edit-outline", dispatched:"mdi-truck-fast-outline",
           received:"mdi-check-circle-outline", partial:"mdi-alert-circle-outline",
           rejected:"mdi-close-circle-outline", cancelled:"mdi-cancel" }[s] || "mdi-help";
}
function stepperStep(s) {
  return { draft:1, dispatched:2, received:3, partial:3, rejected:3, cancelled:0 }[s] ?? 0;
}
function stepClass(status, step) {
  const cur = stepperStep(status);
  if (cur > step)  return "done";
  if (cur === step) return "active";
  return "pending";
}
function userName(u) {
  if (!u) return "—";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || `#${u.id}`;
}
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-AR", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit",
  });
}
function timeAgo(d) {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1)  return "Ahora mismo";
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h/24)} d`;
}

// ── API ──
async function loadList() {
  loading.value = true;
  try {
    const params = { page: page.value, limit: limit.value };
    if (statusFilter.value) params.status = statusFilter.value;
    const { data } = await listTransfers(params);
    transfers.value = data.transfers || [];
    total.value     = data.total || 0;
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

async function loadCounts() {
  try {
    const statuses = ["draft","dispatched","received","partial"];
    const results  = await Promise.allSettled(
      statuses.map((s) => listTransfers({ status: s, limit: 1, page: 1 }))
    );
    const c = {};
    statuses.forEach((s, i) => {
      if (results[i].status === "fulfilled") c[s] = results[i].value.data.total || 0;
    });
    counts.value = c;
  } catch {}
}

function openDetail(tr) { selected.value = tr; showDetail.value = true; }
function openCreate()   { showCreate.value = true; }

async function refreshSelected(id) {
  await loadList();
  if (id) {
    try {
      const m = await import("../service/stockTransfer.api");
      const { data } = await m.getTransfer(id);
      if (data?.transfer) selected.value = data.transfer;
    } catch {}
  }
  loadCounts();
}

async function onDispatch(id) { await refreshSelected(id); }
async function onReceive(id)  { await refreshSelected(id); }
async function onCancel()     { showDetail.value = false; await loadList(); loadCounts(); }
function onCreated()          { showCreate.value = false; loadList(); loadCounts(); }

onMounted(() => { loadList(); loadCounts(); });
</script>

<style scoped>
.tr-tab { display: flex; flex-direction: column; gap: 16px; }

/* ═══ Sección urgente ══════════════════════════════════════ */
.tr-urgent-section {
  border: 2px solid rgba(var(--v-theme-warning), .4);
  border-radius: 14px;
  overflow: hidden;
  background: rgba(var(--v-theme-warning), .05);
}
.tr-urgent-header {
  display: flex; align-items: center;
  padding: 10px 16px;
  background: rgba(var(--v-theme-warning), .1);
  border-bottom: 1px solid rgba(var(--v-theme-warning), .2);
}
.tr-urgent-title { font-size: 13px; font-weight: 700; }
.tr-urgent-list  { display: flex; flex-direction: column; }

.tr-urgent-card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; cursor: pointer; transition: background .15s;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .05);
}
.tr-urgent-card:last-child { border-bottom: none; }
.tr-urgent-card:hover { background: rgba(var(--v-theme-warning), .08); }

.tr-urgent-card__left { position: relative; width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.tr-urgent-card__pulse {
  position: absolute; inset: 0; border-radius: 50%;
  background: rgba(var(--v-theme-warning), .25);
  animation: pulse 1.8s infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(.9); opacity: .6; }
  50%       { transform: scale(1.15); opacity: 1; }
}

.tr-urgent-card__body { flex: 1; min-width: 0; }
.tr-urgent-card__top  { display: flex; justify-content: space-between; margin-bottom: 3px; }
.tr-urgent-card__number { font-size: 13px; font-weight: 700; }
.tr-urgent-card__time   { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); }
.tr-urgent-card__from { font-size: 12px; color: rgba(var(--v-theme-on-surface), .7); display: flex; align-items: center; gap: 4px; margin-bottom: 2px; }
.tr-urgent-card__items { font-size: 11px; color: rgba(var(--v-theme-on-surface), .5); }

/* ═══ Header con filtros ═══════════════════════════════════ */
.tr-header {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap;
}
.tr-filters { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
.tr-header__actions { display: flex; align-items: center; gap: 8px; }

.tr-filter-pill {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
  border: 1px solid rgba(var(--v-theme-on-surface), .15);
  color: rgba(var(--v-theme-on-surface), .65);
  background: transparent; cursor: pointer; transition: all .15s;
}
.tr-filter-pill:hover { border-color: rgba(var(--v-theme-primary), .4); color: rgb(var(--v-theme-primary)); }
.tr-filter-pill--active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: #fff;
}
.tr-filter-pill__count {
  background: rgba(255,255,255,.25); color: inherit;
  font-size: 10px; font-weight: 700;
  padding: 1px 5px; border-radius: 10px; min-width: 18px; text-align: center;
}
.tr-filter-pill--active .tr-filter-pill__count { background: rgba(0,0,0,.2); }

/* ═══ Estados vacío / cargando ═════════════════════════════ */
.tr-loading { display: flex; justify-content: center; padding: 48px; }
.tr-empty   {
  display: flex; flex-direction: column; align-items: center;
  padding: 56px 16px; color: rgba(var(--v-theme-on-surface),.4); text-align: center;
  font-size: 14px;
}

/* ═══ Lista de cards ════════════════════════════════════════ */
.tr-list { display: flex; flex-direction: column; gap: 8px; }

.tr-card {
  display: flex; border-radius: 12px; cursor: pointer; overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
  background: rgb(var(--v-theme-surface));
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  transition: box-shadow .15s, transform .1s;
}
.tr-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  transform: translateY(-1px);
}

/* Barra lateral */
.tr-card__bar { width: 4px; flex-shrink: 0; }
.tr-bar--draft      { background: #9e9e9e; }
.tr-bar--dispatched { background: #ff9800; }
.tr-bar--received   { background: #4caf50; }
.tr-bar--partial    { background: #ff9800; }
.tr-bar--rejected   { background: #f44336; }
.tr-bar--cancelled  { background: #e0e0e0; }

.tr-card__content {
  flex: 1; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
}

/* Top row */
.tr-card__top {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.tr-card__number { font-weight: 700; font-size: 13px; letter-spacing: .01em; }
.tr-card__date   { font-size: 11px; color: rgba(var(--v-theme-on-surface),.45); margin-left: auto; }

/* Badge de estado */
.tr-card__badge {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600; padding: 2px 9px; border-radius: 20px;
  border: 1px solid transparent;
}
.tr-badge--draft     { background: rgba(var(--v-theme-on-surface),.07); border-color: rgba(var(--v-theme-on-surface),.12); color: rgba(var(--v-theme-on-surface),.6); }
.tr-badge--dispatched{ background: #fff3e0; border-color: #ffb74d; color: #e65100; }
.tr-badge--received  { background: #e8f5e9; border-color: #81c784; color: #2e7d32; }
.tr-badge--partial   { background: #fff3e0; border-color: #ffb74d; color: #e65100; }
.tr-badge--rejected  { background: #ffebee; border-color: #ef9a9a; color: #c62828; }
.tr-badge--cancelled { background: rgba(var(--v-theme-on-surface),.04); border-color: rgba(var(--v-theme-on-surface),.08); color: rgba(var(--v-theme-on-surface),.35); }

/* Ruta */
.tr-card__route {
  display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600;
}
.tr-branch { display: inline-flex; align-items: center; gap: 4px; }
.tr-branch--from { color: rgb(var(--v-theme-primary)); }
.tr-branch--to   { color: #388e3c; }
.tr-arrow { color: rgba(var(--v-theme-on-surface),.3); }

/* Stepper de 3 pasos */
.tr-steps {
  display: flex; align-items: center; gap: 0; padding: 2px 0;
}
.tr-step-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  min-width: 60px;
}
.tr-step-item__circle {
  width: 26px; height: 26px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid rgba(var(--v-theme-on-surface),.15);
  color: rgba(var(--v-theme-on-surface),.3);
  transition: all .2s;
}
.tr-step-item > span {
  font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
  color: rgba(var(--v-theme-on-surface),.35);
  white-space: nowrap;
}
/* done */
.tr-step-item.done .tr-step-item__circle {
  background: #e8f5e9; border-color: #4caf50; color: #2e7d32;
}
.tr-step-item.done > span { color: #2e7d32; }
/* active */
.tr-step-item.active .tr-step-item__circle {
  background: #fff3e0; border-color: #ff9800; color: #e65100;
  box-shadow: 0 0 0 3px rgba(255,152,0,.2);
}
.tr-step-item.active > span { color: #e65100; font-weight: 800; }
/* partial */
.tr-step-item.partial .tr-step-item__circle {
  background: #fff3e0; border-color: #ff9800; color: #e65100;
}

.tr-step-track {
  flex: 1; height: 2px; background: rgba(var(--v-theme-on-surface),.1);
  margin-bottom: 16px; border-radius: 2px;
  transition: background .2s;
}
.tr-step-track.active { background: #4caf50; }

/* Footer */
.tr-card__footer {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding-top: 4px;
  border-top: 1px solid rgba(var(--v-theme-on-surface),.06);
}
.tr-foot-item {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; color: rgba(var(--v-theme-on-surface),.5);
}
.tr-foot-item--ok   { color: #2e7d32; }
.tr-foot-item--note { font-style: italic; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* ═══ Paginación ════════════════════════════════════════════ */
.tr-pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 4px;
}
.tr-page-info { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
</style>
