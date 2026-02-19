<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/products/pages/ProductDetailPage.vue -->
<!-- Admin: Vista detalle de producto + impresión de etiqueta con QR a eCommerce (sin foto) -->

<template>
  <div class="pd" data-page="product-detail">
    <!-- Topbar -->
    <v-card class="pd-top" rounded="xl" elevation="1">
      <div class="pd-top-row">
        <div class="pd-left">
          <v-btn variant="text" class="pd-back" @click="goBack">
            <v-icon start>mdi-arrow-left</v-icon>
            Volver
          </v-btn>

          <div class="pd-title">
            <div class="pd-h1 text-truncate">
              {{ product?.name || "Producto" }}
            </div>
            <div class="pd-sub text-truncate">
              ID: <b>{{ productId }}</b>
              <span v-if="product?.sku"> · SKU: <b>{{ product.sku }}</b></span>
              <span v-if="product?.code"> · Código: <b>{{ product.code }}</b></span>
            </div>
          </div>
        </div>

        <div class="pd-actions">
          <v-btn
            color="primary"
            variant="flat"
            :loading="loadingPrint"
            :disabled="loading || !product"
            @click="openPrintDialog"
          >
            <v-icon start>mdi-printer</v-icon>
            Imprimir etiqueta
          </v-btn>

          <v-btn
            variant="tonal"
            :disabled="loading || !product"
            @click="openEcommerce"
          >
            <v-icon start>mdi-open-in-new</v-icon>
            Ver en eCommerce
          </v-btn>
        </div>
      </div>
    </v-card>

    <!-- Body -->
    <div class="pd-body">
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">
        {{ error }}
      </v-alert>

      <div v-if="loading" class="pd-loading">
        <v-progress-circular indeterminate />
        <div class="text-caption mt-2" style="opacity:.8">Cargando producto…</div>
      </div>

      <div v-else-if="product" class="pd-grid">
        <!-- Col 1 -->
        <v-card rounded="xl" elevation="1" class="pd-card">
          <div class="pd-card-head">
            <div class="pd-card-title">Datos</div>
            <v-chip size="small" variant="tonal" class="ml-auto">
              {{ product?.is_active ? "Activo" : "Inactivo" }}
            </v-chip>
          </div>

          <div class="pd-kv">
            <div class="k">Nombre</div><div class="v">{{ safe(product.name) }}</div>
            <div class="k">SKU</div><div class="v">{{ safe(product.sku) }}</div>
            <div class="k">Código</div><div class="v">{{ safe(product.code) }}</div>
            <div class="k">Marca</div><div class="v">{{ safe(product.brand) }}</div>
            <div class="k">Modelo</div><div class="v">{{ safe(product.model) }}</div>
            <div class="k">Rubro</div><div class="v">{{ safe(product.category_name || product.category_id) }}</div>
            <div class="k">Subrubro</div><div class="v">{{ safe(product.subcategory_name || product.subcategory_id) }}</div>
          </div>

          <div class="mt-3">
            <div class="text-caption" style="opacity:.75; font-weight:800;">Descripción</div>
            <div class="pd-desc">{{ safe(product.description) }}</div>
          </div>
        </v-card>

        <!-- Col 2 -->
        <v-card rounded="xl" elevation="1" class="pd-card">
          <div class="pd-card-head">
            <div class="pd-card-title">Precios</div>
          </div>

          <div class="pd-kv">
            <div class="k">Lista</div><div class="v">{{ money(product.price_list) }}</div>
            <div class="k">Desc.</div><div class="v">{{ money(product.price_discount) }}</div>
            <div class="k">Reventa</div><div class="v">{{ money(product.price_reseller) }}</div>
          </div>

          <v-divider class="my-4" />

          <div class="pd-card-title">QR eCommerce</div>
          <div class="text-caption mb-2" style="opacity:.75">
            Este QR abre la ficha del producto (para clientes).
          </div>

          <div class="pd-qr-wrap">
            <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="pd-qr" />
            <div v-else class="text-caption" style="opacity:.75">
              Generando QR…
            </div>
          </div>

          <div class="pd-url text-caption">
            {{ ecommerceUrl }}
          </div>
        </v-card>

        <!-- Full width -->
        <v-card rounded="xl" elevation="1" class="pd-card pd-card-wide">
          <div class="pd-card-head">
            <div class="pd-card-title">Stock</div>
          </div>

          <div v-if="stockRows.length" class="pd-stock">
            <div v-for="r in stockRows" :key="r.branch_id" class="pd-stock-row">
              <div class="n">{{ r.branch_name }}</div>
              <div class="q">{{ num(r.qty).toFixed(3) }}</div>
            </div>
          </div>
          <div v-else class="text-caption" style="opacity:.75">
            Sin stock disponible / no informado.
          </div>
        </v-card>
      </div>
    </div>

    <!-- Dialog impresión -->
    <v-dialog v-model="printDlg" max-width="520">
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center ga-2">
          <v-icon>mdi-printer</v-icon>
          <span class="font-weight-black">Imprimir etiqueta</span>
        </v-card-title>

        <v-card-text>
          <div class="text-caption" style="opacity:.8">
            Etiqueta térmica <b>58×40mm</b> (default). Sin foto. Incluye QR al eCommerce.
          </div>

          <v-divider class="my-3" />

          <div class="pd-print-preview">
            <div class="pp-name">{{ safe(product?.name) }}</div>
            <div class="pp-price">{{ money(mainPrice) }}</div>
            <div class="pp-meta">
              <div>SKU: <b>{{ safe(product?.sku) }}</b></div>
              <div v-if="product?.code">Cod: <b>{{ safe(product?.code) }}</b></div>
            </div>

            <div class="pp-qr">
              <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" />
            </div>

            <div class="pp-url">{{ ecommerceUrl }}</div>
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="printDlg=false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="loadingPrint" @click="printLabel">
            <v-icon start>mdi-printer</v-icon>
            Imprimir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import QRCode from "qrcode";
import http from "../../app/api/http";

const route = useRoute();
const router = useRouter();

const productId = computed(() => Number(route.params.id || 0));

const loading = ref(false);
const error = ref("");
const product = ref(null);

const qrDataUrl = ref("");
const loadingPrint = ref(false);
const printDlg = ref(false);

function safe(v) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}
function num(v, d = 0) {
  if (v === null || v === undefined || v === "") return d;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : d;
}
function money(v) {
  const n = num(v, 0);
  // ARS estilo simple (no dependemos de Intl si no querés)
  const rounded = Math.round(n);
  const parts = String(rounded).split("");
  let out = "";
  for (let i = 0; i < parts.length; i++) {
    const p = parts[parts.length - 1 - i];
    out = p + out;
    if (i % 3 === 2 && i !== parts.length - 1) out = "." + out;
  }
  return "$ " + out;
}

const ecommerceBase = String(import.meta.env.VITE_SHOP_BASE_URL || "").trim() || window.location.origin;

// ✅ URL tipo “ficha producto” (como tu ejemplo)
// Si querés cambiarlo sin tocar código: VITE_SHOP_PRODUCT_PATH="/shop/product/{id}"
const ecommercePathTpl =
  String(import.meta.env.VITE_SHOP_PRODUCT_PATH || "").trim() || "/shop/product/{id}";

const ecommerceUrl = computed(() => {
  const id = productId.value || product.value?.id || 0;
  const tpl = ecommercePathTpl.includes("{id}") ? ecommercePathTpl : "/shop/product/{id}";
  const path = tpl.replace("{id}", String(id));
  return ecommerceBase.replace(/\/$/, "") + path;
});

const mainPrice = computed(() => {
  const p = product.value || {};
  const disc = num(p.price_discount, 0);
  const list = num(p.price_list, 0);
  return disc > 0 ? disc : list;
});

const stockRows = computed(() => {
  const p = product.value || {};
  const arr = Array.isArray(p.stock_matrix) ? p.stock_matrix : Array.isArray(p.stock) ? p.stock : [];
  return arr
    .map((r) => ({
      branch_id: Number(r.branch_id || r.branchId || 0),
      branch_name: String(r.branch_name || r.branchName || r.branch || "").trim() || `Sucursal ${r.branch_id || "—"}`,
      qty: num(r.qty ?? r.current_qty ?? 0, 0),
    }))
    .filter((x) => x.branch_id > 0);
});

async function fetchProduct() {
  error.value = "";
  loading.value = true;
  try {
    const id = productId.value;
    if (!id) {
      error.value = "ID inválido.";
      product.value = null;
      return;
    }

    // ✅ endpoint típico admin
    // Si tu API usa otro, cambiá SOLO acá.
    const { data } = await http.get(`/admin/products/${id}`);
    product.value = data || null;

    await buildQr();
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo cargar el producto.";
    product.value = null;
  } finally {
    loading.value = false;
  }
}

async function buildQr() {
  try {
    qrDataUrl.value = await QRCode.toDataURL(ecommerceUrl.value, {
      errorCorrectionLevel: "M",
      margin: 1,
      scale: 6,
    });
  } catch {
    qrDataUrl.value = "";
  }
}

function goBack() {
  // vuelve al listado
  router.back();
}

function openEcommerce() {
  window.open(ecommerceUrl.value, "_blank", "noopener,noreferrer");
}

function openPrintDialog() {
  printDlg.value = true;
}

async function printLabel() {
  if (!product.value) return;

  loadingPrint.value = true;
  try {
    if (!qrDataUrl.value) await buildQr();

    const html = buildPrintHtml({
      name: safe(product.value.name),
      price: money(mainPrice.value),
      sku: safe(product.value.sku),
      code: safe(product.value.code),
      qr: qrDataUrl.value,
      url: ecommerceUrl.value,
    });

    const w = window.open("", "_blank", "width=520,height=680");
    if (!w) throw new Error("Popup bloqueado para impresión.");
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();

    // Espera mínima para que cargue el QR
    setTimeout(() => {
      try {
        w.print();
      } catch {}
    }, 250);
  } catch (e) {
    error.value = e?.message || "No se pudo imprimir.";
  } finally {
    loadingPrint.value = false;
    printDlg.value = false;
  }
}

function buildPrintHtml({ name, price, sku, code, qr, url }) {
  // ✅ Etiqueta térmica 58x40mm (sin foto)
  // Si querés otro tamaño, cambiás @page y .label { width/height }
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Etiqueta</title>
  <style>
    @page { size: 58mm 40mm; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; }
    .label {
      width: 58mm;
      height: 40mm;
      box-sizing: border-box;
      padding: 2.6mm;
      display: grid;
      grid-template-columns: 1fr 18mm;
      grid-template-rows: auto auto auto 1fr;
      gap: 1.2mm 2mm;
    }
    .name {
      grid-column: 1 / 2;
      font-size: 9.2pt;
      font-weight: 800;
      line-height: 1.05;
      max-height: 22mm;
      overflow: hidden;
    }
    .price {
      grid-column: 1 / 2;
      font-size: 14pt;
      font-weight: 900;
      line-height: 1;
      margin-top: 0.4mm;
    }
    .meta {
      grid-column: 1 / 2;
      font-size: 7.4pt;
      line-height: 1.15;
      font-weight: 700;
      opacity: .95;
    }
    .qr {
      grid-column: 2 / 3;
      grid-row: 1 / 4;
      align-self: start;
      justify-self: end;
      width: 18mm;
      height: 18mm;
    }
    .qr img { width: 100%; height: 100%; object-fit: contain; }
    .url {
      grid-column: 1 / 3;
      grid-row: 4 / 5;
      font-size: 6.3pt;
      opacity: .85;
      line-height: 1.1;
      word-break: break-all;
      align-self: end;
    }
  </style>
</head>
<body>
  <div class="label">
    <div class="name">${escapeHtml(name)}</div>
    <div class="qr">${qr ? `<img src="${qr}" alt="QR"/>` : ""}</div>
    <div class="price">${escapeHtml(price)}</div>
    <div class="meta">
      <div>SKU: ${escapeHtml(sku)}</div>
      ${code && code !== "—" ? `<div>COD: ${escapeHtml(code)}</div>` : ""}
    </div>
    <div class="url">${escapeHtml(url)}</div>
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

watch(
  () => ecommerceUrl.value,
  () => buildQr()
);

onMounted(fetchProduct);
</script>

<style scoped>
.pd {
  padding: 12px;
}

.pd-top {
  padding: 10px 12px;
  position: sticky;
  top: 0;
  z-index: 5;
}

.pd-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pd-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  flex: 1;
}

.pd-title {
  min-width: 0;
}

.pd-h1 {
  font-size: 18px;
  font-weight: 900;
  line-height: 1.1;
}

.pd-sub {
  font-size: 12px;
  opacity: .8;
  margin-top: 2px;
}

.pd-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pd-body {
  margin-top: 12px;
}

.pd-loading {
  padding: 22px;
  display: grid;
  place-items: center;
}

.pd-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
}
@media (max-width: 1100px) {
  .pd-grid {
    grid-template-columns: 1fr;
  }
}

.pd-card {
  padding: 14px;
}

.pd-card-wide {
  grid-column: 1 / -1;
}

.pd-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.pd-card-title {
  font-weight: 900;
}

.pd-kv {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px 12px;
  align-items: baseline;
}
.pd-kv .k {
  font-size: 12px;
  opacity: .75;
}
.pd-kv .v {
  font-weight: 800;
  word-break: break-word;
}

.pd-desc {
  margin-top: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0,0,0,.04);
  white-space: pre-wrap;
  min-height: 52px;
}

.pd-qr-wrap {
  display: grid;
  place-items: center;
  padding: 10px;
  border-radius: 14px;
  background: rgba(0,0,0,.04);
}

.pd-qr {
  width: 170px;
  max-width: 100%;
  height: auto;
}

.pd-url {
  margin-top: 10px;
  opacity: .75;
  word-break: break-all;
}

.pd-stock {
  display: grid;
  gap: 8px;
}
.pd-stock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0,0,0,.04);
}
.pd-stock-row .n {
  font-weight: 900;
}
.pd-stock-row .q {
  font-weight: 900;
}

/* Preview dentro del dialog */
.pd-print-preview {
  border: 1px dashed rgba(0,0,0,.25);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 8px;
}
.pp-name {
  font-weight: 900;
  line-height: 1.1;
}
.pp-price {
  font-weight: 900;
  font-size: 22px;
  line-height: 1;
}
.pp-meta {
  font-size: 12px;
  opacity: .85;
  font-weight: 800;
}
.pp-qr img {
  width: 160px;
  height: auto;
}
.pp-url {
  font-size: 11px;
  opacity: .75;
  word-break: break-all;
}
</style>
