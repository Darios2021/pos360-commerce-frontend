<!-- src/modules/pos/components/ReceiptDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="860">
    <v-card class="rd-root rounded-xl overflow-hidden">
      <!-- HEADER -->
      <div class="rd-head d-flex align-center justify-space-between px-4 py-3">
        <div>
          <div class="text-h6 font-weight-black">Comprobante de compra</div>
          <div class="text-caption text-medium-emphasis">
            {{ companyName }} · {{ companyTagline }}
          </div>
          <div class="text-caption text-medium-emphasis mt-1">
            {{ branchDisplay }}
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn color="primary" variant="flat" @click="onPrint" :disabled="!canPrint">
            <v-icon start>mdi-printer</v-icon>
            Imprimir
          </v-btn>
          <v-btn variant="text" @click="openLocal = false">Cerrar</v-btn>
        </div>
      </div>

      <v-divider />

      <v-card-text class="rd-body">
        <!-- ✅ ÁREA IMPRIMIBLE -->
        <div ref="printArea" class="ticket">
          <!-- BRAND BLOCK -->
          <div class="ticket__top">
            <div class="ticket__logo">{{ companyName }}</div>
            <div class="ticket__tagline">{{ companyTagline }}</div>

            <div class="ticket__branch">
              <div class="bname">{{ branchName || "Sucursal" }}</div>
              <div class="bline" v-if="branchAddress">{{ branchAddress }}</div>
              <div class="bline" v-if="branchPhone">Tel: {{ branchPhone }}</div>
              <div class="bline" v-if="branchEmail">Email: {{ branchEmail }}</div>
              <div class="bline" v-if="branchCuit">CUIT: {{ branchCuit }}</div>
            </div>
          </div>

          <div class="ticket__sep"></div>

          <!-- META -->
          <div class="ticket__meta">
            <div class="row">
              <span class="k">Fecha</span>
              <span class="v">{{ fmtDate(saleDate) }}</span>
            </div>
            <div class="row">
              <span class="k">Comprobante</span>
              <span class="v">#{{ saleNumber }}</span>
            </div>
            <div class="row">
              <span class="k">Método</span>
              <span class="v">{{ paymentLabel }}</span>
            </div>

            <div v-if="installmentsText" class="row">
              <span class="k">Cuotas</span>
              <span class="v">{{ installmentsText }}</span>
            </div>

            <div v-if="proofText" class="row">
              <span class="k">Operación / ID</span>
              <span class="v">{{ proofText }}</span>
            </div>
          </div>

          <!-- CUSTOMER -->
          <div v-if="customerBlock" class="ticket__sep"></div>
          <div v-if="customerBlock" class="ticket__customer">
            <div class="ttl">Cliente</div>
            <div class="line" v-if="customerName"><b>{{ customerName }}</b></div>
            <div class="line" v-if="customerWhatsapp">WhatsApp: {{ customerWhatsapp }}</div>
            <div class="line" v-if="customerEmail">Email: {{ customerEmail }}</div>
          </div>

          <div class="ticket__sep"></div>

          <!-- ITEMS -->
          <div class="ticket__items">
            <div class="items__head">
              <span>Detalle</span>
              <span class="right">Importe</span>
            </div>

            <div v-if="normalizedItems.length === 0" class="empty-items">
              No hay ítems en el comprobante. (Falta pasar items/total en la venta)
            </div>

            <div v-for="(it, idx) in normalizedItems" :key="idx" class="item">
              <div class="item__left">
                <div class="nm">{{ it.name }}</div>
                <div class="sub">
                  {{ qty3(it.qty) }} × {{ money(it.unit_price) }}
                  <span v-if="it.price_label" class="lbl">· {{ it.price_label }}</span>
                </div>
              </div>
              <div class="item__right right">
                {{ money(it.subtotal) }}
              </div>
            </div>
          </div>

          <div class="ticket__sep"></div>

          <!-- TOTALS -->
          <div class="ticket__totals">
            <div class="row">
              <span class="k">Subtotal</span>
              <span class="v">{{ money(subtotal) }}</span>
            </div>
            <div class="row total">
              <span class="k">TOTAL</span>
              <span class="v">{{ money(total) }}</span>
            </div>
          </div>

          <div class="ticket__sep"></div>

          <!-- MARKETING FOOTER -->
          <div class="ticket__footer">
            <div class="thanks">¡Gracias por elegir San Juan Tecnología!</div>
            <div class="mkt">
              Electrónica · Hogar · Seguridad Inteligente
            </div>
            <div class="mkt2" v-if="marketingLine">
              {{ marketingLine }}
            </div>
            <div class="legal">{{ legalLine }}</div>
          </div>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="px-4 py-3">
        <v-spacer />
        <v-btn color="primary" variant="flat" @click="onPrint" :disabled="!canPrint">
          <v-icon start>mdi-printer</v-icon>
          Imprimir ticket
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },

  // venta (lo que venga del backend o armado en frontend)
  sale: { type: Object, default: () => ({}) },

  // Marca / Marketing
  companyName: { type: String, default: "San Juan Tecnología" },
  companyTagline: { type: String, default: "Electrónica, Hogar y Seguridad Inteligente" },
  marketingLine: { type: String, default: "Seguinos y enterate de promos y novedades." },
  legalLine: { type: String, default: "Documento no válido como factura. Uso interno/comercial." },

  // Sucursal (podés pasarlos desde POS)
  branchName: { type: String, default: "" },
  branchAddress: { type: String, default: "" },
  branchPhone: { type: String, default: "" },
  branchEmail: { type: String, default: "" },
  branchCuit: { type: String, default: "" },
});

const emit = defineEmits(["update:open"]);

const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const printArea = ref(null);

function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(val));
}

function qty3(n) {
  return toNum(n).toFixed(3);
}

function fmtDate(d) {
  try {
    const dt = d ? new Date(d) : new Date();
    return dt.toLocaleString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

const saleNumber = computed(() => {
  const s = props.sale || {};
  return s.number || s.receipt_number || s.invoice_number || s.id || "—";
});

const saleDate = computed(() => {
  const s = props.sale || {};
  return s.created_at || s.createdAt || s.date || s.sold_at || new Date();
});

const paymentLabel = computed(() => {
  const s = props.sale || {};
  const m = String(s.payment_method || s.method || s.paymentMethod || "").toUpperCase();
  if (m === "CASH") return "Efectivo";
  if (m === "CARD") return "Tarjeta / Débito";
  if (m === "TRANSFER") return "Transferencia";
  if (m === "QR") return "Mercado Pago (QR)";
  return m || "—";
});

const installmentsText = computed(() => {
  const s = props.sale || {};
  const inst = Number(s.installments || s.cuotas || 0);
  if (!(inst > 1)) return "";
  const t = toNum(s.total || s.amount_total || s.amountTotal || 0);
  const per = inst > 0 ? t / inst : 0;
  return `${inst} cuotas de ${money(per)}`;
});

const proofText = computed(() => {
  const s = props.sale || {};
  return s.proof || s.payment_proof || s.proof_id || s.operation_id || s.operationId || "";
});

const normalizedItems = computed(() => {
  const s = props.sale || {};
  const raw = s.items || s.lines || s.sale_items || s.saleItems || s.cart || s.detail || [];
  const arr = Array.isArray(raw) ? raw : [];

  return arr.map((it) => {
    const qty = toNum(it.qty || it.quantity || it.cantidad || 0);
    const unit = toNum(it.unit_price ?? it.price ?? it.unitPrice ?? it.unit ?? 0);
    const sub = toNum(it.subtotal ?? it.total_line ?? it.totalLine ?? qty * unit);
    return {
      name: it.name || it.product_name || it.productName || it.title || "—",
      qty,
      unit_price: unit,
      subtotal: sub,
      price_label: it.price_label || it.priceLabel || it.policy || "",
    };
  });
});

const subtotal = computed(() => {
  const s = props.sale || {};
  const v = toNum(s.subtotal || s.amount_subtotal || s.amountSubtotal || 0);
  if (v > 0) return v;
  return normalizedItems.value.reduce((a, it) => a + toNum(it.subtotal), 0);
});

const total = computed(() => {
  const s = props.sale || {};
  const v1 = toNum(s.total || s.amount_total || s.amountTotal || 0);
  if (v1 > 0) return v1;
  return subtotal.value;
});

// Customer (sale.customer o sale.client)
const customer = computed(() => {
  const s = props.sale || {};
  return s.customer || s.client || s.cliente || {};
});

const customerName = computed(() => {
  const c = customer.value || {};
  const n = [c.first_name || c.firstName || c.nombre || "", c.last_name || c.lastName || c.apellido || ""]
    .join(" ")
    .trim();
  return n || "";
});

const customerWhatsapp = computed(() => {
  const c = customer.value || {};
  return c.whatsapp || c.phone || c.telefono || "";
});

const customerEmail = computed(() => {
  const c = customer.value || {};
  return c.email || "";
});

const customerBlock = computed(() => {
  return [customerName.value, customerWhatsapp.value, customerEmail.value].filter(Boolean).join(" · ").trim();
});

const branchDisplay = computed(() => {
  const bits = [props.branchName || "Sucursal"];
  if (props.branchAddress) bits.push(props.branchAddress);
  return bits.join(" · ");
});

const canPrint = computed(() => {
  // imprimible aunque haya pocos datos, pero al menos debe existir el DOM
  return true;
});

/* ===========================
   ✅ PRINT ROBUSTO (sin popup)
   Usa iframe oculto → dispara impresora
=========================== */
function buildPrintCss() {
  return `
    @page { margin: 6mm; }
    html, body { height: 100%; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .wrap { padding: 0; }

    /* 80mm típico ticket */
    #ticketRoot { width: 80mm; max-width: 100%; margin: 0 auto; }

    .ticket {
      padding: 10px;
      border: 1px dashed #777;
      border-radius: 10px;
    }
    .ticket__logo { font-size: 16px; font-weight: 900; text-align:center; }
    .ticket__tagline { font-size: 11px; text-align:center; opacity:.9; margin-top:4px; }
    .ticket__branch { margin-top: 10px; text-align:center; font-size: 11px; opacity:.95; }
    .ticket__branch .bname { font-weight: 900; margin-bottom: 2px; }
    .ticket__branch .bline { opacity: .9; margin-top: 1px; }

    .ticket__sep { border-top: 1px dashed #444; margin: 10px 0; }

    .ticket__meta .row, .ticket__totals .row {
      display:flex; justify-content:space-between; gap:10px;
      font-size: 11px; margin: 4px 0;
    }
    .items__head {
      display:flex; justify-content:space-between;
      font-size: 11px; font-weight: 800; margin-bottom: 6px;
    }
    .item {
      display:flex; justify-content:space-between; gap:10px;
      font-size: 11px; margin: 8px 0;
    }
    .nm { font-weight: 800; }
    .sub { opacity:.85; margin-top: 2px; }
    .lbl { opacity:.85; }
    .right { text-align:right; white-space:nowrap; }

    .ticket__totals .total { font-size: 13px; font-weight: 900; margin-top: 8px; }

    .ticket__customer .ttl { font-weight: 900; font-size: 12px; margin-bottom: 4px; }
    .ticket__customer .line { font-size: 11px; margin-top: 2px; }

    .ticket__footer { margin-top: 10px; text-align:center; font-size: 11px; }
    .thanks { font-weight: 900; }
    .mkt { margin-top: 6px; opacity: .9; }
    .mkt2 { margin-top: 6px; opacity: .85; }
    .legal { opacity:.7; margin-top:8px; }

    * { box-shadow: none !important; }
  `;
}

function printHtmlInIframe(html) {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return false;
  }

  doc.open();
  doc.write(html);
  doc.close();

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      // limpiar
      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 300);
    }
  };

  return true;
}

function onPrint() {
  const el = printArea.value;
  if (!el) return;

  // 👉 clono SOLO el contenido del ticket dentro de un root 80mm
  const ticketInner = el.innerHTML;

  const html =
    `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Comprobante</title>
  <style>${buildPrintCss()}</style>
</head>
<body>
  <div id="ticketRoot">
    <div class="ticket">
      ${ticketInner}
    </div>
  </div>
</body>
</html>`;

  printHtmlInIframe(html);
}
</script>

<style scoped>
.rd-root {
  background: rgb(var(--v-theme-surface));
}

.rd-body {
  padding: 16px;
}

/* Vista en pantalla */
.ticket {
  max-width: 640px;
  margin: 0 auto;
  padding: 18px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 16px;
  background: rgba(var(--v-theme-surface), 0.9);
}

.ticket__logo {
  font-weight: 900;
  font-size: 22px;
  text-align: center;
  letter-spacing: 0.4px;
}

.ticket__tagline {
  font-size: 13px;
  text-align: center;
  opacity: 0.9;
  margin-top: 4px;
}

.ticket__branch {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  opacity: 0.92;
}
.ticket__branch .bname {
  font-weight: 900;
}
.ticket__branch .bline {
  margin-top: 2px;
  opacity: 0.9;
}

.ticket__sep {
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.35);
  margin: 14px 0;
}

.ticket__meta .row,
.ticket__totals .row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  margin: 6px 0;
}

.items__head {
  display: flex;
  justify-content: space-between;
  font-weight: 900;
  font-size: 12px;
  margin-bottom: 8px;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  margin: 10px 0;
}

.item__left .nm {
  font-weight: 900;
}
.item__left .sub {
  opacity: 0.85;
  margin-top: 2px;
}
.lbl {
  opacity: 0.85;
}
.right {
  text-align: right;
  white-space: nowrap;
}

.ticket__totals .total {
  font-size: 16px;
  font-weight: 900;
  margin-top: 10px;
}

.ticket__customer .ttl {
  font-weight: 900;
  font-size: 13px;
  margin-bottom: 6px;
}
.ticket__customer .line {
  font-size: 12px;
  opacity: 0.95;
  margin-top: 2px;
}

.ticket__footer {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
}
.thanks {
  font-weight: 900;
  font-size: 13px;
}
.mkt {
  opacity: 0.92;
  margin-top: 6px;
}
.mkt2 {
  opacity: 0.86;
  margin-top: 6px;
}
.legal {
  opacity: 0.7;
  margin-top: 10px;
}

.empty-items {
  padding: 10px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.25);
  border-radius: 10px;
  opacity: 0.85;
}
</style>
