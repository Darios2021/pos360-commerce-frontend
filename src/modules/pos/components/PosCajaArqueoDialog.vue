<template>
  <!-- F7 con la caja abierta: arqueo y cierre (maqueta aprobada 10/10). La
       lógica (esperado, diferencia, PDF, detalle) es la de siempre. -->
  <PosModal
    :model-value="open"
    titulo="Cerrar caja"
    :sub="[cashierLabel, branchLabel, openedAtLabel].filter(Boolean).join(' · ')"
    tecla="F7"
    icono="mdi-lock-outline"
    :ancho="1040"
    accion="Cerrar la caja"
    accion-icono="mdi-lock"
    @update:model-value="$emit('update:open', $event)"
    @abierto="enfocar"
    @accion="submit"
  >
    <div class="aq">
      <div class="aq-izq">
        <div v-if="summaryEmpty" class="aq-aviso">
          <span>No se encontraron movimientos en esta caja.</span>
          <button type="button" class="aq-link" @click="$emit('reload')">Recargar</button>
        </div>
        <div v-if="cancelledCount > 0" class="aq-aviso aq-aviso--suave">
          {{ cancelledCount }} {{ cancelledCount === 1 ? "venta anulada excluida" : "ventas anuladas excluidas" }} del arqueo.
        </div>
        <div class="aq-dos">
          <div class="aq-caja"><span class="pm-lab">Debería haber</span><b class="num">{{ money(expectedCashValue) }}</b></div>
          <div class="aq-caja" :class="`aq-dif--${diffClass}`">
            <span class="pm-lab">{{ diffTitle }}</span>
            <b class="num">{{ formatDiff(cashDiff) }}</b>
          </div>
        </div>
        <span class="pm-lab">Efectivo contado</span>
        <label class="pm-in pm-in--monto">
          <span class="aq-signo">$</span>
          <input ref="campo" :value="cashInput" type="text" inputmode="decimal" autocomplete="off" @input="onCash" />
        </label>
        <span class="aq-detalle">{{ diffDetail }}</span>
        <div class="aq-res num">
          <span><small>Ventas</small><b>{{ salesCount }}</b></span>
          <span><small>Facturado</small><b>{{ money(salesTotal) }}</b></span>
          <span><small>Fondo inicial</small><b>{{ money(openingCash) }}</b></span>
        </div>
      </div>

      <aside class="pm-aside aq-der">
        <span class="pm-lab">Cobrado en el turno</span>
        <div v-for="row in paymentRows" :key="row.key" class="aq-medio num">
          <span>{{ row.label }}</span>
          <b>{{ money(row.expected) }}<small v-if="row.count"> · {{ row.count }} {{ row.count === 1 ? "venta" : "ventas" }}</small></b>
        </div>
        <div v-if="!paymentRows.length" class="aq-nada">Sin cobros en este turno</div>

        <button v-if="salesDetail.length" type="button" class="aq-link aq-ver" @click="showSalesDetail = !showSalesDetail">
          {{ showSalesDetail ? "Ocultar" : "Ver" }} las {{ salesDetail.length }} ventas
        </button>
        <div v-if="showSalesDetail" class="aq-ventas">
          <div v-for="v in salesDetail" :key="v.id" class="aq-venta num">
            <span>#{{ v.id }} · {{ formatTime(v.sold_at) }}</span>
            <span class="aq-venta__m">{{ methodLabel(v.primary_method) }}<template v-if="installmentsOf(v) > 1"> · {{ installmentsOf(v) }}x</template></span>
            <b>{{ money(v.total) }}</b>
          </div>
        </div>

        <button v-if="hasTurnInfo" type="button" class="aq-link aq-pdf" :disabled="pdfLoading" @click="downloadPdf">
          <v-icon size="20">mdi-file-pdf-box</v-icon>{{ pdfLoading ? "Armando el PDF…" : "Arqueo en PDF" }}
        </button>
      </aside>
    </div>
  </PosModal>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { nextTick } from "vue";
import PosModal from "./modales/PosModal.vue";
import { useTeclasModal } from "../composables/useTeclasModal";
import { formatearMonto } from "../utils/montoTexto";

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
  cashInput.value = Number(expectedCashValue.value || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
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

// ─── Teclado ───────────────────────────────────────────────────────────
const campo = ref(null);
function enfocar() { nextTick(() => { campo.value?.focus(); campo.value?.select(); }); }
function onCash(e) {
  cashInput.value = formatearMonto(e.target.value);
  e.target.value = cashInput.value;
}
useTeclasModal(computed(() => props.open), (e) => {
  if (e.key === "Enter") { submit(); return true; }
  return false;
});

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

<style>
.aq { display: flex; min-height: 100%; }
.aq-izq { flex: 1; min-width: 0; padding: 20px 22px; display: flex; flex-direction: column; gap: 12px; }
.aq-aviso { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 10px; background: #fff4e5; color: #8a4b0f; font-size: 14px; font-weight: 700; }
.aq-aviso--suave { background: #f1f5f9; color: #5a6678; }
.aq-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.aq-caja { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-radius: 12px; background: #f1f5f9; }
.aq-caja b { font-size: 30px; font-weight: 900; }
.aq-dif--is-ok { background: #e3f4ee; border: 2px solid #2e9e7b; }
.aq-dif--is-ok b, .aq-dif--is-ok .pm-lab { color: #1f7a5f; }
.aq-dif--is-warning { background: #fff4e5; border: 2px solid #f59e0b; }
.aq-dif--is-warning b, .aq-dif--is-warning .pm-lab { color: #b45309; }
.aq-dif--is-danger { background: #fdeceb; border: 2px solid #c2413a; }
.aq-dif--is-danger b, .aq-dif--is-danger .pm-lab { color: #a3322c; }
.aq-signo { font-size: 26px; font-weight: 800; color: #94a3b8; }
.aq-detalle { font-size: 14px; font-weight: 600; color: #5a6678; }
.aq-res { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 4px; }
.aq-res span { display: flex; flex-direction: column; padding: 10px 12px; border-radius: 10px; border: 1px solid #d3dde7; }
.aq-res small { font-size: 12px; font-weight: 700; color: #5a6678; }
.aq-res b { font-size: 18px; font-weight: 900; }
.aq-der { padding: 18px; gap: 6px; width: 350px; }
.aq-medio { display: flex; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eef2f6; font-size: 15px; }
.aq-medio span { font-weight: 600; color: #334155; }
.aq-medio b { font-weight: 800; text-align: right; }
.aq-medio small { font-weight: 600; color: #94a3b8; }
.aq-nada { font-size: 14px; color: #5a6678; padding: 6px 0; }
.aq-link { display: inline-flex; align-items: center; gap: 8px; border: 0; background: transparent; padding: 0; font: 800 14px Inter, sans-serif; color: #0f6fae; cursor: pointer; }
.aq-link:hover { text-decoration: underline; }
.aq-link .v-icon { color: #0f6fae; }
.aq-ver { margin-top: 10px; }
.aq-pdf { margin-top: 14px; }
.aq-ventas { display: flex; flex-direction: column; max-height: 220px; overflow-y: auto; }
.aq-venta { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; padding: 7px 0; border-bottom: 1px solid #eef2f6; font-size: 13px; }
.aq-venta__m { color: #5a6678; }
</style>
