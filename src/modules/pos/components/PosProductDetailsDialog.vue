<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosProductDetailsDialog.vue -->

<template>
  <v-dialog v-model="openLocal" max-width="980" class="pdd-dialog">
    <v-card rounded="xl" class="pdd-root">
      <!-- HEADER / HERO -->
      <div class="pdd-hero">
        <div class="pdd-hero-left">
          <div class="pdd-title-row">
            <div class="pdd-title text-h6 font-weight-black">Detalle de producto</div>

            <v-chip size="small" variant="tonal" class="pdd-chip">
              <v-icon start size="16">mdi-barcode</v-icon>
              SKU: {{ item?.sku || item?.code || "—" }}
            </v-chip>

            <v-chip size="small" variant="tonal" class="pdd-chip">
              <v-icon start size="16">mdi-database</v-icon>
              Stock: <b class="ml-1">{{ qty3(item?.qty ?? 0) }}</b>
            </v-chip>

            <v-chip v-if="rubroLabelFinal" size="small" variant="tonal" class="pdd-chip">
              <v-icon start size="16">mdi-shape</v-icon>
              {{ rubroLabelFinal }}
              <span v-if="subrubroLabelFinal" class="mx-1">·</span>
              <span v-if="subrubroLabelFinal">{{ subrubroLabelFinal }}</span>
            </v-chip>
          </div>

          <div class="pdd-sub text-caption text-medium-emphasis">
            Elegí método y política: tarjeta en cuotas usa lista · revendedor pisa todo (si existe).
          </div>
        </div>

        <v-spacer />

        <v-btn icon variant="text" class="pdd-close" @click="openLocal = false" title="Cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-card-text class="pdd-body">
        <v-row dense class="pdd-grid">
          <!-- LEFT: PRODUCT -->
          <v-col cols="12" md="5">
            <v-card class="pdd-panel pdd-panel-left" elevation="0" rounded="xl">
              <div class="pdd-media">
                <div class="pdd-img">
                  <v-img v-if="image" :src="image" cover />
                  <div v-else class="pdd-noimg">
                    <v-icon size="56">mdi-package-variant</v-icon>
                  </div>
                </div>

                <div class="pdd-namewrap">
                  <div class="pdd-name" :title="item?.name || ''">
                    {{ item?.name || "—" }}
                  </div>

                  <div class="pdd-meta">
                    <div class="pdd-kv">
                      <span class="k">Marca</span>
                      <span class="v" :title="brandComputed || ''">{{ brandComputed || "—" }}</span>
                    </div>

                    <div class="pdd-kv">
                      <span class="k">Modelo</span>
                      <span class="v" :title="modelComputed || ''">{{ modelComputed || "—" }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <v-divider class="my-3" />

              <!-- Precio rápido -->
              <div class="pdd-quick">
                <div class="pdd-quick-main">
                  <div class="text-caption text-medium-emphasis">Precio descuento (1 pago)</div>
                  <div class="text-h5 font-weight-black">
                    {{ money(priceDiscountComputed) }}
                  </div>
                </div>

                <div v-if="hasDiscount" class="pdd-quick-side">
                  <div class="text-caption text-medium-emphasis">Precio lista</div>
                  <div class="pdd-listline">
                    <span class="strike">{{ money(priceListComputed) }}</span>
                    <span class="off">{{ offPct }}% OFF</span>
                  </div>
                </div>
              </div>

              <v-alert v-if="catsStatus === 'error'" type="warning" variant="tonal" class="mt-3">
                No pude cargar categorías para mostrar Rubro/Subrubro.
              </v-alert>

              <v-alert v-if="legacyStatus === 'error'" type="warning" variant="tonal" class="mt-2">
                No pude cargar subcategorías legacy (tabla subcategories).
              </v-alert>
            </v-card>
          </v-col>

          <!-- RIGHT: PAYMENT -->
          <v-col cols="12" md="7">
            <v-card class="pdd-panel pdd-panel-right" elevation="0" rounded="xl">
              <div class="pdd-sec-head">
                <div class="text-subtitle-1 font-weight-black">Opciones de pago</div>
                <v-chip size="small" variant="tonal" class="pdd-chip pdd-chip-soft">
                  {{ pricePolicyLabel(currentPolicyComputed) }}
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-1">
                * Tarjeta: 1 pago = descuento · 2 a 6 cuotas = lista · Revendedor (si existe) pisa todo.
              </div>

              <v-divider class="my-4" />

              <!-- Payment cards -->
              <div class="pdd-paygrid">
                <button
                  type="button"
                  class="pdd-paycard"
                  :class="{ active: paymentMethod === 'CASH' }"
                  @click="paymentMethod = 'CASH'"
                >
                  <div class="ic"><v-icon>mdi-cash</v-icon></div>
                  <div class="tx">
                    <div class="t">Efectivo</div>
                    <div class="s">Usa descuento</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="paymentMethod === 'CASH'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="pdd-paycard"
                  :class="{ active: paymentMethod === 'CARD' }"
                  @click="paymentMethod = 'CARD'"
                >
                  <div class="ic"><v-icon>mdi-credit-card-outline</v-icon></div>
                  <div class="tx">
                    <div class="t">Tarjeta / Débito</div>
                    <div class="s">Cuotas usan lista</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="paymentMethod === 'CARD'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="pdd-paycard"
                  :class="{ active: paymentMethod === 'TRANSFER' }"
                  @click="paymentMethod = 'TRANSFER'"
                >
                  <div class="ic"><v-icon>mdi-bank-transfer</v-icon></div>
                  <div class="tx">
                    <div class="t">Transferencia</div>
                    <div class="s">Usa descuento</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="paymentMethod === 'TRANSFER'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>

                <button
                  type="button"
                  class="pdd-paycard"
                  :class="{ active: paymentMethod === 'QR' }"
                  @click="paymentMethod = 'QR'"
                >
                  <div class="ic"><v-icon>mdi-qrcode-scan</v-icon></div>
                  <div class="tx">
                    <div class="t">Mercado Pago (QR)</div>
                    <div class="s">Usa descuento</div>
                  </div>
                  <div class="chk">
                    <v-icon v-if="paymentMethod === 'QR'">mdi-check-circle</v-icon>
                    <v-icon v-else>mdi-circle-outline</v-icon>
                  </div>
                </button>
              </div>

              <v-row dense class="mt-3">
                <v-col cols="12" md="6">
                  <v-switch
                    v-model="applyReseller"
                    inset
                    color="primary"
                    label="Aplicar precio revendedor"
                    hide-details
                  />
                  <div class="text-caption text-medium-emphasis">
                    Si no existe revendedor (&gt; 0), cae a descuento/lista según corresponda.
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
                    En cuotas se usa precio lista. Se calcula valor por cuota.
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-4" />

              <!-- PRICE SUMMARY -->
              <div class="pdd-pricebox">
                <div class="pdd-price-main">
                  <div class="text-caption text-medium-emphasis">Precio unitario</div>
                  <div class="text-h5 font-weight-black">
                    {{ money(unitPrice) }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    Política aplicada:
                    <b>{{ pricePolicyLabel(currentPolicyComputed) }}</b>
                  </div>
                </div>

                <div v-if="showInstallmentBreakdown" class="pdd-price-side">
                  <div class="text-caption text-medium-emphasis">{{ installments }} cuotas de</div>
                  <div class="text-h5 font-weight-black">
                    {{ money(perInstallment) }}
                  </div>
                </div>
              </div>

              <v-alert v-if="unitPrice <= 0" type="warning" variant="tonal" class="mt-3">
                Este producto no tiene precio válido (lista/descuento/base). No se puede agregar.
              </v-alert>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- FOOTER -->
      <v-card-actions class="pdd-actions">
        <v-btn variant="tonal" @click="openLocal = false">Cerrar</v-btn>
        <v-spacer />

        <v-btn
          color="primary"
          variant="flat"
          size="large"
          class="pdd-add-btn"
          :disabled="!canSell || unitPrice <= 0"
          :title="!canSell ? 'El usuario admin no puede vender' : unitPrice <= 0 ? 'Producto sin precio' : ''"
          @click="onAdd"
        >
          <v-icon start>mdi-cart-plus</v-icon>
          AGREGAR
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount } from "vue";
import http from "@/app/api/http";

const props = defineProps({
  open: { type: Boolean, default: false },
  canSell: { type: Boolean, default: true },

  item: { type: Object, default: null },
  image: { type: String, default: "" },

  // si el padre te pasa labels, se respetan
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },

  priceList: { type: [Number, String], default: 0 },
  priceDiscount: { type: [Number, String], default: 0 },
  priceReseller: { type: [Number, String], default: 0 },
});

const emit = defineEmits(["update:open", "add"]);

/* ✅ v-model interno del dialog */
const openLocal = computed({
  get: () => props.open,
  set: (v) => emit("update:open", v),
});

const installmentsItems = [
  { title: "1 pago", value: 1 },
  { title: "2 cuotas", value: 2 },
  { title: "3 cuotas", value: 3 },
  { title: "4 cuotas", value: 4 },
  { title: "5 cuotas", value: 5 },
  { title: "6 cuotas", value: 6 },
];

const paymentMethod = ref("CASH");
const installments = ref(1);
const applyReseller = ref(false);

/* =========================
   Numbers (AR)
========================= */
function toNum(v) {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;

  const s = String(v).trim();
  if (!s) return 0;

  if (s.includes(".") && s.includes(",")) {
    const norm = s.replace(/\./g, "").replace(",", ".");
    const n = Number(norm);
    return Number.isFinite(n) ? n : 0;
  }
  if (s.includes(",") && !s.includes(".")) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(toNum(val));
}
function qty3(n) {
  return toNum(n).toFixed(3);
}

/* =========================
   CATEGORIES (nuevo)
========================= */
const cats = ref([]);
const catsStatus = ref("idle"); // idle|loading|ok|error

function unwrapList(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (res.ok === false) return [];
  const v = res.items ?? res.data ?? res.rows ?? res.list ?? res.result ?? null;
  if (Array.isArray(v)) return v;
  if (v && Array.isArray(v.items)) return v.items;
  if (v && Array.isArray(v.rows)) return v.rows;
  return [];
}

function toInt(v, d = 0) {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : d;
}

function normalizeCats(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (!x) return null;
      const id = toInt(x.id ?? x.value ?? 0, 0);
      const name = String(x.name ?? x.label ?? x.title ?? "").trim();
      const parent_id =
        x.parent_id === null || x.parent_id === undefined || x.parent_id === "" ? null : toInt(x.parent_id, 0);
      const is_active = x.is_active === undefined ? 1 : toInt(x.is_active, 1);
      if (!id || !name) return null;
      return { ...x, id, name, parent_id, is_active };
    })
    .filter(Boolean);
}

async function loadCategoriesSafe() {
  if (catsStatus.value === "loading") return;
  if ((cats.value || []).length) {
    catsStatus.value = "ok";
    return;
  }

  catsStatus.value = "loading";
  const candidates = [
    { url: "/categories", params: { limit: 5000 } },
    { url: "/categories", params: { page: 1, limit: 5000 } },
    { url: "/categories", params: undefined },
  ];

  try {
    for (const c of candidates) {
      try {
        const { data } = await http.get(c.url, c.params ? { params: c.params } : undefined);
        const out = normalizeCats(unwrapList(data));
        if (out.length) {
          cats.value = out;
          catsStatus.value = "ok";
          return;
        }
      } catch {}
    }
    cats.value = [];
    catsStatus.value = "error";
  } catch {
    cats.value = [];
    catsStatus.value = "error";
  }
}

const catById = computed(() => {
  const m = new Map();
  for (const c of cats.value || []) m.set(toInt(c?.id, 0), c);
  return m;
});

/* =========================
   SUBCATEGORIES LEGACY
========================= */
const legacySubs = ref([]); // [{id, category_id, name, is_active}]
const legacyStatus = ref("idle"); // idle|loading|ok|error

function normalizeLegacy(list) {
  const arr = Array.isArray(list) ? list : [];
  return arr
    .map((x) => {
      if (!x) return null;
      const id = toInt(x.id ?? 0, 0);
      const category_id = x.category_id === null || x.category_id === undefined ? null : toInt(x.category_id, 0);
      const name = String(x.name ?? x.label ?? x.title ?? "").trim();
      const is_active = x.is_active === undefined ? 1 : toInt(x.is_active, 1);
      if (!id || !name) return null;
      return { ...x, id, category_id, name, is_active };
    })
    .filter(Boolean);
}

async function loadLegacySubcategoriesSafe() {
  if (legacyStatus.value === "loading") return;
  if ((legacySubs.value || []).length) {
    legacyStatus.value = "ok";
    return;
  }

  legacyStatus.value = "loading";

  const candidates = [
    { url: "/subcategories", params: { limit: 5000 } },
    { url: "/subcategories", params: { page: 1, limit: 5000 } },
    { url: "/subcategories", params: undefined },
    { url: "/admin/subcategories", params: { limit: 5000 } },
    { url: "/admin/subcategories", params: undefined },
  ];

  try {
    for (const c of candidates) {
      try {
        const { data } = await http.get(c.url, c.params ? { params: c.params } : undefined);
        const out = normalizeLegacy(unwrapList(data));
        if (out.length) {
          legacySubs.value = out;
          legacyStatus.value = "ok";
          return;
        }
      } catch {}
    }
    legacySubs.value = [];
    legacyStatus.value = "error";
  } catch {
    legacySubs.value = [];
    legacyStatus.value = "error";
  }
}

const legacyById = computed(() => {
  const m = new Map();
  for (const s of legacySubs.value || []) m.set(toInt(s?.id, 0), s);
  return m;
});

/* =========================
   Derivación rubro/subrubro
========================= */
const derived = computed(() => {
  const p = props.item || {};
  const catId = toInt(p?.category_id || p?.category?.id, 0) || null;
  const subId = toInt(p?.subcategory_id || p?.subcategory?.id, 0) || null;

  // Caso normal: subId apunta a categories (nuevo)
  if (subId && catById.value.get(subId)) {
    const sub = catById.value.get(subId);
    const rubroId = toInt(sub?.parent_id, 0) || catId || null;
    return {
      rubroId,
      subId,
      rubroName: catById.value.get(rubroId || 0)?.name || "",
      subName: sub?.name || "",
    };
  }

  // Caso legacy
  if (subId && legacyById.value.get(subId)) {
    const legacy = legacyById.value.get(subId);
    const rubroId = toInt(legacy?.category_id, 0) || catId || null;
    return {
      rubroId,
      subId,
      rubroName: catById.value.get(rubroId || 0)?.name || "",
      subName: legacy?.name || "",
    };
  }

  // Solo rubro
  if (catId && catById.value.get(catId)) {
    return { rubroId: catId, subId: null, rubroName: catById.value.get(catId)?.name || "", subName: "" };
  }

  return { rubroId: null, subId: null, rubroName: "", subName: "" };
});

const rubroLabelComputed = computed(() => {
  if (props.rubroLabel) return String(props.rubroLabel || "").trim();
  return String(derived.value.rubroName || "").trim();
});

const subrubroLabelComputed = computed(() => {
  if (props.subrubroLabel) return String(props.subrubroLabel || "").trim();
  return String(derived.value.subName || "").trim();
});

const rubroLabelFinal = computed(() => {
  const r = String(rubroLabelComputed.value || "").trim();
  const s = String(subrubroLabelComputed.value || "").trim();
  if (r) return r;
  if (s) return s;
  return "";
});

const subrubroLabelFinal = computed(() => {
  const r = String(rubroLabelComputed.value || "").trim();
  const s = String(subrubroLabelComputed.value || "").trim();
  if (!r && s) return "";
  return s;
});

/* =========================
   Marca / Modelo
========================= */
const brandComputed = computed(() => {
  const it = props.item || {};
  return (
    it.brand ||
    it.brand_name ||
    it.marca ||
    it.Brand ||
    it?.attributes?.brand ||
    it?.attributes?.marca ||
    it?.specs?.brand ||
    it?.specs?.marca ||
    it?.meta?.brand ||
    ""
  );
});

const modelComputed = computed(() => {
  const it = props.item || {};
  return (
    it.model ||
    it.model_name ||
    it.modelo ||
    it.Model ||
    it?.attributes?.model ||
    it?.attributes?.modelo ||
    it?.specs?.model ||
    it?.specs?.modelo ||
    it?.meta?.model ||
    ""
  );
});

/* =========================
   Pricing
========================= */
const priceListComputed = computed(() => {
  const fromProps = toNum(props.priceList);
  if (fromProps > 0) return fromProps;
  return toNum(props.item?.price_list) || toNum(props.item?.list_price) || toNum(props.item?.priceList) || 0;
});

const priceDiscountComputed = computed(() => {
  const fromProps = toNum(props.priceDiscount);
  if (fromProps > 0) return fromProps;
  return toNum(props.item?.price_discount) || toNum(props.item?.discount_price) || toNum(props.item?.priceDiscount) || 0;
});

const priceResellerComputed = computed(() => {
  const fromProps = toNum(props.priceReseller);
  if (fromProps > 0) return fromProps;
  return toNum(props.item?.price_reseller) || toNum(props.item?.reseller_price) || toNum(props.item?.priceReseller) || 0;
});

const priceBaseComputed = computed(() => {
  return toNum(props.item?.price) || toNum(props.item?.base_price) || toNum(props.item?.effective_price) || 0;
});

const hasDiscount = computed(() => {
  const l = priceListComputed.value;
  const d = priceDiscountComputed.value;
  return l > 0 && d > 0 && d < l;
});

const offPct = computed(() => {
  const l = priceListComputed.value;
  const d = priceDiscountComputed.value;
  if (!(l > 0 && d > 0 && d < l)) return 0;
  return Math.round(((l - d) / l) * 100);
});

function currentPolicy() {
  const res = priceResellerComputed.value;
  if (applyReseller.value && res > 0) return "RESELLER";

  if (paymentMethod.value === "CARD") {
    const k = Number(installments.value || 1);
    return k > 1 ? "LIST" : "DISCOUNT";
  }
  return "DISCOUNT";
}

function pricePolicyLabel(pol) {
  if (pol === "RESELLER") return "Revendedor";
  if (pol === "LIST") return "Lista";
  return "Descuento";
}

function resolveUnitPrice(policy) {
  const list = priceListComputed.value;
  const disc = priceDiscountComputed.value;
  const res = priceResellerComputed.value;
  const base = priceBaseComputed.value;

  if (policy === "RESELLER") return res > 0 ? res : disc > 0 ? disc : list > 0 ? list : base;
  if (policy === "DISCOUNT") return disc > 0 ? disc : list > 0 ? list : base;
  return list > 0 ? list : disc > 0 ? disc : base;
}

const currentPolicyComputed = computed(() => currentPolicy());
const unitPrice = computed(() => resolveUnitPrice(currentPolicyComputed.value));

const showInstallmentBreakdown = computed(() => {
  return paymentMethod.value === "CARD" && !applyReseller.value && Number(installments.value || 1) > 1;
});

const perInstallment = computed(() => {
  const k = Number(installments.value || 1);
  if (!(k > 1)) return 0;
  return toNum(unitPrice.value) / k;
});

/* =========================
   On open: reset + carga cats + legacy
========================= */
watch(
  () => props.open,
  async (v) => {
    if (!v) return;

    paymentMethod.value = "CASH";
    installments.value = 1;
    applyReseller.value = false;

    if (!(cats.value || []).length) await loadCategoriesSafe();

    const subId = toInt(props.item?.subcategory_id || props.item?.subcategory?.id, 0) || null;
    if (subId && !catById.value.get(subId)) {
      await loadLegacySubcategoriesSafe();
    }
  }
);

/* =========================
   Add
========================= */
function onAdd() {
  emit("add", {
    paymentMethod: paymentMethod.value,
    installments: Number(installments.value || 1),
    applyReseller: Boolean(applyReseller.value),
    price_policy: currentPolicyComputed.value,
    unit_price: toNum(unitPrice.value || 0),
    price_label: pricePolicyLabel(currentPolicyComputed.value),
  });
}

/* =========================
   F9 → Abrir/Cerrar (global)
========================= */
function handleKeydown(e) {
  if (e.key === "F9") {
    e.preventDefault();
    openLocal.value = !openLocal.value;
  }
}

onMounted(() => window.addEventListener("keydown", handleKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", handleKeydown));
</script>

<style scoped>
.pdd-root {
  overflow: hidden;
  --pdd-brand: 42, 133, 196; /* #2a85c4 */
}

/* HERO */
.pdd-hero {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 16px 14px;
  background: linear-gradient(
    180deg,
    rgba(var(--pdd-brand), 0.18),
    rgba(var(--pdd-brand), 0.06),
    rgba(var(--v-theme-surface), 0.92)
  );
}
.pdd-hero-left {
  min-width: 0;
}
.pdd-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.pdd-title {
  margin-right: 6px;
}
.pdd-chip {
  border: 1px solid rgba(var(--pdd-brand), 0.18);
  background: rgba(var(--pdd-brand), 0.08) !important;
}
.pdd-chip-soft {
  border-color: rgba(var(--pdd-brand), 0.14);
  background: rgba(var(--pdd-brand), 0.06) !important;
}
.pdd-sub {
  margin-top: 6px;
}
.pdd-close {
  margin-top: -2px;
}

/* BODY */
.pdd-body {
  padding: 16px;
  background: rgba(var(--pdd-brand), 0.02);
}
.pdd-panel {
  border: 1px solid rgba(var(--pdd-brand), 0.14);
  background: rgba(var(--v-theme-surface), 0.86);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
}
.pdd-panel-left,
.pdd-panel-right {
  padding: 14px;
}

/* LEFT: MEDIA */
.pdd-media {
  display: grid;
  grid-template-columns: 112px 1fr;
  gap: 12px;
  align-items: center;
  min-width: 0;
}
.pdd-img {
  width: 112px;
  height: 112px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(var(--pdd-brand), 0.18);
  background: rgba(var(--pdd-brand), 0.06);
}
.pdd-noimg {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  opacity: 0.9;
}
.pdd-namewrap {
  min-width: 0;
}
.pdd-name {
  font-weight: 900;
  font-size: 1.02rem;
  line-height: 1.15;
  color: rgba(var(--v-theme-on-surface), 0.92);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.pdd-meta {
  margin-top: 10px;
  display: grid;
  gap: 8px;
  min-width: 0;
}
.pdd-kv {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 10px;
  align-items: center;
  padding: 9px 10px;
  border-radius: 12px;
  background: rgba(var(--pdd-brand), 0.04);
  border: 1px solid rgba(var(--pdd-brand), 0.12);
  min-width: 0;
}
.pdd-kv .k {
  font-size: 0.78rem;
  opacity: 0.78;
  white-space: nowrap;
}
.pdd-kv .v {
  font-size: 0.86rem;
  font-weight: 900;
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* QUICK PRICE */
.pdd-quick {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.pdd-quick-side {
  text-align: right;
}
.pdd-listline {
  display: flex;
  align-items: baseline;
  gap: 10px;
  justify-content: flex-end;
}
.strike {
  text-decoration: line-through;
  opacity: 0.7;
}
.off {
  color: rgb(var(--v-theme-success));
  font-weight: 900;
}

/* RIGHT */
.pdd-sec-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

/* PAY CARDS */
.pdd-paygrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
@media (max-width: 959px) {
  .pdd-paygrid {
    grid-template-columns: 1fr;
  }
}
.pdd-paycard {
  appearance: none;
  border: 1px solid rgba(var(--pdd-brand), 0.16);
  background: rgba(var(--pdd-brand), 0.04);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  grid-template-columns: 40px 1fr 26px;
  gap: 10px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: transform 0.08s ease, border-color 0.12s ease, background 0.12s ease;
}
.pdd-paycard:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--pdd-brand), 0.35);
  background: rgba(var(--pdd-brand), 0.06);
}
.pdd-paycard.active {
  border-color: rgba(var(--pdd-brand), 0.55);
  background: rgba(var(--pdd-brand), 0.12);
}
.pdd-paycard .ic {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--pdd-brand), 0.14);
  color: rgba(var(--pdd-brand), 0.95);
}
.pdd-paycard .tx .t {
  font-weight: 950;
  line-height: 1.1;
}
.pdd-paycard .tx .s {
  font-size: 0.78rem;
  opacity: 0.78;
  margin-top: 2px;
}
.pdd-paycard .chk {
  opacity: 0.9;
  color: rgba(var(--pdd-brand), 0.95);
}

/* PRICE BOX */
.pdd-pricebox {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(var(--pdd-brand), 0.18);
  background: rgba(var(--pdd-brand), 0.04);
}
.pdd-price-side {
  text-align: right;
  min-width: 160px;
}
@media (max-width: 600px) {
  .pdd-pricebox {
    flex-direction: column;
  }
  .pdd-price-side {
    text-align: left;
    min-width: 0;
  }
}

/* FOOTER */
.pdd-actions {
  padding: 14px 16px;
  position: sticky;
  bottom: 0;
  background: rgba(var(--v-theme-surface), 0.92);
  border-top: 1px solid rgba(var(--pdd-brand), 0.14);
  backdrop-filter: blur(10px);
}
.pdd-add-btn {
  font-weight: 950;
  letter-spacing: 0.5px;
  padding-inline: 28px;
  box-shadow: 0 8px 20px rgba(42, 133, 196, 0.25);
}
.pdd-add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 26px rgba(42, 133, 196, 0.35);
}

/* MOBILE FIX */
@media (max-width: 520px) {
  .pdd-body {
    padding: 12px;
  }
  .pdd-panel-left,
  .pdd-panel-right {
    padding: 12px;
  }
  .pdd-hero {
    padding: 14px 14px 12px;
  }
  .pdd-media {
    grid-template-columns: 1fr;
    align-items: start;
  }
  .pdd-img {
    width: 100%;
    height: 180px;
  }
  .pdd-kv {
    grid-template-columns: 76px 1fr;
  }
}
</style>