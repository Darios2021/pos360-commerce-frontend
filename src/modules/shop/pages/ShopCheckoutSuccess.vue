<!-- src/modules/shop/pages/ShopCheckoutSuccess.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Comprobante REAL en PDF (jsPDF) ✅
     - Mobile homogéneo (tipos/tamaños consistentes) ✅
     - Un solo botón: "Compartir compra" (share nativo + fallback copiar) ✅
     - Sin “link” largo en pantalla ✅
     - Sin bordes negros (borde suave #e6e6e6)
     - Botón WhatsApp directo
     - Lee datos desde:
       1) query params (?order_id=&code=)
       2) sessionStorage: "shop_last_receipt"

     REQUISITO:
       npm i jspdf
-->

<template>
  <v-container class="py-6">
    <div class="sc-shell">
      <v-card class="sc-card" elevation="0">
        <!-- HEADER -->
        <div class="sc-head">
          <div class="sc-head-left">
            <div class="sc-check">
              <v-icon size="18">mdi-check</v-icon>
            </div>
            <div>
              <div class="sc-title">¡Pedido confirmado!</div>
              <div class="sc-sub">
                Guardá este comprobante. Si pagás con Mercado Pago, la confirmación puede demorar unos minutos.
              </div>
            </div>
          </div>

          <div class="sc-head-actions">
            <v-btn variant="tonal" class="sc-btn" @click="goHome">
              Seguir comprando
            </v-btn>

            <v-btn
              color="primary"
              class="sc-btn"
              prepend-icon="mdi-download"
              :loading="pdfLoading"
              @click="downloadPdf"
            >
              Descargar PDF
            </v-btn>
          </div>
        </div>

        <v-divider class="my-4" />

        <!-- TOP GRID -->
        <div class="sc-grid">
          <!-- Datos del pedido -->
          <div class="sc-panel">
            <div class="sc-panel-title">Datos del pedido</div>

            <div class="sc-kv">
              <div class="sc-k">ID de pedido</div>
              <div class="sc-v">{{ receipt.order_id || "—" }}</div>
            </div>

            <div class="sc-kv">
              <div class="sc-k">Código</div>
              <div class="sc-v">{{ receipt.code || "—" }}</div>
            </div>

            <div class="sc-kv">
              <div class="sc-k">Fecha</div>
              <div class="sc-v">{{ receipt.created_at_fmt || "—" }}</div>
            </div>

            <div class="sc-kv">
              <div class="sc-k">Método de pago</div>
              <div class="sc-v">{{ receipt.payment_label || "—" }}</div>
            </div>

            <div class="sc-kv" v-if="receipt.status_label">
              <div class="sc-k">Estado</div>
              <div class="sc-v">
                <v-chip size="small" variant="tonal" :color="receipt.status_color || 'primary'">
                  {{ receipt.status_label }}
                </v-chip>
              </div>
            </div>

            <!-- ✅ SOLO UN BOTON: SHARE NATIVO + FALLBACK COPIAR -->
            <div class="sc-actions-row">
              <v-btn class="sc-share" variant="tonal" prepend-icon="mdi-share-variant" @click="sharePurchase">
                Compartir compra
              </v-btn>
            </div>
          </div>

          <!-- Entrega -->
          <div class="sc-panel">
            <div class="sc-panel-title">Entrega</div>

            <div class="sc-kv">
              <div class="sc-k">{{ isPickup ? "Retiro" : "Envío" }}</div>
              <div class="sc-v">
                {{ isPickup ? (receipt.pickup_branch_name || "—") : "A domicilio" }}
              </div>
            </div>

            <v-alert v-if="isPickup" type="info" variant="tonal" class="rounded-lg mt-3">
              <div class="sc-alert-title">Dirección de retiro (Rivadavia)</div>
              <div class="sc-addr">
                Av. Ignacio de la Roza y Calle Los Jesuistas – Local 1<br />
                Barrio CESAP, Dpto. Rivadavia<br />
                Frente al supermercado Átomo
              </div>
            </v-alert>

            <v-alert v-else type="info" variant="tonal" class="rounded-lg mt-3">
              <div class="sc-alert-title">Dirección de envío</div>
              <div class="sc-addr">
                {{ receipt.shipping_address || "—" }}
              </div>
            </v-alert>

            <div class="sc-mini mt-2">
              Te avisamos cuando esté listo / coordinamos la entrega.
            </div>
          </div>
        </div>

        <!-- PRODUCTOS -->
        <div class="sc-panel sc-panel-wide">
          <div class="sc-panel-title">Productos</div>

          <div v-if="!safeItems.length" class="sc-empty">
            No hay productos para mostrar.
          </div>

          <div v-else class="sc-items">
            <div v-for="(it, idx) in safeItems" :key="idx" class="sc-item">
              <div class="sc-item-left">
                <v-img
                  :src="it.image_url || it.image || it.cover_url || ''"
                  width="44"
                  height="44"
                  cover
                  class="rounded"
                />
                <div class="sc-item-info">
                  <div class="sc-item-name">
                    <span class="sc-qty">{{ toNum(it.qty, 0) }}×</span>
                    <span>{{ it.name || "Producto" }}</span>
                  </div>
                  <div class="sc-item-sub">
                    $ {{ fmtMoney(unitPrice(it)) }} c/u
                  </div>
                </div>
              </div>

              <div class="sc-item-right">
                $ {{ fmtMoney(lineTotal(it)) }}
              </div>
            </div>

            <v-divider class="my-3" />

            <div class="sc-totals">
              <div class="sc-row">
                <span>Subtotal</span>
                <span>$ {{ fmtMoney(subtotalComputed) }}</span>
              </div>

              <div class="sc-row">
                <span>Envío</span>
                <span class="sc-free">
                  <template v-if="Number(shippingComputed) === 0">Gratis</template>
                  <template v-else>$ {{ fmtMoney(shippingComputed) }}</template>
                </span>
              </div>

              <div class="sc-total">
                <span>Total</span>
                <span>$ {{ fmtMoney(totalComputed) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- AYUDA / WHATSAPP -->
        <div class="sc-help">
          <div class="sc-help-left">
            <div class="sc-help-title">¿Necesitás ayuda ahora?</div>
            <div class="sc-help-sub">
              Contactanos por WhatsApp y te respondemos con tu pedido a mano.
            </div>
          </div>

          <v-btn
            color="success"
            class="sc-wa"
            :href="whatsAppLink"
            target="_blank"
            rel="noopener"
            prepend-icon="mdi-whatsapp"
          >
            WhatsApp
          </v-btn>
        </div>

        <!-- AVISO CREDITO -->
        <v-alert
          v-if="receipt.payment_method === 'CREDIT_SJT'"
          type="warning"
          variant="tonal"
          class="rounded-lg mt-4"
        >
          <div class="sc-alert-title">Crédito San Juan Tecnología</div>
          Presentate en tienda con <b>DNI</b>, <b>comprobante de ingresos</b> y un <b>servicio a tu nombre</b>.
        </v-alert>

        <div class="sc-foot">
          <div class="sc-foot-note">
            Si no ves el pedido en tu historial, guardá el código y contactanos.
          </div>
        </div>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const pdfLoading = ref(false);

const receipt = ref({
  order_id: null,
  code: null,
  created_at: null,
  created_at_fmt: null,

  status_label: "Pago pendiente",
  status_color: "info",

  payment_method: null,
  payment_label: null,

  fulfillment_type: "pickup",
  pickup_branch_name: "Rivadavia",
  shipping_address: null,

  items: [],
  subtotal: 0,
  shipping_total: 0,
  total: 0,
});

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function toNum(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

function unitPrice(it) {
  return (
    toNum(it.unit_price, NaN) ||
    toNum(it.price, NaN) ||
    toNum(it.price_list, NaN) ||
    toNum(it.price_discount, NaN) ||
    0
  );
}

function lineTotal(it) {
  return unitPrice(it) * toNum(it.qty, 0);
}

function safeParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function formatDateTime(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const isPickup = computed(() => String(receipt.value.fulfillment_type || "").toLowerCase() === "pickup");

const safeItems = computed(() => (Array.isArray(receipt.value.items) ? receipt.value.items : []));

/** ✅ Totales robustos:
 * - si receipt.subtotal/total vienen en 0 o null, se calculan desde items
 * - shipping_total viene de receipt.shipping_total (si existe), sino 0
 */
const subtotalComputed = computed(() => {
  const s = toNum(receipt.value.subtotal, NaN);
  if (Number.isFinite(s) && s > 0) return s;
  return safeItems.value.reduce((acc, it) => acc + lineTotal(it), 0);
});

const shippingComputed = computed(() => {
  const sh = toNum(receipt.value.shipping_total, NaN);
  return Number.isFinite(sh) ? sh : 0;
});

const totalComputed = computed(() => {
  const t = toNum(receipt.value.total, NaN);
  if (Number.isFinite(t) && t > 0) return t;
  return subtotalComputed.value + shippingComputed.value;
});

const shareLink = computed(() => {
  const oid = receipt.value.order_id;
  const code = receipt.value.code;

  const base = `${window.location.origin}/shop/checkout/success`;
  const q = new URLSearchParams();
  if (oid) q.set("order_id", String(oid));
  if (code) q.set("code", String(code));

  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
});

const whatsAppLink = computed(() => {
  const phone = "5492644392150"; // +54 9 2644 39-2150
  const oid = receipt.value.order_id ? `Pedido #${receipt.value.order_id}` : "Pedido";
  const code = receipt.value.code ? ` (código ${receipt.value.code})` : "";
  const total = totalComputed.value ? ` Total $${fmtMoney(totalComputed.value)}.` : "";
  const msg = encodeURIComponent(`Hola! ${oid}${code}.${total} ¿Me ayudan con mi compra?`);
  return `https://wa.me/${phone}?text=${msg}`;
});

function goHome() {
  router.push("/shop");
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    console.log("[CHECKOUT_SUCCESS] share link copied");
  } catch (e) {
    console.warn("[CHECKOUT_SUCCESS] clipboard failed", e);
    const ta = document.createElement("textarea");
    ta.value = shareLink.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/** ✅ Share nativo (mobile) + fallback copiar */
async function sharePurchase() {
  const title = "Compra San Juan Tecnología";
  const text = receipt.value.order_id
    ? `Pedido #${receipt.value.order_id}${receipt.value.code ? ` (código ${receipt.value.code})` : ""}`
    : "Compra confirmada";

  const url = shareLink.value;

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url });
      return;
    }
  } catch (e) {
    console.warn("[CHECKOUT_SUCCESS] share cancelled/failed", e);
  }

  await copyShareLink();
}

/* =========================
   ✅ PDF REAL (jsPDF)
   - requiere: npm i jspdf
   ========================= */
async function downloadPdf() {
  if (pdfLoading.value) return;
  pdfLoading.value = true;

  try {
    const mod = await import("jspdf");
    const jsPDF = mod.jsPDF || mod.default;

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 14;
    let y = 16;

    const line = (yy) => {
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.3);
      doc.line(margin, yy, pageW - margin, yy);
    };

    const wrapText = (text, maxWidthMm) => doc.splitTextToSize(String(text || ""), maxWidthMm);

    const ensureSpace = (needed = 12) => {
      if (y + needed > pageH - margin) {
        doc.addPage();
        y = 16;
      }
    };

    const addTitle = (t) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(t, margin, y);
      y += 7;
    };

    const addSmall = (t) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = wrapText(t, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 5;
    };

    const kv = (k, v) => {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(String(k), margin, y);
      doc.setFont("helvetica", "bold");
      doc.text(String(v ?? "—"), margin + 55, y);
      doc.setFont("helvetica", "normal");
      y += 5.5;
    };

    addTitle("Comprobante de compra");
    addSmall("San Juan Tecnología · comprobante generado automáticamente.");

    line(y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Datos del pedido", margin, y);
    y += 7;

    kv("ID de pedido", receipt.value.order_id || "—");
    kv("Código", receipt.value.code || "—");
    kv("Fecha", receipt.value.created_at_fmt || "—");
    kv("Método de pago", receipt.value.payment_label || "—");
    if (receipt.value.status_label) kv("Estado", receipt.value.status_label);

    y += 2;
    line(y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Entrega", margin, y);
    y += 7;

    if (isPickup.value) {
      kv("Tipo", "Retiro en sucursal");
      kv("Sucursal", receipt.value.pickup_branch_name || "—");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const addrLines = wrapText(
        "Dirección: Av. Ignacio de la Roza y Calle Los Jesuistas – Local 1 · Barrio CESAP, Dpto. Rivadavia · Frente al supermercado Átomo",
        pageW - margin * 2
      );
      doc.text(addrLines, margin, y);
      y += addrLines.length * 5;
    } else {
      kv("Tipo", "Envío a domicilio");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const addrLines = wrapText(`Dirección: ${receipt.value.shipping_address || "—"}`, pageW - margin * 2);
      doc.text(addrLines, margin, y);
      y += addrLines.length * 5;
    }

    y += 1;
    line(y);
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Productos", margin, y);
    y += 7;

    const colNameW = pageW - margin * 2 - 18 - 30 - 30;
    const startX = margin;
    const xQty = startX + colNameW;
    const xUnit = xQty + 18;
    const xTot = xUnit + 30;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Producto", startX, y);
    doc.text("Cant.", xQty, y, { align: "right" });
    doc.text("Unit.", xUnit, y, { align: "right" });
    doc.text("Total", xTot, y, { align: "right" });
    y += 4;
    line(y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    const items = safeItems.value.length ? safeItems.value : [];
    if (!items.length) {
      doc.text("No hay productos para mostrar.", margin, y);
      y += 6;
    } else {
      for (const it of items) {
        ensureSpace(14);

        const name = String(it.name || "Producto");
        const qty = toNum(it.qty, 0);
        const unit = unitPrice(it);
        const tot = lineTotal(it);

        const nameLines = wrapText(name, colNameW);
        const rowH = Math.max(6, nameLines.length * 5);

        doc.text(nameLines, startX, y);
        doc.text(String(qty), xQty, y, { align: "right" });
        doc.text(`$ ${fmtMoney(unit)}`, xUnit, y, { align: "right" });
        doc.text(`$ ${fmtMoney(tot)}`, xTot, y, { align: "right" });

        y += rowH;
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.2);
        doc.line(margin, y - 1, pageW - margin, y - 1);
      }
      y += 2;
    }

    ensureSpace(20);
    y += 2;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Totales", margin, y);
    y += 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Subtotal", pageW - margin - 60, y);
    doc.setFont("helvetica", "bold");
    doc.text(`$ ${fmtMoney(subtotalComputed.value)}`, pageW - margin, y, { align: "right" });
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.text("Envío", pageW - margin - 60, y);
    doc.setFont("helvetica", "bold");
    doc.text(
      shippingComputed.value === 0 ? "Gratis" : `$ ${fmtMoney(shippingComputed.value)}`,
      pageW - margin,
      y,
      { align: "right" }
    );
    y += 7;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL", pageW - margin - 60, y);
    doc.text(`$ ${fmtMoney(totalComputed.value)}`, pageW - margin, y, { align: "right" });
    y += 10;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const foot = wrapText(
      `Link de compra: ${shareLink.value}\nSi necesitás ayuda, escribinos por WhatsApp.`,
      pageW - margin * 2
    );
    doc.text(foot, margin, pageH - margin);

    const oid = receipt.value.order_id || "pedido";
    const code = receipt.value.code ? `-${receipt.value.code}` : "";
    doc.save(`comprobante-${oid}${code}.pdf`);
  } catch (e) {
    console.error("[CHECKOUT_SUCCESS] PDF failed", e);
    window.print();
  } finally {
    pdfLoading.value = false;
  }
}

function hydrateFromQueryOrStorage() {
  const qOrderId = route.query.order_id ? Number(route.query.order_id) : null;
  const qCode = route.query.code ? String(route.query.code) : null;

  const raw = sessionStorage.getItem("shop_last_receipt");
  const stored = raw ? safeParseJSON(raw) : null;

  const src = stored || {};
  const merged = {
    ...receipt.value,
    ...src,
  };

  if (qOrderId) merged.order_id = qOrderId;
  if (qCode) merged.code = qCode;

  if (!merged.payment_label) {
    if (merged.payment_method === "MERCADOPAGO") merged.payment_label = "Mercado Pago";
    else if (merged.payment_method === "TRANSFER") merged.payment_label = "Transferencia";
    else if (merged.payment_method === "CASH") merged.payment_label = "Efectivo";
    else if (merged.payment_method === "CREDIT_SJT") merged.payment_label = "Crédito San Juan Tecnología";
    else merged.payment_label = "A coordinar";
  }

  merged.created_at_fmt = formatDateTime(merged.created_at);
  receipt.value = merged;
}

onMounted(() => {
  hydrateFromQueryOrStorage();
});
</script>

<style scoped>
/* =========================
   NORMALIZACIÓN (homogéneo)
   ========================= */
.sc-shell,
.sc-card,
.sc-panel,
.sc-head,
.sc-kv,
.sc-items {
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, "Noto Sans", "Liberation Sans",
    sans-serif;
}

/* =========================
   SHELL
   ========================= */
.sc-shell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-inline: 12px;
  box-sizing: border-box;
}

/* =========================
   CARD PRINCIPAL
   ========================= */
.sc-card {
  border: 1px solid #e6e6e6;
  border-radius: 14px;
  background: #fff;
  padding: 16px;
  box-sizing: border-box;
}

/* =========================
   HEADER
   ========================= */
.sc-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.sc-head-left {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  min-width: 0;
}

.sc-check {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(25, 135, 84, 0.12);
  color: #198754;
  flex: 0 0 auto;
}

.sc-title {
  font-weight: 900;
  font-size: 16px;
  line-height: 1.25;
  color: #111827;
}

.sc-sub {
  color: #6b7280;
  font-size: 12.5px;
  margin-top: 2px;
  max-width: 720px;
}

.sc-head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.sc-btn {
  text-transform: none;
  font-weight: 900;
  border-radius: 10px;
}

/* =========================
   GRID PRINCIPAL
   ========================= */
.sc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* =========================
   PANELS
   ========================= */
.sc-panel {
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
}

.sc-panel-wide {
  margin-top: 12px;
}

.sc-panel-title {
  font-weight: 900;
  font-size: 13px;
  margin-bottom: 8px;
  color: #111827;
}

/* =========================
   KV
   ========================= */
.sc-kv {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  padding: 6px 0;
  align-items: start;
}

.sc-k {
  color: #6b7280;
  font-size: 12.5px;
}

.sc-v {
  font-size: 12.5px;
  font-weight: 800;
  color: #111827;
  min-width: 0;
  word-break: break-word;
}

/* =========================
   ALERT TITLES
   ========================= */
.sc-alert-title {
  font-weight: 900;
  font-size: 12.8px;
  margin-bottom: 4px;
}

/* =========================
   TEXTOS AUX
   ========================= */
.sc-mini {
  color: #6b7280;
  font-size: 12px;
  word-break: break-word;
}

.sc-addr {
  line-height: 1.35;
  font-size: 12.5px;
  color: #111827;
  word-break: break-word;
}

.sc-empty {
  color: #6b7280;
  font-size: 12.5px;
}

/* =========================
   SHARE
   ========================= */
.sc-actions-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 10px;
}

.sc-share {
  text-transform: none;
  font-weight: 900;
  border-radius: 10px;
}

/* =========================
   ITEMS
   ========================= */
.sc-items {
  display: grid;
  gap: 10px;
}

.sc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.sc-item-left {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
}

.sc-item-info {
  min-width: 0;
}

.sc-qty {
  font-weight: 900;
  margin-right: 6px;
}

.sc-item-name {
  font-size: 12.8px;
  font-weight: 900;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

.sc-item-sub {
  color: #6b7280;
  font-size: 12px;
  margin-top: 1px;
}

.sc-item-right {
  font-weight: 900;
  font-size: 12.8px;
  white-space: nowrap;
  flex: 0 0 auto;
}

/* =========================
   TOTALES
   ========================= */
.sc-totals {
  display: grid;
  gap: 6px;
}

.sc-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12.8px;
}

.sc-row > span:last-child {
  text-align: right;
  white-space: nowrap;
  font-weight: 900;
}

.sc-free {
  color: #00a650;
  font-weight: 900;
}

.sc-total {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
  font-weight: 900;
  font-size: 15px;
}

.sc-total > span:last-child {
  text-align: right;
  white-space: nowrap;
  font-weight: 900;
}

/* =========================
   HELP / WA
   ========================= */
.sc-help {
  margin-top: 12px;
  border: 1px solid #e6e6e6;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.sc-help-left {
  min-width: 0;
}

.sc-help-title {
  font-weight: 900;
  font-size: 13px;
}

.sc-help-sub {
  color: #6b7280;
  font-size: 12.5px;
  margin-top: 2px;
}

.sc-wa {
  border-radius: 10px;
  font-weight: 900;
  text-transform: none;
}

/* =========================
   FOOT
   ========================= */
.sc-foot {
  margin-top: 12px;
}

.sc-foot-note {
  color: #6b7280;
  font-size: 12px;
}

/* =========================
   RESPONSIVE
   ========================= */
@media (max-width: 960px) {
  .sc-grid {
    grid-template-columns: 1fr;
  }
}

/* ✅ MOBILE: compacto y proporcional */
@media (max-width: 600px) {
  .sc-shell {
    padding-inline: 10px;
  }

  .sc-card {
    padding: 12px;
    border-radius: 12px;
  }

  .sc-head-actions {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .sc-btn {
    width: 100%;
  }

  .sc-panel {
    padding: 10px;
  }

  .sc-kv {
    grid-template-columns: 1fr;
    gap: 3px;
    padding: 7px 0;
  }

  .sc-v {
    font-weight: 900;
  }

  .sc-actions-row {
    margin-top: 8px;
  }

  .sc-share {
    width: 100%;
  }

  /* productos: mantener proporción */
  .sc-item {
    align-items: flex-start;
  }

  .sc-item-right {
    padding-left: 6px;
  }

  .sc-help {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .sc-wa {
    width: 100%;
  }
}

@media (max-width: 360px) {
  .sc-card {
    padding: 10px;
  }
  .sc-total {
    font-size: 14.5px;
  }
}
</style>
