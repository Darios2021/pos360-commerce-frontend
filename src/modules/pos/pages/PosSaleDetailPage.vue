<!-- src/modules/pos/pages/PosSaleDetailPage.vue -->
<template>
  <v-container fluid class="pa-6 pos-sale-detail">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h4 font-weight-black">Venta #{{ sale?.id ?? id }}</div>
        <div class="text-caption text-medium-emphasis">Detalle completo</div>
      </div>

      <v-btn variant="tonal" @click="$router.back()">
        <v-icon start>mdi-arrow-left</v-icon>
        Volver
      </v-btn>
    </div>

    <!-- Card principal -->
    <v-card class="rounded-xl elevation-3">
      <v-card-text v-if="loading" class="py-10 d-flex justify-center">
        <v-progress-circular indeterminate />
      </v-card-text>

      <v-card-text v-else-if="!sale">
        <v-alert type="warning" variant="tonal" class="rounded-xl">
          Venta no encontrada.
        </v-alert>
      </v-card-text>

      <v-card-text v-else>
        <!-- Top: cliente + totales -->
        <div class="d-flex flex-wrap align-start justify-space-between ga-6">
          <!-- Cliente -->
          <div class="min-w-320">
            <div class="text-caption text-medium-emphasis mb-1">Cliente</div>
            <div class="text-h5 font-weight-black">{{ sale.customer_name || "Consumidor Final" }}</div>

            <div class="text-caption text-medium-emphasis mt-4 mb-1">Fecha</div>
            <div class="text-body-1 font-weight-medium">{{ dt(sale.sold_at || sale.created_at) }}</div>

            <div class="d-flex flex-wrap ga-2 mt-4">
              <v-chip size="small" variant="tonal" :color="statusColor(sale.status)">
                {{ sale.status || "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" :color="payColor(topPaymentMethod)">
                {{ methodLabel(topPaymentMethod) }}
              </v-chip>

              <v-chip size="small" variant="tonal" color="primary">
                Sucursal: {{ sale.branch?.name || sale.branch_id || "—" }}
              </v-chip>

              <v-chip size="small" variant="tonal" color="primary">
                Usuario: {{ userLabel(sale) }}
              </v-chip>
            </div>

            <div class="d-flex flex-wrap ga-2 mt-3">
              <v-chip v-if="sale.customer_doc" size="small" variant="tonal">
                <v-icon start size="16">mdi-card-account-details-outline</v-icon>
                {{ sale.customer_doc }}
              </v-chip>
              <v-chip v-if="sale.customer_phone" size="small" variant="tonal">
                <v-icon start size="16">mdi-phone</v-icon>
                {{ sale.customer_phone }}
              </v-chip>
            </div>

            <div v-if="sale.note" class="mt-4">
              <div class="text-caption text-medium-emphasis mb-1">Nota</div>
              <div class="text-body-2">{{ sale.note }}</div>
            </div>
          </div>

          <!-- Totales -->
          <div class="flex-1 min-w-360">
            <div class="d-flex justify-space-between">
              <div>
                <div class="text-body-2">Subtotal</div>
                <div class="text-body-2">Descuento</div>
                <div class="text-body-2">Impuestos</div>
              </div>
              <div class="text-right">
                <div class="text-body-2 font-weight-bold">{{ money(sale.subtotal) }}</div>
                <div class="text-body-2 font-weight-bold">{{ money(sale.discount_total) }}</div>
                <div class="text-body-2 font-weight-bold">{{ money(sale.tax_total) }}</div>
              </div>
            </div>

            <v-divider class="my-4" />

            <div class="d-flex justify-space-between align-center">
              <div class="text-h6 font-weight-black">TOTAL</div>
              <div class="text-h5 font-weight-black">{{ money(sale.total) }}</div>
            </div>

            <div class="d-flex justify-space-between mt-3">
              <div>
                <div class="text-body-2">Pagado</div>
                <div class="text-body-2">Vuelto</div>
              </div>
              <div class="text-right">
                <div class="text-body-2 font-weight-bold">{{ money(sale.paid_total) }}</div>
                <div class="text-body-2 font-weight-bold">{{ money(sale.change_total) }}</div>
              </div>
            </div>

            <!-- ✅ Resumen Neto (devoluciones y cambios) -->
            <v-divider class="my-4" />
            <div class="d-flex align-center justify-space-between flex-wrap ga-2">
              <div>
                <div class="text-caption text-medium-emphasis">Resumen neto</div>
                <div class="text-body-2">
                  Devuelto: <b>{{ money(refundsTotal) }}</b>
                  <span class="mx-2">·</span>
                  Diferencias cambios: <b>{{ money(exchangesDiffTotal) }}</b>
                </div>
              </div>

              <v-chip size="small" variant="tonal" :color="netTotal >= 0 ? 'green' : 'orange'">
                Neto: <b class="ml-1">{{ money(netTotal) }}</b>
              </v-chip>
            </div>
          </div>
        </div>

        <v-divider class="my-6" />

        <!-- Productos -->
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-1 font-weight-bold">Productos</div>

          <div class="d-flex align-center ga-2">
            <div class="text-caption text-medium-emphasis">items: {{ (sale.items || []).length }}</div>

            <v-chip size="x-small" variant="tonal" :color="productsLoading ? 'indigo' : 'grey'">
              <v-progress-circular
                v-if="productsLoading"
                indeterminate
                size="14"
                width="2"
                class="mr-2"
              />
              {{ productsLoading ? "Cargando productos…" : "Productos listos" }}
            </v-chip>
          </div>
        </div>

        <v-data-table
          :headers="itemsHeaders"
          :items="sale.items || []"
          item-key="id"
          class="rounded-xl"
          density="comfortable"
        >
          <template #item.product="{ item }">
            <div class="d-flex align-center ga-3">
              <v-avatar size="54" rounded="lg" class="thumb" @click="openImage(item)">
                <v-img v-if="itemImage(item)" :src="itemImage(item)" cover />
                <v-icon v-else>mdi-image-off-outline</v-icon>
              </v-avatar>

              <div class="min-w-0 flex-1">
                <div class="d-flex align-center justify-space-between ga-3">
                  <div class="text-body-1 font-weight-black text-truncate">
                    {{ productName(item) }}
                  </div>

                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="availabilityColor(item)"
                    title="Disponibilidad según stock actual"
                  >
                    {{ availabilityLabel(item) }}
                  </v-chip>
                </div>

                <div class="text-caption text-medium-emphasis mt-1 d-flex flex-wrap ga-2">
                  <span><b>SKU:</b> {{ productSku(item) }}</span>
                  <span v-if="productBrand(item)"><b>Marca:</b> {{ productBrand(item) }}</span>
                  <span v-if="productModel(item)"><b>Modelo:</b> {{ productModel(item) }}</span>
                </div>

                <div class="d-flex flex-wrap ga-1 mt-2">
                  <v-chip size="x-small" variant="tonal">
                    Cat: {{ categoryLabel(item) }}
                  </v-chip>

                  <v-chip size="x-small" variant="tonal" v-if="warehouseLabel(item) !== '—'">
                    Depósito: {{ warehouseLabel(item) }}
                  </v-chip>

                  <v-chip size="x-small" variant="tonal" :color="stockChipColor(item)" title="Stock actual (POS)">
                    Stock: <b class="ml-1">{{ stockText(item) }}</b>
                  </v-chip>

                  <v-chip
                    size="x-small"
                    variant="tonal"
                    color="blue-grey"
                    v-if="barcodeLabel(item)"
                    title="Barcode"
                  >
                    <v-icon start size="16">mdi-barcode</v-icon>
                    {{ barcodeLabel(item) }}
                  </v-chip>
                </div>
              </div>
            </div>
          </template>

          <template #item.stock="{ item }">
            <div class="text-right">
              <div class="font-weight-black">{{ stockText(item) }}</div>
            </div>
          </template>

          <template #item.qty="{ item }">
            <div class="font-weight-black">{{ number(item.quantity) }}</div>
          </template>

          <template #item.unit="{ item }">
            <div class="font-weight-bold">{{ money(item.unit_price) }}</div>
          </template>

          <template #item.total="{ item }">
            <div class="font-weight-black">{{ money(item.line_total) }}</div>
          </template>

          <template #item.actions="{ item }">
            <div class="d-flex ga-2 justify-end">
              <v-btn size="small" variant="tonal" color="primary" @click="goToProduct(item.product_id)">
                <v-icon start>mdi-cube-outline</v-icon>
                Perfil
              </v-btn>
            </div>
          </template>

          <template #bottom />
        </v-data-table>

        <!-- Pagos -->
        <v-divider class="my-6" />
        <div class="text-subtitle-1 font-weight-bold mb-2">Pagos</div>

        <div v-if="(sale.payments || []).length" class="d-flex flex-column ga-2">
          <div v-for="p in sale.payments" :key="p.id" class="d-flex justify-space-between align-center">
            <div class="text-body-2 font-weight-medium">
              {{ methodLabel(p.method) }}
              <span v-if="p.paid_at" class="text-caption text-medium-emphasis"> · {{ dt(p.paid_at) }}</span>
            </div>
            <div class="text-body-2 font-weight-black">{{ money(p.amount) }}</div>
          </div>
        </div>

        <v-alert v-else type="info" variant="tonal" class="rounded-xl">
          Sin pagos registrados.
        </v-alert>

        <!-- ✅ Devoluciones -->
        <v-divider class="my-6" />
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-1 font-weight-bold">Devoluciones</div>
          <v-chip size="small" variant="tonal" color="orange">{{ refunds.length }}</v-chip>
        </div>

        <v-alert v-if="!refunds.length" type="info" variant="tonal" class="rounded-xl">
          No hay devoluciones registradas para esta venta.
        </v-alert>

        <div v-else class="d-flex flex-column ga-2">
          <v-card v-for="r in refunds" :key="r.id" class="rounded-xl" variant="outlined">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Fecha</div>
                  <div class="font-weight-bold">{{ dt(r.created_at) }}</div>
                </div>
                <v-chip size="small" variant="tonal" color="orange">
                  {{ money(r.amount) }}
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-2">
                Medio: <b>{{ methodLabel(r.refund_method) }}</b>
                <span v-if="r.reference"> · Ref: {{ r.reference }}</span>
              </div>

              <div class="text-caption text-medium-emphasis" v-if="r.reason">
                Motivo: {{ r.reason }}
              </div>
            </v-card-text>
          </v-card>
        </div>

        <!-- ✅ Cambios -->
        <v-divider class="my-6" />
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-1 font-weight-bold">Cambios</div>
          <v-chip size="small" variant="tonal" color="cyan">{{ exchanges.length }}</v-chip>
        </div>

        <v-alert v-if="!exchanges.length" type="info" variant="tonal" class="rounded-xl">
          No hay cambios registrados para esta venta.
        </v-alert>

        <div v-else class="d-flex flex-column ga-2">
          <v-card v-for="x in exchanges" :key="x.id" class="rounded-xl" variant="outlined">
            <v-card-text>
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Fecha</div>
                  <div class="font-weight-bold">{{ dt(x.created_at) }}</div>
                </div>
                <v-chip size="small" variant="tonal" color="cyan">
                  Dif: {{ money(x.diff) }}
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-2">
                Original: {{ money(x.original_total) }}
                · Nuevo: {{ money(x.new_total) }}
                · Devuelto: {{ money(x.returned_amount) }}
              </div>

              <div class="text-caption text-medium-emphasis" v-if="x.note">
                Nota: {{ x.note }}
              </div>
            </v-card-text>
          </v-card>
        </div>
      </v-card-text>
    </v-card>

    <!-- Dialog imagen -->
    <v-dialog v-model="imageDialog" max-width="860">
      <v-card class="rounded-xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="font-weight-black">{{ productName(imageItem) }}</div>
          <v-btn icon variant="text" @click="imageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-img
            v-if="itemImage(imageItem)"
            :src="itemImage(imageItem)"
            cover
            style="max-height:540px; border-radius: 14px;"
          />
          <v-alert v-else type="info" variant="tonal" class="rounded-xl">
            Este producto no tiene imagen asociada.
          </v-alert>

          <div class="d-flex ga-2 mt-4">
            <v-btn
              variant="tonal"
              color="primary"
              @click="goToProduct(imageItem?.product_id)"
              :disabled="!imageItem?.product_id"
            >
              <v-icon start>mdi-cube-outline</v-icon>
              Ver producto
            </v-btn>

            <v-btn variant="tonal" @click="copyText(itemImage(imageItem) || '')" :disabled="!itemImage(imageItem)">
              <v-icon start>mdi-link-variant</v-icon>
              Copiar URL
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "../../../app/api/http";
import { useProductsStore } from "../../../app/store/products.store";

const route = useRoute();
const router = useRouter();
const productsStore = useProductsStore();

const id = computed(() => Number(route.params.id || 0));
const loading = ref(false);

// ✅ el backend devuelve: { sale, refunds, exchanges }
const payload = ref(null);
const sale = computed(() => payload.value?.sale || null);

// ✅ devoluciones/cambios (del payload)
const refunds = computed(() => (Array.isArray(payload.value?.refunds) ? payload.value.refunds : []));
const exchanges = computed(() => (Array.isArray(payload.value?.exchanges) ? payload.value.exchanges : []));

const refundsTotal = computed(() => refunds.value.reduce((a, r) => a + Number(r?.amount || 0), 0));
const exchangesDiffTotal = computed(() => exchanges.value.reduce((a, x) => a + Number(x?.diff || 0), 0));

// Neto “operativo”: total - devoluciones + (diff de cambios)
const netTotal = computed(() => Number(sale.value?.total || 0) - refundsTotal.value + exchangesDiffTotal.value);

const snack = ref({ show: false, text: "" });

const imageDialog = ref(false);
const imageItem = ref(null);

const productsLoading = ref(false);

const itemsHeaders = [
  { title: "Producto", key: "product", sortable: false },
  { title: "Stock", key: "stock", sortable: false, width: 110, align: "end" },
  { title: "Cant.", key: "qty", sortable: false, width: 110 },
  { title: "Unit.", key: "unit", sortable: false, width: 160 },
  { title: "Total", key: "total", sortable: false, width: 160 },
  { title: "", key: "actions", sortable: false, width: 140 },
];

const topPaymentMethod = computed(() => {
  const p = sale.value?.payments?.[0]?.method;
  return String(p || "").toUpperCase();
});

// =====================
// Helpers UI
// =====================
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function dt(val) {
  return val ? new Date(val).toLocaleString("es-AR") : "—";
}
function number(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}
function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

// =====================
// Labels
// =====================
function methodLabel(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "Efectivo";
  if (x === "CARD") return "Tarjeta / Débito";
  if (x === "TRANSFER") return "Transferencia";
  if (x === "QR") return "QR";
  if (x === "OTHER") return "Otro";
  return m || "—";
}
function payColor(m) {
  const x = String(m || "").toUpperCase();
  if (x === "CASH") return "green";
  if (x === "CARD") return "indigo";
  if (x === "TRANSFER") return "purple";
  if (x === "QR") return "cyan";
  return "grey";
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
  return u?.name || u?.full_name || u?.email || u?.username || (s?.user_id ? `#${s.user_id}` : "—");
}

// =====================
// Product getters
// =====================
function p(item) {
  return item?.product || null;
}
function pidOf(item) {
  const pid = Number(item?.product_id || item?.productId || p(item)?.id || 0);
  return Number.isFinite(pid) ? pid : 0;
}
function productName(item) {
  return (
    item?.product_name_snapshot ||
    p(item)?.name ||
    p(item)?.title ||
    p(item)?.product_name ||
    (pidOf(item) ? `Producto #${pidOf(item)}` : "Producto")
  );
}
function productSku(item) {
  // ✅ súper tolerante (porque acá está el “—”)
  const prod = p(item) || {};
  const v =
    item?.product_sku_snapshot ||
    prod?.sku ||
    prod?.SKU ||
    prod?.code ||
    prod?.product_code ||
    prod?.internal_code ||
    prod?.codigo ||
    prod?.barcode ||
    prod?.ean ||
    prod?.gtin ||
    null;

  const s = v ? String(v).trim() : "";
  return s || "—";
}
function productBrand(item) {
  const v = p(item)?.brand || p(item)?.marca || "";
  const s = v ? String(v).trim() : "";
  return s || "";
}
function productModel(item) {
  const v = p(item)?.model || p(item)?.modelo || "";
  const s = v ? String(v).trim() : "";
  return s || "";
}
function barcodeLabel(item) {
  const prod = p(item) || {};
  const v = prod?.barcode || prod?.ean || prod?.gtin || prod?.codigo_barra || "";
  const s = v ? String(v).trim() : "";
  return s || "";
}
function warehouseLabel(item) {
  return item?.warehouse?.name || (item?.warehouse_id ? `#${item.warehouse_id}` : "—");
}
function categoryLabel(item) {
  const prod = p(item) || {};
  const cat = prod?.category || null;
  if (cat?.name) {
    const parent = cat?.parent?.name ? ` / ${cat.parent.name}` : "";
    return `${cat.name}${parent}`;
  }
  const cid = Number(prod?.category_id || prod?.subcategory_id || prod?.categoryId || 0) || null;
  return cid ? `#${cid}` : "—";
}

// =====================
// Imagen (mismo criterio que POS)
// =====================
const imageById = ref({});
const imgLoading = ref({});

function pickUrlFromImageRow(row) {
  if (!row) return "";
  return (
    row.url ||
    row.public_url ||
    row.publicUrl ||
    row.image_url ||
    row.path ||
    row.key ||
    row.location ||
    row.filename ||
    ""
  );
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
  const direct =
    prod?.main_image_url ||
    prod?.image_url ||
    prod?.image ||
    prod?.thumb_url ||
    prod?.thumbnail_url ||
    prod?.public_url ||
    prod?.publicUrl ||
    null;

  if (direct) return normalizeUrl(direct);

  const arr = Array.isArray(prod?.images)
    ? prod.images
    : Array.isArray(prod?.product_images)
      ? prod.product_images
      : null;

  if (arr?.length) {
    const u = pickUrlFromImageRow(arr[0]);
    if (u) return normalizeUrl(u);
  }
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
    const next = { ...imgLoading.value };
    delete next[pid];
    imgLoading.value = next;
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

// =====================
// Stock (más tolerante)
// =====================
function stockQty(item) {
  const prod = p(item) || {};
  // ✅ POS suele devolver qty
  const q =
    prod?.qty ??
    prod?.stock_qty ??
    prod?.stock ??
    prod?.on_hand ??
    prod?.available_qty ??
    prod?.available ??
    prod?.existence ??
    prod?.current_stock ??
    prod?.warehouse_qty ??
    null;

  if (q === null || q === undefined) return null;
  return toNum(q);
}
function stockText(item) {
  if (!pidOf(item)) return "—";
  if (!p(item)) return "—";
  const q = stockQty(item);
  return q === null ? "—" : String(q);
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
function stockChipColor(item) {
  return availabilityColor(item);
}

// =====================
// Actions
// =====================
function goToProduct(pid) {
  const n = Number(pid || 0);
  if (!n) return;
  router.push({ name: "productProfile", params: { id: n } });
}
function openImage(item) {
  imageItem.value = item || null;
  imageDialog.value = true;
}
async function copyText(txt) {
  try {
    if (!txt) return;
    await navigator.clipboard.writeText(txt);
    snack.value = { show: true, text: "Copiado" };
  } catch {
    snack.value = { show: true, text: "No se pudo copiar" };
  }
}

// =====================================================
// ✅ HYDRATE ROBUSTO: trae el producto COMPLETO
// Orden:
// 1) /pos/products/:id (mejor para qty)
// 2) /pos/products?ids=...
// 3) /products/:id
// =====================================================
function needsHydrateProducts(items) {
  const arr = Array.isArray(items) ? items : [];
  if (!arr.length) return false;

  // hidratamos si falta product o falta “identidad” fuerte (sku/codigo)
  return arr.some((it) => {
    const prod = it?.product;
    if (!prod) return true;

    const name = prod?.name || prod?.title || prod?.product_name;
    if (!name) return true;

    const hasSku = !!(prod?.sku || prod?.code || prod?.product_code || prod?.internal_code);
    const hasQty = prod?.qty !== undefined || prod?.stock_qty !== undefined || prod?.stock !== undefined;

    return !(hasSku && hasQty);
  });
}

async function fetchPosProductOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;

  const attempts = [
    { url: `/pos/products/${pid}`, params: { include_images: 1 } },
    { url: `/pos/products/${pid}`, params: undefined },
  ];

  let lastErr = null;
  for (const a of attempts) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      // aceptamos {ok:true,data:{...}} o {...} directo
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("pos product one failed");
}

async function fetchPosProductsBatch(ids) {
  const params = { ids: ids.join(","), include_images: 1, limit: ids.length, page: 1 };
  const { data } = await http.get("/pos/products", { params });

  const out = data?.data || data || [];
  const arr = Array.isArray(out) ? out : Array.isArray(out?.items) ? out.items : [];
  if (!arr.length) throw new Error("pos products batch vacío");
  return arr;
}

async function fetchProductFallbackOne(id) {
  const pid = Number(id || 0);
  if (!pid) return null;

  const attempts = [
    { url: `/products/${pid}`, params: { include_images: 1 } },
    { url: `/products/${pid}`, params: undefined },
  ];

  let lastErr = null;
  for (const a of attempts) {
    try {
      const { data } = await http.get(a.url, a.params ? { params: a.params } : undefined);
      const obj = data?.ok ? data?.data : data;
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr || new Error("product one failed");
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

    // 1) intento batch /pos/products?ids=...
    try {
      const list = await fetchPosProductsBatch(ids);
      for (const pr of list) {
        const pid = Number(pr?.id || 0);
        if (pid) map.set(pid, pr);
      }
    } catch {
      // 2) si no hay batch, probamos /pos/products/:id en paralelo
      const rows = await Promise.all(ids.map((pid) => fetchPosProductOne(pid).catch(() => null)));
      for (const pr of rows) {
        const pid = Number(pr?.id || 0);
        if (pid) map.set(pid, pr);
      }
    }

    // 3) para los que sigan faltando, fallback /products/:id
    const missing = ids.filter((pid) => !map.has(pid));
    if (missing.length) {
      const rows = await Promise.all(missing.map((pid) => fetchProductFallbackOne(pid).catch(() => null)));
      for (const pr of rows) {
        const pid = Number(pr?.id || 0);
        if (pid && !map.has(pid)) map.set(pid, pr);
      }
    }

    // inyectar a items
    for (const it of items) {
      const pid = pidOf(it);
      if (!pid) continue;
      if (map.has(pid)) it.product = map.get(pid);
    }
  } finally {
    productsLoading.value = false;
  }
}

// =====================
// Load
// =====================
async function load() {
  loading.value = true;
  payload.value = null;

  try {
    const { data } = await http.get(`/pos/sales/${id.value}`);
    if (!data?.ok) throw new Error(data?.message || "Error cargando venta");

    payload.value = data.data || null;

    // ✅ clave: hidratar con estrategia robusta
    await hydrateProductsForItems();
  } catch (e) {
    snack.value = { show: true, text: e?.response?.data?.message || e?.message || "Error" };
  } finally {
    loading.value = false;
  }
}

onMounted(load);
watch(id, () => load());
</script>

<style scoped>
.pos-sale-detail {
  background: radial-gradient(1200px 600px at 30% 0%, rgba(255,255,255,.06), transparent 60%),
              radial-gradient(900px 500px at 80% 10%, rgba(255,255,255,.04), transparent 60%),
              rgba(0,0,0,.02);
}

.min-w-0 { min-width: 0; }
.min-w-320 { min-width: 320px; }
.min-w-360 { min-width: 360px; }

.thumb {
  cursor: zoom-in;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
}
</style>
