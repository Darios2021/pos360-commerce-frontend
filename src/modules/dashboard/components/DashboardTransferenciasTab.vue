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
        <div>
          <div class="tr-title">Derivaciones</div>
          <div class="tr-subtitle">{{ filtered.length }} resultado{{ filtered.length !== 1 ? 's' : '' }}</div>
        </div>
        <div class="tr-bar-right">
          <v-btn variant="tonal" size="small" icon :loading="loading" @click="loadList" title="Actualizar">
            <v-icon size="17">mdi-refresh</v-icon>
          </v-btn>
          <v-btn color="primary" size="small" variant="flat" prepend-icon="mdi-plus" @click="showCreate = true">
            Nueva derivación
          </v-btn>
        </div>
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

      <!-- ── SEARCH + FILTER CHIPS ── -->
      <div class="tr-search-area">
        <div class="tr-search-row">
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
          <div class="tr-filters">
            <v-chip
              v-for="f in statusFilters"
              :key="f.value"
              :color="statusFilter === f.value ? statusChipColor(f.value) : undefined"
              :variant="statusFilter === f.value ? 'flat' : 'outlined'"
              size="small"
              class="tr-filter-chip"
              @click="statusFilter = f.value; page = 1"
            >
              <v-icon start size="12">{{ f.icon }}</v-icon>
              {{ f.label }}
              <span v-if="f.count" class="tr-filter-count">{{ f.count }}</span>
            </v-chip>
          </div>
        </div>
      </div>

      <!-- ── TABLE ── -->
      <div class="tr-table-wrap">
        <div class="tr-table-head">
          <div class="tr-table-head-left">
            <span class="tr-table-title">Derivaciones</span>
            <v-chip size="x-small" variant="tonal" class="ml-1">
              {{ paginated.length }} de {{ filtered.length }}
            </v-chip>
          </div>
          <v-btn size="x-small" variant="text" @click="toggleDense">
            <v-icon start size="13">{{ dense ? 'mdi-format-line-spacing' : 'mdi-format-line-weight' }}</v-icon>
            {{ dense ? 'Normal' : 'Compacta' }}
          </v-btn>
        </div>

        <v-data-table
          :headers="headers"
          :items="paginated"
          :loading="loading"
          item-key="id"
          :density="dense ? 'compact' : 'comfortable'"
          hover
          class="tr-table"
          :items-per-page="-1"
          hide-default-footer
          @click:row="(_, row) => openDetail(row.item)"
        >

          <!-- Número / Fecha -->
          <template #item.number="{ item }">
            <div class="tr-number">{{ item.number }}</div>
            <div class="tr-sub">{{ fmtDate(item.created_at) }}</div>
          </template>

          <!-- Origen / Destino como chips -->
          <template #item.route="{ item }">
            <div class="tr-route">
              <v-chip size="x-small" variant="tonal" color="primary" class="tr-chip-branch">
                <v-icon start size="10">mdi-store-outline</v-icon>
                {{ item.fromWarehouse?.branch?.name || '—' }}
              </v-chip>
              <v-icon size="13" color="medium-emphasis">mdi-arrow-right</v-icon>
              <v-chip size="x-small" variant="tonal" color="success" class="tr-chip-branch">
                <v-icon start size="10">mdi-store</v-icon>
                {{ item.toBranch?.name || item.toWarehouse?.branch?.name || '—' }}
              </v-chip>
            </div>
          </template>

          <!-- Productos + nota -->
          <template #item.items="{ item }">
            <div class="tr-bold">
              <v-icon size="12" class="mr-1" style="opacity:.55">mdi-package-variant-closed</v-icon>
              {{ itemCount(item) }} producto{{ itemCount(item) !== 1 ? 's' : '' }}
            </div>
            <div v-if="item.note" class="tr-sub tr-note">{{ item.note }}</div>
          </template>

          <!-- Personas -->
          <template #item.people="{ item }">
            <div class="tr-people">
              <span v-if="item.creator" class="tr-person">
                <v-icon size="10">mdi-pencil-outline</v-icon>
                {{ shortName(item.creator) }}
              </span>
              <span v-if="item.dispatcher" class="tr-person tr-person--dispatch">
                <v-icon size="10">mdi-truck-fast-outline</v-icon>
                {{ shortName(item.dispatcher) }}
              </span>
              <span v-if="item.receiver" class="tr-person tr-person--receive">
                <v-icon size="10">mdi-check-circle-outline</v-icon>
                {{ shortName(item.receiver) }}
              </span>
              <span v-if="!item.creator && !item.dispatcher && !item.receiver" class="tr-sub">—</span>
            </div>
          </template>

          <!-- Estado -->
          <template #item.status="{ item }">
            <v-chip size="small" variant="tonal" :color="statusChipColor(item.status)">
              <v-icon start size="10">{{ statusIcon(item.status) }}</v-icon>
              {{ statusLabel(item.status) }}
            </v-chip>
          </template>

          <!-- Acciones -->
          <template #item.actions="{ item }">
            <div class="tr-actions" @click.stop>
              <v-btn
                size="x-small"
                variant="tonal"
                color="primary"
                icon
                @click.stop="openDetail(item)"
                title="Ver detalle"
              >
                <v-icon size="15">mdi-eye</v-icon>
              </v-btn>

              <v-menu v-model="menuOpen[item.id]" :close-on-content-click="true">
                <template #activator="{ props }">
                  <v-btn v-bind="props" size="x-small" variant="tonal" icon>
                    <v-icon size="15">mdi-dots-vertical</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item @click.stop="openDetail(item)">
                    <template #prepend><v-icon size="16">mdi-eye</v-icon></template>
                    <v-list-item-title>Ver detalle</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item
                    v-if="item.status === 'draft' && (isCentral || isAdmin)"
                    @click.stop="openDetail(item)"
                  >
                    <template #prepend><v-icon size="16" color="warning">mdi-truck-fast-outline</v-icon></template>
                    <v-list-item-title>Despachar</v-list-item-title>
                  </v-list-item>
                  <v-list-item
                    v-if="item.status === 'dispatched'"
                    @click.stop="openDetail(item)"
                  >
                    <template #prepend><v-icon size="16" color="success">mdi-check-circle-outline</v-icon></template>
                    <v-list-item-title>Recepcionar</v-list-item-title>
                  </v-list-item>
                  <v-divider v-if="isAdmin && !['cancelled','received'].includes(item.status)" />
                  <v-list-item
                    v-if="isAdmin && !['cancelled','received'].includes(item.status)"
                    @click.stop="confirmCancel(item)"
                  >
                    <template #prepend><v-icon size="16" color="error">mdi-cancel</v-icon></template>
                    <v-list-item-title>Cancelar derivación</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>

          <!-- Pagination -->
          <template #bottom>
            <div class="tr-pagination">
              <div class="tr-pag-info">
                Pág. <b>{{ page }}</b> de <b>{{ totalPages }}</b> · <b>{{ filtered.length }}</b> total
              </div>
              <div class="tr-pag-btns">
                <v-btn variant="text" size="small" :disabled="page <= 1 || loading" @click="page--">
                  <v-icon start>mdi-chevron-left</v-icon>Anterior
                </v-btn>
                <v-btn variant="text" size="small" :disabled="page >= totalPages || loading" @click="page++">
                  Siguiente<v-icon end>mdi-chevron-right</v-icon>
                </v-btn>
              </div>
              <select class="tr-perpage" v-model="limit" @change="page = 1">
                <option :value="15">15 / pág</option>
                <option :value="25">25 / pág</option>
                <option :value="50">50 / pág</option>
              </select>
            </div>
          </template>

        </v-data-table>
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
}
.tr-title    { font-size: 22px; font-weight: 900; }
.tr-subtitle { font-size: 12px; opacity: 0.5; margin-top: 2px; }
.tr-bar-right { display: flex; gap: 8px; align-items: center; }

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
  padding: 12px 14px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.tr-search-row {
  display: flex; gap: 10px; align-items: center; flex-wrap: wrap;
}
.tr-q-field { flex: 0 0 260px; min-width: 180px; }
.tr-filters { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; flex: 1; }
.tr-filter-chip  { cursor: pointer; font-weight: 600; }
.tr-filter-count {
  margin-left: 4px; font-size: 10px; font-weight: 800;
  padding: 0 5px; border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), .12);
}

/* ── TABLE ── */
.tr-table-wrap {
  border-radius: 14px; overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.tr-table-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.tr-table-head-left { display: flex; align-items: center; }
.tr-table-title { font-size: 13px; font-weight: 800; }
.tr-table { background: transparent; }

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
