<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/pages/PosSaleDetailPage.vue -->
<template>
  <v-container fluid class="pos-sale-detail pa-4 pa-md-6">
    <!-- Header -->
    <div class="page-head">
      <div>
        <div class="page-kicker">Detalle de venta</div>
        <div class="page-title">Venta #{{ sale?.id ?? id }}</div>
        <div v-if="sale" class="page-subtitle">
          {{ dt(sale.sold_at || sale.created_at) }}
        </div>
      </div>

      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip
          v-if="sale?.status"
          size="small"
          variant="flat"
          :color="statusColor(sale.status)"
          class="font-weight-bold"
        >
          {{ statusLabel(sale.status) }}
        </v-chip>

        <v-btn variant="tonal" class="rounded-lg" @click="$router.back()">
          <v-icon start>mdi-arrow-left</v-icon>
          Volver
        </v-btn>
      </div>
    </div>

    <v-card class="main-shell rounded-2xl elevation-0">
      <v-card-text v-if="loading" class="py-16 d-flex justify-center">
        <v-progress-circular indeterminate size="38" width="4" />
      </v-card-text>

      <v-card-text v-else-if="!sale">
        <v-alert type="warning" variant="tonal" class="rounded-xl">
          Venta no encontrada.
        </v-alert>
      </v-card-text>

      <v-card-text v-else class="pa-3 pa-md-5">
        <!-- HERO -->
        <section class="hero-grid">
          <!-- Cliente -->
          <article class="soft-panel">
            <div class="panel-title mb-4">
              <v-icon size="18" class="mr-2">mdi-account-circle-outline</v-icon>
              Cliente
            </div>

            <div class="hero-customer-name">
              {{ customerNameResolved }}
            </div>

            <div v-if="showCustomerDataBlock" class="mt-4">
              <div class="info-label mb-2">Datos del cliente</div>

              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-if="customerDocResolved"
                  size="small"
                  variant="outlined"
                  class="detail-chip"
                >
                  <v-icon start size="16">mdi-card-account-details-outline</v-icon>
                  {{ customerDocResolved }}
                </v-chip>

                <v-chip
                  v-if="customerPhoneResolved"
                  size="small"
                  variant="outlined"
                  class="detail-chip"
                >
                  <v-icon start size="16">mdi-phone</v-icon>
                  {{ customerPhoneResolved }}
                </v-chip>
              </div>
            </div>

            <div v-else class="mt-4">
              <div class="info-label mb-1">Datos del cliente</div>
              <div class="hero-muted">
                Esta venta no guardó documento ni teléfono.
              </div>
            </div>

            <div v-if="sale.note" class="mt-4">
              <div class="info-label mb-1">Nota</div>
              <div class="info-value">
                {{ sale.note }}
              </div>
            </div>
          </article>

          <!-- Venta -->
          <article class="soft-panel">
            <div class="panel-title mb-4">
              <v-icon size="18" class="mr-2">mdi-receipt-text-outline</v-icon>
              Venta
            </div>

            <div class="info-grid sale-info-grid">
              <div class="info-item">
                <div class="info-label">Fecha</div>
                <div class="info-value">{{ dt(sale.sold_at || sale.created_at) }}</div>
              </div>

              <div v-if="branchLabelResolved" class="info-item">
                <div class="info-label">Sucursal</div>
                <div class="info-value">{{ branchLabelResolved }}</div>
              </div>

              <div v-if="userLabel(sale) !== '—'" class="info-item">
                <div class="info-label">Usuario</div>
                <div class="info-value">{{ userLabel(sale) }}</div>
              </div>

              <div v-if="sale?.status" class="info-item">
                <div class="info-label">Estado</div>
                <div class="info-value">
                  <v-chip
                    size="small"
                    variant="flat"
                    :color="statusColor(sale.status)"
                    class="font-weight-bold"
                  >
                    {{ statusLabel(sale.status) }}
                  </v-chip>
                </div>
              </div>
            </div>

            <div class="total-top mt-6">
              <div>
                <div class="total-kicker">Total venta</div>
                <div class="total-main">{{ money(sale.total) }}</div>
              </div>

              <div class="text-right">
                <div class="hero-muted">Pagado</div>
                <div class="text-h6 font-weight-black">{{ money(sale.paid_total) }}</div>
              </div>
            </div>

            <div class="money-breakdown mt-5">
              <div v-if="hasValue(sale.subtotal)" class="money-row">
                <span>Subtotal</span>
                <strong>{{ money(sale.subtotal) }}</strong>
              </div>

              <div v-if="Number(sale.discount_total || 0) > 0" class="money-row">
                <span>Descuento</span>
                <strong>{{ money(sale.discount_total) }}</strong>
              </div>

              <div v-if="Number(sale.tax_total || 0) > 0" class="money-row">
                <span>Impuestos</span>
                <strong>{{ money(sale.tax_total) }}</strong>
              </div>

              <div v-if="Number(sale.change_total || 0) > 0" class="money-row">
                <span>Vuelto</span>
                <strong>{{ money(sale.change_total) }}</strong>
              </div>
            </div>

            <v-divider v-if="showNetSummary" class="my-4" />

            <div v-if="showNetSummary" class="mini-stats-grid">
              <div v-if="refundsTotal > 0" class="mini-stat-card">
                <div class="mini-stat-label">Devuelto</div>
                <div class="mini-stat-value">{{ money(refundsTotal) }}</div>
              </div>

              <div v-if="exchangesDiffTotal !== 0" class="mini-stat-card">
                <div class="mini-stat-label">Dif. cambios</div>
                <div class="mini-stat-value">{{ money(exchangesDiffTotal) }}</div>
              </div>

              <div class="mini-stat-card mini-stat-card--accent">
                <div class="mini-stat-label">Neto</div>
                <div class="mini-stat-value">{{ money(netTotal) }}</div>
              </div>
            </div>
          </article>
        </section>

        <!-- PRODUCTOS -->
        <section class="section-block">
          <div class="section-head">
            <div>
              <div class="section-title">Productos</div>
              <div class="section-subtitle">
                {{ (sale.items || []).length }} item{{ (sale.items || []).length === 1 ? "" : "s" }}
              </div>
            </div>

            <v-chip size="small" variant="tonal" :color="productsLoading ? 'indigo' : 'grey'">
              <v-progress-circular
                v-if="productsLoading"
                indeterminate
                size="14"
                width="2"
                class="mr-2"
              />
              {{ productsLoading ? "Cargando productos…" : "Productos listos" }}
            </v-chip>
          </div>

          <div class="table-wrap">
            <v-data-table
              :headers="itemsHeaders"
              :items="sale.items || []"
              item-key="id"
              class="products-table"
              density="comfortable"
            >
              <template #item.product="{ item }">
                <div class="product-cell">
                  <v-avatar size="58" rounded="lg" class="thumb" @click="openImage(item)">
                    <v-img v-if="itemImage(item)" :src="itemImage(item)" cover />
                    <v-icon v-else>mdi-image-off-outline</v-icon>
                  </v-avatar>

                  <div class="min-w-0 flex-1">
                    <div class="d-flex align-center justify-space-between ga-3 flex-wrap">
                      <div class="product-name text-truncate">
                        {{ productName(item) }}
                      </div>

                      <v-chip
                        v-if="availabilityLabel(item) !== '—'"
                        size="x-small"
                        variant="flat"
                        :color="availabilityColor(item)"
                        class="font-weight-bold"
                        title="Disponibilidad según stock actual"
                      >
                        {{ availabilityLabel(item) }}
                      </v-chip>
                    </div>

                    <div v-if="productMetaLine(item)" class="product-meta mt-1">
                      {{ productMetaLine(item) }}
                    </div>

                    <div
                      v-if="productChips(item).length"
                      class="d-flex flex-wrap ga-1 mt-2"
                    >
                      <v-chip
                        v-for="chip in productChips(item)"
                        :key="chip.text"
                        size="x-small"
                        :variant="chip.variant || 'outlined'"
                        :color="chip.color || undefined"
                        class="detail-chip"
                      >
                        <template v-if="chip.icon" #prepend>
                          <v-icon size="15">{{ chip.icon }}</v-icon>
                        </template>
                        {{ chip.text }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </template>

              <template #item.stock="{ item }">
                <div class="text-right font-weight-black">
                  {{ stockText(item) }}
                </div>
              </template>

              <template #item.qty="{ item }">
                <div class="font-weight-black">{{ number(item.quantity) }}</div>
              </template>

              <template #item.unit="{ item }">
                <div class="font-weight-bold">{{ money(item.unit_price) }}</div>
              </template>

              <template #item.total="{ item }">
                <div class="font-weight-black">{{ money(item.line_total) }}</div>
              </template>

              <template #item.actions="{ item }">
                <div class="d-flex ga-2 justify-end">
                  <v-btn size="small" variant="tonal" color="primary" @click="goToProduct(item.product_id)">
                    <v-icon start>mdi-cube-outline</v-icon>
                    Perfil
                  </v-btn>
                </div>
              </template>

              <template #bottom />
            </v-data-table>
          </div>
        </section>

        <!-- PAGOS -->
        <section class="section-block">
          <div class="section-head">
            <div>
              <div class="section-title">Pagos</div>
              <div class="section-subtitle">
                Método y detalle real de cobro
              </div>
            </div>

            <v-chip size="small" variant="flat" color="primary" class="font-weight-bold">
              {{ paymentsResolved.length }} registro{{ paymentsResolved.length === 1 ? "" : "s" }}
            </v-chip>
          </div>

          <div v-if="paymentsResolved.length" class="payments-stack">
            <v-card
              v-for="p in paymentsResolved"
              :key="p.id"
              class="payment-card payment-card--single rounded-2xl elevation-0"
            >
              <v-card-text class="pa-4 pa-md-5">
                <div class="payment-top">
                  <div class="payment-top-left">
                    <div class="d-flex align-center ga-2 flex-wrap">
                      <v-chip
                        size="small"
                        variant="flat"
                        :color="payColor(p.method_resolved)"
                        class="font-weight-bold"
                      >
                        {{ methodLabel(p.method_resolved) }}
                      </v-chip>

                      <v-chip
                        v-if="p.card_type_label"
                        size="small"
                        variant="outlined"
                        class="detail-chip"
                      >
                        {{ p.card_type_label }}
                      </v-chip>

                      <v-chip
                        v-if="p.card_brand"
                        size="small"
                        variant="outlined"
                        class="detail-chip"
                      >
                        Marca: {{ p.card_brand }}
                      </v-chip>
                    </div>

                    <div class="payment-title mt-3">
                      {{ paymentHeadline(p) }}
                    </div>

                    <div v-if="paymentSubline(p).length" class="payment-subline mt-1">
                      <span
                        v-for="part in paymentSubline(p)"
                        :key="part"
                      >
                        {{ part }}
                      </span>
                    </div>
                  </div>

                  <div class="payment-amount-box">
                    <div class="payment-amount-label">Monto cobrado</div>
                    <div class="payment-amount-value">{{ money(p.amount) }}</div>
                  </div>
                </div>

                <div
                  v-if="paymentFacts(p).length"
                  class="payment-facts-grid mt-4"
                >
                  <div
                    v-for="fact in paymentFacts(p)"
                    :key="fact.label"
                    class="fact-card"
                  >
                    <div class="fact-label">{{ fact.label }}</div>
                    <div class="fact-value">{{ fact.value }}</div>
                  </div>
                </div>

                <div v-if="p.note_human" class="payment-note mt-4">
                  <div class="fact-label mb-1">Nota</div>
                  <div class="fact-value">{{ p.note_human }}</div>
                </div>
              </v-card-text>
            </v-card>
          </div>

          <v-alert v-else type="info" variant="tonal" class="rounded-xl mt-2">
            Sin pagos registrados.
          </v-alert>
        </section>

        <!-- DEVOLUCIONES -->
        <section class="section-block">
          <div class="section-head">
            <div>
              <div class="section-title">Devoluciones</div>
              <div class="section-subtitle">Reintegros asociados a la venta</div>
            </div>

            <v-chip size="small" variant="flat" color="orange" class="font-weight-bold">
              {{ refunds.length }}
            </v-chip>
          </div>

          <v-alert v-if="!refunds.length" type="info" variant="tonal" class="rounded-xl">
            No hay devoluciones registradas para esta venta.
          </v-alert>

          <div v-else class="d-flex flex-column ga-3">
            <v-card v-for="r in refunds" :key="r.id" class="soft-subcard rounded-xl elevation-0">
              <v-card-text>
                <div class="d-flex align-center justify-space-between flex-wrap ga-3">
                  <div>
                    <div class="info-label">Fecha</div>
                    <div class="info-value">{{ dt(r.created_at) }}</div>
                  </div>

                  <v-chip size="small" variant="flat" color="orange" class="font-weight-bold">
                    {{ money(r.amount) }}
                  </v-chip>
                </div>

                <div class="hero-muted mt-3">
                  Medio: <b>{{ methodLabel(resolveMethodFromRefund(r)) }}</b>
                  <span v-if="r.reference"> · Ref: <b>{{ r.reference }}</b></span>
                </div>

                <div v-if="r.reason" class="hero-muted mt-1">
                  Motivo: {{ r.reason }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </section>

        <!-- CAMBIOS -->
        <section class="section-block">
          <div class="section-head">
            <div>
              <div class="section-title">Cambios</div>
              <div class="section-subtitle">Movimientos por reemplazo de productos</div>
            </div>

            <v-chip size="small" variant="flat" color="cyan" class="font-weight-bold">
              {{ exchanges.length }}
            </v-chip>
          </div>

          <v-alert v-if="!exchanges.length" type="info" variant="tonal" class="rounded-xl">
            No hay cambios registrados para esta venta.
          </v-alert>

          <div v-else class="d-flex flex-column ga-3">
            <v-card v-for="x in exchanges" :key="x.id" class="soft-subcard rounded-xl elevation-0">
              <v-card-text>
                <div class="d-flex align-center justify-space-between flex-wrap ga-3">
                  <div>
                    <div class="info-label">Fecha</div>
                    <div class="info-value">{{ dt(x.created_at) }}</div>
                  </div>

                  <v-chip size="small" variant="flat" color="cyan" class="font-weight-bold">
                    Dif: {{ money(x.diff) }}
                  </v-chip>
                </div>

                <div class="hero-muted mt-3">
                  Original: <b>{{ money(x.original_total) }}</b>
                  <span class="mx-1">·</span>
                  Nuevo: <b>{{ money(x.new_total) }}</b>
                  <span class="mx-1">·</span>
                  Devuelto: <b>{{ money(x.returned_amount) }}</b>
                </div>

                <div v-if="x.note" class="hero-muted mt-1">
                  Nota: {{ x.note }}
                </div>
              </v-card-text>
            </v-card>
          </div>
        </section>
      </v-card-text>
    </v-card>

    <!-- Dialog imagen -->
    <v-dialog v-model="imageDialog" max-width="860">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="font-weight-black">{{ productName(imageItem) }}</div>
          <v-btn icon variant="text" @click="imageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-img
            v-if="itemImage(imageItem)"
            :src="itemImage(imageItem)"
            cover
            style="max-height:540px; border-radius: 14px;"
          />

          <v-alert v-else type="info" variant="tonal" class="rounded-xl">
            Este producto no tiene imagen asociada.
          </v-alert>

          <div class="d-flex ga-2 mt-4 flex-wrap">
            <v-btn
              variant="tonal"
              color="primary"
              @click="goToProduct(imageItem?.product_id)"
              :disabled="!imageItem?.product_id"
            >
              <v-icon start>mdi-cube-outline</v-icon>
              Ver producto
            </v-btn>

            <v-btn
              variant="tonal"
              @click="copyText(itemImage(imageItem) || '')"
              :disabled="!itemImage(imageItem)"
            >
              <v-icon start>mdi-link-variant</v-icon>
              Copiar URL
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useProductsStore } from "../../../app/store/products.store";

const route = useRoute();
const router = useRouter();
const productsStore = useProductsStore();

const id = computed(() => Number(route.params.id || 0));
const loading = ref(false);

const payload = ref(null);
const sale = computed(() => payload.value?.sale || null);

const refunds = computed(() => (Array.isArray(payload.value?.refunds) ? payload.value.refunds : []));
const exchanges = computed(() => (Array.isArray(payload.value?.exchanges) ? payload.value.exchanges : []));

const refundsTotal = computed(() => refunds.value.reduce((a, r) => a + Number(r?.amount || 0), 0));
const exchangesDiffTotal = computed(() => exchanges.value.reduce((a, x) => a + Number(x?.diff || 0), 0));
const netTotal = computed(() => Number(sale.value?.total || 0) - refundsTotal.value + exchangesDiffTotal.value);
const showNetSummary = computed(() => refundsTotal.value > 0 || exchangesDiffTotal.value !== 0);

const snack = ref({ show: false, text: "" });

const imageDialog = ref(false);
const imageItem = ref(null);

const productsLoading = ref(false);

const itemsHeaders = [
  { title: "Producto", key: "product", sortable: false },
  { title: "Stock", key: "stock", sortable: false, width: 110, align: "end" },
  { title: "Cant.", key: "qty", sortable: false, width: 110 },
  { title: "Unit.", key: "unit", sortable: false, width: 160 },
  { title: "Total", key: "total", sortable: false, width: 160 },
  { title: "", key: "actions", sortable: false, width: 140 },
];

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

function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function hasValue(v) {
  return v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
}

function detectProviderCode(payment) {
  const p = payment || {};
  const refU = String(p.reference || p.ref || "").trim().toUpperCase();
  if (refU === "SJCREDIT" || refU === "SJ_CREDIT" || refU === "SANJUANCREDITO" || refU === "SANJUAN_CREDITO") return "credit_sjt";
  if (refU === "MERCADOPAGO" || refU === "MP") return "mercadopago";

  const noteObj = safeJsonParse(p.note);
  const c2 = normStr(noteObj?.provider_code || noteObj?.providerCode || noteObj?.provider || noteObj?.code || "");
  if (c2) return c2;

  const noteTxt = String(p.note || "").toLowerCase();
  if (noteTxt.includes("credit_sjt") || noteTxt.includes("sjcredit") || noteTxt.includes("sanjuancredito")) return "credit_sjt";
  if (noteTxt.includes("mercadopago") || noteTxt.includes("mp")) return "mercadopago";

  return "";
}

function resolvePaymentMethod(payment) {
  const p = payment || {};
  const up = String(p.method || "").trim().toUpperCase();
  const prov = detectProviderCode(p);

  if (prov === "credit_sjt") return "CREDIT_SJT";
  if (up === "CREDIT_SJT" || up === "CREDIT_SJ" || up === "SJCREDIT") return "CREDIT_SJT";

  if (prov === "mercadopago") return "MERCADOPAGO";
  if (up === "QR") return "MERCADOPAGO";
  if (up === "MERCADOPAGO") return "MERCADOPAGO";

  if (up === "CASH") return "CASH";
  if (up === "CARD") return "CARD";
  if (up === "TRANSFER") return "TRANSFER";
  if (up === "OTHER") return "OTHER";

  return up || "OTHER";
}

function extractPaymentDetails(payment) {
  const p = payment || {};
  const noteObj = safeJsonParse(p.note) || null;
  const raw = noteObj || {};

  const cardTypeRaw = String(
    raw.card_type || raw.cardType || raw.type || raw.card_kind || raw.cardKind || ""
  )
    .trim()
    .toUpperCase();

  const cardBrand = String(raw.brand || raw.card_brand || raw.cardBrand || raw.network || "").trim() || "";

  const installments =
    p.installments != null ? Number(p.installments || 1) :
    raw.installments != null ? Number(raw.installments || 1) :
    raw.cuotas != null ? Number(raw.cuotas || 1) :
    1;

  const listTotal =
    numOrNull(raw.list_total) ??
    numOrNull(raw.listTotal) ??
    numOrNull(raw.total_list) ??
    numOrNull(raw.totalList);

  let installmentAmount = null;

  if (listTotal != null && Number(installments || 1) > 1) {
    installmentAmount = listTotal / Number(installments || 1);
  } else {
    installmentAmount =
      numOrNull(raw.per_installment_list) ??
      numOrNull(raw.perInstallmentList) ??
      numOrNull(raw.installment_amount) ??
      numOrNull(raw.installmentAmount) ??
      numOrNull(raw.valor_cuota) ??
      numOrNull(raw.valorCuota);
  }

  const totalWithFee =
    numOrNull(raw.total_with_fee) ??
    numOrNull(raw.totalWithFee) ??
    numOrNull(raw.total_financiado);

  const priceBasis = String(raw.price_basis || raw.priceBasis || "").trim().toUpperCase() || "";
  const priceBasisLabel =
    priceBasis === "LIST" ? "Precio lista" :
    priceBasis === "DISCOUNT" ? "Descuento" :
    priceBasis === "RESELLER" ? "Revendedor" :
    "";

  const providerCode = detectProviderCode(p);
  const providerLabel =
    providerCode === "mercadopago" ? "Mercado Pago" :
    providerCode === "credit_sjt" ? "Crédito SJ" :
    providerCode ? providerCode : "";

  const rawNoteHuman = noteObj
    ? String(raw.note || raw.message || "").trim()
    : String(p.note || "").trim();

  const noteHuman =
    rawNoteHuman &&
    rawNoteHuman !== "{}" &&
    rawNoteHuman !== "null" &&
    !rawNoteHuman.startsWith("{")
      ? rawNoteHuman
      : "";

  return {
    card_type: cardTypeRaw === "DEBIT" || cardTypeRaw === "CREDIT" ? cardTypeRaw : "",
    card_type_label:
      cardTypeRaw === "DEBIT" ? "Débito" :
      cardTypeRaw === "CREDIT" ? "Crédito" :
      "",
    card_brand: cardBrand,
    installments: Number.isFinite(installments) && installments > 0 ? installments : 1,
    installment_amount: installmentAmount,
    list_total: listTotal,
    total_with_fee: totalWithFee,
    provider_label: providerLabel,
    price_basis: priceBasis,
    price_basis_label: priceBasisLabel,
    note_human: noteHuman,
  };
}

const paymentsResolved = computed(() => {
  const arr = Array.isArray(sale.value?.payments) ? sale.value.payments : [];
  return arr.map((p) => {
    const method_resolved = resolvePaymentMethod(p);
    const det = extractPaymentDetails(p);

    return {
      ...p,
      method_resolved,
      ...det,
      installments: det.installments || Number(p?.installments || 1) || 1,
    };
  });
});

const customerObj = computed(() => sale.value?.customer || sale.value?.Customer || null);

const customerNameResolved = computed(() => {
  const s = sale.value || {};
  const c = customerObj.value || {};
  const name =
    s.customer_name ||
    s.customerName ||
    c.name ||
    c.full_name ||
    c.fullName ||
    [c.first_name, c.last_name].filter(Boolean).join(" ") ||
    [c.firstName, c.lastName].filter(Boolean).join(" ");

  const n = String(name || "").trim();
  if (n) return n;

  const cid = Number(s.customer_id || c.id || 0);
  return cid ? `Cliente #${cid}` : "Consumidor Final";
});

const customerDocResolved = computed(() => {
  const s = sale.value || {};
  return String(s.customer_doc || s.customerDoc || "").trim() || "";
});

const customerPhoneResolved = computed(() => {
  const s = sale.value || {};
  return String(s.customer_phone || s.customerPhone || "").trim() || "";
});

const showCustomerDataBlock = computed(() => {
  return !!(
    customerDocResolved.value ||
    customerPhoneResolved.value
  );
});

const branchLabelResolved = computed(() => {
  const s = sale.value || {};
  return String(s.branch?.name || s.branch_name || s.branch_id || "").trim() || "";
});

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  return val ? new Date(val).toLocaleString("es-AR") : "—";
}
function number(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}
function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "MERCADOPAGO") return "Mercado Pago";
  if (x === "CREDIT_SJT") return "San Juan Crédito";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "CARD") return "indigo";
  if (x === "TRANSFER") return "purple";
  if (x === "MERCADOPAGO") return "orange";
  if (x === "CREDIT_SJT") return "teal";
  return "grey";
}
function statusLabel(s) {
  const x = String(s || "").toUpperCase();
  if (x === "PAID") return "Pagada";
  if (x === "CANCELLED") return "Cancelada";
  if (x === "REFUNDED") return "Reintegrada";
  if (x === "DRAFT") return "Borrador";
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
function userLabel(s) {
  const u = s?.user || null;
  return u?.name || u?.full_name || u?.email || u?.username || (s?.user_id ? `#${s.user_id}` : "—");
}

function paymentBaseText(p) {
  if (p?.price_basis_label) return p.price_basis_label;
  if (String(p?.method_resolved || "").toUpperCase() === "CREDIT_SJT") return "Precio lista";
  return "";
}

function paymentInstallmentText(p) {
  const installments = Number(p?.installments || 1);
  if (installments <= 1) return "";

  const listTotal = Number(p?.list_total ?? NaN);
  if (Number.isFinite(listTotal) && listTotal > 0) {
    return money(listTotal / installments);
  }

  const installmentAmount = Number(p?.installment_amount ?? NaN);
  if (Number.isFinite(installmentAmount) && installmentAmount > 0) {
    return money(installmentAmount);
  }

  return "";
}

function paymentHeadline(p) {
  const method = String(p?.method_resolved || "").toUpperCase();
  const installments = Number(p?.installments || 1);
  const cuota = paymentInstallmentText(p);

  if (method === "CREDIT_SJT") {
    if (installments <= 1) return "Pagado en 1 cuota (Crédito SJ)";
    if (cuota) return `Pagado en ${installments} cuotas de ${cuota} (Crédito SJ)`;
    return `Pagado en ${installments} cuotas (Crédito SJ)`;
  }

  if (method === "CARD") {
    if (installments <= 1) return "Pagado en 1 pago con tarjeta";
    if (cuota) return `Pagado en ${installments} cuotas de ${cuota} con tarjeta`;
    return `Pagado en ${installments} cuotas con tarjeta`;
  }

  if (method === "TRANSFER") return "Pagado por transferencia";
  if (method === "MERCADOPAGO") return "Pagado con Mercado Pago";
  if (method === "CASH") return "Pagado en efectivo";
  return methodLabel(method);
}

function paymentSubline(p) {
  const arr = [];
  if (p?.paid_at) arr.push(`Fecha: ${dt(p.paid_at)}`);
  if (p?.reference) arr.push(`Ref: ${p.reference}`);
  return arr;
}

function paymentFacts(p) {
  const out = [];

  out.push({ label: "Método", value: methodLabel(p.method_resolved) });

  if (Number(p.installments || 1) <= 1) {
    out.push({ label: "Cuotas", value: "1 cuota" });
  } else {
    out.push({ label: "Cuotas", value: `${p.installments} cuotas` });
  }

  const cuota = paymentInstallmentText(p);
  if (cuota) {
    out.push({ label: "Valor cuota", value: cuota });
  }

  const base = paymentBaseText(p);
  if (base) {
    out.push({ label: "Base cálculo", value: base });
  }

  if (p.list_total != null) {
    out.push({ label: "Total lista", value: money(p.list_total) });
  }

  if (p.total_with_fee != null) {
    out.push({ label: "Total financiado", value: money(p.total_with_fee) });
  }

  return out;
}

function resolveMethodFromRefund(r) {
  const up = String(r?.refund_method || r?.method || "").toUpperCase();
  if (up === "QR") return "MERCADOPAGO";
  if (up === "MERCADOPAGO") return "MERCADOPAGO";
  if (up === "CREDIT_SJT" || up === "SJCREDIT") return "CREDIT_SJT";
  return up || "OTHER";
}

function p(item) {
  return item?.product || null;
}
function pidOf(item) {
  const pid = Number(item?.product_id || item?.productId || p(item)?.id || 0);
  return Number.isFinite(pid) ? pid : 0;
}
function productName(item) {
  return (
    item?.product_name_snapshot ||
    p(item)?.name ||
    p(item)?.title ||
    p(item)?.product_name ||
    (pidOf(item) ? `Producto #${pidOf(item)}` : "Producto")
  );
}
function productSku(item) {
  const prod = p(item) || {};
  const v =
    item?.product_sku_snapshot ||
    prod?.sku ||
    prod?.SKU ||
    prod?.code ||
    prod?.product_code ||
    prod?.internal_code ||
    prod?.codigo ||
    prod?.barcode ||
    prod?.ean ||
    prod?.gtin ||
    null;

  const s = v ? String(v).trim() : "";
  return s || "";
}
function productBrand(item) {
  const v = p(item)?.brand || p(item)?.marca || "";
  const s = v ? String(v).trim() : "";
  return s || "";
}
function productModel(item) {
  const v = p(item)?.model || p(item)?.modelo || "";
  const s = v ? String(v).trim() : "";
  return s || "";
}
function barcodeLabel(item) {
  const prod = p(item) || {};
  const v = prod?.barcode || prod?.ean || prod?.gtin || prod?.codigo_barra || "";
  const s = v ? String(v).trim() : "";
  return s || "";
}
function warehouseLabel(item) {
  return item?.warehouse?.name || (item?.warehouse_id ? `#${item.warehouse_id}` : "");
}
function categoryLabel(item) {
  const prod = p(item) || {};
  const cat = prod?.category || null;
  if (cat?.name) {
    const parent = cat?.parent?.name ? ` / ${cat.parent.name}` : "";
    return `${cat.name}${parent}`;
  }
  const cid = Number(prod?.category_id || prod?.subcategory_id || prod?.categoryId || 0) || null;
  return cid ? `#${cid}` : "";
}

function productMetaLine(item) {
  const parts = [];
  const sku = productSku(item);
  const brand = productBrand(item);
  const model = productModel(item);

  if (sku) parts.push(`SKU: ${sku}`);
  if (brand) parts.push(`Marca: ${brand}`);
  if (model) parts.push(`Modelo: ${model}`);

  return parts.join(" · ");
}

function productChips(item) {
  const out = [];
  const cat = categoryLabel(item);
  const wh = warehouseLabel(item);
  const stock = stockText(item);
  const barcode = barcodeLabel(item);

  if (cat) out.push({ text: `Cat: ${cat}`, variant: "outlined" });
  if (wh) out.push({ text: `Depósito: ${wh}`, variant: "outlined" });
  if (stock !== "—") out.push({ text: `Stock: ${stock}`, variant: "flat", color: stockChipColor(item) });
  if (barcode) out.push({ text: barcode, variant: "outlined", icon: "mdi-barcode" });

  return out;
}

const imageById = ref({});
const imgLoading = ref({});

function pickUrlFromImageRow(row) {
  if (!row) return "";
  return row.url || row.public_url || row.publicUrl || row.image_url || row.path || row.key || row.location || row.filename || "";
}
function normalizeUrl(u) {
  if (!u) return "";
  const s = String(u);
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  const apiBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  if (apiBase && s.startsWith("/")) return apiBase + s;

  const s3Base = (import.meta.env.VITE_S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (s3Base) return s3Base + (s.startsWith("/") ? s : `/${s}`);

  return s;
}
function pickImageFromProduct(prod) {
  const direct =
    prod?.main_image_url ||
    prod?.image_url ||
    prod?.image ||
    prod?.thumb_url ||
    prod?.thumbnail_url ||
    prod?.public_url ||
    prod?.publicUrl ||
    null;

  if (direct) return normalizeUrl(direct);

  const arr = Array.isArray(prod?.images)
    ? prod.images
    : Array.isArray(prod?.product_images)
      ? prod.product_images
      : null;

  if (arr?.length) {
    const u = pickUrlFromImageRow(arr[0]);
    if (u) return normalizeUrl(u);
  }
  return "";
}

async function fetchFirstImageViaStore(productId) {
  const pid = Number(productId || 0);
  if (!pid) return "";

  if (imageById.value[pid] !== undefined) return imageById.value[pid] || "";
  if (imgLoading.value[pid]) return "";

  imgLoading.value = { ...imgLoading.value, [pid]: true };
  try {
    const imgs = await productsStore.fetchImages(pid);
    const arr = Array.isArray(imgs) ? imgs : [];
    const u = pickUrlFromImageRow(arr[0] || null);
    const finalUrl = u ? normalizeUrl(u) : "";
    imageById.value = { ...imageById.value, [pid]: finalUrl };
    return finalUrl;
  } catch {
    imageById.value = { ...imageById.value, [pid]: "" };
    return "";
  } finally {
    const next = { ...imgLoading.value };
    delete next[pid];
    imgLoading.value = next;
  }
}

function itemImage(item) {
  const prod = p(item) || {};
  const pid = pidOf(item);
  if (!pid) return "";

  const fromObj = pickImageFromProduct(prod);
  if (fromObj) {
    if (imageById.value[pid] !== fromObj) imageById.value = { ...imageById.value, [pid]: fromObj };
    return fromObj;
  }

  if (imageById.value[pid] !== undefined) return imageById.value[pid] || "";
  fetchFirstImageViaStore(pid);
  return "";
}

function stockQty(item) {
  const prod = p(item) || {};
  const q =
    prod?.qty ??
    prod?.stock_qty ??
    prod?.stock ??
    prod?.on_hand ??
    prod?.available_qty ??
    prod?.available ??
    prod?.existence ??
    prod?.current_stock ??
    prod?.warehouse_qty ??
    null;

  if (q === null || q === undefined) return null;
  return toNum(q);
}
function stockText(item) {
  if (!pidOf(item)) return "—";
  if (!p(item)) return "—";
  const q = stockQty(item);
  return q === null ? "—" : String(q);
}
function availabilityLabel(item) {
  if (!p(item)) return "—";
  const q = stockQty(item);
  if (q === null) return "—";
  if (q <= 0) return "Sin stock";
  if (q <= 2) return "Bajo";
  return "Disponible";
}
function availabilityColor(item) {
  const lab = availabilityLabel(item);
  if (lab === "Disponible") return "green";
  if (lab === "Bajo") return "orange";
  if (lab === "Sin stock") return "red";
  return "grey";
}
function stockChipColor(item) {
  return availabilityColor(item);
}

function goToProduct(pid) {
  const n = Number(pid || 0);
  if (!n) return;

  const tries = [
    `/app/products/${n}`,
    `/app/products/view/${n}`,
    `/app/products/detail/${n}`,
    `/app/products/${n}/view`,
  ];

  router.push({ name: "ProductDetailViewPage", params: { id: n } }).catch(() => {
    router.push({ name: "product-detail", params: { id: n } }).catch(async () => {
      for (const path of tries) {
        try {
          await router.push({ path });
          return;
        } catch {}
      }
      snack.value = { show: true, text: "No encontré la ruta del perfil de producto (router)" };
    });
  });
}

function openImage(item) {
  imageItem.value = item || null;
  imageDialog.value = true;
}

async function copyText(txt) {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
    snack.value = { show: true, text: "Copiado" };
  } catch {
    snack.value = { show: true, text: "No se pudo copiar" };
  }
}

function needsHydrateProducts(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return false;

  return arr.some((it) => {
    const prod = it?.product;
    if (!prod) return true;

    const name = prod?.name || prod?.title || prod?.product_name;
    if (!name) return true;

    const hasSku = !!(prod?.sku || prod?.code || prod?.product_code || prod?.internal_code);
    const hasQty = prod?.qty !== undefined || prod?.stock_qty !== undefined || prod?.stock !== undefined;

    return !(hasSku && hasQty);
  });
}

async function fetchPosProductOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;

  const attempts = [
    { url: `/pos/products/${pid}`, params: { include_images: 1 } },
    { url: `/pos/products/${pid}`, params: undefined },
  ];

  let lastErr = null;
  for (const a of attempts) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("pos product one failed");
}

async function fetchPosProductsBatch(ids) {
  const params = { ids: ids.join(","), include_images: 1, limit: ids.length, page: 1 };
  const { data } = await http.get("/pos/products", { params });

  const out = data?.data || data || [];
  const arr = Array.isArray(out) ? out : Array.isArray(out?.items) ? out.items : [];
  if (!arr.length) throw new Error("pos products batch vacío");
  return arr;
}

async function fetchProductFallbackOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;

  const attempts = [
    { url: `/products/${pid}`, params: { include_images: 1 } },
    { url: `/products/${pid}`, params: undefined },
  ];

  let lastErr = null;
  for (const a of attempts) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("product one failed");
}

async function hydrateProductsForItems() {
  const s = sale.value;
  if (!s) return;

  const items = Array.isArray(s.items) ? s.items : [];
  if (!needsHydrateProducts(items)) return;

  const ids = Array.from(new Set(items.map((it) => pidOf(it)).filter((n) => Number.isFinite(n) && n > 0)));
  if (!ids.length) return;

  productsLoading.value = true;

  try {
    const map = new Map();

    try {
      const list = await fetchPosProductsBatch(ids);
      for (const pr of list) {
        const pid = Number(pr?.id || 0);
        if (pid) map.set(pid, pr);
      }
    } catch {
      const rows = await Promise.all(ids.map((pid) => fetchPosProductOne(pid).catch(() => null)));
      for (const pr of rows) {
        const pid = Number(pr?.id || 0);
        if (pid) map.set(pid, pr);
      }
    }

    const missing = ids.filter((pid) => !map.has(pid));
    if (missing.length) {
      const rows = await Promise.all(missing.map((pid) => fetchProductFallbackOne(pid).catch(() => null)));
      for (const pr of rows) {
        const pid = Number(pr?.id || 0);
        if (pid && !map.has(pid)) map.set(pid, pr);
      }
    }

    for (const it of items) {
      const pid = pidOf(it);
      if (!pid) continue;
      if (map.has(pid)) it.product = map.get(pid);
    }
  } finally {
    productsLoading.value = false;
  }
}

async function load() {
  loading.value = true;
  payload.value = null;

  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error cargando venta");

    payload.value = data.data || null;
    await hydrateProductsForItems();
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "Error" };
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(id, () => load());
</script>

<style scoped>
.pos-sale-detail {
  --sd-surface: rgba(var(--v-theme-surface), 1);
  --sd-surface-soft: rgba(var(--v-theme-surface), 0.76);
  --sd-border: rgba(var(--v-theme-on-surface), 0.12);
  --sd-border-strong: rgba(var(--v-theme-on-surface), 0.18);
  --sd-text: rgba(var(--v-theme-on-surface), 0.96);
  --sd-text-soft: rgba(var(--v-theme-on-surface), 0.76);
  --sd-text-faint: rgba(var(--v-theme-on-surface), 0.62);
  --sd-bg-b: rgba(var(--v-theme-on-surface), 0.03);

  background:
    radial-gradient(1200px 700px at 15% 0%, rgba(var(--v-theme-primary), 0.08), transparent 55%),
    radial-gradient(1000px 600px at 100% 0%, rgba(var(--v-theme-secondary), 0.05), transparent 55%),
    linear-gradient(180deg, var(--sd-bg-b), transparent 24%);
  min-height: 100%;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 18px;
}

.page-kicker {
  font-size: 12px;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
  color: var(--sd-text-soft);
  margin-bottom: 8px;
}

.page-title {
  font-size: clamp(1.7rem, 2vw, 2.4rem);
  line-height: 1.05;
  font-weight: 900;
  color: var(--sd-text);
  word-break: break-word;
}

.page-subtitle {
  margin-top: 6px;
  font-size: 0.96rem;
  color: var(--sd-text-soft);
}

.main-shell {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 0.96), rgba(var(--v-theme-surface), 0.98));
  border: 1px solid var(--sd-border);
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr);
  gap: 20px;
  align-items: stretch;
}

.soft-panel,
.soft-subcard,
.payment-card,
.mini-stat-card,
.fact-card {
  border: 1px solid var(--sd-border);
}

.soft-panel,
.soft-subcard {
  background: linear-gradient(180deg, var(--sd-surface-soft), rgba(var(--v-theme-surface), 0.9));
  border-radius: 22px;
}

.soft-panel {
  padding: 22px;
  min-width: 0;
}

.panel-title,
.section-title {
  display: flex;
  align-items: center;
  font-weight: 900;
  color: var(--sd-text);
  letter-spacing: 0.01em;
}

.hero-customer-name {
  font-size: clamp(1.35rem, 1.8vw, 1.85rem);
  line-height: 1.12;
  font-weight: 900;
  color: var(--sd-text);
  word-break: break-word;
}

.hero-muted,
.product-meta,
.payment-subline,
.section-subtitle {
  color: var(--sd-text-soft);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.sale-info-grid {
  align-items: start;
}

.info-item {
  min-width: 0;
}

.info-label,
.fact-label,
.total-kicker {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sd-text-faint);
}

.info-value,
.fact-value {
  margin-top: 4px;
  color: var(--sd-text);
  font-weight: 700;
  line-height: 1.35;
  word-break: break-word;
}

.total-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.total-main {
  font-size: clamp(2rem, 2.5vw, 2.8rem);
  line-height: 1;
  font-weight: 900;
  margin-top: 6px;
  color: var(--sd-text);
}

.money-breakdown {
  display: grid;
  gap: 10px;
}

.money-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 16px;
  align-items: center;
  color: var(--sd-text-soft);
}

.money-row strong {
  color: var(--sd-text);
  font-weight: 900;
}

.mini-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mini-stat-card {
  border-radius: 18px;
  padding: 14px 14px 12px;
  background: rgba(var(--v-theme-surface), 0.82);
}

.mini-stat-card--accent {
  background: rgba(var(--v-theme-primary), 0.09);
  border-color: rgba(var(--v-theme-primary), 0.22);
}

.mini-stat-label {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sd-text-faint);
}

.mini-stat-value {
  margin-top: 8px;
  font-size: 1.08rem;
  font-weight: 900;
  color: var(--sd-text);
  word-break: break-word;
}

.section-block {
  margin-top: 28px;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.table-wrap {
  border: 1px solid var(--sd-border);
  border-radius: 22px;
  overflow: hidden;
  background: rgba(var(--v-theme-surface), 0.9);
}

.products-table {
  background: transparent;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  padding: 4px 0;
}

.product-name {
  font-weight: 900;
  color: var(--sd-text);
  min-width: 0;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  font-size: 0.84rem;
}

.thumb {
  cursor: zoom-in;
  background: rgba(var(--v-theme-on-surface), 0.05);
  border: 1px solid var(--sd-border);
  flex: 0 0 auto;
}

.detail-chip {
  color: var(--sd-text) !important;
  border-color: var(--sd-border-strong) !important;
  background: rgba(var(--v-theme-on-surface), 0.02) !important;
  max-width: 100%;
}

.payments-stack {
  display: grid;
  gap: 14px;
}

.payment-card {
  background:
    linear-gradient(180deg, rgba(var(--v-theme-surface), 0.96), rgba(var(--v-theme-surface), 0.9));
}

.payment-card--single {
  border-radius: 22px;
}

.payment-top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: start;
}

.payment-top-left {
  min-width: 0;
}

.payment-title {
  font-size: 1.3rem;
  line-height: 1.15;
  font-weight: 900;
  color: var(--sd-text);
  word-break: break-word;
}

.payment-subline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
  font-size: 0.9rem;
}

.payment-amount-box {
  min-width: 190px;
  border-radius: 18px;
  padding: 14px 16px;
  background: rgba(var(--v-theme-primary), 0.08);
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  text-align: right;
}

.payment-amount-label {
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sd-text-faint);
}

.payment-amount-value {
  margin-top: 6px;
  font-size: 1.4rem;
  line-height: 1;
  font-weight: 900;
  color: var(--sd-text);
  word-break: break-word;
}

.payment-facts-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.fact-card {
  border-radius: 18px;
  padding: 14px;
  background: rgba(var(--v-theme-on-surface), 0.025);
  min-width: 0;
}

.payment-note {
  border-radius: 18px;
  padding: 14px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px dashed var(--sd-border-strong);
}

.min-w-0 {
  min-width: 0;
}

:deep(.v-data-table .v-table__wrapper > table > thead > tr > th) {
  color: var(--sd-text-soft) !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
  background: rgba(var(--v-theme-on-surface), 0.025);
}

:deep(.v-data-table .v-table__wrapper > table > tbody > tr > td) {
  color: var(--sd-text) !important;
  border-bottom-color: var(--sd-border) !important;
  background: transparent;
  vertical-align: top;
}

:deep(.v-data-table .v-table__wrapper > table > tbody > tr:hover > td) {
  background: rgba(var(--v-theme-primary), 0.03) !important;
}

:deep(.v-alert),
:deep(.v-card),
:deep(.v-chip),
:deep(.v-btn),
:deep(.v-list),
:deep(.v-field) {
  --v-medium-emphasis-opacity: 1;
}

@media (max-width: 1100px) {
  .hero-grid {
    grid-template-columns: 1fr;
  }

  .payment-facts-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .table-wrap {
    overflow-x: auto;
  }

  .payment-top {
    grid-template-columns: 1fr;
  }

  .payment-amount-box {
    min-width: 0;
    text-align: left;
  }
}

@media (max-width: 760px) {
  .page-head {
    margin-bottom: 14px;
  }

  .soft-panel {
    padding: 18px;
  }

  .info-grid,
  .mini-stats-grid,
  .payment-facts-grid {
    grid-template-columns: 1fr;
  }

  .product-cell {
    align-items: flex-start;
  }

  .hero-customer-name {
    font-size: 1.9rem;
  }

  .payment-title {
    font-size: 1.08rem;
  }
}

@media (max-width: 520px) {
  .pos-sale-detail {
    padding-left: 10px !important;
    padding-right: 10px !important;
  }

  .soft-panel {
    padding: 16px;
    border-radius: 18px;
  }

  .main-shell {
    border-radius: 18px !important;
  }

  .page-title {
    font-size: 1.45rem;
  }

  .total-main {
    font-size: 1.85rem;
  }

  .mini-stats-grid,
  .payment-facts-grid {
    grid-template-columns: 1fr;
  }

  .product-cell {
    gap: 10px;
  }

  .thumb {
    width: 50px !important;
    height: 50px !important;
  }
}
</style>