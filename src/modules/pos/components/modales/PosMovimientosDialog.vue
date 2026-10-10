<!-- src/modules/pos/components/modales/PosMovimientosDialog.vue -->
<!-- F10 Movimientos de caja: ingreso o egreso (I / E), monto, motivo y nota;
     al costado el efectivo del turno y los movimientos. Enter registra. -->
<template>
  <PosModal
    :model-value="modelValue"
    titulo="Movimientos de caja"
    :sub="subtitulo"
    tecla="F10"
    icono="mdi-cash-sync"
    :ancho="1080"
    :accion="abierta ? `Registrar ${form.type === 'IN' ? 'ingreso' : 'egreso'}${monto > 0 ? ` de ${pesos(monto)}` : ''}` : ''"
    :accion-icono="form.type === 'IN' ? 'mdi-arrow-bottom-left' : 'mdi-arrow-top-right'"
    :tono="form.type === 'IN' ? 'verde' : 'rojo'"
    :cargando="guardando"
    @update:model-value="emit('update:modelValue', $event)"
    @abierto="enfocar"
    @accion="registrar"
  >
    <div v-if="!cargando && !abierta" class="pm-vacio">No hay caja abierta</div>
    <div v-else class="pmv">
      <div class="pmv-form">
        <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>
        <div class="pmv-tipos">
          <button type="button" class="pm-op pmv-tipo" :class="{ 'is-in': form.type === 'IN' }" @click="form.type = 'IN'">
            <v-icon size="32">mdi-arrow-bottom-left</v-icon><span>Ingreso</span>
          </button>
          <button type="button" class="pm-op pmv-tipo" :class="{ 'is-out': form.type === 'OUT' }" @click="form.type = 'OUT'">
            <v-icon size="32">mdi-arrow-top-right</v-icon><span>Egreso</span>
          </button>
        </div>
        <span class="pm-lab">Monto</span>
        <label class="pm-in pm-in--monto">
          <span class="pmv-signo">$</span>
          <input ref="montoRef" :value="montoTxt" type="text" inputmode="decimal" autocomplete="off" placeholder="0" @input="onMonto" />
        </label>
        <span class="pm-lab">Motivo</span>
        <div class="pmv-motivos">
          <button v-for="m in MOTIVOS" :key="m" type="button" class="pm-op pmv-mot" :class="{ 'is-on': form.reason === m }" @click="form.reason = m">{{ m }}</button>
        </div>
        <input v-model="form.reason" type="text" maxlength="120" class="pmv-campo" placeholder="Otro motivo" />
        <input v-model="form.note" type="text" maxlength="255" class="pmv-campo" placeholder="Nota (opcional)" />
      </div>

      <aside class="pm-aside">
        <div class="pm-lab pmv-asidetit">Efectivo del turno</div>
        <dl class="pm-dl num">
          <dt>Apertura</dt><dd>{{ pesos(totales.opening_cash) }}</dd>
          <dt>Ventas en efectivo</dt><dd>{{ pesos(totales.cash_sales) }}</dd>
          <dt>Ingresos</dt><dd class="pmv-in">+ {{ pesos(totales.manual_in) }}</dd>
          <dt>Egresos</dt><dd class="pmv-out">− {{ pesos(totales.manual_out) }}</dd>
        </dl>
        <div class="pmv-deberia"><span>Debería haber</span><b class="num">{{ pesos(totales.expected_cash) }}</b></div>
        <div class="pm-lab pmv-asidetit">Movimientos</div>
        <div class="pmv-movs">
          <div v-for="mv in movimientos" :key="mv.id" class="pmv-mov">
            <span class="num pmv-hora">{{ hora(mv.happened_at) }}</span>
            <span class="pm-c1 pmv-motivo">{{ motivo(mv.reason) }}</span>
            <b class="num" :class="mv.type === 'OUT' ? 'pmv-out' : 'pmv-in'">{{ mv.type === "OUT" ? "−" : "+" }} {{ pesos(mv.amount) }}</b>
          </div>
          <div v-if="!movimientos.length" class="pmv-nada">Sin movimientos en esta caja</div>
        </div>
      </aside>
    </div>
  </PosModal>
  <v-snackbar v-model="aviso.open" :timeout="2600">{{ aviso.text }}</v-snackbar>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import PosModal from "./PosModal.vue";
import { useTeclasModal, enCampo } from "../../composables/useTeclasModal";
import { formatearMonto, montoANumero, pesos } from "../../utils/montoTexto";
import {
  getCurrentCashRegister,
  getCashRegisterSummary,
  createCashRegisterMovement,
} from "../../services/posCashRegisters.service";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cajaId: { type: Number, default: 0 },
  sucursal: { type: Number, default: 0 },
});
const emit = defineEmits(["update:modelValue", "changed"]);

const MOTIVOS = ["Pago a proveedor", "Retiro de efectivo", "Gastos del local", "Cambio para la caja", "Depósito"];
const abierto = computed(() => props.modelValue);
const sucursal = computed(() => Number(props.sucursal || 0) || undefined);
const caja = ref(null);
const totales = ref({});
const movimientos = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const aviso = reactive({ open: false, text: "" });
const montoRef = ref(null);
const montoTxt = ref("");
const form = reactive({ type: "OUT", reason: "", note: "" });
const monto = computed(() => montoANumero(montoTxt.value));

const abierta = computed(() => !!caja.value?.id && String(caja.value.status || "OPEN").toUpperCase() === "OPEN");
const subtitulo = computed(() => {
  const c = caja.value;
  if (!c?.id) return "";
  return [`Caja #${c.id}`, c.branch_name, c.opened_at ? `abierta ${hora(c.opened_at)}` : ""].filter(Boolean).join(" · ");
});

function hora(v) {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d) ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
}
const motivo = (r) => (String(r || "") === "APERTURA_CAJA" ? "Apertura de caja" : r);
function onMonto(e) {
  montoTxt.value = formatearMonto(e.target.value);
  e.target.value = montoTxt.value;
}
function enfocar() { nextTick(() => montoRef.value?.focus()); }

async function cargar() {
  cargando.value = true;
  error.value = "";
  try {
    let id = Number(props.cajaId || 0);
    if (!id) {
      const cur = await getCurrentCashRegister({ sucursal: sucursal.value });
      id = Number(cur?.data?.id || 0);
    }
    if (!id) { caja.value = null; return; }
    const res = await getCashRegisterSummary(id, { sucursal: sucursal.value });
    const s = res?.data?.data || res?.data?.summary || res?.data || {};
    caja.value = s.cash_register || null;
    totales.value = s.totals || {};
    movimientos.value = (Array.isArray(s.movements) ? s.movements : []).slice().reverse();
  } catch (e) {
    error.value = e?.message || "No se pudo cargar la caja";
  } finally {
    cargando.value = false;
  }
}

async function registrar() {
  if (guardando.value || !abierta.value) return;
  if (!(monto.value > 0)) { error.value = "Falta el monto."; enfocar(); return; }
  if (!form.reason.trim()) { error.value = "Falta el motivo."; return; }
  guardando.value = true;
  error.value = "";
  try {
    await createCashRegisterMovement(
      caja.value.id,
      { type: form.type, amount: monto.value, reason: form.reason.trim(), note: form.note.trim() || null },
      { sucursal: sucursal.value },
    );
    aviso.text = form.type === "IN" ? "Ingreso registrado" : "Egreso registrado";
    aviso.open = true;
    montoTxt.value = "";
    form.reason = "";
    form.note = "";
    emit("changed");
    await cargar();
    enfocar();
  } catch (e) {
    error.value = e?.message || "No se pudo registrar el movimiento";
  } finally {
    guardando.value = false;
  }
}

watch(abierto, async (v) => {
  if (!v) return;
  error.value = "";
  montoTxt.value = "";
  Object.assign(form, { type: "OUT", reason: "", note: "" });
  await cargar();
  enfocar();
}, { immediate: true });

useTeclasModal(abierto, (e) => {
  const k = e.key.toLowerCase();
  // I y E eligen el tipo salvo que se esté escribiendo un texto (motivo, nota).
  const enTexto = enCampo(e) && e.target !== montoRef.value;
  if (!enTexto && k === "i") { form.type = "IN"; return true; }
  if (!enTexto && k === "e") { form.type = "OUT"; return true; }
  if (e.key === "Enter") { registrar(); return true; }
  return false;
});
</script>

<style>
.pmv { display: flex; min-height: 100%; }
.pmv-form { flex: 1; min-width: 0; padding: 18px 22px; display: flex; flex-direction: column; gap: 12px; }
.pmv-tipos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pmv-tipo { flex-direction: row !important; align-items: center !important; gap: 12px !important; min-height: 68px; font-size: 20px; font-weight: 900; }
.pmv-tipo .v-icon { color: #5a6678; }
.pmv-tipo.is-in { border: 2px solid #2e9e7b; background: #e3f4ee; color: #1f7a5f; box-shadow: 0 0 0 4px rgba(46, 158, 123, 0.12); }
.pmv-tipo.is-in .v-icon { color: #2e9e7b; }
.pmv-tipo.is-out { border: 2px solid #c2413a; background: #fdeceb; color: #a3322c; box-shadow: 0 0 0 4px rgba(194, 65, 58, 0.12); }
.pmv-tipo.is-out .v-icon { color: #c2413a; }
.pmv-signo { font-size: 24px; font-weight: 800; color: #94a3b8; }
.pmv-motivos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.pmv-mot { padding: 11px 12px !important; font-size: 14px; font-weight: 800; }
.pmv-campo { height: 48px; padding: 0 14px; border-radius: 12px; border: 1px solid #c9d5e1; font: 500 15px Inter, sans-serif; color: #0f172a; outline: 0; }
.pmv-campo:focus { border-color: #0f6fae; box-shadow: 0 0 0 3px rgba(15, 111, 174, 0.14); }
.pmv-asidetit { padding: 18px 18px 4px; }
.pmv-deberia { margin: 0 16px; padding: 14px 16px; border-radius: 12px; background: #ffffff; border: 1px solid #d3dde7; display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: 800; }
.pmv-deberia b { font-size: 26px; font-weight: 900; }
.pmv-movs { display: flex; flex-direction: column; padding: 4px 18px 16px; overflow-y: auto; max-height: 260px; }
.pmv-mov { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #eef2f6; font-size: 14px; }
.pmv-hora { color: #5a6678; font-weight: 700; }
.pmv-motivo { flex: 1; min-width: 0; font-weight: 600; }
.pmv-nada { font-size: 14px; color: #5a6678; padding: 6px 0; }
.pm .pmv-in { color: #1f7a5f; }
.pm .pmv-out { color: #a3322c; }
</style>
