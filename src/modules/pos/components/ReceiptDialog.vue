<!-- src/modules/pos/components/ReceiptDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="920">
    <v-card class="rd-root rounded-xl overflow-hidden">
      <!-- HEADER -->
      <div class="rd-head d-flex align-center justify-space-between px-4 py-3">
        <div>
          <div class="text-h6 font-weight-black">Comprobante</div>
          <div class="text-caption text-medium-emphasis">
            {{ companyName }} · {{ branchName || "Sucursal" }}
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn color="primary" variant="tonal" @click="onPrint" :disabled="!canPrint">
            <v-icon start>mdi-printer</v-icon>
            Imprimir
          </v-btn>
          <v-btn variant="text" @click="openLocal = false">Cerrar</v-btn>
        </div>
      </div>

      <v-divider />

      <v-card-text class="rd-body">
        <!-- ✅ Vista en pantalla -->
        <div ref="printArea" class="ticket">
          <div class="ticket__top">
            <div class="ticket__brand">{{ companyName }}</div>
            <div class="ticket__tagline">{{ companyTagline }}</div>

            <div class="ticket__branch">
              <div class="b1">{{ branchName || "Sucursal" }}</div>
              <div v-if="branchAddress" class="b2">{{ branchAddress }}</div>
              <div v-if="branchPhone" class="b2">{{ branchPhone }}</div>
            </div>
          </div>

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

          <div v-if="customerBlock" class="ticket__line"></div>

          <div v-if="customerBlock" class="ticket__customer">
            <div class="ttl">Cliente</div>
            <div class="sub">{{ customerBlock }}</div>
          </div>

          <div class="ticket__line"></div>

          <!-- ITEMS -->
          <div class="ticket__items">
            <div class="items__head">
              <span>Detalle</span>
              <span class="right">Importe</span>
            </div>

            <div v-for="(it, idx) in normalizedItems" :key="idx" class="item">
              <div class="item__name">
                <div class="nm">{{ it.name }}</div>
                <div class="sub">
                  {{ qty3(it.qty) }} × {{ money(it.unit_price) }}
                  <span v-if="it.price_label" class="lbl">· {{ it.price_label }}</span>
                </div>
              </div>
              <div class="item__total right">
                {{ money(it.subtotal) }}
              </div>
            </div>

            <div v-if="normalizedItems.length === 0" class="empty-items">
              No hay ítems para mostrar.
            </div>
          </div>

          <div class="ticket__line"></div>

          <!-- TOTAL -->
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

          <div class="ticket__footer">
            <div class="thanks">¡Gracias por su compra!</div>
            <div class="marketing">
              {{ marketingLine }}
            </div>
            <div class="legal">{{ legalLine }}</div>
          </div>
        </div>

        <div v-if="!canPrint" class="mt-3 text-caption text-medium-emphasis">
          ⚠️ Para imprimir, el navegador debe permitir ventanas emergentes (pop-ups) para este sitio.
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
  sale: { type: Object, default: () => ({}) },

  companyName: { type: String, default: "San Juan Tecnología" },
  companyTagline: { type: String, default: "Electrónica, Hogar y Seguridad Inteligente" },
  marketingLine: { type: String, default: "Seguinos en redes · Promos y novedades todas las semanas" },
  legalLine: { type: String, default: "Documento no válido como factura. Uso interno/comercial." },

  branchName: { type: String, default: "" },
  branchAddress: { type: String, default: "" },
  branchPhone: { type: String, default: "" },
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
  const t = toNum(s.total || s.amount_total || 0);
  const per = inst > 0 ? t / inst : 0;
  return `${inst} cuotas de ${money(per)}`;
});

const proofText = computed(() => {
  const s = props.sale || {};
  return s.proof || s.payment_proof || s.proof_id || s.operation_id || "";
});

const normalizedItems = computed(() => {
  const s = props.sale || {};
  const raw = s.items || s.lines || s.sale_items || s.cart || [];
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map((it) => {
      const qty = toNum(it.qty ?? it.quantity ?? 0);
      const unit = toNum(it.unit_price ?? it.price ?? it.unitPrice ?? 0);
      const sub = toNum(it.subtotal ?? (qty * unit));
      return {
        name: it.name || it.product_name || it.title || "—",
        qty,
        unit_price: unit,
        subtotal: sub,
        price_label: it.price_label || it.priceLabel || "",
      };
    })
    .filter((x) => String(x.name || "").trim() !== "");
});

const subtotal = computed(() => {
  const s = props.sale || {};
  if (toNum(s.subtotal) > 0) return toNum(s.subtotal);
  return normalizedItems.value.reduce((a, it) => a + toNum(it.subtotal), 0);
});

const total = computed(() => {
  const s = props.sale || {};
  if (toNum(s.total) > 0) return toNum(s.total);
  if (toNum(s.amount_total) > 0) return toNum(s.amount_total);
  return subtotal.value;
});

const customerBlock = computed(() => {
  const s = props.sale || {};
  const c = s.customer || s.client || {};
  const name = [c.first_name || c.firstName || "", c.last_name || c.lastName || ""].join(" ").trim();
  const wa = c.whatsapp || c.phone || "";
  const em = c.email || "";
  const out = [name, wa, em].filter(Boolean).join(" · ").trim();
  return out || "";
});

const canPrint = computed(() => {
  // print usa window.open -> si el browser bloquea popups, no imprime
  return true;
});

function buildPrintCss() {
  return `
    @page { margin: 8mm; }
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
    #ticketRoot { width: 80mm; max-width: 100%; margin: 0 auto; }

    .ticket {
      padding: 10px 10px;
      border: 1px dashed #777;
      border-radius: 10px;
    }

    .ticket__brand { font-size: 16px; font-weight: 900; text-align:center; }
    .ticket__tagline { font-size: 11px; text-align:center; opacity:.9; margin-top:3px; }
    .ticket__branch { text-align:center; margin-top:8px; }
    .ticket__branch .b1 { font-weight: 800; font-size: 12px; }
    .ticket__branch .b2 { font-size: 11px; opacity:.85; margin-top:2px; }

    .ticket__meta .row, .ticket__totals .row {
      display:flex; justify-content:space-between; gap:10px;
      font-size: 11px; margin: 4px 0;
    }
    .ticket__line { border-top: 1px dashed #444; margin: 10px 0; }

    .items__head {
      display:flex; justify-content:space-between;
      font-size: 11px; font-weight: 900; margin-bottom: 6px;
    }
    .item {
      display:flex; justify-content:space-between; gap:10px;
      font-size: 11px; margin: 8px 0;
    }
    .nm { font-weight: 900; }
    .sub { opacity:.85; margin-top: 2px; }
    .lbl { opacity:.85; }
    .right { text-align:right; white-space:nowrap; }

    .ticket__totals .total { font-size: 13px; font-weight: 900; margin-top: 8px; }

    .ticket__customer .ttl { font-weight: 900; font-size: 12px; margin-bottom: 4px; }
    .ticket__customer .sub { font-size: 11px; opacity:.9; }

    .ticket__footer { margin-top: 14px; text-align:center; font-size: 11px; }
    .thanks { font-weight: 900; }
    .marketing { opacity: .9; margin-top: 6px; }
    .legal { opacity:.7; margin-top:6px; }

    * { box-shadow: none !important; }
  `;
}

function onPrint() {
  const el = printArea.value;
  if (!el) return;

  // IMPORTANTE: outerHTML evita perder estructura; NO meter </script> en template string
  const ticketOuter = el.outerHTML;

  const html =
    "<!doctype html>" +
    "<html><head>" +
    '<meta charset="utf-8" />' +
    "<title>Comprobante</title>" +
    "<style>" +
    buildPrintCss() +
    "</style>" +
    "</head><body>" +
    '<div class="wrap"><div id="ticketRoot">' +
    ticketOuter +
    "</div></div>" +
    "<scr" +
    'ipt>window.onload=function(){window.print();window.close();};</scr' +
    "ipt>" +
    "</body></html>";

  const w = window.open("", "_blank", "noopener,noreferrer,width=520,height=720");
  if (!w) return; // popup bloqueado

  w.document.open();
  w.document.write(html);
  w.document.close();
}
</script>

<style scoped>
.rd-root {
  background: rgb(var(--v-theme-surface));
}

.rd-body {
  padding: 16px;
}

/* Vista en pantalla (dialog) */
.ticket {
  max-width: 640px;
  margin: 0 auto;
  padding: 18px;
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.18);
  border-radius: 16px;
}

.ticket__brand {
  font-weight: 1000;
  font-size: 20px;
  text-align: center;
  letter-spacing: 0.6px;
}
.ticket__tagline {
  font-size: 12px;
  text-align: center;
  opacity: 0.9;
  margin-top: 4px;
}
.ticket__branch {
  text-align: center;
  margin-top: 10px;
}
.ticket__branch .b1 {
  font-weight: 900;
  font-size: 13px;
}
.ticket__branch .b2 {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

.ticket__meta .row,
.ticket__totals .row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  margin: 6px 0;
}

.ticket__line {
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.35);
  margin: 12px 0;
}

.items__head {
  display: flex;
  justify-content: space-between;
  font-weight: 1000;
  font-size: 12px;
  margin-bottom: 6px;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  margin: 10px 0;
}

.item__name .nm {
  font-weight: 1000;
}
.item__name .sub {
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
  font-size: 15px;
  font-weight: 1000;
  margin-top: 10px;
}

.ticket__customer .ttl {
  font-weight: 1000;
  font-size: 13px;
  margin-bottom: 4px;
}
.ticket__customer .sub {
  font-size: 12px;
  opacity: 0.95;
}

.ticket__footer {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
}
.thanks {
  font-weight: 1000;
}
.legal {
  opacity: 0.7;
  margin-top: 6px;
}

.empty-items {
  padding: 10px 0;
  opacity: 0.7;
  font-size: 12px;
}
</style>
