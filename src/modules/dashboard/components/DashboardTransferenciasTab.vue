<template>
  <div class="transfers">

    <!-- ═══════════════════════ VISTA: LISTA ═══════════════════════ -->
    <template v-if="!selectedId">

      <!-- ═══ BANNER PERSISTENTE — pendientes de recepción ═══════════════
           No tiene botón de cierre. Se va solo cuando todos se recepcionan. -->
      <div v-if="pendingForMe.length && !isAdmin" class="transfers__alert">
        <div class="transfers__alert-icon">
          <span class="transfers__alert-dot" />
          <v-icon size="22" color="warning">mdi-truck-delivery-outline</v-icon>
        </div>
        <div class="transfers__alert-body">
          <p class="transfers__alert-title">
            {{ pendingForMe.length === 1
              ? '1 paquete esperando recepción'
              : `${pendingForMe.length} paquetes esperando recepción` }}
          </p>
          <div class="transfers__alert-list">
            <button
              v-for="t in pendingForMe" :key="t.id"
              class="transfers__alert-item"
              @click="openDetail(t)"
            >
              <v-icon size="12" color="warning">mdi-circle</v-icon>
              <span class="transfers__alert-item-num">{{ t.number }}</span>
              <span class="transfers__alert-item-from">desde {{ t.fromWarehouse?.branch?.name || '—' }}</span>
              <span class="transfers__alert-item-ago">{{ timeAgo(t.dispatched_at) }}</span>
              <v-chip size="x-small" color="success" variant="flat" class="ml-1">Recepcionar</v-chip>
            </button>
          </div>
        </div>
      </div>

      <!-- Card principal -->
      <v-card elevation="0" rounded="xl" class="transfers__card">

        <!-- Cabecera de la card -->
        <div class="transfers__head">
          <div class="transfers__head-left">
            <span class="transfers__title">Derivaciones</span>
            <span class="transfers__sub">{{ filtered.length }} resultado{{ filtered.length !== 1 ? 's' : '' }}</span>
          </div>
          <div class="transfers__head-right">
            <v-btn icon size="small" variant="text" :loading="loading" @click="loadList">
              <v-icon size="17">mdi-refresh</v-icon>
            </v-btn>
            <v-btn color="primary" size="small" variant="flat" rounded="lg"
              prepend-icon="mdi-plus" @click="showCreate = true">
              Nueva derivación
            </v-btn>
          </div>
        </div>

        <!-- Toolbar filtros + búsqueda -->
        <div class="transfers__toolbar">
          <v-text-field
            v-model="search"
            placeholder="Buscar número, sucursal, nota…"
            variant="outlined" density="compact" rounded="lg"
            prepend-inner-icon="mdi-magnify"
            hide-details clearable
            style="max-width:260px; flex-shrink:0;"
            @update:modelValue="page = 1"
          />
          <div class="transfers__filters">
            <v-chip
              v-for="f in statusFilters" :key="f.value"
              :color="statusFilter === f.value ? statusChipColor(f.value) : undefined"
              :variant="statusFilter === f.value ? 'flat' : 'outlined'"
              size="small"
              class="transfers__filter-chip"
              @click="statusFilter = f.value; page = 1"
            >
              <v-icon start size="12">{{ f.icon }}</v-icon>
              {{ f.label }}
              <span v-if="f.count" class="transfers__filter-count">{{ f.count }}</span>
            </v-chip>
          </div>
        </div>

        <v-divider />

        <!-- Loading -->
        <div v-if="loading && !allTransfers.length" class="transfers__loading">
          <v-progress-circular indeterminate color="primary" size="32" />
        </div>

        <!-- Empty -->
        <div v-else-if="!paginated.length" class="transfers__empty">
          <v-icon size="52" color="medium-emphasis">mdi-truck-outline</v-icon>
          <p class="transfers__empty-title">Sin derivaciones</p>
          <p class="transfers__empty-sub">
            {{ search
              ? `No hay resultados para "${search}"`
              : statusFilter
                ? `Ninguna con estado "${currentStatusLabel}"`
                : 'Todavía no hay derivaciones registradas.' }}
          </p>
          <v-btn v-if="!search && !statusFilter" color="primary" variant="flat" rounded="lg"
            size="small" prepend-icon="mdi-plus" @click="showCreate = true" class="mt-2">
            Crear primera derivación
          </v-btn>
        </div>

        <!-- Feed rows -->
        <div v-else>
          <div
            v-for="tr in paginated" :key="tr.id"
            class="transfers__row"
            :class="{ 'transfers__row--cancelled': tr.status === 'cancelled' }"
            @click="openDetail(tr)"
          >
            <!-- Barra de estado lateral -->
            <span class="transfers__bar" :class="`transfers__bar--${tr.status}`" />

            <!-- Info principal -->
            <div class="transfers__row-main">
              <div class="transfers__row-top">
                <span class="transfers__number">{{ tr.number }}</span>
                <div class="transfers__route">
                  <span class="transfers__route-from">
                    {{ tr.fromWarehouse?.branch?.name || '—' }}
                  </span>
                  <v-icon size="12" color="medium-emphasis">mdi-arrow-right</v-icon>
                  <span class="transfers__route-to">
                    {{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || '—' }}
                  </span>
                </div>
              </div>
              <div class="transfers__row-bottom">
                <span class="transfers__row-count">
                  <v-icon size="11">mdi-package-variant-closed</v-icon>
                  {{ tr.item_count ?? tr.items?.length ?? 0 }} prod.
                </span>
                <span v-if="tr.note" class="transfers__row-note">{{ tr.note }}</span>
                <div v-if="tr.creator || tr.dispatcher || tr.receiver" class="transfers__people">
                  <span v-if="tr.creator" class="transfers__person">
                    <v-icon size="10">mdi-pencil-outline</v-icon>
                    {{ shortName(tr.creator) }}
                  </span>
                  <span v-if="tr.dispatcher" class="transfers__person transfers__person--dispatch">
                    <v-icon size="10">mdi-truck-fast-outline</v-icon>
                    {{ shortName(tr.dispatcher) }}
                  </span>
                  <span v-if="tr.receiver" class="transfers__person transfers__person--receive">
                    <v-icon size="10">mdi-check-circle-outline</v-icon>
                    {{ shortName(tr.receiver) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Derecha: chip + fecha -->
            <div class="transfers__row-right">
              <v-chip size="x-small" :color="statusChipColor(tr.status)" variant="tonal">
                <v-icon start size="10">{{ statusIcon(tr.status) }}</v-icon>
                {{ statusLabel(tr.status) }}
              </v-chip>
              <span class="transfers__date">{{ fmtDate(tr.created_at) }}</span>
            </div>

            <v-icon size="15" color="medium-emphasis" class="flex-shrink-0">mdi-chevron-right</v-icon>
          </div>
        </div>

        <!-- Footer paginación -->
        <template v-if="paginated.length && totalPages > 1">
          <v-divider />
          <div class="transfers__footer">
            <span class="transfers__count-info">
              {{ ((page-1)*limit)+1 }}–{{ Math.min(page*limit, filtered.length) }} de {{ filtered.length }}
            </span>
            <div class="transfers__pagination">
              <button class="transfers__pgbtn" :disabled="page <= 1" @click="page--">
                <v-icon size="15">mdi-chevron-left</v-icon>
              </button>
              <button
                v-for="p in pageRange" :key="String(p)"
                class="transfers__pgbtn"
                :class="{ 'transfers__pgbtn--active': p === page }"
                :disabled="p === '…'"
                @click="typeof p === 'number' && (page = p)"
              >{{ p }}</button>
              <button class="transfers__pgbtn" :disabled="page >= totalPages" @click="page++">
                <v-icon size="15">mdi-chevron-right</v-icon>
              </button>
            </div>
            <select class="transfers__perpage" v-model="limit" @change="page = 1">
              <option :value="15">15 / pág</option>
              <option :value="25">25 / pág</option>
              <option :value="50">50 / pág</option>
            </select>
          </div>
        </template>

      </v-card>
    </template>

    <!-- ═══════════════════════ VISTA: DETALLE ══════════════════════ -->
    <template v-else>
      <TransferDetail
        v-if="selectedTransfer"
        :transfer="selectedTransfer"
        :is-admin="isAdmin"
        :is-central="isCentral"
        :current-branch-id="currentBranchId"
        @dispatch="onDispatch"
        @receive="onReceive"
        @cancel="onCancel"
        @close="closeDetail"
      />
    </template>

    <!-- ═══════════════════════ MODAL: NUEVA DERIVACIÓN ═════════════ -->
    <v-dialog v-model="showCreate" max-width="680" scrollable persistent>
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
import { ref, computed, onMounted, watch } from "vue";
import { listTransfers, getTransfer } from "../service/stockTransfer.api";
import { useTransferNotifications } from "../composables/useTransferNotifications";
import TransferDetail from "./TransferDetail.vue";
import TransferForm   from "./TransferForm.vue";

const props = defineProps({
  isAdmin:            { type: Boolean, default: false },
  isCentral:          { type: Boolean, default: false },
  currentBranchId:    { type: Number,  default: null  },
  currentWarehouseId: { type: Number,  default: null  },
});

const { pendingForMe } = useTransferNotifications();

// ── state ──
const allTransfers    = ref([]);
const loading         = ref(false);
const selectedId      = ref(null);
const selectedTransfer = ref(null);
const showCreate      = ref(false);

const search       = ref("");
const statusFilter = ref("");
const sortBy       = ref("created_at");
const sortDesc     = ref(true);
const page         = ref(1);
const limit        = ref(25);

// ── transfers visibles (filtro de sucursal, sin status/search) ──
// Se usa para calcular los contadores de cada chip
const visibleTransfers = computed(() => {
  if (props.isAdmin || !props.currentBranchId) return allTransfers.value;
  return allTransfers.value.filter(t => {
    const originBranchId = t.fromWarehouse?.branch_id ?? t.from_branch_id;
    const destBranchId   = t.to_branch_id ?? t.toBranch?.id ?? t.toWarehouse?.branch_id;
    const isOrigin = originBranchId === props.currentBranchId;
    const isDest   = destBranchId   === props.currentBranchId;
    if (!isOrigin && !isDest) return false;
    if (isOrigin) return true;
    return t.status !== "draft";
  });
});

// Contadores calculados localmente (siempre en sync con lo visible)
const statusCounts = computed(() => {
  const c = {};
  for (const t of visibleTransfers.value) c[t.status] = (c[t.status] || 0) + 1;
  return c;
});

// ── filters ──
const statusFilters = computed(() => [
  { value: "",           label: "Todas",       icon: "mdi-view-list-outline"    },
  { value: "draft",      label: "Borrador",    icon: "mdi-clock-edit-outline",   count: statusCounts.value.draft      || null },
  { value: "dispatched", label: "Enviadas",    icon: "mdi-truck-fast-outline",   count: statusCounts.value.dispatched || null },
  { value: "received",   label: "Recibidas",   icon: "mdi-check-circle-outline", count: statusCounts.value.received   || null },
  { value: "partial",    label: "Diferencia",  icon: "mdi-alert-outline",        count: statusCounts.value.partial    || null },
  { value: "cancelled",  label: "Canceladas",  icon: "mdi-cancel"                },
]);

const currentStatusLabel = computed(
  () => statusFilters.value.find(s => s.value === statusFilter.value)?.label || ""
);

// ── filtered / sorted / paginated ──
const filtered = computed(() => {
  // Parte del conjunto ya filtrado por sucursal (visibleTransfers)
  let list = visibleTransfers.value;

  if (statusFilter.value) list = list.filter(t => t.status === statusFilter.value);
  if (search.value.trim()) {
    const q = search.value.trim().toLowerCase();
    list = list.filter(t =>
      (t.number || "").toLowerCase().includes(q) ||
      (t.fromWarehouse?.branch?.name || "").toLowerCase().includes(q) ||
      (t.toBranch?.name || t.toWarehouse?.branch?.name || "").toLowerCase().includes(q) ||
      (t.note || "").toLowerCase().includes(q)
    );
  }
  return [...list].sort((a, b) => {
    const va = String(a[sortBy.value] ?? "").toLowerCase();
    const vb = String(b[sortBy.value] ?? "").toLowerCase();
    return sortDesc.value ? vb.localeCompare(va) : va.localeCompare(vb);
  });
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / limit.value)));
const paginated  = computed(() =>
  filtered.value.slice((page.value - 1) * limit.value, page.value * limit.value)
);
const pageRange = computed(() => {
  const t = totalPages.value, c = page.value;
  if (t <= 7) return Array.from({ length: t }, (_, i) => i + 1);
  const r = [1];
  if (c > 3) r.push("…");
  for (let p = Math.max(2, c - 1); p <= Math.min(t - 1, c + 1); p++) r.push(p);
  if (c < t - 2) r.push("…");
  r.push(t);
  return r;
});

watch([statusFilter, search, limit], () => { page.value = 1; });

// ── helpers ──
function statusLabel(s) {
  return { draft:"Borrador", dispatched:"Enviada", received:"Recibida",
           partial:"Diferencia", cancelled:"Cancelada", rejected:"Rechazada" }[s] || s;
}
function statusIcon(s) {
  return { draft:"mdi-clock-edit-outline", dispatched:"mdi-truck-fast-outline",
           received:"mdi-check-circle-outline", partial:"mdi-alert-circle-outline",
           cancelled:"mdi-cancel", rejected:"mdi-close-circle-outline" }[s] || "mdi-help";
}
function statusChipColor(s) {
  return { draft:"default", dispatched:"warning", received:"success",
           partial:"warning", cancelled:"default", rejected:"error", "":"primary" }[s] || "default";
}
function shortName(u) {
  if (!u) return "—";
  const fn = u.first_name || "", ln = (u.last_name || "").charAt(0);
  return ln ? `${fn} ${ln}.` : fn || `#${u.id}`;
}
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day:"2-digit", month:"short", year:"2-digit" });
}
function timeAgo(d) {
  if (!d) return "";
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "ahora"; if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); return h < 24 ? `${h}h` : `${Math.floor(h/24)}d`;
}

// ── API ──
async function loadList() {
  loading.value = true;
  try {
    const { data } = await listTransfers({ page: 1, limit: 500 });
    allTransfers.value = data.transfers || [];
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

// ── navegación ──
function openDetail(tr) {
  selectedId.value = tr.id;
  selectedTransfer.value = tr;
}

function closeDetail() {
  selectedId.value = null;
  selectedTransfer.value = null;
}

async function refreshAndReload(id) {
  await loadList();
  if (id) {
    try {
      const { data } = await getTransfer(id);
      selectedTransfer.value = data?.transfer || data || selectedTransfer.value;
    } catch {}
  }
}

async function onDispatch(id) { await refreshAndReload(id); }
async function onReceive(id)  { await refreshAndReload(id); }
async function onCancel()     { closeDetail(); await loadList(); }
function onCreated()          { showCreate.value = false; loadList(); }

onMounted(() => { loadList(); });
</script>

<style scoped>
/* ══════════════════════════════════════════════════════════
   RAÍZ
══════════════════════════════════════════════════════════ */
.transfers {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ══════════════════════════════════════════════════════════
   BANNER PERSISTENTE — pendientes de recepción
   No tiene X de cierre. Se va solo cuando no hay más pendientes.
══════════════════════════════════════════════════════════ */
.transfers__alert {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(var(--v-theme-warning), .45);
  background: rgba(var(--v-theme-warning), .08);
}
.transfers__alert-icon {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding-top: 2px;
}
.transfers__alert-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-warning));
  animation: blink 1.4s infinite;
  flex-shrink: 0;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

.transfers__alert-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.transfers__alert-title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), .9);
  margin: 0;
}
.transfers__alert-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.transfers__alert-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-warning), .25);
  background: rgba(var(--v-theme-warning), .07);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  transition: background .12s;
  flex-wrap: wrap;
}
.transfers__alert-item:hover { background: rgba(var(--v-theme-warning), .18); }
.transfers__alert-item-num  { font-weight: 700; letter-spacing: .01em; }
.transfers__alert-item-from { color: rgba(var(--v-theme-on-surface), .6); flex: 1; }
.transfers__alert-item-ago  { font-size: 11px; color: rgba(var(--v-theme-on-surface), .4); }

/* ══════════════════════════════════════════════════════════
   CARD — igual que las cards del sistema
══════════════════════════════════════════════════════════ */
.transfers__card {
  border: 1px solid rgba(var(--v-theme-on-surface), .09) !important;
  overflow: hidden;
}

/* Card head — igual a .stk-head */
.transfers__head {
  padding: 14px 16px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.transfers__head-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.transfers__title {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -0.01em;
}
.transfers__sub {
  font-size: 11px;
  opacity: 0.50;
  font-weight: 600;
}
.transfers__head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ══════════════════════════════════════════════════════════
   TOOLBAR FILTROS
══════════════════════════════════════════════════════════ */
.transfers__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 12px;
  flex-wrap: wrap;
}
.transfers__filters {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  flex: 1;
}
.transfers__filter-chip { cursor: pointer; font-weight: 600; }
.transfers__filter-count {
  margin-left: 4px;
  font-size: 10px;
  font-weight: 800;
  padding: 0 5px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), .12);
}

/* ══════════════════════════════════════════════════════════
   LOADING / EMPTY
══════════════════════════════════════════════════════════ */
.transfers__loading,
.transfers__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), .4);
  text-align: center;
}
.transfers__empty-title { font-size: 15px; font-weight: 700; }
.transfers__empty-sub   { font-size: 13px; max-width: 300px; }

/* ══════════════════════════════════════════════════════════
   FEED ROWS — igual a .stk-alert-row del sistema
══════════════════════════════════════════════════════════ */
.transfers__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px 11px 16px;
  cursor: pointer;
  transition: background .12s;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .07);
}
.transfers__row:last-child { border-bottom: none; }
.transfers__row:hover { background: rgba(var(--v-theme-on-surface), .04); }
.transfers__row--cancelled { opacity: .55; }

/* Barra de color lateral */
.transfers__bar {
  display: inline-block;
  width: 3px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
  background: rgba(var(--v-theme-on-surface), .15);
}
.transfers__bar--draft      { background: rgba(var(--v-theme-on-surface), .2); }
.transfers__bar--dispatched { background: rgb(var(--v-theme-warning)); }
.transfers__bar--received   { background: rgb(var(--v-theme-success)); }
.transfers__bar--partial    { background: rgb(var(--v-theme-warning)); }
.transfers__bar--cancelled  { background: rgba(var(--v-theme-on-surface), .12); }
.transfers__bar--rejected   { background: rgb(var(--v-theme-error)); }

/* Info principal — ocupa el espacio */
.transfers__row-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.transfers__row-top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.transfers__number {
  font-weight: 700;
  font-size: 13px;
  letter-spacing: .01em;
  flex-shrink: 0;
}
.transfers__route {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  min-width: 0;
}
.transfers__route-from {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.transfers__route-to {
  color: rgb(var(--v-theme-success));
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.transfers__row-bottom {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.transfers__row-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .45);
  font-weight: 500;
}
.transfers__row-note {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* Personas */
.transfers__people {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.transfers__person {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .45);
  white-space: nowrap;
}
.transfers__person--dispatch { color: rgb(var(--v-theme-warning)); }
.transfers__person--receive  { color: rgb(var(--v-theme-success)); }

/* Derecha */
.transfers__row-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}
.transfers__date {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .4);
  white-space: nowrap;
}

/* ══════════════════════════════════════════════════════════
   FOOTER PAGINACIÓN
══════════════════════════════════════════════════════════ */
.transfers__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 14px;
}
.transfers__count-info {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), .45);
  white-space: nowrap;
}
.transfers__pagination {
  display: flex;
  align-items: center;
  gap: 3px;
}
.transfers__pgbtn {
  min-width: 30px;
  height: 30px;
  border-radius: 6px;
  padding: 0 5px;
  border: 1px solid rgba(var(--v-theme-on-surface), .12);
  background: transparent;
  color: rgba(var(--v-theme-on-surface), .65);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .12s;
}
.transfers__pgbtn:hover:not([disabled]) {
  background: rgba(var(--v-theme-primary), .1);
  border-color: rgba(var(--v-theme-primary), .4);
  color: rgb(var(--v-theme-primary));
}
.transfers__pgbtn--active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.transfers__pgbtn[disabled] { opacity: .3; cursor: not-allowed; }

.transfers__perpage {
  padding: 5px 8px;
  border-radius: 6px;
  font-size: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), .15);
  background: transparent;
  color: rgba(var(--v-theme-on-surface), .65);
  cursor: pointer;
  outline: none;
}
.transfers__perpage:focus { border-color: rgb(var(--v-theme-primary)); }
</style>
