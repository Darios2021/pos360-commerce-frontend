<!-- src/modules/pos/components/ReceiptDialog.vue -->
<template>
  <v-dialog
    v-model="localOpen"
    max-width="520"
    scrollable
    @click:outside="close"
    @keydown.esc="close"
  >
    <v-card class="rcpt-card" rounded="xl" elevation="0">

      <!-- ── Header del dialog ── -->
      <div class="rcpt-dlg-header">
        <div class="rcpt-dlg-title">
          <v-icon size="16" color="primary" class="mr-2">mdi-receipt-text-outline</v-icon>
          Ticket de venta
          <span v-if="saleNumber" class="rcpt-dlg-num">N° {{ saleNumber }}</span>
        </div>
        <div class="rcpt-dlg-actions">
          <v-btn icon variant="text" size="small" @click="close">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- ── Cuerpo ── -->
      <v-card-text class="rcpt-body pa-4">
        <div v-if="!sale" class="rcpt-empty">
          <v-icon size="40" color="medium-emphasis">mdi-receipt-text-outline</v-icon>
          <span>Sin venta seleccionada</span>
        </div>

        <!-- PAPEL DEL TICKET (preview) -->
        <div v-else class="rcpt-paper">
          <div id="pos-ticket" class="tkt">

            <!-- ══ CABECERA EMPRESA ══ -->
            <div class="tkt-header">
              <div class="tkt-company">{{ companyName }}</div>
              <div v-if="branchName" class="tkt-branch">{{ branchName }}</div>
              <div v-if="branchAddress" class="tkt-address">{{ branchAddress }}</div>
              <div v-if="branchPhone" class="tkt-phone">Tel: {{ branchPhone }}</div>
            </div>

            <div class="tkt-rule tkt-rule--dashed"></div>

            <!-- ══ META ══ -->
            <div class="tkt-meta">
              <div class="tkt-meta-row">
                <span>Comprobante</span>
                <strong>N° {{ saleNumber }}</strong>
              </div>
              <div class="tkt-meta-row">
                <span>Fecha y hora</span>
                <strong>{{ fmtDatetime(sale.sold_at || sale.created_at) }}</strong>
              </div>
              <div v-if="sellerName" class="tkt-meta-row">
                <span>Cajero/a</span>
                <strong>{{ sellerName }}</strong>
              </div>
              <div class="tkt-meta-row">
                <span>Cliente</span>
                <strong>{{ customerDisplay || 'Consumidor Final' }}</strong>
              </div>
              <div v-if="customerDoc" class="tkt-meta-row">
                <span>Doc.</span>
                <strong>{{ customerDoc }}</strong>
              </div>
              <div v-if="invoiceLabel" class="tkt-meta-row">
                <span>Tipo comprobante</span>
                <strong>{{ invoiceLabel }}</strong>
              </div>
            </div>

            <div class="tkt-rule tkt-rule--dashed"></div>

            <!-- ══ ITEMS ══ -->
            <table class="tkt-items">
              <thead>
                <tr>
                  <th class="tkt-th tkt-th--name">Descripción</th>
                  <th class="tkt-th tkt-th--qty">Cant.</th>
                  <th class="tkt-th tkt-th--price">P.Unit</th>
                  <th class="tkt-th tkt-th--sub">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(it, i) in saleItems" :key="i" class="tkt-item-row">
                  <td class="tkt-td tkt-td--name">
                    <div class="tkt-item-name">{{ it.product_name_snapshot || it.product?.name || `Prod. #${it.product_id}` }}</div>
                    <div v-if="it.product_sku_snapshot || it.product?.sku" class="tkt-item-sku">
                      SKU: {{ it.product_sku_snapshot || it.product?.sku }}
                    </div>
                  </td>
                  <td class="tkt-td tkt-td--qty">{{ fmtQty(it.qty ?? it.quantity ?? 1) }}</td>
                  <td class="tkt-td tkt-td--price">{{ money(it.unit_price ?? it.price ?? 0) }}</td>
                  <td class="tkt-td tkt-td--sub">{{ money(itemTotal(it)) }}</td>
                </tr>
              </tbody>
            </table>

            <div class="tkt-rule tkt-rule--solid"></div>

            <!-- ══ TOTALES ══ -->
            <div class="tkt-totals">
              <div v-if="hasDiscount" class="tkt-total-row">
                <span>Subtotal bruto</span>
                <span>{{ money(grossTotal) }}</span>
              </div>
              <div v-if="hasDiscount" class="tkt-total-row tkt-total-row--discount">
                <span>Descuento</span>
                <span>- {{ money(discountTotal) }}</span>
              </div>
              <div class="tkt-total-row tkt-total-row--main">
                <span>TOTAL</span>
                <span>{{ money(sale.total) }}</span>
              </div>
            </div>

            <div class="tkt-rule tkt-rule--dashed"></div>

            <!-- ══ PAGOS ══ -->
            <div class="tkt-payments">
              <div class="tkt-pay-title">Forma de pago</div>
              <div v-for="(p, i) in salePayments" :key="i" class="tkt-pay-row">
                <span>{{ methodLabel(p.method) }}<span v-if="p.reference" class="tkt-pay-ref"> · {{ p.reference }}</span></span>
                <span>{{ money(p.amount) }}</span>
              </div>
              <div v-if="paidTotal > 0 && paidTotal !== Number(sale.total)" class="tkt-pay-row">
                <span>Entregado</span>
                <span>{{ money(paidTotal) }}</span>
              </div>
              <div v-if="changeAmount > 0" class="tkt-pay-row tkt-pay-row--change">
                <span>Vuelto</span>
                <span>{{ money(changeAmount) }}</span>
              </div>
            </div>

            <div class="tkt-rule tkt-rule--dashed"></div>

            <!-- ══ PIE ══ -->
            <div class="tkt-footer">
              <div class="tkt-footer-thanks">¡Gracias por su compra!</div>
              <div class="tkt-footer-ref">Comprobante N° {{ saleNumber }} · ID #{{ sale.id }}</div>
              <div v-if="branchName" class="tkt-footer-branch">{{ branchName }}</div>
            </div>

          </div>
        </div>
      </v-card-text>

      <!-- ── Footer dialog ── -->
      <v-divider />
      <v-card-actions class="rcpt-footer pa-3">
        <v-btn variant="tonal" size="small" @click="close">
          <v-icon start size="14">mdi-close</v-icon>Cerrar
        </v-btn>
        <v-spacer />
        <v-tooltip text="Descargar PDF" location="top">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon variant="tonal" size="small" class="mr-2" @click="downloadTicket">
              <v-icon size="18">mdi-download</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
        <v-tooltip text="Imprimir ticket" location="top">
          <template #activator="{ props: tp }">
            <v-btn v-bind="tp" icon variant="flat" color="primary" size="small" @click="printTicket">
              <v-icon size="18">mdi-printer</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  open:        { type: Boolean, default: false },
  sale:        { type: Object,  default: null  },
  companyName: { type: String,  default: "POS360" },
  branchName:  { type: String,  default: "" },
});

const emit = defineEmits(["update:open"]);

const localOpen = ref(!!props.open);
watch(() => props.open, (v) => { localOpen.value = !!v; });
watch(localOpen, (v) => {
  if (!!v === !!props.open) return;
  emit("update:open", !!v);
});
function close() { localOpen.value = false; }

// ── helpers ──────────────────────────────────────────────────────────────
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function fmtDatetime(v) {
  if (!v) return "—";
  return new Date(v).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
function fmtQty(q) {
  const n = Number(q || 0);
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
function itemTotal(it) {
  return Number(it.qty ?? it.quantity ?? 1) * Number(it.unit_price ?? it.price ?? 0);
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH")      return "Efectivo";
  if (x === "TRANSFER")  return "Transferencia bancaria";
  if (x === "CARD")      return "Tarjeta";
  if (x === "MERCADOPAGO" || x === "QR") return "Mercado Pago / QR";
  if (x.includes("CREDIT_SJ") || x.includes("SJCREDIT")) return "San Juan Crédito";
  return m || "Otro";
}
function resolveMethod(p) {
  const ref = String(p?.reference || "").trim().toUpperCase();
  if (ref === "SJCREDIT" || ref === "SJ_CREDIT") return "CREDIT_SJT";
  return String(p?.method || "OTHER").toUpperCase();
}

// ── computed ──────────────────────────────────────────────────────────────
const saleNumber = computed(() => props.sale?.sale_number || props.sale?.id || "");

// Branch extra data desde sale.branch
const branchAddress = computed(() => String(props.sale?.branch?.address || "").trim());
const branchPhone   = computed(() => String(props.sale?.branch?.phone   || "").trim());

const saleItems = computed(() =>
  props.sale?.items || props.sale?.sale_items || props.sale?.saleItems || []
);
const salePayments = computed(() =>
  (props.sale?.payments || []).map(p => ({
    ...p,
    amount: Number(p.amount || 0),
    method: resolveMethod(p),
  }))
);
const paidTotal   = computed(() => Number(props.sale?.paid_total  || 0));
const changeAmount = computed(() => Number(props.sale?.change_total || 0));

const grossTotal    = computed(() => saleItems.value.reduce((a, it) => a + itemTotal(it), 0));
const discountTotal = computed(() => Math.max(0, grossTotal.value - Number(props.sale?.total || 0)));
const hasDiscount   = computed(() => discountTotal.value > 0.009);

const sellerName = computed(() => {
  const u = props.sale?.user;
  if (!u) return "";
  return u.username || [u.first_name, u.last_name].filter(Boolean).join(" ") || `#${u.id}`;
});
const customerDisplay = computed(() => String(props.sale?.customer_name || "").trim());
const customerDoc     = computed(() => String(props.sale?.customer_doc  || "").trim());
const invoiceLabel = computed(() => {
  const mode = String(props.sale?.invoice_mode || "").toUpperCase();
  const type = String(props.sale?.invoice_type || "").toUpperCase();
  if (mode === "FISCAL") return type ? `Fiscal – ${type}` : "Fiscal";
  return "";
});

// ── shared ticket HTML builder ─────────────────────────────────────────────
function buildTicketWindow() {
  const el = document.getElementById("pos-ticket");
  if (!el) return null;
  const w = window.open("", "_blank", "width=420,height=700,menubar=no,toolbar=no");
  if (!w) return null;
  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket N° ${saleNumber.value}</title>
  <style>
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html, body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
      width: 80mm;
      padding: 4mm 3mm;
    }
    .tkt-header { text-align:center; padding-bottom:6px; }
    .tkt-company { font-size:17px; font-weight:900; text-transform:uppercase; letter-spacing:.06em; }
    .tkt-branch  { font-size:12px; font-weight:700; margin-top:2px; }
    .tkt-address, .tkt-phone { font-size:11px; color:#333; margin-top:1px; }
    .tkt-rule { border:none; border-top:1px dashed #999; margin:6px 0; }
    .tkt-rule--solid { border-top:2px solid #000; margin:6px 0; }
    .tkt-meta { width:100%; }
    .tkt-meta-row { display:flex; justify-content:space-between; align-items:baseline; margin:2px 0; font-size:11px; }
    .tkt-meta-row span { color:#444; }
    .tkt-meta-row strong { font-weight:700; text-align:right; max-width:60%; word-break:break-word; }
    .tkt-items { width:100%; border-collapse:collapse; margin:4px 0; }
    .tkt-th { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.04em; padding:2px 0; border-bottom:1px dashed #999; }
    .tkt-th--name  { text-align:left;  width:46%; }
    .tkt-th--qty   { text-align:right; width:10%; }
    .tkt-th--price { text-align:right; width:22%; }
    .tkt-th--sub   { text-align:right; width:22%; }
    .tkt-item-row td { padding:4px 0 2px; vertical-align:top; }
    .tkt-td--name  { text-align:left; }
    .tkt-td--qty   { text-align:right; white-space:nowrap; }
    .tkt-td--price { text-align:right; white-space:nowrap; font-size:11px; }
    .tkt-td--sub   { text-align:right; white-space:nowrap; font-weight:700; }
    .tkt-item-name { font-size:11.5px; font-weight:700; word-break:break-word; }
    .tkt-item-sku  { font-size:9.5px; color:#666; margin-top:1px; }
    .tkt-totals { margin:4px 0; }
    .tkt-total-row { display:flex; justify-content:space-between; font-size:11px; padding:2px 0; }
    .tkt-total-row--discount { color:#c00; }
    .tkt-total-row--main { font-size:16px; font-weight:900; padding-top:4px; }
    .tkt-payments { margin:4px 0; }
    .tkt-pay-title { font-size:9px; font-weight:800; text-transform:uppercase; letter-spacing:.05em; color:#666; margin-bottom:3px; }
    .tkt-pay-row { display:flex; justify-content:space-between; font-size:11px; padding:2px 0; }
    .tkt-pay-row--change { font-weight:900; }
    .tkt-pay-ref { font-size:10px; color:#555; }
    .tkt-footer { text-align:center; margin-top:8px; }
    .tkt-footer-thanks { font-size:13px; font-weight:900; }
    .tkt-footer-ref { font-size:9px; color:#777; margin-top:3px; }
    .tkt-footer-branch { font-size:10px; color:#555; margin-top:2px; }
    @media print {
      @page { margin:0; size:80mm auto; }
      html, body { width:80mm; padding:3mm 2mm; }
    }
  </style>
</head>
<body>${el.outerHTML}</body>
</html>`);
  w.document.close();
  return w;
}

// ── print ─────────────────────────────────────────────────────────────────
function printTicket() {
  const w = buildTicketWindow();
  if (!w) return;
  w.focus();
  setTimeout(() => { w.print(); }, 500);
}

// ── download (print-to-PDF via browser) ───────────────────────────────────
function downloadTicket() {
  const w = buildTicketWindow();
  if (!w) return;
  w.focus();
  // Abre el diálogo de impresión; el usuario puede elegir "Guardar como PDF"
  setTimeout(() => { w.print(); }, 500);
}
</script>

<style scoped>
/* ── Dialog shell ── */
.rcpt-card {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), .1);
}
.rcpt-dlg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08);
}
.rcpt-dlg-title {
  display: flex; align-items: center;
  font-size: 14px; font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  gap: 6px;
}
.rcpt-dlg-num {
  font-size: 11px; font-weight: 600;
  color: rgba(var(--v-theme-on-surface), .45);
}
.rcpt-dlg-actions { display: flex; align-items: center; gap: 8px; }
.rcpt-body { max-height: 72vh; overflow-y: auto; background: #e8e8e8; }
.rcpt-footer { padding: 10px 16px; }
.rcpt-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 10px; padding: 48px 24px;
  color: rgba(var(--v-theme-on-surface), .4); font-size: 13px;
}

/* ── Paper wrapper ── */
.rcpt-paper {
  padding: 16px;
  display: flex; justify-content: center;
}

/* ══════════════════════════════════
   TICKET (preview en pantalla)
══════════════════════════════════ */
.tkt {
  background: #fff;
  color: #111;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12.5px;
  line-height: 1.5;
  width: 100%;
  max-width: 340px;
  padding: 20px 18px;
  border-radius: 4px;
  box-shadow: 0 2px 16px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06);
  position: relative;
}
/* perforación superior */
.tkt::before {
  content: '';
  position: absolute;
  top: -8px; left: 50%; transform: translateX(-50%);
  width: 80%; height: 8px;
  background: radial-gradient(circle at 6px 50%, #e8e8e8 5px, transparent 5px) repeat-x;
  background-size: 12px 8px;
}

/* Header */
.tkt-header { text-align: center; padding-bottom: 8px; }
.tkt-company {
  font-size: 17px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .05em;
  color: #000;
}
.tkt-branch  { font-size: 12px; font-weight: 700; color: #222; margin-top: 2px; }
.tkt-address { font-size: 11px; color: #555; margin-top: 2px; }
.tkt-phone   { font-size: 11px; color: #555; margin-top: 1px; }

/* Rules */
.tkt-rule {
  border: none;
  border-top: 1px dashed #bbb;
  margin: 8px 0;
}
.tkt-rule--solid { border-top: 2px solid #111; margin: 8px 0; }

/* Meta */
.tkt-meta { width: 100%; }
.tkt-meta-row {
  display: flex; justify-content: space-between; align-items: baseline;
  margin: 3px 0; font-size: 11.5px;
}
.tkt-meta-row span { color: #666; }
.tkt-meta-row strong { font-weight: 800; color: #111; text-align: right; max-width: 58%; word-break: break-word; }

/* Items table */
.tkt-items { width: 100%; border-collapse: collapse; margin: 4px 0; }
.tkt-th {
  font-size: 9.5px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .05em;
  color: #555; padding: 4px 0;
  border-bottom: 1px dashed #bbb;
}
.tkt-th--name  { text-align: left; width: 46%; }
.tkt-th--qty   { text-align: right; width: 10%; padding-right: 4px; }
.tkt-th--price { text-align: right; width: 22%; padding-right: 4px; }
.tkt-th--sub   { text-align: right; width: 22%; }

.tkt-item-row td { padding: 5px 0 3px; vertical-align: top; }
.tkt-td--name  { text-align: left; }
.tkt-td--qty   { text-align: right; white-space: nowrap; padding-right: 4px; color: #333; }
.tkt-td--price { text-align: right; white-space: nowrap; padding-right: 4px; font-size: 11px; color: #333; }
.tkt-td--sub   { text-align: right; white-space: nowrap; font-weight: 800; color: #000; }

.tkt-item-name { font-size: 12px; font-weight: 700; word-break: break-word; color: #000; }
.tkt-item-sku  { font-size: 10px; color: #888; margin-top: 1px; }

/* Totals */
.tkt-totals { margin: 4px 0; }
.tkt-total-row {
  display: flex; justify-content: space-between;
  font-size: 12px; padding: 2px 0; color: #333;
}
.tkt-total-row--discount { color: #c00; }
.tkt-total-row--main {
  font-size: 18px; font-weight: 900;
  color: #000; padding-top: 4px;
}

/* Payments */
.tkt-payments { margin: 4px 0; }
.tkt-pay-title {
  font-size: 9px; font-weight: 900;
  text-transform: uppercase; letter-spacing: .06em;
  color: #888; margin-bottom: 4px;
}
.tkt-pay-row {
  display: flex; justify-content: space-between;
  font-size: 12px; padding: 2px 0; color: #333;
}
.tkt-pay-row--change { font-weight: 900; color: #000; }
.tkt-pay-ref { font-size: 10px; color: #888; }

/* Footer */
.tkt-footer { text-align: center; padding-top: 6px; }
.tkt-footer-thanks { font-size: 13px; font-weight: 900; color: #000; }
.tkt-footer-ref { font-size: 9.5px; color: #999; margin-top: 4px; }
.tkt-footer-branch { font-size: 10px; color: #777; margin-top: 2px; }
</style>
