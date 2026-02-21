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

              <v-alert
                v-if="legacyStatus === 'error'"
                type="warning"
                variant="tonal"
                class="mt-2"
              >
                No pude cargar subcategorías legacy (tabla subcategories).
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
                * Tarjeta: 1 pago = descuento · 2 a 6 cuotas = lista · Revendedor (si existe) pisa todo.
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

              <v-alert type="info" variant="tonal">
                <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                  <div>
                    <div class="text-caption text-medium-emphasis">Precio unitario</div>
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

              <v-alert v-if="unitPrice <= 0" type="warning" variant="tonal" class="mt-3">
                Este producto no tiene precio válido (lista/descuento/base). No se puede agregar.
              </v-alert>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-btn variant="tonal" @click="openLocal = false">Cerrar</v-btn>
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

  // si el padre te pasa labels, se respetan
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
   SUBCATEGORIES LEGACY (tabla subcategories)
   ✅ solo se usa si detectamos legacy IDs como 47/48
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
    { url: "/subcategories", params: { limit: 5000 } },      // ✅ si existe
    { url: "/subcategories", params: { page: 1, limit: 5000 } },
    { url: "/subcategories", params: undefined },
    { url: "/admin/subcategories", params: { limit: 5000 } }, // ✅ fallback típico
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

function isLegacySubId(id) {
  if (!id) return false;
  // si no existe en categories pero existe en legacy => legacy
  return !catById.value.get(id) && !!legacyById.value.get(id);
}

/* =========================
   Derivación rubro/subrubro (compat)
========================= */
const derived = computed(() => {
  const p = props.item || {};
  const catId = toInt(p?.category_id || p?.category?.id, 0) || null;
  const subId = toInt(p?.subcategory_id || p?.subcategory?.id, 0) || null;

  // Caso normal: subId apunta a categories (nuevo)
  if (subId && catById.value.get(subId)) {
    const sub = catById.value.get(subId);
    const rubroId = toInt(sub?.parent_id, 0) || catId || null; // parent manda, sino category_id
    return {
      rubroId,
      subId,
      rubroName: catById.value.get(rubroId || 0)?.name || "",
      subName: sub?.name || "",
    };
  }

  // Caso legacy: subId apunta a subcategories (viejo)
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
  if (s) return s; // fallback visual
  return "";
});

const subrubroLabelFinal = computed(() => {
  const r = String(rubroLabelComputed.value || "").trim();
  const s = String(subrubroLabelComputed.value || "").trim();
  if (!r && s) return ""; // evitamos duplicar
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
   On open: carga cats + legacy si hace falta
========================= */
watch(
  () => props.open,
  async (v) => {
    if (!v) return;

    paymentMethod.value = "CASH";
    installments.value = 1;
    applyReseller.value = false;

    // siempre intentamos categories (nuevo)
    if (!(cats.value || []).length) await loadCategoriesSafe();

    // si subcategory_id no existe en categories, intentamos legacy
    const subId = toInt(props.item?.subcategory_id || props.item?.subcategory?.id, 0) || null;
    if (subId && !catById.value.get(subId)) {
      await loadLegacySubcategoriesSafe();
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