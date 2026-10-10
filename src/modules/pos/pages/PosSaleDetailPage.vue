<!-- src/modules/pos/pages/PosSaleDetailPage.vue -->
<template>
  <div class="vd">
    <!-- ── Encabezado ───────────────────────────────────── -->
    <div class="vd-cab">
      <div class="vd-cab__txt">
        <router-link :to="{ name: 'posSales' }" class="vd-volver"><v-icon size="18">mdi-arrow-left</v-icon>Ventas</router-link>
        <h1 class="vd-cab__titulo num">Venta #{{ sale?.id ?? id }}</h1>
        <span v-if="sale" class="vd-cab__sub num">{{ subtitulo }}</span>
      </div>
      <div v-if="sale" class="vd-cab__der">
        <span class="vd-estado" :class="`is-${String(sale.status || '').toLowerCase()}`"><i></i>{{ statusLabel(sale.status) }}</span>
        <span class="vd-total">
          <span class="vd-total__k">Total<template v-if="items.length > 1"> · {{ items.length }} productos</template></span>
          <span class="vd-total__v num">{{ plata(sale.total) }}</span>
        </span>
      </div>
    </div>

    <div v-if="loading" class="vd-caja vd-vacio"><v-progress-circular indeterminate size="28" color="primary" /></div>
    <div v-else-if="!sale" class="vd-caja vd-vacio">Venta no encontrada</div>

    <template v-else>
      <div class="vd-principal">
        <!-- Un producto: la foto manda -->
        <section v-if="items.length === 1" class="vd-caja vd-heroe">
          <button type="button" class="vd-heroe__foto" :aria-label="`Imagen de ${productName(items[0])}`" @click="openImage(items[0])">
            <img v-if="itemImage(items[0])" :src="itemImage(items[0])" alt="" />
            <v-icon v-else size="56">mdi-image-outline</v-icon>
          </button>
          <div class="vd-heroe__info">
            <div class="vd-heroe__cab">
              <span v-if="rubroTexto(items[0])" class="vd-rubro">{{ rubroTexto(items[0]) }}</span>
              <span class="vd-heroe__nombre">{{ productName(items[0]) }}</span>
              <span class="vd-s num">{{ codigosTexto(items[0]) }}</span>
            </div>
            <dl class="vd-datos vd-datos--caja num">
              <dt>Cantidad</dt><dd>{{ cantidadTexto(items[0].quantity) }}</dd>
              <dt>Precio cobrado</dt><dd>{{ plata(items[0].unit_price) }}<span v-if="basePrecio" class="vd-suave"> · {{ basePrecio }}</span></dd>
              <template v-if="precioLista(items[0]) > Number(items[0].unit_price || 0)">
                <dt>Precio de lista</dt><dd class="vd-tachado">{{ plata(precioLista(items[0])) }}</dd>
                <dt>Diferencia</dt><dd>{{ plata(precioLista(items[0]) - Number(items[0].unit_price || 0)) }} menos que lista</dd>
              </template>
              <template v-if="Number(items[0].discount_amount || 0) > 0">
                <dt>Descuento</dt><dd>- {{ plata(items[0].discount_amount) }}</dd>
              </template>
            </dl>
            <div class="vd-heroe__pie">
              <span class="vd-s num">{{ stockQty(items[0]) !== null ? `Stock hoy: ${cantidadTexto(stockQty(items[0]))}` : '' }}</span>
              <router-link v-if="pidOf(items[0])" :to="{ name: 'productView', params: { id: pidOf(items[0]) } }" class="vd-link">Ver producto<v-icon size="20">mdi-chevron-right</v-icon></router-link>
            </div>
          </div>
        </section>

        <!-- Varios productos: una tarjeta con foto por producto -->
        <section v-else class="vd-productos">
          <router-link
            v-for="item in items"
            :key="item.id || item.product_id"
            :to="pidOf(item) ? { name: 'productView', params: { id: pidOf(item) } } : {}"
            class="vd-caja vd-prod"
          >
            <span class="vd-prod__foto">
              <img v-if="itemImage(item)" :src="itemImage(item)" alt="" />
              <v-icon v-else size="40">mdi-image-outline</v-icon>
            </span>
            <span class="vd-prod__info">
              <span v-if="rubroTexto(item)" class="vd-rubro">{{ rubroTexto(item) }}</span>
              <span class="vd-prod__nombre">{{ productName(item) }}</span>
              <span class="vd-s num">{{ codigosTexto(item) }}</span>
              <span class="vd-prod__esp"></span>
              <span class="vd-s num">
                {{ number(item.quantity) }} × {{ plata(item.unit_price) }}
                <template v-if="precioLista(item) > Number(item.unit_price || 0)"> · lista <s>{{ plata(precioLista(item)) }}</s></template>
              </span>
              <span class="vd-prod__total num">{{ plata(item.line_total) }}</span>
            </span>
          </router-link>
          <div v-if="!items.length" class="vd-caja vd-vacio">Sin productos en esta venta</div>
        </section>

        <!-- Quién la vendió -->
        <section class="vd-caja vd-vendio">
          <div class="vd-banda"><span>La vendió</span></div>
          <div class="vd-vendio__quien">
            <span class="vd-avatar">{{ vendedor.iniciales }}</span>
            <span class="vd-vendio__txt">
              <span class="vd-vendio__nombre">{{ vendedor.nombre }}</span>
              <span class="vd-s">{{ [vendedor.usuario ? `Usuario ${vendedor.usuario}` : '', branchLabelResolved].filter(Boolean).join(' · ') }}</span>
            </span>
          </div>
          <dl class="vd-datos num">
            <template v-if="sale.cash_register_id"><dt>Caja</dt><dd>#{{ sale.cash_register_id }}<template v-if="cajaAbierta"> · abierta {{ cajaAbierta }}</template></dd></template>
            <template v-if="delDia"><dt>Ese día</dt><dd>{{ delDia.ventas }} {{ delDia.ventas === 1 ? 'venta' : 'ventas' }} · {{ plata(delDia.total) }}</dd></template>
            <template v-if="delDia && delDia.orden && delDia.ventas > 1"><dt>Esta venta</dt><dd>{{ delDia.orden }}.ª del día</dd></template>
          </dl>
          <router-link v-if="sale.user_id" :to="{ name: 'posSales', query: { cajero: String(sale.user_id) } }" class="vd-vendio__ver">
            Ver sus ventas<v-icon size="20">mdi-chevron-right</v-icon>
          </router-link>
        </section>
      </div>

      <div class="vd-trio">
        <!-- Cobro -->
        <section class="vd-caja">
          <div class="vd-banda"><span>Cobro</span><span class="num">{{ plata(sale.paid_total) }}</span></div>
          <div class="vd-filas">
            <div v-for="pm in paymentsResolved" :key="pm.id || `${pm.payment_method_id}_${pm.amount}`" class="vd-pago">
              <div class="vd-pago__linea">
                <span class="vd-pago__medio">
                  <span class="vd-medio"><i :style="{ background: colorMedio(pm.method_resolved) }"></i>{{ pm.method_display }}</span>
                  <span class="vd-s">{{ detallePago(pm) }}</span>
                </span>
                <span class="vd-pago__monto num">{{ plata(pm.amount) }}</span>
              </div>
              <div v-if="pm.reference || pm.note_human" class="vd-s">{{ [pm.reference ? `Ref: ${pm.reference}` : '', pm.note_human].filter(Boolean).join(' · ') }}</div>
            </div>
            <div v-if="Number(sale.change_total || 0) > 0" class="vd-s num vd-vuelto">Vuelto {{ plata(sale.change_total) }}</div>
            <div v-if="!paymentsResolved.length" class="vd-vacio">Sin pagos registrados</div>
          </div>
        </section>

        <!-- Comprobante y cliente -->
        <section class="vd-caja">
          <div class="vd-banda"><span>Comprobante</span></div>
          <dl class="vd-datos">
            <dt>Tipo</dt><dd>{{ comprobanteTexto }}</dd>
            <template v-if="sale.sale_number"><dt>Número</dt><dd class="num">#{{ sale.sale_number }}</dd></template>
            <dt>Cliente</dt><dd>{{ customerNameResolved }}</dd>
            <template v-if="customerDocResolved"><dt>Documento</dt><dd class="num">{{ customerDocResolved }}</dd></template>
            <template v-if="customerPhoneResolved"><dt>Teléfono</dt><dd class="num">{{ customerPhoneResolved }}</dd></template>
            <template v-if="customerEmailResolved"><dt>Correo</dt><dd>{{ customerEmailResolved }}</dd></template>
            <template v-if="sale.note"><dt>Nota</dt><dd>{{ sale.note }}</dd></template>
          </dl>
        </section>

        <!-- Devoluciones y cambios -->
        <section class="vd-caja">
          <div class="vd-banda"><span>Devoluciones y cambios</span><span v-if="refundsTotal > 0" class="num">- {{ plata(refundsTotal) }}</span></div>
          <div class="vd-filas">
            <div v-for="r in refunds" :key="`r${r.id}`" class="vd-mov">
              <span class="vd-mov__txt">
                <span class="vd-b">Devolución · <span class="num">{{ dt(r.created_at) }}</span></span>
                <span class="vd-s">{{ refundMethodLabel(r) }}<template v-if="r.reference"> · Ref: {{ r.reference }}</template><template v-if="r.reason"> · {{ r.reason }}</template></span>
              </span>
              <span class="vd-mov__monto num">- {{ plata(r.amount) }}</span>
            </div>
            <div v-for="x in exchanges" :key="`x${x.id}`" class="vd-mov">
              <span class="vd-mov__txt">
                <span class="vd-b">Cambio · <span class="num">{{ dt(x.created_at) }}</span></span>
                <span class="vd-s num">Original {{ plata(x.original_total) }} · Nuevo {{ plata(x.new_total) }}<template v-if="x.note"> · {{ x.note }}</template></span>
              </span>
              <span class="vd-mov__monto num">Dif. {{ plata(x.diff) }}</span>
            </div>
            <div v-if="showNetSummary" class="vd-mov vd-mov--neto"><span class="vd-b">Neto de la venta</span><span class="vd-mov__monto num">{{ plata(netTotal) }}</span></div>
            <div v-if="!refunds.length && !exchanges.length" class="vd-vacio">Ninguno</div>
          </div>
        </section>
      </div>

      <!-- Anulación: en la vista completa de la venta, nunca en una ventana emergente -->
      <section v-if="isAdmin && sale.status !== 'CANCELLED'" class="vd-anular">
        <div class="vd-anular__txt">
          <span class="vd-anular__tit">Anular la venta</span>
          <span class="vd-s">Se restaura el stock, la venta queda como anulada y no cuenta en el arqueo.</span>
        </div>
        <v-btn
          v-if="!confirmandoAnular"
          variant="tonal"
          color="error"
          prepend-icon="mdi-cancel"
          @click="confirmandoAnular = true"
        >Anular venta</v-btn>
        <div v-else class="vd-anular__confirma">
          <v-btn
            variant="flat"
            color="error"
            prepend-icon="mdi-cancel"
            :loading="anulando"
            @click="anularVenta"
          >Confirmar anulación de #{{ sale.id }}</v-btn>
          <a href="#" class="vd-anular__no" @click.prevent="confirmandoAnular = false">No anular</a>
        </div>
      </section>
    </template>

    <!-- Imagen del producto: solo mirar, nada que editar -->
    <v-dialog v-model="imageDialog" max-width="760">
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="font-weight-black">{{ productName(imageItem) }}</span>
          <v-btn icon variant="text" aria-label="Cerrar" @click="imageDialog = false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-img v-if="itemImage(imageItem)" :src="itemImage(imageItem)" contain style="max-height:500px;border-radius:12px;" />
          <v-alert v-else type="info" variant="tonal">Sin imagen para este producto.</v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">{{ snack.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useProductsStore } from "../../../app/store/products.store";
import { useAuthStore } from "../../../app/store/auth.store";

const route = useRoute();
const router = useRouter();
const productsStore = useProductsStore();

const id = computed(() => Number(route.params.id || 0));
const loading = ref(false);
const activeTab = ref("resumen");

const payload = ref(null);
const sale = computed(() => payload.value?.sale || null);
const saleExtra = computed(() => safeJsonParse(sale.value?.extra) || {});

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

function safeJsonParse(v) {
  if (!v) return null;
  if (typeof v === "object") return v;
  const s = String(v || "").trim();
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
function numOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function hasValue(v) {
  return v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
}
function firstFilled(...vals) {
  for (const v of vals) { const s = String(v ?? "").trim(); if (s) return s; }
  return "";
}

function customerData() {
  const s = sale.value || {};
  const extra = saleExtra.value || {};
  const c = extra.customer || s.customer || s.Customer || {};
  return {
    name: firstFilled(
      s.customer_name, s.customerName, c.name, c.customer_name, c.full_name, c.fullName,
      [c.first_name, c.last_name].filter(Boolean).join(" "),
      [c.firstName, c.lastName].filter(Boolean).join(" ")
    ),
    doc: firstFilled(s.customer_doc, s.customerDoc, c.doc, c.customer_doc, c.document, c.documento, c.dni, c.cuit, c.cuil),
    phone: firstFilled(s.customer_phone, s.customerPhone, c.phone, c.customer_phone, c.telefono, c.tel, c.mobile, c.whatsapp),
    email: firstFilled(c.email, c.mail),
  };
}

const customerNameResolved = computed(() => {
  const d = customerData();
  if (d.name) return d.name;
  const cid = Number(sale.value?.customer_id || sale.value?.customer?.id || 0);
  return cid ? `Cliente #${cid}` : "Consumidor Final";
});
const customerDocResolved = computed(() => customerData().doc || "");
const customerPhoneResolved = computed(() => customerData().phone || "");
const customerEmailResolved = computed(() => customerData().email || "");
const showCustomerDataBlock = computed(() => !!(customerDocResolved.value || customerPhoneResolved.value || customerEmailResolved.value));

const customerInitials = computed(() => {
  const name = customerNameResolved.value || "CF";
  const parts = name.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || name.slice(0, 2).toUpperCase();
});

const branchLabelResolved = computed(() => {
  const s = sale.value || {};
  return firstFilled(s.branch?.name, s.branch_name, s.branch?.display_name, s.branch_id ? `#${s.branch_id}` : "");
});

const invoiceModeResolved = computed(() =>
  firstFilled(saleExtra.value?.invoice_mode, sale.value?.invoice_mode).toUpperCase()
);
const invoiceTypeResolved = computed(() =>
  firstFilled(saleExtra.value?.invoice_type, sale.value?.invoice_type, "—").toUpperCase()
);
const customerTypeResolved = computed(() =>
  firstFilled(saleExtra.value?.customer_type, sale.value?.customer_type, "CONSUMIDOR_FINAL").toUpperCase()
);
const invoiceModeLabelResolved = computed(() => {
  const x = invoiceModeResolved.value;
  if (x === "NO_FISCAL") return "No fiscal";
  if (x === "FISCAL") return "Fiscal";
  if (x === "MIXED") return "Mixta";
  if (x === "TICKET_ONLY") return "Solo ticket";
  return x || "—";
});
const customerTypeLabelResolved = computed(() => {
  const x = customerTypeResolved.value;
  if (x === "CONSUMIDOR_FINAL") return "Consumidor final";
  if (x === "CLIENTE_REGISTRADO") return "Cliente registrado";
  return x || "—";
});

function resolvePaymentMethod(payment) {
  const p = payment || {};
  const display = firstFilled(p.label, p.payment_method_name, p.payment_method_label, p.display_name);
  const methodRaw = firstFilled(p.method, p.kind, p.payment_method_kind).toUpperCase();
  let resolved = methodRaw || "OTHER";
  if (resolved === "QR") resolved = "MERCADOPAGO";
  if (resolved === "CREDIT_SJT") resolved = "CREDIT_SJT";
  return { method_resolved: resolved, method_display: display || methodLabel(resolved) };
}

function extractPaymentDetails(payment) {
  const p = payment || {};
  const noteObj = safeJsonParse(p.note) || {};
  const extra = safeJsonParse(p.extra) || {};
  const merged = { ...noteObj, ...extra };
  const cardKind = firstFilled(p.card_kind, p.cardKind, merged.card_kind, merged.cardKind, merged.card_type, merged.cardType).toUpperCase();
  const cardBrand = firstFilled(p.card_brand, p.cardBrand, merged.card_brand, merged.cardBrand, merged.brand, merged.network);
  const installments = numOrNull(p.installments) ?? numOrNull(merged.installments) ?? numOrNull(merged.cuotas) ?? 1;
  const listTotal = numOrNull(merged.list_total) ?? numOrNull(merged.listTotal) ?? numOrNull(merged.total_list);
  const installmentAmount = numOrNull(merged.per_installment_list) ?? numOrNull(merged.perInstallmentList) ??
    numOrNull(merged.installment_amount) ??
    (Number.isFinite(Number(listTotal)) && Number(installments) > 1 ? Number(listTotal) / Number(installments) : null);
  const totalWithFee = numOrNull(merged.total_with_fee) ?? numOrNull(merged.totalWithFee) ?? numOrNull(merged.total_financiado);
  const priceBasis = firstFilled(merged.price_basis, merged.priceBasis, saleExtra.value?.price_policy).toUpperCase();
  const priceBasisLabel =
    priceBasis === "LIST" || priceBasis === "LIST_PRICE" ? "Precio lista" :
    priceBasis === "DISCOUNT" || priceBasis === "SALE_PRICE" ? "Precio contado" :
    priceBasis === "RESELLER" ? "Revendedor" : "";
  const noteHuman = firstFilled(merged.note, merged.message,
    typeof p.note === "string" && !String(p.note).trim().startsWith("{") ? p.note : "");
  return {
    card_type: cardKind,
    card_type_label: cardKind === "DEBIT" ? "Débito" : cardKind === "CREDIT" ? "Crédito" : "",
    card_brand: cardBrand,
    installments: Number.isFinite(Number(installments)) && Number(installments) > 0 ? Number(installments) : 1,
    installment_amount: installmentAmount,
    list_total: listTotal,
    total_with_fee: totalWithFee,
    price_basis: priceBasis,
    price_basis_label: priceBasisLabel,
    note_human: noteHuman,
  };
}

const paymentsResolved = computed(() => {
  const arr = Array.isArray(sale.value?.payments) ? sale.value.payments : [];
  return arr.map((p) => ({ ...p, ...resolvePaymentMethod(p), ...extractPaymentDetails(p) }));
});

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) { return val ? new Date(val).toLocaleString("es-AR", { hourCycle: "h23" }) : "—"; }
function number(v) { const n = Number(v || 0); return Number.isFinite(n) ? n : 0; }
function toNum(v) { const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }

function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "MERCADOPAGO" || x === "QR") return "Mercado Pago";
  if (x === "CREDIT_SJT") return "Crédito / Financiación";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "CARD") return "indigo";
  if (x === "TRANSFER") return "purple";
  if (x === "MERCADOPAGO" || x === "QR") return "orange";
  if (x === "CREDIT_SJT") return "teal";
  return "grey";
}
function payIcon(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "mdi-cash";
  if (x === "CARD") return "mdi-credit-card-outline";
  if (x === "TRANSFER") return "mdi-bank-transfer";
  if (x === "MERCADOPAGO" || x === "QR") return "mdi-qrcode";
  if (x === "CREDIT_SJT") return "mdi-wallet-outline";
  return "mdi-cash-multiple";
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
  // El nombre de la persona antes que el correo, igual que en el listado
  const nombre = [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim();
  return nombre || u?.name || u?.full_name || u?.username || u?.email || (s?.user_id ? `#${s.user_id}` : "—");
}
function paymentHeadline(p) {
  const installments = Number(p?.installments || 1);
  const method = p?.method_display || methodLabel(p?.method_resolved);
  return installments > 1 ? `${method} en ${installments} cuotas` : `${method} en 1 pago`;
}
function paymentSubline(p) {
  const arr = [];
  if (p?.reference) arr.push(`Ref: ${p.reference}`);
  if (p?.paid_at) arr.push(`Fecha pago: ${dt(p.paid_at)}`);
  if (p?.payment_method_id) arr.push(`ID medio: ${p.payment_method_id}`);
  return arr;
}
function paymentFacts(p) {
  const out = [];
  out.push({ label: "Método", value: p.method_display || methodLabel(p.method_resolved) });
  out.push({ label: "Cuotas", value: Number(p.installments || 1) > 1 ? `${p.installments} cuotas` : "1 cuota" });
  if (p.card_type_label) out.push({ label: "Tipo tarjeta", value: p.card_type_label });
  if (p.card_brand) out.push({ label: "Marca", value: p.card_brand });
  if (p.price_basis_label) out.push({ label: "Base cálculo", value: p.price_basis_label });
  if (p.installment_amount != null && Number(p.installments || 1) > 1)
    out.push({ label: "Valor cuota", value: money(p.installment_amount) });
  if (p.list_total != null) out.push({ label: "Total lista", value: money(p.list_total) });
  if (p.total_with_fee != null) out.push({ label: "Total financiado", value: money(p.total_with_fee) });
  return out;
}
function refundMethodLabel(r) {
  return methodLabel(firstFilled(r?.refund_method, r?.method, r?.payment_method_name, "OTHER"));
}

function p(item) { return item?.product || null; }
function pidOf(item) {
  const pid = Number(item?.product_id || item?.productId || p(item)?.id || 0);
  return Number.isFinite(pid) ? pid : 0;
}
function productName(item) {
  return item?.product_name_snapshot || p(item)?.name || p(item)?.title ||
    (pidOf(item) ? `Producto #${pidOf(item)}` : "Producto");
}
function productSku(item) {
  const prod = p(item) || {};
  const v = item?.product_sku_snapshot || prod?.sku || prod?.code || prod?.product_code || prod?.barcode || null;
  return v ? String(v).trim() : "";
}
function productBrand(item) { return String(p(item)?.brand || p(item)?.marca || "").trim(); }
function productModel(item) { return String(p(item)?.model || p(item)?.modelo || "").trim(); }
function categoryLabel(item) {
  const prod = p(item) || {};
  const cat = prod?.category || null;
  if (cat?.name) { const parent = cat?.parent?.name ? ` / ${cat.parent.name}` : ""; return `${cat.name}${parent}`; }
  const cid = Number(prod?.category_id || prod?.subcategory_id || 0) || null;
  return cid ? `#${cid}` : "";
}
function productMetaLine(item) {
  const parts = [];
  const sku = productSku(item); const brand = productBrand(item); const model = productModel(item);
  if (sku) parts.push(`SKU: ${sku}`);
  if (brand) parts.push(`Marca: ${brand}`);
  if (model) parts.push(`Modelo: ${model}`);
  return parts.join(" · ");
}

const imageById = ref({});
const imgLoading = ref({});
function pickUrlFromImageRow(row) {
  if (!row) return "";
  return row.url || row.public_url || row.publicUrl || row.image_url || row.path || row.filename || "";
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
  const direct = prod?.main_image_url || prod?.image_url || prod?.image || prod?.thumb_url || prod?.public_url || null;
  if (direct) return normalizeUrl(direct);
  const arr = Array.isArray(prod?.images) ? prod.images : Array.isArray(prod?.product_images) ? prod.product_images : null;
  if (arr?.length) { const u = pickUrlFromImageRow(arr[0]); if (u) return normalizeUrl(u); }
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
    const next = { ...imgLoading.value }; delete next[pid]; imgLoading.value = next;
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
  const q = prod?.qty ?? prod?.stock_qty ?? prod?.stock ?? prod?.on_hand ?? prod?.available_qty ?? prod?.existence ?? null;
  if (q === null || q === undefined) return null;
  return toNum(q);
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

function goToProduct(pid) {
  const n = Number(pid || 0);
  if (!n) return;
  router.push({ name: "productView", params: { id: n } }).catch(() => {
    router.push({ path: `/app/products/${n}/view` }).catch(() => {
      snack.value = { show: true, text: "No se encontró la ruta del producto" };
    });
  });
}
function openImage(item) { imageItem.value = item || null; imageDialog.value = true; }

function needsHydrateProducts(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return false;
  return arr.some((it) => {
    const prod = it?.product;
    if (!prod) return true;
    const name = prod?.name || prod?.title || prod?.product_name;
    if (!name) return true;
    const hasSku = !!(prod?.sku || prod?.code);
    const hasQty = prod?.qty !== undefined || prod?.stock_qty !== undefined;
    return !(hasSku && hasQty);
  });
}
async function fetchPosProductOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;
  for (const a of [{ url: `/pos/products/${pid}`, params: { include_images: 1 } }, { url: `/pos/products/${pid}` }]) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {}
  }
  return null;
}
async function fetchPosProductsBatch(ids) {
  const { data } = await http.get("/pos/products", { params: { ids: ids.join(","), include_images: 1, limit: ids.length, page: 1 } });
  const out = data?.data || data || [];
  const arr = Array.isArray(out) ? out : Array.isArray(out?.items) ? out.items : [];
  if (!arr.length) throw new Error("vacío");
  return arr;
}
async function fetchProductFallbackOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;
  for (const a of [{ url: `/products/${pid}`, params: { include_images: 1 } }, { url: `/products/${pid}` }]) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {}
  }
  return null;
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
      for (const pr of list) { const pid = Number(pr?.id || 0); if (pid) map.set(pid, pr); }
    } catch {
      const rows = await Promise.all(ids.map((pid) => fetchPosProductOne(pid).catch(() => null)));
      for (const pr of rows) { const pid = Number(pr?.id || 0); if (pid) map.set(pid, pr); }
    }
    const missing = ids.filter((pid) => !map.has(pid));
    if (missing.length) {
      const rows = await Promise.all(missing.map((pid) => fetchProductFallbackOne(pid).catch(() => null)));
      for (const pr of rows) { const pid = Number(pr?.id || 0); if (pid && !map.has(pid)) map.set(pid, pr); }
    }
    for (const it of items) { const pid = pidOf(it); if (pid && map.has(pid)) it.product = map.get(pid); }
  } finally { productsLoading.value = false; }
}

async function load() {
  loading.value = true;
  payload.value = null;
  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error cargando venta");
    payload.value = data.data || null;
    await hydrateProductsForItems();
    cargarContexto();
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "Error" };
  } finally { loading.value = false; }
}

// ===== Anular (antes vivía en un diálogo del listado) =====
const auth = useAuthStore();
const isAdmin = computed(() => auth.isAdmin === true);
const confirmandoAnular = ref(false);
const anulando = ref(false);
async function anularVenta() {
  if (!sale.value?.id) return;
  anulando.value = true;
  try {
    const { data } = await http.delete(`/pos/sales/${sale.value.id}`);
    if (!data?.ok) throw new Error(data?.message || "No se pudo anular");
    snack.value = { show: true, text: data?.message || "Venta anulada. Stock restaurado." };
    confirmandoAnular.value = false;
    await load();
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "No se pudo anular" };
  } finally {
    anulando.value = false;
  }
}

// ===== Rediseño: el producto y quien la vendió primero =====
const items = computed(() => (Array.isArray(sale.value?.items) ? sale.value.items : []));
const plata = (v) => "$ " + Number(v || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const dosDig = (n) => String(n).padStart(2, "0");
const horaDe = (v) => { const d = new Date(v); return `${dosDig(d.getHours())}:${dosDig(d.getMinutes())}`; };
const ddmm = (v) => { const d = new Date(v); return `${dosDig(d.getDate())}/${dosDig(d.getMonth() + 1)}`; };
const mismoDia = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const subtitulo = computed(() => {
  const s = sale.value;
  if (!s) return "";
  const v = s.sold_at || s.created_at;
  const d = new Date(v);
  return [`${DIAS[d.getDay()]} ${ddmm(v)}/${d.getFullYear()} · ${horaDe(v)} h`, branchLabelResolved.value].filter(Boolean).join(" · ");
});
function cantidadTexto(q) {
  const n = Math.round(number(q) * 100) / 100;
  return `${n.toLocaleString("es-AR")} ${n === 1 ? "unidad" : "unidades"}`;
}
function rubroTexto(item) {
  const prod = p(item) || {};
  return [prod?.category?.name, prod?.subcategory?.name].filter(Boolean).join(" › ");
}
function codigosTexto(item) {
  const sku = productSku(item);
  const code = String(p(item)?.code || "").trim();
  return [sku ? `SKU ${sku}` : "", code && code !== sku ? `Código ${code}` : ""].filter(Boolean).join(" · ");
}
function precioLista(item) { return Number(p(item)?.price_list || 0); }
const basePrecio = computed(() => {
  const l = String(paymentsResolved.value[0]?.price_basis_label || "").toLowerCase();
  if (!l) return "";
  return l.startsWith("precio") ? l : `precio ${l}`;
});
const comprobanteTexto = computed(() => {
  const t = invoiceTypeResolved.value && invoiceTypeResolved.value !== "—"
    ? invoiceTypeResolved.value.charAt(0) + invoiceTypeResolved.value.slice(1).toLowerCase() : "";
  const m = invoiceModeLabelResolved.value && invoiceModeLabelResolved.value !== "—" ? invoiceModeLabelResolved.value.toLowerCase() : "";
  return [t, m].filter(Boolean).join(" · ") || "—";
});

const vendedor = computed(() => {
  const s = sale.value || {};
  const nombre = userLabel(s);
  const iniciales = nombre.split(/\s+/).filter((w) => /[a-záéíóúñ]/i.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
  return { nombre, iniciales, usuario: s.user?.username || "" };
});

// Contexto de quien vendió: su caja y lo que vendió ese día
const cajaAbierta = ref("");
const delDia = ref(null);
async function cargarContexto() {
  const s = sale.value;
  cajaAbierta.value = "";
  delDia.value = null;
  if (!s) return;
  if (s.cash_register_id) {
    try {
      const { data } = await http.get(`/pos/cash-registers/${s.cash_register_id}/summary`);
      const at = data?.data?.cash_register?.opened_at;
      if (at) cajaAbierta.value = mismoDia(at, s.sold_at) ? `${horaDe(at)} h` : `el ${ddmm(at)}, ${horaDe(at)} h`;
    } catch { /* sin permiso o sin caja: la fila muestra solo el número */ }
  }
  if (s.user_id && s.sold_at) {
    try {
      const d = new Date(s.sold_at);
      const ini = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const fin = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate(), 23, 59, 59, 999);
      const base = { status: "PAID", seller_id: s.user_id };
      const [dia, hasta] = await Promise.all([
        http.get("/pos/sales/stats", { params: { ...base, from: ini.toISOString(), to: fin.toISOString() } }),
        http.get("/pos/sales/stats", { params: { ...base, from: ini.toISOString(), to: d.toISOString() } }),
      ]);
      const ventas = Number(dia.data?.data?.sales_count || 0);
      if (ventas) {
        delDia.value = {
          ventas,
          total: Number(dia.data?.data?.gross_total_sum || 0),
          orden: s.status === "PAID" ? Number(hasta.data?.data?.sales_count || 0) : 0,
        };
      }
    } catch { /* sin datos del día no se muestra la fila */ }
  }
}

function detallePago(pm) {
  const partes = [];
  if (pm.installments > 1) partes.push(`${pm.installments} cuotas${pm.installment_amount ? ` de ${plata(pm.installment_amount)}` : ""}`);
  else partes.push("1 pago");
  if (pm.card_type_label) partes.push(pm.card_type_label);
  if (pm.card_brand) partes.push(pm.card_brand);
  return partes.join(" · ");
}
const COLOR_MEDIO = { MERCADOPAGO: "#0a466e", QR: "#0a466e", CASH: "#0f6fae", TRANSFER: "#3f8fc6", CARD: "#8cc0e3", CREDIT_SJT: "#5b7083" };
function colorMedio(m) { return COLOR_MEDIO[String(m || "").toUpperCase()] || "#C3C9D6"; }

onMounted(load);
watch(id, () => load());
</script>

<style>
/* Vista de la venta. Sin scoped: todo cuelga de .vd; tema oscuro con
   :is(.v-theme--dark, .v-theme--adminDark) .vd. Mismos tokens que el listado y el tablero. */
.pos-container:has(.vd) { max-width: none !important; padding: 0 !important; margin: 0 !important; }
.vd {
  --vd-fondo: #d6e6f3; --vd-caja: #ffffff; --vd-borde: #d3dde7; --vd-linea: #e3eaf1;
  --vd-texto: #0f172a; --vd-suave: #5a6678; --vd-banda: #0f6fae; --vd-acento: #0f6fae;
  --vd-rubro: #3f8fc6; --vd-pie: #f3f8fc; --vd-avatar: #0a466e; --vd-foto: #ffffff;
  padding: 20px 28px 40px; min-height: calc(100vh - 56px); box-sizing: border-box;
  background: var(--vd-fondo); color: var(--vd-texto);
  display: flex; flex-direction: column; gap: 18px;
}
:is(.v-theme--dark, .v-theme--adminDark) .vd {
  --vd-fondo: #0b0f14; --vd-caja: #151c25; --vd-borde: #253141; --vd-linea: #222c39;
  --vd-texto: #e5edf5; --vd-suave: #9aa8b8; --vd-banda: #0f5f96; --vd-acento: #5aaee0;
  --vd-rubro: #6fb3e0; --vd-pie: #1a2430; --vd-avatar: #0f6fae;
}
.vd > * { max-width: 1340px; width: 100%; margin-left: auto; margin-right: auto; }
.vd .num { font-variant-numeric: tabular-nums; }
.vd-s { font-size: 13px; color: var(--vd-suave); }
.vd-suave { font-weight: 600; color: var(--vd-suave); }
.vd-b { font-weight: 700; }
.vd-tachado { color: var(--vd-suave) !important; text-decoration: line-through; }
.vd-vacio { padding: 24px 16px; text-align: center; font-size: 15px; font-weight: 600; color: var(--vd-suave); }
.vd-link { display: inline-flex; align-items: center; font-size: 15px; font-weight: 800; color: var(--vd-acento); text-decoration: none; white-space: nowrap; }
.vd-link:hover { text-decoration: underline; }

/* encabezado */
.vd-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.vd-cab__txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vd-volver { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--vd-acento); text-decoration: none; margin-left: -4px; }
.vd-volver:hover { text-decoration: underline; }
.vd-cab__titulo { margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.vd-cab__sub { font-size: 15px; font-weight: 600; color: var(--vd-suave); }
.vd-cab__der { display: flex; align-items: center; gap: 14px; }
.vd-estado { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 10px; background: var(--vd-caja); border: 1px solid var(--vd-borde); font-size: 15px; font-weight: 800; color: var(--vd-suave); }
.vd-estado i { width: 10px; height: 10px; border-radius: 9999px; background: #C3C9D6; display: block; }
.vd-estado.is-paid { color: #1f7a5f; } .vd-estado.is-paid i { background: #2E9E7B; }
.vd-estado.is-cancelled { color: #b23b35; } .vd-estado.is-cancelled i { background: #C4453F; }
:is(.v-theme--dark, .v-theme--adminDark) .vd-estado.is-paid { color: #5fc9a6; }
:is(.v-theme--dark, .v-theme--adminDark) .vd-estado.is-cancelled { color: #f08a84; }
.vd-total { display: flex; flex-direction: column; align-items: flex-end; }
.vd-total__k { font-size: 13px; font-weight: 700; color: var(--vd-suave); }
.vd-total__v { font-size: 32px; font-weight: 800; line-height: 1; }

.vd-caja { border-radius: 12px; overflow: hidden; background: var(--vd-caja); border: 1px solid var(--vd-borde); box-sizing: border-box; }
.vd-banda { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; background: var(--vd-banda); color: #ffffff; font-size: 14px; font-weight: 700; }
.vd-banda > span:first-child { font-size: 15px; font-weight: 800; }
.vd-rubro { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--vd-rubro); }

/* producto + vendedor */
.vd-principal { display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 20px; align-items: stretch; }
.vd-heroe { display: flex; min-height: 340px; }
.vd-heroe__foto { width: 340px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; border: 0; border-right: 1px solid var(--vd-linea); background: var(--vd-foto); cursor: zoom-in; color: #94a3b8; }
.vd-heroe__foto img { width: 100%; height: 300px; object-fit: contain; }
.vd-heroe__info { flex: 1; min-width: 0; padding: 22px 24px; display: flex; flex-direction: column; gap: 14px; }
.vd-heroe__cab { display: flex; flex-direction: column; gap: 4px; }
.vd-heroe__nombre { font-size: 28px; font-weight: 800; letter-spacing: -0.01em; line-height: 1.15; }
.vd-heroe__pie { margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.vd-datos { display: grid; grid-template-columns: max-content 1fr; gap: 10px 18px; margin: 0; padding: 14px 16px; }
.vd-datos dt { font-size: 14px; font-weight: 600; color: var(--vd-suave); }
.vd-datos dd { margin: 0; font-size: 15px; font-weight: 700; text-align: right; overflow-wrap: anywhere; }
.vd-datos--caja { border-radius: 10px; background: var(--vd-pie); border: 1px solid var(--vd-linea); }

.vd-productos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; align-content: start; }
.vd-prod { display: flex; height: 250px; color: var(--vd-texto); text-decoration: none; }
.vd-prod:hover { border-color: #8cc0e3; }
.vd-prod__foto { width: 200px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; padding: 12px; box-sizing: border-box; border-right: 1px solid var(--vd-linea); background: var(--vd-foto); color: #94a3b8; }
.vd-prod__foto img { width: 100%; height: 220px; object-fit: contain; }
.vd-prod__info { flex: 1; min-width: 0; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; }
.vd-prod__nombre { font-size: 17px; font-weight: 800; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.vd-prod__esp { flex: 1; }
.vd-prod__total { font-size: 22px; font-weight: 800; text-align: right; }

.vd-vendio { display: flex; flex-direction: column; }
.vd-vendio__quien { display: flex; align-items: center; gap: 16px; padding: 20px 18px 10px; }
.vd-avatar { width: 72px; height: 72px; flex-shrink: 0; border-radius: 9999px; background: var(--vd-avatar); color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: 800; }
.vd-vendio__txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vd-vendio__nombre { font-size: 24px; font-weight: 800; line-height: 1.15; }
.vd-vendio .vd-datos { padding: 6px 18px 16px; }
.vd-vendio__ver { margin-top: auto; display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-top: 1px solid var(--vd-linea); font-size: 15px; font-weight: 800; color: var(--vd-acento); text-decoration: none; }
.vd-vendio__ver:hover { background: var(--vd-pie); }

/* cobro, comprobante, historial */
.vd-trio { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; align-items: start; }
.vd-filas { display: flex; flex-direction: column; padding: 4px 16px 8px; }
.vd-pago { display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid var(--vd-linea); }
.vd-pago:last-child { border-bottom: 0; }
.vd-pago__linea { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.vd-pago__medio { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vd-pago__monto { font-size: 22px; font-weight: 800; white-space: nowrap; }
.vd-medio { display: inline-flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 800; }
.vd-medio i { width: 12px; height: 12px; border-radius: 3px; display: block; }
.vd-vuelto { padding: 8px 0; }
.vd-mov { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--vd-linea); }
.vd-mov:last-child { border-bottom: 0; }
.vd-mov__txt { display: flex; flex-direction: column; min-width: 0; }
.vd-mov__monto { font-size: 16px; font-weight: 800; white-space: nowrap; }

/* anular */
.vd-anular { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(196, 69, 63, 0.35); background: var(--vd-caja); box-sizing: border-box; }
.vd-anular__txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vd-anular__tit { font-size: 15px; font-weight: 800; }
.vd-anular__confirma { display: flex; align-items: center; gap: 14px; }
.vd-anular__no { font-size: 14px; font-weight: 700; color: var(--vd-suave); }

@media (max-width: 1200px) {
  .vd-principal { grid-template-columns: minmax(0, 1fr); }
  .vd-trio { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 900px) {
  .vd { padding: 14px 14px 96px; gap: 12px; }
  .vd-cab__titulo { font-size: 24px; }
  .vd-cab__der { width: 100%; justify-content: space-between; }
  .vd-total__v { font-size: 26px; }
  .vd-heroe { flex-direction: column; min-height: 0; }
  .vd-heroe__foto { width: 100%; border-right: 0; border-bottom: 1px solid var(--vd-linea); padding: 12px; }
  .vd-heroe__foto img { height: 220px; }
  .vd-heroe__info { padding: 14px; gap: 10px; }
  .vd-heroe__nombre { font-size: 21px; }
  .vd-productos { grid-template-columns: minmax(0, 1fr); }
  .vd-prod { height: auto; min-height: 150px; }
  .vd-prod__foto { width: 120px; }
  .vd-prod__foto img { height: 120px; }
  .vd-avatar { width: 54px; height: 54px; font-size: 20px; }
  .vd-vendio__nombre { font-size: 19px; }
}
</style>
