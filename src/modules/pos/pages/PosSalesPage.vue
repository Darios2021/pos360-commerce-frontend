<!-- src/modules/pos/pages/PosSalesPage.vue -->
<template>
  <div class="lp">

    <!-- ── HEADER ───────────────────────────────────────── -->
    <header class="lp-header">
      <div class="lp-header__left">
        <h1 class="lp-title">Ventas</h1>
        <div class="lp-meta">
          <span class="lp-meta__strong">{{ Number(meta.total || 0).toLocaleString('es') }}</span>
          <span class="lp-meta__sep">·</span>
          <span>Página {{ meta.page }} de {{ meta.pages || 1 }}</span>
        </div>
      </div>
      <div class="lp-header__right">
        <v-btn
          variant="tonal"
          size="small"
          rounded="lg"
          prepend-icon="mdi-file-delimited-outline"
          :disabled="loading || !sales.length"
          title="Exportar CSV"
          @click="exportCsv"
        >
          Exportar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          rounded="lg"
          prepend-icon="mdi-refresh"
          :loading="loading || statsLoading"
          @click="refreshAll"
        >
          Actualizar
        </v-btn>
      </div>
    </header>

    <!-- ── STATS KPI ────────────────────────────────────── -->
    <section class="lp-stats">
      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--primary">
          <v-icon size="16" color="white">mdi-receipt-text-outline</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Ventas</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? stats.sales_count : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--green">
          <v-icon size="16" color="white">mdi-trending-up</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Bruto vendido</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? money(stats.gross_total_sum) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">Antes de devoluciones</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--orange">
          <v-icon size="16" color="white">mdi-cash-refund</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Devoluciones</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? money(stats.refunds_sum) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">Total reintegrado</div>
        </div>
      </div>

      <div class="lp-kpi">
        <div class="lp-kpi__badge lp-kpi__badge--indigo">
          <v-icon size="16" color="white">mdi-cash-check</v-icon>
        </div>
        <div class="lp-kpi__body">
          <div class="lp-kpi__lbl">Neto vendido</div>
          <div v-if="!statsLoading" class="lp-kpi__val">{{ stats.ready ? money(stats.total_sum) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
          <div class="lp-kpi__sub">Bruto − devoluciones</div>
        </div>
      </div>
    </section>

    <!-- ── PAYMENT METHODS ──────────────────────────────── -->
    <section class="lp-methods">
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--cash"><v-icon size="14" color="white">mdi-cash</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Efectivo</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? money(stats.net_by_method.cash) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--transfer"><v-icon size="14" color="white">mdi-bank-transfer</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Transferencia</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? money(stats.net_by_method.transfer) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--card"><v-icon size="14" color="white">mdi-credit-card-outline</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Tarjeta</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? money(stats.net_by_method.card) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--mp"><v-icon size="14" color="white">mdi-qrcode</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Mercado Pago</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? money(stats.net_by_method.mercadopago) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--sjt"><v-icon size="14" color="white">mdi-wallet-outline</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">SJ Crédito</div>
          <div v-if="!statsLoading" class="lp-mc__val">{{ stats.ready ? money(stats.net_by_method.credit_sjt) : '—' }}</div>
          <div v-else class="lp-kpi__skel" />
        </div>
      </div>
      <div v-if="!statsLoading && stats.ready && stats.net_by_method.other > 0" class="lp-mc">
        <div class="lp-mc__badge lp-mc__badge--other"><v-icon size="14" color="white">mdi-cash-multiple</v-icon></div>
        <div class="lp-mc__body">
          <div class="lp-mc__lbl">Otro</div>
          <div class="lp-mc__val">{{ money(stats.net_by_method.other) }}</div>
        </div>
      </div>
    </section>

    <!-- ── FILTER BAR ───────────────────────────────────── -->
    <section class="lp-filters">
      <!-- Fila primaria: search + estado + presets + toggle -->
      <div class="lp-filters__primary">
        <v-text-field
          v-model="q"
          placeholder="Buscar por cliente, número, ID…"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="lp-filters__search"
          @keyup.enter="applyFiltersImmediate"
          @click:clear="applyFiltersImmediate"
        />
        <v-select
          v-model="status"
          :items="statusItems"
          label="Estado"
          variant="outlined"
          density="compact"
          hide-details
          class="lp-filters__primary-field"
          @update:model-value="applyFiltersImmediate"
        />
        <div class="lp-filters__presets">
          <v-btn
            size="small"
            rounded="lg"
            :variant="isToday ? 'flat' : 'tonal'"
            :color="isToday ? 'primary' : undefined"
            @click="setToday"
          >
            Hoy
          </v-btn>
          <v-btn size="small" rounded="lg" variant="tonal" @click="setThisWeek">Semana</v-btn>
          <v-btn size="small" rounded="lg" variant="tonal" @click="setThisMonth">Mes</v-btn>
        </div>
        <button
          type="button"
          class="lp-filters__more"
          :class="{ 'lp-filters__more--open': advancedOpen }"
          @click="toggleAdvanced"
        >
          <v-icon size="15">mdi-tune-variant</v-icon>
          <span>Más filtros</span>
          <span v-if="activeAdvancedCount > 0" class="lp-filters__more-count">{{ activeAdvancedCount }}</span>
          <v-icon size="14" class="lp-filters__more-chev">mdi-chevron-down</v-icon>
        </button>
      </div>

      <div v-if="from || to" class="lp-date-range">
        <v-icon size="13">mdi-calendar-range</v-icon>
        {{ normalizeDate(from) || '…' }} → {{ normalizeDate(to) || '…' }}
        <button type="button" class="lp-date-range__clear" @click="clearDates">
          <v-icon size="13">mdi-close</v-icon>
          Limpiar fechas
        </button>
      </div>

      <!-- Filtros avanzados colapsables -->
      <v-expand-transition>
        <div v-show="advancedOpen" class="lp-filters__advanced">
          <div class="lp-filters__grid">
            <div class="lp-filters__cell">
              <v-autocomplete
                v-model="sellerId"
                :items="sellerItems"
                :loading="sellerLoading"
                label="Cajero / Vendedor"
                placeholder="Buscar vendedor"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                item-title="title"
                item-value="value"
                :no-filter="true"
                @update:search="onSellerSearch"
                @update:model-value="applyFiltersImmediate"
                @click:clear="sellerId = null; applyFiltersImmediate()"
              />
            </div>

            <div class="lp-filters__cell">
              <v-autocomplete
                v-model="productPick"
                :items="productItems"
                :loading="productLoading"
                label="Producto vendido"
                placeholder="Buscar producto"
                prepend-inner-icon="mdi-package-variant-closed"
                variant="outlined"
                density="compact"
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
            </div>

            <div class="lp-filters__cell">
              <v-select
                v-model="payMethod"
                :items="payMethodItems"
                label="Método de pago"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                @update:model-value="applyFiltersImmediate"
                @click:clear="payMethod = ''; applyFiltersImmediate()"
              />
            </div>

            <div v-if="isAdmin" class="lp-filters__cell">
              <v-select
                v-model="selectedBranchId"
                :items="branchSelectItems"
                label="Sucursal"
                variant="outlined"
                density="compact"
                hide-details
                :loading="branchesLoading"
                @update:model-value="onBranchChanged"
              />
            </div>

            <div class="lp-filters__cell">
              <v-menu v-model="fromMenu" :close-on-content-click="false" location="bottom">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="normalizeDate(from) || ''"
                    label="Desde"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    density="compact"
                    hide-details
                    readonly
                    placeholder="Sin fecha"
                  />
                </template>
                <v-date-picker
                  v-model="from"
                  show-adjacent-months
                  @update:model-value="fromMenu = false; applyFiltersImmediate()"
                />
              </v-menu>
            </div>

            <div class="lp-filters__cell">
              <v-menu v-model="toMenu" :close-on-content-click="false" location="bottom">
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="normalizeDate(to) || ''"
                    label="Hasta"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    density="compact"
                    hide-details
                    readonly
                    placeholder="Sin fecha"
                  />
                </template>
                <v-date-picker
                  v-model="to"
                  show-adjacent-months
                  @update:model-value="toMenu = false; applyFiltersImmediate()"
                />
              </v-menu>
            </div>

            <div class="lp-filters__cell lp-filters__cell--per-page">
              <v-select
                v-model="meta.limit"
                :items="[10, 20, 50, 100]"
                label="Por página"
                variant="outlined"
                density="compact"
                hide-details
                @update:model-value="meta.page = 1; refreshAll()"
              />
            </div>
          </div>

          <div v-if="isAdmin" class="lp-filters__hint">
            Sucursal activa: <b>{{ effectiveBranchId ? `#${effectiveBranchId}` : 'Todas' }}</b>
          </div>
        </div>
      </v-expand-transition>

      <!-- Chips activos -->
      <div v-if="activeFilterChips.length" class="lp-filters__chips">
        <v-chip
          v-for="chip in activeFilterChips"
          :key="chip.key"
          size="small"
          variant="tonal"
          color="primary"
          closable
          class="lp-filters__chip"
          @click:close="removeChip(chip.key)"
        >
          {{ chip.label }}
        </v-chip>
        <button
          v-if="activeFilterChips.length > 1"
          type="button"
          class="lp-filters__chips-clear"
          @click="resetFilters"
        >
          Limpiar todo
        </button>
      </div>
    </section>

    <!-- ── CONTENT ──────────────────────────────────────── -->
    <section class="lp-content">
      <div class="lp-content__head">
        <div class="lp-content__head-left">
          <span class="lp-content__title">Listado</span>
          <v-chip size="x-small" variant="tonal">{{ sales.length }} de {{ meta.total }}</v-chip>
        </div>
        <v-btn size="x-small" variant="text" @click="toggleDense">
          <v-icon start size="13">{{ dense ? 'mdi-format-line-spacing' : 'mdi-format-line-weight' }}</v-icon>
          {{ dense ? 'Normal' : 'Compacta' }}
        </v-btn>
      </div>

      <div class="lp-content__body lp-content__body--flush" :class="{ 'lp-content__body--loading': loading }">
        <v-data-table
          :headers="headers"
          :items="sales"
          :loading="loading"
          item-key="id"
          :density="dense ? 'compact' : 'comfortable'"
          hover
          class="vp-table"
          :items-per-page="-1"
          hide-default-footer
          @click:row="onRowClick"
        >
          <template #item.sold_at="{ item }">
            <div class="vp-date">{{ dt(item.sold_at) }}</div>
            <div class="vp-id">
              ID {{ item.id }}
              <span v-if="item.sale_number"> · N° {{ item.sale_number }}</span>
            </div>
          </template>

          <template #item.seller="{ item }">
            <div class="vp-bold">{{ item.user?.username || fullUserName(item.user) || `#${item.user_id}` }}</div>
            <div class="vp-sub">{{ item.branch?.name || `Suc. #${item.branch_id}` }}</div>
          </template>

          <template #item.customer="{ item }">
            <div class="vp-bold">{{ item.customer_name || 'Consumidor Final' }}</div>
            <div v-if="item.customer_doc || item.customer_phone" class="vp-sub">
              <span v-if="item.customer_doc">{{ item.customer_doc }}</span>
              <span v-if="item.customer_doc && item.customer_phone"> · </span>
              <span v-if="item.customer_phone">{{ item.customer_phone }}</span>
            </div>
          </template>

          <template #item.product="{ item }">
            <div class="vp-bold">{{ primaryProductName(item) }}</div>
            <div v-if="productExtraCount(item) > 0" class="vp-sub">
              +{{ productExtraCount(item) }} más
            </div>
            <div v-else-if="primaryProductSku(item)" class="vp-sub">{{ primaryProductSku(item) }}</div>
          </template>

          <template #item.total="{ item }">
            <div class="vp-amount">{{ money(item.total) }}</div>
            <div class="vp-sub">
              Pag: {{ money(item.paid_total) }}
              <span v-if="Number(item.change_total) > 0"> · Vto: {{ money(item.change_total) }}</span>
            </div>
          </template>

          <template #item.method="{ item }">
            <div class="vp-pay-row">
              <v-chip
                size="small"
                variant="flat"
                :color="payColor(primaryPayment(item)?.method)"
                class="vp-pay-chip"
              >
                {{ methodLabel(primaryPayment(item)?.method) }}
              </v-chip>
              <span v-if="paymentInstallments(primaryPayment(item))" class="vp-cuotas">
                {{ paymentInstallments(primaryPayment(item)) }}x
              </span>
              <span v-if="(item.payments || []).length > 1" class="vp-extra-pays">
                +{{ item.payments.length - 1 }}
              </span>
            </div>
            <div v-if="paymentReference(primaryPayment(item))" class="vp-sub vp-ref">
              {{ paymentReference(primaryPayment(item)) }}
            </div>
          </template>

          <template #item.status="{ item }">
            <v-chip size="small" variant="tonal" :color="statusColor(item.status)">
              {{ statusLabel(item.status) }}
            </v-chip>
          </template>

          <template #item.actions="{ item }">
            <div class="vp-actions">
              <v-btn
                size="x-small"
                variant="tonal"
                color="primary"
                icon
                title="Ver detalle"
                @click.stop="goDetail(item.id)"
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
                  <v-list-item @click.stop="actView(item.id)">
                    <template #prepend><v-icon size="16">mdi-eye</v-icon></template>
                    <v-list-item-title>Ver detalle</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click.stop="actRefund(item.id)">
                    <template #prepend><v-icon size="16" color="orange">mdi-cash-refund</v-icon></template>
                    <v-list-item-title>Registrar devolución</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click.stop="actExchange(item.id)">
                    <template #prepend><v-icon size="16" color="cyan">mdi-swap-horizontal</v-icon></template>
                    <v-list-item-title>Registrar cambio</v-list-item-title>
                  </v-list-item>
                  <v-divider />
                  <v-list-item @click.stop="copyText(String(item.id))">
                    <template #prepend><v-icon size="16">mdi-content-copy</v-icon></template>
                    <v-list-item-title>Copiar ID</v-list-item-title>
                  </v-list-item>
                  <v-divider v-if="isAdmin" />
                  <v-list-item
                    v-if="isAdmin && item.status !== 'CANCELLED'"
                    @click.stop="openDelete(item)"
                  >
                    <template #prepend><v-icon size="16" color="error">mdi-cancel</v-icon></template>
                    <v-list-item-title>Anular venta</v-list-item-title>
                  </v-list-item>
                  <v-list-item v-else-if="item.status === 'CANCELLED'" disabled>
                    <template #prepend><v-icon size="16" color="grey">mdi-cancel</v-icon></template>
                    <v-list-item-title class="text-disabled">Ya anulada</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </template>

          <template #bottom><div /></template>
        </v-data-table>
      </div>
    </section>

    <!-- ── PAGINATION ───────────────────────────────────── -->
    <footer v-if="meta.total > 0" class="lp-pagination">
      <span class="lp-pagination__info">{{ sales.length }} de {{ meta.total }}</span>
      <v-pagination
        v-model="meta.page"
        :length="meta.pages || 1"
        :total-visible="7"
        rounded="lg"
        size="small"
        @update:modelValue="refreshAll"
      />
    </footer>

    <!-- ── ANULAR VENTA DIALOG ──────────────────────────── -->
    <v-dialog v-model="deleteDialog.show" max-width="480">
      <v-card rounded="xl">
        <div class="anular-dlg__head">
          <div class="anular-dlg__icon-wrap">
            <v-icon size="22" color="error">mdi-cancel</v-icon>
          </div>
          <div>
            <p class="anular-dlg__eyebrow">Venta #{{ getSaleId(deleteDialog.sale) }}</p>
            <h3 class="anular-dlg__title">Anular venta</h3>
          </div>
        </div>

        <div class="anular-dlg__body">
          <div class="anular-dlg__info-row">
            <v-icon size="16" color="success" class="flex-shrink-0">mdi-package-variant</v-icon>
            <span>El stock de los productos será <strong>restaurado automáticamente</strong>.</span>
          </div>
          <div class="anular-dlg__info-row">
            <v-icon size="16" color="primary" class="flex-shrink-0">mdi-history</v-icon>
            <span>La venta quedará como <strong>Anulada</strong> en el historial (no se borra).</span>
          </div>
          <div class="anular-dlg__info-row">
            <v-icon size="16" color="warning" class="flex-shrink-0">mdi-cash-remove</v-icon>
            <span>El importe <strong>no se contará</strong> en el arqueo de esta sesión.</span>
          </div>
        </div>

        <div class="anular-dlg__actions">
          <v-btn
            variant="text"
            size="small"
            :disabled="!!deletingId"
            @click="deleteDialog = { show: false, sale: null }"
          >
            Volver
          </v-btn>
          <v-btn
            variant="flat"
            color="error"
            size="small"
            :loading="!!deletingId"
            @click="deleteSaleConfirmed"
          >
            <v-icon start size="14">mdi-cancel</v-icon>Confirmar anulación
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">{{ snack.text }}</v-snackbar>
  </div>
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

/* Filtros avanzados (colapsable + persistencia) */
const ADV_KEY = "lp.sales.advancedOpen";
const advancedOpen = ref(false);
try {
  const saved = localStorage.getItem(ADV_KEY);
  if (saved !== null) advancedOpen.value = saved === "1";
} catch {}
function toggleAdvanced() {
  advancedOpen.value = !advancedOpen.value;
  try { localStorage.setItem(ADV_KEY, advancedOpen.value ? "1" : "0"); } catch {}
}

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
  { title: "Fecha", key: "sold_at", sortable: false, width: 160 },
  { title: "Cajero / Sucursal", key: "seller", sortable: false, width: 180 },
  { title: "Cliente", key: "customer", sortable: false, width: 200 },
  { title: "Producto", key: "product", sortable: false, width: 220 },
  { title: "Total", key: "total", sortable: false, width: 170 },
  { title: "Método", key: "method", sortable: false, width: 180 },
  { title: "Estado", key: "status", sortable: false, width: 120 },
  { title: "", key: "actions", sortable: false, width: 80 },
];

// ===== Active filters =====
const activeFilterChips = computed(() => {
  const chips = [];
  if (String(q.value || "").trim()) chips.push({ key: "q", label: `Buscar: "${q.value}"` });
  if (sellerId.value) {
    const s = sellerItems.value.find((x) => x.value === sellerId.value);
    chips.push({ key: "sellerId", label: `Cajero: ${s?.title || "#" + sellerId.value}` });
  }
  if (productPick.value) {
    const t = productPick.value?.title || String(productPick.value);
    chips.push({ key: "productPick", label: `Producto: ${t}` });
  }
  if (String(payMethod.value || "").trim()) {
    chips.push({ key: "payMethod", label: `Pago: ${methodLabel(payMethod.value)}` });
  }
  if (isAdmin.value && selectedBranchId.value) {
    const b = branchSelectItems.value.find((x) => x.value === selectedBranchId.value);
    chips.push({ key: "branch", label: `Suc: ${b?.title || "#" + selectedBranchId.value}` });
  }
  return chips;
});

// Cuenta solo filtros que viven en el bloque "Más filtros"
const activeAdvancedCount = computed(() => {
  let n = 0;
  if (sellerId.value) n++;
  if (productPick.value) n++;
  if (String(payMethod.value || "").trim()) n++;
  if (isAdmin.value && selectedBranchId.value) n++;
  if (from.value) n++;
  if (to.value) n++;
  return n;
});

const isToday = computed(() => {
  const t = formatLocalDate(new Date());
  return normalizeDate(from.value) === t && normalizeDate(to.value) === t;
});

function removeChip(key) {
  if (key === "q") q.value = "";
  if (key === "sellerId") sellerId.value = null;
  if (key === "productPick") productPick.value = null;
  if (key === "payMethod") payMethod.value = "";
  if (key === "branch") selectedBranchId.value = null;
  applyFiltersImmediate();
}

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
  return `${fn} ${ln}`.trim() || "";
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
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day, 0, 0, 0, 0).toISOString();
}
function toEndOfDay(dateStr) {
  const d = normalizeDate(dateStr);
  if (!d) return "";
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day, 23, 59, 59, 999).toISOString();
}
function safeJsonParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  const s = String(v || "").trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
function normStr(v) {
  return String(v || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}
function detectProviderCode(payment) {
  const p = payment || {};
  const ref = String(p.reference || p.ref || "").trim().toUpperCase();
  if (ref === "SJCREDIT" || ref === "SJ_CREDIT" || ref === "SANJUANCREDITO" || ref === "SANJUAN_CREDITO") return "credit_sjt";
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
  if (m1?.[1]) { const n = Number(m1[1]); return Number.isFinite(n) && n > 0 ? n : null; }
  const m2 = s.match(/ID\s*[:#]?\s*([0-9]{1,})/i);
  if (m2?.[1]) { const n = Number(m2[1]); return Number.isFinite(n) && n > 0 ? n : null; }
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
  return Math.max(0, (pickSaleItems(item)?.length || 0) - 1);
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
  return { ...p, method: resolvePaymentMethod(p) };
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
  return String(payment?.reference || "").trim();
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
  return arr.map((x) => {
    if (typeof x === "string") {
      const parsed = parseProductIdFromText(x);
      return { title: x, value: parsed ?? x, _raw: x };
    }
    const id = x?.value ?? x?.id ?? x?.user_id ?? x?.product_id ?? x?.customer_id ?? x?.seller_id ?? null;
    const title = x?.title ?? x?.name ?? x?.full_name ?? x?.label ?? x?.text ?? (id != null ? String(id) : "");
    const value = x?.value ?? (id != null ? Number(id) : title) ?? title;
    return { title: String(title || ""), value, _raw: x };
  }).filter((i) => i.title);
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
    for (const k of Object.keys(next)) { if (!alive.has(Number(k))) delete next[k]; }
    menuOpen.value = next;
  } catch (e) {
    toast(e?.response?.data?.message || e?.message || "Error");
  } finally {
    loading.value = false;
  }
}

function normKey(k) { return String(k || "").trim().toLowerCase().replace(/[^a-z0-9]/g, ""); }
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
    const toNum = (v) => { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; };
    const cash = sumKeys(source, ["cash", "CASH"]);
    const transfer = sumKeys(source, ["transfer", "TRANSFER"]);
    const card = sumKeys(source, ["card", "CARD"]);
    const mercadopago = sumKeys(source, ["mercadopago", "MERCADOPAGO", "mercado_pago", "mp", "MP", "qr", "QR"]);
    const credit_sjt = sumKeys(source, ["credit_sjt", "CREDIT_SJT", "creditsjt", "sjcredit", "sj_credit", "sjuancredito", "sanjuancredito"]);
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
      net_by_method: { cash, transfer, card, mercadopago, credit_sjt, other, raw_by_method: raw || {} },
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

const applyFiltersDebounced = debounce(() => { meta.value.page = 1; refreshAll(); }, 180);
function applyFilters() { applyFiltersDebounced(); }
function applyFiltersImmediate() { applyFiltersDebounced.cancel?.(); meta.value.page = 1; refreshAll(); }
onBeforeUnmount(() => { applyFiltersDebounced.cancel?.(); });

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
      if (data?.ok) { sellerItems.value = normalizeOptions(data.data || []); cacheSellers.value = sellerItems.value; }
      else sellerItems.value = localFilter(cacheSellers.value, qx);
    } catch { sellerItems.value = localFilter(cacheSellers.value, qx); }
    finally { sellerLoading.value = false; }
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
      if (data?.ok) { productItems.value = normalizeOptions(data.data || []); cacheProducts.value = productItems.value; }
      else productItems.value = localFilter(cacheProducts.value, qx);
    } catch { productItems.value = localFilter(cacheProducts.value, qx); }
    finally { productLoading.value = false; }
  }, 250);
}

function onBranchChanged() {
  sellerId.value = null;
  productPick.value = null;
  onSellerSearch("");
  onProductSearch("");
  applyFiltersImmediate();
}

function goDetail(id, tab = "") {
  const saleId = Number(id || 0);
  if (!Number.isFinite(saleId) || saleId <= 0) return toast("ID inválido");
  router.push({ name: "posSaleDetail", params: { id: saleId }, query: tab ? { tab } : {} });
}
function onRowClick(_, row) {
  const item = row?.item;
  if (!item) return;
  goDetail(item.id);
}
function closeMenu(id) { menuOpen.value = { ...(menuOpen.value || {}), [String(id)]: false }; }
function actView(id) { closeMenu(id); goDetail(id); }
function actRefund(id) { closeMenu(id); goDetail(id, "refunds"); }
function actExchange(id) { closeMenu(id); goDetail(id, "exchanges"); }

function todayISO() { return formatLocalDate(new Date()); }
function clearDates() { from.value = ""; to.value = ""; applyFiltersImmediate(); }
function setToday() { const t = todayISO(); from.value = t; to.value = t; applyFiltersImmediate(); }
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
  from.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
  to.value = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
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
function prevPage() { if (meta.value.page > 1) { meta.value.page--; refreshAll(); } }
function nextPage() { if (meta.value.page < meta.value.pages) { meta.value.page++; refreshAll(); } }
function toggleDense() { dense.value = !dense.value; }

async function copyText(txt) {
  try { if (!txt) return; await navigator.clipboard.writeText(txt); toast("Copiado"); }
  catch { toast("No se pudo copiar"); }
}

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
  const body = rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ventas_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const deletingId = ref(null);
const deleteDialog = ref({ show: false, sale: null });
function openDelete(item) { if (!isAdmin.value) return; deleteDialog.value = { show: true, sale: item }; }
async function deleteSaleConfirmed() {
  const id = getSaleId(deleteDialog.value.sale);
  if (!id) return toast("ID de venta inválido");
  deletingId.value = id;
  try {
    const { data } = await http.delete(`/pos/sales/${id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo anular");
    toast(data?.message || "Venta anulada. Stock restaurado.");
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
    try { await auth.fetchMe(); } catch {}
  }
  await loadBranchesIfAdmin();
  onSellerSearch("");
  onProductSearch("");
  refreshAll();
});
</script>

<style scoped>
/* ============================================================
   LIST PAGE — patrón estandarizado (lp-*)
   Compartido con ProductsListPage. Mantener sincronizado.
   ============================================================ */

.lp {
  --lp-gap: 14px;
  --lp-radius: 14px;
  --lp-radius-sm: 12px;
  --lp-card-pad: 16px;
  --lp-card-bg: rgb(var(--v-theme-surface));
  --lp-card-border: rgba(var(--v-border-color), var(--v-border-opacity));
  --lp-muted: rgba(var(--v-theme-on-surface), 0.55);
  --lp-strong: rgba(var(--v-theme-on-surface), 0.9);

  display: flex;
  flex-direction: column;
  gap: var(--lp-gap);
  min-width: 0;
}

/* ── HEADER ─────────────────────────────────────────────── */
.lp-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 4px 2px 0;
}
.lp-header__left  { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.lp-header__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.lp-title {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin: 0;
}
.lp-meta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--lp-muted);
}
.lp-meta__strong {
  font-weight: 800;
  color: var(--lp-strong);
  font-feature-settings: "tnum";
}
.lp-meta__sep { opacity: 0.4; }

/* ── STATS KPI ──────────────────────────────────────────── */
.lp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.lp-kpi {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-kpi__badge {
  width: 36px; height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  display: grid; place-items: center;
  margin-top: 2px;
}
.lp-kpi__badge--primary { background: rgb(var(--v-theme-primary)); }
.lp-kpi__badge--green   { background: rgb(var(--v-theme-success)); }
.lp-kpi__badge--orange  { background: var(--pos-kpi-color-1, #f57c00); }
.lp-kpi__badge--indigo  { background: var(--pos-kpi-color-2, #5c6bc0); }
.lp-kpi__body  { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.lp-kpi__lbl   {
  font-size: 11px; font-weight: 700;
  opacity: 0.5;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.lp-kpi__val   {
  font-size: 20px; font-weight: 900;
  line-height: 1.2;
  margin-top: 4px;
  font-feature-settings: "tnum";
}
.lp-kpi__sub   { font-size: 11px; opacity: 0.4; margin-top: 3px; }
.lp-kpi__skel  {
  height: 22px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  margin-top: 4px;
  animation: lp-pulse 1.4s ease infinite;
}
@keyframes lp-pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

/* ── METHOD CARDS ──────────────────────────────────────── */
.lp-methods {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.lp-mc {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: var(--lp-radius-sm);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}
.lp-mc__badge {
  width: 30px; height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
  display: grid; place-items: center;
}
.lp-mc__badge--cash     { background: rgb(var(--v-theme-success)); }
.lp-mc__badge--transfer { background: var(--pos-kpi-color-3, #9c27b0); }
.lp-mc__badge--card     { background: rgb(var(--v-theme-info)); }
.lp-mc__badge--mp       { background: var(--pos-kpi-color-1, #f57c00); }
.lp-mc__badge--sjt      { background: var(--pos-kpi-color-4, #009688); }
.lp-mc__badge--other    { background: rgba(var(--v-theme-on-surface), 0.35); }
.lp-mc__body { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.lp-mc__lbl  {
  font-size: 10px; font-weight: 700;
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.lp-mc__val  {
  font-size: 14px; font-weight: 900;
  margin-top: 2px;
  font-feature-settings: "tnum";
}

/* ── FILTER BAR ─────────────────────────────────────────── */
.lp-filters {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
}

.lp-filters__primary {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.lp-filters__search { flex: 1 1 280px; min-width: 220px; }
.lp-filters__search :deep(.v-field) { border-radius: 10px; }
.lp-filters__primary-field { flex: 0 0 160px; min-width: 140px; }

.lp-filters__presets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
  flex-shrink: 0;
}

.lp-filters__more {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  height: 38px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid var(--lp-card-border);
  color: rgba(var(--v-theme-on-surface), 0.78);
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background 0.14s, border-color 0.14s, color 0.14s;
  user-select: none;
}
.lp-filters__more:hover {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: var(--lp-strong);
}
.lp-filters__more--open {
  background: rgba(var(--v-theme-primary), 0.1);
  border-color: rgba(var(--v-theme-primary), 0.4);
  color: rgb(var(--v-theme-primary));
}
.lp-filters__more-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-size: 10.5px;
  font-weight: 900;
  line-height: 1;
  font-feature-settings: "tnum";
}
.lp-filters__more-chev {
  transition: transform 0.18s ease;
  opacity: 0.7;
}
.lp-filters__more--open .lp-filters__more-chev { transform: rotate(180deg); }

.lp-date-range {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.65);
  padding: 4px 0;
}
.lp-date-range__clear {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  margin-left: 4px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.lp-date-range__clear:hover {
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.3);
}

.lp-filters__advanced {
  padding-top: 4px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.lp-filters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px 12px;
  align-items: start;
  padding-top: 12px;
}
.lp-filters__cell { min-width: 0; }
.lp-filters__cell--per-page { max-width: 160px; }
.lp-filters__hint {
  margin-top: 8px;
  font-size: 11.5px;
  color: var(--lp-muted);
}

.lp-filters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.08);
}
.lp-filters__chip { font-size: 11px !important; }
.lp-filters__chips-clear {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  color: rgba(var(--v-theme-on-surface), 0.65);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.14s, color 0.14s, border-color 0.14s;
}
.lp-filters__chips-clear:hover {
  background: rgba(var(--v-theme-error), 0.08);
  color: rgb(var(--v-theme-error));
  border-color: rgba(var(--v-theme-error), 0.3);
}

/* ── CONTENT WRAPPER ───────────────────────────────────── */
.lp-content {
  border-radius: var(--lp-radius);
  background: var(--lp-card-bg);
  border: 1px solid var(--lp-card-border);
  overflow: hidden;
}
.lp-content__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--lp-card-border);
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.lp-content__head-left { display: flex; align-items: center; gap: 8px; }
.lp-content__title { font-size: 13px; font-weight: 800; letter-spacing: 0.01em; }
.lp-content__body { padding: 12px; transition: opacity 0.2s; }
.lp-content__body--flush { padding: 0; }
.lp-content__body--loading { opacity: 0.7; pointer-events: none; }

/* ── PAGINATION ─────────────────────────────────────────── */
.lp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 4px 6px 8px;
}
.lp-pagination__info {
  font-size: 12px;
  font-weight: 600;
  color: var(--lp-muted);
  font-feature-settings: "tnum";
}

/* ============================================================
   VENTAS — específico (data-table cells)
   ============================================================ */
.vp-table { background: transparent; }
.vp-date   { font-size: 13px; font-weight: 700; }
.vp-id     { font-size: 11px; opacity: 0.45; font-family: monospace; }
.vp-bold   { font-size: 13px; font-weight: 700; }
.vp-sub    { font-size: 11px; opacity: 0.5; }
.vp-amount { font-size: 14px; font-weight: 900; font-feature-settings: "tnum"; }

.vp-pay-row  { display: flex; align-items: center; gap: 6px; }
.vp-pay-chip { font-size: 11px !important; }
.vp-cuotas {
  font-size: 11px; font-weight: 900;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  padding: 1px 6px; border-radius: 999px;
}
.vp-extra-pays { font-size: 11px; font-weight: 700; opacity: 0.55; }
.vp-ref { font-family: monospace; font-size: 10px; }

.vp-actions { display: flex; gap: 4px; align-items: center; }

/* ── RESPONSIVE ─────────────────────────────────────────── */
@media (max-width: 1200px) {
  .lp-methods { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 960px) {
  .lp { gap: 12px; }
  .lp-stats   { grid-template-columns: repeat(2, 1fr); }
  .lp-methods { grid-template-columns: repeat(3, 1fr); }
  .lp-filters { padding: 10px 12px; }
}
@media (max-width: 600px) {
  .lp-title { font-size: 18px; }
  .lp-stats   { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .lp-methods { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .lp-kpi__val { font-size: 16px; }
  .lp-kpi__badge { width: 30px; height: 30px; }
  .lp-mc__val  { font-size: 13px; }
  .lp-filters__primary-field { flex: 0 0 100%; }
  .lp-filters__presets { width: 100%; justify-content: flex-start; }
}

/* ── ANULAR DIALOG ─────────────────────────────────────── */
.anular-dlg__head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 12px;
}
.anular-dlg__icon-wrap {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: rgba(var(--v-theme-error), .1);
  flex-shrink: 0;
}
.anular-dlg__eyebrow {
  margin: 0;
  font-size: 11px; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), .5);
}
.anular-dlg__title {
  margin: 2px 0 0;
  font-size: 18px; font-weight: 800; line-height: 1.1;
}
.anular-dlg__body {
  padding: 4px 18px 14px;
  display: grid;
  gap: 8px;
}
.anular-dlg__info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), .03);
  border: 1px solid rgba(var(--v-theme-on-surface), .06);
  font-size: 13px;
  line-height: 1.4;
}
.anular-dlg__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 18px 16px;
}
</style>
