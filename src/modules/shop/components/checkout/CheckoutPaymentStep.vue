<!-- src/modules/shop/components/checkout/CheckoutPaymentStep.vue -->
<!-- ✅ COPY-PASTE FINAL COMPLETO
     Cards ML + animaciones
     Métodos: MERCADO_PAGO | TRANSFER | CASH | AGREE | CREDIT_SJT
-->
<template>
  <div class="ml-step">
    <div class="ml-step-head">
      <div class="ml-step-title">Pago</div>
      <div class="ml-step-sub">Elegí cómo querés pagar.</div>
    </div>

    <div class="ml-pay-grid">
      <!-- Mercado Pago -->
      <button
        class="ml-pay-card"
        type="button"
        :class="{ 'is-active': local.method === 'MERCADO_PAGO', 'is-disabled': !mpEnabled }"
        :disabled="!mpEnabled"
        @click="setPay('MERCADO_PAGO')"
      >
        <div class="ml-pay-left">
          <div class="ml-pay-ico mp" :class="{ 'is-anim mp': local.method === 'MERCADO_PAGO' }">
            <v-icon size="18">mdi-credit-card-outline</v-icon>
          </div>
          <div class="ml-pay-txt">
            <div class="ml-pay-title">
              Mercado Pago <span class="ml-chip ml-chip-blue">Recomendado</span>
            </div>
            <div class="ml-pay-desc">Tarjeta, débito, QR o saldo. Te redirigimos para pagar seguro.</div>
            <div v-if="!mpEnabled" class="ml-pay-warn">No disponible: falta configuración en el servidor.</div>
          </div>
        </div>
        <v-icon class="ml-pay-arrow" size="18">mdi-chevron-right</v-icon>
      </button>

      <!-- Transferencia -->
      <button
        class="ml-pay-card"
        type="button"
        :class="{ 'is-active': local.method === 'TRANSFER' }"
        @click="setPay('TRANSFER')"
      >
        <div class="ml-pay-left">
          <div class="ml-pay-ico bank" :class="{ 'is-anim bank': local.method === 'TRANSFER' }">
            <v-icon size="18">mdi-bank-outline</v-icon>
          </div>
          <div class="ml-pay-txt">
            <div class="ml-pay-title">
              Transferencia <span class="ml-chip ml-chip-gray">Manual</span>
            </div>
            <div class="ml-pay-desc">Te mostramos alias/CBU. Podés pegar comprobante (opcional).</div>
          </div>
        </div>
        <v-icon class="ml-pay-arrow" size="18">mdi-chevron-right</v-icon>
      </button>

      <!-- Efectivo -->
      <button
        class="ml-pay-card"
        type="button"
        :class="{ 'is-active': local.method === 'CASH' }"
        @click="setPay('CASH')"
      >
        <div class="ml-pay-left">
          <div class="ml-pay-ico cash" :class="{ 'is-anim cash': local.method === 'CASH' }">
            <v-icon size="18">mdi-cash-multiple</v-icon>
          </div>
          <div class="ml-pay-txt">
            <div class="ml-pay-title">Efectivo</div>
            <div class="ml-pay-desc">Pagás al retirar en sucursal o al recibir (según modalidad).</div>
          </div>
        </div>
        <v-icon class="ml-pay-arrow" size="18">mdi-chevron-right</v-icon>
      </button>

      <!-- Crédito San Juan Tecnología -->
      <button
        class="ml-pay-card"
        type="button"
        :class="{ 'is-active': local.method === 'CREDIT_SJT' }"
        @click="setPay('CREDIT_SJT')"
      >
        <div class="ml-pay-left">
          <div class="ml-pay-ico credit" :class="{ 'is-anim credit': local.method === 'CREDIT_SJT' }">
            <v-icon size="18">mdi-file-document-outline</v-icon>
          </div>
          <div class="ml-pay-txt">
            <div class="ml-pay-title">
              Crédito San Juan Tecnología <span class="ml-chip ml-chip-amber">En tienda</span>
            </div>
            <div class="ml-pay-desc">
              Reservás el pedido y finalizás el crédito presencialmente.
            </div>
          </div>
        </div>
        <v-icon class="ml-pay-arrow" size="18">mdi-chevron-right</v-icon>
      </button>

      <!-- Acordar -->
      <button
        class="ml-pay-card"
        type="button"
        :class="{ 'is-active': local.method === 'AGREE' }"
        @click="setPay('AGREE')"
      >
        <div class="ml-pay-left">
          <div class="ml-pay-ico agree" :class="{ 'is-anim agree': local.method === 'AGREE' }">
            <v-icon size="18">mdi-handshake-outline</v-icon>
          </div>
          <div class="ml-pay-txt">
            <div class="ml-pay-title">
              Acordar pago con el vendedor <span class="ml-chip ml-chip-gray">Coordinar</span>
            </div>
            <div class="ml-pay-desc">Coordinamos el método (seña, contado, cuotas propias, etc.).</div>
          </div>
        </div>
        <v-icon class="ml-pay-arrow" size="18">mdi-chevron-right</v-icon>
      </button>
    </div>

    <!-- Panel contextual: Transfer -->
    <div class="ml-pay-panel" v-if="local.method === 'TRANSFER'">
      <div class="ml-panel-title">Datos bancarios</div>

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
    </div>

    <!-- Panel contextual: Crédito SJT -->
    <div class="ml-pay-panel" v-else-if="local.method === 'CREDIT_SJT'">
      <div class="ml-panel-title">Crédito San Juan Tecnología</div>
      <div class="ml-panel-sub">
        Para completar el crédito, debés presentarte en la tienda con:
      </div>

      <ul class="ml-req">
        <li><b>DNI</b> (titular) + fotocopia</li>
        <li><b>Comprobante de ingresos</b> (recibo de sueldo / monotributo / etc.)</li>
        <li><b>Servicio a tu nombre</b> o constancia de domicilio</li>
        <li><b>Teléfono de contacto</b> y email</li>
      </ul>

      <v-alert type="info" variant="tonal" class="rounded-lg mt-2">
        Este pedido queda <b>reservado</b> y se confirma cuando se apruebe el crédito en tienda.
      </v-alert>

      <v-textarea
        v-model="local.note"
        label="Nota (opcional)"
        variant="outlined"
        density="comfortable"
        rows="3"
        class="mt-3"
      />
    </div>

    <!-- Panel contextual: Acordar -->
    <div class="ml-pay-panel" v-else-if="local.method === 'AGREE'">
      <div class="ml-panel-title">Acordar con vendedor</div>
      <div class="ml-panel-sub">
        Te vamos a contactar para coordinar. Podés dejar una nota si querés.
      </div>

      <v-textarea
        v-model="local.note"
        label="Nota (opcional)"
        variant="outlined"
        density="comfortable"
        rows="3"
        class="mt-3"
      />
    </div>

    <!-- Panel contextual: MP -->
    <div class="ml-pay-panel" v-else-if="local.method === 'MERCADO_PAGO'">
      <div class="ml-panel-title">Mercado Pago</div>
      <div class="ml-panel-sub">
        Al confirmar te redirigimos a Mercado Pago para completar el pago de forma segura.
      </div>
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
    type: Object,
    default: () => ({ method: "MERCADO_PAGO", reference: "", note: "" }),
  },
  mpEnabled: { type: Boolean, default: false },
  transfer: {
    type: Object,
    default: () => ({ alias: "", cbu: "", holder: "" }),
  },
});

const emit = defineEmits(["update:modelValue", "prev", "next"]);

const local = reactive({
  method: props.modelValue?.method || "MERCADO_PAGO",
  reference: props.modelValue?.reference || "",
  note: props.modelValue?.note || "",
});

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    local.method = v.method || local.method;
    local.reference = v.reference || "";
    local.note = v.note || "";
  },
  { deep: true }
);

watch(
  () => ({ method: local.method, reference: local.reference, note: local.note }),
  (v) => emit("update:modelValue", v),
  { deep: true }
);

function setPay(m) {
  if (m === "MERCADO_PAGO" && !props.mpEnabled) return;
  local.method = m;

  // limpieza suave
  if (m !== "TRANSFER") local.reference = "";
  if (m !== "AGREE" && m !== "CREDIT_SJT") local.note = "";
}

const canContinue = computed(() => {
  if (!local.method) return false;
  if (local.method === "MERCADO_PAGO" && !props.mpEnabled) return false;
  return true;
});
</script>

<style scoped>
.ml-step-head { margin-bottom: 14px; }
.ml-step-title { font-weight: 800; font-size: 18px; }
.ml-step-sub { color: #737373; font-size: 13px; margin-top: 2px; }

.ml-pay-grid { display: grid; gap: 10px; }

.ml-pay-card {
  width: 100%;
  border: 1px solid #e6e6e6;
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.12s ease;
}
.ml-pay-card:hover { border-color: #cfcfcf; transform: translateY(-1px); }
.ml-pay-card.is-active {
  border-color: #3483fa;
  box-shadow: 0 0 0 3px rgba(52, 131, 250, 0.15);
  transform: translateY(-1px);
}
.ml-pay-card.is-disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

.ml-pay-left { display: flex; gap: 10px; min-width: 0; align-items: flex-start; }

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
.ml-pay-ico.agree { background: rgba(0, 0, 0, 0.06); }
.ml-pay-ico.credit { background: rgba(255, 147, 0, 0.14); }

/* Animaciones */
.is-anim.mp { animation: mpPulse 1.25s ease-in-out infinite; }
.is-anim.bank { animation: bankWiggle 1.25s ease-in-out infinite; }
.is-anim.cash { animation: cashBounce 1.15s ease-in-out infinite; }
.is-anim.agree { animation: agreePop 1.35s ease-in-out infinite; }
.is-anim.credit { animation: creditPulse 1.25s ease-in-out infinite; }

@keyframes mpPulse { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
@keyframes bankWiggle { 0%{transform:rotate(0)} 35%{transform:rotate(-6deg)} 70%{transform:rotate(6deg)} 100%{transform:rotate(0)} }
@keyframes cashBounce { 0%{transform:translateY(0)} 50%{transform:translateY(-2px)} 100%{transform:translateY(0)} }
@keyframes agreePop { 0%{transform:scale(1)} 40%{transform:scale(1.08)} 100%{transform:scale(1)} }
@keyframes creditPulse { 0%{transform:scale(1)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }

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
.ml-pay-desc { margin-top: 3px; font-size: 12.5px; color: #737373; line-height: 1.25; }
.ml-pay-warn { margin-top: 6px; font-size: 12px; color: #b45309; }

.ml-pay-arrow { color: #9b9b9b; flex: 0 0 auto; }

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
  border-radius: 10px;
  padding: 12px;
  margin-top: 12px;
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

.ml-req {
  margin: 8px 0 0;
  padding-left: 18px;
  font-size: 13px;
  color: #333;
}
.ml-req li { margin: 6px 0; }

.ml-actions {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}
.ml-cta { border-radius: 10px; text-transform: none; font-weight: 900; }

@media (max-width: 600px) {
  .ml-panel-grid { grid-template-columns: 1fr; }
  .ml-actions { flex-direction: column; align-items: stretch; }
}
</style>
