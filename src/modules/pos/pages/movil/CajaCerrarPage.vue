<!--
  Cerrar caja (arqueo) en el teléfono (maqueta pantalla 13). Reemplaza en el
  teléfono a PosCajaArqueoDialog, que a 390 px dejaba la columna del efectivo
  en unos 16 px (QA B3). Mismo cierre que el escritorio: declarado = efectivo
  contado; la API registra la diferencia contra lo esperado.
-->
<template>
  <MovilVista :titulo="`Cerrar caja #${currentCashRegisterId || ''}`" :volver="{ name: 'caja' }">
    <div v-if="!cargado" class="m-vacio">Cargando…</div>
    <template v-else>
      <div class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
        <dt>Debería haber</dt><dd class="f num">{{ pesos(t.esperado) }}</dd>
        <dt>Ventas</dt><dd class="num">{{ t.ventas }}</dd>
        <dt>Facturado</dt><dd class="num">{{ pesos(t.facturado) }}</dd>
        <dt>Fondo inicial</dt><dd class="num">{{ pesos(t.fondo) }}</dd>
      </dl></div></div>

      <div class="m-cmp">
        <label for="cc-contado">Efectivo contado</label>
        <div class="m-inpw grande">
          <span class="pre">$</span>
          <input id="cc-contado" class="m-inp grande num" inputmode="decimal" :value="contadoTxt" @input="onContado" />
        </div>
      </div>

      <div class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
        <dt>Diferencia</dt>
        <dd class="f num" :class="diferencia === 0 ? 'm-dif-ok' : 'm-dif-neg'">{{ difTxt }}</dd>
      </dl></div></div>

      <div v-if="diferencia !== 0" class="m-cmp">
        <label for="cc-motivo">Motivo de la diferencia</label>
        <textarea id="cc-motivo" v-model="motivo" class="m-inp" maxlength="240"></textarea>
      </div>

      <div class="m-pz">
        <div class="m-pz-h"><h3>Cobrado en el turno</h3><span class="num">{{ t.ventas === 1 ? "1 venta" : `${t.ventas} ventas` }}</span></div>
        <div class="m-pz-b">
          <div v-if="!cobrado.length" class="m-sub">Sin cobros</div>
          <div v-for="f in cobrado" :key="f.key" class="m-fila">
            <div class="l"><b>{{ f.label }}<small v-if="f.count">{{ f.count }} {{ f.count === 1 ? "venta" : "ventas" }}</small></b><span class="num">{{ pesos(f.total) }}</span></div>
            <div class="m-barra"><s :style="{ width: f.pct + '%' }"></s></div>
          </div>
        </div>
      </div>
      <div v-if="error" class="m-error">{{ error }}</div>
    </template>

    <template #pie>
      <button type="button" class="m-btn" :disabled="!cargado || cerrando || !isCajaOpen" @click="cerrar">
        <v-progress-circular v-if="cerrando" indeterminate size="22" width="3" />
        <template v-else>Cerrar la caja</template>
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
import { totalesCaja, cobradoEnElTurno } from "../../utils/cajaResumen";
import { pesos } from "../../utils/cobroReglas";

const router = useRouter();
const flow = usePosSalesFlow();
const { isCajaOpen, currentCashRegisterId, summary, refreshCaja, closeCaja, toast } = flow;

const cargado = ref(false);
const cerrando = ref(false);
const error = ref("");
const contadoTxt = ref("");
const motivo = ref("");

const t = computed(() => totalesCaja(summary.value));
const cobrado = computed(() => cobradoEnElTurno(summary.value));
const contado = computed(() => montoANumero(contadoTxt.value));
const diferencia = computed(() => Math.round((contado.value - t.value.esperado) * 100) / 100);
const difTxt = computed(() => (diferencia.value > 0 ? `+ ${pesos(diferencia.value)}` : pesos(diferencia.value)));

function onContado(e) {
  contadoTxt.value = formatearMonto(e.target.value);
  e.target.value = contadoTxt.value;
}

async function cerrar() {
  if (cerrando.value) return;
  cerrando.value = true;
  error.value = "";
  const id = currentCashRegisterId.value;
  try {
    const m = motivo.value.trim();
    await closeCaja({
      closing_cash: contado.value,
      closing_note: diferencia.value !== 0 && m ? `Motivo de la diferencia: ${m}` : "Cierre de caja",
    });
    await refreshCaja().catch(() => {});
    window.dispatchEvent(new CustomEvent("pos:caja-cambio"));
    toast(`Caja #${id} cerrada`);
    router.replace({ name: "caja" });
  } catch (e) {
    error.value = e?.message || "La caja no se cerró";
  } finally {
    cerrando.value = false;
  }
}

onMounted(async () => {
  await flow.initOnce?.();
  await refreshCaja({ withSummary: true }).catch(() => {});
  if (!isCajaOpen.value) {
    router.replace({ name: "caja" });
    return;
  }
  // Como el escritorio: arranca con lo esperado, para confirmar o corregir.
  contadoTxt.value = formatearMonto(String(t.value.esperado).replace(".", ","));
  cargado.value = true;
});
</script>
