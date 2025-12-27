<!-- src/modules/pos/pages/PosSalesPage.vue -->
<template>
  <v-container fluid class="pa-4 bg-grey-lighten-4" style="min-height:100vh;">
    <!-- HEADER -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
      <div>
        <div class="text-h5 font-weight-bold">Ventas</div>
        <div class="text-caption text-medium-emphasis">
          Total: {{ meta.total }} · Página {{ meta.page }}/{{ meta.pages || 1 }}
        </div>
      </div>

      <div class="d-flex ga-2 align-center">
        <!-- ✅ Solo si realmente puede borrar en backend -->
        <v-btn
          v-if="canDeleteSales"
          variant="tonal"
          color="red"
          :disabled="loading || !selected.length"
          @click="askDeleteMany"
          title="Eliminar ventas seleccionadas"
        >
          <v-icon start>mdi-delete-sweep</v-icon>
          Eliminar seleccionadas ({{ selected.length }})
        </v-btn>

        <v-btn variant="tonal" @click="resetFilters" :disabled="loading">
          <v-icon start>mdi-filter-off</v-icon>
          Reset
        </v-btn>

        <v-btn variant="tonal" @click="exportCsv" :disabled="loading || !sales.length">
          <v-icon start>mdi-file-delimited-outline</v-icon>
          Exportar
        </v-btn>

        <v-btn color="primary" @click="fetchSales" :loading="loading">
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
        </v-btn>
      </div>
    </div>

    <!-- KPIs -->
    <v-row dense class="mb-4">
      <v-col cols="12" md="3">
        <KpiCard title="Ventas (listado actual)" :value="sales.length" icon="mdi-receipt-text-outline" :loading="loading" />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard title="Total facturado (listado)" :value="money(kpis.totalFacturado)" icon="mdi-cash-multiple" :loading="loading" />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard title="Ticket promedio (listado)" :value="money(kpis.ticketPromedio)" icon="mdi-calculator" :loading="loading" />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard title="Método principal" :value="kpis.topMetodoLabel" icon="mdi-credit-card-outline" :loading="loading" />
      </v-col>
    </v-row>

    <!-- FILTROS -->
    <v-card class="rounded-xl mb-4" elevation="1">
      <v-card-text>
        <v-row dense class="align-center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="q"
              label="Buscar"
              placeholder="Cliente / N° venta / ID / Total (ej: 25000)"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @keyup.enter="applyFilters"
              @update:model-value="debouncedApply()"
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
              @update:model-value="applyFilters"
            />
          </v-col>

          <!-- ✅ Admin: filtro por sucursal (solo admin real) -->
          <v-col cols="12" sm="6" md="3" v-if="isAdmin">
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
                  placeholder="(sin filtro)"
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
                  placeholder="(sin filtro)"
                />
              </template>
              <v-date-picker v-model="to" show-adjacent-months @update:model-value="toMenu = false; applyFilters()" />
            </v-menu>
          </v-col>

          <v-col cols="12" md="1">
            <v-btn block color="primary" @click="applyFilters" :loading="loading">
              <v-icon>mdi-filter</v-icon>
            </v-btn>
          </v-col>
        </v-row>

        <div class="d-flex flex-wrap ga-2 mt-3">
          <v-btn size="small" variant="tonal" @click="setToday">Hoy</v-btn>
          <v-btn size="small" variant="tonal" @click="setThisWeek">Esta semana</v-btn>
          <v-btn size="small" variant="tonal" @click="setThisMonth">Este mes</v-btn>
          <v-btn size="small" variant="text" @click="clearDates">Limpiar fechas</v-btn>

          <v-spacer />

          <v-chip size="small" variant="tonal" color="primary">
            Branch: {{ effectiveBranchId ?? "— (todas)" }}
          </v-chip>

          <v-chip size="small" variant="tonal" :color="isAdmin ? 'green' : 'grey'">
            Admin (UI): {{ isAdmin ? "SI" : "NO" }}
          </v-chip>

          <v-chip size="small" variant="tonal" :color="canDeleteSales ? 'red' : 'grey'">
            Delete permitido: {{ canDeleteSales ? "SI" : "NO" }}
          </v-chip>

          <v-select
            v-model="meta.limit"
            :items="[10, 20, 50, 100]"
            label="Por página"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width:150px"
            @update:model-value="meta.page = 1; fetchSales()"
          />
        </div>
      </v-card-text>
    </v-card>

    <!-- TABLA -->
    <v-card class="rounded-xl" elevation="1">
      <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
        <div class="text-subtitle-1 font-weight-bold">Tabla de ventas</div>

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
        show-select
        v-model="selected"
      >
        <template #item.sold_at="{ item }">
          <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
          <div class="text-caption text-medium-emphasis">
            ID: {{ item.id }}
            <span v-if="item.sale_number">· N°: {{ item.sale_number }}</span>
          </div>
        </template>

        <template #item.branch="{ item }">
          <div class="font-weight-bold">{{ branchLabel(item) }}</div>
          <div class="text-caption text-medium-emphasis">Branch ID: {{ item.branch_id ?? "—" }}</div>
        </template>

        <template #item.user="{ item }">
          <div class="font-weight-bold">{{ userLabel(item) }}</div>
          <div class="text-caption text-medium-emphasis">User ID: {{ item.user_id ?? "—" }}</div>
        </template>

        <template #item.customer_name="{ item }">
          <div class="font-weight-bold">{{ item.customer_name || "Consumidor Final" }}</div>
          <div class="text-caption text-medium-emphasis d-flex align-center ga-2">
            <v-icon size="16">mdi-credit-card-outline</v-icon>
            <span>Pago: {{ methodLabel(item.payments?.[0]?.method) }}</span>
            <span v-if="item.payments?.length > 1">(+{{ item.payments.length - 1 }})</span>
          </div>
        </template>

        <template #item.total="{ item }">
          <div class="font-weight-black">{{ money(item.total) }}</div>
          <div class="text-caption text-medium-emphasis">
            Pagado: {{ money(item.paid_total) }} · Vuelto: {{ money(item.change_total) }}
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2 flex-wrap">
            <v-btn size="small" variant="tonal" color="primary" @click="openDetail(item.id)">
              <v-icon start>mdi-eye</v-icon>
              Ver
            </v-btn>

            <v-btn size="small" variant="tonal" @click="copySaleId(item.id)" title="Copiar ID">
              <v-icon>mdi-content-copy</v-icon>
            </v-btn>

            <v-btn size="small" variant="tonal" @click="printSale(item)" title="Imprimir (demo)">
              <v-icon>mdi-printer</v-icon>
            </v-btn>

            <!-- ✅ Delete SOLO si backend debería permitirlo -->
            <v-btn
              v-if="canDeleteSales"
              size="small"
              variant="tonal"
              color="red"
              title="Eliminar"
              @click="askDelete(item)"
            >
              <v-icon start>mdi-delete</v-icon>
              Eliminar
            </v-btn>
          </div>
        </template>

        <template #bottom>
          <div class="d-flex align-center justify-space-between pa-3 flex-wrap ga-2">
            <div class="text-caption text-medium-emphasis">
              Seleccionadas: <b>{{ selected.length }}</b>
            </div>

            <div class="d-flex align-center ga-2">
              <v-btn variant="text" :disabled="meta.page <= 1 || loading" @click="prevPage">
                <v-icon start>mdi-chevron-left</v-icon>
                Anterior
              </v-btn>

              <v-btn variant="text" :disabled="meta.page >= meta.pages || loading" @click="nextPage">
                Siguiente
                <v-icon end>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- DETALLE -->
    <v-dialog v-model="detailDialog" max-width="1100">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between flex-wrap ga-2">
          <div class="font-weight-bold">
            Detalle de venta
            <span v-if="detail" class="text-medium-emphasis">#{{ detail.id }}</span>
          </div>

          <div class="d-flex ga-2">
            <v-btn v-if="detail" size="small" variant="tonal" @click="windowPrint" title="Imprimir">
              <v-icon start>mdi-printer</v-icon>
              Imprimir
            </v-btn>
            <v-btn icon="mdi-close" variant="text" @click="detailDialog = false" />
          </div>
        </v-card-title>

        <v-divider />

        <v-card-text v-if="loadingDetail" class="py-10 d-flex justify-center">
          <v-progress-circular indeterminate />
        </v-card-text>

        <v-card-text v-else-if="detail">
          <v-row dense>
            <v-col cols="12" md="6">
              <v-card elevation="0" class="rounded-xl pa-4" style="background: rgba(0,0,0,.03);">
                <div class="text-caption text-medium-emphasis">Cliente</div>
                <div class="text-h6 font-weight-black">{{ detail.customer_name || "Consumidor Final" }}</div>

                <div class="text-caption text-medium-emphasis mt-3">Fecha</div>
                <div class="text-body-2 font-weight-medium">{{ dt(detail.sold_at || detail.created_at) }}</div>

                <div class="d-flex flex-wrap ga-2 mt-3">
                  <v-chip size="small" variant="tonal" :color="statusColor(detail.status)">
                    {{ statusLabel(detail.status) }}
                  </v-chip>

                  <v-chip size="small" variant="tonal" :color="payColor(detail.payments?.[0]?.method)">
                    {{ methodLabel(detail.payments?.[0]?.method) }}
                  </v-chip>

                  <v-chip size="small" variant="tonal" color="primary">
                    Sucursal: {{ detail.branch_id ?? "—" }}
                  </v-chip>

                  <v-chip size="small" variant="tonal" color="primary">
                    Usuario: {{ detail.user_id ?? "—" }}
                  </v-chip>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card elevation="0" class="rounded-xl pa-4" style="background: rgba(0,0,0,.03);">
                <div class="d-flex justify-space-between"><span>Subtotal</span><b>{{ money(detail.subtotal) }}</b></div>
                <div class="d-flex justify-space-between"><span>Descuento</span><b>{{ money(detail.discount_total) }}</b></div>
                <div class="d-flex justify-space-between"><span>Impuestos</span><b>{{ money(detail.tax_total) }}</b></div>
                <v-divider class="my-2" />
                <div class="d-flex justify-space-between align-center">
                  <span class="text-h6 font-weight-black">TOTAL</span>
                  <span class="text-h6 font-weight-black">{{ money(detail.total) }}</span>
                </div>
                <div class="d-flex justify-space-between"><span>Pagado</span><b>{{ money(detail.paid_total) }}</b></div>
                <div class="d-flex justify-space-between"><span>Vuelto</span><b>{{ money(detail.change_total) }}</b></div>
              </v-card>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-2">
            <div class="text-subtitle-2 font-weight-bold">Productos</div>
            <div class="text-caption text-medium-emphasis">
              Ítems: <b>{{ (detail.items || []).length }}</b>
            </div>
          </div>

          <v-data-table
            :headers="itemsHeaders"
            :items="detail.items || []"
            density="comfortable"
            class="elevation-0 rounded-xl"
            item-key="id"
          >
            <template #item.thumb="{ item }">
              <div class="d-flex align-center ga-3">
                <v-avatar size="44" rounded="lg" style="background: rgba(0,0,0,.06);">
                  <v-img v-if="imgUrl(item)" :src="imgUrl(item)" cover :alt="item.product_name_snapshot || 'Producto'" />
                  <v-icon v-else>mdi-image-off-outline</v-icon>
                </v-avatar>

                <div>
                  <div class="font-weight-bold">{{ item.product_name_snapshot || "Item" }}</div>
                  <div class="text-caption text-medium-emphasis">
                    SKU: {{ item.product_sku_snapshot || "—" }}
                  </div>
                </div>
              </div>
            </template>

            <template #item.quantity="{ item }"><b>{{ Number(item.quantity || 0) }}</b></template>
            <template #item.unit_price="{ item }">{{ money(item.unit_price) }}</template>
            <template #item.line_total="{ item }"><b>{{ money(item.line_total) }}</b></template>

            <template #bottom />
          </v-data-table>

          <v-alert v-if="!((detail.items || []).length)" type="warning" variant="tonal" class="mt-4 rounded-xl">
            Esta venta no trae <b>items</b>. El backend te está devolviendo solo encabezado (sale + payments).
            Hay que incluir los items en <code>/pos/sales/:id</code>.
          </v-alert>

          <v-divider class="my-4" />

          <div class="text-subtitle-2 font-weight-bold mb-2">Pagos</div>
          <v-list density="compact" class="bg-transparent">
            <v-list-item v-for="p in (detail.payments || [])" :key="p.id" class="px-0">
              <v-list-item-title class="text-body-2 font-weight-medium">{{ methodLabel(p.method) }}</v-list-item-title>
              <template #append><b>{{ money(p.amount) }}</b></template>
            </v-list-item>
          </v-list>

          <v-expansion-panels class="mt-4" variant="accordion">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-caption text-medium-emphasis">Ver JSON (debug)</v-expansion-panel-title>
              <v-expansion-panel-text><pre class="json">{{ pretty(detail) }}</pre></v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>

        <v-card-text v-else class="text-medium-emphasis">No se encontró la venta.</v-card-text>
      </v-card>
    </v-dialog>

    <!-- Confirm delete (single) -->
    <v-dialog v-model="deleteDialog" max-width="520">
      <v-card class="rounded-xl">
        <v-card-title class="font-weight-bold">Eliminar venta</v-card-title>
        <v-divider />
        <v-card-text>
          ¿Seguro que querés eliminar la venta <b>#{{ toDelete?.id }}</b>?
          <div class="text-caption text-medium-emphasis mt-2">Esta acción es irreversible.</div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="deleteDialog = false">Cancelar</v-btn>
          <v-spacer />
          <v-btn color="red" variant="flat" :loading="deleting" @click="confirmDelete">
            <v-icon start>mdi-delete</v-icon>
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm delete (many) -->
    <v-dialog v-model="deleteManyDialog" max-width="560">
      <v-card class="rounded-xl">
        <v-card-title class="font-weight-bold">Eliminar ventas seleccionadas</v-card-title>
        <v-divider />
        <v-card-text>
          ¿Seguro que querés eliminar <b>{{ selected.length }}</b> venta(s) seleccionada(s)?
          <div class="text-caption text-medium-emphasis mt-2">Esta acción es irreversible.</div>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-btn variant="text" @click="deleteManyDialog = false">Cancelar</v-btn>
          <v-spacer />
          <v-btn color="red" variant="flat" :loading="deletingMany" @click="confirmDeleteMany">
            <v-icon start>mdi-delete-sweep</v-icon>
            Eliminar todas
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3500">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import http from "../../../app/api/http";
import { useAuthStore } from "../../../app/store/auth.store";

const auth = useAuthStore();
const FILES_BASE = import.meta.env.VITE_FILES_BASE_URL || "";

// ===== Helpers auth (JWT) =====
function safeAtob(str) { try { return atob(str); } catch { return ""; } }
function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = safeAtob(b64);
    return json ? JSON.parse(json) : null;
  } catch { return null; }
}
function getAccessToken() {
  return (
    auth?.accessToken ||
    auth?.token ||
    auth?.tokens?.accessToken ||
    auth?.session?.accessToken ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("jwt") ||
    ""
  );
}
function extractRoleNames(payload) {
  const names = [];
  if (!payload || typeof payload !== "object") return names;

  // comunes
  if (typeof payload.role === "string") names.push(payload.role);
  if (typeof payload.rol === "string") names.push(payload.rol);
  if (typeof payload.user_role === "string") names.push(payload.user_role);

  // arrays
  if (Array.isArray(payload.roles)) {
    for (const r of payload.roles) {
      if (!r) continue;
      if (typeof r === "string") names.push(r);
      else if (typeof r?.name === "string") names.push(r.name);
      else if (typeof r?.role === "string") names.push(r.role);
    }
  }

  return names;
}
function normalizeRole(s) { return String(s || "").trim().toLowerCase(); }
function getRoleNamesFromStores() {
  const u = auth?.user || auth?.me || auth?.profile || {};
  const out = [];

  const pushRole = (r) => {
    if (!r) return;
    if (typeof r === "string") out.push(r);
    else if (typeof r?.name === "string") out.push(r.name);
    else if (typeof r?.role === "string") out.push(r.role);
    else if (typeof r?.role?.name === "string") out.push(r.role.name);
    else if (typeof r?.Role?.name === "string") out.push(r.Role.name);
  };

  if (Array.isArray(u.roles)) u.roles.forEach(pushRole);
  if (u.role) pushRole(u.role);
  if (auth?.role) pushRole(auth.role);

  const token = getAccessToken();
  const payload = decodeJwtPayload(token);
  extractRoleNames(payload).forEach((x) => out.push(x));

  return out.map(normalizeRole).filter(Boolean);
}

// ✅ Admin UI (para filtros por sucursal, etc.)
const isAdmin = computed(() => {
  const u = auth?.user || {};
  if (u.is_admin === true || u.isAdmin === true || u.admin === true) return true;
  const roles = getRoleNamesFromStores();
  return roles.some((r) => ["admin", "super_admin", "superadmin", "root", "owner"].includes(r));
});

// ✅ Delete REAL: normalmente lo dejamos solo a super_admin/root/owner (evita UI mintiendo vs backend)
const canDeleteSales = computed(() => {
  const roles = getRoleNamesFromStores();
  return roles.some((r) => ["super_admin", "superadmin", "root", "owner"].includes(r));
});

// ✅ branchId del user (solo para no-admin)
const userBranchId = computed(() => {
  const u = auth?.user || null;
  const id = Number(u?.branch_id || auth?.branchId || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
});

// ✅ Admin puede elegir sucursal (null = todas)
const selectedBranchId = ref(null);

// ✅ branch efectivo que se manda al backend
const effectiveBranchId = computed(() => {
  if (isAdmin.value) {
    const v = Number(selectedBranchId.value || 0);
    return Number.isFinite(v) && v > 0 ? v : null; // null = todas
  }
  return userBranchId.value;
});

// ===== Branches (para admin select) =====
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

// ===== UI state =====
const dense = ref(false);
const selected = ref([]);

// Data
const loading = ref(false);
const sales = ref([]);
const meta = ref({ page: 1, limit: 20, total: 0, pages: 1 });

const q = ref("");
const status = ref("");

const from = ref("");
const to = ref("");

const fromMenu = ref(false);
const toMenu = ref(false);

// detail
const detailDialog = ref(false);
const loadingDetail = ref(false);
const detail = ref(null);

// delete
const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

// delete many
const deleteManyDialog = ref(false);
const deletingMany = ref(false);

const snack = ref({ show: false, text: "" });

// KPI local
const kpis = computed(() => {
  const arr = sales.value || [];
  const totalFacturado = arr.reduce((a, s) => a + Number(s.total || 0), 0);
  const ticketPromedio = arr.length ? totalFacturado / arr.length : 0;

  const map = {};
  for (const s of arr) {
    const m = String(s?.payments?.[0]?.method || "").toUpperCase() || "—";
    map[m] = (map[m] || 0) + 1;
  }
  let topM = "—";
  let topC = 0;
  for (const [k, v] of Object.entries(map)) {
    if (v > topC) { topC = v; topM = k; }
  }
  return { totalFacturado, ticketPromedio, topMetodoLabel: topM === "—" ? "—" : methodLabel(topM) };
});

const statusItems = [
  { title: "Todos", value: "" },
  { title: "Pagada", value: "PAID" },
  { title: "Borrador", value: "DRAFT" },
  { title: "Cancelada", value: "CANCELLED" },
  { title: "Reintegrada", value: "REFUNDED" },
];

// Headers
const headers = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 190 },
  { title: "Sucursal", key: "branch", sortable: false, width: 210 },
  { title: "Usuario", key: "user", sortable: false, width: 210 },
  { title: "Cliente / Pago", key: "customer_name", sortable: false },
  { title: "Total", key: "total", sortable: false, width: 220 },
  { title: "Estado", key: "status", sortable: false, width: 140 },
  { title: "Acciones", key: "actions", sortable: false, width: 360 },
];

const itemsHeaders = [
  { title: "Producto", key: "thumb", sortable: false },
  { title: "Cant.", key: "quantity", sortable: false, width: 100 },
  { title: "Unit.", key: "unit_price", sortable: false, width: 140 },
  { title: "Total", key: "line_total", sortable: false, width: 140 },
];

// ===== Helpers UI =====
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
  if (x === "CARD") return "Tarjeta / Débito";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "CARD") return "indigo";
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
function pretty(obj) { try { return JSON.stringify(obj, null, 2); } catch { return String(obj); } }

function branchLabel(sale) {
  return sale?.branch?.name || sale?.Branch?.name || sale?.branch_name || sale?.branch_name_snapshot ||
    (sale?.branch_id ? `Sucursal #${sale.branch_id}` : "—");
}
function userLabel(sale) {
  const u = sale?.user || sale?.User || sale?.seller || sale?.cashier || null;
  return sale?.user_name || sale?.user_name_snapshot ||
    (u?.name || u?.full_name || u?.email || u?.username) ||
    (sale?.user_id ? `Usuario #${sale.user_id}` : "—");
}

// ===== Imágenes =====
function absUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
  if (!FILES_BASE) return s;
  return FILES_BASE.replace(/\/$/, "") + (s.startsWith("/") ? s : "/" + s);
}
function imgUrl(item) {
  return absUrl(
    item?.product_image_snapshot ||
    item?.image_snapshot ||
    item?.image_url ||
    item?.product?.image_url ||
    item?.product?.cover_url ||
    item?.product?.thumbnail_url ||
    ""
  );
}

// ===== Debounce =====
let tDeb = null;
function debouncedApply() {
  clearTimeout(tDeb);
  tDeb = setTimeout(() => {
    meta.value.page = 1;
    fetchSales();
  }, 450);
}

// ===== Fetch =====
async function fetchSales() {
  loading.value = true;
  try {
    const hasFrom = !!normalizeDate(from.value);
    const hasTo = !!normalizeDate(to.value);

    const params = {
      page: meta.value.page,
      limit: meta.value.limit,
      q: q.value || undefined,
      status: status.value || undefined,
    };

    if (effectiveBranchId.value) params.branch_id = effectiveBranchId.value;
    if (hasFrom) params.from = toStartOfDay(from.value);
    if (hasTo) params.to = toEndOfDay(to.value);

    const { data } = await http.get("/pos/sales", { params });
    if (!data?.ok) throw new Error(data?.message || "Error listando ventas");

    sales.value = data.data || [];
    meta.value = data.meta || meta.value;
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "Error";
    snack.value = { show: true, text: msg };
  } finally {
    loading.value = false;
  }
}

function applyFilters() { meta.value.page = 1; fetchSales(); }

async function openDetail(id) {
  detailDialog.value = true;
  loadingDetail.value = true;
  detail.value = null;

  try {
    const { data } = await http.get(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "Error cargando detalle");
    detail.value = data.data;
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "Error";
    snack.value = { show: true, text: msg };
    detailDialog.value = false;
  } finally {
    loadingDetail.value = false;
  }
}

// ===== Selección robusta (ids u objetos) =====
function selectedIds() {
  const arr = Array.isArray(selected.value) ? selected.value : [];
  return arr
    .map((x) => (typeof x === "object" && x ? x.id : x))
    .filter((v) => Number(v) > 0)
    .map((v) => Number(v));
}

// ===== Delete (single) =====
function askDelete(item) {
  if (!canDeleteSales.value) {
    snack.value = { show: true, text: "No autorizado para eliminar ventas (permiso)." };
    return;
  }
  toDelete.value = item;
  deleteDialog.value = true;
}

async function confirmDelete() {
  const id = toDelete.value?.id;
  if (!id) return;

  if (!canDeleteSales.value) {
    snack.value = { show: true, text: "No autorizado para eliminar ventas (permiso)." };
    deleteDialog.value = false;
    return;
  }

  deleting.value = true;
  try {
    const { data } = await http.delete(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo eliminar");
    snack.value = { show: true, text: data.message || "Venta eliminada" };
    deleteDialog.value = false;
    toDelete.value = null;
    selected.value = selected.value.filter((x) => (typeof x === "object" ? x?.id : x) !== id);
    fetchSales();
  } catch (e) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message || e?.message || "Error";

    if (status === 403) {
      snack.value = {
        show: true,
        text: "403 (Forbidden): tu usuario no tiene permiso real para borrar ventas. Revisar roles/endpoint.",
      };
    } else {
      snack.value = { show: true, text: msg };
    }
  } finally {
    deleting.value = false;
  }
}

// ===== Delete (many) =====
function askDeleteMany() {
  if (!canDeleteSales.value) {
    snack.value = { show: true, text: "No autorizado para eliminar ventas (permiso)." };
    return;
  }
  if (!selected.value.length) return;
  deleteManyDialog.value = true;
}

async function confirmDeleteMany() {
  const ids = selectedIds();
  if (!ids.length) return;

  if (!canDeleteSales.value) {
    snack.value = { show: true, text: "No autorizado para eliminar ventas (permiso)." };
    deleteManyDialog.value = false;
    return;
  }

  deletingMany.value = true;
  try {
    for (const id of ids) {
      const { data } = await http.delete(`/pos/sales/${id}`);
      if (!data?.ok) throw new Error(data?.message || `No se pudo eliminar #${id}`);
    }

    snack.value = { show: true, text: `Eliminadas: ${ids.length} venta(s)` };
    deleteManyDialog.value = false;
    selected.value = [];
    fetchSales();
  } catch (e) {
    const status = e?.response?.status;
    const msg = e?.response?.data?.message || e?.message || "Error";

    if (status === 403) {
      snack.value = {
        show: true,
        text: "403 (Forbidden): tu usuario no tiene permiso real para borrar ventas. Revisar roles/endpoint.",
      };
    } else {
      snack.value = { show: true, text: msg };
    }
  } finally {
    deletingMany.value = false;
  }
}

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
  q.value = "";
  status.value = "";
  from.value = "";
  to.value = "";
  selected.value = [];
  meta.value.page = 1;
  if (isAdmin.value) selectedBranchId.value = null;
  fetchSales();
}

// ===== Paging =====
function prevPage() { if (meta.value.page > 1) { meta.value.page--; fetchSales(); } }
function nextPage() { if (meta.value.page < meta.value.pages) { meta.value.page++; fetchSales(); } }
function toggleDense() { dense.value = !dense.value; }

// ===== UX Helpers =====
async function copySaleId(id) { await copyText(String(id)); snack.value = { show: true, text: `Copiado: #${id}` }; }
async function copyText(txt) {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

function printSale() { snack.value = { show: true, text: "Impresión: pendiente de plantilla (OK)" }; }
function windowPrint() { window.print(); }

// ===== CSV =====
function exportCsv() {
  const rows = sales.value.map((s) => ({
    id: s.id,
    sold_at: dt(s.sold_at),
    branch: branchLabel(s),
    user: userLabel(s),
    customer: s.customer_name || "Consumidor Final",
    status: statusLabel(s.status),
    total: Number(s.total || 0),
    paid_total: Number(s.paid_total || 0),
    method: methodLabel(s.payments?.[0]?.method),
  }));

  const header = Object.keys(rows[0] || {}).join(",");
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
  fetchSales();
});

// ================== KPI CARD (local component) ==================
const KpiCard = {
  props: { title: String, value: [String, Number], icon: String, loading: Boolean },
  template: `
    <v-card class="rounded-xl" elevation="1">
      <v-card-text class="d-flex align-center justify-space-between">
        <div>
          <div class="text-caption text-medium-emphasis">{{ title }}</div>
          <div class="text-h6 font-weight-black">
            <span v-if="!loading">{{ value }}</span>
            <v-skeleton-loader v-else type="text" width="140" />
          </div>
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
.json {
  font-size: 12px;
  background: rgba(0,0,0,.04);
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  max-height: 420px;
}
</style>
