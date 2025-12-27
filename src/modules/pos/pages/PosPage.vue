<!-- src/modules/pos/pages/PosPage.vue -->
<template>
  <v-container fluid class="pos-wrap">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
      <div>
        <div class="text-h5 font-weight-bold">Punto de Venta</div>
        <div class="text-caption text-medium-emphasis">Productos · Carrito · Cobro</div>

        <div class="d-flex flex-wrap ga-2 mt-2">
          <v-chip size="small" variant="tonal" color="primary">
            Sucursal: {{ branchName || `Sucursal #${posStore.branch_id ?? "—"}` }}
          </v-chip>

          <v-chip size="small" variant="tonal" color="primary">
            Productos listos para vender: {{ filteredTotal }}
          </v-chip>

          <v-chip v-if="ctxError" size="small" variant="tonal" color="red">
            {{ ctxError }}
          </v-chip>
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn variant="tonal" @click="refresh" :loading="loadingList">
          <v-icon start>mdi-refresh</v-icon>
          Actualizar
        </v-btn>

        <v-btn color="primary" @click="openCheckout" :disabled="posStore.cart.length === 0">
          <v-icon start>mdi-cash-register</v-icon>
          Cobrar
        </v-btn>
      </div>
    </div>

    <v-row dense class="pos-grid">
      <!-- LEFT: Productos -->
      <v-col cols="12" md="8" class="pos-left">
        <v-card class="rounded-xl pos-toolbar pos-surface" elevation="1">
          <v-card-text class="py-3">
            <v-row dense class="align-center">
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="q"
                  label="Buscar productos"
                  placeholder="Nombre / SKU / Código / Barcode / Marca / Modelo / Rubro / Subrubro"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  @keyup.enter="doSearch"
                  @click:clear="clearSearch"
                  @update:model-value="debounceSearch"
                />
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="rubroId"
                  :items="rubroItems"
                  item-title="title"
                  item-value="value"
                  label="Rubro"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  no-data-text="No hay rubros"
                  @update:model-value="onRubroChange"
                />
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <v-select
                  v-model="subrubroId"
                  :items="subrubroItems"
                  item-title="title"
                  item-value="value"
                  label="Subrubro"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  :disabled="!rubroId"
                  no-data-text="No hay subrubros"
                />
              </v-col>
            </v-row>

            <div class="d-flex justify-space-between flex-wrap ga-2 mt-2">
              <div class="text-caption text-medium-emphasis">
                Mostrando {{ pagedItems.length }} de {{ filteredTotal }}
              </div>

              <div class="d-flex ga-2">
                <v-btn size="small" variant="tonal" @click="prevPage" :disabled="page <= 1">
                  <v-icon start>mdi-chevron-left</v-icon>
                  Anterior
                </v-btn>
                <v-btn size="small" variant="tonal" @click="nextPage" :disabled="page >= pages">
                  Siguiente
                  <v-icon end>mdi-chevron-right</v-icon>
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Grid productos -->
        <div class="pos-products mt-3 pos-surface">
          <div v-if="loadingList" class="d-flex justify-center align-center py-12">
            <v-progress-circular indeterminate />
          </div>
<v-row v-else dense>
  <v-col v-for="p in pagedItems" :key="p.id" cols="12" sm="6" md="4" lg="3" xl="2">
    <PosProductCard
      :item="p"
      :image="productImage(p) || ''"
      :rubro-label="rubroName(p) || ''"
      :subrubro-label="subrubroName(p) || ''"
      :price="resolveUnitPrice(p, 'LIST')"
      price-label="Lista"
      @add="add"
      @details="openDetails"
    />
  </v-col>
</v-row>



          <div v-if="!loadingList && pagedItems.length === 0" class="text-center py-12 text-medium-emphasis">
            <v-icon size="56" class="mb-2">mdi-text-box-search-outline</v-icon>
            <div class="text-h6">No se encontraron productos listos para vender</div>
            <div class="text-caption">Solo se muestran productos con stock y precio &gt; 0.</div>
          </div>
        </div>
      </v-col>

      <!-- RIGHT: Carrito -->
      <v-col cols="12" md="4" class="pos-right">
        <v-card class="rounded-xl cart-card pos-surface" elevation="1">
          <div class="cart-head">
            <div class="d-flex align-center justify-space-between px-4 py-3">
              <div class="d-flex align-center ga-2">
                <v-icon>mdi-cart</v-icon>
                <span class="font-weight-bold">Carrito</span>
              </div>

              <v-chip size="small" variant="tonal">{{ posStore.totalItems }} ítems</v-chip>
            </div>

            <v-divider />

            <!-- Cliente rápido -->
            <div class="px-4 pt-3">
              <div class="text-caption text-medium-emphasis mb-2">Cliente (rápido)</div>

              <v-row dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.first_name"
                    label="Nombre"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    prepend-inner-icon="mdi-account"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.last_name"
                    label="Apellido"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.whatsapp"
                    label="WhatsApp"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    prepend-inner-icon="mdi-whatsapp"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="customer.email"
                    label="Email"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    prepend-inner-icon="mdi-email-outline"
                  />
                </v-col>
              </v-row>
            </div>
          </div>

          <div class="cart-body px-4 pt-3">
            <div v-if="posStore.cart.length === 0" class="empty">
              <v-icon size="56" class="mb-2">mdi-cart-off</v-icon>
              <div class="font-weight-bold">Carrito vacío</div>
              <div class="text-caption text-medium-emphasis">Agregá productos para cobrar</div>
            </div>

            <v-list v-else density="compact" class="pa-0" bg-color="transparent">
              <v-list-item v-for="it in posStore.cart" :key="it.id" class="cart-item rounded-lg mb-2">
                <template #prepend>
                  <v-avatar rounded="lg" size="44" class="border">
                    <v-img v-if="it.image" :src="it.image" cover />
                    <v-icon v-else>mdi-package-variant</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="cart-title">{{ it.name }}</v-list-item-title>

                <v-list-item-subtitle class="text-caption text-medium-emphasis">
                  {{ qty3(it.qty) }} × {{ money(it.price) }}
                  <span class="dot">·</span>
                  <span class="muted">{{ it.price_label || "Precio" }}</span>
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex align-center ga-2">
                    <div class="text-right">
                      <div class="font-weight-bold">{{ money(it.subtotal) }}</div>
                    </div>

                    <v-btn icon="mdi-minus" size="x-small" variant="tonal" @click.stop="posStore.decreaseQty(it.id)" />
                    <v-btn icon="mdi-plus" size="x-small" variant="tonal" @click.stop="posStore.increaseQty(it.id)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <div class="cart-foot">
            <v-divider />
            <div class="px-4 py-3">
              <div class="totals">
                <div class="row">
                  <span class="muted">Subtotal</span>
                  <span class="font-weight-bold">{{ money(checkoutTotalPreview) }}</span>
                </div>

                <div class="row total">
                  <span class="text-subtitle-1 font-weight-bold">Total</span>
                  <span class="text-h6 font-weight-black">{{ money(checkoutTotalPreview) }}</span>
                </div>
              </div>

              <div class="d-flex ga-2 mt-3 cart-actions">
                <v-btn
                  block
                  variant="tonal"
                  color="grey"
                  :disabled="posStore.cart.length === 0"
                  @click="posStore.clearCart()"
                >
                  <v-icon start>mdi-broom</v-icon>
                  Vaciar
                </v-btn>

                <v-btn block color="primary" :disabled="posStore.cart.length === 0" @click="openCheckout">
                  <v-icon start>mdi-cash-register</v-icon>
                  Cobrar
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Modal detalle -->
    <v-dialog v-model="detailsOpen" max-width="900">
      <v-card rounded="xl">
        <v-card-title class="font-weight-black">Detalle producto</v-card-title>
        <v-card-text>
          <div v-if="!detailsItem" class="text-medium-emphasis">—</div>

          <div v-else class="d-flex ga-4 flex-wrap">
            <v-avatar rounded="xl" size="160" class="border">
              <v-img v-if="productImage(detailsItem)" :src="productImage(detailsItem)" cover />
              <v-icon v-else size="48">mdi-package-variant</v-icon>
            </v-avatar>

            <div style="min-width: 240px; flex:1;">
              <div class="text-h6 font-weight-black">{{ detailsItem.name }}</div>
              <div class="text-caption text-medium-emphasis">SKU: {{ detailsItem.sku || "—" }}</div>

              <div class="mt-3">
                <div class="text-caption text-medium-emphasis">Stock: <b>{{ qty3(detailsItem.qty ?? 0) }}</b></div>
                <div class="text-caption text-medium-emphasis">
                  Rubro: <b>{{ rubroName(detailsItem) || "—" }}</b>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Subrubro: <b>{{ subrubroName(detailsItem) || "—" }}</b>
                </div>
              </div>

              <div class="mt-3">
                <div class="text-caption text-medium-emphasis">Marca: <b>{{ detailsItem.brand || "—" }}</b></div>
                <div class="text-caption text-medium-emphasis">Modelo: <b>{{ detailsItem.model || "—" }}</b></div>
              </div>

              <div class="mt-3 text-h6 font-weight-black">
                {{ money(resolveUnitPrice(detailsItem, "LIST")) }}
                <span class="text-caption text-medium-emphasis"> (lista)</span>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="tonal" @click="detailsOpen = false">Cerrar</v-btn>
          <v-btn color="primary" variant="flat" @click="detailsItem && add(detailsItem)">
            <v-icon start>mdi-plus</v-icon> Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✅ COBRO COMPLETO (FIX: no congela) -->
    <v-dialog v-model="checkoutDialog" max-width="560" persistent>
      <v-card class="rounded-xl overflow-hidden">
        <div class="bg-primary pa-4 text-center">
          <div class="text-overline text-white opacity-80 mb-1">Confirmar Cobro</div>
          <div class="text-h4 font-weight-black text-white">
            {{ money(checkoutTotal) }}
          </div>
          <div class="text-caption text-white opacity-85 mt-1">
            * El precio se define acá según método de pago / cuotas / revendedor.
          </div>
        </div>

        <v-card-text class="pa-5">
          <div class="text-subtitle-2 font-weight-bold mb-3">Método de pago</div>

          <v-radio-group v-model="paymentMethod" color="primary">
            <v-radio value="CASH" label="Efectivo" />
            <v-radio value="CARD" label="Tarjeta / Débito" />
            <v-radio value="TRANSFER" label="Transferencia" />
            <v-radio value="QR" label="Mercado Pago" />
          </v-radio-group>

          <v-row dense class="mt-2">
            <v-col cols="12" md="6">
              <v-switch
                v-model="applyReseller"
                inset
                color="primary"
                label="Aplicar precio revendedor"
                hide-details
              />
              <div class="text-caption text-medium-emphasis">
                Si no existe precio revendedor (&gt; 0), cae a descuento/lista según corresponda.
              </div>
            </v-col>

            <v-col cols="12" md="6" v-if="paymentMethod === 'CARD' && !applyReseller">
              <v-select
                v-model="installments"
                :items="installmentsItems"
                label="Cuotas"
                variant="outlined"
                density="comfortable"
                hide-details
              />
              <div class="text-caption text-medium-emphasis mt-1">
                1 pago = descuento · 2 a 6 cuotas = precio lista.
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4" />

          <v-row dense>
            <v-col cols="12" v-if="paymentMethod === 'TRANSFER'">
              <v-text-field
                v-model="paymentProof"
                label="Comprobante / N° operación"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-receipt-text-outline"
                hide-details
              />
              <div class="text-caption text-medium-emphasis mt-1">
                Guardalo para trazabilidad (transferencia).
              </div>
            </v-col>

            <v-col cols="12" v-if="paymentMethod === 'QR'">
              <v-text-field
                v-model="paymentProof"
                label="ID operación / Comprobante"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-qrcode-scan"
                hide-details
              />
            </v-col>

            <v-col cols="12" v-if="paymentMethod === 'CASH'">
              <v-text-field
                v-model="cashInput"
                label="Efectivo recibido"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-cash"
                :error="cashError"
                :error-messages="cashErrorMsg"
                @keyup.enter="confirmPayment"
              />
            </v-col>
          </v-row>

          <v-alert type="info" variant="tonal" class="mt-3">
            {{ checkoutPriceHint }}
          </v-alert>
        </v-card-text>

        <v-divider />

        <v-card-actions class="pa-4">
          <v-btn
            size="large"
            variant="text"
            color="grey"
            @click="checkoutDialog = false"
            :disabled="posStore.loading"
          >
            Cancelar
          </v-btn>
          <v-spacer />

          <v-btn
            size="large"
            color="green-darken-1"
            variant="flat"
            class="px-6"
            :loading="posStore.loading"
            :disabled="cannotConfirm"
            @click="confirmPayment"
          >
            <v-icon start>mdi-check</v-icon>
            Confirmar venta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>

    <v-snackbar v-model="posStore.toast.show" :timeout="3200">
      {{ posStore.toast.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import http from "../../../app/api/http";
import { usePosStore } from "../../../app/store/pos.store";
import { useAuthStore } from "../../../app/store/auth.store";
import { useProductsStore } from "../../../app/store/products.store";
import PosProductCard from "../components/PosProductCard.vue";


const posStore = usePosStore();
const auth = useAuthStore();
const products = useProductsStore();

const ctxError = ref("");
const q = ref("");
const page = ref(1);
const limit = ref(24);

const rubroId = ref(null);
const subrubroId = ref(null);

const loadingList = ref(false);
let tSearch = null;

const checkoutDialog = ref(false);
const paymentMethod = ref("CASH");
const installments = ref(1);
const installmentsItems = [
  { title: "1 pago", value: 1 },
  { title: "2 cuotas", value: 2 },
  { title: "3 cuotas", value: 3 },
  { title: "4 cuotas", value: 4 },
  { title: "5 cuotas", value: 5 },
  { title: "6 cuotas", value: 6 },
];
const applyReseller = ref(false);
const paymentProof = ref("");

const cashInput = ref("");
const cashError = ref(false);
const cashErrorMsg = ref("");

const snack = ref({ show: false, text: "" });
const allSellable = ref([]);

/** detalle */
const detailsOpen = ref(false);
const detailsItem = ref(null);

/** Cliente rápido */
const customer = ref({
  first_name: "",
  last_name: "",
  whatsapp: "",
  email: "",
});

const branchName = computed(() => {
  const u = auth?.user || {};
  return u?.branch?.name || u?.branch_name || null;
});

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function qty3(n) {
  return Number(n || 0).toFixed(3);
}
function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/* =========================
   ✅ IMÁGENES (vía store que ya funciona)
========================= */
const imageById = ref({}); // { [id]: url | "" }
const imgLoading = ref({}); // { [id]: true }

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

function pickImageFromProduct(p) {
  const direct =
    p?.image_url ||
    p?.image ||
    p?.thumb_url ||
    p?.thumbnail_url ||
    p?.public_url ||
    p?.publicUrl ||
    null;

  if (direct) return normalizeUrl(direct);

  const arr =
    Array.isArray(p?.images) ? p.images :
    Array.isArray(p?.product_images) ? p.product_images :
    null;

  if (arr?.length) {
    const u = pickUrlFromImageRow(arr[0]);
    if (u) return normalizeUrl(u);
  }

  return "";
}

async function fetchFirstImageViaStore(productId) {
  const id = Number(productId || 0);
  if (!id) return "";

  if (imageById.value[id] !== undefined) return imageById.value[id] || "";
  if (imgLoading.value[id]) return "";

  imgLoading.value = { ...imgLoading.value, [id]: true };

  try {
    const imgs = await products.fetchImages(id);
    const arr = Array.isArray(imgs) ? imgs : [];
    const u = pickUrlFromImageRow(arr[0] || null);
    const finalUrl = u ? normalizeUrl(u) : "";

    imageById.value = { ...imageById.value, [id]: finalUrl };
    return finalUrl;
  } catch {
    imageById.value = { ...imageById.value, [id]: "" };
    return "";
  } finally {
    const next = { ...imgLoading.value };
    delete next[id];
    imgLoading.value = next;
  }
}

function productImage(p) {
  const id = Number(p?.id || 0);
  if (!id) return "";

  const fromObj = pickImageFromProduct(p);
  if (fromObj) {
    if (imageById.value[id] !== fromObj) imageById.value = { ...imageById.value, [id]: fromObj };
    return fromObj;
  }

  if (imageById.value[id] !== undefined) return imageById.value[id] || "";

  fetchFirstImageViaStore(id);
  return "";
}

async function prefetchImagesForVisible(items) {
  const ids = (items || [])
    .map((x) => Number(x?.id || 0))
    .filter((x) => x > 0 && imageById.value[x] === undefined);

  await Promise.all(ids.slice(0, 24).map((id) => fetchFirstImageViaStore(id)));
}

/* =========================
   ✅ CATEGORÍAS (FIX REAL)
   - Soporta productos con category_id = rubro (padre)
   - Soporta productos con category_id = subrubro (hijo con parent_id)
========================= */
const categories = ref([]);

const catById = computed(() => {
  const m = new Map();
  for (const c of categories.value || []) m.set(Number(c.id), c);
  return m;
});

function getCatIdFromProduct(p) {
  return (
    Number(p?.category_id || 0) ||
    Number(p?.subcategory_id || 0) ||
    Number(p?.category?.id || 0) ||
    null
  );
}

/**
 * Devuelve la dupla rubro/subrubro en forma segura:
 * - Si category es HIJO (tiene parent_id) => rubroId=parent_id, subId=cat.id
 * - Si category es PADRE (no parent_id)   => rubroId=cat.id, subId=null
 */
function deriveRubroSub(p) {
  const cid = getCatIdFromProduct(p);
  if (!cid) return { rubroId: null, subId: null };

  const c = catById.value.get(Number(cid)) || null;
  if (!c) return { rubroId: null, subId: null };

  const pid = Number(c.parent_id || c.parentId || c.parent?.id || 0) || null;

  // si tiene padre => el producto está en un subrubro
  if (pid) return { rubroId: pid, subId: Number(c.id) };

  // si no tiene padre => el producto está asignado directo al rubro
  return { rubroId: Number(c.id), subId: null };
}

function rubroName(p) {
  // si backend ya lo manda resuelto:
  if (p?.parent_category_name) return p.parent_category_name;

  const { rubroId } = deriveRubroSub(p);
  if (!rubroId) return null;
  return catById.value.get(Number(rubroId))?.name || null;
}

function subrubroName(p) {
  // si backend ya lo manda resuelto:
  if (p?.subcategory_name) return p.subcategory_name;

  const { subId } = deriveRubroSub(p);
  if (!subId) return null;
  return catById.value.get(Number(subId))?.name || null;
}

async function loadCategoriesSafe() {
  // probamos ambas rutas por si tu API quedó con prefijos
  const candidates = [
    { url: "/categories", params: { limit: 5000 } },
    { url: "/api/v1/categories", params: { limit: 5000 } },
    { url: "/products/categories", params: undefined },
    { url: "/api/v1/products/categories", params: undefined },
  ];

  for (const c of candidates) {
    try {
      const { data } = await http.get(c.url, c.params ? { params: c.params } : undefined);
      const arr = data?.data || data || [];
      categories.value = Array.isArray(arr) ? arr : [];
      if (categories.value.length) return;
    } catch {}
  }

  categories.value = [];
}

const rubroItems = computed(() => {
  const map = new Map();

  for (const p of allSellable.value || []) {
    const d = deriveRubroSub(p);
    if (!d.rubroId) continue;

    const name = catById.value.get(Number(d.rubroId))?.name;
    if (!name) continue;

    if (!map.has(d.rubroId)) map.set(d.rubroId, { title: String(name), value: Number(d.rubroId) });
  }

  return Array.from(map.values()).sort((a, b) => String(a.title).localeCompare(String(b.title)));
});

const subrubroItems = computed(() => {
  const rid = Number(rubroId.value || 0);
  if (!rid) return [];

  const map = new Map();

  for (const p of allSellable.value || []) {
    const d = deriveRubroSub(p);

    // solo subrubros del rubro elegido
    if (Number(d.rubroId || 0) !== rid) continue;

    if (!d.subId) continue; // si el producto está directo al rubro, no aporta subrubro

    const name = catById.value.get(Number(d.subId))?.name;
    if (!name) continue;

    if (!map.has(d.subId)) map.set(d.subId, { title: String(name), value: Number(d.subId) });
  }

  return Array.from(map.values()).sort((a, b) => String(a.title).localeCompare(String(a.title)));
});

function onRubroChange() {
  subrubroId.value = null;
  page.value = 1;
}


/* =========================
   ✅ PRECIOS / SELLABLE
========================= */
function resolveUnitPrice(p, policy) {
  const base = toNum(p?.price);
  const list = toNum(p?.price_list);
  const disc = toNum(p?.price_discount);
  const res = toNum(p?.price_reseller);

  if (policy === "RESELLER") return res > 0 ? res : (disc > 0 ? disc : (list > 0 ? list : base));
  if (policy === "DISCOUNT") return disc > 0 ? disc : (list > 0 ? list : base);
  return list > 0 ? list : base;
}

function pricePolicyLabel(policy) {
  if (policy === "RESELLER") return "Revendedor";
  if (policy === "DISCOUNT") return "Descuento";
  return "Lista";
}

function hasStock(p) { return toNum(p?.qty) > 0; }
function hasAnyPrice(p) {
  return (
    toNum(p?.price) > 0 ||
    toNum(p?.price_list) > 0 ||
    toNum(p?.price_discount) > 0 ||
    toNum(p?.price_reseller) > 0
  );
}
function isSellable(p) {
  if (p?.is_active === false) return false;
  return hasStock(p) && hasAnyPrice(p);
}

/* =========================
   ✅ FILTRO + PAGINACIÓN
========================= */
const filteredItems = computed(() => {
  const qq = String(q.value || "").trim().toLowerCase();

  return (allSellable.value || []).filter((p) => {
    if (!isSellable(p)) return false;

if (rubroId.value) {
  if (Number(productRubroId(p) || 0) !== Number(rubroId.value)) return false;
}
if (subrubroId.value) {
  if (Number(productSubId(p) || 0) !== Number(subrubroId.value)) return false;
}

    if (qq) {
      const hay =
        String(p?.name || "").toLowerCase().includes(qq) ||
        String(p?.sku || "").toLowerCase().includes(qq) ||
        String(p?.code || "").toLowerCase().includes(qq) ||
        String(p?.barcode || "").toLowerCase().includes(qq) ||
        String(p?.brand || "").toLowerCase().includes(qq) ||
        String(p?.model || "").toLowerCase().includes(qq) ||
        String(rubroName(p) || "").toLowerCase().includes(qq) ||
        String(subrubroName(p) || "").toLowerCase().includes(qq);

      if (!hay) return false;
    }

    return true;
  });
});

const filteredTotal = computed(() => Number(filteredItems.value.length || 0));

const pages = computed(() => {
  const t = filteredTotal.value;
  const l = Number(limit.value || 24);
  return Math.max(1, Math.ceil(t / l));
});

const pagedItems = computed(() => {
  const l = Number(limit.value || 24);
  const start = (Number(page.value || 1) - 1) * l;
  const end = start + l;
  return filteredItems.value.slice(start, end);
});

watch(() => [page.value, filteredTotal.value], async () => {
  await prefetchImagesForVisible(pagedItems.value);
});

function debounceSearch() {
  clearTimeout(tSearch);
  tSearch = setTimeout(() => { page.value = 1; }, 250);
}
function doSearch() { page.value = 1; }
function clearSearch() { q.value = ""; page.value = 1; }
function prevPage() { if (page.value > 1) page.value--; }
function nextPage() { if (page.value < pages.value) page.value++; }

/* =========================
   ✅ DETALLE / ADD
========================= */
function openDetails(p) {
  detailsItem.value = p || null;
  detailsOpen.value = true;
}

function add(p) {
  if (!isSellable(p)) {
    snack.value = { show: true, text: "❌ No vendible (sin stock o sin precio)" };
    return;
  }

  const unit = resolveUnitPrice(p, "LIST");
  if (unit <= 0) {
    snack.value = { show: true, text: "⚠️ Producto sin precio" };
    return;
  }

  posStore.addToCart({
    ...p,
    product_id: p.id,
    image: productImage(p),
    available_qty: toNum(p.qty),

    price: unit,
    price_label: "Lista",

    price_list: toNum(p.price_list),
    price_discount: toNum(p.price_discount),
    price_reseller: toNum(p.price_reseller),
  });

  snack.value = { show: true, text: "✅ Agregado al carrito" };
}

/* =========================
   ✅ CONTEXTO POS + FETCH
========================= */
async function hardSyncPosContextWithAuth() {
  try { if (typeof auth.fetchMe === "function") await auth.fetchMe(); } catch {}

  const authBranch = Number(auth.branchId || 0) || null;
  const posBranch = Number(posStore.branch_id || 0) || null;

  if (!authBranch) {
    await posStore.ensureContext?.({ force: true });
    return;
  }

  if (authBranch !== posBranch) {
    posStore.resetContext?.();
    posStore.setBranch?.(authBranch);
    await posStore.ensureContext?.({ force: true });
    return;
  }

  if (!Number(posStore.warehouse_id || 0)) {
    await posStore.ensureContext?.({ force: true });
  } else {
    await posStore.ensureContext?.();
  }
}

async function fetchSellablePool() {
  loadingList.value = true;
  try {
    ctxError.value = "";
    await hardSyncPosContextWithAuth();

    const params = {
      q: "",
      page: 1,
      limit: 5000,
      in_stock: 1,
      sellable: 1,
      warehouse_id: posStore.warehouse_id || undefined,
    };

    const { data } = await http.get("/pos/products", { params });
    const out = data?.data || [];

    const arr = Array.isArray(out) ? out : [];
    allSellable.value = arr.filter((p) => isSellable(p));

    if (page.value > pages.value) page.value = 1;

    await prefetchImagesForVisible(pagedItems.value);
  } catch (e) {
    const msg = e?.response?.data?.message || e?.message || "Error cargando productos";
    ctxError.value = msg;
    snack.value = { show: true, text: msg };
  } finally {
    loadingList.value = false;
  }
}

function refresh() { fetchSellablePool(); }

/* =========================
   ✅ CHECKOUT (FIX PERFORMANCE)
========================= */
const productById = computed(() => {
  const m = new Map();
  for (const p of allSellable.value || []) m.set(Number(p.id), p);
  return m;
});

function currentPricePolicy() {
  if (applyReseller.value) return "RESELLER";

  if (paymentMethod.value === "CARD") {
    return Number(installments.value || 1) > 1 ? "LIST" : "DISCOUNT";
  }

  if (paymentMethod.value === "CASH" || paymentMethod.value === "TRANSFER" || paymentMethod.value === "QR") {
    return "DISCOUNT";
  }

  return "DISCOUNT";
}

const checkoutPriceHint = computed(() => {
  const pol = currentPricePolicy();
  if (pol === "RESELLER") return "Se cobrará con precio REVENDEDOR (si existe).";
  if (pol === "LIST") return "Se cobrará con precio LISTA (cuotas).";
  return "Se cobrará con precio DESCUENTO (1 pago).";
});

const checkoutTotal = computed(() => {
  const pol = currentPricePolicy();
  let sum = 0;

  for (const it of posStore.cart || []) {
    const pid = Number(it.product_id || it.id);
    const p = productById.value.get(pid) || it; // ✅ O(1), no find(5000)
    const unit = resolveUnitPrice(p, pol);
    sum += unit * toNum(it.qty);
  }

  return sum;
});

const checkoutTotalPreview = computed(() => {
  let sum = 0;
  for (const it of posStore.cart || []) sum += toNum(it.qty) * toNum(it.price);
  return sum;
});

function openCheckout() {
  paymentMethod.value = "CASH";
  installments.value = 1;
  applyReseller.value = false;
  paymentProof.value = "";
  cashInput.value = "";
  cashError.value = false;
  cashErrorMsg.value = "";
  checkoutDialog.value = true;
}

function parseCash(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const paidAmount = computed(() => {
  if (paymentMethod.value !== "CASH") return Number(checkoutTotal.value || 0);
  return parseCash(cashInput.value);
});

const cannotConfirm = computed(() => {
  if (posStore.loading) return true;
  if ((posStore.cart || []).length === 0) return true;

  if (paymentMethod.value === "CASH") {
    const totalAmt = Number(checkoutTotal.value || 0);
    if (!cashInput.value) return true;
    return paidAmount.value < totalAmt;
  }

  return false;
});

watch([paymentMethod, installments, applyReseller, cashInput], () => {
  if (paymentMethod.value !== "CASH") {
    cashError.value = false;
    cashErrorMsg.value = "";
    return;
  }

  const totalAmt = Number(checkoutTotal.value || 0);
  const paid = paidAmount.value;

  if (!cashInput.value) {
    cashError.value = true;
    cashErrorMsg.value = "Ingresá el efectivo recibido.";
    return;
  }

  if (paid < totalAmt) {
    cashError.value = true;
    cashErrorMsg.value = `El efectivo es menor al total (${money(totalAmt)}).`;
    return;
  }

  cashError.value = false;
  cashErrorMsg.value = "";
});

function applyCheckoutPricesIntoStore() {
  const pol = currentPricePolicy();

  for (const it of posStore.cart || []) {
    const pid = Number(it.product_id || it.id);
    const p = productById.value.get(pid) || it;

    const unit = resolveUnitPrice(p, pol);

    it.price = unit;
    it.price_label = pricePolicyLabel(pol);
    it.subtotal = unit * toNum(it.qty);
  }
}

async function confirmPayment() {
  try {
    applyCheckoutPricesIntoStore();

    const extra = {
      price_policy: currentPricePolicy(),
      installments: Number(installments.value || 1),
      proof: paymentProof.value || null,
      customer: { ...customer.value },
    };

    await posStore.checkoutSale(paymentMethod.value, extra);

    checkoutDialog.value = false;
    snack.value = { show: true, text: "✅ Venta registrada correctamente" };
    fetchSellablePool();
  } catch (e) {
    snack.value = {
      show: true,
      text: posStore.error || e?.response?.data?.message || "❌ Error al confirmar la venta",
    };
  }
}

onMounted(async () => {
  await loadCategoriesSafe();
  await fetchSellablePool();
});
</script>

<style scoped>
.pos-wrap {
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
  min-height: calc(100vh - 24px);
  padding: 16px;
}

.pos-grid { align-items: flex-start; }
.pos-left, .pos-right { display: flex; flex-direction: column; }

.pos-surface {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
}

.pos-surface, .cart-item, .empty, .badge-sku, .border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.pos-left { min-height: calc(100vh - 110px); }

.pos-products {
  flex: 1 1 auto;
  min-height: 0;
  border-radius: 16px;
  padding: 12px;
  max-height: calc(100vh - 190px);
  overflow: auto;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.04);
  scrollbar-gutter: stable;
}

.pos-toolbar { position: sticky; top: 12px; z-index: 2; }

.product-card { overflow: hidden; transition: transform 0.15s ease, box-shadow 0.15s ease; }
.product-card:hover { transform: translateY(-2px); }

.thumb-wrap { height: 140px; position: relative; background: rgb(var(--v-theme-surface)); }
.thumb { height: 140px; }
.thumb-empty {
  display: flex; align-items: center; justify-content: center;
  height: 140px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.badge-sku {
  position: absolute; left: 10px; bottom: 10px;
  font-size: 11px; padding: 4px 10px; border-radius: 999px;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(4px);
}

.badge-stock {
  position: absolute; right: 10px; bottom: 10px;
  font-size: 11px; padding: 4px 10px; border-radius: 999px;
  background: rgba(var(--v-theme-surface), 0.92);
  backdrop-filter: blur(4px);
  opacity: 0.92;
}
.badge-stock-ok { font-weight: 900; }

.title { font-weight: 900; font-size: 13px; line-height: 1.2; min-height: 32px; }
.meta { font-size: 11px; color: rgba(var(--v-theme-on-surface), 0.66); margin-top: 6px; }
.meta .muted { color: rgba(var(--v-theme-on-surface), 0.5); }
.meta .dot { margin: 0 6px; opacity: 0.5; }
.price-row .price { font-weight: 950; font-size: 16px; }

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.btn-pad { min-height: 38px; }
.btn-icon { min-width: 42px; }

/* Carrito */
.cart-card {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
  height: calc(100vh - 110px);
  max-height: calc(100vh - 110px);
}

.cart-head { flex: 0 0 auto; }
.cart-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding-bottom: 14px;
  scrollbar-gutter: stable;
}

.cart-foot {
  flex: 0 0 auto;
  z-index: 2;
  box-shadow: 0 -8px 18px rgba(0, 0, 0, 0.06);
}

.cart-foot .v-btn { min-height: 44px; }

.cart-item { background: rgba(var(--v-theme-surface), 0.9); }
.cart-title { font-weight: 900; font-size: 13px; line-height: 1.2; }
.border { border-radius: 10px; }

.empty {
  border-style: dashed;
  border-radius: 14px;
  padding: 18px;
  text-align: center;
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.totals .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 6px 0;
}

.totals .row.total {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.muted { color: rgba(var(--v-theme-on-surface), 0.62); }
.cart-actions { flex-wrap: nowrap; }
.cart-actions > .v-btn { flex: 1 1 0; min-width: 0; }
.cart-foot .v-btn.v-btn--block { width: auto !important; }

@media (max-width: 960px) {
  .pos-wrap { padding: 10px; }
  .pos-toolbar { position: relative; top: auto; }
  .pos-left { min-height: auto; }
  .pos-products { max-height: none; overflow: visible; padding: 10px; }
  .cart-card { position: relative; top: auto; height: auto; max-height: none; }
  .cart-body { min-height: auto; overflow: visible; }
  .cart-foot { box-shadow: none; }
}
</style>
