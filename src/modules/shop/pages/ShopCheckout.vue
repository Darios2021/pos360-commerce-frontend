<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopCheckout.vue -->
<template>
  <v-container class="py-6">
    <div class="checkout-shell">
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
          <v-card class="rounded-xl" variant="outlined">
            <v-card-text>
              <v-stepper v-model="step" class="checkout-stepper" :alt-labels="true">
                <v-stepper-header>
                  <v-stepper-item :value="1" title="Envío" />
                  <v-divider />
                  <v-stepper-item :value="2" title="Pago" />
                  <v-divider />
                  <v-stepper-item :value="3" title="Revisión" />
                </v-stepper-header>

                <v-stepper-window>
                  <!-- =========================
                       STEP 1: ENVÍO + COMPRADOR
                       ========================= -->
                  <v-stepper-window-item :value="1">
                    <div class="section-title">Entrega</div>
                    <div class="text-caption text-medium-emphasis mb-4">
                      Elegí retiro en sucursal o envío a domicilio. (Estilo Mercado Libre)
                    </div>

                    <v-radio-group v-model="delivery.mode" density="compact" class="mb-2">
                      <v-radio label="Retiro en sucursal" value="pickup" />
                      <v-radio label="Envío a domicilio" value="shipping" />
                    </v-radio-group>

                    <!-- PICKUP -->
                    <div v-if="delivery.mode === 'pickup'" class="mt-2">
                      <div class="section-subtitle">Elegí sucursal</div>
                      <div class="text-caption text-medium-emphasis mb-2">
                        Solo mostramos sucursales donde estén disponibles los productos del carrito.
                      </div>

                      <v-alert
                        v-if="!pickupBranches.length"
                        type="warning"
                        variant="tonal"
                        class="rounded-lg"
                      >
                        No encontramos una sucursal que tenga disponibilidad para <b>todos</b> los productos.
                        Probá envío a domicilio o revisá el carrito.
                      </v-alert>

                      <v-select
                        v-model="delivery.pickup_branch_id"
                        :items="pickupBranches"
                        item-title="name"
                        item-value="id"
                        label="Sucursal"
                        variant="outlined"
                        density="comfortable"
                        class="mt-3"
                      />

                      <div v-if="delivery.pickup_branch_id" class="text-caption text-medium-emphasis mt-2">
                        Retiro gratis. Te avisamos cuando esté listo.
                      </div>
                    </div>

                    <!-- SHIPPING -->
                    <div v-else class="mt-2">
                      <div class="section-subtitle">Dirección de envío</div>

                      <v-row class="mt-1">
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="delivery.contact_name"
                            label="Nombre y apellido"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>
                        <v-col cols="12" md="6">
                          <v-text-field
                            v-model="delivery.phone"
                            label="Teléfono"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>

                        <v-col cols="12" md="4">
                          <v-text-field
                            v-model="delivery.zip"
                            label="Código postal"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-select
                            v-model="delivery.province"
                            :items="provinces"
                            label="Provincia"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>
                        <v-col cols="12" md="4">
                          <v-text-field
                            v-model="delivery.city"
                            label="Ciudad"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>

                        <v-col cols="12">
                          <v-text-field
                            v-model="delivery.address1"
                            label="Dirección (calle + número)"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>
                        <v-col cols="12">
                          <v-text-field
                            v-model="delivery.notes"
                            label="Indicaciones (opcional)"
                            variant="outlined"
                            density="comfortable"
                          />
                        </v-col>
                      </v-row>

                      <v-divider class="my-3" />

                      <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                        <div>
                          <div class="section-subtitle">Costo de envío</div>
                          <div class="text-caption text-medium-emphasis">
                            San Juan: envío local · Otras provincias: estilo Mercado Libre (por CP).
                          </div>
                        </div>

                        <v-btn variant="tonal" :disabled="!canQuoteShipping" @click="quoteShipping">
                          <v-icon start>mdi-truck-fast-outline</v-icon>
                          Calcular envío
                        </v-btn>
                      </div>

                      <v-alert
                        v-if="shippingQuote.status === 'ok'"
                        type="success"
                        variant="tonal"
                        class="rounded-lg mt-3"
                      >
                        Envío: <b>$ {{ fmtMoney(shippingQuote.amount) }}</b>
                        <span v-if="shippingQuote.eta" class="text-medium-emphasis">
                          · {{ shippingQuote.eta }}
                        </span>
                      </v-alert>

                      <v-alert
                        v-else-if="shippingQuote.status === 'error'"
                        type="warning"
                        variant="tonal"
                        class="rounded-lg mt-3"
                      >
                        No pudimos cotizar el envío. Revisá CP / provincia / ciudad.
                      </v-alert>
                    </div>

                    <v-divider class="my-4" />

                    <!-- ✅ DATOS DEL COMPRADOR (SIEMPRE) -->
                    <div class="section-subtitle">Datos del comprador</div>
                    <div class="text-caption text-medium-emphasis mb-3">
                      Necesitamos estos datos para generar el pedido y contactarte.
                    </div>

                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="buyer.name"
                          label="Nombre y apellido"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="buyer.email"
                          label="Email"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="buyer.phone"
                          label="Teléfono"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          v-model="buyer.doc_number"
                          label="DNI / CUIT (opcional)"
                          variant="outlined"
                          density="comfortable"
                        />
                      </v-col>
                    </v-row>

                    <v-alert v-if="buyerErrors.length" type="warning" variant="tonal" class="rounded-lg mt-2">
                      <div class="font-weight-bold mb-1">Faltan datos:</div>
                      <ul class="ma-0 pl-5">
                        <li v-for="(e, idx) in buyerErrors" :key="idx">{{ e }}</li>
                      </ul>
                    </v-alert>

                    <div class="d-flex justify-end mt-4">
                      <v-btn color="primary" :disabled="!canGoPayment" @click="step = 2">
                        Continuar
                        <v-icon end>mdi-arrow-right</v-icon>
                      </v-btn>
                    </div>
                  </v-stepper-window-item>

                  <!-- =========================
                       STEP 2: PAGO
                       ========================= -->
                  <v-stepper-window-item :value="2">
                    <div class="section-title">Pago</div>
                    <div class="text-caption text-medium-emphasis mb-4">
                      Elegí el medio de pago.
                    </div>

                    <v-radio-group v-model="payment.method" density="compact" class="mb-2">
                      <v-radio v-if="mpEnabled" label="Mercado Pago" value="MERCADO_PAGO" />
                      <v-radio label="Transferencia" value="TRANSFER" />
                      <v-radio label="Efectivo al retirar/entregar" value="CASH" />
                      <v-radio label="Otro" value="OTHER" />
                    </v-radio-group>

                    <div v-if="payment.method === 'MERCADO_PAGO'" class="pay-box">
                      <div class="section-subtitle">Mercado Pago</div>
                      <div class="text-caption text-medium-emphasis">
                        En el paso final se crea la orden y luego se redirige al checkout de Mercado Pago.
                      </div>

                      <v-alert type="info" variant="tonal" class="rounded-lg mt-3">
                        Email del comprador: <b>{{ buyer.email || "—" }}</b>
                      </v-alert>

                      <v-alert v-if="!mpEnabled" type="warning" variant="tonal" class="rounded-lg mt-3">
                        Mercado Pago no está habilitado (mp_enabled apagado o falta MERCADOPAGO_ACCESS_TOKEN en el servidor).
                      </v-alert>
                    </div>

                    <div v-else-if="payment.method === 'TRANSFER'" class="pay-box">
                      <div class="section-subtitle">Transferencia</div>
                      <div class="text-caption text-medium-emphasis">
                        Estos datos vienen del backend (no hardcode).
                      </div>

                      <v-card variant="outlined" class="rounded-lg mt-3">
                        <v-card-text>
                          <div class="font-weight-bold">Datos bancarios</div>
                          <div class="text-caption mt-2">
                            Banco: <b>{{ transferInfo.bank || "—" }}</b><br />
                            Alias: <b>{{ transferInfo.alias || "—" }}</b><br />
                            CBU: <b>{{ transferInfo.cbu || "—" }}</b><br />
                            Titular: <b>{{ transferInfo.holder || "—" }}</b>
                          </div>

                          <v-alert
                            v-if="transferInfo.instructions"
                            type="info"
                            variant="tonal"
                            class="rounded-lg mt-3"
                          >
                            {{ transferInfo.instructions }}
                          </v-alert>

                          <v-text-field
                            v-model="payment.reference"
                            label="Referencia / Comprobante (opcional)"
                            variant="outlined"
                            density="comfortable"
                            class="mt-3"
                          />
                        </v-card-text>
                      </v-card>
                    </div>

                    <div v-else class="pay-box">
                      <div class="section-subtitle">Detalles</div>
                      <v-textarea
                        v-model="payment.note"
                        label="Nota (opcional)"
                        variant="outlined"
                        density="comfortable"
                        rows="3"
                      />
                    </div>

                    <div class="d-flex justify-space-between mt-4">
                      <v-btn variant="tonal" @click="step = 1">
                        <v-icon start>mdi-arrow-left</v-icon>
                        Volver
                      </v-btn>

                      <v-btn color="primary" :disabled="!canGoReview" @click="step = 3">
                        Continuar
                        <v-icon end>mdi-arrow-right</v-icon>
                      </v-btn>
                    </div>
                  </v-stepper-window-item>

                  <!-- =========================
                       STEP 3: REVISIÓN
                       ========================= -->
                  <v-stepper-window-item :value="3">
                    <div class="section-title">Revisión</div>
                    <div class="text-caption text-medium-emphasis mb-4">
                      Verificá todo antes de confirmar.
                    </div>

                    <v-card variant="outlined" class="rounded-lg">
                      <v-card-text>
                        <div class="section-subtitle">Comprador</div>
                        <div class="text-body-2">
                          <b>{{ buyer.name || "—" }}</b>
                          <div class="text-caption text-medium-emphasis">
                            {{ buyer.email || "—" }} · {{ buyer.phone || "—" }}
                          </div>
                        </div>

                        <v-divider class="my-3" />

                        <div class="section-subtitle">Entrega</div>

                        <div v-if="delivery.mode === 'pickup'" class="text-body-2">
                          Retiro en sucursal: <b>{{ selectedBranchName || "—" }}</b>
                        </div>

                        <div v-else class="text-body-2">
                          Envío a: <b>{{ delivery.address1 || "—" }}</b>,
                          {{ delivery.city || "—" }}, {{ delivery.province || "—" }},
                          CP {{ delivery.zip || "—" }}
                          <div class="text-caption text-medium-emphasis mt-1">
                            {{ delivery.contact_name || buyer.name || "—" }} ·
                            {{ delivery.phone || buyer.phone || "—" }}
                          </div>
                          <div v-if="shippingQuote.status === 'ok'" class="text-caption mt-1">
                            Envío: <b>$ {{ fmtMoney(shippingQuote.amount) }}</b>
                            <span v-if="shippingQuote.eta" class="text-medium-emphasis">
                              · {{ shippingQuote.eta }}
                            </span>
                          </div>
                        </div>

                        <v-divider class="my-3" />

                        <div class="section-subtitle">Pago</div>
                        <div class="text-body-2">
                          Método: <b>{{ paymentLabel }}</b>
                          <div
                            v-if="payment.method === 'TRANSFER' && payment.reference"
                            class="text-caption text-medium-emphasis mt-1"
                          >
                            Ref/Comp.: {{ payment.reference }}
                          </div>
                          <div v-if="payment.method === 'MERCADO_PAGO'" class="text-caption text-medium-emphasis mt-1">
                            Se redirigirá a Mercado Pago al confirmar.
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>

                    <v-alert v-if="submitError" type="error" variant="tonal" class="rounded-lg mt-3">
                      {{ submitError }}
                    </v-alert>

                    <div class="d-flex justify-space-between mt-4">
                      <v-btn variant="tonal" @click="step = 2">
                        <v-icon start>mdi-arrow-left</v-icon>
                        Volver
                      </v-btn>

                      <v-btn
                        color="primary"
                        size="large"
                        :loading="submitting"
                        :disabled="submitting || !canSubmit"
                        @click="submitOrder"
                      >
                        Confirmar compra
                        <v-icon end>mdi-check</v-icon>
                      </v-btn>
                    </div>
                  </v-stepper-window-item>
                </v-stepper-window>
              </v-stepper>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- RIGHT: Summary -->
        <v-col cols="12" md="4">
          <v-card class="rounded-xl" variant="outlined">
            <v-card-text>
              <div class="text-h6 font-weight-bold mb-3">Mi compra</div>

              <div class="summary-items">
                <div v-for="it in items" :key="it.product_id" class="summary-item">
                  <v-img
                    :src="it.image_url || it.image || it.cover_url"
                    width="56"
                    height="56"
                    cover
                    class="rounded-lg"
                  />
                  <div class="summary-info">
                    <div class="summary-name">{{ it.qty }}x {{ it.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      $ {{ fmtMoney(unitPrice(it)) }}
                    </div>
                  </div>
                </div>
              </div>

              <v-divider class="my-3" />

              <div class="d-flex justify-space-between mb-1">
                <span class="text-medium-emphasis">Subtotal</span>
                <span>$ {{ fmtMoney(subtotal) }}</span>
              </div>

              <div class="d-flex justify-space-between mb-1">
                <span class="text-medium-emphasis">Envío</span>
                <span>
                  <template v-if="delivery.mode === 'pickup'">Gratis</template>
                  <template v-else>
                    <span v-if="shippingQuote.status === 'ok'">$ {{ fmtMoney(shippingQuote.amount) }}</span>
                    <span v-else class="text-medium-emphasis">—</span>
                  </template>
                </span>
              </div>

              <div class="d-flex justify-space-between mt-2 text-subtitle-1 font-weight-bold">
                <span>Total</span>
                <span>$ {{ fmtMoney(totalWithShipping) }}</span>
              </div>

              <v-btn block class="mt-4" color="primary" :disabled="items.length === 0" @click="jumpToNextStep">
                Continuar
              </v-btn>

              <div class="text-caption text-medium-emphasis mt-2">
                Podés volver al carrito en cualquier momento.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useShopCartStore } from "@/modules/shop/store/shopCart.store";
import { getBranches, getShopPaymentConfig } from "@/modules/shop/service/shop.public.api.js";
import http from "@/app/api/http";

const router = useRouter();
const cart = useShopCartStore();

// ------------------------------------------------------
// ✅ ANTI-TIMEOUT prerender (Checkout no se comparte)
// ------------------------------------------------------
function dispatchPrerenderReadySafe() {
  try {
    if (typeof document !== "undefined") {
      document.dispatchEvent(new Event("prerender-ready"));
    }
  } catch {}
}

const step = ref(1);
const submitting = ref(false);
const submitError = ref("");

// ========================
// Items
// ========================
const items = computed(() => cart.items || []);

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
function unitPrice(p) {
  const d = Number(p.price_discount || 0);
  if (d > 0) return d;
  const l = Number(p.price_list || 0);
  if (l > 0) return l;
  return Number(p.price || 0);
}
const subtotal = computed(() =>
  (items.value || []).reduce((a, it) => a + unitPrice(it) * Number(it.qty || 0), 0)
);

// ========================
// Buyer (SIEMPRE requerido)
// ========================
const buyer = ref({
  name: "",
  email: "",
  phone: "",
  doc_number: "",
});

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

// ========================
// Branches / Pickup logic
// ========================
const branches = ref([]);
const loadingBranches = ref(false);

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

  // fallback “optimista” si no viene stock por branch en el item
  if (!Array.isArray(list) || list.length === 0) {
    return branches.value.map((b) => ({ branch_id: Number(b.id), qty: 1 }));
  }

  const normalized = list.map(normalizeBranchStock).filter(Boolean);
  return normalized.filter((x) => Number(x.qty || 0) > 0);
}

const pickupBranches = computed(() => {
  const all = branches.value || [];
  if (!all.length) return [];

  const sets = (items.value || []).map((it) =>
    new Set(branchesForItem(it).map((x) => String(x.branch_id)))
  );
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

const delivery = ref({
  mode: "pickup", // pickup | shipping
  pickup_branch_id: null,

  contact_name: "",
  phone: "",
  zip: "",
  province: "San Juan",
  city: "San Juan",
  address1: "",
  notes: "",
});

const selectedBranchName = computed(() => {
  const bid = Number(delivery.value.pickup_branch_id || 0);
  if (!bid) return "";
  const b = (branches.value || []).find((x) => Number(x.id) === bid);
  return b?.name || "";
});

// ========================
// Delivery + Shipping quote
// ========================
const provinces = [
  "San Juan",
  "Buenos Aires",
  "CABA",
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "San Luis",
  "La Rioja",
  "Tucumán",
  "Salta",
  "Jujuy",
  "Chaco",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Chubut",
  "Santa Cruz",
  "Tierra del Fuego",
  "La Pampa",
  "Catamarca",
  "Santiago del Estero",
];

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

// ========================
// Payment (real config)
// ========================
const mpEnabled = ref(false);

const transferInfo = ref({
  enabled: true,
  bank: "",
  alias: "",
  cbu: "",
  holder: "",
  instructions: "",
});

const payment = ref({
  method: "MERCADO_PAGO",
  reference: "",
  note: "",
});

const paymentLabel = computed(() => {
  const m = payment.value.method;
  if (m === "MERCADO_PAGO") return "Mercado Pago";
  if (m === "TRANSFER") return "Transferencia";
  if (m === "CASH") return "Efectivo";
  return "Otro";
});

const shippingAmount = computed(() => {
  if (delivery.value.mode === "pickup") return 0;
  if (shippingQuote.value.status === "ok") return Number(shippingQuote.value.amount || 0);
  return 0;
});
const totalWithShipping = computed(() => subtotal.value + shippingAmount.value);

// ========================
// Validaciones
// ========================
const deliveryOk = computed(() => {
  if (!items.value.length) return false;

  if (delivery.value.mode === "pickup") {
    return !!delivery.value.pickup_branch_id && pickupBranches.value.length > 0;
  }

  return (
    !!delivery.value.contact_name &&
    !!delivery.value.phone &&
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
  if (!payment.value.method) return false;
  if (payment.value.method === "MERCADO_PAGO" && !mpEnabled.value) return false;
  return true;
});

const canSubmit = computed(() => canGoReview.value);

// ========================
// Navigation
// ========================
function jumpToNextStep() {
  if (step.value === 1) {
    if (canGoPayment.value) step.value = 2;
  } else if (step.value === 2) {
    if (canGoReview.value) step.value = 3;
  }
}

// ========================
// Submit (backend real)
// ========================
function normalizePayMethodForBackend() {
  const m = String(payment.value.method || "").toUpperCase();
  if (m === "MERCADO_PAGO") return "MERCADOPAGO";
  if (m === "TRANSFER") return "TRANSFER";
  if (m === "CASH") return "CASH";
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
          phone: String(delivery.value.phone || buyer.value.phone || "").trim() || null,
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
  const status = Number(err?.response?.status || 0);

  const apiCode = String(
    err?.response?.data?.code ||
      err?.response?.data?.error_code ||
      err?.response?.data?.payload?.code ||
      ""
  ).toUpperCase();

  const apiMsg = String(
    err?.response?.data?.message ||
      err?.response?.data?.detail ||
      err?.response?.data?.error ||
      ""
  ).trim();

  if (apiCode === "MP_POLICY_BLOCKED") {
    return (
      "Mercado Pago rechazó el pago por políticas. " +
      "Revisá que el SHOP_PUBLIC_URL sea https y que las credenciales coincidan (TEST/LIVE)."
    );
  }

  if (status === 500 && apiCode.includes("UNAUTHORIZED_RESULT_FROM_POLICIES")) {
    return (
      "Mercado Pago rechazó el pago por políticas (PolicyAgent). " +
      "Revisá SHOP_PUBLIC_URL (https), credenciales TEST/LIVE y que el dominio esté correcto."
    );
  }

  if (apiMsg) return apiMsg;
  if (status >= 500) return "No se pudo crear la orden (error interno). Probá de nuevo en unos segundos.";
  return "No se pudo crear la orden. Revisá los datos e intentá nuevamente.";
}

async function submitOrder() {
  submitError.value = "";
  submitting.value = true;

  try {
    const payload = buildBackendPayload();
    const { data } = await http.post("/ecom/checkout", payload);

    const redirectUrl =
      data?.redirect_url ||
      data?.payment?.redirect_url ||
      data?.payment?.init_point ||
      data?.payment?.sandbox_init_point ||
      null;

    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }

    cart.clear?.();
    router.push("/shop");
  } catch (err) {
    submitError.value = mapCheckoutErrorToHumanMessage(err);
  } finally {
    submitting.value = false;
    dispatchPrerenderReadySafe();
  }
}

// ========================
// Init
// ========================
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
    if (!delivery.value.phone) delivery.value.phone = buyer.value.phone || "";
  },
  { deep: true }
);

onMounted(async () => {
  // ✅ si puppeteer cae acá y no hay carrito, igual no queremos timeout
  if (!items.value.length) {
    dispatchPrerenderReadySafe();
    router.push("/shop/cart");
    return;
  }

  try {
    // 1) Config real de pagos
    try {
      const cfg = await getShopPaymentConfig();
      transferInfo.value = cfg?.transfer || transferInfo.value;
      mpEnabled.value = !!cfg?.mercadopago?.enabled;

      if (!mpEnabled.value && payment.value.method === "MERCADO_PAGO") {
        payment.value.method = "TRANSFER";
      }
    } catch {
      mpEnabled.value = false;
      if (payment.value.method === "MERCADO_PAGO") payment.value.method = "TRANSFER";
    }

    // 2) Branches
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

    // defaults envío desde buyer
    if (!delivery.value.contact_name) delivery.value.contact_name = buyer.value.name || "";
    if (!delivery.value.phone) delivery.value.phone = buyer.value.phone || "";
  } finally {
    // ✅ SIEMPRE liberar prerender
    dispatchPrerenderReadySafe();
  }
});
</script>


<style scoped>
.checkout-shell {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.checkout-stepper :deep(.v-stepper-header) {
  padding: 0;
}

.section-title {
  font-weight: 900;
  font-size: 18px;
  margin-bottom: 2px;
}

.section-subtitle {
  font-weight: 900;
  font-size: 14px;
}

.pay-box {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  padding: 14px;
  background: rgba(0, 0, 0, 0.02);
  margin-top: 10px;
}

.summary-items {
  display: grid;
  gap: 10px;
}

.summary-item {
  display: grid;
  grid-template-columns: 56px 1fr;
  gap: 10px;
  align-items: center;
}

.summary-info {
  min-width: 0;
}

.summary-name {
  font-weight: 900;
  font-size: 13px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
