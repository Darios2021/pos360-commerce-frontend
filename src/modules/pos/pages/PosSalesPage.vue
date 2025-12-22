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
        <!-- ✅ Admin bulk delete -->
        <v-btn
          v-if="isAdmin"
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
        <KpiCard
          title="Ventas (listado actual)"
          :value="sales.length"
          icon="mdi-receipt-text-outline"
          :loading="loading"
        />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard
          title="Total facturado (listado)"
          :value="money(kpis.totalFacturado)"
          icon="mdi-cash-multiple"
          :loading="loading"
        />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard
          title="Ticket promedio (listado)"
          :value="money(kpis.ticketPromedio)"
          icon="mdi-calculator"
          :loading="loading"
        />
      </v-col>
      <v-col cols="12" md="3">
        <KpiCard
          title="Método principal"
          :value="kpis.topMetodoLabel"
          icon="mdi-credit-card-outline"
          :loading="loading"
        />
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
              <v-date-picker
                v-model="from"
                show-adjacent-months
                @update:model-value="fromMenu = false; applyFilters()"
              />
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
              <v-date-picker
                v-model="to"
                show-adjacent-months
                @update:model-value="toMenu = false; applyFilters()"
              />
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
            Branch: {{ branchId ?? "—" }}
          </v-chip>

          <v-chip size="small" variant="tonal" :color="isAdmin ? 'green' : 'grey'">
            Admin: {{ isAdmin ? "SI" : "NO" }}
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
        <!-- Fecha -->
        <template #item.sold_at="{ item }">
          <div class="font-weight-medium">{{ dt(item.sold_at) }}</div>
          <div class="text-caption text-medium-emphasis">
            ID: {{ item.id }}
            <span v-if="item.sale_number">· N°: {{ item.sale_number }}</span>
          </div>
        </template>

        <!-- Cliente -->
        <template #item.customer_name="{ item }">
          <div class="font-weight-bold">{{ item.customer_name || "Consumidor Final" }}</div>
          <div class="text-caption text-medium-emphasis d-flex align-center ga-2">
            <v-icon size="16">mdi-credit-card-outline</v-icon>
            <span>Pago: {{ methodLabel(item.payments?.[0]?.method) }}</span>
            <span v-if="item.payments?.length > 1">(+{{ item.payments.length - 1 }})</span>
          </div>
        </template>

        <!-- Total -->
        <template #item.total="{ item }">
          <div class="font-weight-black">{{ money(item.total) }}</div>
          <div class="text-caption text-medium-emphasis">
            Pagado: {{ money(item.paid_total) }} · Vuelto: {{ money(item.change_total) }}
          </div>
        </template>

        <!-- Estado -->
        <template #item.status="{ item }">
          <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>

        <!-- Acciones -->
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

            <!-- ✅ Admin -->
            <v-btn
              v-if="isAdmin"
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

        <!-- Bottom -->
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
            <v-btn
              v-if="detail"
              size="small"
              variant="tonal"
              @click="printSale(detail)"
              title="Imprimir (demo)"
            >
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
          <!-- RESUMEN -->
          <v-row dense>
            <v-col cols="12" md="7">
              <v-card class="rounded-xl" elevation="1">
                <v-card-text>
                  <div class="d-flex justify-space-between flex-wrap ga-4">
                    <div>
                      <div class="text-caption text-medium-emphasis">Cliente</div>
                      <div class="text-h6 font-weight-black">
                        {{ detail.customer_name || "Consumidor Final" }}
                      </div>
                      <div class="text-caption text-medium-emphasis mt-1">
                        Fecha: {{ dt(detail.sold_at) }}
                        <span v-if="detail.sale_number"> · N°: {{ detail.sale_number }}</span>
                      </div>
                    </div>

                    <div class="text-right">
                      <div class="text-caption text-medium-emphasis">Total</div>
                      <div class="text-h5 font-weight-black">{{ money(detail.total) }}</div>
                      <div class="text-caption text-medium-emphasis">
                        Estado: <b>{{ statusLabel(detail.status) }}</b>
                      </div>
                    </div>
                  </div>

                  <v-divider class="my-4" />

                  <div class="d-flex flex-wrap ga-2">
                    <v-chip variant="tonal" color="primary">
                      Pagado: <b class="ml-1">{{ money(detail.paid_total) }}</b>
                    </v-chip>
                    <v-chip variant="tonal" color="grey">
                      Vuelto: <b class="ml-1">{{ money(detail.change_total) }}</b>
                    </v-chip>

                    <v-spacer />

                    <v-btn size="small" variant="tonal" @click="copySaleId(detail.id)">
                      <v-icon start>mdi-content-copy</v-icon>
                      Copiar ID
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="5">
              <v-card class="rounded-xl" elevation="1">
                <v-card-text>
                  <div class="text-subtitle-2 font-weight-bold mb-2">Pagos</div>

                  <div v-if="!detail.payments?.length" class="text-caption text-medium-emphasis">
                    Sin pagos asociados.
                  </div>

                  <v-list v-else density="compact" class="py-0">
                    <v-list-item v-for="p in detail.payments" :key="p.id">
                      <template #prepend>
                        <v-avatar size="32" variant="tonal" color="primary">
                          <v-icon size="18">{{ methodIcon(p.method) }}</v-icon>
                        </v-avatar>
                      </template>

                      <v-list-item-title class="font-weight-bold">
                        {{ methodLabel(p.method) }}
                      </v-list-item-title>

                      <v-list-item-subtitle class="text-caption">
                        {{ dt(p.paid_at || detail.sold_at) }}
                      </v-list-item-subtitle>

                      <template #append>
                        <div class="font-weight-black">{{ money(p.amount) }}</div>
                      </template>
                    </v-list-item>
                  </v-list>

                  <v-divider class="my-3" />

                  <div class="d-flex justify-space-between">
                    <span class="text-caption text-medium-emphasis">Subtotal</span>
                    <span class="font-weight-bold">{{ money(detail.subtotal) }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption text-medium-emphasis">Descuento</span>
                    <span class="font-weight-bold">{{ money(detail.discount_total) }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption text-medium-emphasis">Impuestos</span>
                    <span class="font-weight-bold">{{ money(detail.tax_total) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mt-2">
                    <span class="text-subtitle-2 font-weight-bold">Total</span>
                    <span class="text-h6 font-weight-black">{{ money(detail.total) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- TABS DETALLE -->
          <v-divider class="my-4" />

          <v-tabs v-model="detailTab" color="primary">
            <v-tab value="items">
              <v-icon start>mdi-cart</v-icon>
              Productos
              <v-chip class="ml-2" size="x-small" variant="tonal">
                {{ (detail.items || []).length }}
              </v-chip>
            </v-tab>
            <v-tab value="raw">
              <v-icon start>mdi-code-json</v-icon>
              JSON
            </v-tab>
          </v-tabs>

          <v-window v-model="detailTab" class="mt-3">
            <!-- ITEMS -->
            <v-window-item value="items">
              <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-3">
                <div class="text-subtitle-2 font-weight-bold">Productos vendidos</div>

                <v-text-field
                  v-model="itemQ"
                  density="compact"
                  variant="outlined"
                  hide-details
                  clearable
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Filtrar por nombre / SKU / barcode..."
                  style="max-width: 360px;"
                />
              </div>

              <v-row dense>
                <v-col v-for="it in filteredItems" :key="it.id" cols="12" md="6">
                  <v-card class="rounded-xl" elevation="1">
                    <v-card-text class="d-flex ga-3">
                      <v-avatar rounded="lg" size="78" class="border">
                        <v-img v-if="productImage(it)" :src="productImage(it)" cover />
                        <v-icon v-else size="34">mdi-package-variant</v-icon>
                      </v-avatar>

                      <div class="flex-grow-1">
                        <div class="font-weight-black">
                          {{ it.product?.name || it.product_name_snapshot || "Producto" }}
                        </div>

                        <div class="text-caption text-medium-emphasis">
                          SKU: {{ it.product?.sku || it.product_sku_snapshot || "—" }}
                          · Código: {{ it.product?.code || "—" }}
                          · Barcode: {{ it.product?.barcode || "—" }}
                        </div>

                        <div class="text-caption text-medium-emphasis mt-1">
                          Marca: {{ it.product?.brand || "—" }} · Modelo: {{ it.product?.model || "—" }}
                        </div>

                        <div class="mt-2 d-flex justify-space-between align-end">
                          <div class="text-caption">
                            {{ qtyFmt(it.quantity) }} × {{ money(it.unit_price) }}
                          </div>
                          <div class="text-h6 font-weight-black">
                            {{ money(it.line_total) }}
                          </div>
                        </div>

                        <div class="text-caption text-medium-emphasis mt-1">
                          Categoría: {{ it.product?.category?.name || "—" }}
                          <span v-if="it.product?.category?.parent?.name">
                            · Padre: {{ it.product.category.parent.name }}
                          </span>
                        </div>
                      </div>
                    </v-card-text>

                    <v-divider />

                    <v-card-actions class="px-4 py-2">
                      <v-btn
                        size="small"
                        variant="tonal"
                        color="primary"
                        @click="goToProduct(it.product?.id)"
                        :disabled="!it.product?.id"
                      >
                        <v-icon start>mdi-eye</v-icon>
                        Ver producto
                      </v-btn>

                      <v-btn
                        size="small"
                        variant="tonal"
                        @click="copyText(it.product?.sku || it.product_sku_snapshot || '')"
                        :disabled="!(it.product?.sku || it.product_sku_snapshot)"
                        title="Copiar SKU"
                      >
                        <v-icon start>mdi-content-copy</v-icon>
                        SKU
                      </v-btn>

                      <v-spacer />

                      <div class="text-caption text-medium-emphasis">
                        Lista: {{ money(it.product?.price_list) }} · Precio: {{ money(it.product?.price) }}
                      </div>
                    </v-card-actions>
                  </v-card>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- RAW JSON -->
            <v-window-item value="raw">
              <v-card class="rounded-xl" elevation="1">
                <v-card-text>
                  <pre class="json">{{ pretty(detail) }}</pre>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Confirm delete (single) -->
    <v-dialog v-model="deleteDialog" max-width="520">
      <v-card class="rounded-xl">
        <v-card-title class="font-weight-bold">Eliminar venta</v-card-title>
        <v-divider />
        <v-card-text>
          ¿Seguro que querés eliminar la venta <b>#{{ toDelete?.id }}</b>?
          <div class="text-caption text-medium-emphasis mt-2">
            Esta acción es irreversible.
          </div>
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

    <v-snackbar v-model="snack.show" :timeout="3000">
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

// ✅ branchId REAL (sale del /me -> users.branch_id)
// fallback: si no está, queda null y backend puede resolver por warehouse/contexto
const branchId = computed(() => {
  const u = auth?.user || null;
  const id = Number(u?.branch_id || auth?.branchId || 0);
  return Number.isFinite(id) && id > 0 ? id : null;
});

// ===== Helpers auth (JWT) =====
function safeAtob(str) {
  try {
    return atob(str);
  } catch {
    return "";
  }
}
function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = safeAtob(b64);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
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
function extractRoleNamesFromPayload(payload) {
  const names = [];
  if (!payload || typeof payload !== "object") return names;

  if (typeof payload.role === "string") names.push(payload.role);

  if (Array.isArray(payload.roles)) {
    for (const r of payload.roles) {
      if (!r) continue;
      if (typeof r === "string") names.push(r);
      else if (typeof r?.name === "string") names.push(r.name);
    }
  }

  if (typeof payload.rol === "string") names.push(payload.rol);
  if (typeof payload.user_role === "string") names.push(payload.user_role);

  return names;
}

// ✅ ADMIN DETECTOR ultra robusto
const isAdmin = computed(() => {
  const u = auth?.user || auth?.me || auth?.profile || {};
  const roleNames = [];
  const norm = (s) => String(s || "").trim().toLowerCase();

  const rawRoles = Array.isArray(u.roles) ? u.roles : [];
  for (const r of rawRoles) {
    if (!r) continue;
    if (typeof r === "string") roleNames.push(r);
    else if (typeof r?.name === "string") roleNames.push(r.name);
    else if (typeof r?.role === "string") roleNames.push(r.role);
    else if (typeof r?.role?.name === "string") roleNames.push(r.role.name);
    else if (typeof r?.Role?.name === "string") roleNames.push(r.Role.name);
  }

  if (typeof u.role === "string") roleNames.push(u.role);
  if (typeof u?.role?.name === "string") roleNames.push(u.role.name);

  if (u.is_admin === true || u.isAdmin === true || u.admin === true) return true;

  if (typeof auth?.role === "string") roleNames.push(auth.role);

  const token = getAccessToken();
  const payload = decodeJwtPayload(token);
  roleNames.push(...extractRoleNamesFromPayload(payload));

  const email = String(u.email || u.identifier || u.username || "").toLowerCase();
  if (email === "admin@360pos.local" || email.includes("admin@360pos.local")) return true;

  return roleNames.map(norm).some((x) =>
    ["admin", "super_admin", "superadmin", "root", "owner"].includes(x)
  );
});

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
const detailTab = ref("items");
const itemQ = ref("");

// delete
const deleteDialog = ref(false);
const toDelete = ref(null);
const deleting = ref(false);

// delete many
const deleteManyDialog = ref(false);
const deletingMany = ref(false);

const snack = ref({ show: false, text: "" });

// KPI local (calculado de listado)
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
    if (v > topC) {
      topC = v;
      topM = k;
    }
  }
  return {
    totalFacturado,
    ticketPromedio,
    topMetodoLabel: topM === "—" ? "—" : methodLabel(topM),
  };
});

const statusItems = [
  { title: "Todos", value: "" },
  { title: "Pagada", value: "PAID" },
  { title: "Borrador", value: "DRAFT" },
  { title: "Cancelada", value: "CANCELLED" },
  { title: "Reintegrada", value: "REFUNDED" },
];

// Tabla headers
const headers = [
  { title: "Fecha", key: "sold_at", sortable: false, width: 190 },
  { title: "Cliente / Pago", key: "customer_name", sortable: false },
  { title: "Total", key: "total", sortable: false, width: 220 },
  { title: "Estado", key: "status", sortable: false, width: 140 },
  { title: "Acciones", key: "actions", sortable: false, width: 360 },
];

// ===== Helpers UI =====
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    Number(val || 0)
  );
}
function dt(val) {
  if (!val) return "—";
  return new Date(val).toLocaleString("es-AR");
}
function normalizeDate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  return new Date(v).toISOString().slice(0, 10);
}
function toStartOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  return d ? `${d} 00:00:00` : "";
}
function toEndOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  return d ? `${d} 23:59:59` : "";
}

function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta / Débito";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return m || "—";
}

function methodIcon(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "mdi-cash";
  if (x === "CARD") return "mdi-credit-card";
  if (x === "TRANSFER") return "mdi-bank-transfer";
  if (x === "QR") return "mdi-qrcode";
  return "mdi-dots-horizontal";
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

function qtyFmt(v) {
  const n = Number(v || 0);
  return n.toFixed(3);
}

function productImage(it) {
  const imgs = it?.product?.images || [];
  const first = imgs[0];
  return first?.url || first?.public_url || first?.path || first?.key || "";
}

function pretty(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

// ===== Debounce simple =====
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

    // ✅ solo filtra por branch si lo tenemos
    if (branchId.value) params.branch_id = branchId.value;

    if (hasFrom) params.from = toStartOfDay(from.value);
    if (hasTo) params.to = toEndOfDay(to.value);

    const { data } = await http.get("/pos/sales", { params });
    if (!data?.ok) throw new Error(data?.message || "Error listando ventas");

    sales.value = data.data || [];
    meta.value = data.meta || meta.value;
  } catch (e) {
    snack.value = { show: true, text: e.message || "Error" };
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  meta.value.page = 1;
  fetchSales();
}

async function openDetail(id) {
  detailDialog.value = true;
  loadingDetail.value = true;
  detail.value = null;
  detailTab.value = "items";
  itemQ.value = "";

  try {
    const { data } = await http.get(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "Error cargando detalle");
    detail.value = data.data;
  } catch (e) {
    snack.value = { show: true, text: e.message || "Error" };
    detailDialog.value = false;
  } finally {
    loadingDetail.value = false;
  }
}

function goToProduct(productId) {
  if (!productId) return;
  router.push({ name: "productProfile", params: { id: productId } }).catch(() => router.push("/products"));
}

const filteredItems = computed(() => {
  const items = detail.value?.items || [];
  const qq = String(itemQ.value || "").trim().toLowerCase();
  if (!qq) return items;

  return items.filter((it) => {
    const name = (it.product?.name || it.product_name_snapshot || "").toLowerCase();
    const sku = (it.product?.sku || it.product_sku_snapshot || "").toLowerCase();
    const bc = (it.product?.barcode || it.product_barcode_snapshot || "").toLowerCase();
    return name.includes(qq) || sku.includes(qq) || bc.includes(qq);
  });
});

// ===== Delete (single) =====
function askDelete(item) {
  toDelete.value = item;
  deleteDialog.value = true;
}

async function confirmDelete() {
  const id = toDelete.value?.id;
  if (!id) return;
  deleting.value = true;
  try {
    const { data } = await http.delete(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo eliminar");
    snack.value = { show: true, text: data.message || "Venta eliminada" };
    deleteDialog.value = false;
    toDelete.value = null;
    selected.value = selected.value.filter((x) => x?.id !== id);
    fetchSales();
  } catch (e) {
    snack.value = { show: true, text: e.message || "Error" };
  } finally {
    deleting.value = false;
  }
}

// ===== Delete (many) =====
function askDeleteMany() {
  if (!selected.value.length) return;
  deleteManyDialog.value = true;
}

async function confirmDeleteMany() {
  if (!selected.value.length) return;
  deletingMany.value = true;
  try {
    const ids = selected.value.map((x) => (typeof x === "object" ? x.id : x)).filter(Boolean);

    for (const id of ids) {
      const { data } = await http.delete(`/pos/sales/${id}`);
      if (!data?.ok) throw new Error(data?.message || `No se pudo eliminar #${id}`);
    }

    snack.value = { show: true, text: `Eliminadas: ${ids.length} venta(s)` };
    deleteManyDialog.value = false;
    selected.value = [];
    fetchSales();
  } catch (e) {
    snack.value = { show: true, text: e.message || "Error" };
  } finally {
    deletingMany.value = false;
  }
}

// ===== Ranges =====
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function clearDates() {
  from.value = "";
  to.value = "";
  applyFilters();
}
function setToday() {
  const t = todayISO();
  from.value = t;
  to.value = t;
  applyFilters();
}
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
  fetchSales();
}

// ===== Paging =====
function prevPage() {
  if (meta.value.page > 1) {
    meta.value.page--;
    fetchSales();
  }
}
function nextPage() {
  if (meta.value.page < meta.value.pages) {
    meta.value.page++;
    fetchSales();
  }
}

function toggleDense() {
  dense.value = !dense.value;
}

// ===== UX Helpers =====
async function copySaleId(id) {
  await copyText(String(id));
  snack.value = { show: true, text: `Copiado: #${id}` };
}
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

// “Print” demo
function printSale(sale) {
  if (!sale) return;
  snack.value = { show: true, text: "Impresión: pendiente de plantilla (OK)" };
}

// CSV export local
function exportCsv() {
  const rows = sales.value.map((s) => ({
    id: s.id,
    sold_at: dt(s.sold_at),
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
        .join(",")
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
  // ✅ si el store tiene token pero no user cargado, pedimos /me
  if (auth?.isAuthed && !auth.user && typeof auth.fetchMe === "function") {
    try { await auth.fetchMe(); } catch {}
  }
  fetchSales();
});

// ================== KPI CARD (local component) ==================
const KpiCard = {
  props: {
    title: String,
    value: [String, Number],
    icon: String,
    loading: Boolean,
  },
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
.border { border: 1px solid rgba(0,0,0,.08); }
.json {
  font-size: 12px;
  background: rgba(0,0,0,.04);
  padding: 12px;
  border-radius: 12px;
  overflow: auto;
  max-height: 420px;
}
</style>
