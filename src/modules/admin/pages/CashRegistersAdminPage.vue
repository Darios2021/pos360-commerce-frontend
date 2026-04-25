<template>
  <div class="cra">

    <!-- HEADER -->
    <div class="cra-header">
      <div class="cra-header__title">
        <v-icon size="22" color="primary">mdi-cash-register</v-icon>
        <div>
          <h1 class="cra-title">Cajas</h1>
          <span class="cra-subtitle">Control y supervisión total de cajas</span>
        </div>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        size="small"
        rounded="lg"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="reload"
      >
        Actualizar
      </v-btn>
    </div>

    <!-- KPIs -->
    <div class="cra-kpis">
      <div class="cra-kpi cra-kpi--open">
        <div class="cra-kpi__badge"><v-icon size="18" color="white">mdi-lock-open-variant</v-icon></div>
        <div>
          <div class="cra-kpi__val">{{ kpis.open_now }}</div>
          <div class="cra-kpi__lbl">Abiertas ahora</div>
        </div>
      </div>
      <div class="cra-kpi cra-kpi--closed">
        <div class="cra-kpi__badge"><v-icon size="18" color="white">mdi-lock</v-icon></div>
        <div>
          <div class="cra-kpi__val">{{ kpis.closed_today }}</div>
          <div class="cra-kpi__lbl">Cerradas hoy</div>
        </div>
      </div>
      <div class="cra-kpi cra-kpi--sales">
        <div class="cra-kpi__badge"><v-icon size="18" color="white">mdi-cash</v-icon></div>
        <div>
          <div class="cra-kpi__val">${{ fmtNum(kpis.sales_total_today) }}</div>
          <div class="cra-kpi__lbl">Ventas de hoy</div>
        </div>
      </div>
      <!-- ALERTAS -->
      <button
        type="button"
        class="cra-kpi cra-kpi--alert cra-kpi--clickable"
        :class="{ 'is-active': filters.alerts_only }"
        @click="toggleAlertsOnly"
        :title="filters.alerts_only ? 'Ver todas' : 'Filtrar: solo con alertas'"
      >
        <div class="cra-kpi__badge"><v-icon size="18" color="white">mdi-alert-decagram</v-icon></div>
        <div>
          <div class="cra-kpi__val">{{ kpis.filtered_alerts || 0 }}</div>
          <div class="cra-kpi__lbl">Con alertas</div>
        </div>
      </button>
      <!-- FALTANTES -->
      <button
        type="button"
        class="cra-kpi cra-kpi--shortage cra-kpi--clickable"
        :class="{ 'is-active': filters.shortage_only }"
        @click="toggleShortageOnly"
        :title="filters.shortage_only ? 'Ver todas' : 'Filtrar: solo con faltante'"
      >
        <div class="cra-kpi__badge"><v-icon size="18" color="white">mdi-cash-remove</v-icon></div>
        <div>
          <div class="cra-kpi__val">{{ kpis.filtered_shortage_count || 0 }}</div>
          <div class="cra-kpi__lbl">
            Faltantes
            <span v-if="kpis.filtered_shortage_total" class="cra-kpi__detail">
              ${{ fmtNum(Math.abs(kpis.filtered_shortage_total)) }}
            </span>
          </div>
        </div>
      </button>
      <!-- EXCEDIDAS 8H -->
      <button
        type="button"
        class="cra-kpi cra-kpi--overtime cra-kpi--clickable"
        :class="{ 'is-active': filters.overtime_only }"
        @click="toggleOvertimeOnly"
        :title="filters.overtime_only ? 'Ver todas' : 'Filtrar: turno excedido'"
      >
        <div class="cra-kpi__badge"><v-icon size="18" color="white">mdi-clock-alert</v-icon></div>
        <div>
          <div class="cra-kpi__val">{{ kpis.filtered_overtime || 0 }}</div>
          <div class="cra-kpi__lbl">Excedidas 8h</div>
        </div>
      </button>
    </div>

    <!-- FILTROS -->
    <div class="cra-filters">
      <v-text-field
        v-model="filters.q"
        prepend-inner-icon="mdi-magnify"
        placeholder="Buscar cajero, email, nota…"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="cra-filter cra-filter--search"
        @update:model-value="debouncedSearch"
      />
      <v-select
        v-model="filters.status"
        :items="statusOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        class="cra-filter"
        @update:model-value="reload"
      />
      <v-select
        v-model="filters.branch_id"
        :items="branchOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        placeholder="Todas las sucursales"
        class="cra-filter"
        @update:model-value="reload"
      />
      <v-text-field
        v-model="filters.date_from"
        type="date"
        label="Desde"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="cra-filter"
        @update:model-value="reload"
      />
      <v-text-field
        v-model="filters.date_to"
        type="date"
        label="Hasta"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="cra-filter"
        @update:model-value="reload"
      />
    </div>

    <!-- INFO -->
    <div class="cra-info">
      <span class="cra-info__count">
        {{ meta.total || 0 }}
        {{ (meta.total || 0) === 1 ? 'caja' : 'cajas' }}
      </span>
      <span v-if="loading" class="cra-info__loading">
        <v-progress-circular size="14" indeterminate color="primary" />
        <span class="ml-2">Cargando…</span>
      </span>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">
      {{ error }}
    </v-alert>

    <!-- TABLA -->
    <div class="cra-table-wrap">
      <table class="cra-table">
        <thead>
          <tr>
            <th class="col-state">Estado</th>
            <th class="col-caja">Caja</th>
            <th class="col-cashier">Cajero</th>
            <th class="col-branch">Sucursal</th>
            <th class="col-time">Apertura / Cierre</th>
            <th class="col-sales num">Ventas</th>
            <th class="col-diff num">Diferencia</th>
            <th class="col-alerts">Alertas</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading && !items.length">
            <td colspan="9" class="cra-td-loading">
              <v-progress-circular size="22" indeterminate color="primary" />
            </td>
          </tr>
          <tr v-else-if="!items.length">
            <td colspan="9" class="cra-td-empty">
              <v-icon size="32" color="medium-emphasis">mdi-cash-register</v-icon>
              <div>Sin cajas para estos filtros</div>
            </td>
          </tr>
          <tr
            v-for="r in items"
            :key="r.id"
            class="cra-row"
            :class="[
              topSeverityOf(r) ? `cra-row--sev-${topSeverityOf(r)}` : null,
            ]"
            @click="openDetail(r)"
          >
            <td>
              <span class="cra-status" :class="r.status === 'OPEN' ? 'is-open' : 'is-closed'">
                <span class="cra-status__dot" />
                {{ r.status === 'OPEN' ? 'Abierta' : 'Cerrada' }}
              </span>
            </td>
            <td>
              <div class="cra-caja">
                <div class="cra-caja__id">#{{ r.id }}</div>
                <div class="cra-caja__type" v-if="r.caja_type">{{ cajaTypeLabel(r.caja_type) }}</div>
              </div>
            </td>
            <td>
              <div class="cra-user" :title="r.opened_by_email || r.opened_by_name">
                <div class="cra-user__av">{{ initialsOf(r.opened_by_name) }}</div>
                <div class="cra-user__name">{{ r.opened_by_name }}</div>
              </div>
            </td>
            <td class="cra-branch">{{ r.branch_name }}</td>
            <td>
              <div class="cra-time">
                <div class="cra-time__row">
                  <v-icon size="12" class="cra-time__ic clr-ok">mdi-login-variant</v-icon>
                  <span>{{ fmtShort(r.opened_at) }}</span>
                </div>
                <div v-if="r.closed_at" class="cra-time__row">
                  <v-icon size="12" class="cra-time__ic clr-bad">mdi-logout-variant</v-icon>
                  <span>{{ fmtShort(r.closed_at) }}</span>
                </div>
                <div v-else class="cra-time__row cra-time__row--live">
                  <v-icon size="12" class="cra-time__ic">mdi-clock-outline</v-icon>
                  <span>{{ durationOf(r) }}</span>
                </div>
              </div>
            </td>
            <td class="num">
              <div class="cra-sales">
                <div class="cra-sales__amount">${{ fmtNum(r.sales_total) }}</div>
                <div class="cra-sales__count">{{ r.sales_count }} op.</div>
              </div>
            </td>
            <td class="num">
              <span
                v-if="r.difference_cash != null"
                class="cra-diff"
                :class="diffChipClass(r.difference_cash)"
              >
                {{ r.difference_cash > 0 ? '+' : '' }}${{ fmtNum(r.difference_cash) }}
              </span>
              <span v-else class="cra-dash">—</span>
            </td>
            <td>
              <div v-if="r.audit?.flags?.length" class="cra-alerts">
                <span
                  v-for="f in r.audit.flags"
                  :key="f.code"
                  class="cra-alert"
                  :class="`cra-alert--${f.severity}`"
                  :title="`${f.label}: ${f.detail}`"
                >
                  <v-icon size="12">{{ flagIcon(f.code) }}</v-icon>
                  <span class="cra-alert__lbl">{{ flagShortLabel(f.code) }}</span>
                </span>
              </div>
              <span v-else class="cra-ok-ic" title="Sin alertas">
                <v-icon size="14" color="success">mdi-shield-check</v-icon>
              </span>
            </td>
            <td class="cra-action" @click.stop>
              <v-menu :close-on-content-click="true" location="bottom end">
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    @click.stop
                  />
                </template>
                <v-list density="compact" nav min-width="220">
                  <v-list-item
                    prepend-icon="mdi-eye-outline"
                    @click="onRowClick(r)"
                  >
                    <v-list-item-title>Ver detalle</v-list-item-title>
                  </v-list-item>

                  <!-- Cerrar caja OPEN (admin / super) -->
                  <v-divider v-if="canAdminAct && r.status === 'OPEN'" />
                  <v-list-item
                    v-if="canAdminAct && r.status === 'OPEN'"
                    prepend-icon="mdi-lock-reset"
                    @click="confirmForceClose(r)"
                    class="text-warning"
                  >
                    <v-list-item-title>Cerrar caja (admin)</v-list-item-title>
                  </v-list-item>

                  <!-- Eliminar caja CLOSED (admin / super) -->
                  <v-divider v-if="canAdminAct && r.status === 'CLOSED'" />
                  <v-list-item
                    v-if="canAdminAct && r.status === 'CLOSED'"
                    prepend-icon="mdi-trash-can-outline"
                    @click="confirmDelete(r)"
                    class="text-error"
                  >
                    <v-list-item-title>Eliminar registro</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Dialog: Cierre administrativo (force-close) ─────────────────── -->
    <v-dialog v-model="forceCloseDialog.show" max-width="500" persistent>
      <v-card rounded="xl">
        <div class="cra-dlg__head cra-dlg__head--warn">
          <v-icon size="22" color="white">mdi-lock-reset</v-icon>
          <div>
            <p class="cra-dlg__eyebrow">Caja #{{ forceCloseDialog.row?.id }}</p>
            <h3 class="cra-dlg__title">Cerrar caja administrativamente</h3>
          </div>
        </div>
        <div class="cra-dlg__body">
          <div class="cra-dlg__info">
            <span class="cra-dlg__k">Cajero</span>
            <span>{{ forceCloseDialog.row?.opened_by_name || '—' }}</span>
          </div>
          <div class="cra-dlg__info">
            <span class="cra-dlg__k">Sucursal</span>
            <span>{{ forceCloseDialog.row?.branch_name || '—' }}</span>
          </div>
          <div class="cra-dlg__info">
            <span class="cra-dlg__k">Apertura</span>
            <span>{{ fmtShort(forceCloseDialog.row?.opened_at) }} · ${{ fmtNum(forceCloseDialog.row?.opening_cash) }}</span>
          </div>
          <div class="cra-dlg__info">
            <span class="cra-dlg__k">Ventas registradas</span>
            <span>{{ forceCloseDialog.row?.sales_count || 0 }} ({{ '$' + fmtNum(forceCloseDialog.row?.sales_total) }})</span>
          </div>

          <v-radio-group
            v-model="forceCloseDialog.mode"
            density="compact"
            hide-details
            class="mt-3"
          >
            <v-radio value="neutral" label="Cierre neutro (declarado = apertura, diferencia 0)" />
            <v-radio value="expected_real" label="Cierre con expected calculado (apertura + ventas en efectivo + ingresos − egresos)" />
          </v-radio-group>

          <v-text-field
            v-model="forceCloseDialog.reason"
            label="Motivo (opcional)"
            placeholder="Ej: cajero olvidó cerrar, cierre de turno administrativo…"
            variant="outlined"
            density="compact"
            hide-details
            class="mt-3"
          />
        </div>
        <div class="cra-dlg__actions">
          <v-btn variant="text" :disabled="forceCloseDialog.busy" @click="forceCloseDialog.show = false">
            Cancelar
          </v-btn>
          <v-btn
            color="warning"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-lock-reset"
            :loading="forceCloseDialog.busy"
            @click="doForceClose"
          >
            Confirmar cierre
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- ── Dialog: Eliminar caja ──────────────────────────────────────── -->
    <v-dialog v-model="deleteDialog.show" max-width="500" persistent>
      <v-card rounded="xl">
        <div class="cra-dlg__head cra-dlg__head--error">
          <v-icon size="22" color="white">mdi-trash-can-outline</v-icon>
          <div>
            <p class="cra-dlg__eyebrow">Caja #{{ deleteDialog.row?.id }}</p>
            <h3 class="cra-dlg__title">Eliminar registro de caja</h3>
          </div>
        </div>
        <div class="cra-dlg__body">
          <v-alert
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            <strong>Acción irreversible.</strong> Se eliminará el registro de la caja
            <b>#{{ deleteDialog.row?.id }}</b> junto con sus movimientos manuales.
            <span v-if="(deleteDialog.row?.sales_count || 0) > 0">
              También se borrarán las <b>{{ deleteDialog.row?.sales_count }} venta(s)</b> asociada(s)
              y todos sus pagos / items. Esto puede afectar reportes y arqueos pasados.
            </span>
          </v-alert>

          <div class="cra-dlg__info">
            <span class="cra-dlg__k">Cajero</span>
            <span>{{ deleteDialog.row?.opened_by_name || '—' }}</span>
          </div>
          <div class="cra-dlg__info">
            <span class="cra-dlg__k">Sucursal</span>
            <span>{{ deleteDialog.row?.branch_name || '—' }}</span>
          </div>
          <div class="cra-dlg__info">
            <span class="cra-dlg__k">Diferencia</span>
            <span :class="diffChipClass(deleteDialog.row?.difference_cash)">
              {{ deleteDialog.row?.difference_cash != null
                  ? (deleteDialog.row.difference_cash > 0 ? '+' : '') + '$' + fmtNum(deleteDialog.row.difference_cash)
                  : '—' }}
            </span>
          </div>

          <v-text-field
            v-model="deleteDialog.confirmText"
            :label="`Escribí ELIMINAR para confirmar`"
            placeholder="ELIMINAR"
            variant="outlined"
            density="compact"
            hide-details
            class="mt-3"
          />
        </div>
        <div class="cra-dlg__actions">
          <v-btn variant="text" :disabled="deleteDialog.busy" @click="deleteDialog.show = false">
            Cancelar
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="lg"
            prepend-icon="mdi-trash-can"
            :loading="deleteDialog.busy"
            :disabled="deleteDialog.confirmText.trim().toUpperCase() !== 'ELIMINAR'"
            @click="doDelete"
          >
            Eliminar definitivamente
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500" rounded="xl">{{ snack.text }}</v-snackbar>

    <!-- PAGINACIÓN -->
    <div class="cra-pager" v-if="(meta.total || 0) > filters.limit">
      <v-btn size="small" variant="tonal" :disabled="filters.page <= 1" @click="goPage(filters.page - 1)">
        <v-icon start>mdi-chevron-left</v-icon>Anterior
      </v-btn>
      <span class="cra-pager__info">
        Página <b>{{ filters.page }}</b> de <b>{{ totalPages }}</b>
      </span>
      <v-btn size="small" variant="tonal" :disabled="!meta.has_more" @click="goPage(filters.page + 1)">
        Siguiente<v-icon end>mdi-chevron-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { adminListCashRegisters } from "@/modules/pos/services/posCashRegisters.service";
import http from "@/app/api/http";
import { useAuthStore } from "@/app/store/auth.store";

const router = useRouter();
const auth = useAuthStore();
if (auth.status === "idle") auth.hydrate?.();

// Solo admin / super_admin pueden ejecutar acciones administrativas (cerrar
// cajas ajenas, eliminar registros). El backend tiene su propio guard, esto
// solo controla la visibilidad de los botones.
const canAdminAct = computed(() => auth.isBranchAdmin === true);

// ── Dialogs ──────────────────────────────────────────────────────────────
const forceCloseDialog = reactive({
  show: false,
  row: null,
  mode: "neutral",
  reason: "",
  busy: false,
});
const deleteDialog = reactive({
  show: false,
  row: null,
  confirmText: "",
  busy: false,
});
const snack = reactive({ show: false, text: "" });
function toast(text) {
  snack.show = true;
  snack.text = String(text || "");
}

function confirmForceClose(row) {
  forceCloseDialog.row = row;
  forceCloseDialog.mode = "neutral";
  forceCloseDialog.reason = "";
  forceCloseDialog.busy = false;
  forceCloseDialog.show = true;
}
async function doForceClose() {
  const row = forceCloseDialog.row;
  if (!row?.id) return;
  forceCloseDialog.busy = true;
  try {
    await http.post(`/pos/cash-registers/admin/${row.id}/force-close`, {
      mode: forceCloseDialog.mode,
      reason: forceCloseDialog.reason || null,
    });
    forceCloseDialog.show = false;
    toast(`Caja #${row.id} cerrada`);
    await reload();
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "No se pudo cerrar la caja";
    toast(msg);
  } finally {
    forceCloseDialog.busy = false;
  }
}

function confirmDelete(row) {
  deleteDialog.row = row;
  deleteDialog.confirmText = "";
  deleteDialog.busy = false;
  deleteDialog.show = true;
}
async function doDelete() {
  const row = deleteDialog.row;
  if (!row?.id) return;
  if (deleteDialog.confirmText.trim().toUpperCase() !== "ELIMINAR") return;
  deleteDialog.busy = true;
  try {
    const hasSales = (row.sales_count || 0) > 0;
    const url = `/pos/cash-registers/admin/${row.id}${hasSales ? "?force=1" : ""}`;
    await http.delete(url);
    deleteDialog.show = false;
    toast(`Caja #${row.id} eliminada${hasSales ? ` (con ${row.sales_count} venta(s))` : ""}`);
    await reload();
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "No se pudo eliminar";
    toast(msg);
  } finally {
    deleteDialog.busy = false;
  }
}

const loading = ref(false);
const error = ref("");
const items = ref([]);
const meta = ref({ page: 1, limit: 25, total: 0, has_more: false });
const kpis = ref({
  open_now: 0,
  closed_today: 0,
  difference_today: 0,
  sales_total_today: 0,
  filtered_alerts: 0,
  filtered_shortage_count: 0,
  filtered_shortage_total: 0,
  filtered_overtime: 0,
});

const filters = reactive({
  q: "",
  status: "ALL",
  branch_id: null,
  date_from: "",
  date_to: "",
  alerts_only: false,
  overtime_only: false,
  shortage_only: false,
  page: 1,
  limit: 25,
});

const statusOptions = [
  { value: "ALL", label: "Todas" },
  { value: "OPEN", label: "Solo abiertas" },
  { value: "CLOSED", label: "Solo cerradas" },
];

const branches = ref([]);
const branchOptions = computed(() =>
  branches.value.map((b) => ({ value: b.id, label: b.name || `Sucursal #${b.id}` }))
);

async function loadBranches() {
  try {
    const { data } = await http.get("/branches");
    const arr = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
    branches.value = arr;
  } catch (_) {
    branches.value = [];
  }
}

async function reload() {
  loading.value = true;
  error.value = "";
  try {
    const res = await adminListCashRegisters({
      q: filters.q,
      status: filters.status === "ALL" ? "" : filters.status,
      branch_id: filters.branch_id || "",
      date_from: filters.date_from || "",
      date_to: filters.date_to || "",
      alerts_only: filters.alerts_only,
      overtime_only: filters.overtime_only,
      shortage_only: filters.shortage_only,
      page: filters.page,
      limit: filters.limit,
    });
    items.value = Array.isArray(res?.data) ? res.data : [];
    meta.value = res?.meta || { page: 1, limit: filters.limit, total: 0, has_more: false };
    kpis.value = res?.kpis || kpis.value;
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo cargar";
    items.value = [];
  } finally {
    loading.value = false;
  }
}

const totalPages = computed(() => {
  const t = Number(meta.value?.total || 0);
  const l = Number(filters.limit || 25);
  if (t === 0) return 1;
  return Math.max(1, Math.ceil(t / l));
});

function goPage(p) {
  const n = Math.max(1, Math.min(totalPages.value, Number(p) || 1));
  if (n === filters.page) return;
  filters.page = n;
  reload();
}

let searchTimer = null;
function debouncedSearch() {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { filters.page = 1; reload(); }, 350);
}

watch(
  () => [filters.status, filters.branch_id, filters.date_from, filters.date_to],
  () => { filters.page = 1; }
);

function toggleAlertsOnly() {
  filters.alerts_only = !filters.alerts_only;
  if (filters.alerts_only) {
    filters.shortage_only = false;
    filters.overtime_only = false;
  }
  filters.page = 1;
  reload();
}
function toggleShortageOnly() {
  filters.shortage_only = !filters.shortage_only;
  if (filters.shortage_only) {
    filters.alerts_only = false;
    filters.overtime_only = false;
  }
  filters.page = 1;
  reload();
}
function toggleOvertimeOnly() {
  filters.overtime_only = !filters.overtime_only;
  if (filters.overtime_only) {
    filters.alerts_only = false;
    filters.shortage_only = false;
  }
  filters.page = 1;
  reload();
}

function openDetail(r) {
  router.push({ name: "adminCashRegisterDetail", params: { id: r.id } });
}

function topSeverityOf(r) {
  return r?.audit?.top_severity || null;
}

function flagIcon(code) {
  const map = {
    SHORTAGE: "mdi-cash-remove",
    SURPLUS: "mdi-cash-plus",
    OVERTIME: "mdi-clock-alert",
    LONG_OPEN: "mdi-clock-alert-outline",
    BIG_MANUAL_OUT: "mdi-arrow-up-bold-circle-outline",
  };
  return map[code] || "mdi-alert-outline";
}
function flagShortLabel(code) {
  const map = {
    SHORTAGE: "Faltante",
    SURPLUS: "Sobrante",
    OVERTIME: "+8h",
    LONG_OPEN: "+8h",
    BIG_MANUAL_OUT: "Egresos",
  };
  return map[code] || code;
}

/* Formatters */
function fmtNum(v) {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number(v || 0));
}
function fmtShort(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Hoy · ${time}`;
  const date = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
  return `${date} · ${time}`;
}
function durationOf(r) {
  if (!r.opened_at) return "—";
  const start = new Date(r.opened_at).getTime();
  const end = r.closed_at ? new Date(r.closed_at).getTime() : Date.now();
  const diff = Math.max(0, end - start);
  const min = Math.floor(diff / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m < 1) return "recién";
  return `${m} min`;
}
function initialsOf(name) {
  const s = String(name || "").trim();
  if (!s) return "—";
  const parts = s.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || s.slice(0, 2).toUpperCase();
}
function cajaTypeLabel(v) {
  const map = { GENERAL: "General", SHIFT: "Turno", BRANCH: "Sucursal", MOBILE: "Móvil" };
  return map[String(v || "").toUpperCase()] || "";
}
function diffColorClass(v) {
  const n = Number(v || 0);
  if (n > 0) return "cra-kpi--positive";
  if (n < 0) return "cra-kpi--negative";
  return "cra-kpi--neutral";
}
function diffChipClass(v) {
  const n = Number(v || 0);
  if (n > 0) return "cra-diff--positive";
  if (n < 0) return "cra-diff--negative";
  return "cra-diff--zero";
}

onMounted(() => {
  loadBranches();
  reload();
});
</script>

<style scoped>
.cra {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

/* Header */
.cra-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.cra-header__title {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cra-title {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.01em;
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
}
.cra-subtitle {
  font-size: 12px;
  opacity: 0.6;
  font-weight: 500;
}

/* KPIs */
.cra-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.cra-kpi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.cra-kpi__badge {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.15);
  background: rgba(var(--v-theme-on-surface), 0.3);
}
.cra-kpi--open .cra-kpi__badge     { background: linear-gradient(135deg, #22c55e, #16a34a); }
.cra-kpi--closed .cra-kpi__badge   { background: linear-gradient(135deg, #64748b, #475569); }
.cra-kpi--sales .cra-kpi__badge    { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.cra-kpi--positive .cra-kpi__badge { background: linear-gradient(135deg, #22c55e, #16a34a); }
.cra-kpi--negative .cra-kpi__badge { background: linear-gradient(135deg, #ef4444, #dc2626); }
.cra-kpi--neutral .cra-kpi__badge  { background: linear-gradient(135deg, #94a3b8, #64748b); }
.cra-kpi--alert .cra-kpi__badge     { background: linear-gradient(135deg, #f59e0b, #d97706); }
.cra-kpi--shortage .cra-kpi__badge  { background: linear-gradient(135deg, #ef4444, #b91c1c); }
.cra-kpi--overtime .cra-kpi__badge  { background: linear-gradient(135deg, #f97316, #c2410c); }

.cra-kpi--clickable {
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
}
.cra-kpi--clickable:hover {
  border-color: rgba(var(--v-theme-primary), 0.35);
}
.cra-kpi--clickable.is-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.25);
}
.cra-kpi__detail {
  font-weight: 700;
  opacity: 0.75;
  margin-left: 4px;
  text-transform: none;
  letter-spacing: 0;
}
.cra-kpi__val {
  font-size: 20px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
}
.cra-kpi__lbl {
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Filters */
.cra-filters {
  display: grid;
  grid-template-columns: 2fr 1fr 1.2fr 1fr 1fr;
  gap: 10px;
}
.cra-filter :deep(.v-field) {
  background: rgb(var(--v-theme-surface));
}

/* Info bar */
.cra-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  opacity: 0.75;
}
.cra-info__count { font-weight: 700; }
.cra-info__loading { display: flex; align-items: center; }

/* Tabla — densidad mejorada, 8 columnas en lugar de 13 */
.cra-table-wrap {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 14px;
  overflow: hidden;
}
.cra-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}
.cra-table thead th {
  text-align: left;
  font-size: 10.5px;
  font-weight: 800;
  opacity: 0.55;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 14px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  background: rgba(var(--v-theme-on-surface), 0.02);
  white-space: nowrap;
}
.cra-table thead th.num,
.cra-table td.num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.col-state   { width: 110px; }
.col-caja    { width: 90px; }
.col-cashier { width: 16%; }
.col-branch  { width: 12%; }
.col-time    { width: 16%; }
.col-sales   { width: 130px; }
.col-diff    { width: 115px; }
.col-alerts  { width: 170px; }
.col-action  { width: 44px; }

.cra-row td {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
  font-size: 13px;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cra-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
  cursor: pointer;
}
.cra-row:last-child td { border-bottom: none; }

/* Severidad — barra lateral izquierda */
.cra-row--sev-high > td:first-child {
  box-shadow: inset 3px 0 0 0 rgb(var(--v-theme-error));
}
.cra-row--sev-medium > td:first-child {
  box-shadow: inset 3px 0 0 0 #f59e0b;
}
.cra-row--sev-low > td:first-child {
  box-shadow: inset 3px 0 0 0 rgba(var(--v-theme-on-surface), 0.3);
}

/* Chips de alertas */
.cra-alerts {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.cra-alert {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 7px;
  border-radius: 6px;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.cra-alert__lbl { line-height: 1; }
.cra-alert--high {
  background: rgba(var(--v-theme-error), 0.14);
  color: rgb(var(--v-theme-error));
}
.cra-alert--medium {
  background: rgba(245, 158, 11, 0.18);
  color: #d97706;
}
.cra-alert--low {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}
:global(.v-theme--dark) .cra-alert--medium { color: #fbbf24; }

.cra-ok-ic {
  display: inline-flex;
  opacity: 0.7;
}

.cra-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.cra-status__dot { width: 7px; height: 7px; border-radius: 50%; }
.cra-status.is-open {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}
.cra-status.is-open .cra-status__dot {
  background: rgb(var(--v-theme-success));
  animation: cra-pulse 1.8s ease-in-out infinite;
}
.cra-status.is-closed {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.cra-status.is-closed .cra-status__dot { background: rgba(var(--v-theme-on-surface), 0.4); }
@keyframes cra-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0); }
  50%      { box-shadow: 0 0 0 4px rgba(var(--v-theme-success), 0.28); }
}

.cra-caja__id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}
.cra-caja__type {
  font-size: 10px;
  opacity: 0.55;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-top: 2px;
}

.cra-user {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.cra-user__av {
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  font-size: 10.5px;
  font-weight: 900;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  flex-shrink: 0;
}
.cra-user__name {
  font-weight: 700;
  font-size: 13px;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.cra-branch {
  font-weight: 600;
  font-size: 13px;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cra-time {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.cra-time__row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.cra-time__ic { opacity: 0.65; }
.cra-time__row--live {
  opacity: 0.7;
  font-weight: 700;
}

.cra-sales__amount {
  font-weight: 800;
  font-size: 13.5px;
  color: rgb(var(--v-theme-on-surface));
}
.cra-sales__count {
  font-size: 10.5px;
  opacity: 0.55;
  font-weight: 600;
}

.cra-dash { opacity: 0.3; }

.cra-diff {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}
.cra-diff--positive { background: rgba(var(--v-theme-success), 0.14); color: rgb(var(--v-theme-success)); }
.cra-diff--negative { background: rgba(var(--v-theme-error), 0.14);   color: rgb(var(--v-theme-error)); }
.cra-diff--zero     { background: rgba(var(--v-theme-on-surface), 0.08); opacity: 0.7; }

.cra-action { text-align: right; }
.cra-action__ic {
  opacity: 0.35;
  transition: opacity 0.15s, transform 0.15s;
}
.cra-row:hover .cra-action__ic {
  opacity: 1;
  transform: translateX(2px);
  color: rgb(var(--v-theme-primary));
}

.cra-td-loading,
.cra-td-empty {
  text-align: center;
  padding: 40px 20px;
  opacity: 0.6;
}
.cra-td-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
}

/* Pager */
/* ── Dialogs (force close / delete) ────────────────────────── */
.cra-dlg__head {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; color: #fff;
}
.cra-dlg__head--warn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.cra-dlg__head--error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
.cra-dlg__eyebrow {
  margin: 0; font-size: 11px; font-weight: 700;
  letter-spacing: 0.06em; text-transform: uppercase;
  opacity: 0.85;
}
.cra-dlg__title {
  margin: 2px 0 0; font-size: 18px; font-weight: 800; line-height: 1.1;
}
.cra-dlg__body { padding: 18px 20px; }
.cra-dlg__info {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0;
  font-size: 13px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
.cra-dlg__info:last-child { border-bottom: none; }
.cra-dlg__k {
  font-size: 11px; font-weight: 800;
  letter-spacing: 0.05em; text-transform: uppercase;
  opacity: 0.6;
}
.cra-dlg__actions {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 18px 18px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.cra-pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
}
.cra-pager__info {
  font-size: 12px;
  opacity: 0.7;
}

/* Responsive */
@media (max-width: 1200px) {
  .cra-table { min-width: 900px; }
  .cra-table-wrap { overflow-x: auto; }
}
@media (max-width: 960px) {
  .cra-filters { grid-template-columns: 1fr 1fr; }
  .cra-filter--search { grid-column: 1 / -1; }
}
</style>
