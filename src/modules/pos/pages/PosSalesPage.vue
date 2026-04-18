<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/pages/PosSalesPage.vue -->

<template>
  <v-container fluid class="pa-4 pos-sales-page">
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

    <!-- ✅ STATS -->
    <v-row dense class="mb-4">
      <v-col cols="12" md="3">
        <KpiCard
          title="Ventas"
          :value="stats.ready ? stats.sales_count : '—'"
          icon="mdi-receipt-text-outline"
          :loading="statsLoading"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          title="Bruto vendido"
          :value="stats.ready ? money(stats.gross_total_sum) : '—'"
          icon="mdi-cash-plus"
          :loading="statsLoading"
          subtitle="Antes de devoluciones"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          title="Devoluciones"
          :value="stats.ready ? money(stats.refunds_sum) : '—'"
          icon="mdi-cash-refund"
          :loading="statsLoading"
          subtitle="Total reintegrado"
        />
      </v-col>

      <v-col cols="12" md="3">
        <KpiCard
          title="Neto vendido"
          :value="stats.ready ? money(stats.total_sum) : '—'"
          icon="mdi-cash-check"
          :loading="statsLoading"
          subtitle="Bruto - devoluciones"
        />
      </v-col>

      <v-col cols="12">
        <v-card class="rounded-xl" elevation="1">
          <v-card-text class="d-flex align-center justify-space-between flex-wrap ga-2">
            <div class="text-subtitle-2 font-weight-bold">Pagos por método (neto)</div>

            <div class="d-flex ga-2 flex-wrap">
              <v-chip size="small" variant="tonal" class="pm-chip pm-cash">
                <span class="pm-dot" aria-hidden="true" />
                Efectivo: {{ stats.ready ? money(stats.net_by_method.cash) : "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" class="pm-chip pm-transfer">
                <span class="pm-dot" aria-hidden="true" />
                Transferencia: {{ stats.ready ? money(stats.net_by_method.transfer) : "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" class="pm-chip pm-card">
                <span class="pm-dot" aria-hidden="true" />
                Tarjeta: {{ stats.ready ? money(stats.net_by_method.card) : "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" class="pm-chip pm-mp">
                <span class="pm-dot" aria-hidden="true" />
                Mercado Pago: {{ stats.ready ? money(stats.net_by_method.mercadopago) : "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" class="pm-chip pm-credit-sjt">
                <span class="pm-dot" aria-hidden="true" />
                San Juan Crédito: {{ stats.ready ? money(stats.net_by_method.credit_sjt) : "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" class="pm-chip pm-other">
                <span class="pm-dot" aria-hidden="true" />
                Otro: {{ stats.ready ? money(stats.net_by_method.other) : "—" }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- FILTROS -->
    <v-expansion-panels class="mb-4" variant="accordion">
      <v-expansion-panel elevation="1" class="rounded-xl">
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-2">
            <v-icon>mdi-filter</v-icon>
            <b>Filtros</b>

            <v-chip size="x-small" class="ml-2" variant="tonal">
              Página {{ meta.page }} · {{ meta.limit }}/pág
            </v-chip>

            <v-chip size="x-small" class="ml-2" variant="tonal" color="primary">
              Estado: {{ status ? statusLabel(status) : "Todos" }}
            </v-chip>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-row dense class="align-center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="q"
                label="Buscar (cliente / nro / id)"
                placeholder="Ej: Consumidor · 85 · 0001"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                @keyup.enter="applyFiltersImmediate"
                @click:clear="applyFiltersImmediate"
              />
              <div class="text-caption text-medium-emphasis mt-1">
                Este campo usa <b>q</b> del backend.
              </div>
            </v-col>

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
                :no-filter="true"
                @update:search="onSellerSearch"
                @update:model-value="applyFiltersImmediate"
                @click:clear="sellerId = null; applyFiltersImmediate()"
              />
            </v-col>

            <v-col cols="12" sm="6" md="3">
              <v-autocomplete
                v-model="productPick"
                :items="productItems"
                :loading="productLoading"
                label="Producto (vendido)"
                placeholder="Buscar producto en ventas"
                prepend-inner-icon="mdi-package-variant-closed"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                return-object
                item-title="title"
                item-value="value"
                :no-filter="true"
                @update:search="onProductSearch"
                @update:model-value="applyFiltersImmediate"
                @click:clear="productPick = null; applyFiltersImmediate()"
              />
            </v-col>

            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="payMethod"
                :items="payMethodItems"
                label="Tipo de pago"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                @update:model-value="applyFiltersImmediate"
                @click:clear="payMethod = ''; applyFiltersImmediate()"
              />
            </v-col>

            <v-col cols="12" sm="6" md="2">
              <v-select
                v-model="status"
                :items="statusItems"
                label="Estado"
                variant="outlined"
                density="comfortable"
                hide-details
                clearable
                @update:model-value="applyFiltersImmediate"
                @click:clear="status = ''; applyFiltersImmediate()"
              />
            </v-col>

            <v-col cols="12" md="3" v-if="isAdmin">
              <v-select
                v-model="selectedBranchId"
                :items="branchSelectItems"
                label="Sucursal"
                variant="outlined"
                density="comfortable"
                hide-details
                :loading="branchesLoading"
                @update:model-value="onBranchChanged"
              />
            </v-col>

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
                <v-date-picker v-model="from" show-adjacent-months @update:model-value="fromMenu = false; applyFiltersImmediate()" />
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
                <v-date-picker v-model="to" show-adjacent-months @update:model-value="toMenu = false; applyFiltersImmediate()" />
              </v-menu>
            </v-col>

            <v-col cols="12" md="3">
              <div class="d-flex ga-2 flex-wrap">
                <v-btn size="small" variant="tonal" @click="setToday">Hoy</v-btn>
                <v-btn size="small" variant="tonal" @click="setThisWeek">Esta semana</v-btn>
                <v-btn size="small" variant="tonal" @click="setThisMonth">Este mes</v-btn>
                <v-btn size="small" variant="text" @click="clearDates">Limpiar</v-btn>
              </div>
            </v-col>

            <v-col cols="12" md="2">
              <v-select
                v-model="meta.limit"
                :items="[10, 20, 50, 100]"
                label="Por página"
                density="compact"
                variant="outlined"
                hide-details
                @update:model-value="meta.page = 1; refreshAll()"
              />
            </v-col>

            <v-col cols="12" md="1">
              <v-btn block color="primary" @click="applyFiltersImmediate" :loading="loading || statsLoading">
                <v-icon>mdi-filter</v-icon>
              </v-btn>
            </v-col>

            <v-col cols="12" class="pt-0">
              <v-chip size="small" variant="tonal" color="primary">
                Sucursal: {{ effectiveBranchId ?? "— (todas)" }}
              </v-chip>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- TABLA -->
    <v-card class="rounded-xl" elevation="1">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="d-flex align-center ga-2">
          <div class="text-subtitle-1 font-weight-bold">Ventas</div>
          <v-chip size="small" variant="tonal">Mostrando {{ sales.length }} de {{ meta.total }}</v-chip>
        </div>

        <div class="d-flex ga-2 align-center">
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
        :items-per-page="-1"
        hide-default-footer
        @click:row="onRowClick"
      >
        <template #item.sold_at="{ item }">
          <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
          <div class="text-caption text-medium-emphasis">
            ID: {{ item.id }}
            <span v-if="item.sale_number">· N°: {{ item.sale_number }}</span>
          </div>
        </template>

        <template #item.seller="{ item }">
          <div class="font-weight-bold">
            {{ item.user?.username || fullUserName(item.user) || `Usuario #${item.user_id}` }}
          </div>
          <div class="text-caption text-medium-emphasis">
            {{ item.branch?.name || `Sucursal #${item.branch_id}` }}
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

        <template #item.product="{ item }">
          <div class="font-weight-bold">{{ primaryProductName(item) }}</div>
          <div class="text-caption text-medium-emphasis" v-if="productExtraCount(item) > 0">
            +{{ productExtraCount(item) }} producto(s) más
          </div>
          <div class="text-caption text-medium-emphasis" v-else>
            {{ primaryProductSku(item) }}
          </div>
        </template>

        <template #item.total="{ item }">
          <div class="font-weight-black">{{ money(item.total) }}</div>
          <div class="text-caption text-medium-emphasis">
            Pagado: {{ money(item.paid_total) }} · Vuelto: {{ money(item.change_total) }}
          </div>
        </template>

        <template #item.method="{ item }">
          <div class="d-flex flex-wrap ga-1">
            <v-chip size="small" variant="tonal" :color="payColor(primaryPayment(item)?.method)">
              {{ methodLabel(primaryPayment(item)?.method) }}
            </v-chip>

            <v-chip
              v-if="paymentInstallments(primaryPayment(item))"
              size="small"
              variant="tonal"
              color="indigo"
            >
              {{ paymentInstallments(primaryPayment(item)) }} cuota<span v-if="paymentInstallments(primaryPayment(item)) > 1">s</span>
            </v-chip>

            <v-chip
              v-if="paymentPerInstallment(primaryPayment(item))"
              size="small"
              variant="tonal"
              color="cyan"
            >
              Cuota: {{ money(paymentPerInstallment(primaryPayment(item))) }}
            </v-chip>

            <v-chip
              v-if="paymentCardKindLabel(primaryPayment(item))"
              size="small"
              variant="tonal"
              color="blue-grey"
            >
              {{ paymentCardKindLabel(primaryPayment(item)) }}
            </v-chip>

            <v-chip
              v-if="paymentPriceBasisLabel(primaryPayment(item))"
              size="small"
              variant="tonal"
              color="deep-purple"
            >
              {{ paymentPriceBasisLabel(primaryPayment(item)) }}
            </v-chip>

            <v-chip
              v-if="paymentReference(primaryPayment(item))"
              size="small"
              variant="tonal"
              color="grey"
            >
              Ref: {{ paymentReference(primaryPayment(item)) }}
            </v-chip>
          </div>

          <div class="text-caption text-medium-emphasis mt-1">
            <span v-if="paymentListTotal(primaryPayment(item))">
              Total base: {{ money(paymentListTotal(primaryPayment(item))) }}
            </span>
            <span v-if="paymentListTotal(primaryPayment(item)) && (item.payments || []).length > 1"> · </span>
            <span v-if="(item.payments || []).length > 1">
              +{{ item.payments.length - 1 }} pago(s)
            </span>
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2 align-center flex-wrap">
            <v-btn size="small" variant="tonal" color="primary" @click.stop="goDetail(item.id)" title="Ver detalle">
              <v-icon start>mdi-eye</v-icon>
              Ver
            </v-btn>

            <v-menu v-model="menuOpen[item.id]" :close-on-content-click="true">
              <template #activator="{ props }">
                <v-btn v-bind="props" size="small" variant="tonal">
                  <v-icon start>mdi-dots-vertical</v-icon>
                  Acciones
                </v-btn>
              </template>

              <v-list density="comfortable">
                <v-list-item @click.stop="actView(item.id)">
                  <template #prepend><v-icon>mdi-eye</v-icon></template>
                  <v-list-item-title>Ver detalle</v-list-item-title>
                </v-list-item>

                <v-divider />

                <v-list-item @click.stop="actRefund(item.id)">
                  <template #prepend><v-icon color="orange">mdi-cash-refund</v-icon></template>
                  <v-list-item-title>Registrar devolución</v-list-item-title>
                </v-list-item>

                <v-list-item @click.stop="actExchange(item.id)">
                  <template #prepend><v-icon color="cyan">mdi-swap-horizontal</v-icon></template>
                  <v-list-item-title>Registrar cambio</v-list-item-title>
                </v-list-item>

                <v-divider />

                <v-list-item @click.stop="copyText(String(item.id))">
                  <template #prepend><v-icon>mdi-content-copy</v-icon></template>
                  <v-list-item-title>Copiar ID</v-list-item-title>
                </v-list-item>

                <v-divider v-if="isAdmin" />

                <v-list-item v-if="isAdmin" @click.stop="openDelete(item)">
                  <template #prepend><v-icon color="red">mdi-trash-can-outline</v-icon></template>
                  <v-list-item-title>Eliminar venta</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
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

    <!-- ✅ DIALOG ELIMINAR -->
    <v-dialog v-model="deleteDialog.show" max-width="520">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon color="red">mdi-alert</v-icon>
          <div class="font-weight-black">Eliminar venta</div>
        </v-card-title>
        <v-card-text>
          ¿Seguro que querés eliminar la venta <b>#{{ getSaleId(deleteDialog.sale) }}</b>?
          <div class="text-caption text-medium-emphasis mt-2">
            Esto puede fallar si hay FK/relaciones (items, pagos, devoluciones).
          </div>
        </v-card-text>
        <v-card-actions class="justify-end ga-2">
          <v-btn variant="text" :disabled="!!deletingId" @click="deleteDialog = { show: false, sale: null }">Cancelar</v-btn>
          <v-btn color="red" variant="flat" :loading="!!deletingId" @click="deleteSaleConfirmed">
            <v-icon start>mdi-trash-can-outline</v-icon>
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useAuthStore } from "../../../app/store/auth.store";

const router = useRouter();
const auth = useAuthStore();

// =====================
// debounce
// =====================
function debounce(fn, wait = 250) {
  let t = null;
  const debounced = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(t);
  return debounced;
}

// =====================
// Helpers ID venta
// =====================
function getSaleId(saleLike) {
  const candidates = [
    saleLike?.sale_id,
    saleLike?.saleId,
    saleLike?.id,
    saleLike?.sale?.id,
    saleLike?.sale?.sale_id,
    saleLike?.sale?.saleId,
  ];
  for (const c of candidates) {
    const n = Number(c || 0);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

// ===== Admin (UI) =====
const isAdmin = computed(() => {
  const u = auth?.user || {};
  if (u.is_admin === true || u.isAdmin === true || u.admin === true) return true;

  const roleId = Number(u.role_id || u.roleId || u.perfil_id || 0);
  if (Number.isFinite(roleId) && roleId === 1) return true;

  const raw = [];
  const push = (r) => {
    if (!r) return;
    if (typeof r === "string") raw.push(r);
    else if (typeof r?.name === "string") raw.push(r.name);
    else if (typeof r?.role === "string") raw.push(r.role);
    else if (typeof r?.role?.name === "string") raw.push(r.role.name);
  };
  if (Array.isArray(u.roles)) u.roles.forEach(push);
  if (u.role) push(u.role);
  if (u.perfil) push(u.perfil);

  const roles = raw.map((s) => String(s || "").trim().toLowerCase()).filter(Boolean);
  return roles.some((r) =>
    ["admin", "administrador", "administrator", "super_admin", "superadmin", "root", "owner", "dueño", "dueno"].includes(r),
  );
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

const status = ref("PAID");
const from = ref("");
const to = ref("");
const fromMenu = ref(false);
const toMenu = ref(false);
const snack = ref({ show: false, text: "" });

const q = ref("");
const sellerId = ref(null);
const productPick = ref(null);
const payMethod = ref("");
const menuOpen = ref({});

// ===== autocomplete data =====
const sellerItems = ref([]);
const sellerLoading = ref(false);
const productItems = ref([]);
const productLoading = ref(false);
const cacheSellers = ref([]);
const cacheProducts = ref([]);

// ===== stats =====
const statsLoading = ref(false);
const stats = ref({
  ready: false,
  sales_count: 0,
  total_sum: 0,
  paid_sum: 0,
  refunds_sum: 0,
  gross_total_sum: 0,
  gross_paid_sum: 0,
  net_by_method: {
    cash: 0,
    transfer: 0,
    card: 0,
    mercadopago: 0,
    credit_sjt: 0,
    other: 0,
    raw_by_method: {},
  },
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
  { title: "Tarjeta", value: "CARD" },
  { title: "Transferencia", value: "TRANSFER" },
  { title: "Mercado Pago", value: "MERCADOPAGO" },
  { title: "San Juan Crédito", value: "CREDIT_SJT" },
  { title: "Otro", value: "OTHER" },
];

const headers = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 190 },
  { title: "Vendedor / Sucursal", key: "seller", sortable: false, width: 220 },
  { title: "Cliente", key: "customer", sortable: false, width: 260 },
  { title: "Producto", key: "product", sortable: false, width: 280 },
  { title: "Total", key: "total", sortable: false, width: 220 },
  { title: "Pago", key: "method", sortable: false, width: 360 },
  { title: "Estado", key: "status", sortable: false, width: 140 },
  { title: "", key: "actions", sortable: false, width: 280 },
];

// ===== Helpers =====
function toast(msg) {
  snack.value = { show: true, text: String(msg || "Error") };
}
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  return val ? new Date(val).toLocaleString("es-AR") : "—";
}
function fullUserName(u) {
  const fn = String(u?.first_name || "").trim();
  const ln = String(u?.last_name || "").trim();
  const name = `${fn} ${ln}`.trim();
  return name || "";
}

function formatLocalDate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function normalizeDate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return formatLocalDate(v);
}
function toStartOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  return d ? `${d} 00:00:00` : "";
}
function toEndOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  return d ? `${d} 23:59:59` : "";
}

function safeJsonParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  const s = String(v || "").trim();
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function normStr(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function detectProviderCode(payment) {
  const p = payment || {};

  const ref = String(p.reference || p.ref || "").trim().toUpperCase();
  if (ref === "SJCREDIT" || ref === "SJ_CREDIT" || ref === "SANJUANCREDITO" || ref === "SANJUAN_CREDITO") {
    return "credit_sjt";
  }

  const direct = p.provider_code || p.providerCode || p.provider || p.gateway || p.brand || "";
  const d1 = normStr(direct);
  if (d1) return d1;

  const noteObj = safeJsonParse(p.note);
  const c2 = normStr(noteObj?.provider_code || noteObj?.providerCode || noteObj?.provider || noteObj?.code);
  if (c2) return c2;

  const noteTxt = String(p.note || "").toLowerCase();
  if (noteTxt.includes("credit_sjt") || noteTxt.includes("creditsjt") || noteTxt.includes("sjcredit")) return "credit_sjt";

  return "";
}

function resolvePaymentMethod(payment) {
  const p = payment || {};

  const prov = detectProviderCode(p);
  if (prov === "credit_sjt") return "CREDIT_SJT";

  const up = String(p.method || "").trim().toUpperCase();

  if (up === "CASH" || up === "CARD" || up === "TRANSFER" || up === "MERCADOPAGO" || up === "QR" || up === "OTHER") {
    return up === "QR" ? "MERCADOPAGO" : up;
  }

  if (up === "CREDIT_SJT") return "CREDIT_SJT";

  return up || "OTHER";
}

function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "CARD") return "Tarjeta";
  if (x === "MERCADOPAGO" || x === "QR") return "Mercado Pago";
  if (x === "CREDIT_SJT" || x === "CREDIT_SJ" || x === "SJCREDIT") return "San Juan Crédito";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "TRANSFER") return "purple";
  if (x === "CARD") return "blue";
  if (x === "MERCADOPAGO" || x === "QR") return "orange";
  if (x === "CREDIT_SJT" || x === "CREDIT_SJ" || x === "SJCREDIT") return "teal";
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

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseProductIdFromText(text) {
  const s = String(text || "");
  const m1 = s.match(/SKU\s*[:#]?\s*([0-9]{2,})/i);
  if (m1?.[1]) {
    const n = Number(m1[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const m2 = s.match(/ID\s*[:#]?\s*([0-9]{1,})/i);
  if (m2?.[1]) {
    const n = Number(m2[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

const productId = computed(() => {
  const v = productPick.value;
  if (!v) return null;

  const direct = Number(v?.value ?? v?.id ?? 0);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const raw = String(v?.title ?? v?.value ?? v ?? "");
  return parseProductIdFromText(raw);
});

function pickSaleItems(saleLike) {
  const candidates = [saleLike?.sale_items, saleLike?.saleItems, saleLike?.items, saleLike?.SaleItems];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}
function primaryProduct(item) {
  const items = pickSaleItems(item);
  if (!items.length) return null;
  return items[0] || null;
}
function primaryProductName(item) {
  const it = primaryProduct(item);
  return it?.product_name_snapshot || it?.product?.name || (it?.product_id ? `Producto #${it.product_id}` : "(sin items)");
}
function primaryProductSku(item) {
  const it = primaryProduct(item);
  const sku = it?.product_sku_snapshot || it?.product?.sku || "";
  return sku ? `SKU: ${sku}` : "";
}
function productExtraCount(item) {
  const items = pickSaleItems(item);
  return Math.max(0, (items?.length || 0) - 1);
}

function buildParams(page, limit) {
  const hasFrom = !!normalizeDate(from.value);
  const hasTo = !!normalizeDate(to.value);

  const s = numOrNull(sellerId.value);
  const p = numOrNull(productId.value);

  const pmRaw = String(payMethod.value || "").trim();
  const pmUp = pmRaw ? pmRaw.toUpperCase() : "";

  const st = String(status.value || "").trim();
  const qq = String(q.value || "").trim();

  let pmSend = pmUp;
  if (pmSend === "QR") pmSend = "MERCADOPAGO";
  if (pmSend === "CREDIT_SJT") pmSend = "credit_sjt";

  const params = {
    page,
    limit,
    q: qq || undefined,
    status: st || undefined,
    seller_id: s ?? undefined,
    product_id: p ?? undefined,
    pay_method: pmSend || undefined,
  };

  if (effectiveBranchId.value) params.branch_id = effectiveBranchId.value;
  if (hasFrom) params.from = toStartOfDay(from.value);
  if (hasTo) params.to = toEndOfDay(to.value);

  return params;
}

function primaryPayment(saleLike) {
  const pays = Array.isArray(saleLike?.payments) ? saleLike.payments : [];
  if (!pays.length) return null;
  const sorted = [...pays].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  const p = sorted[0] || pays[0] || null;
  if (!p) return null;

  const resolved = resolvePaymentMethod(p);
  return { ...p, method: resolved };
}

function paymentMeta(payment) {
  const p = payment || {};
  const noteObj = safeJsonParse(p.note) || {};
  return noteObj && typeof noteObj === "object" ? noteObj : {};
}

function paymentInstallments(payment) {
  const p = payment || {};
  const meta = paymentMeta(p);
  const n = Number(p.installments ?? meta.installments ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function paymentPerInstallment(payment) {
  const meta = paymentMeta(payment);
  const n = Number(meta.per_installment_list ?? meta.perInstallmentList ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function paymentListTotal(payment) {
  const meta = paymentMeta(payment);
  const n = Number(meta.list_total ?? meta.listTotal ?? 0);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function paymentReference(payment) {
  const ref = String(payment?.reference || "").trim();
  return ref || "";
}

function paymentCardKindLabel(payment) {
  const meta = paymentMeta(payment);
  const x = String(meta.card_kind || meta.cardKind || "").trim().toUpperCase();
  if (x === "CREDIT") return "Crédito";
  if (x === "DEBIT" || x === "DEBITO" || x === "DÉBITO") return "Débito";
  return "";
}

function paymentPriceBasisLabel(payment) {
  const meta = paymentMeta(payment);
  const x = String(meta.price_basis || meta.priceBasis || "").trim().toUpperCase();
  if (x === "LIST") return "Precio lista";
  if (x === "DISCOUNT") return "Descuento";
  if (x === "RESELLER") return "Revendedor";
  return "";
}

function normalizeOptions(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (typeof x === "string") {
        const parsed = parseProductIdFromText(x);
        return { title: x, value: parsed ?? x, _raw: x };
      }
      const id = x?.value ?? x?.id ?? x?.user_id ?? x?.product_id ?? x?.customer_id ?? x?.seller_id ?? null;
      const title = x?.title ?? x?.name ?? x?.full_name ?? x?.label ?? x?.text ?? (id != null ? String(id) : "");
      const value = x?.value ?? (id != null ? Number(id) : title) ?? title;
      return { title: String(title || ""), value, _raw: x };
    })
    .filter((i) => i.title);
}

function localFilter(items, qx) {
  const term = String(qx || "").trim().toLowerCase();
  if (!term) return items.slice(0, 25);
  return items.filter((i) => String(i.title || "").toLowerCase().includes(term)).slice(0, 25);
}

// ===== Fetch =====
async function fetchSales() {
  loading.value = true;
  try {
    const { data } = await http.get("/pos/sales", { params: buildParams(meta.value.page, meta.value.limit) });
    if (!data?.ok) throw new Error(data?.message || "Error listando ventas");
    sales.value = Array.isArray(data.data) ? data.data : [];
    meta.value = data.meta || meta.value;

    const alive = new Set(sales.value.map((x) => Number(x?.id)).filter((x) => Number.isFinite(x)));
    const next = { ...(menuOpen.value || {}) };
    for (const k of Object.keys(next)) {
      if (!alive.has(Number(k))) delete next[k];
    }
    menuOpen.value = next;
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error");
  } finally {
    loading.value = false;
  }
}

function normKey(k) {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
function sumKeys(obj, keys) {
  const o = obj || {};
  const map = new Map();
  for (const [k, v] of Object.entries(o)) map.set(normKey(k), Number(v || 0));
  const seen = new Set();
  let total = 0;
  for (const kk of keys) {
    const nk = normKey(kk);
    if (seen.has(nk)) continue;
    seen.add(nk);
    total += Number(map.get(nk) || 0);
  }
  return Number.isFinite(total) ? total : 0;
}
function hasOwnNumericValues(obj) {
  if (!obj || typeof obj !== "object") return false;
  return Object.entries(obj).some(([k, v]) => k !== "raw_by_method" && Number.isFinite(Number(v)));
}

async function fetchStats() {
  statsLoading.value = true;
  try {
    const base = buildParams(1, 1);
    delete base.page;
    delete base.limit;

    const { data } = await http.get("/pos/sales/stats", { params: base });
    if (!data?.ok) throw new Error(data?.message || "Error calculando stats");

    const d = data.data || {};
    const nbm = d.net_by_method || {};
    const raw = nbm.raw_by_method || d.raw_by_method || {};

    const source = hasOwnNumericValues(nbm) ? nbm : raw;

    const toNum = (v) => {
      const n = Number(v || 0);
      return Number.isFinite(n) ? n : 0;
    };

    const cash = sumKeys(source, ["cash", "CASH"]);
    const transfer = sumKeys(source, ["transfer", "TRANSFER"]);
    const card = sumKeys(source, ["card", "CARD"]);

    const mercadopago = sumKeys(source, [
      "mercadopago",
      "MERCADOPAGO",
      "mercado_pago",
      "mercado pago",
      "mp",
      "MP",
      "qr",
      "QR",
    ]);

    const credit_sjt = sumKeys(source, [
      "credit_sjt",
      "CREDIT_SJT",
      "creditsjt",
      "sjcredit",
      "sj_credit",
      "sjuancredito",
      "sanjuancredito",
      "SAN_JUAN_CREDITO",
    ]);

    const accounted = cash + transfer + card + mercadopago + credit_sjt;
    const totalBySource = Object.entries(source || {}).reduce((acc, [k, v]) => {
      if (k === "raw_by_method") return acc;
      return acc + toNum(v);
    }, 0);
    const other = Math.max(0, totalBySource - accounted);

    stats.value = {
      ready: true,
      sales_count: toNum(d.sales_count),
      total_sum: toNum(d.total_sum),
      paid_sum: toNum(d.paid_sum),
      refunds_sum: toNum(d.refunds_sum),
      gross_total_sum: toNum(d.gross_total_sum),
      gross_paid_sum: toNum(d.gross_paid_sum),
      net_by_method: {
        cash,
        transfer,
        card,
        mercadopago,
        credit_sjt,
        other,
        raw_by_method: raw || {},
      },
    };
  } catch (e) {
    stats.value.ready = false;
    toast(e?.response?.data?.message || e?.message || "Error stats");
  } finally {
    statsLoading.value = false;
  }
}

async function refreshAll() {
  await Promise.all([fetchSales(), fetchStats()]);
}

// ✅ apply filters
const applyFiltersDebounced = debounce(() => {
  meta.value.page = 1;
  refreshAll();
}, 180);

function applyFilters() {
  applyFiltersDebounced();
}

function applyFiltersImmediate() {
  applyFiltersDebounced.cancel?.();
  meta.value.page = 1;
  refreshAll();
}

onBeforeUnmount(() => {
  applyFiltersDebounced.cancel?.();
});

// ===== Autocomplete loaders =====
let tSeller = null;
async function onSellerSearch(qx) {
  clearTimeout(tSeller);
  tSeller = setTimeout(async () => {
    sellerLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/sellers", {
        params: { q: qx || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) },
      });
      if (data?.ok) {
        const items = normalizeOptions(data.data || []);
        sellerItems.value = items;
        cacheSellers.value = items;
      } else {
        sellerItems.value = localFilter(cacheSellers.value, qx);
      }
    } catch {
      sellerItems.value = localFilter(cacheSellers.value, qx);
    } finally {
      sellerLoading.value = false;
    }
  }, 250);
}

let tProd = null;
async function onProductSearch(qx) {
  clearTimeout(tProd);
  tProd = setTimeout(async () => {
    productLoading.value = true;
    try {
      const { data } = await http.get("/pos/sales/options/products", {
        params: { q: qx || "", limit: 25, ...(effectiveBranchId.value ? { branch_id: effectiveBranchId.value } : {}) },
      });
      if (data?.ok) {
        const items = normalizeOptions(data.data || []);
        productItems.value = items;
        cacheProducts.value = items;
      } else {
        productItems.value = localFilter(cacheProducts.value, qx);
      }
    } catch {
      productItems.value = localFilter(cacheProducts.value, qx);
    } finally {
      productLoading.value = false;
    }
  }, 250);
}

// ===== Branch change =====
function onBranchChanged() {
  sellerId.value = null;
  productPick.value = null;
  onSellerSearch("");
  onProductSearch("");
  applyFiltersImmediate();
}

// ===== Row click / navigation =====
function goDetail(id, tab = "") {
  const saleId = Number(id || 0);
  if (!Number.isFinite(saleId) || saleId <= 0) return toast("ID inválido");

  router.push({
    name: "posSaleDetail",
    params: { id: saleId },
    query: tab ? { tab } : {},
  });
}

function onRowClick(_, row) {
  const item = row?.item;
  if (!item) return;
  goDetail(item.id);
}

function closeMenu(id) {
  const key = String(id);
  menuOpen.value = { ...(menuOpen.value || {}), [key]: false };
}
function actView(id) {
  closeMenu(id);
  goDetail(id);
}
function actRefund(id) {
  closeMenu(id);
  goDetail(id, "refunds");
}
function actExchange(id) {
  closeMenu(id);
  goDetail(id, "exchanges");
}

// ===== Ranges =====
function todayISO() {
  return formatLocalDate(new Date());
}
function clearDates() {
  from.value = "";
  to.value = "";
  applyFiltersImmediate();
}
function setToday() {
  const t = todayISO();
  from.value = t;
  to.value = t;
  applyFiltersImmediate();
}
function setThisWeek() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  from.value = formatLocalDate(monday);
  to.value = formatLocalDate(sunday);
  applyFiltersImmediate();
}
function setThisMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  from.value = formatLocalDate(first);
  to.value = formatLocalDate(last);
  applyFiltersImmediate();
}

function resetFilters() {
  q.value = "";
  sellerId.value = null;
  productPick.value = null;
  payMethod.value = "";
  status.value = "PAID";
  from.value = "";
  to.value = "";
  meta.value.page = 1;
  if (isAdmin.value) selectedBranchId.value = null;
  refreshAll();
}

// ===== Paging =====
function prevPage() {
  if (meta.value.page > 1) {
    meta.value.page--;
    refreshAll();
  }
}
function nextPage() {
  if (meta.value.page < meta.value.pages) {
    meta.value.page++;
    refreshAll();
  }
}
function toggleDense() {
  dense.value = !dense.value;
}

// ===== Clipboard =====
async function copyText(txt) {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
    toast("Copiado");
  } catch {
    toast("No se pudo copiar");
  }
}

// ===== CSV =====
function exportCsv() {
  if (!sales.value.length) return;

  const rows = sales.value.map((s) => {
    const p = primaryPayment(s);
    return {
      id: s.id,
      sold_at: dt(s.sold_at),
      branch: s.branch?.name || s.branch_id,
      seller: s.user?.username || fullUserName(s.user) || s.user_id,
      customer_name: s.customer_name || "Consumidor Final",
      customer_doc: s.customer_doc || "",
      customer_phone: s.customer_phone || "",
      product: primaryProductName(s),
      status: statusLabel(s.status),
      total: Number(s.total || 0),
      paid_total: Number(s.paid_total || 0),
      method: methodLabel(p?.method),
      installments: paymentInstallments(p) || "",
      per_installment: paymentPerInstallment(p) || "",
      card_kind: paymentCardKindLabel(p) || "",
      price_basis: paymentPriceBasisLabel(p) || "",
      reference: paymentReference(p) || "",
    };
  });

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

// ===== ELIMINAR =====
const deletingId = ref(null);
const deleteDialog = ref({ show: false, sale: null });

function openDelete(item) {
  if (!isAdmin.value) return;
  deleteDialog.value = { show: true, sale: item };
}

async function deleteSaleConfirmed() {
  const id = getSaleId(deleteDialog.value.sale);
  if (!id) return toast("ID de venta inválido");

  deletingId.value = id;
  try {
    const { data } = await http.delete(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo eliminar");
    toast("Venta eliminada");
    deleteDialog.value = { show: false, sale: null };
    await refreshAll();
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error eliminando");
  } finally {
    deletingId.value = null;
  }
}

onMounted(async () => {
  if (auth?.isAuthed && !auth.user && typeof auth.fetchMe === "function") {
    try {
      await auth.fetchMe();
    } catch {}
  }
  await loadBranchesIfAdmin();
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

<style scoped>
.pos-sales-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.pm-chip {
  font-weight: 900;
  letter-spacing: 0.2px;
  border-radius: 999px !important;
  padding-inline: 10px !important;
  border: 1px solid color-mix(in srgb, rgb(var(--v-theme-on-surface)) 16%, transparent) !important;
  box-shadow:
    0 10px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.pm-dot {
  width: 10px;
  height: 10px;
  border-radius: 99px;
  display: inline-block;
  margin-right: 8px;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.06),
    0 6px 14px rgba(0, 0, 0, 0.35);
}

.pm-cash :deep(.v-chip__content) { color: rgb(var(--v-theme-success)) !important; }
.pm-transfer :deep(.v-chip__content) { color: rgb(var(--v-theme-secondary)) !important; }
.pm-card :deep(.v-chip__content) { color: rgb(var(--v-theme-info)) !important; }
.pm-mp :deep(.v-chip__content) { color: rgb(var(--v-theme-warning)) !important; }
.pm-credit-sjt :deep(.v-chip__content) { color: rgb(var(--v-theme-teal, 0 150 136)) !important; }
.pm-other :deep(.v-chip__content) { color: rgb(var(--v-theme-on-surface-variant)) !important; }

.pm-cash .pm-dot { background: rgb(var(--v-theme-success)); }
.pm-transfer .pm-dot { background: rgb(var(--v-theme-secondary)); }
.pm-card .pm-dot { background: rgb(var(--v-theme-info)); }
.pm-mp .pm-dot { background: rgb(var(--v-theme-warning)); }
.pm-credit-sjt .pm-dot { background: rgb(var(--v-theme-teal, 0 150 136)); }
.pm-other .pm-dot { background: rgb(var(--v-theme-on-surface-variant)); }
</style>