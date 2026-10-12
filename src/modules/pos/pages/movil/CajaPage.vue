<!--
  Caja en el teléfono (maqueta pantalla 11). Reemplaza la hoja "Estado de
  caja" de PosMobileLayout. Abierta: esperado y su desglose con "Cerrar caja",
  cobrado en el turno en filas y movimientos con "Registrar movimiento".
  Cerrada: último cierre, su diferencia y "Abrir caja".
-->
<template>
  <div class="cj m-vista">
    <div v-if="cargando && !cargado" class="m-vacio">Cargando…</div>

    <template v-else-if="isCajaOpen">
      <div class="m-pz">
        <div class="m-pz-h">
          <h3>Caja #{{ currentCashRegisterId }}</h3>
          <span>{{ [sucursal, desde ? `desde ${desde}` : ""].filter(Boolean).join(" · ") }}</span>
        </div>
        <div class="m-pz-b">
          <div class="m-sub">Efectivo esperado</div>
          <div class="m-cifra num">{{ pesos(t.esperado) }}</div>
          <div class="cj-mix" aria-hidden="true">
            <s :style="{ width: pct(t.fondo) + '%', background: 'var(--m-r3)' }"></s>
            <s :style="{ width: pct(t.efectivoVentas) + '%' }"></s>
            <s :style="{ width: pct(t.ingresos) + '%', background: 'var(--m-r4)' }"></s>
          </div>
          <div class="cj-filas">
            <div class="m-fila"><div class="l"><b>Fondo inicial</b><span class="num">{{ pesos(t.fondo) }}</span></div></div>
            <div class="m-fila"><div class="l"><b>Ventas en efectivo</b><span class="num">{{ pesos(t.efectivoVentas) }}</span></div></div>
            <div class="m-fila"><div class="l"><b>Ingresos</b><span class="num">{{ pesos(t.ingresos) }}</span></div></div>
            <div class="m-fila"><div class="l"><b>Egresos</b><span class="num">{{ pesos(-t.egresos) }}</span></div></div>
          </div>
        </div>
        <div class="m-pz-f"><router-link :to="{ name: 'cajaCerrar' }" class="m-btn">Cerrar caja</router-link></div>
      </div>

      <div class="m-pz">
        <div class="m-pz-h"><h3>Cobrado en el turno</h3><span class="num">{{ ventasTxt }}</span></div>
        <div class="m-pz-b">
          <div v-if="!cobrado.length" class="m-sub">Sin cobros</div>
          <div v-for="f in cobrado" :key="f.key" class="m-fila">
            <div class="l"><b>{{ f.label }}<small v-if="f.count">{{ f.count }} {{ f.count === 1 ? "venta" : "ventas" }}</small></b><span class="num">{{ pesos(f.total) }}</span></div>
            <div class="m-barra"><s :style="{ width: f.pct + '%' }"></s></div>
          </div>
        </div>
      </div>

      <div class="m-pz">
        <div class="m-pz-h"><h3>Movimientos</h3><span class="num">{{ movs.length }}</span></div>
        <div v-for="mv in movs" :key="mv.id" class="m-it">
          <span class="m-ico"><v-icon size="22">mdi-swap-horizontal</v-icon></span>
          <span class="tx"><b>{{ mv.reason }}</b><small>{{ [hora(mv.happened_at || mv.created_at), mv.user_name || mv.created_by_name].filter(Boolean).join(" · ") }}</small></span>
          <span class="der"><b class="num">{{ pesos(String(mv.type).toUpperCase() === "OUT" ? -Number(mv.amount) : Number(mv.amount)) }}</b></span>
        </div>
        <div class="m-pz-f" :class="{ 'cj-pf': movs.length }"><router-link :to="{ name: 'cajaMovimiento' }" class="m-btn">Registrar movimiento</router-link></div>
      </div>
    </template>

    <template v-else>
      <div class="m-pz">
        <div class="m-pz-h"><h3>Caja cerrada</h3><span>{{ sucursal }}</span></div>
        <div v-if="ultimo" class="m-pz-b">
          <dl class="m-dl">
            <dt>Último cierre</dt><dd>#{{ ultimo.id }} · {{ fechaHora(ultimo.closed_at) }}</dd>
            <dt>Diferencia</dt>
            <dd class="num" :class="Number(ultimo.difference_cash || 0) === 0 ? 'm-dif-ok' : 'm-dif-neg'">{{ pesos(Number(ultimo.difference_cash || 0)) }}</dd>
          </dl>
        </div>
        <div class="m-pz-f" :class="{ 'cj-pf': !ultimo }"><router-link :to="{ name: 'cajaAbrir' }" class="m-btn">Abrir caja</router-link></div>
      </div>
    </template>
    <MovilAviso alto="80px" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { usePosSalesFlow } from "../../containers/usePosSalesFlow";
import { adminListCashRegisters } from "../../services/posCashRegisters.service";
import { totalesCaja, cobradoEnElTurno, movimientosCaja, hora, fechaHora } from "../../utils/cajaResumen";
import { pesos } from "../../utils/cobroReglas";

const flow = usePosSalesFlow();
const { isCajaOpen, currentCashRegisterId, currentCashRegister, summary, refreshCaja, branchName } = flow;

const cargando = ref(false);
const cargado = ref(false);
const ultimo = ref(null);

const t = computed(() => totalesCaja(summary.value));
const cobrado = computed(() => cobradoEnElTurno(summary.value));
const movs = computed(() => movimientosCaja(summary.value));
const ventasTxt = computed(() => (t.value.ventas === 1 ? "1 venta" : `${t.value.ventas} ventas`));
const sucursal = computed(() => summary.value?.cash_register?.branch_name || currentCashRegister.value?.branch_name || branchName.value || "");
const desde = computed(() => hora(currentCashRegister.value?.opened_at || summary.value?.cash_register?.opened_at));

function pct(v) {
  const tot = t.value.fondo + t.value.efectivoVentas + t.value.ingresos;
  return tot > 0 ? Math.max(0, (Number(v || 0) / tot) * 100) : 0;
}

onMounted(async () => {
  cargando.value = true;
  try {
    await flow.initOnce?.();
    await refreshCaja({ withSummary: true }).catch(() => {});
    if (!isCajaOpen.value) {
      try {
        const res = await adminListCashRegisters({ status: "CLOSED", page: 1, limit: 1 });
        ultimo.value = Array.isArray(res?.data) ? res.data[0] || null : null;
      } catch {
        ultimo.value = null;
      }
    }
  } finally {
    cargando.value = false;
    cargado.value = true;
  }
});
</script>

<style scoped>
.cj { display: flex; flex-direction: column; gap: 12px; background: transparent; }
.cj-mix { display: flex; gap: 2px; height: 8px; margin-top: 8px; border-radius: 4px; overflow: hidden; }
.cj-mix s { display: block; height: 100%; background: var(--m-r1); }
.cj-filas { margin-top: 12px; }
.cj-pf { padding-top: 12px; }
</style>
