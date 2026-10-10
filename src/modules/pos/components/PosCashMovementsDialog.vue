<!-- src/modules/pos/components/PosCashMovementsDialog.vue -->
<!-- Movimientos de caja (F10 del POS): ingreso o egreso de efectivo de la caja
     abierta, el efectivo del turno y la lista de movimientos. Ventana como las
     demás de la barra del POS (decisión del usuario, 10/10). -->
<template>
  <v-dialog :model-value="modelValue" max-width="980" scrollable @update:model-value="emit('update:modelValue', $event)">
    <div class="sp mv mv-dlg">
      <div class="mv-dlg__cab">
        <div class="sp-cab__txt">
          <h2 class="mv-dlg__titulo">Movimientos de caja</h2>
          <span v-if="caja" class="sp-cab__sub num">{{ subtitulo }}</span>
        </div>
        <button type="button" class="mv-dlg__cerrar" aria-label="Cerrar" @click="emit('update:modelValue', false)">
          <v-icon size="22">mdi-close</v-icon>
        </button>
      </div>

      <div class="mv-dlg__cuerpo">
        <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>
        <div v-if="!cargando && !abierta" class="sp-caja sp-vacio">No hay caja abierta</div>

        <div v-if="abierta" class="se-grilla">
          <section class="sp-caja">
            <div class="se-banda"><span>Nuevo movimiento</span></div>
            <div class="se-campos">
              <div class="se-campo se-campo--ancho">
                <span>Tipo</span>
                <div class="mv-seg" role="radiogroup">
                  <button type="button" role="radio" :aria-checked="form.type === 'IN'" :class="{ 'is-in': form.type === 'IN' }" @click="form.type = 'IN'">
                    <v-icon size="20">mdi-arrow-down-bold-circle-outline</v-icon>Ingreso
                  </button>
                  <button type="button" role="radio" :aria-checked="form.type === 'OUT'" :class="{ 'is-out': form.type === 'OUT' }" @click="form.type = 'OUT'">
                    <v-icon size="20">mdi-arrow-up-bold-circle-outline</v-icon>Egreso
                  </button>
                </div>
              </div>
              <label class="se-campo">
                <span>Monto</span>
                <div class="mv-monto">
                  <b>$</b>
                  <input ref="montoRef" v-model="form.amount" type="text" inputmode="decimal" placeholder="0" class="num" @keydown.enter="registrar" />
                </div>
              </label>
              <label class="se-campo">
                <span>Motivo</span>
                <input v-model="form.reason" type="text" maxlength="120" list="mv-motivos" @keydown.enter="registrar" />
                <datalist id="mv-motivos">
                  <option v-for="m in motivos" :key="m" :value="m" />
                </datalist>
              </label>
              <label class="se-campo se-campo--ancho">
                <span>Nota</span>
                <input v-model="form.note" type="text" maxlength="255" placeholder="Opcional" @keydown.enter="registrar" />
              </label>
            </div>
            <div class="mv-dlg__accion">
              <v-btn color="primary" variant="flat" class="sp-nuevo" block :loading="guardando" :disabled="cargando" @click="registrar">
                {{ form.type === "IN" ? "Registrar ingreso" : "Registrar egreso" }}
              </v-btn>
            </div>
          </section>

          <section class="sp-caja">
            <div class="se-banda"><span>Efectivo del turno</span></div>
            <dl class="mv-dl num">
              <dt>Apertura</dt><dd>{{ pesos(totales.opening_cash) }}</dd>
              <dt>Ventas en efectivo</dt><dd>{{ pesos(totales.cash_sales) }}</dd>
              <dt>Ingresos</dt><dd class="mv-in">+ {{ pesos(totales.manual_in) }}</dd>
              <dt>Egresos</dt><dd class="mv-out">− {{ pesos(totales.manual_out) }}</dd>
              <dt class="mv-total">Debería haber</dt><dd class="mv-total">{{ pesos(totales.expected_cash) }}</dd>
            </dl>
          </section>
        </div>

        <div v-if="abierta" class="sp-caja">
          <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />
          <div class="sp-tabla-scroll">
            <table class="sp-tabla mv-tabla">
              <thead>
                <tr>
                  <th class="c-hora">Hora</th>
                  <th class="c-tipo">Tipo</th>
                  <th>Motivo</th>
                  <th>Nota</th>
                  <th class="c-num">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in movimientos" :key="m.id">
                  <td class="num">{{ hora(m.happened_at) }}</td>
                  <td><span class="mv-tipo" :class="m.type === 'OUT' ? 'mv-out' : 'mv-in'">{{ m.type === "OUT" ? "Egreso" : "Ingreso" }}</span></td>
                  <td class="sp-b">{{ motivo(m.reason) }}</td>
                  <td class="sp-s">{{ m.note || "" }}</td>
                  <td class="c-num num sp-b" :class="m.type === 'OUT' ? 'mv-out' : 'mv-in'">{{ m.type === "OUT" ? "− " : "+ " }}{{ pesos(m.amount) }}</td>
                </tr>
                <tr v-if="!cargando && !movimientos.length">
                  <td colspan="5" class="sp-vacio">Sin movimientos en esta caja</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <v-snackbar v-model="aviso.open" :timeout="2600">{{ aviso.text }}</v-snackbar>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import {
  getCurrentCashRegister,
  getCashRegisterSummary,
  createCashRegisterMovement,
} from "../services/posCashRegisters.service";
import "@/modules/products/styles/proveedores.css";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cajaId: { type: Number, default: 0 },
  sucursal: { type: Number, default: 0 },
});
const emit = defineEmits(["update:modelValue", "changed"]);
const sucursal = computed(() => Number(props.sucursal || 0) || undefined);

const caja = ref(null);
const totales = ref({});
const movimientos = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const aviso = reactive({ open: false, text: "" });
const montoRef = ref(null);
const form = reactive({ type: "OUT", amount: "", reason: "", note: "" });

const motivos = ["Pago a proveedor", "Retiro de efectivo", "Gastos del local", "Cambio para la caja", "Depósito"];

const abierta = computed(() => !!caja.value?.id && String(caja.value.status || "OPEN").toUpperCase() === "OPEN");

const subtitulo = computed(() => {
  const c = caja.value || {};
  const partes = [`Caja #${c.id}`];
  if (c.branch_name) partes.push(c.branch_name);
  if (c.opened_by_name) partes.push(c.opened_by_name);
  if (c.opened_at) partes.push(`abierta ${fechaHora(c.opened_at)}`);
  return partes.join(" · ");
});

function pesos(v) {
  return `$ ${Number(v || 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function hora(v) {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d) ? `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` : "";
}
function fechaHora(v) {
  const d = new Date(v);
  if (isNaN(d)) return "";
  return d.toDateString() === new Date().toDateString() ? hora(v) : `${d.getDate()}/${d.getMonth() + 1} ${hora(v)}`;
}
function motivo(r) {
  return String(r || "") === "APERTURA_CAJA" ? "Apertura de caja" : r;
}
// "1.500,50" o "1500.5" a número.
function aNumero(txt) {
  let s = String(txt || "").trim().replace(/\s|\$/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

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
  const amount = aNumero(form.amount);
  if (!(amount > 0)) { error.value = "Falta el monto."; return; }
  if (!form.reason.trim()) { error.value = "Falta el motivo."; return; }
  guardando.value = true;
  error.value = "";
  try {
    await createCashRegisterMovement(
      caja.value.id,
      { type: form.type, amount, reason: form.reason.trim(), note: form.note.trim() || null },
      { sucursal: sucursal.value },
    );
    aviso.text = form.type === "IN" ? "Ingreso registrado" : "Egreso registrado";
    aviso.open = true;
    Object.assign(form, { amount: "", reason: "", note: "" });
    await cargar();
    emit("changed");
    await nextTick();
    montoRef.value?.focus();
  } catch (e) {
    error.value = e?.message || "No se pudo registrar el movimiento";
  } finally {
    guardando.value = false;
  }
}

watch(() => props.modelValue, async (open) => {
  if (!open) return;
  error.value = "";
  Object.assign(form, { type: "OUT", amount: "", reason: "", note: "" });
  await cargar();
  await nextTick();
  montoRef.value?.focus();
}, { immediate: true });
</script>

<style>
.mv-seg { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mv-seg button { height: 44px; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-suave); font: 800 15px Inter, sans-serif; cursor: pointer; transition: background-color 120ms ease, box-shadow 120ms ease; }
.mv-seg button:hover { background: #cfe5f5; box-shadow: inset 0 0 0 1.5px #3f8fc6; color: #0a466e; }
.mv-seg button.is-in { background: #e3f4ee; border-color: #2e9e7b; color: #1e7a5d; box-shadow: inset 0 0 0 1px #2e9e7b; }
.mv-seg button.is-out { background: #fdeceb; border-color: #c2413a; color: #a3322c; box-shadow: inset 0 0 0 1px #c2413a; }
.mv-monto { height: 40px; display: flex; align-items: center; gap: 8px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--sp-borde); background: var(--sp-caja); }
.mv-monto:focus-within { border-color: #3f8fc6; box-shadow: 0 0 0 3px rgba(63, 143, 198, 0.18); }
.mv-monto b { color: var(--sp-suave); }
.se-campo .mv-monto input { flex: 1; height: 38px; border: 0; padding: 0; box-shadow: none; font-size: 17px; font-weight: 800; }
.mv-dl { display: grid; grid-template-columns: max-content 1fr; gap: 10px 18px; margin: 0; padding: 14px 16px; }
.mv-dl dt { font-size: 14px; font-weight: 600; color: var(--sp-suave); }
.mv-dl dd { margin: 0; font-size: 15px; font-weight: 700; text-align: right; }
.mv-dl .mv-total { padding-top: 10px; border-top: 1px solid var(--sp-linea); font-size: 16px; font-weight: 800; color: var(--sp-texto); }
.mv .mv-in { color: #1e7a5d; }
.mv .mv-out { color: #a3322c; }
.mv-tipo { font-size: 13px; font-weight: 800; }
.mv-tabla .c-hora { width: 80px; }
.mv-tabla .c-tipo { width: 100px; }
.mv-tabla .c-num { width: 150px; text-align: right; }
.mv-tabla tbody tr { cursor: default; }
.v-theme--dark .mv-seg button.is-in { background: #143a2f; color: #6ee7b7; }
.v-theme--dark .mv-seg button.is-out { background: #3d1a18; color: #fca5a5; }
.v-theme--dark .mv .mv-in { color: #6ee7b7; }
.v-theme--dark .mv .mv-out { color: #fca5a5; }
@media (max-width: 900px) { .mv .se-grilla { grid-template-columns: 1fr; } }
/* La ventana: mismo sistema que las vistas (.sp), sin el alto de página. */
.sp.mv-dlg { min-height: 0; padding: 0; gap: 0; border-radius: 12px; overflow: hidden; max-height: calc(100vh - 48px); }
.sp.mv-dlg > * { max-width: none; }
.mv-dlg__cab { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 16px 20px 12px; }
.mv-dlg__titulo { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
.mv-dlg__cerrar { width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border: 0; border-radius: 10px; background: transparent; color: var(--sp-suave); cursor: pointer; }
.mv-dlg__cerrar:hover { background: #cfe5f5; color: #0a466e; }
.mv-dlg__cuerpo { display: flex; flex-direction: column; gap: 14px; padding: 0 20px 20px; overflow-y: auto; }
.mv-dlg__accion { padding: 0 16px 16px; }
</style>
