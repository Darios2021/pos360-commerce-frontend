<!-- src/modules/shop/components/checkout/CheckoutPaymentStep.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     - ✅ Minimal: card = titulo + chip (sin descripción adentro)
     - ✅ Panel de detalle aparece JUSTO debajo del método seleccionado
     - ✅ Elimina "Acordar pago con el vendedor"
     - ✅ DB-first: method_code => mercadopago | transfer | cash | credit_sjt
-->

<template>
  <div class="ml-step">
    <div class="ml-step-head">
      <div class="ml-step-title">Pago</div>
      <div class="ml-step-sub">Elegí cómo querés pagar.</div>
    </div>

    <div class="ml-pay-grid">
      <template v-for="m in methods" :key="m.code">
        <!-- Card -->
        <button
          class="ml-pay-card"
          type="button"
          :class="{
            'is-active': local.method_code === m.code,
            'is-disabled': m.code === 'mercadopago' && !mpEnabled,
          }"
          :disabled="m.code === 'mercadopago' && !mpEnabled"
          @click="setPay(m.code)"
        >
          <div class="ml-pay-left">
            <div class="ml-pay-ico" :class="m.icoClass">
              <v-icon size="18">{{ m.icon }}</v-icon>
            </div>

            <div class="ml-pay-txt">
              <div class="ml-pay-title">
                {{ m.title }}
                <span v-if="m.chip" class="ml-chip" :class="m.chipClass">{{ m.chip }}</span>
              </div>

              <!-- ✅ NO descripción adentro (minimal) -->
              <div v-if="m.code === 'mercadopago' && !mpEnabled" class="ml-pay-warn">
                No disponible: falta configuración en el servidor.
              </div>
            </div>
          </div>

          <v-icon class="ml-pay-arrow" size="18">mdi-chevron-right</v-icon>
        </button>

        <!-- ✅ Panel contextual JUSTO debajo -->
        <v-expand-transition>
          <div v-if="local.method_code === m.code" class="ml-pay-panel">
            <!-- MERCADO PAGO -->
            <template v-if="m.code === 'mercadopago'">
              <div class="ml-panel-title">Mercado Pago</div>
              <div class="ml-panel-sub">
                Tarjeta, débito, QR o saldo. Al confirmar te redirigimos a Mercado Pago para completar el pago de forma segura.
              </div>
            </template>

            <!-- TRANSFER -->
            <template v-else-if="m.code === 'transfer'">
              <div class="ml-panel-title">Transferencia</div>
              <div class="ml-panel-sub">Te mostramos alias/CBU. Podés pegar comprobante (opcional).</div>

              <div class="ml-panel-grid">
                <div class="ml-kv">
                  <div class="k">Alias</div>
                  <div class="v">{{ transfer.alias || "—" }}</div>
                </div>
                <div class="ml-kv">
                  <div class="k">CBU</div>
                  <div class="v">{{ transfer.cbu || "—" }}</div>
                </div>
                <div class="ml-kv">
                  <div class="k">Titular</div>
                  <div class="v">{{ transfer.holder || "—" }}</div>
                </div>
              </div>

              <v-text-field
                v-model="local.reference"
                label="Referencia / Comprobante (opcional)"
                variant="outlined"
                density="comfortable"
                class="mt-3"
              />
            </template>

            <!-- CASH -->
            <template v-else-if="m.code === 'cash'">
              <div class="ml-panel-title">Efectivo</div>
              <div class="ml-panel-sub">Confirmás el pedido y pagás en efectivo al momento del retiro o entrega.</div>
            </template>

            <!-- CREDIT -->
            <template v-else-if="m.code === 'credit_sjt'">
              <div class="ml-panel-title">Crédito en tienda</div>
              <div class="ml-panel-sub">Reservás el pedido online y completás el crédito presencialmente en la sucursal.</div>
            </template>
          </div>
        </v-expand-transition>
      </template>
    </div>

    <div class="ml-actions">
      <v-btn variant="tonal" @click="$emit('prev')">
        <v-icon start>mdi-arrow-left</v-icon>
        Volver
      </v-btn>

      <v-btn color="primary" class="ml-cta" :disabled="!canContinue" @click="$emit('next')">
        Continuar
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, watch } from "vue";

const props = defineProps({
  modelValue: {
    // ✅ DB-first: { method_code, reference }
    type: Object,
    default: () => ({ method_code: "mercadopago", reference: "" }),
  },
  mpEnabled: { type: Boolean, default: false },
  transfer: { type: Object, default: () => ({ alias: "", cbu: "", holder: "" }) },
});

const emit = defineEmits(["update:modelValue", "prev", "next"]);

function toStr(v) {
  return String(v ?? "").trim();
}

function normalizeCode(v) {
  const s = toStr(v).toLowerCase();

  // compat viejo (por si algo todavía manda method)
  if (s === "mercado_pago" || s === "mercadopago") return "mercadopago";
  if (s === "transfer") return "transfer";
  if (s === "cash") return "cash";
  if (s === "credit_sjt") return "credit_sjt";
  return "";
}

const local = reactive({
  method_code: normalizeCode(props.modelValue?.method_code) || "mercadopago",
  reference: toStr(props.modelValue?.reference),
});

// si MP está off y estaba seleccionado, caemos a transfer
watch(
  () => props.mpEnabled,
  (on) => {
    if (!on && local.method_code === "mercadopago") local.method_code = "transfer";
  },
  { immediate: true }
);

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    const nextCode = normalizeCode(v.method_code) || local.method_code;
    local.method_code = nextCode;
    local.reference = toStr(v.reference);
  },
  { deep: true }
);

watch(
  () => ({ method_code: local.method_code, reference: local.reference }),
  (v) => emit("update:modelValue", v),
  { deep: true }
);

const methods = computed(() => [
  {
    code: "mercadopago",
    title: "Mercado Pago",
    chip: "Recomendado",
    chipClass: "ml-chip-blue",
    icon: "mdi-credit-card-outline",
    icoClass: "mp",
  },
  {
    code: "transfer",
    title: "Transferencia",
    chip: "Manual",
    chipClass: "ml-chip-gray",
    icon: "mdi-bank-outline",
    icoClass: "bank",
  },
  {
    code: "cash",
    title: "Efectivo",
    chip: null,
    chipClass: "",
    icon: "mdi-cash-multiple",
    icoClass: "cash",
  },
  {
    code: "credit_sjt",
    title: "Crédito San Juan Tecnología",
    chip: "En tienda",
    chipClass: "ml-chip-amber",
    icon: "mdi-file-document-outline",
    icoClass: "credit",
  },
]);

function setPay(code) {
  if (code === "mercadopago" && !props.mpEnabled) return;
  local.method_code = code;

  // limpieza suave
  if (code !== "transfer") local.reference = "";
}

const canContinue = computed(() => {
  if (!local.method_code) return false;
  if (local.method_code === "mercadopago" && !props.mpEnabled) return false;
  return true;
});
</script>

<style scoped>
/* ✅ ancho real */
.ml-step {
  width: 100%;
  max-width: none;
}

.ml-step-head {
  margin-bottom: 14px;
}
.ml-step-title {
  font-weight: 800;
  font-size: 18px;
}
.ml-step-sub {
  color: #737373;
  font-size: 13px;
  margin-top: 2px;
}

.ml-pay-grid {
  display: grid;
  gap: 10px;
  width: 100%;
}

.ml-pay-card {
  width: 100%;
  border: 1px solid #e6e6e6;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
}
.ml-pay-card:hover {
  border-color: #cfcfcf;
  transform: translateY(-1px);
}
.ml-pay-card.is-active {
  border-color: #3483fa;
  box-shadow: 0 0 0 3px rgba(52, 131, 250, 0.15);
  transform: translateY(-1px);
}
.ml-pay-card.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.ml-pay-left {
  display: flex;
  gap: 10px;
  min-width: 0;
  align-items: center;
}

.ml-pay-ico {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}
.ml-pay-ico.mp { background: rgba(52, 131, 250, 0.12); }
.ml-pay-ico.bank { background: rgba(0, 0, 0, 0.06); }
.ml-pay-ico.cash { background: rgba(0, 166, 80, 0.12); }
.ml-pay-ico.credit { background: rgba(255, 147, 0, 0.14); }

.ml-pay-txt { min-width: 0; }
.ml-pay-title {
  font-weight: 900;
  font-size: 14px;
  color: #111;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ml-pay-warn {
  margin-top: 4px;
  font-size: 12px;
  color: #b45309;
}

.ml-pay-arrow {
  color: #9b9b9b;
  flex: 0 0 auto;
}

.ml-chip {
  font-size: 11px;
  font-weight: 900;
  padding: 3px 8px;
  border-radius: 999px;
  line-height: 1;
}
.ml-chip-blue { background: rgba(52, 131, 250, 0.12); color: #2968c8; }
.ml-chip-gray { background: rgba(0, 0, 0, 0.06); color: #444; }
.ml-chip-amber { background: rgba(255, 147, 0, 0.18); color: #8a4b00; }

.ml-pay-panel {
  border: 1px solid #e6e6e6;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
}

.ml-panel-title { font-weight: 900; font-size: 14px; margin-bottom: 6px; }
.ml-panel-sub { color: #737373; font-size: 13px; }

.ml-panel-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}
.ml-kv .k { font-size: 12px; color: #737373; }
.ml-kv .v { font-size: 13.5px; font-weight: 900; color: #111; word-break: break-word; }

.ml-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}
.ml-cta {
  border-radius: 10px;
  text-transform: none;
  font-weight: 900;
}

@media (max-width: 600px) {
  .ml-panel-grid { grid-template-columns: 1fr; }
  .ml-actions { flex-direction: column; align-items: stretch; }
}
</style>
