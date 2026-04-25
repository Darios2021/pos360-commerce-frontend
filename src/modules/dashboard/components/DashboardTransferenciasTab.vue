<template>
  <div class="tr">

    <!-- ══════════════════ VISTA: DETALLE (inline, sin modal) ══════════════════ -->
    <template v-if="selectedTransfer">
      <TransferDetail
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

    <!-- ══════════════════ VISTA: LISTA ══════════════════════════════════════ -->
    <template v-else>

      <!-- ── TOP BAR ── -->
      <div class="tr-bar">
        <div class="tr-bar-left">
          <v-icon size="22" color="primary">mdi-truck-fast</v-icon>
          <div>
            <div class="tr-title">Derivaciones</div>
            <div class="tr-subtitle">
              {{ filtered.length }} {{ filtered.length === 1 ? 'resultado' : 'resultados' }}
              <span v-if="statusFilter" class="tr-subtitle-filter"> · filtrado por estado</span>
            </div>
          </div>
        </div>
        <div class="tr-bar-right">
          <v-btn variant="tonal" size="small" rounded="lg" prepend-icon="mdi-refresh" :loading="loading" @click="loadList">
            Actualizar
          </v-btn>
          <v-btn color="primary" size="small" variant="flat" rounded="lg" prepend-icon="mdi-plus" @click="showCreate = true">
            Nueva derivación
          </v-btn>
        </div>
      </div>

      <!-- ── KPIs (clickeables: filtran) ── -->
      <div class="tr-kpis">
        <button
          type="button"
          class="tr-kpi tr-kpi--all"
          :class="{ 'is-active': statusFilter === '' }"
          @click="statusFilter = ''; page = 1"
        >
          <div class="tr-kpi__badge"><v-icon size="18" color="white">mdi-view-list-outline</v-icon></div>
          <div>
            <div class="tr-kpi__val">{{ visibleTransfers.length }}</div>
            <div class="tr-kpi__lbl">Todas</div>
          </div>
        </button>
        <button
          type="button"
          class="tr-kpi tr-kpi--draft"
          :class="{ 'is-active': statusFilter === 'draft' }"
          @click="statusFilter = 'draft'; page = 1"
        >
          <div class="tr-kpi__badge"><v-icon size="18" color="white">mdi-clock-edit-outline</v-icon></div>
          <div>
            <div class="tr-kpi__val">{{ statusCounts.draft || 0 }}</div>
            <div class="tr-kpi__lbl">Borrador</div>
          </div>
        </button>
        <button
          type="button"
          class="tr-kpi tr-kpi--pending"
          :class="{ 'is-active': statusFilter === 'dispatched' }"
          @click="statusFilter = 'dispatched'; page = 1"
        >
          <div class="tr-kpi__badge"><v-icon size="18" color="white">mdi-truck-fast-outline</v-icon></div>
          <div>
            <div class="tr-kpi__val">{{ statusCounts.dispatched || 0 }}</div>
            <div class="tr-kpi__lbl">Pendientes</div>
          </div>
        </button>
        <button
          type="button"
          class="tr-kpi tr-kpi--received"
          :class="{ 'is-active': statusFilter === 'received' }"
          @click="statusFilter = 'received'; page = 1"
        >
          <div class="tr-kpi__badge"><v-icon size="18" color="white">mdi-check-circle-outline</v-icon></div>
          <div>
            <div class="tr-kpi__val">{{ statusCounts.received || 0 }}</div>
            <div class="tr-kpi__lbl">Recibidas</div>
          </div>
        </button>
        <button
          type="button"
          class="tr-kpi tr-kpi--cancelled"
          :class="{ 'is-active': statusFilter === 'cancelled' }"
          @click="statusFilter = 'cancelled'; page = 1"
        >
          <div class="tr-kpi__badge"><v-icon size="18" color="white">mdi-cancel</v-icon></div>
          <div>
            <div class="tr-kpi__val">{{ statusCounts.cancelled || 0 }}</div>
            <div class="tr-kpi__lbl">Canceladas</div>
          </div>
        </button>
      </div>

      <!-- ── BANNER pendientes de recepción ── -->
      <div v-if="pendingForMe.length && !isAdmin" class="tr-alert">
        <div class="tr-alert__icon">
          <span class="tr-alert__dot" />
          <v-icon size="20" color="warning">mdi-truck-delivery-outline</v-icon>
        </div>
        <div class="tr-alert__body">
          <p class="tr-alert__title">
            {{ pendingForMe.length === 1
              ? '1 paquete esperando recepción'
              : `${pendingForMe.length} paquetes esperando recepción` }}
          </p>
          <div class="tr-alert__list">
            <button
              v-for="t in pendingForMe" :key="t.id"
              class="tr-alert__item"
              @click="openDetail(t)"
            >
              <v-icon size="12" color="warning">mdi-circle</v-icon>
              <span class="tr-alert__num">{{ t.number }}</span>
              <span class="tr-alert__from">desde {{ t.fromWarehouse?.branch?.name || '—' }}</span>
              <span class="tr-alert__ago">{{ timeAgo(t.dispatched_at) }}</span>
              <v-chip size="x-small" color="success" variant="flat" class="ml-1">Recepcionar</v-chip>
            </button>
          </div>
        </div>
      </div>

      <!-- ── SEARCH ── -->
      <div class="tr-search-area">
        <v-text-field
          v-model="search"
          placeholder="Buscar número, sucursal, nota…"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="tr-q-field"
          @update:model-value="page = 1"
        />
      </div>

      <!-- ── TABLA ── -->
      <div class="tr-table-wrap">
        <table class="tr2">
          <thead>
            <tr>
              <th class="col-num">Número</th>
              <th class="col-route">Origen → Destino</th>
              <th class="col-products">Productos</th>
              <th class="col-people">Personas</th>
              <th class="col-status">Estado</th>
              <th class="col-time">Tiempo</th>
              <th class="col-action"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && !paginated.length">
              <td colspan="7" class="tr2-td-loading">
                <v-progress-circular size="22" indeterminate color="primary" />
              </td>
            </tr>
            <tr v-else-if="!paginated.length">
              <td colspan="7" class="tr2-td-empty">
                <v-icon size="36" color="medium-emphasis">mdi-truck-remove-outline</v-icon>
                <div>Sin derivaciones para estos filtros</div>
              </td>
            </tr>
            <tr
              v-for="t in paginated"
              :key="t.id"
              class="tr2-row"
              :class="`tr2-row--${t.status}`"
              @click="openDetail(t)"
            >
              <td>
                <div class="tr2-num">{{ t.number }}</div>
                <div class="tr2-date">{{ fmtDate(t.created_at) }}</div>
              </td>
              <td>
                <div class="tr2-route">
                  <span class="tr2-branch tr2-branch--from">
                    <v-icon size="11">mdi-store-outline</v-icon>
                    {{ t.fromWarehouse?.branch?.name || '—' }}
                  </span>
                  <v-icon size="14" class="tr2-arrow">mdi-arrow-right</v-icon>
                  <span class="tr2-branch tr2-branch--to">
                    <v-icon size="11">mdi-store</v-icon>
                    {{ t.toBranch?.name || t.toWarehouse?.branch?.name || '—' }}
                  </span>
                </div>
              </td>
              <td>
                <div class="tr2-items">
                  <v-icon size="13" color="primary">mdi-package-variant-closed</v-icon>
                  <span><b>{{ itemCount(t) }}</b> {{ itemCount(t) === 1 ? 'producto' : 'productos' }}</span>
                </div>
                <div v-if="t.note" class="tr2-note" :title="t.note">{{ t.note }}</div>
              </td>
              <td>
                <div class="tr2-people">
                  <span
                    v-if="t.creator"
                    class="tr2-av tr2-av--create"
                    :title="`Creó: ${fullName(t.creator)}`"
                  >
                    {{ initialsOf(t.creator) }}
                  </span>
                  <span
                    v-if="t.dispatcher"
                    class="tr2-av tr2-av--dispatch"
                    :title="`Despachó: ${fullName(t.dispatcher)}`"
                  >
                    {{ initialsOf(t.dispatcher) }}
                  </span>
                  <span
                    v-if="t.receiver"
                    class="tr2-av tr2-av--receive"
                    :title="`Recibió: ${fullName(t.receiver)}`"
                  >
                    {{ initialsOf(t.receiver) }}
                  </span>
                  <span v-if="!t.creator && !t.dispatcher && !t.receiver" class="tr2-dim">—</span>
                </div>
              </td>
              <td>
                <span class="tr2-status" :class="`tr2-status--${t.status}`">
                  <span class="tr2-status__dot" />
                  <v-icon size="11">{{ statusIcon(t.status) }}</v-icon>
                  {{ statusLabel(t.status) }}
                </span>
              </td>
              <td>
                <div class="tr2-time" :class="timeUrgencyClass(t)">
                  {{ timeLabelOf(t) }}
                </div>
              </td>
              <td class="tr2-action" @click.stop>
                <v-btn
                  v-if="t.status === 'draft' && (isCentral || isAdmin)"
                  size="small"
                  color="warning"
                  variant="flat"
                  rounded="lg"
                  class="mr-1"
                  @click.stop="openDetail(t)"
                >
                  <v-icon start size="14">mdi-truck-fast</v-icon>
                  Despachar
                </v-btn>
                <v-btn
                  v-else-if="t.status === 'dispatched'"
                  size="small"
                  color="success"
                  variant="flat"
                  rounded="lg"
                  class="mr-1"
                  @click.stop="openDetail(t)"
                >
                  <v-icon start size="14">mdi-check-circle</v-icon>
                  Recepcionar
                </v-btn>
                <v-menu :close-on-content-click="true">
                  <template #activator="{ props: menuProps }">
                    <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
                  </template>
                  <v-list density="compact" nav>
                    <v-list-item @click="openDetail(t)" prepend-icon="mdi-eye-outline">
                      <v-list-item-title>Ver detalle</v-list-item-title>
                    </v-list-item>
                    <v-divider v-if="isAdmin && !['cancelled','received'].includes(t.status)" />
                    <v-list-item
                      v-if="isAdmin && !['cancelled','received'].includes(t.status)"
                      prepend-icon="mdi-cancel"
                      @click="confirmCancel(t)"
                      class="text-error"
                    >
                      <v-list-item-title>Cancelar derivación</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="filtered.length > limit" class="tr-pagination">
          <div class="tr-pag-info">
            Pág. <b>{{ page }}</b> de <b>{{ totalPages }}</b> · <b>{{ filtered.length }}</b> total
          </div>
          <div class="tr-pag-btns">
            <v-btn variant="tonal" size="small" rounded="lg" :disabled="page <= 1 || loading" @click="page--">
              <v-icon start>mdi-chevron-left</v-icon>Anterior
            </v-btn>
            <v-btn variant="tonal" size="small" rounded="lg" :disabled="page >= totalPages || loading" @click="page++">
              Siguiente<v-icon end>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
          <select class="tr-perpage" v-model="limit" @change="page = 1">
            <option :value="15">15 / pág</option>
            <option :value="25">25 / pág</option>
            <option :value="50">50 / pág</option>
          </select>
        </div>
      </div>

      <!-- ── Dialog nueva derivación ── -->
      <v-dialog v-model="showCreate" max-width="680" scrollable persistent>
        <TransferForm
          :current-warehouse-id="currentWarehouseId"
          :current-branch-id="currentBranchId"
          @created="onCreated"
          @close="showCreate = false"
        />
      </v-dialog>

      <!-- ── Dialog cancelar ── -->
      <v-dialog v-model="cancelDialog.show" max-width="440">
        <v-card rounded="xl">
          <div class="cancel-dlg__head">
            <div class="cancel-dlg__icon-wrap">
              <v-icon size="22" color="error">mdi-cancel</v-icon>
            </div>
            <div>
              <p class="cancel-dlg__eyebrow">{{ cancelDialog.item?.number }}</p>
              <h3 class="cancel-dlg__title">Cancelar derivación</h3>
            </div>
          </div>
          <div class="cancel-dlg__body">
            <div class="cancel-dlg__info-row">
              <v-icon size="16" color="warning" class="flex-shrink-0">mdi-information-outline</v-icon>
              <span>La derivación quedará como <strong>Cancelada</strong> en el historial. El stock <strong>no se modifica</strong>.</span>
            </div>
          </div>
          <div class="cancel-dlg__actions">
            <v-btn variant="text" size="small" :disabled="cancelling" @click="cancelDialog.show = false">Volver</v-btn>
            <v-btn color="error" size="small" variant="flat" :loading="cancelling" @click="doCancelConfirmed">
              <v-icon start size="14">mdi-cancel</v-icon>Confirmar cancelación
            </v-btn>
          </div>
        </v-card>
      </v-dialog>

      <v-snackbar v-model="snack.show" :timeout="3200" rounded="xl">{{ snack.text }}</v-snackbar>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { listTransfers, getTransfer, cancelTransfer } from "../service/stockTransfer.api";
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

// ── state ──────────────────────────────────────────────────────────────────
const allTransfers     = ref([]);
const loading          = ref(false);
const selectedTransfer = ref(null);
const showCreate       = ref(false);
const dense            = ref(false);
const menuOpen         = ref({});
const snack            = ref({ show: false, text: "" });

const search       = ref("");
const statusFilter = ref("");
const page         = ref(1);
const limit        = ref(25);

const cancelDialog = ref({ show: false, item: null });
const cancelling   = ref(false);

// ── headers ────────────────────────────────────────────────────────────────
const headers = [
  { title: "Número",    key: "number",  sortable: false, width: 150 },
  { title: "Origen / Destino", key: "route",   sortable: false, width: 300 },
  { title: "Productos", key: "items",   sortable: false, width: 160 },
  { title: "Personas",  key: "people",  sortable: false, width: 190 },
  { title: "Estado",    key: "status",  sortable: false, width: 130 },
  { title: "",          key: "actions", sortable: false, width: 90  },
];

// ── item count helper ──────────────────────────────────────────────────────
function itemCount(t) {
  // backend list returns items:[{id}] — usar length
  if (Array.isArray(t.items)) return t.items.length;
  if (typeof t.item_count === "number") return t.item_count;
  return 0;
}

// ── visible transfers (filtro de sucursal) ─────────────────────────────────
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

const statusCounts = computed(() => {
  const c = {};
  for (const t of visibleTransfers.value) c[t.status] = (c[t.status] || 0) + 1;
  return c;
});

const statusFilters = computed(() => [
  { value: "",           label: "Todas",      icon: "mdi-view-list-outline"                                                    },
  { value: "draft",      label: "Borrador",   icon: "mdi-clock-edit-outline",   count: statusCounts.value.draft      || null },
  { value: "dispatched", label: "Pendientes", icon: "mdi-truck-fast-outline",   count: statusCounts.value.dispatched || null },
  { value: "received",   label: "Recibidas",  icon: "mdi-check-circle-outline", count: statusCounts.value.received   || null },
  { value: "cancelled",  label: "Canceladas", icon: "mdi-cancel"                                                               },
]);

// ── filtered / paginated ───────────────────────────────────────────────────
const filtered = computed(() => {
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
  return [...list].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / limit.value)));
const paginated  = computed(() =>
  filtered.value.slice((page.value - 1) * limit.value, page.value * limit.value)
);

watch([statusFilter, search, limit], () => { page.value = 1; });

// ── helpers ────────────────────────────────────────────────────────────────
function toast(msg) { snack.value = { show: true, text: String(msg || "Error") }; }
function toggleDense() { dense.value = !dense.value; }

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
function fullName(u) {
  if (!u) return "—";
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return full || u.username || u.email || `Usuario #${u.id}`;
}
function initialsOf(u) {
  if (!u) return "?";
  const src = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.email || "";
  const s = String(src).trim();
  const parts = s.split(/[\s@.]+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase() || "?";
}
function timeLabelOf(t) {
  const s = String(t.status).toLowerCase();
  // Para dispatched: tiempo transcurrido desde envío (más urgente)
  if (s === "dispatched" && t.dispatched_at) return `hace ${timeAgo(t.dispatched_at)}`;
  if (s === "received"   && t.received_at)   return `hace ${timeAgo(t.received_at)}`;
  if (s === "cancelled") return "—";
  return `hace ${timeAgo(t.created_at)}`;
}
function timeUrgencyClass(t) {
  if (String(t.status).toLowerCase() !== "dispatched" || !t.dispatched_at) return "";
  const hours = (Date.now() - new Date(t.dispatched_at).getTime()) / 3600000;
  if (hours >= 48) return "is-critical";
  if (hours >= 24) return "is-warning";
  return "";
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

// ── API ────────────────────────────────────────────────────────────────────
async function loadList() {
  loading.value = true;
  try {
    const { data } = await listTransfers({ page: 1, limit: 500 });
    allTransfers.value = data.transfers || [];
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
}

// ── acciones ──────────────────────────────────────────────────────────────
function openDetail(tr) {
  selectedTransfer.value = tr;
}
function closeDetail() {
  selectedTransfer.value = null;
}

function confirmCancel(item) {
  cancelDialog.value = { show: true, item };
}

async function doCancelConfirmed() {
  const id = cancelDialog.value.item?.id;
  if (!id) return;
  cancelling.value = true;
  try {
    await cancelTransfer(id);
    cancelDialog.value.show = false;
    await loadList();
    toast("Derivación cancelada");
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "No se pudo cancelar");
  } finally {
    cancelling.value = false;
  }
}

async function refreshAndReload(id) {
  await loadList();
  if (id && selectedTransfer.value) {
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
.tr {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── TOP BAR ── */
.tr-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.tr-bar-left { display: flex; align-items: center; gap: 12px; }
.tr-title    { font-size: 22px; font-weight: 900; line-height: 1.1; letter-spacing: -0.01em; }
.tr-subtitle { font-size: 12px; opacity: 0.6; margin-top: 2px; font-weight: 500; }
.tr-subtitle-filter { color: rgb(var(--v-theme-primary)); font-weight: 700; }
.tr-bar-right { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* ── KPIs ── */
.tr-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}
.tr-kpi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 2px solid rgba(var(--v-border-color), var(--v-border-opacity));
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color .15s, background .15s, transform .15s;
}
.tr-kpi:hover { border-color: rgba(var(--v-theme-primary), 0.35); }
.tr-kpi.is-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.18);
}
.tr-kpi__badge {
  width: 38px;
  height: 38px;
  border-radius: 11px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15);
}
.tr-kpi--all       .tr-kpi__badge { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.tr-kpi--draft     .tr-kpi__badge { background: linear-gradient(135deg, #94a3b8, #64748b); }
.tr-kpi--pending   .tr-kpi__badge { background: linear-gradient(135deg, #f59e0b, #d97706); }
.tr-kpi--received  .tr-kpi__badge { background: linear-gradient(135deg, #22c55e, #16a34a); }
.tr-kpi--cancelled .tr-kpi__badge { background: linear-gradient(135deg, #ef4444, #dc2626); }
.tr-kpi__val {
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.01em;
}
.tr-kpi__lbl {
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── BANNER ── */
.tr-alert {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1.5px solid rgba(var(--v-theme-warning), .45);
  background: rgba(var(--v-theme-warning), .08);
}
.tr-alert__icon {
  display: flex; align-items: center; gap: 6px;
  flex-shrink: 0; padding-top: 2px;
}
.tr-alert__dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: rgb(var(--v-theme-warning));
  animation: tr-blink 1.4s infinite; flex-shrink: 0;
}
@keyframes tr-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
.tr-alert__body   { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.tr-alert__title  { font-size: 13px; font-weight: 700; margin: 0; }
.tr-alert__list   { display: flex; flex-direction: column; gap: 4px; }
.tr-alert__item {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-warning), .25);
  background: rgba(var(--v-theme-warning), .07);
  cursor: pointer; font-size: 12px; font-weight: 500;
  text-align: left; transition: background .12s; flex-wrap: wrap;
}
.tr-alert__item:hover { background: rgba(var(--v-theme-warning), .18); }
.tr-alert__num  { font-weight: 700; letter-spacing: .01em; }
.tr-alert__from { color: rgba(var(--v-theme-on-surface), .6); flex: 1; }
.tr-alert__ago  { font-size: 11px; color: rgba(var(--v-theme-on-surface), .4); }

/* ── SEARCH AREA ── */
.tr-search-area {
  display: flex;
}
.tr-q-field { flex: 1; max-width: 520px; }
.tr-q-field :deep(.v-field) {
  background: rgb(var(--v-theme-surface));
}

/* ── TABLE ── */
.tr-table-wrap {
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}

/* Tabla custom tr2 */
.tr2 {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.tr2 thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
  white-space: nowrap;
}
.col-num      { width: 150px; }
.col-route    { width: 22%; min-width: 240px; }
.col-products { width: 14%; min-width: 140px; }
.col-people   { width: 120px; }
.col-status   { width: 130px; }
.col-time     { width: 100px; }
.col-action   { width: 160px; }

.tr2-row td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
  font-size: 13px;
  vertical-align: middle;
}
.tr2-row {
  cursor: pointer;
  transition: background 0.12s;
}
.tr2-row:hover { background: rgba(var(--v-theme-primary), 0.04); }
.tr2-row:last-child td { border-bottom: none; }
.tr2-row--cancelled {
  opacity: 0.65;
}
.tr2-row--cancelled td {
  text-decoration: line-through rgba(var(--v-theme-on-surface), 0.18);
}
.tr2-row--dispatched > td:first-child {
  box-shadow: inset 3px 0 0 0 #f59e0b;
}

.tr2-td-loading,
.tr2-td-empty {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.6;
}
.tr2-td-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

.tr2-num {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.02em;
  color: rgb(var(--v-theme-on-surface));
}
.tr2-date {
  font-size: 11px;
  opacity: 0.55;
  font-weight: 500;
  margin-top: 2px;
}

.tr2-route {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: nowrap;
  min-width: 0;
}
.tr2-branch {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 700;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tr2-branch--from {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}
.tr2-branch--to {
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
}
.tr2-arrow { opacity: 0.4; flex-shrink: 0; }

.tr2-items {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
}
.tr2-note {
  font-size: 11px;
  opacity: 0.55;
  margin-top: 2px;
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tr2-people {
  display: flex;
  gap: 4px;
  align-items: center;
}
.tr2-av {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 900;
  color: #fff;
  border: 2px solid rgb(var(--v-theme-surface));
  margin-left: -6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}
.tr2-av:first-child { margin-left: 0; }
.tr2-av--create   { background: linear-gradient(135deg, #94a3b8, #64748b); }
.tr2-av--dispatch { background: linear-gradient(135deg, #f59e0b, #d97706); }
.tr2-av--receive  { background: linear-gradient(135deg, #22c55e, #16a34a); }
.tr2-dim { font-size: 11px; opacity: 0.4; font-style: italic; }

.tr2-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.tr2-status__dot { width: 6px; height: 6px; border-radius: 50%; }
.tr2-status--draft {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.tr2-status--draft .tr2-status__dot { background: rgba(var(--v-theme-on-surface), 0.5); }
.tr2-status--dispatched {
  background: rgba(245, 158, 11, 0.14);
  color: #d97706;
}
:global(.v-theme--dark) .tr2-status--dispatched { color: #fbbf24; }
.tr2-status--dispatched .tr2-status__dot {
  background: #f59e0b;
  animation: tr2-pulse 1.8s ease-in-out infinite;
}
.tr2-status--received,
.tr2-status--partial {
  background: rgba(var(--v-theme-success), 0.14);
  color: rgb(var(--v-theme-success));
}
.tr2-status--received .tr2-status__dot { background: rgb(var(--v-theme-success)); }
.tr2-status--partial { background: rgba(245, 158, 11, 0.14); color: #d97706; }
.tr2-status--cancelled,
.tr2-status--rejected {
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
}
.tr2-status--cancelled .tr2-status__dot,
.tr2-status--rejected .tr2-status__dot { background: rgb(var(--v-theme-error)); }
@keyframes tr2-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
  50%      { box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3); }
}

.tr2-time {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.7;
  white-space: nowrap;
}
.tr2-time.is-warning {
  color: #d97706;
  opacity: 1;
  font-weight: 800;
}
.tr2-time.is-critical {
  color: rgb(var(--v-theme-error));
  opacity: 1;
  font-weight: 800;
}

.tr2-action {
  text-align: right;
  white-space: nowrap;
}

/* Table cells */
.tr-number  { font-size: 13px; font-weight: 800; letter-spacing: .01em; }
.tr-bold    { font-size: 13px; font-weight: 700; }
.tr-sub     { font-size: 11px; opacity: 0.5; }
.tr-note    { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 150px; }

/* Origen / Destino chips */
.tr-route {
  display: flex; align-items: center; gap: 6px; flex-wrap: nowrap;
}
.tr-chip-branch {
  font-size: 11px !important;
  font-weight: 700 !important;
  max-width: 120px;
  overflow: hidden;
}

.tr-people {
  display: flex; flex-direction: column; gap: 3px;
}
.tr-person {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), .55);
}
.tr-person--dispatch { color: rgb(var(--v-theme-warning)); }
.tr-person--receive  { color: rgb(var(--v-theme-success)); }

.tr-actions { display: flex; gap: 4px; align-items: center; }

/* Pagination */
.tr-pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; flex-wrap: wrap; gap: 8px;
}
.tr-pag-info { font-size: 12px; opacity: .55; }
.tr-pag-btns { display: flex; gap: 4px; }
.tr-perpage {
  padding: 5px 8px; border-radius: 6px; font-size: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), .15);
  background: transparent; color: rgba(var(--v-theme-on-surface), .65);
  cursor: pointer; outline: none;
}
.tr-perpage:focus { border-color: rgb(var(--v-theme-primary)); }

/* ── CANCEL DIALOG ── */
.cancel-dlg__head {
  display: flex; align-items: center; gap: 12px; padding: 16px 18px 12px;
}
.cancel-dlg__icon-wrap {
  width: 40px; height: 40px; display: flex; align-items: center;
  justify-content: center; border-radius: 50%;
  background: rgba(var(--v-theme-error), .1); flex-shrink: 0;
}
.cancel-dlg__eyebrow {
  margin: 0; font-size: 11px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5);
}
.cancel-dlg__title { margin: 2px 0 0; font-size: 18px; font-weight: 800; line-height: 1.1; }
.cancel-dlg__body  { padding: 4px 18px 14px; }
.cancel-dlg__info-row {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 8px 10px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), .03);
  border: 1px solid rgba(var(--v-theme-on-surface), .06);
  font-size: 13px; line-height: 1.4;
}
.cancel-dlg__actions {
  display: flex; justify-content: flex-end; gap: 8px; padding: 10px 18px 16px;
}

@media (max-width: 768px) {
  .tr-q-field { flex: 1; min-width: 160px; }
}
</style>
