<!-- src/modules/pos/components/ReceiptDialog.vue -->
<template>
  <v-dialog
    v-model="localOpen"
    max-width="480"
    scrollable
    @click:outside="close"
    @keydown.esc="close"
  >
    <v-card class="rcpt-card" rounded="xl">

      <!-- ── Header del dialog ── -->
      <div class="rcpt-dlg-header">
        <div class="rcpt-dlg-title">
          <v-icon size="16" color="primary" class="mr-2">mdi-receipt-text-outline</v-icon>
          Ticket de venta
        </div>
        <div class="rcpt-dlg-actions">
          <v-btn
            variant="flat"
            color="primary"
            size="small"
            prepend-icon="mdi-printer"
            @click="printTicket"
          >
            Imprimir
          </v-btn>
          <v-btn icon variant="text" size="small" @click="close">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-divider />

      <!-- ── Cuerpo scrollable ── -->
      <v-card-text class="rcpt-body pa-0">
        <div v-if="!sale" class="rcpt-empty">
          <v-icon size="40" color="medium-emphasis">mdi-receipt-text-outline</v-icon>
          <span>Sin venta seleccionada</span>
        </div>

        <!-- ╔═══════════════════════════╗
             ║       TICKET REAL         ║
             ╚═══════════════════════════╝ -->
        <div v-else id="pos-ticket" class="ticket">

          <!-- CABECERA EMPRESA -->
          <div class="ticket__header">
            <div class="ticket__company">{{ companyName }}</div>
            <div v-if="branchName" class="ticket__branch">{{ branchName }}</div>
            <div class="ticket__divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>
          </div>

          <!-- META VENTA -->
          <div class="ticket__meta">
            <div class="ticket__meta-row">
              <span>Comprobante</span>
              <span class="ticket__meta-val">N° {{ sale.sale_number || sale.id }}</span>
            </div>
            <div class="ticket__meta-row">
              <span>Fecha</span>
              <span class="ticket__meta-val">{{ fmtDatetime(sale.sold_at || sale.created_at) }}</span>
            </div>
            <div v-if="sellerName" class="ticket__meta-row">
              <span>Cajero</span>
              <span class="ticket__meta-val">{{ sellerName }}</span>
            </div>
            <div v-if="customerDisplay" class="ticket__meta-row">
              <span>Cliente</span>
              <span class="ticket__meta-val">{{ customerDisplay }}</span>
            </div>
            <div v-if="invoiceLabel" class="ticket__meta-row">
              <span>Comprobante</span>
              <span class="ticket__meta-val">{{ invoiceLabel }}</span>
            </div>
          </div>

          <div class="ticket__divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>

          <!-- ITEMS -->
          <div class="ticket__items">
            <div class="ticket__items-head">
              <span class="ticket__col-name">Producto</span>
              <span class="ticket__col-qty">Cant.</span>
              <span class="ticket__col-price">P.Unit</span>
              <span class="ticket__col-sub">Subtotal</span>
            </div>
            <div class="ticket__items-sep">────────────────────────</div>
            <div
              v-for="(it, i) in saleItems"
              :key="i"
              class="ticket__item"
            >
              <span class="ticket__col-name ticket__item-name">
                {{ it.product_name_snapshot || it.product?.name || `Prod. #${it.product_id}` }}
                <span v-if="it.product_sku_snapshot || it.product?.sku" class="ticket__item-sku">
                  SKU: {{ it.product_sku_snapshot || it.product?.sku }}
                </span>
              </span>
              <span class="ticket__col-qty">{{ fmtQty(it.qty ?? it.quantity ?? 1) }}</span>
              <span class="ticket__col-price">{{ money(it.unit_price ?? it.price ?? 0) }}</span>
              <span class="ticket__col-sub">{{ money(itemTotal(it)) }}</span>
            </div>
            <div class="ticket__items-sep">────────────────────────</div>
          </div>

          <!-- TOTALES -->
          <div class="ticket__totals">
            <div v-if="hasDiscount" class="ticket__total-row">
              <span>Subtotal bruto</span>
              <span>{{ money(grossTotal) }}</span>
            </div>
            <div v-if="hasDiscount" class="ticket__total-row ticket__total-row--discount">
              <span>Descuento</span>
              <span>- {{ money(discountTotal) }}</span>
            </div>
            <div class="ticket__total-row ticket__total-row--main">
              <span>TOTAL</span>
              <span>{{ money(sale.total) }}</span>
            </div>
          </div>

          <div class="ticket__divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>

          <!-- PAGOS -->
          <div class="ticket__payments">
            <div
              v-for="(p, i) in salePayments"
              :key="i"
              class="ticket__pay-row"
            >
              <span class="ticket__pay-method">{{ methodLabel(p.method) }}</span>
              <span v-if="p.reference" class="ticket__pay-ref"> ({{ p.reference }})</span>
              <span class="ticket__pay-amount">{{ money(p.amount) }}</span>
            </div>
            <div v-if="changeAmount > 0" class="ticket__pay-row ticket__pay-row--change">
              <span>Vuelto</span>
              <span>{{ money(changeAmount) }}</span>
            </div>
          </div>

          <div class="ticket__divider">━━━━━━━━━━━━━━━━━━━━━━━━</div>

          <!-- PIE -->
          <div class="ticket__footer">
            <div class="ticket__footer-thanks">¡Gracias por su compra!</div>
            <div class="ticket__footer-id">ID interno: #{{ sale.id }}</div>
          </div>

        </div>
      </v-card-text>

      <v-divider />

      <!-- ── Footer del dialog ── -->
      <v-card-actions class="rcpt-footer">
        <v-btn variant="tonal" size="small" @click="close">
          <v-icon start size="14">mdi-close</v-icon>
          Cerrar
        </v-btn>
        <v-spacer />
        <v-btn
          variant="flat"
          color="primary"
          size="small"
          prepend-icon="mdi-printer"
          @click="printTicket"
        >
          Imprimir ticket
        </v-btn>
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
  const nv = !!v;
  if (nv === !!props.open) return;
  emit("update:open", nv);
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
  const qty   = Number(it.qty ?? it.quantity ?? 1);
  const price = Number(it.unit_price ?? it.price ?? 0);
  return qty * price;
}
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH")        return "Efectivo";
  if (x === "TRANSFER")    return "Transferencia";
  if (x === "CARD")        return "Tarjeta";
  if (x === "MERCADOPAGO" || x === "QR") return "Mercado Pago";
  if (x.includes("CREDIT_SJ") || x.includes("SJCREDIT")) return "San Juan Crédito";
  return m || "—";
}

// ── computed from sale ────────────────────────────────────────────────────
const saleItems = computed(() => {
  const s = props.sale;
  if (!s) return [];
  return (s.items || s.sale_items || s.saleItems || []);
});

const salePayments = computed(() => {
  const s = props.sale;
  if (!s) return [];
  return (s.payments || []).map(p => ({
    ...p,
    amount: Number(p.amount || 0),
    method: resolveMethod(p),
  }));
});

function resolveMethod(p) {
  const ref = String(p?.reference || "").trim().toUpperCase();
  if (ref === "SJCREDIT" || ref === "SJ_CREDIT") return "CREDIT_SJT";
  return String(p?.method || "OTHER").toUpperCase();
}

const changeAmount = computed(() => Number(props.sale?.change_total || 0));

const grossTotal = computed(() =>
  saleItems.value.reduce((acc, it) => acc + itemTotal(it), 0)
);
const discountTotal = computed(() => Math.max(0, grossTotal.value - Number(props.sale?.total || 0)));
const hasDiscount   = computed(() => discountTotal.value > 0.009);

const sellerName = computed(() => {
  const u = props.sale?.user;
  if (!u) return "";
  return u.username || [u.first_name, u.last_name].filter(Boolean).join(" ") || `#${u.id}`;
});

const customerDisplay = computed(() => {
  const s = props.sale;
  if (!s) return "";
  const name = String(s.customer_name || "").trim();
  const doc  = String(s.customer_doc  || "").trim();
  if (name && doc) return `${name} · ${doc}`;
  return name || doc || "";
});

const invoiceLabel = computed(() => {
  const mode = String(props.sale?.invoice_mode || "").toUpperCase();
  const type = String(props.sale?.invoice_type || "").toUpperCase();
  if (mode === "FISCAL") return type ? `Fiscal – ${type}` : "Fiscal";
  return "";
});

// ── print ─────────────────────────────────────────────────────────────────
function printTicket() {
  const el = document.getElementById("pos-ticket");
  if (!el) return;

  const content = el.outerHTML;
  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) return;

  w.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ticket de Venta</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      color: #000;
      background: #fff;
      padding: 8px;
      width: 80mm;
    }
    .ticket__header { text-align: center; margin-bottom: 6px; }
    .ticket__company { font-size: 16px; font-weight: bold; text-transform: uppercase; }
    .ticket__branch  { font-size: 12px; }
    .ticket__divider { text-align: center; color: #555; margin: 4px 0; font-size: 10px; white-space: pre; }
    .ticket__meta-row { display: flex; justify-content: space-between; margin: 2px 0; font-size: 11px; }
    .ticket__meta-val { font-weight: bold; text-align: right; max-width: 60%; }
    .ticket__items-head { display: flex; font-weight: bold; font-size: 10px; border-bottom: 1px dashed #000; padding-bottom: 2px; margin-bottom: 2px; }
    .ticket__items-sep  { font-size: 10px; color: #555; margin: 2px 0; }
    .ticket__item { display: flex; flex-wrap: wrap; margin: 3px 0; }
    .ticket__col-name  { flex: 1; min-width: 0; word-break: break-word; }
    .ticket__col-qty   { width: 36px; text-align: right; }
    .ticket__col-price { width: 60px; text-align: right; }
    .ticket__col-sub   { width: 66px; text-align: right; font-weight: bold; }
    .ticket__item-name { display: block; }
    .ticket__item-sku  { display: block; font-size: 9px; color: #555; }
    .ticket__totals { margin-top: 4px; }
    .ticket__total-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 11px; }
    .ticket__total-row--discount { color: #e55; }
    .ticket__total-row--main { font-size: 15px; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 2px; }
    .ticket__payments { margin: 4px 0; }
    .ticket__pay-row { display: flex; justify-content: space-between; font-size: 11px; padding: 1px 0; }
    .ticket__pay-row--change { font-weight: bold; }
    .ticket__pay-ref { font-size: 10px; color: #555; margin-left: 4px; }
    .ticket__pay-amount { font-weight: bold; }
    .ticket__pay-method { flex: 1; }
    .ticket__footer { text-align: center; margin-top: 8px; font-size: 11px; }
    .ticket__footer-thanks { font-weight: bold; margin-bottom: 2px; }
    .ticket__footer-id { font-size: 9px; color: #777; }
  </style>
</head>
<body>${content}</body>
</html>`);

  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 400);
}
</script>

<style scoped>
/* ── Dialog shell ── */
.rcpt-card {
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}
.rcpt-dlg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
}
.rcpt-dlg-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}
.rcpt-dlg-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rcpt-body {
  max-height: 68vh;
  overflow-y: auto;
}
.rcpt-footer {
  padding: 10px 16px;
}
.rcpt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  color: rgba(var(--v-theme-on-surface), .4);
  font-size: 13px;
}

/* ── Ticket (preview en pantalla) ── */
.ticket {
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  color: rgb(var(--v-theme-on-surface));
  padding: 20px 24px;
  max-width: 420px;
  margin: 0 auto;
  line-height: 1.45;
}

.ticket__header { text-align: center; margin-bottom: 10px; }
.ticket__company {
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.ticket__branch {
  font-size: 12px;
  opacity: .6;
  margin-top: 2px;
}

.ticket__divider {
  text-align: center;
  font-size: 10px;
  opacity: .4;
  margin: 8px 0;
  letter-spacing: .05em;
}

/* meta */
.ticket__meta { display: flex; flex-direction: column; gap: 3px; }
.ticket__meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.ticket__meta-row span:first-child { opacity: .55; }
.ticket__meta-val { font-weight: 700; text-align: right; }

/* items */
.ticket__items-head {
  display: flex;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
  opacity: .55;
  padding-bottom: 4px;
}
.ticket__items-sep { font-size: 10px; opacity: .3; margin: 3px 0; }
.ticket__item { display: flex; margin: 5px 0; align-items: flex-start; }
.ticket__col-name  { flex: 1; min-width: 0; }
.ticket__col-qty   { width: 40px; text-align: right; flex-shrink: 0; }
.ticket__col-price { width: 72px; text-align: right; flex-shrink: 0; }
.ticket__col-sub   { width: 72px; text-align: right; flex-shrink: 0; font-weight: 800; }
.ticket__item-name { display: block; font-weight: 700; word-break: break-word; font-size: 12.5px; }
.ticket__item-sku  { display: block; font-size: 10px; opacity: .45; margin-top: 1px; }

/* totales */
.ticket__totals { margin-top: 6px; }
.ticket__total-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding: 2px 0;
}
.ticket__total-row--discount { color: rgb(var(--v-theme-error)); }
.ticket__total-row--main {
  font-size: 18px;
  font-weight: 900;
  border-top: 2px solid rgba(var(--v-theme-on-surface), .3);
  padding-top: 6px;
  margin-top: 4px;
}

/* pagos */
.ticket__payments { display: flex; flex-direction: column; gap: 3px; }
.ticket__pay-row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}
.ticket__pay-row--change { font-weight: 800; color: rgb(var(--v-theme-success)); }
.ticket__pay-method { flex: 1; }
.ticket__pay-ref { font-size: 10px; opacity: .5; margin-left: 4px; }
.ticket__pay-amount { font-weight: 700; }

/* footer */
.ticket__footer { text-align: center; padding-top: 4px; }
.ticket__footer-thanks { font-weight: 800; font-size: 13px; }
.ticket__footer-id { font-size: 10px; opacity: .35; margin-top: 3px; }
</style>
