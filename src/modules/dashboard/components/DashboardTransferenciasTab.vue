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
          v-if="isAdmin || isCentral"
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
        :class="`tr-card--${tr.status}`"
        @click="openDetail(tr)"
      >
        <!-- Indicador lateral de estado -->
        <div class="tr-card__bar" :class="`tr-bar--${tr.status}`" />

        <div class="tr-card__content">
          <!-- Fila 1: Número + estado + tiempo -->
          <div class="tr-card__top">
            <span class="tr-card__number">{{ tr.number }}</span>
            <span class="tr-card__status" :class="`tr-status--${tr.status}`">
              <v-icon size="11" class="mr-1">{{ statusIcon(tr.status) }}</v-icon>
              {{ statusLabel(tr.status) }}
            </span>
            <span class="tr-card__time">{{ fmtDate(tr.created_at) }}</span>
          </div>

          <!-- Fila 2: Ruta visual -->
          <div class="tr-card__route">
            <div class="tr-route-node">
              <v-icon size="14" color="primary">mdi-store-outline</v-icon>
              <span>{{ tr.fromWarehouse?.branch?.name || "—" }}</span>
            </div>
            <div class="tr-route-line">
              <div class="tr-route-line__track" />
              <v-icon size="14" class="tr-route-line__icon"
                :color="tr.status === 'received' ? 'success' : tr.status === 'dispatched' ? 'warning' : 'secondary'">
                mdi-truck{{ tr.status === 'dispatched' ? '-fast' : '' }}-outline
              </v-icon>
            </div>
            <div class="tr-route-node tr-route-node--right">
              <v-icon size="14" color="success">mdi-store</v-icon>
              <span>{{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || "—" }}</span>
            </div>
          </div>

          <!-- Fila 2.5: Mini stepper -->
          <div v-if="tr.status !== 'cancelled'" class="tr-stepper">
            <div class="tr-step" :class="{ 'tr-step--done': stepperStep(tr.status) >= 1, 'tr-step--active': stepperStep(tr.status) === 1 }">
              <div class="tr-step__dot"><v-icon size="10">mdi-pencil</v-icon></div>
              <span class="tr-step__label">Creada</span>
            </div>
            <div class="tr-step__line" :class="{ 'tr-step__line--done': stepperStep(tr.status) >= 2 }" />
            <div class="tr-step" :class="{ 'tr-step--done': stepperStep(tr.status) >= 2, 'tr-step--active': stepperStep(tr.status) === 2 }">
              <div class="tr-step__dot"><v-icon size="10">mdi-truck-fast</v-icon></div>
              <span class="tr-step__label">En camino</span>
            </div>
            <div class="tr-step__line" :class="{ 'tr-step__line--done': stepperStep(tr.status) >= 3 }" />
            <div class="tr-step" :class="{ 'tr-step--done': stepperStep(tr.status) >= 3, 'tr-step--active': stepperStep(tr.status) === 3, 'tr-step--partial': tr.status === 'partial' }">
              <div class="tr-step__dot"><v-icon size="10">mdi-check</v-icon></div>
              <span class="tr-step__label">{{ tr.status === 'partial' ? 'Con dif.' : 'Entregada' }}</span>
            </div>
          </div>

          <!-- Fila 3: Meta info -->
          <div class="tr-card__meta">
            <div class="tr-meta-chip">
              <v-icon size="12">mdi-package-variant</v-icon>
              {{ tr.items?.length || 0 }} prod.
            </div>
            <template v-if="tr.dispatcher">
              <div class="tr-meta-chip">
                <v-icon size="12">mdi-truck-fast-outline</v-icon>
                {{ userName(tr.dispatcher) }}
                <span v-if="tr.dispatched_at" class="tr-meta-when">{{ fmtDate(tr.dispatched_at) }}</span>
              </div>
            </template>
            <template v-if="tr.receiver">
              <div class="tr-meta-chip tr-meta-chip--received">
                <v-icon size="12">mdi-check-circle-outline</v-icon>
                {{ userName(tr.receiver) }}
                <span class="tr-meta-when">{{ fmtDate(tr.received_at) }}</span>
              </div>
            </template>
            <div v-if="tr.note" class="tr-meta-note">
              <v-icon size="12">mdi-text-short</v-icon>
              {{ tr.note }}
            </div>
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
  { value: "dispatched", label: "En camino",      icon: "mdi-truck-fast-outline",   count: counts.value.dispatched || null },
  { value: "draft",      label: "Por despachar",  icon: "mdi-clock-outline",        count: counts.value.draft      || null },
  { value: "received",   label: "Entregadas",     icon: "mdi-check-circle-outline", count: counts.value.received   || null },
  { value: "partial",    label: "Con diferencia", icon: "mdi-alert-outline",        count: counts.value.partial    || null },
  { value: "cancelled",  label: "Canceladas",     icon: "mdi-cancel",               count: null },
]);

const currentStatusLabel = computed(
  () => statusFilters.value.find((s) => s.value === statusFilter.value)?.label || ""
);

// ── helpers ──
function statusLabel(s) {
  return { draft:"Por despachar", dispatched:"En camino", received:"Entregada",
           partial:"Con diferencia", rejected:"Rechazada", cancelled:"Cancelada" }[s] || s;
}
function statusIcon(s) {
  return { draft:"mdi-clock-outline", dispatched:"mdi-truck-fast-outline",
           received:"mdi-check-circle-outline", partial:"mdi-alert-outline",
           rejected:"mdi-close-circle-outline", cancelled:"mdi-cancel" }[s] || "mdi-help";
}
// Stepper: qué paso está activo para esta derivación
function stepperStep(status) {
  return { draft: 1, dispatched: 2, received: 3, partial: 3, rejected: 3, cancelled: 0 }[status] ?? 0;
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
  display: flex; border-radius: 14px; cursor: pointer; overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), .08);
  background: rgba(var(--v-theme-surface-variant), .35);
  transition: background .15s, box-shadow .15s;
}
.tr-card:hover {
  background: rgba(var(--v-theme-surface-variant), .7);
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
}
.tr-card--dispatched { border-color: rgba(var(--v-theme-warning), .3); }
.tr-card--received   { border-color: rgba(var(--v-theme-success), .2); }
.tr-card--partial    { border-color: rgba(var(--v-theme-warning), .25); }

.tr-card__bar { width: 4px; flex-shrink: 0; }
.tr-bar--draft      { background: rgba(var(--v-theme-on-surface), .15); }
.tr-bar--dispatched { background: rgb(var(--v-theme-warning)); }
.tr-bar--received   { background: rgb(var(--v-theme-success)); }
.tr-bar--partial    { background: #ff9800; }
.tr-bar--rejected   { background: rgb(var(--v-theme-error)); }
.tr-bar--cancelled  { background: rgba(var(--v-theme-on-surface), .1); }

.tr-card__content { flex: 1; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }

.tr-card__top {
  display: flex; align-items: center; gap: 10px;
}
.tr-card__number { font-weight: 700; font-size: 13px; }
.tr-card__status {
  display: flex; align-items: center;
  font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 20px;
}
.tr-card__time   { font-size: 11px; color: rgba(var(--v-theme-on-surface),.4); margin-left: auto; }

.tr-status--draft      { background: rgba(var(--v-theme-on-surface),.08); }
.tr-status--dispatched { background: rgba(255,152,0,.15); color: #e65100; }
.tr-status--received   { background: rgba(76,175,80,.15); color: #2e7d32; }
.tr-status--partial    { background: rgba(255,152,0,.12); color: #e65100; }
.tr-status--rejected   { background: rgba(244,67,54,.12); color: #c62828; }
.tr-status--cancelled  { background: rgba(var(--v-theme-on-surface),.06); color: rgba(var(--v-theme-on-surface),.4); }

/* Ruta visual */
.tr-card__route { display: flex; align-items: center; gap: 8px; }
.tr-route-node  { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
.tr-route-node--right { }
.tr-route-line  {
  flex: 1; display: flex; align-items: center; justify-content: center;
  position: relative; min-width: 40px;
}
.tr-route-line__track {
  position: absolute; left: 0; right: 0; height: 1px;
  background: rgba(var(--v-theme-on-surface), .15);
}
.tr-route-line__icon { position: relative; z-index: 1;
  background: rgb(var(--v-theme-surface-variant)); }

/* Meta chips */
.tr-card__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.tr-meta-chip  {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: rgba(var(--v-theme-on-surface),.55);
  background: rgba(var(--v-theme-on-surface),.05);
  padding: 2px 8px; border-radius: 20px;
}
.tr-meta-chip--received { color: #2e7d32; background: rgba(76,175,80,.1); }
.tr-meta-when { opacity: .6; margin-left: 4px; }
.tr-meta-note {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: rgba(var(--v-theme-on-surface),.45);
  font-style: italic; max-width: 200px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ═══ Mini stepper ══════════════════════════════════════════ */
.tr-stepper {
  display: flex; align-items: center; gap: 0;
  padding: 2px 0;
}
.tr-step {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.tr-step__dot {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(var(--v-theme-on-surface), .1);
  color: rgba(var(--v-theme-on-surface), .3);
  transition: all .2s;
}
.tr-step--done .tr-step__dot {
  background: rgba(var(--v-theme-success), .2);
  color: rgb(var(--v-theme-success));
}
.tr-step--active .tr-step__dot {
  background: rgba(255,152,0,.25);
  color: #e65100;
  box-shadow: 0 0 0 3px rgba(255,152,0,.15);
}
.tr-step--partial .tr-step__dot {
  background: rgba(255,152,0,.2);
  color: #e65100;
}
.tr-step__label {
  font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .03em;
  color: rgba(var(--v-theme-on-surface), .35);
  white-space: nowrap;
}
.tr-step--done .tr-step__label   { color: rgb(var(--v-theme-success)); }
.tr-step--active .tr-step__label { color: #e65100; }
.tr-step__line {
  flex: 1; height: 2px; min-width: 24px;
  background: rgba(var(--v-theme-on-surface), .1);
  margin-bottom: 12px; /* alinea con el dot */
  transition: background .2s;
}
.tr-step__line--done { background: rgba(var(--v-theme-success), .4); }

/* ═══ Paginación ════════════════════════════════════════════ */
.tr-pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px; margin-top: 4px;
}
.tr-page-info { font-size: 12px; color: rgba(var(--v-theme-on-surface),.5); }
</style>
