<!-- src/modules/shop/pages/ShopCheckout.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - Checkout ML + Stepper (componentizado)
     - Summary SOLO DESKTOP (evita duplicado en mobile)
     - Submit: SIEMPRE navega a /shop/checkout/success si no hay redirect http(s)
-->

<template>
  <v-container class="py-6">
    <div class="checkout-shell">
      <!-- Header -->
      <div class="d-flex align-center justify-space-between flex-wrap ga-2 mb-4">
        <div class="text-h5 font-weight-bold">Finalizar compra</div>

        <v-btn to="/shop/cart" variant="tonal">
          <v-icon start>mdi-arrow-left</v-icon>
          Volver al carrito
        </v-btn>
      </div>

      <v-row>
        <!-- LEFT -->
        <v-col cols="12" md="8">
          <CheckoutStepper
            :step="step"
            :buyer="buyer"
            :delivery="delivery"
            :payment="payment"
            :shipping-quote="shippingQuote"
            :pickup-branches="pickupBranches"
            :buyer-errors="buyerErrors"
            :can-quote-shipping="canQuoteShipping"
            :mp-enabled="mpEnabled"
            :transfer-info="transferInfo"
            :selected-branch-name="selectedBranchName"
            :payment-label="paymentLabel"
            :can-go-review="canGoReview"
            :can-go-payment="canGoPayment"
            :can-submit="canSubmit"
            :submitting="submitting"
            :submit-error="submitError"
            :items="items"
            :subtotal="subtotal"
            :shipping-amount="shippingAmount"
            :total="totalWithShipping"
            @update:buyer="buyer = $event"
            @update:delivery="delivery = $event"
            @update:payment="payment = $event"
            @quote-shipping="quoteShipping"
            @next-from-delivery="step = 2"
            @next-from-payment="step = 3"
            @prev="step = Math.max(1, step - 1)"
            @submit="submitOrder"
          />
        </v-col>

        <!-- RIGHT: Summary (SOLO DESKTOP para no duplicar en mobile) -->
        <v-col cols="12" md="4" class="d-none d-md-block">
          <CheckoutSummary
            :items="items"
            :subtotal="subtotal"
            :shipping-amount="shippingAmount"
            :total="totalWithShipping"
            :delivery-mode="delivery.mode"
          />
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

import CheckoutStepper from "@/modules/shop/components/checkout/CheckoutStepper.vue";
import CheckoutSummary from "@/modules/shop/components/checkout/CheckoutSummary.vue";

import { useShopCartStore } from "@/modules/shop/store/shopCart.store";
import { getBranches, getShopPaymentConfig } from "@/modules/shop/service/shop.public.api";
import httpPublic from "@/app/api/httpPublic";

// -------------------------
const router = useRouter();
const cart = useShopCartStore();

const step = ref(1);
const submitting = ref(false);
const submitError = ref("");

// -------------------------
// Items
const items = computed(() => cart.items || []);

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}

function unitPrice(p) {
  const d = Number(p?.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p?.price_list || 0);
  if (l > 0) return l;
  return Number(p?.price || 0);
}

const subtotal = computed(() =>
  (items.value || []).reduce((a, it) => a + unitPrice(it) * Number(it.qty || 0), 0)
);

// -------------------------
// Buyer
let buyer = ref({ name: "", email: "", phone: "", doc_number: "" });

function isEmail(v) {
  const s = String(v || "").trim().toLowerCase();
  return !!s && s.includes("@") && s.includes(".");
}
function cleanPhone(v) {
  return String(v || "").replace(/[^\d+]/g, "").trim();
}

const buyerErrors = computed(() => {
  const errs = [];
  if (!String(buyer.value.name || "").trim()) errs.push("Nombre y apellido");
  if (!isEmail(buyer.value.email)) errs.push("Email válido");
  if (cleanPhone(buyer.value.phone).length < 6) errs.push("Teléfono válido");
  return errs;
});

const buyerOk = computed(() => buyerErrors.value.length === 0);

// -------------------------
// Delivery
let delivery = ref({
  mode: "pickup", // pickup | shipping
  pickup_branch_id: null,

  contact_name: "",
  ship_phone: "",
  zip: "",
  province: "San Juan",
  city: "San Juan",
  address1: "",
  notes: "",
});

// Branches
const branches = ref([]);
const loadingBranches = ref(false);

// --- stock helpers (si viene stock_by_branch en el item)
function normalizeBranchStock(branchStock) {
  const bid = Number(branchStock?.branch_id ?? branchStock?.id ?? branchStock?.branchId ?? 0);
  const qty = Number(branchStock?.qty ?? branchStock?.stock_qty ?? branchStock?.stock ?? 0);
  if (!bid) return null;
  return { branch_id: bid, qty };
}

function branchesForItem(it) {
  const list =
    it?.stock_by_branch ||
    it?.branch_stock ||
    it?.branches_stock ||
    it?.availability ||
    it?.branches_available ||
    null;

  if (!Array.isArray(list) || list.length === 0) return null;
  const normalized = list.map(normalizeBranchStock).filter(Boolean);
  return normalized.filter((x) => Number(x.qty || 0) > 0);
}

const pickupBranches = computed(() => {
  const all = branches.value || [];
  if (!all.length) return [];

  const itemStocks = (items.value || []).map(branchesForItem);
  if (itemStocks.some((x) => x === null)) return [];

  const sets = itemStocks.map((arr) => new Set(arr.map((x) => String(x.branch_id))));
  if (!sets.length) return [];

  let intersection = sets[0];
  for (let i = 1; i < sets.length; i++) {
    const next = new Set();
    for (const v of intersection) if (sets[i].has(v)) next.add(v);
    intersection = next;
  }

  const ids = Array.from(intersection).map((x) => Number(x)).filter(Boolean);
  return all.filter((b) => ids.includes(Number(b.id)));
});

const selectedBranchName = computed(() => {
  const bid = Number(delivery.value.pickup_branch_id || 0);
  if (!bid) return "";
  const b = (branches.value || []).find((x) => Number(x.id) === bid);
  return b?.name || "";
});

// -------------------------
// Shipping quote
const shippingQuote = ref({ status: "idle", amount: 0, eta: "" });

const canQuoteShipping = computed(() => {
  if (delivery.value.mode !== "shipping") return false;
  return !!delivery.value.zip && !!delivery.value.province && !!delivery.value.city && !!delivery.value.address1;
});

function quoteShipping() {
  const isSJ = String(delivery.value.province || "").toLowerCase().includes("san juan");
  if (!delivery.value.zip || !delivery.value.address1) {
    shippingQuote.value = { status: "error", amount: 0, eta: "" };
    return;
  }

  if (isSJ) {
    shippingQuote.value = {
      status: "ok",
      amount: subtotal.value >= 50000 ? 0 : 2500,
      eta: "Llega hoy o mañana",
    };
  } else {
    shippingQuote.value = {
      status: "ok",
      amount: Math.max(4500, Math.round(subtotal.value * 0.04)),
      eta: "Llega en 3 a 7 días",
    };
  }
}

const shippingAmount = computed(() => {
  if (delivery.value.mode === "pickup") return 0;
  if (shippingQuote.value.status === "ok") return Number(shippingQuote.value.amount || 0);
  return 0;
});

const totalWithShipping = computed(() => subtotal.value + shippingAmount.value);

// -------------------------
// Payment config
const mpEnabled = ref(false);

const transferInfo = ref({
  enabled: true,
  bank: "",
  alias: "",
  cbu: "",
  holder: "",
  instructions: "",
});

// Métodos: MERCADO_PAGO | TRANSFER | CASH | CREDIT_SJT
let payment = ref({
  method: "MERCADO_PAGO",
  reference: "",
  note: "",
});

const paymentLabel = computed(() => {
  const m = payment.value.method;
  if (m === "MERCADO_PAGO") return "Mercado Pago";
  if (m === "TRANSFER") return "Transferencia";
  if (m === "CASH") return "Efectivo";
  if (m === "CREDIT_SJT") return "Crédito San Juan Tecnología";
  return "—";
});

// -------------------------
// Validations
const deliveryOk = computed(() => {
  if (!items.value.length) return false;

  if (delivery.value.mode === "pickup") {
    return !!delivery.value.pickup_branch_id && pickupBranches.value.length > 0;
  }

  return (
    !!delivery.value.contact_name &&
    !!delivery.value.ship_phone &&
    !!delivery.value.zip &&
    !!delivery.value.province &&
    !!delivery.value.city &&
    !!delivery.value.address1 &&
    shippingQuote.value.status === "ok"
  );
});

const canGoPayment = computed(() => buyerOk.value && deliveryOk.value);

const canGoReview = computed(() => {
  if (!canGoPayment.value) return false;

  const m = payment.value.method;
  if (!m) return false;
  if (m === "MERCADO_PAGO" && !mpEnabled.value) return false;

  // ✅ ya no existe "OTHER"
  if (!["MERCADO_PAGO", "TRANSFER", "CASH", "CREDIT_SJT"].includes(m)) return false;

  return true;
});

const canSubmit = computed(() => canGoReview.value);

// -------------------------
// Submit
function normalizePayMethodForBackend() {
  const m = String(payment.value.method || "").toUpperCase();
  if (m === "MERCADO_PAGO") return "MERCADOPAGO";
  if (m === "TRANSFER") return "TRANSFER";
  if (m === "CASH") return "CASH";
  if (m === "CREDIT_SJT") return "CREDIT_SJT";
  return "OTHER";
}

function buildBackendPayload() {
  const isPickup = delivery.value.mode === "pickup";

  return {
    fulfillment_type: isPickup ? "pickup" : "delivery",
    pickup_branch_id: isPickup ? Number(delivery.value.pickup_branch_id || 0) || null : null,

    contact: {
      email: String(buyer.value.email || "").trim(),
      name: String(buyer.value.name || "").trim(),
      phone: String(buyer.value.phone || "").trim(),
      doc_number: String(buyer.value.doc_number || "").trim() || null,
    },

    shipping: !isPickup
      ? {
          address1: String(delivery.value.address1 || "").trim() || null,
          address2: null,
          city: String(delivery.value.city || "").trim() || null,
          province: String(delivery.value.province || "").trim() || null,
          zip: String(delivery.value.zip || "").trim() || null,
          name: String(delivery.value.contact_name || buyer.value.name || "").trim() || null,
          phone: String(delivery.value.ship_phone || buyer.value.phone || "").trim() || null,
        }
      : null,

    shipping_total: !isPickup ? Number(shippingAmount.value || 0) : 0,
    notes: String(delivery.value.notes || "").trim() || null,

    items: (items.value || []).map((it) => ({
      product_id: Number(it.product_id || it.id || 0),
      qty: Number(it.qty || 0),
    })),

    payment: {
      method: normalizePayMethodForBackend(),
      reference: String(payment.value.reference || "").trim() || null,
      note: String(payment.value.note || "").trim() || null,
    },
  };
}

function mapCheckoutErrorToHumanMessage(err) {
  const status = Number(err?.response?.status || err?.status || 0);
  const apiCode = String(err?.response?.data?.code || "").toUpperCase();
  const apiMsg = String(err?.response?.data?.message || "").trim();

  if (status === 409 && apiCode.includes("NO_STOCK")) return apiMsg || "No hay stock suficiente.";
  if (status === 400) return apiMsg || "Datos inválidos. Revisá el formulario.";
  if (status === 401 || status === 403) return "No autorizado. Revisá credenciales/servidor.";
  if (status >= 500) return "Error interno creando el pedido. Probá nuevamente.";
  if (apiMsg) return apiMsg;
  return "No se pudo crear el pedido. Revisá los datos.";
}

async function submitOrder() {
  submitError.value = "";
  submitting.value = true;

  const payload = buildBackendPayload();
  console.log("[CHECKOUT] submit payload", payload);

  try {
    const { data } = await httpPublic.post("/ecom/checkout", payload);
    console.log("[CHECKOUT] response", data);

    const redirectUrl =
      data?.redirect_url ||
      data?.payment?.redirect_url ||
      data?.payment?.init_point ||
      data?.payment?.sandbox_init_point ||
      null;

    const isHttpUrl =
      typeof redirectUrl === "string" &&
      (redirectUrl.startsWith("https://") || redirectUrl.startsWith("http://"));

    // ✅ Si es MP real, redirige
    if (isHttpUrl) {
      window.location.href = redirectUrl;
      return;
    }

    // ✅ Guardar comprobante para success
    const receipt = {
      created_at: data?.created_at || new Date().toISOString(),
      order_id: Number(data?.order_id || data?.id || data?.order?.id || 0) || null,
      order_code: String(data?.code || data?.order_code || data?.order?.code || "").trim() || null,
      payment_method_label: paymentLabel.value,
      payment_method: String(payment.value.method || ""),
      fulfillment_type: String(delivery.value.mode || "pickup"),
      pickup_branch_name: selectedBranchName.value || null,
      shipping: delivery.value.mode === "shipping" ? { ...delivery.value } : null,
      buyer: { ...buyer.value },
      items: (items.value || []).map((it) => ({
        product_id: Number(it.product_id || it.id || 0),
        name: it.name,
        qty: Number(it.qty || 0),
        unit_price: Number(unitPrice(it) || 0),
        image_url: it.image_url || it.image || it.cover_url || "",
      })),
      totals: {
        subtotal: Number(subtotal.value || 0),
        shipping: Number(shippingAmount.value || 0),
        total: Number(totalWithShipping.value || 0),
      },
    };

    try {
      sessionStorage.setItem("shop_last_receipt", JSON.stringify(receipt));
    } catch (e) {
      console.warn("[CHECKOUT] sessionStorage failed", e);
    }

    cart.clear?.();

    // ✅ SIEMPRE a success si no hay redirect
    router.replace("/shop/checkout/success");
  } catch (err) {
    console.error("[CHECKOUT] error", err?.response?.data || err);
    submitError.value = mapCheckoutErrorToHumanMessage(err);
  } finally {
    submitting.value = false;
  }
}

// -------------------------
// Watches
watch(
  () => delivery.value.mode,
  (m) => {
    if (m === "pickup") shippingQuote.value = { status: "idle", amount: 0, eta: "" };
  }
);

watch(
  () => ({ ...buyer.value }),
  () => {
    if (delivery.value.mode !== "shipping") return;
    if (!delivery.value.contact_name) delivery.value.contact_name = buyer.value.name || "";
    if (!delivery.value.ship_phone) delivery.value.ship_phone = buyer.value.phone || "";
  },
  { deep: true }
);

// -------------------------
// Init
onMounted(async () => {
  // si no hay carrito -> volver
  if (!items.value.length) {
    router.push("/shop/cart");
    return;
  }

  // 1) config pagos
  try {
    const cfg = await getShopPaymentConfig();
    transferInfo.value = cfg?.transfer || transferInfo.value;
    mpEnabled.value = !!cfg?.mercadopago?.enabled;

    if (!mpEnabled.value && payment.value.method === "MERCADO_PAGO") {
      payment.value.method = "TRANSFER";
    }
  } catch (e) {
    mpEnabled.value = false;
    if (payment.value.method === "MERCADO_PAGO") payment.value.method = "TRANSFER";
  }

  // 2) branches
  loadingBranches.value = true;
  try {
    const res = await getBranches();
    branches.value = Array.isArray(res) ? res : [];
  } finally {
    loadingBranches.value = false;
  }

  // 3) preselección pickup
  if (pickupBranches.value.length) {
    delivery.value.pickup_branch_id = pickupBranches.value[0].id;
  } else {
    delivery.value.mode = "shipping";
  }

  // defaults envío
  if (!delivery.value.contact_name) delivery.value.contact_name = buyer.value.name || "";
  if (!delivery.value.ship_phone) delivery.value.ship_phone = buyer.value.phone || "";
});
</script>

<style scoped>
.checkout-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
