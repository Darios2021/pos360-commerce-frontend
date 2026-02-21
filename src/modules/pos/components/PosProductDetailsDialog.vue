<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/pos/components/PosProductDetailsDialog.vue -->

<template>
  <v-dialog v-model="openLocal" max-width="980">
    <v-card rounded="xl" class="pdd-root">
      <!-- HEADER -->
      <div class="pdd-head">
        <div>
          <div class="text-h6 font-weight-black">Detalle producto</div>
          <div class="text-caption text-medium-emphasis">
            SKU: {{ item?.sku || item?.code || "—" }} · Stock:
            <b>{{ qty3(item?.qty ?? 0) }}</b>
          </div>
        </div>

        <v-spacer />

        <v-btn icon variant="text" @click="openLocal = false" title="Cerrar">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <v-card-text class="pdd-body">
        <v-row dense>
          <!-- LEFT -->
          <v-col cols="12" md="5">
            <v-card class="rounded-xl pa-3 pdd-panel" elevation="0">
              <v-avatar rounded="xl" size="220" class="border mb-3">
                <v-img v-if="image" :src="image" cover />
                <v-icon v-else size="56">mdi-package-variant</v-icon>
              </v-avatar>

              <div class="text-h6 font-weight-black">
                {{ item?.name || "—" }}
              </div>

              <div class="mt-2">
                <div class="text-caption text-medium-emphasis">
                  Rubro: <b>{{ rubroLabelFinal || "—" }}</b>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Subrubro: <b>{{ subrubroLabelFinal || "—" }}</b>
                </div>
              </div>

              <div class="mt-2">
                <div class="text-caption text-medium-emphasis">
                  Marca: <b>{{ brandComputed || "—" }}</b>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Modelo: <b>{{ modelComputed || "—" }}</b>
                </div>
              </div>

              <v-divider class="my-3" />

              <!-- Precio rápido -->
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">
                    Precio descuento (1 pago)
                  </div>
                  <div class="text-h6 font-weight-black">
                    {{ money(priceDiscountComputed) }}
                  </div>
                </div>

                <div v-if="hasDiscount" class="text-right">
                  <div class="text-caption text-medium-emphasis">
                    Precio lista
                  </div>
                  <div class="text-subtitle-1 font-weight-bold">
                    <span class="strike">{{ money(priceListComputed) }}</span>
                    <span class="ml-2 off">{{ offPct }}% OFF</span>
                  </div>
                </div>
              </div>

              <v-alert
                v-if="catsStatus === 'error'"
                type="warning"
                variant="tonal"
                class="mt-3"
              >
                No pude cargar categorías para mostrar Rubro/Subrubro.
              </v-alert>
            </v-card>
          </v-col>

          <!-- RIGHT -->
          <v-col cols="12" md="7">
            <v-card class="rounded-xl pa-4 pdd-panel" elevation="0">
              <div class="d-flex align-center justify-space-between">
                <div class="text-subtitle-1 font-weight-black">
                  Opciones de pago
                </div>
                <v-chip size="small" variant="tonal">
                  {{ pricePolicyLabel(currentPolicyComputed) }}
                </v-chip>
              </div>

              <div class="text-caption text-medium-emphasis mt-1">
                * Tarjeta: 1 pago = descuento · 2 a 6 cuotas = lista ·
                Revendedor (si existe) pisa todo.
              </div>

              <v-divider class="my-4" />

              <v-radio-group v-model="paymentMethod" color="primary">
                <v-radio value="CASH" label="Efectivo" />
                <v-radio value="CARD" label="Tarjeta / Débito" />
                <v-radio value="TRANSFER" label="Transferencia" />
                <v-radio value="QR" label="Mercado Pago (QR)" />
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
                    Si no existe revendedor (&gt; 0), cae a descuento/lista
                    según corresponda.
                  </div>
                </v-col>

                <v-col
                  cols="12"
                  md="6"
                  v-if="paymentMethod === 'CARD' && !applyReseller"
                >
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

              <v-alert type="info" variant="tonal">
                <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                  <div>
                    <div class="text-caption text-medium-emphasis">
                      Precio unitario
                    </div>
                    <div class="text-h6 font-weight-black">
                      {{ money(unitPrice) }}
                    </div>
                  </div>

                  <div v-if="showInstallmentBreakdown" class="text-right">
                    <div class="text-caption text-medium-emphasis">
                      {{ installments }} cuotas de
                    </div>
                    <div class="text-h6 font-weight-black">
                      {{ money(perInstallment) }}
                    </div>
                  </div>
                </div>
              </v-alert>

              <div class="text-caption text-medium-emphasis mt-3">
                Política aplicada:
                <b>{{ pricePolicyLabel(currentPolicyComputed) }}</b>
              </div>

              <v-alert
                v-if="unitPrice <= 0"
                type="warning"
                variant="tonal"
                class="mt-3"
              >
                Este producto no tiene precio válido (lista/descuento/base). No se puede agregar.
              </v-alert>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="tonal" @click="openLocal = false">
          Cerrar
        </v-btn>
        <v-spacer />

        <v-btn
          color="primary"
          variant="flat"
          :disabled="!canSell || unitPrice <= 0"
          :title="!canSell ? 'El usuario admin no puede vender' : unitPrice <= 0 ? 'Producto sin precio' : ''"
          @click="onAdd"
        >
          <v-icon start>mdi-plus</v-icon>
          Agregar con este precio
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import http from "@/app/api/http";

const props = defineProps({
  open: { type: Boolean, default: false },
  canSell: { type: Boolean, default: true },

  item: { type: Object, default: null },
  image: { type: String, default: "" },
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },

  priceList: { type: [Number, String], default: 0 },
  priceDiscount: { type: [Number, String], default: 0 },
  priceReseller: { type: [Number, String], default: 0 },
});

const emit = defineEmits(["update:open", "add"]);

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
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(toNum(val));
}

function qty3(n) {
  return toNum(n).toFixed(3);
}

/* =========================
   Categories local
========================= */
const cats = ref([]);
const catsStatus = ref("idle"); // idle|loading|ok|error

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
  ];

  try {
    for (const c of candidates) {
      try {
        const { data } = await http.get(c.url, c.params ? { params: c.params } : undefined);
        const arr = data?.data?.items || data?.items || data?.data || data || [];
        const out = Array.isArray(arr) ? arr : [];
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
  for (const c of cats.value || []) m.set(toNum(c?.id), c);
  return m;
});

/**
 * ✅ Derivación:
 * - Si category_id es una SUBCAT (tiene parent_id): rubro=parent, subrubro=category_id
 * - Si category_id es rubro (sin parent): rubro=category_id
 * - Si subcategory_id existe: subrubro=subcategory_id y rubro=parent(subcat)
 */
function deriveRubroSub(p) {
  const subId = toNum(p?.subcategory_id || p?.subcategory?.id);
  if (subId) {
    const sub = catById.value.get(subId) || null;
    const rubroId = toNum(sub?.parent_id || sub?.parentId || sub?.parent?.id) || null;
    return { rubroId, subId: sub ? toNum(sub.id) : subId };
  }

  const catId = toNum(p?.category_id || p?.category?.id);
  if (!catId) return { rubroId: null, subId: null };

  const c = catById.value.get(catId) || null;
  if (!c) return { rubroId: null, subId: null };

  const parentId = toNum(c?.parent_id || c?.parentId || c?.parent?.id) || null;
  if (parentId) return { rubroId: parentId, subId: toNum(c.id) };

  return { rubroId: toNum(c.id), subId: null };
}

const ids = computed(() => deriveRubroSub(props.item));

const rubroLabelComputed = computed(() => {
  if (props.rubroLabel) return props.rubroLabel;
  const rid = ids.value.rubroId;
  if (!rid) return "";
  return catById.value.get(rid)?.name || "";
});

const subrubroLabelComputed = computed(() => {
  if (props.subrubroLabel) return props.subrubroLabel;
  const sid = ids.value.subId;
  if (!sid) return "";
  return catById.value.get(sid)?.name || "";
});

/**
 * ✅ FIX VISUAL: si falta rubro (padre) pero hay subrubro,
 * mostramos rubro = subrubro y subrubro vacío (no “—”)
 */
const rubroLabelFinal = computed(() => {
  const r = String(rubroLabelComputed.value || "").trim();
  const s = String(subrubroLabelComputed.value || "").trim();
  if (r) return r;
  if (s) return s; // fallback
  return "";
});

const subrubroLabelFinal = computed(() => {
  const r = String(rubroLabelComputed.value || "").trim();
  const s = String(subrubroLabelComputed.value || "").trim();
  if (!r && s) return ""; // evitamos duplicar
  return s;
});

/* =========================
   Marca / Modelo fallbacks
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
   On open
========================= */
watch(
  () => props.open,
  async (v) => {
    if (!v) return;

    paymentMethod.value = "CASH";
    installments.value = 1;
    applyReseller.value = false;

    if (!props.rubroLabel && !props.subrubroLabel && !(cats.value || []).length) {
      await loadCategoriesSafe();
    }
  }
);

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
</script>

<style scoped>
.pdd-root {
  overflow: hidden;
}
.pdd-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
}
.pdd-body {
  padding: 16px;
}
.pdd-panel {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  background: rgba(var(--v-theme-surface), 0.92);
}
.border {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
}
.strike {
  text-decoration: line-through;
  opacity: 0.8;
}
.off {
  color: rgb(var(--v-theme-success));
  font-weight: 900;
}
</style>