<template>
  <v-dialog
    :model-value="open"
    max-width="960"
    @update:model-value="$emit('update:open', $event)"
  >
    <v-card class="arq" rounded="xl">
      <PosDialogHeader
        eyebrow="Cierre de caja"
        title="Arqueo"
        :subtitle="subtitle"
        @close="$emit('update:open', false)"
      >
        <template #chips>
          <span v-if="cashierLabel" class="arq-chip">
            <v-icon size="12">mdi-account-circle</v-icon>
            {{ cashierLabel }}
          </span>
          <span v-if="branchLabel" class="arq-chip">
            <v-icon size="12">mdi-store-outline</v-icon>
            {{ branchLabel }}
          </span>
          <span v-if="openedAtLabel" class="arq-chip">
            <v-icon size="12">mdi-login-variant</v-icon>
            {{ openedAtLabel }}
          </span>
        </template>
      </PosDialogHeader>

      <!-- Alerta de ventas anuladas (solo si hay) -->
      <div v-if="cancelledCount > 0" class="arq__cancelled-alert">
        <v-icon size="13" color="warning">mdi-alert</v-icon>
        <span>
          <strong>{{ cancelledCount }}</strong>
          {{ cancelledCount === 1 ? "venta anulada excluida" : "ventas anuladas excluidas" }}
          del arqueo.
        </span>
      </div>

      <!-- Alerta de summary vacío — ayuda a detectar desfasaje entre venta y caja -->
      <div v-if="summaryEmpty" class="arq__empty-alert">
        <v-icon size="14" color="warning">mdi-alert-circle-outline</v-icon>
        <div class="arq__empty-alert-text">
          <strong>No se encontraron movimientos en esta caja.</strong>
          <span>
            Si hiciste ventas, puede haber un desfasaje de sucursal o la caja
            estaba recién abierta. Recargá el resumen y probá de nuevo.
          </span>
        </div>
        <v-btn
          variant="tonal"
          color="warning"
          size="x-small"
          prepend-icon="mdi-refresh"
          @click="$emit('reload')"
        >
          Recargar
        </v-btn>
      </div>

      <v-divider />

      <div class="arq__body arq__body--wide">
        <!-- Columna izquierda: efectivo + resumen + métodos -->
        <div class="arq__col arq__col--left">
        <!-- Hero: efectivo -->
        <section class="arq__cash">
          <div class="arq__section-title">
            <v-icon size="14">mdi-cash</v-icon>
            Efectivo en caja
          </div>

          <div class="arq__expected">
            <span class="arq__expected-label">Esperado</span>
            <strong class="arq__expected-amount">{{ money(expectedCashValue) }}</strong>
          </div>

          <v-text-field
            v-model="cashInput"
            label="Efectivo contado físicamente"
            variant="outlined"
            density="comfortable"
            hide-details
            prefix="$"
            inputmode="decimal"
            class="arq__cash-input"
            @keyup.enter="submit"
          />

          <div class="arq__diff" :class="diffClass">
            <v-icon size="15" class="arq__diff-icon">{{ diffIcon }}</v-icon>
            <div class="arq__diff-text">
              <strong>{{ diffTitle }}</strong>
              <span>{{ diffDetail }}</span>
            </div>
            <strong class="arq__diff-amount">{{ formatDiff(cashDiff) }}</strong>
          </div>
        </section>

        <!-- Resumen del turno (solo lectura, del sistema) -->
        <section v-if="hasTurnInfo" class="arq__summary">
          <div class="arq__section-title">
            <v-icon size="14">mdi-receipt-text-outline</v-icon>
            Resumen del turno
          </div>

          <div class="arq__metrics">
            <div class="arq__metric">
              <span class="arq__metric-label">Ventas</span>
              <strong class="arq__metric-val">{{ salesCount }}</strong>
            </div>
            <div class="arq__metric">
              <span class="arq__metric-label">Facturado</span>
              <strong class="arq__metric-val">{{ money(salesTotal) }}</strong>
            </div>
            <div class="arq__metric">
              <span class="arq__metric-label">Fondo inicial</span>
              <strong class="arq__metric-val">{{ money(openingCash) }}</strong>
            </div>
          </div>

          <div v-if="paymentRows.length" class="arq__methods">
            <span class="arq__methods-title">
              Cobrado en el turno por medio de pago
            </span>
            <div class="arq__methods-list">
              <span
                v-for="row in paymentRows"
                :key="row.key"
                class="arq-method-chip"
                :class="{ 'arq-method-chip--cash': row.key === 'cash' }"
              >
                <v-icon size="13">{{ row.icon }}</v-icon>
                <span class="arq-method-chip__name">{{ row.label }}</span>
                <strong>{{ money(row.expected) }}</strong>
                <span v-if="row.count" class="arq-method-chip__count">
                  {{ row.count }} {{ row.count === 1 ? "venta" : "ventas" }}
                </span>
              </span>
            </div>
          </div>
        </section>
        </div>

        <!-- Columna derecha: detalle de ventas -->
        <div class="arq__col arq__col--right">
          <section class="arq__sales-panel" v-if="salesDetail.length">
            <div class="arq__section-title arq__section-title--flex">
              <v-icon size="14">mdi-clipboard-text-outline</v-icon>
              <span>Detalle de ventas</span>
              <span class="arq__section-badge">{{ salesDetail.length }}</span>
            </div>

            <div class="arq__sales-list">
              <article
                v-for="s in salesDetail"
                :key="s.id"
                class="arq__sale-card"
              >
                <header class="arq__sale-head">
                  <span class="arq__sale-id">#{{ s.id }}</span>
                  <span class="arq__sale-time">
                    <v-icon size="11">mdi-clock-outline</v-icon>
                    {{ formatTime(s.sold_at) }}
                  </span>
                  <span
                    class="arq__sale-method"
                    :class="`arq__sale-method--${String(s.primary_method || '').toLowerCase()}`"
                  >
                    <v-icon size="12">{{ methodIcon(s.primary_method) }}</v-icon>
                    {{ methodLabel(s.primary_method) }}
                    <span v-if="installmentsOf(s) > 1" class="arq__sale-installments">
                      · {{ installmentsOf(s) }}x {{ money(installmentValueOf(s)) }}
                    </span>
                  </span>
                  <strong class="arq__sale-total">{{ money(s.total) }}</strong>
                </header>

                <ul v-if="s.items && s.items.length" class="arq__sale-items">
                  <li
                    v-for="(it, i) in s.items"
                    :key="`${s.id}-${i}`"
                    class="arq__item-chip"
                  >
                    <span class="arq__item-name" :title="it.name">{{ it.name }}</span>
                    <strong class="arq__item-qty">×{{ qtyLabel(it.quantity) }}</strong>
                  </li>
                </ul>
              </article>
            </div>
          </section>

          <div v-else class="arq__sales-empty">
            <v-icon size="28">mdi-cart-outline</v-icon>
            <span>Aún no hay ventas en este turno.</span>
          </div>
        </div>
      </div>

      <v-divider />

      <div class="arq__footer">
        <v-btn
          v-if="hasTurnInfo"
          variant="text"
          size="small"
          prepend-icon="mdi-file-pdf-box"
          @click="downloadPdf"
          :disabled="pdfLoading"
          :loading="pdfLoading"
          class="arq__pdf-btn"
        >
          PDF
        </v-btn>

        <div class="arq__footer-spacer" />

        <v-btn variant="text" size="small" @click="$emit('update:open', false)">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          size="small"
          prepend-icon="mdi-check"
          @click="submit"
        >
          Registrar cierre
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import PosDialogHeader from "./shared/PosDialogHeader.vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  isCajaOpen: { type: Boolean, default: false },
  cajaTypeLabel: { type: String, default: "" },
  invoiceTypeLabel: { type: String, default: "" },
  summary: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["update:open", "save", "reload"]);

// ─── Helpers ───────────────────────────────────────────────────────────
function toNum(v, d = 0) {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : d;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(val || 0));
}

function round2(n) {
  return Number(Number(n || 0).toFixed(2));
}

// ─── State ──────────────────────────────────────────────────────────────
const cashInput = ref("");
const showSalesDetail = ref(false);
const pdfLoading = ref(false);

// ─── Computed ───────────────────────────────────────────────────────────
const totals = computed(() => props.summary?.totals || {});
const payments = computed(() => props.summary?.payments_by_method || {});

const expectedCashValue = computed(() => toNum(totals.value?.expected_cash, 0));
const openingCash = computed(() => toNum(totals.value?.opening_cash, 0));
const salesTotal = computed(() =>
  toNum(
    totals.value?.sales_total ??
      totals.value?.sales_total_created ??
      totals.value?.total_sales,
    0
  )
);
const salesCount = computed(() => toNum(totals.value?.sales_count, 0));
const cancelledCount = computed(() =>
  toNum(totals.value?.sales_cancelled_count, 0)
);

const hasTurnInfo = computed(
  () => salesCount.value > 0 || salesTotal.value > 0 || openingCash.value > 0
);

// Summary vacío: la caja está abierta pero no hay ningún dato numérico
// (ni fondo inicial, ni ventas, ni expected_cash). Ayuda a detectar casos
// donde la venta no quedó asociada a esta caja (desfasaje de branch_id).
const summaryEmpty = computed(() => {
  if (!props.isCajaOpen) return false;
  const s = props.summary;
  if (!s) return true;
  return (
    salesCount.value === 0 &&
    salesTotal.value === 0 &&
    openingCash.value === 0 &&
    expectedCashValue.value === 0
  );
});

const cashDeclared = computed(() => toNum(cashInput.value, 0));
const cashDiff = computed(() =>
  round2(cashDeclared.value - expectedCashValue.value)
);

const diffClass = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "is-ok";
  return n > 0 ? "is-warning" : "is-danger";
});

const diffIcon = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "mdi-check-circle";
  return n > 0 ? "mdi-arrow-up-circle" : "mdi-arrow-down-circle";
});

const diffTitle = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "Arqueo correcto";
  return n > 0 ? "Sobrante" : "Faltante";
});

const diffDetail = computed(() => {
  const n = cashDiff.value;
  if (n === 0) return "El efectivo contado coincide con lo esperado.";
  if (n > 0) return `Hay ${money(Math.abs(n))} de más en caja.`;
  return `Faltan ${money(Math.abs(n))} de efectivo.`;
});

function formatDiff(v) {
  const n = round2(v);
  if (n === 0) return "$ 0";
  return (n > 0 ? "+ " : "- ") + money(Math.abs(n));
}

const subtitle = computed(() => {
  const parts = [];
  if (salesCount.value > 0) {
    parts.push(
      `${salesCount.value} ${salesCount.value === 1 ? "venta" : "ventas"}`
    );
  }
  if (salesTotal.value > 0) {
    parts.push(`facturado ${money(salesTotal.value)}`);
  }
  if (!parts.length) return "Contá el efectivo físico y registrá el cierre.";
  return parts.join(" · ");
});

const cashierLabel = computed(() => {
  const cr = props.summary?.cash_register || {};
  return (
    cr.opened_by_name ||
    cr.user_name ||
    cr.user?.name ||
    cr.opened_by_email ||
    cr.user?.email ||
    (cr.opened_by ? `Usuario #${cr.opened_by}` : "")
  );
});

const branchLabel = computed(() => {
  const cr = props.summary?.cash_register || {};
  return cr.branch_name || (cr.branch_id ? `Sucursal #${cr.branch_id}` : "");
});

const openedAtLabel = computed(() => {
  const cr = props.summary?.cash_register || {};
  if (!cr.opened_at) return "";
  const d = new Date(cr.opened_at);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Efectivo cobrado en el turno = efectivo esperado - fondo inicial.
// Si el backend ya expone `payments_by_method.cash`, lo usamos; si no, lo derivamos.
const cashSales = computed(() => {
  const direct = toNum(payments.value?.cash, NaN);
  if (Number.isFinite(direct)) return Math.max(0, direct);
  return Math.max(0, expectedCashValue.value - openingCash.value);
});

const paymentCounts = computed(
  () => props.summary?.payments_count_by_method || {}
);

const paymentRows = computed(() => {
  const p = payments.value || {};
  const c = paymentCounts.value || {};
  const rows = [
    { key: "cash", label: "Efectivo", icon: "mdi-cash", expected: cashSales.value },
    { key: "card", label: "Tarjeta", icon: "mdi-credit-card-outline", expected: toNum(p.card, 0) },
    { key: "transfer", label: "Transferencia", icon: "mdi-bank-transfer", expected: toNum(p.transfer, 0) },
    { key: "mercadopago", label: "Mercado Pago", icon: "mdi-cellphone", expected: toNum(p.mercadopago, 0) },
    { key: "credit_sjt", label: "Créd. SJT", icon: "mdi-account-credit-card-outline", expected: toNum(p.credit_sjt, 0) },
    { key: "other", label: "Otros", icon: "mdi-dots-horizontal-circle-outline", expected: toNum(p.other, 0) },
  ];
  return rows
    .map((r) => ({ ...r, count: toNum(c[r.key], 0) }))
    .filter((r) => r.expected > 0);
});

// ─── Sync ──────────────────────────────────────────────────────────────
function syncFromSummary() {
  // Pre-rellenamos con lo esperado para que el cajero solo confirme / corrija.
  cashInput.value = String(expectedCashValue.value || 0);
  showSalesDetail.value = false;
}

watch(
  () => props.open,
  (v) => {
    if (v) syncFromSummary();
  },
  { immediate: true }
);

watch(
  () => props.summary,
  () => {
    if (props.open) syncFromSummary();
  },
  { deep: true }
);

// ─── Submit ────────────────────────────────────────────────────────────
// ─── Detalle de ventas (para tabla y PDF) ─────────────────────────────
const salesDetail = computed(() => {
  const arr = Array.isArray(props.summary?.sales_detail)
    ? props.summary.sales_detail
    : [];
  return arr.map((s) => ({
    id: toNum(s.id, 0),
    status: String(s.status || ""),
    total: toNum(s.total, 0),
    paid_total: toNum(s.paid_total, 0),
    change_total: toNum(s.change_total, 0),
    sold_at: s.sold_at,
    primary_method: String(s.primary_method || "OTHER").toUpperCase(),
    payments: Array.isArray(s.payments) ? s.payments : [],
    items: Array.isArray(s.items)
      ? s.items.map((it) => ({
          product_id: toNum(it.product_id, 0),
          name: String(it.name || "Producto"),
          quantity: toNum(it.quantity, 0),
          unit_price: toNum(it.unit_price, 0),
        }))
      : [],
  }));
});

function qtyLabel(n) {
  const num = toNum(n, 0);
  // Mostrar entero si es entero, si no, máximo 2 decimales
  if (Number.isInteger(num)) return String(num);
  return num.toFixed(2).replace(/\.?0+$/, "");
}

// Cuotas del primer pago relevante de la venta (sólo tiene sentido para tarjeta).
function installmentsOf(s) {
  const p = (s.payments || []).find((x) => toNum(x?.installments, 1) > 1);
  if (!p) return 1;
  return toNum(p.installments, 1);
}

function installmentValueOf(s) {
  const inst = installmentsOf(s);
  if (inst <= 1) return 0;
  const total = toNum(s.total, 0);
  if (total <= 0 || !inst) return 0;
  return total / inst;
}

function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

const METHOD_MAP = {
  CASH: { label: "Efectivo", icon: "mdi-cash" },
  CARD: { label: "Tarjeta", icon: "mdi-credit-card-outline" },
  TRANSFER: { label: "Transferencia", icon: "mdi-bank-transfer" },
  MERCADOPAGO: { label: "Mercado Pago", icon: "mdi-cellphone" },
  QR: { label: "Mercado Pago", icon: "mdi-cellphone" },
  CREDIT_SJT: { label: "Créd. SJT", icon: "mdi-account-credit-card-outline" },
  OTHER: { label: "Otros", icon: "mdi-dots-horizontal-circle-outline" },
};

function methodLabel(m) {
  return METHOD_MAP[String(m || "").toUpperCase()]?.label || "Otros";
}

function methodIcon(m) {
  return METHOD_MAP[String(m || "").toUpperCase()]?.icon || "mdi-dots-horizontal-circle-outline";
}

// ─── PDF del arqueo ──────────────────────────────────────────────────
async function downloadPdf() {
  if (pdfLoading.value) return;
  pdfLoading.value = true;

  try {
    const jsPdfModule = await import("jspdf");
    const JsPDFCtor = jsPdfModule.jsPDF || jsPdfModule.default;
    const doc = new JsPDFCtor({ unit: "pt", format: "a4" });

    // Paleta coherente con el POS
    const PRIMARY = [2, 73, 139];         // #02498B
    const SUCCESS = [46, 125, 50];        // verde
    const WARNING = [200, 120, 0];
    const ERROR = [180, 30, 50];
    const TEXT = [30, 30, 36];
    const MUTED = [110, 115, 125];
    const LIGHT_BG = [244, 246, 250];
    const BORDER = [220, 225, 232];

    const cr = props.summary?.cash_register || {};
    const cashierName =
      cr.opened_by_name ||
      cr.user_name ||
      cr.user?.name ||
      cr.opened_by_email ||
      cr.user?.email ||
      `Usuario #${cr.opened_by || "?"}`;

    const branchLabel =
      cr.branch_name || `Sucursal #${cr.branch_id || "—"}`;

    const openedAt = cr.opened_at ? new Date(cr.opened_at) : null;
    const now = new Date();

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const innerWidth = pageWidth - margin * 2;

    // ─── Header: banda superior primary ───────────────────────────────
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, pageWidth, 72, "F");

    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("ARQUEO DE CAJA", margin, 36);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Caja #${cr.id || "—"}`, margin, 54);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      `Generado ${now.toLocaleString("es-AR")}`,
      pageWidth - margin,
      54,
      { align: "right" }
    );

    let y = 98;

    // ─── Datos de la caja (info card) ─────────────────────────────────
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, innerWidth, 52, 6, 6, "F");

    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("CAJERO", margin + 12, y + 18);
    doc.text("SUCURSAL", margin + 200, y + 18);
    doc.text("APERTURA", margin + 340, y + 18);

    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(cashierName, margin + 12, y + 36);
    doc.text(branchLabel, margin + 200, y + 36);
    doc.text(
      openedAt ? openedAt.toLocaleString("es-AR") : "—",
      margin + 340,
      y + 36
    );

    y += 70;

    // ─── Totales (hero en caja destacada) ─────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TEXT);
    doc.text("TOTALES DEL TURNO", margin, y);

    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.6);
    doc.line(margin + 130, y - 4, pageWidth - margin, y - 4);

    y += 12;

    // Cards de métricas (3 por fila)
    const metricW = (innerWidth - 16) / 3;
    const metricH = 52;
    const metrics = [
      { label: "Ventas", value: String(salesCount.value), color: TEXT },
      { label: "Facturado", value: money(salesTotal.value), color: PRIMARY },
      { label: "Fondo inicial", value: money(openingCash.value), color: TEXT },
    ];

    metrics.forEach((m, i) => {
      const x = margin + i * (metricW + 8);
      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(x, y, metricW, metricH, 6, 6, "F");

      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(m.label.toUpperCase(), x + 12, y + 18);

      doc.setTextColor(...m.color);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(m.value, x + 12, y + 40);
    });

    y += metricH + 14;

    // Efectivo esperado / contado / diferencia (bloque destacado)
    const diffVal = cashDiff.value;
    const diffColor =
      diffVal === 0 ? SUCCESS : diffVal > 0 ? WARNING : ERROR;
    const diffLabel =
      diffVal === 0
        ? "ARQUEO CORRECTO"
        : diffVal > 0
          ? "SOBRANTE"
          : "FALTANTE";

    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(margin, y, innerWidth, 62, 6, 6, "F");

    // Esperado
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("EFECTIVO ESPERADO", margin + 14, y + 18);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(money(expectedCashValue.value), margin + 14, y + 40);

    // Contado
    doc.setTextColor(...MUTED);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("CONTADO", margin + 200, y + 18);
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(money(cashDeclared.value), margin + 200, y + 40);

    // Diferencia
    doc.setTextColor(...diffColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(diffLabel, margin + 370, y + 18);
    doc.setTextColor(...diffColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(formatDiff(diffVal), margin + 370, y + 40);

    y += 78;

    // ─── Cobrado por medio de pago ────────────────────────────────────
    if (paymentRows.value.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...TEXT);
      doc.text("COBRADO POR MEDIO DE PAGO", margin, y);
      doc.setDrawColor(...BORDER);
      doc.line(margin + 180, y - 4, pageWidth - margin, y - 4);
      y += 14;

      // tabla
      doc.setFillColor(...LIGHT_BG);
      doc.roundedRect(
        margin,
        y,
        innerWidth,
        paymentRows.value.length * 22 + 12,
        5,
        5,
        "F"
      );

      y += 14;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      for (const row of paymentRows.value) {
        const countStr = row.count
          ? `  ·  ${row.count} ${row.count === 1 ? "venta" : "ventas"}`
          : "";
        const isCash = row.key === "cash";
        doc.setTextColor(...(isCash ? SUCCESS : TEXT));
        doc.setFont("helvetica", "bold");
        doc.text(row.label, margin + 14, y);
        doc.setTextColor(...MUTED);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(countStr, margin + 14 + doc.getTextWidth(row.label), y);
        doc.setFontSize(10);

        doc.setTextColor(...(isCash ? SUCCESS : TEXT));
        doc.setFont("helvetica", "bold");
        doc.text(money(row.expected), pageWidth - margin - 14, y, {
          align: "right",
        });
        y += 22;
      }
      y += 8;
    }

    // ─── Detalle de ventas con items ──────────────────────────────────
    if (salesDetail.value.length) {
      if (y > pageHeight - 140) {
        doc.addPage();
        y = margin;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...TEXT);
      doc.text("DETALLE DE VENTAS", margin, y);
      doc.setDrawColor(...BORDER);
      doc.line(margin + 130, y - 4, pageWidth - margin, y - 4);
      y += 16;

      for (const s of salesDetail.value) {
        // Calcular alto necesario de la card
        const itemsText = s.items && s.items.length
          ? s.items
              .map((it) => `• ${it.name} × ${qtyLabel(it.quantity)}`)
              .join("    ")
          : "";
        const itemsLines = itemsText
          ? doc.splitTextToSize(itemsText, innerWidth - 24)
          : [];
        const cardH = 28 + (itemsLines.length ? itemsLines.length * 11 + 6 : 0);

        if (y + cardH > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }

        // Card
        doc.setDrawColor(...BORDER);
        doc.setLineWidth(0.4);
        doc.roundedRect(margin, y, innerWidth, cardH, 5, 5, "S");

        // Header: ID · Hora · Método · Total
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...PRIMARY);
        doc.text(`#${s.id}`, margin + 12, y + 16);

        doc.setTextColor(...MUTED);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(formatTime(s.sold_at), margin + 54, y + 16);

        const inst = installmentsOf(s);
        const methodTxt =
          inst > 1
            ? `${methodLabel(s.primary_method)} · ${inst}x ${money(installmentValueOf(s))}`
            : methodLabel(s.primary_method);

        doc.setTextColor(...TEXT);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(methodTxt, margin + 110, y + 16);

        doc.setTextColor(...TEXT);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(money(s.total), pageWidth - margin - 14, y + 16, {
          align: "right",
        });

        // Separador sutil
        if (itemsLines.length) {
          doc.setDrawColor(...BORDER);
          doc.setLineDashPattern([1, 1.5], 0);
          doc.line(margin + 12, y + 23, pageWidth - margin - 12, y + 23);
          doc.setLineDashPattern([], 0);

          // Items
          doc.setTextColor(...MUTED);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          let ly = y + 33;
          for (const line of itemsLines) {
            doc.text(line, margin + 12, ly);
            ly += 11;
          }
        }

        y += cardH + 6;
      }
    }

    // ─── Footer (todas las páginas) ───────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setTextColor(...MUTED);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `360pos · Arqueo Caja #${cr.id || "—"}`,
        margin,
        pageHeight - 18
      );
      doc.text(
        `Página ${p} de ${pageCount}`,
        pageWidth - margin,
        pageHeight - 18,
        { align: "right" }
      );
    }

    const stamp = now
      .toISOString()
      .slice(0, 19)
      .replace(/[-:T]/g, "");
    doc.save(`arqueo-caja-${cr.id || "X"}-${stamp}.pdf`);
  } catch (err) {
    console.error("[POS] error al generar PDF", err);
  } finally {
    pdfLoading.value = false;
  }
}

function submit() {
  emit("save", {
    closing_cash: cashDeclared.value,
    closing_note: "",
    declared: { cash: cashDeclared.value },
    difference: { cash: cashDiff.value },
  });
}
</script>

<style scoped>
.arq {
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.arq-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 7px;
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgb(var(--v-theme-on-surface));
  font-size: 11px;
  font-weight: 400;
  line-height: 1.3;
}

.arq-chip :deep(.v-icon) {
  opacity: 0.72;
}

.arq__cancelled-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  background: rgba(var(--v-theme-warning), 0.08);
  border-bottom: 1px solid rgba(var(--v-theme-warning), 0.18);
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.arq__empty-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 16px;
  background: rgba(var(--v-theme-warning), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-warning), 0.22);
}

.arq__empty-alert-text {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.9);
}

.arq__empty-alert-text strong {
  font-weight: 500;
  color: rgb(var(--v-theme-warning));
}

.arq__empty-alert-text span {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  line-height: 1.35;
}

.arq__body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.arq__body--wide {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 18px;
  padding: 20px;
}

.arq__col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.arq__col--right {
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  padding-left: 18px;
}

.arq__section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin-bottom: 8px;
}

.arq__section-title--flex {
  margin-bottom: 10px;
}

.arq__section-badge {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.14);
  color: rgb(var(--v-theme-primary));
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

/* ─── Hero: efectivo ─────────────────────────────────────────────── */
.arq__cash {
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    rgba(var(--v-theme-primary), 0.05) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%
  );
  border: 1px solid rgba(var(--v-theme-primary), 0.16);
}

.arq__expected {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  margin-bottom: 10px;
}

.arq__expected-label {
  font-size: 11.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.65);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.arq__expected-amount {
  font-size: 18px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.arq__cash-input :deep(.v-field) {
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
}

.arq__cash-input :deep(.v-field__input) {
  font-size: 20px;
  font-weight: 500;
  padding-top: 6px;
  padding-bottom: 6px;
}

.arq__cash-input :deep(.v-field__prefix) {
  font-size: 16px;
  font-weight: 400;
  opacity: 0.6;
  padding-top: 10px;
}

.arq__diff {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid transparent;
}

.arq__diff.is-ok {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.24);
  color: rgb(var(--v-theme-success));
}

.arq__diff.is-warning {
  background: rgba(var(--v-theme-warning), 0.1);
  border-color: rgba(var(--v-theme-warning), 0.28);
  color: rgb(var(--v-theme-warning));
}

.arq__diff.is-danger {
  background: rgba(var(--v-theme-error), 0.08);
  border-color: rgba(var(--v-theme-error), 0.24);
  color: rgb(var(--v-theme-error));
}

.arq__diff-icon {
  flex-shrink: 0;
}

.arq__diff-text {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.arq__diff-text strong {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.1;
}

.arq__diff-text span {
  font-size: 10.5px;
  opacity: 0.88;
  line-height: 1.2;
}

.arq__diff-amount {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ─── Resumen del turno ────────────────────────────────────────────── */
.arq__summary {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
}

.arq__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding-bottom: 10px;
}

.arq__metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 9px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.arq__metric-label {
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.arq__metric-val {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
}

.arq__methods {
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.arq__methods-title {
  font-size: 10.5px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.55);
  letter-spacing: 0.02em;
}

.arq__methods-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.arq-method-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 9px;
  border-radius: 7px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  font-size: 11.5px;
  line-height: 1.3;
}

.arq-method-chip :deep(.v-icon) {
  opacity: 0.7;
}

.arq-method-chip__name {
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.arq-method-chip strong {
  font-weight: 500;
  letter-spacing: -0.01em;
}

.arq-method-chip__count {
  font-size: 10px;
  font-weight: 400;
  color: rgba(var(--v-theme-on-surface), 0.5);
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  line-height: 1.3;
}

/* Efectivo con acento verde para distinguirlo de los otros medios */
.arq-method-chip--cash {
  background: rgba(var(--v-theme-success), 0.08);
  border-color: rgba(var(--v-theme-success), 0.28);
}

.arq-method-chip--cash :deep(.v-icon) {
  color: rgb(var(--v-theme-success));
  opacity: 0.9;
}

.arq-method-chip--cash strong {
  color: rgb(var(--v-theme-success));
}

/* ─── Detalle de ventas (nuevo layout en cards) ───────────────── */
.arq__sales-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.arq__sales-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 460px;
  overflow-y: auto;
  padding-right: 4px;
  scrollbar-width: thin;
  scrollbar-color: rgba(var(--v-theme-primary), 0.38) transparent;
}

.arq__sales-list::-webkit-scrollbar {
  width: 8px;
}

.arq__sales-list::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-primary), 0.38);
  border-radius: 999px;
}

.arq__sale-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 9px 11px;
  border-radius: 10px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.arq__sale-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.28);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.arq__sale-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.arq__sale-id {
  font-size: 12px;
  font-weight: 500;
  color: rgb(var(--v-theme-primary));
  font-feature-settings: "tnum";
  letter-spacing: -0.01em;
}

.arq__sale-time {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  font-feature-settings: "tnum";
}

.arq__sale-time :deep(.v-icon) {
  opacity: 0.7;
}

.arq__sale-method {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.01em;
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgba(var(--v-theme-on-surface), 0.82);
}

.arq__sale-method--cash {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.arq__sale-method--card,
.arq__sale-method--transfer {
  background: rgba(var(--v-theme-info), 0.12);
  color: rgb(var(--v-theme-info));
}

.arq__sale-method--mercadopago,
.arq__sale-method--qr {
  background: rgba(255, 176, 32, 0.16);
  color: rgb(206, 140, 14);
}

.arq__sale-installments {
  margin-left: 2px;
  font-weight: 400;
  opacity: 0.85;
  font-feature-settings: "tnum";
}

.arq__sale-total {
  margin-left: auto;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: rgb(var(--v-theme-on-surface));
  white-space: nowrap;
  font-feature-settings: "tnum";
}

.arq__sale-items {
  list-style: none;
  margin: 0;
  padding: 6px 0 2px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.1);
}

.arq__item-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.05);
  font-size: 11px;
  line-height: 1.3;
  max-width: 100%;
}

.arq__item-name {
  color: rgba(var(--v-theme-on-surface), 0.82);
  font-weight: 400;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.arq__item-qty {
  color: rgb(var(--v-theme-primary));
  font-weight: 500;
  font-feature-settings: "tnum";
  flex-shrink: 0;
}

.arq__sales-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 30px 10px;
  color: rgba(var(--v-theme-on-surface), 0.45);
  font-size: 12px;
  text-align: center;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
  border-radius: 12px;
}

.arq__sales-empty :deep(.v-icon) {
  opacity: 0.5;
}

/* ─── Footer ─────────────────────────────────────────────────────── */
.arq__footer-spacer {
  flex: 1 1 auto;
}

.arq__pdf-btn {
  opacity: 0.85;
}

.arq__pdf-btn:hover {
  opacity: 1;
}

/* ─── Footer ────────────────────────────────────────────────────────── */
.arq__footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 12px 18px 16px;
}

/* ─── Responsive ────────────────────────────────────────────────────── */
@media (max-width: 760px) {
  .arq__body--wide {
    grid-template-columns: 1fr;
    gap: 14px;
    padding: 16px;
  }
  .arq__col--right {
    border-left: none;
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.07);
    padding-left: 0;
    padding-top: 14px;
  }
  .arq__sales-list {
    max-height: 320px;
  }
}

@media (max-width: 520px) {
  .arq__body--wide {
    padding: 12px;
  }
  .arq__metrics {
    grid-template-columns: 1fr 1fr;
  }
  .arq__expected-amount {
    font-size: 16px;
  }
  .arq__cash-input :deep(.v-field__input) {
    font-size: 18px;
  }
  .arq__sale-total {
    font-size: 13px;
  }
  .arq__item-name {
    max-width: 140px;
  }
}
</style>
