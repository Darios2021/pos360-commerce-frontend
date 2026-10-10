<!-- src/modules/pos/pages/PosSaleDetailPage.vue -->
<template>
  <div class="vd">
    <!-- ── Encabezado ───────────────────────────────────── -->
    <div class="vd-cab">
      <div class="vd-cab__txt">
        <router-link :to="{ name: 'posSales' }" class="vd-volver"><v-icon size="18">mdi-chevron-left</v-icon>Ventas</router-link>
        <h1 class="vd-cab__titulo num">Venta #{{ sale?.id ?? id }}</h1>
        <span v-if="sale" class="vd-cab__sub num">{{ subtitulo }}</span>
      </div>
      <span v-if="sale?.status" class="vd-estado" :class="`is-${String(sale.status).toLowerCase()}`"><i></i>{{ statusLabel(sale.status) }}</span>
    </div>

    <div v-if="loading" class="vd-caja vd-vacio">
      <v-progress-circular indeterminate size="28" color="primary" />
    </div>
    <div v-else-if="!sale" class="vd-caja vd-vacio">Venta no encontrada</div>

    <template v-else>
      <!-- 1. Productos : tabla cerrada con los totales al pie -->
      <section class="vd-bloque">
        <div class="vd-bloque__tit">
          <span class="vd-h">1. Productos</span>
          <span class="vd-nota num">{{ (sale.items || []).length }} {{ (sale.items || []).length === 1 ? 'producto' : 'productos' }} · {{ unidadesTexto }}</span>
        </div>
        <div class="vd-caja">
          <div class="vd-tabla-scroll">
            <table class="vd-tabla">
              <thead>
                <tr>
                  <th class="c-img"></th>
                  <th>Producto</th>
                  <th class="c-num">Cantidad</th>
                  <th class="c-plata">Precio</th>
                  <th class="c-plata">Total</th>
                  <th class="c-ver"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in (sale.items || [])" :key="item.id || item.product_id">
                  <td class="c-img">
                    <button type="button" class="vd-img" :aria-label="`Imagen de ${productName(item)}`" @click="openImage(item)">
                      <img v-if="itemImage(item)" :src="itemImage(item)" alt="" />
                      <v-icon v-else size="20">mdi-image-outline</v-icon>
                    </button>
                  </td>
                  <td>
                    <div class="vd-b">{{ productName(item) }}</div>
                    <div v-if="productMetaLine(item)" class="vd-s">{{ productMetaLine(item) }}</div>
                  </td>
                  <td class="c-num num">{{ number(item.quantity) }}</td>
                  <td class="c-plata num">{{ plata(item.unit_price) }}</td>
                  <td class="c-plata num vd-b">{{ plata(item.line_total) }}</td>
                  <td class="c-ver">
                    <router-link v-if="pidOf(item)" :to="{ name: 'productView', params: { id: pidOf(item) } }" class="vd-link">Ver<v-icon size="18">mdi-chevron-right</v-icon></router-link>
                  </td>
                </tr>
                <tr v-if="!(sale.items || []).length">
                  <td colspan="6" class="vd-vacio">Sin productos en esta venta</td>
                </tr>
              </tbody>
              <tfoot>
                <tr v-for="t in totales" :key="t.k" :class="{ 'is-total': t.fuerte }">
                  <td colspan="4" class="vd-tot-k">{{ t.k }}</td>
                  <td class="c-plata num">{{ t.v }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </section>

      <div class="vd-grilla">
        <!-- 2. Cobro -->
        <section class="vd-bloque">
          <div class="vd-bloque__tit">
            <span class="vd-h">2. Cobro</span>
            <span class="vd-nota">{{ paymentsResolved.length === 1 ? '1 pago' : `${paymentsResolved.length} pagos` }}</span>
          </div>
          <div class="vd-caja">
            <div class="vd-banda"><span>Cobrado</span><span class="num">{{ plata(sale.paid_total) }}</span></div>
            <div class="vd-filas">
              <div v-for="pm in paymentsResolved" :key="pm.id || `${pm.payment_method_id}_${pm.amount}`" class="vd-pago">
                <div class="vd-pago__linea">
                  <span class="vd-medio"><i :style="{ background: colorMedio(pm.method_resolved) }"></i>{{ pm.method_display }}</span>
                  <span class="vd-pago__monto num">{{ plata(pm.amount) }}</span>
                </div>
                <div class="vd-s">{{ paymentHeadline(pm) }}<template v-for="part in paymentSubline(pm)" :key="part"> · {{ part }}</template></div>
                <dl v-if="hechosPago(pm).length" class="vd-datos vd-datos--chico">
                  <template v-for="f in hechosPago(pm)" :key="f.label">
                    <dt>{{ f.label }}</dt><dd class="num">{{ f.value }}</dd>
                  </template>
                </dl>
                <div v-if="pm.note_human" class="vd-s">{{ pm.note_human }}</div>
              </div>
              <div v-if="!paymentsResolved.length" class="vd-vacio">Sin pagos registrados</div>
            </div>
          </div>
        </section>

        <!-- 3. Datos de la venta y cliente -->
        <section class="vd-bloque">
          <div class="vd-bloque__tit"><span class="vd-h">3. Datos</span></div>
          <div class="vd-caja">
            <div class="vd-banda"><span>Venta</span><span class="num">{{ invoiceTypeResolved && invoiceTypeResolved !== '—' ? invoiceTypeResolved : '' }}</span></div>
            <dl class="vd-datos">
              <dt>Fecha</dt><dd class="num">{{ dt(sale.sold_at || sale.created_at) }}</dd>
              <template v-if="branchLabelResolved"><dt>Sucursal</dt><dd>{{ branchLabelResolved }}</dd></template>
              <template v-if="userLabel(sale) !== '—'"><dt>Cajero</dt><dd>{{ userLabel(sale) }}</dd></template>
              <template v-if="sale.sale_number"><dt>Número</dt><dd class="num">#{{ sale.sale_number }}</dd></template>
              <dt>Fiscal</dt><dd>{{ invoiceModeLabelResolved }}</dd>
              <dt>Tipo de cliente</dt><dd>{{ customerTypeLabelResolved }}</dd>
              <template v-if="sale.note"><dt>Nota</dt><dd>{{ sale.note }}</dd></template>
            </dl>
            <div class="vd-banda vd-banda--sec"><span>Cliente</span></div>
            <dl class="vd-datos">
              <dt>Nombre</dt><dd>{{ customerNameResolved }}</dd>
              <template v-if="customerDocResolved"><dt>Documento</dt><dd class="num">{{ customerDocResolved }}</dd></template>
              <template v-if="customerPhoneResolved"><dt>Teléfono</dt><dd class="num">{{ customerPhoneResolved }}</dd></template>
              <template v-if="customerEmailResolved"><dt>Correo</dt><dd>{{ customerEmailResolved }}</dd></template>
            </dl>
          </div>
        </section>
      </div>

      <!-- 4. Devoluciones y cambios -->
      <section class="vd-bloque">
        <div class="vd-bloque__tit">
          <span class="vd-h">4. Devoluciones y cambios</span>
          <span class="vd-nota">{{ refunds.length + exchanges.length ? `${refunds.length + exchanges.length} movimientos` : 'ninguno' }}</span>
        </div>
        <div class="vd-caja">
          <div class="vd-filas">
            <div v-for="r in refunds" :key="`r${r.id}`" class="vd-mov">
              <span class="vd-mov__tipo">Devolución</span>
              <span class="vd-mov__txt">
                <span class="vd-b num">{{ dt(r.created_at) }}</span>
                <span class="vd-s">{{ refundMethodLabel(r) }}<template v-if="r.reference"> · Ref: {{ r.reference }}</template><template v-if="r.reason"> · {{ r.reason }}</template></span>
              </span>
              <span class="vd-mov__monto num">- {{ plata(r.amount) }}</span>
            </div>
            <div v-for="x in exchanges" :key="`x${x.id}`" class="vd-mov">
              <span class="vd-mov__tipo">Cambio</span>
              <span class="vd-mov__txt">
                <span class="vd-b num">{{ dt(x.created_at) }}</span>
                <span class="vd-s num">Original {{ plata(x.original_total) }} · Nuevo {{ plata(x.new_total) }} · Devuelto {{ plata(x.returned_amount) }}<template v-if="x.note"> · {{ x.note }}</template></span>
              </span>
              <span class="vd-mov__monto num">Dif. {{ plata(x.diff) }}</span>
            </div>
            <div v-if="!refunds.length && !exchanges.length" class="vd-vacio">Sin devoluciones ni cambios</div>
          </div>
        </div>
      </section>

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
          <v-img v-if="itemImage(imageItem)" :src="itemImage(imageItem)" cover style="max-height:500px;border-radius:12px;" />
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

// ===== Rediseño: encabezado, totales y cobro =====
const plata = (v) => "$ " + Number(v || 0).toLocaleString("es-AR", { maximumFractionDigits: 2 });
const subtitulo = computed(() => {
  const s = sale.value;
  if (!s) return "";
  return [dt(s.sold_at || s.created_at), branchLabelResolved.value, userLabel(s) !== "—" ? userLabel(s) : ""].filter(Boolean).join(" · ");
});
const unidadesTexto = computed(() => {
  const n = (sale.value?.items || []).reduce((a, it) => a + number(it.quantity), 0);
  const r = Math.round(n * 100) / 100;
  return `${r.toLocaleString("es-AR")} ${r === 1 ? "unidad" : "unidades"}`;
});
const totales = computed(() => {
  const s = sale.value || {};
  const t = [];
  if (hasValue(s.subtotal) && Number(s.subtotal) !== Number(s.total)) t.push({ k: "Subtotal", v: plata(s.subtotal) });
  if (Number(s.discount_total || 0) > 0) t.push({ k: "Descuento", v: "- " + plata(s.discount_total) });
  if (Number(s.tax_total || 0) > 0) t.push({ k: "Impuestos", v: plata(s.tax_total) });
  t.push({ k: "Total", v: plata(s.total), fuerte: true });
  if (Number(s.paid_total || 0) !== Number(s.total || 0)) t.push({ k: "Pagado", v: plata(s.paid_total) });
  if (Number(s.change_total || 0) > 0) t.push({ k: "Vuelto", v: plata(s.change_total) });
  if (refundsTotal.value > 0) t.push({ k: "Devuelto", v: "- " + plata(refundsTotal.value) });
  if (showNetSummary.value) t.push({ k: "Neto", v: plata(netTotal.value), fuerte: true });
  return t;
});
const COLOR_MEDIO = { MERCADOPAGO: "#0a466e", QR: "#0a466e", CASH: "#0f6fae", TRANSFER: "#3f8fc6", CARD: "#8cc0e3", CREDIT_SJT: "#5b7083" };
function colorMedio(m) { return COLOR_MEDIO[String(m || "").toUpperCase()] || "#C3C9D6"; }
function hechosPago(pm) { return paymentFacts(pm).filter((f) => !["Método", "Cuotas"].includes(f.label)); }

onMounted(load);
watch(id, () => load());
</script>

<style>
/* Vista de la venta. Sin scoped: todo cuelga de .vd; tema oscuro con
   .v-theme--dark .vd. Mismos tokens que el listado y el tablero. */
.pos-container:has(.vd) { max-width: none !important; padding: 0 !important; margin: 0 !important; }
.vd {
  --vd-fondo: #d6e6f3; --vd-caja: #ffffff; --vd-borde: #d3dde7; --vd-linea: #e3eaf1;
  --vd-texto: #0f172a; --vd-suave: #5a6678; --vd-banda: #0f6fae; --vd-banda-borde: #0d5f96;
  --vd-acento: #0f6fae; --vd-pie: #f3f8fc;
  padding: 22px 28px 40px; min-height: calc(100vh - 72px); box-sizing: border-box;
  background: var(--vd-fondo); color: var(--vd-texto);
  display: flex; flex-direction: column; gap: 20px;
}
.v-theme--dark .vd {
  --vd-fondo: #0b0f14; --vd-caja: #151c25; --vd-borde: #253141; --vd-linea: #222c39;
  --vd-texto: #e5edf5; --vd-suave: #9aa8b8; --vd-banda: #0f5f96; --vd-banda-borde: #0c4f7d;
  --vd-acento: #5aaee0; --vd-pie: #1a2430;
}
.vd > * { max-width: 1300px; width: 100%; margin-left: auto; margin-right: auto; }
.vd .num { font-variant-numeric: tabular-nums; }

.vd-cab { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.vd-cab__txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vd-volver { display: inline-flex; align-items: center; font-size: 14px; font-weight: 700; color: var(--vd-acento); text-decoration: none; margin-left: -4px; }
.vd-volver:hover { text-decoration: underline; }
.vd-cab__titulo { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
.vd-cab__sub { font-size: 14px; font-weight: 600; color: var(--vd-suave); }
.vd-estado { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 10px; background: var(--vd-caja); border: 1px solid var(--vd-borde); font-size: 15px; font-weight: 800; color: var(--vd-suave); }
.vd-estado i { width: 10px; height: 10px; border-radius: 9999px; background: #C3C9D6; display: block; }
.vd-estado.is-paid { color: #1f7a5f; } .vd-estado.is-paid i { background: #2E9E7B; }
.vd-estado.is-cancelled { color: #b23b35; } .vd-estado.is-cancelled i { background: #C4453F; }
.v-theme--dark .vd-estado.is-paid { color: #5fc9a6; }
.v-theme--dark .vd-estado.is-cancelled { color: #f08a84; }

.vd-grilla { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.vd-bloque { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.vd-bloque__tit { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.vd-h { font-size: 22px; font-weight: 800; }
.vd-nota { font-size: 13px; color: var(--vd-suave); }
.vd-caja { border-radius: 12px; overflow: hidden; background: var(--vd-caja); border: 1px solid var(--vd-borde); flex: 1; }
.vd-banda { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 16px; background: var(--vd-banda); color: #ffffff; font-size: 14px; font-weight: 700; }
.vd-banda > span:first-child { font-size: 15px; font-weight: 800; }
.vd-banda--sec { border-top: 1px solid var(--vd-banda-borde); }
.vd-b { font-weight: 700; }
.vd-s { font-size: 13px; color: var(--vd-suave); }
.vd-link { display: inline-flex; align-items: center; font-size: 14px; font-weight: 800; color: var(--vd-acento); text-decoration: none; white-space: nowrap; }
.vd-link:hover { text-decoration: underline; }
.vd-vacio { padding: 28px 16px; text-align: center; font-size: 15px; font-weight: 600; color: var(--vd-suave); }

/* tabla cerrada */
.vd-tabla-scroll { overflow-x: auto; }
.vd-tabla { width: 100%; border-collapse: collapse; min-width: 640px; }
.vd-tabla th { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: #ffffff; background: var(--vd-banda); text-align: left; padding: 11px 12px; border: 1px solid var(--vd-banda-borde); border-top: 0; }
.vd-tabla td { padding: 9px 12px; border: 1px solid var(--vd-linea); vertical-align: middle; font-size: 14px; }
.vd-tabla th:first-child, .vd-tabla td:first-child { border-left: 0; }
.vd-tabla th:last-child, .vd-tabla td:last-child { border-right: 0; }
.vd-tabla tfoot td { background: var(--vd-pie); font-weight: 700; }
.vd-tabla tfoot tr.is-total td { font-size: 17px; font-weight: 800; }
.vd-tabla .c-img { width: 64px; }
.vd-tabla .c-num { width: 100px; text-align: right; }
.vd-tabla .c-plata { width: 140px; text-align: right; white-space: nowrap; }
.vd-tabla .c-ver { width: 72px; }
.vd-tot-k { text-align: right; }
.vd-img { width: 44px; height: 44px; border-radius: 8px; border: 1px solid var(--vd-borde); background: var(--vd-pie); display: flex; align-items: center; justify-content: center; overflow: hidden; cursor: zoom-in; padding: 0; color: var(--vd-suave); }
.vd-img img { width: 100%; height: 100%; object-fit: cover; }

/* cobro y datos */
.vd-filas { display: flex; flex-direction: column; padding: 4px 16px 8px; }
.vd-pago { display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid var(--vd-linea); }
.vd-pago:last-child { border-bottom: 0; }
.vd-pago__linea { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.vd-pago__monto { font-size: 20px; font-weight: 800; }
.vd-medio { display: inline-flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; }
.vd-medio i { width: 12px; height: 12px; border-radius: 3px; display: block; }
.vd-datos { display: grid; grid-template-columns: max-content 1fr; gap: 8px 18px; margin: 0; padding: 14px 16px; }
.vd-datos--chico { padding: 6px 0 0; gap: 4px 14px; font-size: 13px; }
.vd-datos dt { font-size: 14px; font-weight: 600; color: var(--vd-suave); }
.vd-datos dd { margin: 0; font-size: 14px; font-weight: 700; text-align: right; overflow-wrap: anywhere; }
.vd-datos--chico dt, .vd-datos--chico dd { font-size: 13px; }

/* devoluciones y cambios */
.vd-mov { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--vd-linea); }
.vd-mov:last-child { border-bottom: 0; }
.vd-mov__tipo { width: 96px; flex-shrink: 0; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; color: var(--vd-suave); }
.vd-mov__txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.vd-mov__monto { font-size: 16px; font-weight: 800; white-space: nowrap; }

/* anular */
.vd-anular { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; padding: 14px 16px; border-radius: 12px; border: 1px solid rgba(196, 69, 63, 0.35); background: var(--vd-caja); box-sizing: border-box; }
.vd-anular__txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.vd-anular__tit { font-size: 15px; font-weight: 800; }
.vd-anular__confirma { display: flex; align-items: center; gap: 14px; }
.vd-anular__no { font-size: 14px; font-weight: 700; color: var(--vd-suave); }

@media (max-width: 900px) {
  .vd { padding: 16px 16px 96px; }
  .vd-grilla { grid-template-columns: minmax(0, 1fr); }
}
</style>
