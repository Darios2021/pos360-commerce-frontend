<!--
  Movimiento de caja en el teléfono (maqueta pantalla 14). Reemplaza en el
  teléfono a PosMovimientosDialog (F10 del mostrador, que no cambia). Mismos
  motivos y mismo pedido a la API.
-->
<template>
  <MovilVista titulo="Movimiento de caja" :volver="{ name: 'caja' }">
    <div class="m-seg" role="tablist">
      <button type="button" role="tab" :class="{ on: tipo === 'OUT' }" :aria-selected="tipo === 'OUT'" @click="tipo = 'OUT'">Egreso</button>
      <button type="button" role="tab" :class="{ on: tipo === 'IN' }" :aria-selected="tipo === 'IN'" @click="tipo = 'IN'">Ingreso</button>
    </div>

    <div class="m-cmp">
      <label for="cm-imp">Importe</label>
      <div class="m-inpw grande">
        <span class="pre">$</span>
        <input id="cm-imp" class="m-inp grande num" inputmode="decimal" :value="importeTxt" @input="onImporte" />
      </div>
    </div>

    <div class="m-rot">Motivo</div>
    <div class="m-ops">
      <button v-for="m in MOTIVOS" :key="m" type="button" class="m-op" :class="{ on: motivo === m }" @click="elegir(m)">
        <span class="tx"><b>{{ m }}</b></span><span class="rd"></span>
      </button>
    </div>
    <div class="m-cmp">
      <label for="cm-otro">Otro motivo</label>
      <input id="cm-otro" v-model="otro" class="m-inp" maxlength="120" placeholder="Opcional" @input="motivo = ''" />
    </div>
    <div v-if="error" class="m-error">{{ error }}</div>

    <template #pie>
      <button type="button" class="m-btn" :disabled="guardando || !puede" @click="registrar">
        <v-progress-circular v-if="guardando" indeterminate size="22" width="3" />
        <span v-else class="num">{{ `Registrar ${tipo === "IN" ? "ingreso" : "egreso"} de ${pesos(importe)}` }}</span>
      </button>
    </template>
  </MovilVista>
  <MovilAviso />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { usePosSalesFlow } from "../../containers/usePosSalesFlow";
import { formatearMonto, montoANumero } from "../../utils/montoTexto";
import { pesos } from "../../utils/cobroReglas";

// Los mismos de PosMovimientosDialog.
const MOTIVOS = ["Pago a proveedor", "Retiro de efectivo", "Gastos del local", "Cambio para la caja", "Depósito"];

const router = useRouter();
const flow = usePosSalesFlow();
const { isCajaOpen, refreshCaja, addMovement, toast } = flow;

const tipo = ref("OUT");
const importeTxt = ref("");
const motivo = ref(MOTIVOS[0]);
const otro = ref("");
const guardando = ref(false);
const error = ref("");

const importe = computed(() => montoANumero(importeTxt.value));
const motivoFinal = computed(() => (otro.value.trim() || motivo.value || "").trim());
const puede = computed(() => importe.value > 0 && !!motivoFinal.value);

function onImporte(e) {
  importeTxt.value = formatearMonto(e.target.value);
  e.target.value = importeTxt.value;
}
function elegir(m) {
  motivo.value = m;
  otro.value = "";
}

async function registrar() {
  if (guardando.value || !puede.value) return;
  guardando.value = true;
  error.value = "";
  try {
    await addMovement({ type: tipo.value, amount: importe.value, reason: motivoFinal.value, note: null });
    window.dispatchEvent(new CustomEvent("pos:caja-cambio"));
    toast(tipo.value === "IN" ? "Ingreso registrado" : "Egreso registrado");
    router.replace({ name: "caja" });
  } catch (e) {
    error.value = e?.message || "El movimiento no se registró";
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  await flow.initOnce?.();
  if (!isCajaOpen.value) await refreshCaja().catch(() => {});
  if (!isCajaOpen.value) router.replace({ name: "caja" });
});
</script>
