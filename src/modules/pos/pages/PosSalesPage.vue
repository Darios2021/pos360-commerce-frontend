<!-- src/modules/pos/pages/PosSalesPage.vue -->
<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height:100vh;">
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Ventas</div>
        <div class="text-caption text-medium-emphasis">
          Total: <b>{{ meta.total }}</b> · Página {{ meta.page }}/{{ meta.pages || 1 }}
        </div>
      </div>

      <div class="d-flex ga-2 align-center flex-wrap">
        <v-btn variant="tonal" @click="resetFilters" :disabled="loading || statsLoading">
          <v-icon start>mdi-filter-off</v-icon>
          Reset
        </v-btn>

        <v-btn variant="tonal" @click="exportCsv" :disabled="loading || !sales.length">
          <v-icon start>mdi-file-delimited-outline</v-icon>
          Exportar
        </v-btn>

        <v-btn color="primary" @click="refreshAll" :loading="loading || statsLoading">
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
      </div>
    </div>

    <!-- ✅ STATS: totales + por método (LO QUE PEDISTE) -->
    <v-row dense class="mb-4">
      <v-col cols="12" md="4">
        <KpiCard
          title="Cantidad de ventas"
          :value="stats.ready ? stats.sales_count : '—'"
          icon="mdi-receipt-text-outline"
          :loading="statsLoading"
        />
      </v-col>

      <v-col cols="12" md="4">
        <KpiCard
          title="Total vendido"
          :value="stats.ready ? money(stats.total_sum) : '—'"
          icon="mdi-cash-multiple"
          :loading="statsLoading"
        />
      </v-col>

      <v-col cols="12" md="4">
        <KpiCard
          title="Total cobrado"
          :value="stats.ready ? money(stats.paid_sum) : '—'"
          icon="mdi-cash-check"
          :loading="statsLoading"
        />
      </v-col>

      <v-col cols="12">
        <v-card class="rounded-xl" elevation="1">
          <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-2">
            <div class="text-subtitle-2 font-weight-bold">
              Recaudación por método de pago
            </div>

            <div class="d-flex ga-2 flex-wrap">
              <v-chip size="small" variant="tonal" color="green">
                Efectivo: {{ stats.ready ? money(stats.payments.cash) : "—" }}
              </v-chip>
              <v-chip size="small" variant="tonal" color="purple">
                Transferencia: {{ stats.ready ? money(stats.payments.transfer) : "—" }}
              </v-chip>
              <v-chip size="small" variant="tonal" color="indigo">
                Débito: {{ stats.ready ? money(stats.payments.debit) : "—" }}
              </v-chip>
              <v-chip size="small" variant="tonal" color="blue">
                Crédito: {{ stats.ready ? money(stats.payments.credit) : "—" }}
              </v-chip>
              <v-chip size="small" variant="tonal" color="orange">
                QR: {{ stats.ready ? money(stats.payments.qr) : "—" }}
              </v-chip>
              <v-chip size="small" variant="tonal" color="grey">
                Otro: {{ stats.ready ? money(stats.payments.other) : "—" }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FILTROS (SIN INPUTS VACÍOS) -->
    <v-card class="rounded-xl mb-4" elevation="1">
      <v-card-text>
        <v-row dense class="align-center">
          <!-- ✅ Cliente (autocomplete real) -->
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="customerValue"
              :items="customerItems"
              :loading="customerLoading"
              label="Cliente"
              placeholder="Buscar cliente (nombre / doc / teléfono)"
              prepend-inner-icon="mdi-account-search"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              item-title="title"
              item-value="value"
              @update:search="onCustomerSearch"
              @update:model-value="applyFilters"
            />
          </v-col>

          <!-- ✅ Cajero/Vendedor (autocomplete real) -->
          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              v-model="sellerId"
              :items="sellerItems"
              :loading="sellerLoading"
              label="Cajero / Vendedor"
              placeholder="Buscar vendedor"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              item-title="title"
              item-value="value"
              @update:search="onSellerSearch"
              @update:model-value="applyFilters"
            />
          </v-col>

          <!-- ✅ Producto (autocomplete real) -->
          <v-col cols="12" sm="6" md="3">
            <v-autocomplete
              v-model="productId"
              :items="productItems"
              :loading="productLoading"
              label="Producto"
              placeholder="Buscar producto"
              prepend-inner-icon="mdi-package-variant-closed"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              item-title="title"
              item-value="value"
              @update:search="onProductSearch"
              @update:model-value="applyFilters"
            />
          </v-col>

          <!-- ✅ Tipo de pago -->
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="payMethod"
              :items="payMethodItems"
              label="Tipo de pago"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            />
          </v-col>

          <!-- Estado -->
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="status"
              :items="statusItems"
              label="Estado"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            />
          </v-col>

          <!-- Admin: sucursal -->
          <v-col cols="12" md="3" v-if="isAdmin">
            <v-select
              v-model="selectedBranchId"
              :items="branchSelectItems"
              label="Sucursal"
              variant="outlined"
              density="comfortable"
              hide-details
              :loading="branchesLoading"
              @update:model-value="applyFilters"
            />
          </v-col>

          <!-- Fechas -->
          <v-col cols="12" sm="6" md="2">
            <v-menu v-model="fromMenu" :close-on-content-click="false" location="bottom">
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="from || ''"
                  label="Desde"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  placeholder="(sin fecha)"
                />
              </template>
              <v-date-picker v-model="from" show-adjacent-months @update:model-value="fromMenu = false; applyFilters()" />
            </v-menu>
          </v-col>

          <v-col cols="12" sm="6" md="2">
            <v-menu v-model="toMenu" :close-on-content-click="false" location="bottom">
              <template #activator="{ props }">
                <v-text-field
                  v-bind="props"
                  :model-value="to || ''"
                  label="Hasta"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  placeholder="(sin fecha)"
                />
              </template>
              <v-date-picker v-model="to" show-adjacent-months @update:model-value="toMenu = false; applyFilters()" />
            </v-menu>
          </v-col>

          <v-col cols="12" md="1">
            <v-btn block color="primary" @click="applyFilters" :loading="loading || statsLoading">
              <v-icon>mdi-filter</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2 mt-3 align-center">
          <v-btn size="small" variant="tonal" @click="setToday">Hoy</v-btn>
          <v-btn size="small" variant="tonal" @click="setThisWeek">Esta semana</v-btn>
          <v-btn size="small" variant="tonal" @click="setThisMonth">Este mes</v-btn>
          <v-btn size="small" variant="text" @click="clearDates">Limpiar fechas</v-btn>

          <v-spacer />

          <v-chip size="small" variant="tonal" color="primary">
            Sucursal: {{ effectiveBranchId ?? "— (todas)" }}
          </v-chip>

          <v-select
            v-model="meta.limit"
            :items="[10, 20, 50, 100]"
            label="Por página"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width:150px"
            @update:model-value="meta.page = 1; refreshAll()"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- TABLA -->
    <v-card class="rounded-xl" elevation="1">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="text-subtitle-1 font-weight-bold">Ventas</div>

        <div class="d-flex ga-2 align-center">
          <v-chip size="small" variant="tonal">
            Mostrando {{ sales.length }} de {{ meta.total }}
          </v-chip>

          <v-btn size="small" variant="tonal" @click="toggleDense">
            <v-icon start>{{ dense ? "mdi-format-line-spacing" : "mdi-format-line-weight" }}</v-icon>
            {{ dense ? "Normal" : "Compacta" }}
          </v-btn>
        </div>
      </v-card-title>

      <v-divider />

      <v-data-table
        :headers="headers"
        :items="sales"
        :loading="loading"
        item-key="id"
        :density="dense ? 'compact' : 'comfortable'"
        hover
        class="elevation-0"
        @click:row="onRowClick"
      >
        <template #item.sold_at="{ item }">
          <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
          <div class="text-caption text-medium-emphasis">
            ID: {{ item.id }}
            <span v-if="item.sale_number">· N°: {{ item.sale_number }}</span>
          </div>
        </template>

        <template #item.customer="{ item }">
          <div class="font-weight-bold">{{ item.customer_name || "Consumidor Final" }}</div>
          <div class="text-caption text-medium-emphasis">
            <span v-if="item.customer_doc">Doc: {{ item.customer_doc }}</span>
            <span v-if="item.customer_doc && item.customer_phone"> · </span>
            <span v-if="item.customer_phone">Tel: {{ item.customer_phone }}</span>
          </div>
        </template>

        <template #item.total="{ item }">
          <div class="font-weight-black">{{ money(item.total) }}</div>
          <div class="text-caption text-medium-emphasis">
            Pagado: {{ money(item.paid_total) }} · Vuelto: {{ money(item.change_total) }}
          </div>
        </template>

        <template #item.method="{ item }">
          <v-chip size="small" variant="tonal" :color="payColor(item.payments?.[0]?.method)">
            {{ methodLabel(item.payments?.[0]?.method) }}
          </v-chip>
          <div class="text-caption text-medium-emphasis" v-if="(item.payments || []).length > 1">
            +{{ item.payments.length - 1 }} pago(s)
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2">
            <v-btn size="small" variant="tonal" color="primary" @click.stop="goDetail(item.id)">
              <v-icon start>mdi-eye</v-icon>
              Ver
            </v-btn>

            <v-btn size="small" variant="tonal" @click.stop="copyText(String(item.id))" title="Copiar ID">
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>
          </div>
        </template>

        <template #bottom>
          <div class="d-flex align-center justify-space-between pa-3 flex-wrap ga-2">
            <div class="text-caption text-medium-emphasis">
              Página <b>{{ meta.page }}</b> de <b>{{ meta.pages }}</b> · Total <b>{{ meta.total }}</b>
            </div>

            <div class="d-flex align-center ga-2">
              <v-btn variant="text" :disabled="meta.page <= 1 || loading || statsLoading" @click="prevPage">
                <v-icon start>mdi-chevron-left</v-icon>
                Anterior
              </v-btn>

              <v-btn variant="text" :disabled="meta.page >= meta.pages || loading || statsLoading" @click="nextPage">
                Siguiente
                <v-icon end>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useAuthStore } from "../../../app/store/auth.store";

const router = useRouter();
const auth = useAuthStore();

// ===== Admin (UI) =====
function normalizeRole(s) { return String(s || "").trim().toLowerCase(); }
function getRoleNames() {
  const u = auth?.user || {};
  const out = [];
  const push = (r) => {
    if (!r) return;
    if (typeof r === "string") out.push(r);
    else if (typeof r?.name === "string") out.push(r.name);
    else if (typeof r?.role === "string") out.push(r.role);
    else if (typeof r?.role?.name === "string") out.push(r.role.name);
  };
  if (Array.isArray(u.roles)) u.roles.forEach(push);
  if (u.role) push(u.role);
  return out.map(normalizeRole).filter(Boolean);
}
const isAdmin = computed(() => {
  const u = auth?.user || {};
  if (u.is_admin === true || u.isAdmin === true || u.admin === true) return true;
  const roles = getRoleNames();
  return roles.some((r) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(r));
});
const userBranchId = computed(() => {
  const u = auth?.user || null;
  const id = Number(u?.branch_id || auth?.branchId || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
});

const selectedBranchId = ref(null);
const effectiveBranchId = computed(() => {
  if (isAdmin.value) {
    const v = Number(selectedBranchId.value || 0);
    return Number.isFinite(v) && v > 0 ? v : null;
  }
  return userBranchId.value;
});

// ===== Branches =====
const branches = ref([]);
const branchesLoading = ref(false);

function pickArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

const branchSelectItems = computed(() => {
  const arr = Array.isArray(branches.value) ? branches.value : [];
  return [
    { title: "Todas", value: null },
    ...arr
      .filter((b) => String(b?.is_active ?? 1) !== "0")
      .map((b) => ({ title: b.name || `Sucursal #${b.id}`, value: Number(b.id) })),
  ];
});

async function loadBranchesIfAdmin() {
  if (!isAdmin.value) return;
  branchesLoading.value = true;
  try {
    const { data } = await http.get("/branches");
    if (!data?.ok) throw new Error(data?.message || "Error listando sucursales");
    branches.value = pickArray(data) || [];
  } catch (e) {
    console.warn("No pude cargar /branches:", e?.message || e);
  } finally {
    branchesLoading.value = false;
  }
}

// ===== UI/data =====
const dense = ref(false);
const loading = ref(false);
const sales = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });

const status = ref("");
const from = ref("");
const to = ref("");
const fromMenu = ref(false);
const toMenu = ref(false);
const snack = ref({ show: false, text: "" });

// ===== filtros “no vacíos” =====
const customerValue = ref(null); // string (doc/phone/name)
const sellerId = ref(null);      // number
const productId = ref(null);     // string product_id

const payMethod = ref("");

// ===== autocomplete data =====
const customerItems = ref([]);
const customerLoading = ref(false);

const sellerItems = ref([]);
const sellerLoading = ref(false);

const productItems = ref([]);
const productLoading = ref(false);

// ===== stats =====
const statsLoading = ref(false);
const stats = ref({
  ready: false,
  sales_count: 0,
  total_sum: 0,
  paid_sum: 0,
  payments: { cash: 0, transfer: 0, debit: 0, credit: 0, qr: 0, other: 0, raw_by_method: {} },
});

const statusItems = [
  { title: "Todos", value: "" },
  { title: "Pagada", value: "PAID" },
  { title: "Borrador", value: "DRAFT" },
  { title: "Cancelada", value: "CANCELLED" },
  { title: "Reintegrada", value: "REFUNDED" },
];

const payMethodItems = [
  { title: "Todos", value: "" },
  { title: "Efectivo", value: "CASH" },
  { title: "Débito", value: "DEBIT" },
  { title: "Crédito", value: "CREDIT" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "QR", value: "QR" },
  { title: "Otro", value: "OTHER" },
];

const headers = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 190 },
  { title: "Cliente", key: "customer", sortable: false },
  { title: "Total", key: "total", sortable: false, width: 220 },
  { title: "Pago", key: "method", sortable: false, width: 190 },
  { title: "Estado", key: "status", sortable: false, width: 140 },
  { title: "Acciones", key: "actions", sortable: false, width: 190 },
];

// ===== Helpers =====
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) { return val ? new Date(val).toLocaleString("es-AR") : "—"; }
function normalizeDate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return new Date(v).toISOString().slice(0, 10);
}
function toStartOfDay(dateStr) { const d = normalizeDate(dateStr); return d ? `${d} 00:00:00` : ""; }
function toEndOfDay(dateStr) { const d = normalizeDate(dateStr); return d ? `${d} 23:59:59` : ""; }

function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "DEBIT") return "Débito";
  if (x === "CREDIT") return "Crédito";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "DEBIT") return "indigo";
  if (x === "CREDIT") return "blue";
  if (x === "TRANSFER") return "purple";
  if (x === "QR") return "orange";
  return "grey";
}
function statusLabel(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "Pagada";
  if (x === "DRAFT") return "Borrador";
  if (x === "CANCELLED") return "Cancelada";
  if (x === "REFUNDED") return "Reintegrada";
  return s || "—";
}
function statusColor(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "green";
  if (x === "CANCELLED") return "red";
  if (x === "REFUNDED") return "orange";
  if (x === "DRAFT") return "blue";
  return "grey";
}

function buildParams(page, limit) {
  const hasFrom = !!normalizeDate(from.value);
  const hasTo = !!normalizeDate(to.value);

  const params = {
    page,
    limit,
    status: status.value || undefined,

    // ✅ filtros reales:
    customer: customerValue.value || undefined,         // texto (doc/tel/nombre)
    seller_id: sellerId.value || undefined,            // id vendedor
    product: productId.value || undefined,             // product_id
    pay_method: payMethod.value || undefined,          // método
  };

  if (effectiveBranchId.value) params.branch_id = effectiveBranchId.value;
  if (hasFrom) params.from = toStartOfDay(from.value);
  if (hasTo) params.to = toEndOfDay(to.value);

  return params;
}

// ===== Fetch =====
async function fetchSales() {
  loading.value = true;
  try {
    const { data } = await http.get("/pos/sales", { params: buildParams(meta.value.page, meta.value.limit) });
    if (!data?.ok) throw new Error(data?.message || "Error listando ventas");
    sales.value = data.data || [];
    meta.value = data.meta || meta.value;
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "Error" };
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  statsLoading.value = true;
  try {
    const { data } = await http.get("/pos/sales/stats", { params: buildParams(1, 1) });
    if (!data?.ok) throw new Error(data?.message || "Error calculando stats");
    const d = data.data || {};
    stats.value = {
      ready: true,
      sales_count: Number(d.sales_count || 0),
      total_sum: Number(d.total_sum || 0),
      paid_sum: Number(d.paid_sum || 0),
      payments: d.payments || stats.value.payments,
    };
  } catch (e) {
    stats.value.ready = false;
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "Error stats" };
  } finally {
    statsLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchSales(), fetchStats()]);
}

function applyFilters() {
  meta.value.page = 1;
  refreshAll();
}

// ===== Autocomplete loaders =====
let tCust = null;
async function onCustomerSearch(q) {
  clearTimeout(tCust);
  tCust = setTimeout(async () => {
    customerLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/customers", { params: { q: q || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) } });
      if (data?.ok) customerItems.value = data.data || [];
    } finally {
      customerLoading.value = false;
    }
  }, 250);
}

let tSeller = null;
async function onSellerSearch(q) {
  clearTimeout(tSeller);
  tSeller = setTimeout(async () => {
    sellerLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/sellers", { params: { q: q || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) } });
      if (data?.ok) sellerItems.value = data.data || [];
    } finally {
      sellerLoading.value = false;
    }
  }, 250);
}

let tProd = null;
async function onProductSearch(q) {
  clearTimeout(tProd);
  tProd = setTimeout(async () => {
    productLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/products", { params: { q: q || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) } });
      if (data?.ok) productItems.value = data.data || [];
    } finally {
      productLoading.value = false;
    }
  }, 250);
}

// ===== Row click / navigation =====
function goDetail(id) { router.push({ name: "posSaleDetail", params: { id } }); }
function onRowClick(_, row) { const item = row?.item; if (item?.id) goDetail(item.id); }

// ===== Ranges =====
function todayISO() { return new Date().toISOString().slice(0, 10); }
function clearDates() { from.value = ""; to.value = ""; applyFilters(); }
function setToday() { const t = todayISO(); from.value = t; to.value = t; applyFilters(); }
function setThisWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  from.value = monday.toISOString().slice(0, 10);
  to.value = sunday.toISOString().slice(0, 10);
  applyFilters();
}
function setThisMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  from.value = first.toISOString().slice(0, 10);
  to.value = last.toISOString().slice(0, 10);
  applyFilters();
}

function resetFilters() {
  customerValue.value = null;
  sellerId.value = null;
  productId.value = null;
  payMethod.value = "";
  status.value = "";
  from.value = "";
  to.value = "";
  meta.value.page = 1;
  if (isAdmin.value) selectedBranchId.value = null;
  refreshAll();
}

// ===== Paging =====
function prevPage() { if (meta.value.page > 1) { meta.value.page--; refreshAll(); } }
function nextPage() { if (meta.value.page < meta.value.pages) { meta.value.page++; refreshAll(); } }
function toggleDense() { dense.value = !dense.value; }

// ===== Clipboard =====
async function copyText(txt) {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
    snack.value = { show: true, text: "Copiado" };
  } catch {
    snack.value = { show: true, text: "No se pudo copiar" };
  }
}

// ===== CSV =====
function exportCsv() {
  if (!sales.value.length) return;

  const rows = sales.value.map((s) => ({
    id: s.id,
    sold_at: dt(s.sold_at),
    customer_name: s.customer_name || "Consumidor Final",
    customer_doc: s.customer_doc || "",
    customer_phone: s.customer_phone || "",
    status: statusLabel(s.status),
    total: Number(s.total || 0),
    paid_total: Number(s.paid_total || 0),
    method: methodLabel(s.payments?.[0]?.method),
  }));

  const header = Object.keys(rows[0]).join(",");
  const body = rows
    .map((r) =>
      Object.values(r)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const csv = header + "\n" + body;

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

onMounted(async () => {
  if (auth?.isAuthed && !auth.user && typeof auth.fetchMe === "function") {
    try { await auth.fetchMe(); } catch {}
  }
  await loadBranchesIfAdmin();

  // precarga mínima para que no estén “vacíos”
  onCustomerSearch("");
  onSellerSearch("");
  onProductSearch("");

  refreshAll();
});

// ===== KPI component =====
const KpiCard = {
  props: { title: String, value: [String, Number], icon: String, loading: Boolean, subtitle: String },
  template: `
    <v-card class="rounded-xl" elevation="1">
      <v-card-text class="d-flex align-center justify-space-between">
        <div>
          <div class="text-caption text-medium-emphasis">{{ title }}</div>
          <div class="text-h6 font-weight-black">
            <span v-if="!loading">{{ value }}</span>
            <v-skeleton-loader v-else type="text" width="160" />
          </div>
          <div v-if="subtitle" class="text-caption text-medium-emphasis mt-1">{{ subtitle }}</div>
        </div>
        <v-avatar color="primary" variant="tonal" size="44">
          <v-icon>{{ icon }}</v-icon>
        </v-avatar>
      </v-card-text>
    </v-card>
  `,
};
</script>
