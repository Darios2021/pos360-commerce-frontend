<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/pages/PosPage.vue -->

<template>
  <v-container fluid class="pos-root">
    <!-- ================= HEADER ================= -->
    <div class="pos-header">
      <div class="pos-top d-flex align-center justify-space-between flex-wrap ga-3">
        <div>
          <div class="text-h5 font-weight-bold">Punto de Venta</div>
          <div class="text-caption text-medium-emphasis">
            Productos · Carrito · Cobro
          </div>

          <div class="d-flex flex-wrap ga-2 mt-2">
            <v-chip size="small" variant="tonal" color="primary">
              Sucursal:
              {{ branchName || `Sucursal #${posStore?.branch_id ?? "—"}` }}
            </v-chip>

            <v-chip size="small" variant="tonal" color="primary">
              Productos listos para vender: {{ filteredTotal }}
            </v-chip>

            <v-chip
              v-if="isAdmin"
              size="small"
              variant="tonal"
              color="amber-darken-2"
            >
              Admin: solo vista (no puede vender)
            </v-chip>

            <v-chip size="small" variant="tonal" color="grey-lighten-3">
              F1 Ayuda · F2 Buscar · F8 Cobrar · PgUp/PgDn
            </v-chip>
          </div>

          <!-- Cajero -->
          <div class="pos-cashier mt-2">
            <v-icon size="16">mdi-account-badge</v-icon>
            <span class="pos-cashier-txt">
              Cajero: <b>{{ cashierName }}</b>
            </span>
            <span class="pos-dot">·</span>
            <v-icon size="16">mdi-clock-outline</v-icon>
            <span class="pos-cashier-txt">
              Inicio caja: <b>{{ shiftStartText }}</b>
            </span>
          </div>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="tonal" @click="refresh" :loading="loadingList">
            <v-icon start>mdi-refresh</v-icon>
            Actualizar
          </v-btn>

          <v-btn variant="tonal" @click="helpOpen = true">
            <v-icon start>mdi-help-circle-outline</v-icon>
            Ayuda
          </v-btn>

          <v-btn
            color="primary"
            @click="openCheckout"
            :disabled="(posStore.cart || []).length === 0 || !canSell"
          >
            <v-icon start>mdi-cash-register</v-icon>
            Cobrar
          </v-btn>
        </div>
      </div>
    </div>

    <!-- ================= BODY ================= -->
    <div class="pos-body">
      <v-row dense>
        <!-- LEFT ================= PRODUCTOS -->
        <v-col cols="12" md="8">
          <!-- Filtros -->
          <v-card class="rounded-xl pos-toolbar" elevation="1">
            <v-card-text class="py-3">
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-text-field
                    ref="searchRef"
                    v-model="q"
                    label="Buscar productos"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    @keyup.enter="doSearch"
                    @click:clear="clearSearch"
                    @update:model-value="debounceSearch"
                  />
                </v-col>

                <v-col cols="12" md="3">
                  <v-select
                    v-model="rubroId"
                    :items="rubroItems"
                    item-title="title"
                    item-value="value"
                    label="Rubro"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    @update:model-value="onRubroChange"
                  />
                </v-col>

                <v-col cols="12" md="3">
                  <v-select
                    v-model="subrubroId"
                    :items="subrubroItems"
                    item-title="title"
                    item-value="value"
                    label="Subrubro"
                    variant="outlined"
                    density="compact"
                    hide-details
                    clearable
                    :disabled="!rubroId"
                  />
                </v-col>
              </v-row>

              <div class="d-flex justify-space-between mt-2">
                <div class="text-caption text-medium-emphasis">
                  Mostrando {{ pagedItems.length }} de {{ filteredTotal }}
                </div>

                <div class="d-flex ga-2">
                  <v-btn
                    size="small"
                    variant="tonal"
                    @click="prevPage"
                    :disabled="page <= 1"
                  >
                    <v-icon start>mdi-chevron-left</v-icon>
                    Anterior
                  </v-btn>

                  <v-btn
                    size="small"
                    variant="tonal"
                    @click="nextPage"
                    :disabled="page >= pages"
                  >
                    Siguiente
                    <v-icon end>mdi-chevron-right</v-icon>
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- LISTA COMPACTA -->
          <div class="pos-products mt-3">
            <div v-if="loadingList" class="d-flex justify-center align-center py-12">
              <v-progress-circular indeterminate />
            </div>

            <div v-else class="pos-list">
              <PosProductRow
                v-for="p in pagedItems"
                :key="p.id"
                :item="p"
                :image="productImage(p)"
                :name="p.name"
                :sku="p.sku || p.code"
                :stkLabel="`STK ${Number(p.qty || 0)}`"
                :offLabel="
                  resolveUnitPrice(p, 'LIST') >
                  resolveUnitPrice(p, 'DISCOUNT')
                    ? `${Math.round(
                        (1 -
                          resolveUnitPrice(p, 'DISCOUNT') /
                            resolveUnitPrice(p, 'LIST')) *
                          100
                      )}% OFF`
                    : ''
                "
                :rubro-label="rubroName(p) || ''"
                :subrubro-label="subrubroName(p) || ''"
                :price-discount="resolveUnitPrice(p, 'DISCOUNT')"
                :price-list="resolveUnitPrice(p, 'LIST')"
                :disabled="!canSell"
                @add="add"
                @details="openDetails"
              />
            </div>

            <div
              v-if="!loadingList && pagedItems.length === 0"
              class="text-center py-12 text-medium-emphasis"
            >
              <v-icon size="56" class="mb-2">
                mdi-text-box-search-outline
              </v-icon>
              <div class="text-h6">
                No se encontraron productos listos para vender
              </div>
            </div>
          </div>
        </v-col>

        <!-- RIGHT ================= CARRITO (COMPONENTE) -->
        <v-col cols="12" md="4">
          <PosCartPanel
            :cart="posStore.cart"
            :total-items="posStore.totalItems"
            :total="checkoutTotalPreview"
            :can-edit="canSell"
            :pos-store="posStore"
            @checkout="openCheckout"
          />
        </v-col>
      </v-row>
    </div>

    <!-- ================= DIALOGS ================= -->
    <PosProductDetailsDialog
      v-model:open="detailsOpen"
      :item="detailsItem"
      :image="detailsItem ? productImage(detailsItem) : ''"
      @add="addFromDetails"
    />

    <CheckoutDialog
      v-model:open="checkoutDialog"
      :total="checkoutTotal"
      :cart="posStore.cart"
      @confirm="confirmPayment"
    />

    <ReceiptDialog
      v-model:open="receiptOpen"
      :sale="receiptSale"
      :company-name="receiptCompanyName"
      :branch-name="branchName || ''"
    />

    <v-snackbar v-model="snack.show" :timeout="3200">
      {{ snack.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount, nextTick } from "vue";
import http from "../../../app/api/http";
import { usePosStore } from "../../../app/store/pos.store";
import { useAuthStore } from "../../../app/store/auth.store";
import { useProductsStore } from "../../../app/store/products.store";

import PosProductRow from "../components/PosProductRow.vue";
import CheckoutDialog from "../components/CheckoutDialog.vue";
import PosProductDetailsDialog from "../components/PosProductDetailsDialog.vue";
import ReceiptDialog from "../components/ReceiptDialog.vue";
import PosCartPanel from "../components/PosCartPanel.vue"; // ✅ NUEVO

const posStore = usePosStore();
const auth = useAuthStore();
const products = useProductsStore();

/* =========================
   UI
========================= */
const ctxError = ref("");
const q = ref("");
const page = ref(1);
const limit = ref(48);
const rubroId = ref(null);
const subrubroId = ref(null);
const loadingList = ref(false);
let tSearch = null;

const helpOpen = ref(false);
const searchRef = ref(null);

const snack = ref({ show: false, text: "" });

/* cliente */
const customer = ref({ first_name: "", last_name: "", whatsapp: "", email: "" });

/* caja/cajero */
const shiftStart = ref(new Date());
const cashierName = computed(() => auth?.user?.name || auth?.user?.full_name || auth?.user?.email || "—");
const shiftStartText = computed(() => {
  const d = shiftStart.value || new Date();
  return new Date(d).toLocaleString("es-AR", { hour: "2-digit", minute: "2-digit" });
});

/* roles */
const roles = computed(() => {
  const arr = auth?.user?.roles;
  return Array.isArray(arr) ? arr.map((x) => String(x).toLowerCase().trim()) : [];
});
const isAdmin = computed(() => roles.value.includes("admin") || roles.value.includes("super_admin"));
const canSell = computed(() => !roles.value.includes("admin"));

/* sucursal */
const branchName = computed(() => {
  const u = auth?.user || {};
  const bid = Number(u?.branch_id || 0) || null;
  const bs = Array.isArray(u?.branches) ? u.branches : [];
  const found = bid ? bs.find((b) => Number(b?.id) === bid) : null;
  return found?.name || null;
});

/* helpers */
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
   Categories
========================= */
const categories = ref([]);
const catById = computed(() => {
  const m = new Map();
  for (const c of categories.value || []) m.set(Number(c.id), c);
  return m;
});

function getCatIdFromProduct(p) {
  return Number(p?.category_id || 0) || Number(p?.subcategory_id || 0) || Number(p?.category?.id || 0) || null;
}

function deriveRubroSub(p) {
  const cid = getCatIdFromProduct(p);
  if (!cid) return { rubroId: null, subId: null };

  const c = catById.value.get(Number(cid)) || null;
  if (!c) return { rubroId: null, subId: null };

  const pid = Number(c.parent_id || c.parentId || c.parent?.id || 0) || null;
  if (pid) return { rubroId: pid, subId: Number(c.id) };
  return { rubroId: Number(c.id), subId: null };
}

function productRubroId(p) {
  return deriveRubroSub(p).rubroId;
}
function productSubId(p) {
  return deriveRubroSub(p).subId;
}
function rubroName(p) {
  const { rubroId } = deriveRubroSub(p);
  if (!rubroId) return null;
  return catById.value.get(Number(rubroId))?.name || null;
}
function subrubroName(p) {
  const { subId } = deriveRubroSub(p);
  if (!subId) return null;
  return catById.value.get(Number(subId))?.name || null;
}

async function loadCategoriesSafe() {
  const candidates = [
    { url: "/categories", params: { limit: 5000 } },
    { url: "/categories", params: { page: 1, limit: 5000 } },
  ];

  for (const c of candidates) {
    try {
      const { data } = await http.get(c.url, c.params ? { params: c.params } : undefined);
      const arr = data?.data?.items || data?.items || data?.data || data || [];
      categories.value = Array.isArray(arr) ? arr : [];
      if (categories.value.length) return;
    } catch {}
  }
  categories.value = [];
}

const allSellable = ref([]); // ✅ definido antes porque rubroItems lo usa

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
  const arr = (categories.value || []).filter((c) => Number(c?.parent_id || 0) === rid);
  return arr
    .map((c) => ({ title: String(c?.name || "—"), value: Number(c?.id) }))
    .sort((a, b) => String(a.title).localeCompare(String(b.title)));
});

function onRubroChange() {
  subrubroId.value = null;
  page.value = 1;
}

/* =========================
   Images
========================= */
const imageById = ref({});
const imgLoading = ref({});

function pickUrlFromImageRow(row) {
  if (!row) return "";
  return row.url || row.public_url || row.publicUrl || row.image_url || row.path || row.key || row.location || row.filename || "";
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
    p?.main_image_url ||
    p?.image_url ||
    p?.image ||
    p?.thumb_url ||
    p?.thumbnail_url ||
    p?.public_url ||
    p?.publicUrl ||
    null;
  if (direct) return normalizeUrl(direct);

  const arr = Array.isArray(p?.images) ? p.images : Array.isArray(p?.product_images) ? p.product_images : null;
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

  await Promise.all(ids.slice(0, 48).map((id) => fetchFirstImageViaStore(id)));
}

/* =========================
   Products / pricing
========================= */
function resolveUnitPrice(p, policy) {
  const base = toNum(p?.price);
  const list = toNum(p?.price_list);
  const disc = toNum(p?.price_discount);
  const res = toNum(p?.price_reseller);

  if (policy === "RESELLER") return res > 0 ? res : disc > 0 ? disc : list > 0 ? list : base;
  if (policy === "DISCOUNT") return disc > 0 ? disc : list > 0 ? list : base;
  return list > 0 ? list : base;
}

function hasStock(p) {
  return toNum(p?.qty) > 0;
}
function hasAnyPrice(p) {
  return (
    toNum(p?.price) > 0 ||
    toNum(p?.price_list) > 0 ||
    toNum(p?.price_discount) > 0 ||
    toNum(p?.price_reseller) > 0 ||
    toNum(p?.effective_price) > 0
  );
}
function isSellable(p) {
  if (p?.is_active === false) return false;
  return hasStock(p) && hasAnyPrice(p);
}

/* filter + pagination */
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
        String(p?.model || "").toLowerCase().includes(qq);

      if (!hay) return false;
    }

    return true;
  });
});
const filteredTotal = computed(() => Number(filteredItems.value.length || 0));

const pages = computed(() => {
  const t = filteredTotal.value;
  const l = Number(limit.value || 48);
  return Math.max(1, Math.ceil(t / l));
});

const pagedItems = computed(() => {
  const l = Number(limit.value || 48);
  const start = (Number(page.value || 1) - 1) * l;
  const end = start + l;
  return filteredItems.value.slice(start, end);
});

watch(
  () => [page.value, filteredTotal.value],
  async () => {
    await prefetchImagesForVisible(pagedItems.value);
  }
);

function debounceSearch() {
  clearTimeout(tSearch);
  tSearch = setTimeout(() => {
    page.value = 1;
  }, 200);
}
function doSearch() {
  page.value = 1;
}
function clearSearch() {
  q.value = "";
  page.value = 1;
}
function prevPage() {
  if (page.value > 1) page.value--;
}
function nextPage() {
  if (page.value < pages.value) page.value++;
}

/* =========================
   Details + Add
========================= */
const detailsOpen = ref(false);
const detailsItem = ref(null);

function openDetails(p) {
  detailsItem.value = p || null;
  detailsOpen.value = true;
}

function add(p) {
  if (!canSell.value) {
    snack.value = { show: true, text: "🔒 El usuario admin puede ver, pero NO puede vender." };
    return;
  }

  if (!isSellable(p)) {
    snack.value = { show: true, text: "❌ No vendible (sin stock o sin precio)" };
    return;
  }

  const unit = resolveUnitPrice(p, "DISCOUNT");
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
    price_label: "Descuento",
    price_list: toNum(p.price_list),
    price_discount: toNum(p.price_discount),
    price_reseller: toNum(p.price_reseller),
    effective_price: toNum(p.effective_price),
  });

  snack.value = { show: true, text: "✅ Agregado al carrito" };
}

function pricePolicyLabel(policy) {
  if (policy === "RESELLER") return "Revendedor";
  if (policy === "LIST") return "Lista";
  return "Descuento";
}

function addFromDetails(payload) {
  const p = detailsItem.value;
  if (!p) return;

  if (!canSell.value) {
    snack.value = { show: true, text: "🔒 El usuario admin puede ver, pero NO puede vender." };
    return;
  }

  const pol = payload?.price_policy || "DISCOUNT";
  const unit = Number(payload?.unit_price || 0);

  if (!(unit > 0)) {
    snack.value = { show: true, text: "⚠️ No se pudo calcular precio" };
    return;
  }

  posStore.addToCart({
    ...p,
    product_id: p.id,
    image: productImage(p),
    available_qty: toNum(p.qty),
    price: unit,
    price_label: payload?.price_label || pricePolicyLabel(pol),
    price_list: toNum(p.price_list),
    price_discount: toNum(p.price_discount),
    price_reseller: toNum(p.price_reseller),
    effective_price: toNum(p.effective_price),
    chosen_payment_method: payload?.paymentMethod || null,
    chosen_installments: Number(payload?.installments || 1),
    chosen_price_policy: pol,
  });

  detailsOpen.value = false;
  snack.value = { show: true, text: "✅ Agregado al carrito (según método elegido)" };
}

/* =========================
   Checkout
========================= */
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

const productById = computed(() => {
  const m = new Map();
  for (const p of allSellable.value || []) m.set(Number(p.id), p);
  return m;
});

function currentPricePolicy() {
  if (applyReseller.value) return "RESELLER";
  if (paymentMethod.value === "CARD") return Number(installments.value || 1) > 1 ? "LIST" : "DISCOUNT";
  if (paymentMethod.value === "CASH" || paymentMethod.value === "TRANSFER" || paymentMethod.value === "QR") return "DISCOUNT";
  return "DISCOUNT";
}

const checkoutPriceHint = computed(() => {
  const pol = currentPricePolicy();
  if (pol === "RESELLER") return "Se cobrará con precio REVENDEDOR (si existe).";
  if (pol === "LIST") return `Se cobrará con precio LISTA (${installments.value} cuotas).`;
  return "Se cobrará con precio DESCUENTO (1 pago).";
});

const checkoutTotal = computed(() => {
  const pol = currentPricePolicy();
  let sum = 0;
  for (const it of posStore.cart || []) {
    const pid = Number(it.product_id || it.id);
    const p = productById.value.get(pid) || it;
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
  if (!canSell.value) {
    snack.value = { show: true, text: "🔒 Admin: no se puede abrir cobro / registrar ventas." };
    return;
  }
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

/* =========================
   Receipt
========================= */
const receiptOpen = ref(false);
const receiptSale = ref(null);
const receiptCompanyName = ref("POS360");
const receiptCompanyTagline = ref("Inventario · Ecommerce · POS");
const receiptBranchAddress = ref("");

async function confirmPayment() {
  if (!canSell.value) {
    snack.value = { show: true, text: "🔒 Admin: no se puede confirmar ventas." };
    return;
  }

  try {
    applyCheckoutPricesIntoStore();

    const extra = {
      price_policy: currentPricePolicy(),
      installments: Number(installments.value || 1),
      proof: paymentProof.value || null,
      customer: { ...customer.value },
    };

    const result = await posStore.checkoutSale(paymentMethod.value, extra);

    checkoutDialog.value = false;
    snack.value = { show: true, text: "✅ Venta registrada correctamente" };

    const sale = result?.sale || result?.data?.sale || result?.data || result || null;
    receiptSale.value =
      sale && (sale.id || sale.number || sale.created_at || sale.items)
        ? sale
        : {
            id: Date.now(),
            created_at: new Date().toISOString(),
            payment_method: paymentMethod.value,
            installments: Number(installments.value || 1),
            proof: paymentProof.value || null,
            customer: { ...customer.value },
            subtotal: checkoutTotal.value,
            total: checkoutTotal.value,
            items: (posStore.cart || []).map((it) => ({
              name: it.name,
              qty: toNum(it.qty),
              unit_price: toNum(it.price),
              subtotal: toNum(it.subtotal),
              price_label: it.price_label || "",
            })),
          };

    receiptOpen.value = true;
    fetchSellablePool();
  } catch (e) {
    snack.value = { show: true, text: posStore.error || e?.response?.data?.message || "❌ Error al confirmar la venta" };
  }
}

/* =========================
   Context + fetch
========================= */
async function hardSyncPosContextWithAuth() {
  try {
    if (typeof auth.fetchMe === "function") await auth.fetchMe();
  } catch {}

  if (roles.value.includes("admin")) {
    if (typeof posStore.ensureContext === "function") {
      await posStore.ensureContext({ force: true, isAdmin: true });
    } else if (typeof posStore.resetContext === "function") {
      posStore.resetContext();
    }
    return;
  }

  const authBranch = Number(auth.branchId || 0) || null;
  const posBranch = Number(posStore.branch_id || 0) || null;

  if (!authBranch) {
    await posStore.ensureContext?.({ force: true, isAdmin: false });
    return;
  }

  if (authBranch !== posBranch) {
    posStore.resetContext?.();
    posStore.setBranch?.(authBranch);
    await posStore.ensureContext?.({ force: true, isAdmin: false });
    return;
  }

  if (!Number(posStore.warehouse_id || 0)) {
    await posStore.ensureContext?.({ force: true, isAdmin: false });
  } else {
    await posStore.ensureContext?.({ isAdmin: false });
  }
}

async function fetchSellablePool() {
  loadingList.value = true;
  try {
    ctxError.value = "";
    await hardSyncPosContextWithAuth();

    const bid = Number(posStore.branch_id || 0) || null;
    const wid = Number(posStore.warehouse_id || 0) || null;

    if (isAdmin.value) {
      const params = { q: "", page: 1, limit: 5000, in_stock: 1, sellable: 1, include_images: 1 };
      const { data } = await http.get("/pos/products", { params });
      const out = data?.data || data || [];
      allSellable.value = Array.isArray(out) ? out : [];
      if (page.value > pages.value) page.value = 1;
      await prefetchImagesForVisible(pagedItems.value);
      return;
    }

    if (!wid) {
      allSellable.value = [];
      ctxError.value = "Falta depósito (warehouse). Verificá que tu usuario tenga sucursal y depósito asignado.";
      return;
    }

    const params = {
      branch_id: bid || undefined,
      warehouse_id: wid,
      q: "",
      page: 1,
      limit: 5000,
      in_stock: 1,
      sellable: 1,
      include_images: 1,
    };

    const { data } = await http.get("/pos/products", { params });
    const out = data?.data || data || [];
    allSellable.value = Array.isArray(out) ? out : [];

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

function refresh() {
  fetchSellablePool();
}

/* =========================
   Hotkeys
========================= */
function isTypingTarget(e) {
  const el = e?.target;
  if (!el) return false;
  const tag = String(el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

async function focusSearch() {
  await nextTick();
  const comp = searchRef.value;
  const el = comp?.$el?.querySelector?.("input") || comp?.$el?.querySelector?.("textarea") || comp?.$el || null;
  if (el?.focus) el.focus();
}

function onKeydown(e) {
  if (isTypingTarget(e) && !["F1", "F2", "F8", "PageUp", "PageDown"].includes(e.code)) return;

  if (e.code === "F1") {
    e.preventDefault();
    helpOpen.value = true;
  }
  if (e.code === "F2") {
    e.preventDefault();
    focusSearch();
  }
  if (e.code === "F8") {
    e.preventDefault();
    openCheckout();
  }
  if (e.code === "PageUp") {
    e.preventDefault();
    prevPage();
  }
  if (e.code === "PageDown") {
    e.preventDefault();
    nextPage();
  }
}

/* =========================
   Lifecycle
========================= */
onMounted(async () => {
  document.body.classList.add("pos-noscroll");

  if (roles.value.includes("admin")) posStore.resetContext?.();
  shiftStart.value = new Date();
  window.addEventListener("keydown", onKeydown, { passive: false });
  await loadCategoriesSafe();
  await fetchSellablePool();
});

onBeforeUnmount(() => {
  document.body.classList.remove("pos-noscroll");
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.pos-root {
  height: 100vh;
  overflow: hidden;
  padding: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  color: rgb(var(--v-theme-on-background));
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

.pos-header {
  flex: 0 0 auto;
}

.pos-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.pos-toolbar {
  flex: 0 0 auto;
  position: sticky;
  top: 0;
  z-index: 2;
}

.pos-products {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  border-radius: 16px;
  padding: 8px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.10);
  scrollbar-gutter: stable;
}

.pos-cashier {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  width: fit-content;
}
.pos-cashier-txt {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.85);
}
.pos-dot {
  opacity: 0.55;
}

/* mobile */
@media (max-width: 960px) {
  .pos-root {
    height: auto;
    overflow: visible;
  }
  .pos-body,
  .pos-products {
    overflow: visible;
    height: auto;
  }
}
</style>