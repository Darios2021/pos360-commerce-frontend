<!-- src/modules/shop/pages/ShopCheckoutSuccess.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - PDF REAL (jsPDF) ✅
     - Compartir compra (Web Share + fallback copiar) ✅
     - WhatsApp ✅
     - ✅ Maps: card limpia + botón con icono + mini preview (NO feo / no gigante)
     - ✅ FIX: preview producto NO se estira en desktop
     REQUIERE: npm i jspdf
-->

<template>
  <v-container class="py-6 sc-page">
    <div class="sc-shell">
      <v-card class="sc-card" elevation="0">
        <!-- HEADER -->
        <div class="sc-head">
          <div class="sc-head-left">
            <div class="sc-check">
              <v-icon size="22">mdi-check</v-icon>
            </div>
            <div class="sc-head-text">
              <div class="sc-kicker">Compra confirmada</div>
              <div class="sc-title">¡Gracias por tu compra!</div>
              <div class="sc-sub">
                Te enviamos un correo con el comprobante. Si pagás con Mercado Pago,
                la confirmación final puede demorar unos minutos.
              </div>
            </div>
          </div>

          <div class="sc-head-actions">
            <v-btn variant="tonal" class="sc-btn" @click="goHome">
              <v-icon start size="16">mdi-arrow-left</v-icon>
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

        <!-- ⚠️ Aviso si solo tenemos info parcial -->
        <v-alert
          v-if="isPartial"
          type="info"
          variant="tonal"
          class="rounded-lg sc-partial-alert mt-4"
        >
          <div class="sc-partial-title">Comprobante limitado</div>
          <div class="sc-partial-text">
            Estamos viendo solo el código del pedido. Si abriste este link en otro
            dispositivo, pedile al comprador el link completo o consultanos por WhatsApp.
          </div>
        </v-alert>

        <v-divider class="my-4" />

        <!-- TOP GRID -->
        <div class="sc-grid">
          <!-- Datos del pedido -->
          <div class="sc-panel">
            <div class="sc-panel-kicker">Pedido</div>
            <div class="sc-panel-title">Datos de tu compra</div>

            <div class="sc-kv">
              <div class="sc-k">ID de pedido</div>
              <div class="sc-v">{{ receipt.order_id || "—" }}</div>
            </div>

            <div class="sc-kv" v-if="receipt.code">
              <div class="sc-k">Código</div>
              <div class="sc-v sc-code">{{ receipt.code }}</div>
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

            <div class="sc-actions-row">
              <v-btn class="sc-share" variant="tonal" prepend-icon="mdi-share-variant" @click="sharePurchase">
                Compartir compra
              </v-btn>
              <v-btn
                class="sc-share sc-share--ghost"
                variant="text"
                prepend-icon="mdi-content-copy"
                @click="copyShareLink"
              >
                Copiar link
              </v-btn>
            </div>
          </div>

          <!-- Entrega -->
          <div class="sc-panel">
            <div class="sc-panel-kicker">Entrega</div>
            <div class="sc-panel-title">
              {{ isPickup ? "Retiro en sucursal" : "Envío a domicilio" }}
            </div>

            <div class="sc-kv">
              <div class="sc-k">{{ isPickup ? "Sucursal" : "Modalidad" }}</div>
              <div class="sc-v">
                {{ isPickup ? (receipt.pickup_branch_name || "—") : "A domicilio" }}
              </div>
            </div>

            <!-- ✅ PICKUP -->
            <div v-if="isPickup" class="sc-pickup">
              <div class="sc-pickup-head">
                <v-icon class="sc-pickup-ico">mdi-map-marker</v-icon>
                <div class="sc-pickup-text">
                  <div class="sc-pickup-title">Dirección de retiro (Rivadavia)</div>
                  <div class="sc-addr">
                    Av. Ignacio de la Roza y Calle Los Jesuistas – Local 1<br />
                    Barrio CESAP, Dpto. Rivadavia<br />
                    Frente al supermercado Átomo
                  </div>
                </div>
              </div>

              <!-- ✅ CTA mapa: intuitivo, limpio -->
              <div class="sc-map-cta">
                <v-btn
                  class="sc-map-btn"
                  color="primary"
                  variant="tonal"
                  :href="pickupMapLink"
                  target="_blank"
                  rel="noopener"
                >
                  <v-icon start>mdi-map-outline</v-icon>
                  Ver ubicación
                </v-btn>

                <v-btn
                  class="sc-map-icon"
                  color="primary"
                  variant="text"
                  :href="pickupMapLink"
                  target="_blank"
                  rel="noopener"
                  icon
                >
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>
              </div>

              <!-- ✅ Mini preview (NO gigante / NO feo).
                   Es clickeable => abre maps. -->
              <a class="sc-map-preview" :href="pickupMapLink" target="_blank" rel="noopener">
                <iframe
                  :src="pickupMapEmbedSrc"
                  loading="lazy"
                  referrerpolicy="no-referrer-when-downgrade"
                  title="Mapa sucursal Rivadavia"
                />              
              </a>

           
            </div>

            <!-- ✅ SHIPPING -->
            <v-alert v-else type="info" variant="tonal" class="rounded-lg mt-3">
              <div class="sc-alert-title">Dirección de envío</div>
              <div class="sc-addr">{{ receipt.shipping_address || "—" }}</div>
            </v-alert>
         
          </div>
        </div>

        <!-- PRODUCTOS -->
        <div class="sc-panel sc-panel-wide">
          <div class="sc-panel-kicker">Detalle</div>
          <div class="sc-panel-title">Productos</div>

          <div v-if="!safeItems.length" class="sc-empty">
            <v-icon size="20">mdi-package-variant-closed</v-icon>
            <span>{{ isPartial ? "Detalle no disponible en este link." : "No hay productos para mostrar." }}</span>
          </div>

          <div v-else class="sc-items">
            <div v-for="(it, idx) in safeItems" :key="idx" class="sc-item">
              <div class="sc-item-left">
                <!-- ✅ FIX: imagen NO se estira (desktop/mobile).
                     Si no hay imagen, mostramos placeholder -->
                <div class="sc-thumb">
                  <v-img
                    :src="it.image_url || it.image || it.cover_url || ''"
                    cover
                    class="sc-thumb-img"
                  >
                    <template #error>
                      <div class="sc-thumb-ph">
                        <v-icon size="18">mdi-image-off-outline</v-icon>
                      </div>
                    </template>
                    <template #placeholder>
                      <div class="sc-thumb-ph">
                        <v-progress-circular indeterminate size="18" width="2" />
                      </div>
                    </template>
                  </v-img>
                </div>

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
import { decodeReceiptToken, encodeReceiptToken } from "@/modules/shop/utils/receiptToken";
import { loadReceiptLocal, loadLastReceipt, saveReceiptLocal } from "@/modules/shop/utils/receiptStorage";
import httpPublic from "@/app/api/httpPublic";

const route = useRoute();
const router = useRouter();

const pdfLoading = ref(false);
const hydrationSource = ref(""); // 'token' | 'local' | 'session' | 'last' | 'partial'
const isPartial = ref(false);    // true si solo tenemos código/order_id sin items

// ✅ tu link
const pickupMapLink = "https://maps.app.goo.gl/Mm7Usiuk75bm9xym9";

// ✅ embed liviano (sin API key). Si querés 100% exacto del pin: reemplazá por el src de "Insertar un mapa".
const pickupMapEmbedSrc = computed(() => {
  const q = encodeURIComponent("Av. Ignacio de la Roza y Los Jesuistas, Rivadavia, San Juan, Argentina");
  return `https://www.google.com/maps?q=${q}&output=embed`;
});

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
  // Reutilizamos la URL actual si vino con token (ya es compartible y autocontenida).
  // Si no, construimos una con order_id + code + (token si tenemos receipt).
  if (route.query.t) {
    return `${window.location.origin}${route.fullPath}`;
  }

  const oid = receipt.value.order_id;
  const code = receipt.value.code;

  const base = `${window.location.origin}/shop/checkout/success`;
  const q = new URLSearchParams();
  if (oid) q.set("o", String(oid));
  if (code) q.set("c", String(code));

  // Intentamos generar token con lo que tenemos para que el link sea autocontenido
  try {
    if (receipt.value && (receipt.value.items?.length || receipt.value.total)) {
      const t = encodeReceiptToken(receipt.value);
      if (t) q.set("t", t);
    }
  } catch {}

  const qs = q.toString();
  return qs ? `${base}?${qs}` : base;
});

const whatsAppLink = computed(() => {
  const phone = "5492644392150";
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
  } catch {
    const ta = document.createElement("textarea");
    ta.value = shareLink.value;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

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
  } catch {
    // user cancel
  }

  await copyShareLink();
}

/* =========================
   ✅ PDF REAL (jsPDF)
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
      `Link de compra: ${shareLink.value}\nMapa: ${pickupMapLink}\nSi necesitás ayuda, escribinos por WhatsApp.`,
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

/**
 * Hidratación multi-fuente con prioridad:
 *   1) Token de URL (?t=...)        → autocontenido, compartible.
 *   2) Query order_id/code + localStorage (TTL 30d) → mismo dispositivo.
 *   3) sessionStorage legacy (shop_last_receipt) → último pedido.
 *   4) Último guardado en localStorage (loadLastReceipt).
 *   5) Fallback parcial: solo order_id/code de la URL → modo "limitado".
 */
function hydrateFromQueryOrStorage() {
  // Acepta tanto las claves nuevas (o, c, t) como las viejas (order_id, code) por compat
  const qOrderId = route.query.o
    ? Number(route.query.o)
    : route.query.order_id
    ? Number(route.query.order_id)
    : null;

  const qCode = route.query.c
    ? String(route.query.c)
    : route.query.code
    ? String(route.query.code)
    : null;

  const qToken = route.query.t ? String(route.query.t) : "";

  let resolved = null;
  let source = "";

  // 1) Token URL
  if (qToken) {
    const fromToken = decodeReceiptToken(qToken);
    if (fromToken && (fromToken.order_id || fromToken.code || fromToken.items)) {
      resolved = fromToken;
      source = "token";
      // Aprovechamos para guardar en local así futuras visitas sin token funcionan
      try {
        saveReceiptLocal(fromToken);
      } catch {}
    }
  }

  // 2) localStorage por order_id/code
  if (!resolved) {
    const fromLocal = loadReceiptLocal({ order_id: qOrderId, code: qCode });
    if (fromLocal) {
      resolved = fromLocal;
      source = "local";
    }
  }

  // 3) sessionStorage legacy
  if (!resolved) {
    try {
      const raw = sessionStorage.getItem("shop_last_receipt");
      const stored = raw ? safeParseJSON(raw) : null;
      if (stored && (stored.order_id || stored.items?.length)) {
        // Solo usar si los IDs no contradicen la URL (evita mostrar pedido equivocado)
        const matchesOid = !qOrderId || String(stored.order_id) === String(qOrderId);
        const matchesCode = !qCode || String(stored.code) === String(qCode);
        if (matchesOid && matchesCode) {
          resolved = stored;
          source = "session";
        }
      }
    } catch {}
  }

  // 4) Último guardado en localStorage (sin filtros)
  if (!resolved && !qOrderId && !qCode) {
    const last = loadLastReceipt();
    if (last) {
      resolved = last;
      source = "last";
    }
  }

  // 5) Fallback parcial: solo tenemos order_id/code de la URL
  if (!resolved && (qOrderId || qCode)) {
    resolved = {
      order_id: qOrderId,
      code: qCode,
      items: [],
      total: 0,
      subtotal: 0,
      shipping_total: 0,
      payment_label: "",
      fulfillment_type: "pickup",
    };
    source = "partial";
    isPartial.value = true;
  }

  if (!resolved) {
    // Sin nada — mostramos el receipt default
    hydrationSource.value = "";
    return;
  }

  const merged = { ...receipt.value, ...resolved };

  if (qOrderId) merged.order_id = qOrderId;
  if (qCode) merged.code = qCode;

  if (!merged.payment_label) {
    const code = String(merged.payment_method || "").toLowerCase();
    if (code === "mercadopago" || code === "mercado_pago") merged.payment_label = "Mercado Pago";
    else if (code === "transfer") merged.payment_label = "Transferencia";
    else if (code === "cash") merged.payment_label = "Efectivo";
    else if (code === "credit_sjt") merged.payment_label = "Crédito San Juan Tecnología";
    else if (code === "seller") merged.payment_label = "Acordar pago con el vendedor";
    else merged.payment_label = "A coordinar";
  }

  merged.created_at_fmt = formatDateTime(merged.created_at);
  receipt.value = merged;
  hydrationSource.value = source;
}

/**
 * Fallback opcional: si solo tenemos order_id+code y no items, intentamos al backend.
 * Endpoint público esperado: GET /ecom/checkout/receipt/:order_id?code=:code
 * Si no existe (404), no rompe nada: nos quedamos en modo parcial.
 */
async function tryFetchReceiptFromBackend() {
  if (!isPartial.value) return;
  const oid = receipt.value.order_id;
  const code = receipt.value.code;
  if (!oid && !code) return;

  try {
    const params = {};
    if (code) params.code = code;
    const path = oid ? `/ecom/checkout/receipt/${oid}` : `/ecom/checkout/receipt`;
    const { data } = await httpPublic.get(path, { params });

    if (!data || typeof data !== "object") return;

    const fetched = data.receipt || data;
    if (!fetched || (!fetched.order_id && !fetched.code)) return;

    fetched.created_at_fmt = formatDateTime(fetched.created_at);
    receipt.value = { ...receipt.value, ...fetched };
    isPartial.value = false;
    hydrationSource.value = "backend";

    // Cachear localmente para próximas visitas
    try {
      saveReceiptLocal(fetched);
    } catch {}
  } catch (e) {
    // 404 esperado si el endpoint aún no existe — no es un error fatal
    if (e?.response?.status !== 404) {
      console.warn("[checkout/success] backend receipt fetch failed", e?.message || e);
    }
  }
}

onMounted(async () => {
  hydrateFromQueryOrStorage();
  // Si quedamos en modo parcial, intentamos completar via backend (opcional)
  await tryFetchReceiptFromBackend();
});
</script>

<style scoped>
/* =========================
   INTER + base
========================= */
.sc-page,
.sc-page :deep(*) {
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.sc-page {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  letter-spacing: 0.005em;
}

.sc-shell {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding-inline: 12px;
  box-sizing: border-box;
}

.sc-card {
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 16px;
  background: #fff;
  padding: 22px;
  box-sizing: border-box;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

/* =========================
   HEADER
========================= */
.sc-head {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
}

.sc-head-left {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  min-width: 0;
}

.sc-check {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: linear-gradient(180deg, rgba(0, 153, 102, 0.12) 0%, rgba(0, 153, 102, 0.18) 100%);
  color: #009966;
  flex: 0 0 auto;
  box-shadow: 0 0 0 4px rgba(0, 153, 102, 0.06);
}

.sc-head-text {
  min-width: 0;
}
.sc-kicker {
  font-size: 11px;
  font-weight: 460;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.5);
  margin-bottom: 4px;
}

.sc-title {
  font-weight: 540;
  font-size: 22px;
  line-height: 1.18;
  letter-spacing: -0.01em;
  color: rgba(17, 24, 39, 0.94);
}

.sc-sub {
  color: rgba(17, 24, 39, 0.6);
  font-size: 13px;
  font-weight: 400;
  margin-top: 6px;
  max-width: 640px;
  line-height: 1.5;
}

.sc-head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.sc-btn {
  text-transform: none !important;
  font-weight: 460 !important;
  letter-spacing: 0.005em !important;
  border-radius: 12px !important;
}

.sc-partial-alert {
  border-radius: 12px !important;
}
.sc-partial-title {
  font-weight: 500;
  font-size: 13.5px;
}
.sc-partial-text {
  font-size: 12.5px;
  color: rgba(17, 24, 39, 0.7);
  font-weight: 400;
  margin-top: 2px;
}

.sc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.sc-panel {
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 14px;
  padding: 18px;
  background: #fff;
  box-sizing: border-box;
  overflow: hidden;
}

.sc-panel-wide {
  margin-top: 14px;
}

.sc-panel-kicker {
  font-size: 10.5px;
  font-weight: 460;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(17, 24, 39, 0.5);
  margin-bottom: 4px;
}

.sc-panel-title {
  font-weight: 540;
  font-size: 15.5px;
  margin-bottom: 12px;
  color: rgba(17, 24, 39, 0.92);
  letter-spacing: -0.005em;
}

.sc-kv {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 10px;
  padding: 7px 0;
  align-items: start;
}

.sc-k {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12.5px;
  font-weight: 400;
}

.sc-v {
  font-size: 13px;
  font-weight: 460;
  color: rgba(17, 24, 39, 0.92);
  min-width: 0;
  word-break: break-word;
}

.sc-code {
  font-family: "SF Mono", Menlo, Consolas, monospace;
  font-size: 12.5px;
  background: rgba(17, 24, 39, 0.04);
  padding: 2px 7px;
  border-radius: 6px;
  display: inline-block;
}

.sc-actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.sc-share {
  text-transform: none !important;
  font-weight: 460 !important;
  border-radius: 10px !important;
  letter-spacing: 0.005em !important;
}
.sc-share--ghost {
  color: rgba(17, 24, 39, 0.7) !important;
}

.sc-mini {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12px;
  word-break: break-word;
}

.sc-alert-title {
  font-weight: 500;
  font-size: 12.8px;
  margin-bottom: 4px;
}

.sc-empty {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: rgba(17, 24, 39, 0.03);
  border-radius: 10px;
  color: rgba(17, 24, 39, 0.6);
  font-size: 13px;
  font-weight: 400;
}

/* =========================
   ✅ MAPS BLOQUE (más limpio)
   ========================= */
.sc-pickup {
  margin-top: 10px;
}

.sc-pickup-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  border-radius: 12px;
  background: rgba(21, 101, 192, 0.05);
  border: 1px solid rgba(21, 101, 192, 0.14);
}

.sc-pickup-ico {
  margin-top: 2px;
  color: rgb(var(--v-theme-primary));
}

.sc-pickup-title {
  font-weight: 500;
  font-size: 13.5px;
  color: rgba(17, 24, 39, 0.92);
  letter-spacing: -0.005em;
}

.sc-addr {
  line-height: 1.45;
  font-size: 12.5px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.78);
  margin-top: 4px;
  word-break: break-word;
}

.sc-map-cta {
  margin-top: 10px;
  display: flex;
  gap: 6px;
  align-items: center;
}

.sc-map-btn {
  text-transform: none;
  font-weight: 500;
  border-radius: 10px;
}

.sc-map-icon {
  border-radius: 10px;
}

/* ✅ mini preview clickeable */
.sc-map-preview {
  margin-top: 10px;
  position: relative;
  display: block;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: #fff;
  text-decoration: none;
}

.sc-map-preview iframe {
  width: 100%;
  height: 170px;
  border: 0;
  display: block;
  pointer-events: none; /* ✅ el click lo maneja el <a> */
}

.sc-map-overlay {
  position: absolute;
  inset: auto 10px 10px 10px;
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #0f172a;
  font-size: 12.5px;
  font-weight: 500;
}

/* =========================
   ✅ PRODUCTOS (fix estirado)
   ========================= */
.sc-items {
  display: grid;
  gap: 10px;
}

.sc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(17, 24, 39, 0.08);
}
.sc-item:last-of-type {
  border-bottom: none;
}

.sc-item-left {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
}

/* ✅ thumb con tamaño fijo => nunca estira */
.sc-thumb {
  width: 56px;
  height: 56px;
  border-radius: 10px;
  overflow: hidden;
  flex: 0 0 auto;
  background: rgba(17, 24, 39, 0.03);
  border: 1px solid rgba(17, 24, 39, 0.06);
}

.sc-thumb-img {
  width: 100%;
  height: 100%;
}

.sc-thumb-ph {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(17, 24, 39, 0.4);
}

.sc-item-info {
  min-width: 0;
}

.sc-qty {
  font-weight: 500;
  margin-right: 6px;
  color: rgb(var(--v-theme-primary));
}

.sc-item-name {
  font-size: 13px;
  font-weight: 460;
  line-height: 1.32;
  color: rgba(17, 24, 39, 0.88);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
}

.sc-item-sub {
  color: rgba(17, 24, 39, 0.55);
  font-size: 12px;
  font-weight: 400;
  margin-top: 2px;
}

.sc-item-right {
  font-weight: 500;
  font-size: 13.5px;
  color: rgba(17, 24, 39, 0.92);
  white-space: nowrap;
  flex: 0 0 auto;
}

.sc-totals {
  display: grid;
  gap: 8px;
  margin-top: 6px;
}

.sc-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 13px;
  font-weight: 400;
  color: rgba(17, 24, 39, 0.78);
}

.sc-row > span:last-child {
  text-align: right;
  white-space: nowrap;
  font-weight: 460;
  color: rgba(17, 24, 39, 0.92);
}

.sc-free {
  color: #009966 !important;
  font-weight: 500 !important;
}

.sc-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
  font-weight: 540;
  font-size: 18px;
  letter-spacing: -0.01em;
  color: rgba(17, 24, 39, 0.94);
}

.sc-total > span:last-child {
  text-align: right;
  white-space: nowrap;
  font-size: 22px;
}

/* =========================
   SHARE / HELP
   ========================= */
.sc-share-original {
  text-transform: none;
  font-weight: 500;
  border-radius: 10px;
}

.sc-help {
  margin-top: 14px;
  border: 1px solid rgba(0, 153, 102, 0.18);
  background: linear-gradient(180deg, rgba(0, 153, 102, 0.04) 0%, rgba(0, 153, 102, 0.08) 100%);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.sc-help-left {
  min-width: 0;
}

.sc-help-title {
  font-weight: 500;
  font-size: 14px;
  color: rgba(17, 24, 39, 0.92);
  letter-spacing: -0.005em;
}

.sc-help-sub {
  color: rgba(17, 24, 39, 0.6);
  font-size: 12.5px;
  font-weight: 400;
  margin-top: 3px;
}

.sc-wa {
  border-radius: 12px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  letter-spacing: 0.005em !important;
}

.sc-foot {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(17, 24, 39, 0.06);
}

.sc-foot-note {
  color: rgba(17, 24, 39, 0.5);
  font-size: 11.5px;
  font-weight: 400;
}

@media (max-width: 960px) {
  .sc-grid {
    grid-template-columns: 1fr;
  }
}

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

  .sc-map-cta {
    display: grid;
    grid-template-columns: 1fr auto;
  }

  .sc-map-btn {
    width: 100%;
  }

  .sc-map-preview iframe {
    height: 160px;
  }

  .sc-help {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .sc-wa {
    width: 100%;
  }

  .sc-share {
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
  .sc-map-preview iframe {
    height: 145px;
  }
}
</style>
