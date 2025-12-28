<!-- src/modules/pos/components/ReceiptDialog.vue -->
<template>
  <v-dialog v-model="openLocal" max-width="980">
    <v-card class="rd-root rounded-xl overflow-hidden">
      <!-- HEADER -->
      <div class="rd-head d-flex align-center justify-space-between px-4 py-3">
        <div>
          <div class="text-h6 font-weight-black">Comprobante</div>
          <div class="text-caption text-medium-emphasis">
            {{ companyName }} · {{ branchNameEff || "Sucursal" }}
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn color="primary" variant="tonal" @click="onPrint">
            <v-icon start>mdi-printer</v-icon>
            Imprimir
          </v-btn>
          <v-btn variant="text" @click="openLocal = false">Cerrar</v-btn>
        </div>
      </div>

      <v-divider />

      <!-- BODY -->
      <v-card-text class="rd-body">
        <div class="screen-wrap">
          <div ref="printArea" class="ticket">
            <!-- MARCA -->
            <div class="brand__name">{{ companyName }}</div>
            <div class="brand__tag">{{ companyTagline }}</div>

            <div class="chip-row">
              <span class="chip">{{ branchNameEff || "Sucursal" }}</span>
              <span class="chip chip--muted">{{ paymentLabel }}</span>
            </div>

            <div v-if="branchAddressEff || branchPhoneEff" class="branch">
              <div v-if="branchAddressEff" class="branch__line">
                {{ branchAddressEff }}
              </div>
              <div v-if="branchPhoneEff" class="branch__line">
                {{ branchPhoneEff }}
              </div>
            </div>

            <div class="hr"></div>

            <!-- META -->
            <div class="meta__row">
              <span class="k">Fecha</span>
              <span class="v">{{ fmtDate(saleDate) }}</span>
            </div>
            <div class="meta__row">
              <span class="k">Comprobante</span>
              <span class="v">#{{ saleNumber }}</span>
            </div>

            <div class="hr"></div>

            <!-- ITEMS -->
            <div class="items__head">
              <span>Detalle</span>
              <span class="right">Importe</span>
            </div>

            <div v-for="(it, idx) in normalizedItems" :key="idx" class="item">
              <div>
                <div class="item__name">{{ it.name }}</div>
                <div class="item__sub">
                  {{ qtyPretty(it.qty) }} × {{ money(it.unit_price) }}
                </div>
              </div>
              <div class="right">{{ money(it.subtotal) }}</div>
            </div>

            <div v-if="normalizedItems.length === 0" class="empty-items">
              No hay ítems para mostrar.
            </div>

            <div class="hr"></div>

            <!-- TOTAL -->
            <div class="totals__row">
              <span class="k">Subtotal</span>
              <span class="v">{{ money(subtotal) }}</span>
            </div>
            <div class="totals__row grand">
              <span class="k">TOTAL</span>
              <span class="v">{{ money(total) }}</span>
            </div>

            <div class="hr hr--soft"></div>

            <!-- FOOTER -->
            <div class="footer">
              <div class="thanks">¡Gracias por tu compra! 🙌</div>
              <div class="marketing">{{ marketingLine }}</div>
              <div class="legal">{{ legalLine }}</div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, nextTick } from "vue";

/* ================= PROPS ================= */
const props = defineProps({
  open: { type: Boolean, default: false },
  sale: { type: Object, default: () => ({}) },

  companyName: { type: String, default: "SAN JUAN TECNOLOGIA" },
  companyTagline: { type: String, default: "Electrodomesticos · Hogar · Seguridad Inteligente" },
  marketingLine: {
    type: String,
    default: "Seguinos en redes · Promos y novedades todas las semanas",
  },
  legalLine: {
    type: String,
    default: "Documento no válido como factura. Uso interno/comercial.",
  },

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

/* ================= HELPERS ================= */
const toNum = (v) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const money = (v) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(toNum(v));

const qtyPretty = (n) => {
  const x = toNum(n);
  return Number.isInteger(x) ? String(x) : x.toFixed(3);
};

const fmtDate = (d) =>
  new Date(d || Date.now()).toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

/* ================= META ================= */
const saleNumber = computed(() => {
  const s = props.sale || {};
  return s.number || s.receipt_number || s.invoice_number || s.id || "—";
});

const saleDate = computed(() => {
  const s = props.sale || {};
  return s.created_at || s.createdAt || s.date || new Date();
});

const paymentLabel = computed(() => {
  const s = props.sale || {};
  const m = String(s.payment_method || s.method || "").toUpperCase();
  if (m === "CASH") return "Efectivo";
  if (m === "CARD") return "Tarjeta";
  if (m === "TRANSFER") return "Transferencia";
  if (m === "QR") return "Mercado Pago";
  return m || "—";
});

/* ================= SUCURSAL ================= */
const branchNameEff = computed(() => {
  const s = props.sale || {};
  const b = s.branch || s.sucursal || s.store || {};
  return props.branchName || b.name || b.nombre || "";
});

const branchAddressEff = computed(() => {
  const s = props.sale || {};
  const b = s.branch || s.sucursal || s.store || {};
  return props.branchAddress || b.address || b.direccion || "";
});

const branchPhoneEff = computed(() => {
  const s = props.sale || {};
  const b = s.branch || s.sucursal || s.store || {};
  return props.branchPhone || b.phone || b.telefono || "";
});

/* ================= ITEMS ================= */
function pickItems(s) {
  return s.items || s.lines || s.details || s.products || s.cart?.items || [];
}

function pickName(it) {
  return (
    it.name ||
    it.nombre ||
    it.descripcion ||
    it.product?.name ||
    it.product?.nombre ||
    it.sku ||
    "—"
  );
}

const normalizedItems = computed(() => {
  const arr = Array.isArray(pickItems(props.sale)) ? pickItems(props.sale) : [];
  return arr.map((it) => {
    const qty = toNum(it.qty ?? it.quantity ?? it.cantidad ?? 1);
    const unit = toNum(it.unit_price ?? it.price ?? it.precio ?? 0);
    const sub = toNum(it.subtotal ?? it.total ?? qty * unit);
    return { name: pickName(it), qty, unit_price: unit, subtotal: sub };
  });
});

const subtotal = computed(() =>
  normalizedItems.value.reduce((a, it) => a + toNum(it.subtotal), 0)
);

const total = computed(() => {
  const s = props.sale || {};
  return toNum(s.total || s.amount_total) || subtotal.value;
});

/* ================= PRINT ================= */
function buildPrintCss() {
  return `
    @page { size: 80mm auto; margin: 5mm; }

    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Helvetica Neue", sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Tema oscuro fix: siempre negro */
    body, body * { color: #111 !important; }

    #ticketRoot { width: 80mm; margin: 0 auto; }

    .ticket {
      background: #fff !important;
      padding: 11px 11px;
      border: 1px solid #111;
      border-radius: 10px;
      line-height: 1.15;
    }

    /* Tipografía tipo ticket (evita “Word gigante”) */
    .ticket, .ticket * { font-size: 10.5px !important; }

    .brand__name {
      font-size: 15px !important;
      font-weight: 900 !important;
      text-align: center !important;
      letter-spacing: .3px;
      margin: 0;
    }
    .brand__tag {
      font-size: 10px !important;
      opacity: .85;
      text-align: center;
      margin: 2px 0 6px 0;
    }

    /* Chips sin gap (PDF engines raros) */
    .chip-row { text-align: center; margin: 6px 0 8px; }
    .chip {
      display: inline-block !important;
      border: 1px solid #111;
      border-radius: 999px;
      padding: 3px 7px;
      font-size: 9px !important;
      font-weight: 800;
      margin-right: 5px;
      margin-bottom: 5px;
    }
    .chip--muted { opacity: .85; }

    .branch { text-align: center; margin-top: 2px; }
    .branch__line { font-size: 10px !important; opacity: .85; margin-top: 2px; }

    .hr { border-top: 1px dashed #111; margin: 8px 0; }
    .hr--soft { opacity: .7; }

    /* FIX PDF: grid para columnas */
    .meta__row,
    .totals__row,
    .items__head,
    .item {
      display: grid !important;
      grid-template-columns: 1fr auto !important;
      column-gap: 10px !important;
      align-items: baseline !important;
      margin: 4px 0;
    }

    .k { opacity: .82; }
    .v { font-weight: 800; justify-self: end !important; }
    .right { justify-self: end !important; white-space: nowrap !important; text-align: right !important; }

    .items__head { font-weight: 900; margin-top: 2px; }
    .item { margin: 6px 0; }

    .item__name { font-weight: 900; }
    .item__sub { opacity: .85; margin-top: 2px; }

    .totals__row { margin-top: 4px; }
    .totals__row.grand { font-size: 12.5px !important; font-weight: 900; margin-top: 6px; }

    .footer { text-align: center; margin-top: 10px; }
    .thanks { font-weight: 900; }
    .marketing { opacity: .9; margin-top: 6px; }
    .legal { opacity: .7; margin-top: 6px; }
  `;
}

async function onPrint() {
  await nextTick();
  const el = printArea.value;
  if (!el) return;

  const html =
    "<!doctype html><html><head><meta charset='utf-8'>" +
    "<style>" +
    buildPrintCss() +
    "</style></head><body>" +
    "<div id='ticketRoot'>" +
    el.outerHTML +
    "</div></body></html>";

  const w = window.open("", "_blank", "width=520,height=720");
  if (!w) return;

  w.document.open();
  w.document.write(html);
  w.document.close();

  setTimeout(() => {
    w.print();
    w.close();
  }, 200);
}
</script>

<style scoped>
/* ===== FIX DEFINITIVO: texto visible en tema oscuro ===== */
.ticket,
.ticket * {
  color: #111 !important;
}

.ticket {
  background: #fff !important;
  border: 1px solid rgba(0, 0, 0, 0.7);
  border-radius: 14px;
  padding: 18px;
}

/* Mejoras pantalla: más lindo, no cambia tu estructura */
.brand__name {
  font-size: 22px;
  font-weight: 1000;
  text-align: center;
  letter-spacing: 0.4px;
}

.brand__tag {
  text-align: center;
  font-size: 12px;
  opacity: 0.9;
  margin-top: 2px;
}

.chip-row {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 12px 0 10px;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid #000;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 900;
}

.chip--muted {
  opacity: 0.85;
}

.branch {
  text-align: center;
  margin-top: 6px;
}

.branch__line {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

.hr {
  border-top: 1px dashed rgba(0, 0, 0, 0.55);
  margin: 14px 0;
}
.hr--soft {
  opacity: 0.7;
}

.meta__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 6px 0;
}
.k { opacity: 0.78; }
.v { font-weight: 900; }

.items__head,
.item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.items__head {
  font-weight: 1000;
  margin-bottom: 8px;
}

.item {
  margin: 10px 0;
}

.item__name {
  font-weight: 1000;
}

.item__sub {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 2px;
}

.right {
  text-align: right;
  white-space: nowrap;
}

.totals__row {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}

.totals__row.grand {
  font-size: 16px;
  font-weight: 1000;
  margin-top: 10px;
}

.footer {
  text-align: center;
  margin-top: 14px;
}

.thanks {
  font-weight: 1000;
}
</style>
