<template>
  <v-dialog v-model="openLocal" max-width="980">
    <v-card rounded="xl" class="pdd-root">
      <!-- HEADER -->
      <div class="pdd-head">
        <div>
          <div class="text-h6 font-weight-black">Detalle producto</div>
          <div class="text-caption text-medium-emphasis">
            SKU: {{ item?.sku || item?.code || "—" }} · Stock: <b>{{ qty3(item?.qty ?? 0) }}</b>
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
          <!-- LEFT: Imagen + data -->
          <v-col cols="12" md="5">
            <v-card class="rounded-xl pa-3 pdd-panel" elevation="0">
              <v-avatar rounded="xl" size="220" class="border mb-3">
                <v-img v-if="image" :src="image" cover />
                <v-icon v-else size="56">mdi-package-variant</v-icon>
              </v-avatar>

              <div class="text-h6 font-weight-black">{{ item?.name || "—" }}</div>

              <div class="mt-2">
                <div class="text-caption text-medium-emphasis">
                  Rubro: <b>{{ rubroLabel || "—" }}</b>
                </div>
                <div class="text-caption text-medium-emphasis">
                  Subrubro: <b>{{ subrubroLabel || "—" }}</b>
                </div>
              </div>

              <div class="mt-2">
                <div class="text-caption text-medium-emphasis">Marca: <b>{{ item?.brand || "—" }}</b></div>
                <div class="text-caption text-medium-emphasis">Modelo: <b>{{ item?.model || "—" }}</b></div>
              </div>

              <v-divider class="my-3" />

              <!-- Precio rápido -->
              <div class="d-flex align-center justify-space-between">
                <div>
                  <div class="text-caption text-medium-emphasis">Precio descuento (1 pago)</div>
                  <div class="text-h6 font-weight-black">{{ money(priceDiscount) }}</div>
                </div>

                <div v-if="hasDiscount" class="text-right">
                  <div class="text-caption text-medium-emphasis">Precio lista</div>
                  <div class="text-subtitle-1 font-weight-bold">
                    <span class="strike">{{ money(priceList) }}</span>
                    <span class="ml-2 off">{{ offPct }}% OFF</span>
                  </div>
                </div>
              </div>
            </v-card>
          </v-col>

          <!-- RIGHT: Simulador pago -->
          <v-col cols="12" md="7">
            <v-card class="rounded-xl pa-4 pdd-panel" elevation="0">
              <div class="d-flex align-center justify-space-between">
                <div class="text-subtitle-1 font-weight-black">Opciones de pago</div>
                <v-chip size="small" variant="tonal">{{ pricePolicyLabel(currentPolicy) }}</v-chip>
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

              <!-- ✅ Resultado calculado -->
              <v-alert type="info" variant="tonal">
                <div class="d-flex flex-wrap align-center justify-space-between ga-3">
                  <div>
                    <div class="text-caption text-medium-emphasis">Precio unitario</div>
                    <div class="text-h6 font-weight-black">{{ money(unitPrice) }}</div>
                  </div>

                  <div v-if="showInstallmentBreakdown" class="text-right">
                    <div class="text-caption text-medium-emphasis">
                      {{ installments }} cuotas de
                    </div>
                    <div class="text-h6 font-weight-black">{{ money(perInstallment) }}</div>
                  </div>
                </div>
              </v-alert>

              <div class="text-caption text-medium-emphasis mt-3">
                Política aplicada: <b>{{ pricePolicyLabel(currentPolicy) }}</b>
              </div>
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
          :title="!canSell ? 'El usuario admin no puede vender' : ''"
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

const props = defineProps({
  open: { type: Boolean, default: false },
  canSell: { type: Boolean, default: true },

  item: { type: Object, default: null },
  image: { type: String, default: "" },
  rubroLabel: { type: String, default: "" },
  subrubroLabel: { type: String, default: "" },

  // precios del producto
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

function toNum(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function money(val) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(Number(val || 0));
}
function qty3(n) {
  return Number(n || 0).toFixed(3);
}

const hasDiscount = computed(() => {
  const l = toNum(props.priceList);
  const d = toNum(props.priceDiscount);
  return l > 0 && d > 0 && d < l;
});

const offPct = computed(() => {
  const l = toNum(props.priceList);
  const d = toNum(props.priceDiscount);
  if (!(l > 0 && d > 0 && d < l)) return 0;
  return Math.round(((l - d) / l) * 100);
});

function currentPolicy() {
  const res = toNum(props.priceReseller);
  if (applyReseller.value && res > 0) return "RESELLER";

  if (paymentMethod.value === "CARD") {
    const k = Number(installments.value || 1);
    return k > 1 ? "LIST" : "DISCOUNT";
  }
  // CASH / TRANSFER / QR -> descuento
  return "DISCOUNT";
}

function pricePolicyLabel(pol) {
  if (pol === "RESELLER") return "Revendedor";
  if (pol === "LIST") return "Lista";
  return "Descuento";
}

function resolveUnitPrice(policy) {
  const list = toNum(props.priceList);
  const disc = toNum(props.priceDiscount);
  const res = toNum(props.priceReseller);

  if (policy === "RESELLER") return res > 0 ? res : disc > 0 ? disc : list;
  if (policy === "DISCOUNT") return disc > 0 ? disc : list;
  return list > 0 ? list : disc;
}

const currentPolicyComputed = computed(() => currentPolicy());

const unitPrice = computed(() => resolveUnitPrice(currentPolicyComputed.value));

const showInstallmentBreakdown = computed(() => {
  return paymentMethod.value === "CARD" && !applyReseller.value && Number(installments.value || 1) > 1;
});

const perInstallment = computed(() => {
  const k = Number(installments.value || 1);
  if (!(k > 1)) return 0;
  return unitPrice.value / k;
});

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    // default “detalle”: arrancar en descuento 1 pago
    paymentMethod.value = "CASH";
    installments.value = 1;
    applyReseller.value = false;
  }
);

function onAdd() {
  emit("add", {
    paymentMethod: paymentMethod.value,
    installments: Number(installments.value || 1),
    applyReseller: Boolean(applyReseller.value),
    price_policy: currentPolicyComputed.value,
    unit_price: Number(unitPrice.value || 0),
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
