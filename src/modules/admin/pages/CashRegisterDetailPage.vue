<!-- src/modules/admin/pages/CashRegisterDetailPage.vue -->
<!-- Una caja (maqueta aprobada 10/10): debería haber / se contó / diferencia
     en grande, las ventas del turno y al costado el efectivo, lo cobrado por
     medio, los movimientos y las notas. El cierre administrativo y eliminar
     se hacen acá, con la confirmación en la misma pantalla (no en ventanas). -->
<template>
  <div class="sp cd">
    <div class="sp-cab">
      <div class="sp-cab__txt">
        <router-link :to="{ name: 'adminCashRegisters' }" class="se-volver"><v-icon size="18">mdi-arrow-left</v-icon>Cajas</router-link>
        <h1 class="sp-cab__titulo">Caja #{{ id }}</h1>
        <span v-if="cr" class="sp-cab__sub num">{{ [cr.branch_name, cr.opened_by_name].filter(Boolean).join(" · ") }} · {{ fechaHora(cr.opened_at) }} → {{ abierta ? "abierta" : fechaHora(cr.closed_at) }} ({{ duracion }})</span>
      </div>
      <span v-if="cr" :class="`cd-chip cd-chip--${chip.k}`">{{ chip.t }}</span>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact">{{ error }}</v-alert>
    <v-progress-linear v-if="cargando" indeterminate color="primary" height="3" />

    <template v-if="cr">
      <div class="cd-tres num">
        <div class="sp-caja cd-n"><span class="cd-lab">Debería haber</span><b>{{ pesos(tot.expected_cash) }}</b></div>
        <div class="sp-caja cd-n"><span class="cd-lab">Se contó</span><b>{{ abierta ? "—" : pesos(cr.closing_cash) }}</b><small v-if="abierta">la caja sigue abierta</small></div>
        <div class="sp-caja cd-n" :class="{ 'is-falta': difer < 0, 'is-sobra': difer > 0 }"><span class="cd-lab">Diferencia</span><b>{{ abierta ? "—" : dif(difer) }}</b></div>
      </div>

      <div class="cd-dos">
        <section class="sp-caja">
          <div class="se-banda"><span>Ventas del turno</span><small class="num">{{ ventas.length }} {{ ventas.length === 1 ? "cobrada" : "cobradas" }}<template v-if="anuladas"> · {{ anuladas }} {{ anuladas === 1 ? "anulada" : "anuladas" }}</template></small></div>
          <div class="sp-tabla-scroll">
            <table class="sp-tabla cd-tabla">
              <thead><tr><th class="c-v">Venta</th><th class="c-h">Hora</th><th>Productos</th><th class="c-m">Cobro</th><th class="c-t">Total</th></tr></thead>
              <tbody>
                <tr v-for="v in ventas" :key="v.id" @click="irVenta($event, v)" @auxclick="irVenta($event, v)">
                  <td><router-link :to="{ name: 'posSaleDetail', params: { id: v.id } }" class="sp-nombre num cd-nro" @click.stop>#{{ v.id }}</router-link></td>
                  <td class="num">{{ hora(v.sold_at) }}</td>
                  <td class="clamp1">{{ (v.items || []).map((i) => `${i.name} × ${fmt(i.quantity)}`).join(" · ") || "—" }}</td>
                  <td>{{ medio(v.primary_method) }}<template v-if="cuotas(v) > 1"> · {{ cuotas(v) }} cuotas</template></td>
                  <td class="c-t num sp-b">{{ pesos(v.total) }}</td>
                </tr>
                <tr v-if="!ventas.length"><td colspan="5" class="sp-vacio">Sin ventas en este turno</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside class="cd-lado">
          <section class="sp-caja">
            <div class="se-banda"><span>Efectivo</span></div>
            <dl class="cd-dl num">
              <dt>Apertura</dt><dd>{{ pesos(tot.opening_cash) }}</dd>
              <dt>Ventas en efectivo</dt><dd>{{ pesos(tot.cash_sales) }}</dd>
              <dt>Ingresos</dt><dd class="cj-verde">+ {{ pesos(tot.manual_in) }}</dd>
              <dt>Egresos</dt><dd class="cj-rojo">− {{ pesos(tot.manual_out) }}</dd>
              <dt class="cd-fin">Debería haber</dt><dd class="cd-fin">{{ pesos(tot.expected_cash) }}</dd>
            </dl>
          </section>
          <section v-if="medios.length" class="sp-caja">
            <div class="se-banda"><span>Cobrado por medio</span></div>
            <dl class="cd-dl num"><template v-for="mm in medios" :key="mm.k"><dt>{{ mm.t }}</dt><dd>{{ pesos(mm.v) }}</dd></template></dl>
          </section>
          <section v-if="movs.length" class="sp-caja">
            <div class="se-banda"><span>Movimientos</span></div>
            <div class="cd-movs">
              <div v-for="mv in movs" :key="mv.id" class="cd-mov num">
                <span class="cd-mov__h">{{ hora(mv.happened_at) }}</span>
                <span class="clamp1 cd-mov__r">{{ mv.reason === "APERTURA_CAJA" ? "Apertura de caja" : mv.reason }}</span>
                <b :class="mv.type === 'OUT' ? 'cj-rojo' : 'cj-verde'">{{ mv.type === "OUT" ? "−" : "+" }} {{ pesos(mv.amount) }}</b>
              </div>
            </div>
          </section>
          <section v-if="cr.closing_note || cr.opening_note" class="sp-caja">
            <div class="se-banda"><span>Notas</span></div>
            <div class="cd-notas">
              <p v-if="cr.opening_note"><b>Apertura:</b> {{ cr.opening_note }}</p>
              <p v-if="cr.closing_note"><b>Cierre:</b> {{ cr.closing_note }}</p>
            </div>
          </section>

          <!-- Acciones de administrador, en la pantalla -->
          <section class="sp-caja cd-admin">
            <div class="se-banda"><span>Administración</span></div>
            <div class="cd-admin__in">
              <template v-if="abierta">
                <span class="cd-admin__t">Cierre administrativo</span>
                <label class="cd-op"><input v-model="modoCierre" type="radio" value="neutral" />Contado = apertura (diferencia 0)</label>
                <label class="cd-op"><input v-model="modoCierre" type="radio" value="expected_real" />Contado = lo que debería haber ({{ pesos(tot.expected_cash) }})</label>
                <input v-model="motivo" type="text" maxlength="255" class="cd-in" placeholder="Motivo (opcional)" />
                <button type="button" class="cd-btn" :disabled="trabajando" @click="cerrar"><v-icon size="18">mdi-lock-outline</v-icon>Cerrar la caja #{{ id }}</button>
              </template>
              <template v-if="!confirmaBorrar">
                <a href="#" class="cd-borrar" @click.prevent="confirmaBorrar = true">Eliminar la caja</a>
              </template>
              <template v-else>
                <span class="cd-admin__t cj-rojo">Eliminar la caja #{{ id }}<template v-if="ventas.length"> y sus {{ ventas.length }} {{ ventas.length === 1 ? "venta" : "ventas" }}</template></span>
                <input v-model="textoBorrar" type="text" class="cd-in" placeholder="Escribí ELIMINAR para confirmar" />
                <div class="cd-fila">
                  <a href="#" class="sp-link" @click.prevent="confirmaBorrar = false; textoBorrar = ''">No</a>
                  <button type="button" class="cd-btn cd-btn--rojo" :disabled="textoBorrar.trim().toUpperCase() !== 'ELIMINAR' || trabajando" @click="borrar">Eliminar</button>
                </div>
              </template>
            </div>
          </section>
        </aside>
      </div>
    </template>

    <v-snackbar v-model="aviso.open" :timeout="2600">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import http from "@/app/api/http";
import { adminListCashRegisters, getCashRegisterSummary } from "@/modules/pos/services/posCashRegisters.service";
import "@/modules/products/styles/proveedores.css";

const route = useRoute();
const router = useRouter();
const id = computed(() => Number(route.params?.id || 0));

const cr = ref(null);
const tot = ref({});
const pagos = ref({});
const ventas = ref([]);
const anuladas = ref(0);
const movs = ref([]);
const cargando = ref(false);
const trabajando = ref(false);
const error = ref("");
const modoCierre = ref("neutral");
const motivo = ref("");
const confirmaBorrar = ref(false);
const textoBorrar = ref("");
const aviso = reactive({ open: false, text: "" });

const n = (v) => Number(v || 0);
const fmt = (v) => n(v).toLocaleString("es-AR", { maximumFractionDigits: 3 });
const pesos = (v) => `$ ${n(v).toLocaleString("es-AR", { maximumFractionDigits: 2 })}`;
const dif = (v) => (!n(v) ? "$ 0" : n(v) < 0 ? `− ${pesos(-n(v))}` : `+ ${pesos(v)}`);
const dd = (x) => String(x).padStart(2, "0");
function fechaHora(v) { const d = new Date(v); return isNaN(d) ? "" : `${dd(d.getDate())}/${dd(d.getMonth() + 1)} ${dd(d.getHours())}:${dd(d.getMinutes())}`; }
function hora(v) { const d = new Date(v); return isNaN(d) ? "" : `${dd(d.getHours())}:${dd(d.getMinutes())}`; }

const abierta = computed(() => String(cr.value?.status || "").toUpperCase() === "OPEN");
const difer = computed(() => (cr.value?.difference_cash != null ? n(cr.value.difference_cash) : n(cr.value?.closing_cash) - n(tot.value.expected_cash)));
const chip = computed(() => {
  if (abierta.value) return { k: "abierta", t: "Abierta" };
  if (difer.value < 0) return { k: "falta", t: "Cerrada con faltante" };
  if (difer.value > 0) return { k: "sobra", t: "Cerrada con sobrante" };
  return { k: "ok", t: "Cerrada" };
});
const duracion = computed(() => {
  const a = new Date(cr.value?.opened_at), b = cr.value?.closed_at ? new Date(cr.value.closed_at) : new Date();
  const h = isNaN(a) ? 0 : (b - a) / 3600000;
  if (h >= 48) return `${Math.floor(h / 24)} días`;
  const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
  return hh ? `${hh} h ${mm} min` : `${mm} min`;
});
const MEDIOS = { cash: "Efectivo", mercadopago: "Mercado Pago", card: "Tarjeta", transfer: "Transferencia", credit_sjt: "Crédito SJT", other: "Otros" };
const medios = computed(() => Object.entries(MEDIOS).map(([k, t]) => ({ k, t, v: n(pagos.value?.[k]) })).filter((x) => x.v));
const NOMBRE_MEDIO = { CASH: "Efectivo", QR: "Mercado Pago QR", MERCADOPAGO: "Mercado Pago", CARD: "Tarjeta", TRANSFER: "Transferencia", CREDIT_SJT: "Crédito SJT" };
const medio = (m) => NOMBRE_MEDIO[String(m || "").toUpperCase()] || m || "—";
const cuotas = (v) => Math.max(...(v.payments || []).map((p) => n(p.installments) || 1), 1);

function irVenta(e, v) {
  const r = { name: "posSaleDetail", params: { id: v.id } };
  if (e.button === 1 || e.ctrlKey || e.metaKey) { window.open(router.resolve(r).href, "_blank"); return; }
  if (e.type === "click") router.push(r);
}

async function cargar() {
  if (!id.value) return;
  cargando.value = true;
  error.value = "";
  try {
    let fila = null;
    try {
      const l = await adminListCashRegisters({ q: String(id.value), page: 1, limit: 50 });
      fila = (Array.isArray(l?.data) ? l.data : []).find((r) => Number(r.id) === id.value) || null;
    } catch { /* el resumen alcanza */ }
    const res = await getCashRegisterSummary(id.value);
    const s = res?.data?.data || res?.data || res || {};
    cr.value = { ...(fila || {}), ...(s.cash_register || {}), branch_name: fila?.branch_name || s.cash_register?.branch_name, opened_by_name: fila?.opened_by_name || s.cash_register?.opened_by_name, difference_cash: fila?.difference_cash ?? s.cash_register?.difference_cash };
    tot.value = s.totals || {};
    pagos.value = s.payments_by_method || {};
    ventas.value = (s.sales_detail || []).filter((v) => String(v.status || "").toUpperCase() !== "CANCELLED");
    anuladas.value = n(s.totals?.sales_cancelled_count);
    movs.value = Array.isArray(s.movements) ? s.movements : [];
  } catch (e) {
    error.value = e?.friendlyMessage || e?.message || "No se pudo cargar la caja";
  } finally {
    cargando.value = false;
  }
}

async function cerrar() {
  trabajando.value = true;
  try {
    await http.post(`/pos/cash-registers/admin/${id.value}/force-close`, { mode: modoCierre.value, reason: motivo.value.trim() || null });
    aviso.text = `Caja #${id.value} cerrada`; aviso.open = true;
    await cargar();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo cerrar la caja";
  } finally { trabajando.value = false; }
}
async function borrar() {
  trabajando.value = true;
  try {
    await http.delete(`/pos/cash-registers/admin/${id.value}${ventas.value.length ? "?force=1" : ""}`);
    router.replace({ name: "adminCashRegisters" });
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "No se pudo eliminar";
  } finally { trabajando.value = false; }
}

watch(id, cargar);
onMounted(cargar);
</script>

<style>
.cd-chip { padding: 8px 14px; border-radius: 9999px; font-weight: 800; font-size: 14px; background: var(--sp-hover); }
.cd-chip--abierta { background: #e3f4ee; color: #1f7a5f; }
.cd-chip--falta { background: #fdeceb; color: #a3322c; }
.cd-chip--sobra { background: #fff4e5; color: #b45309; }
.cd-tres { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.cd-n { padding: 16px 18px; display: flex; flex-direction: column; gap: 2px; }
.cd-n b { font-size: 30px; font-weight: 900; }
.cd-n small { font-size: 13px; color: var(--sp-suave); }
.cd-n.is-falta { border: 2px solid #c2413a; background: #fdeceb; }
.cd-n.is-falta b, .cd-n.is-falta .cd-lab { color: #a3322c; }
.cd-n.is-sobra { border: 2px solid #f0b429; background: #fff8eb; }
.cd-lab { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: var(--sp-suave); }
.cd-dos { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 16px; align-items: start; }
.cd-lado { display: flex; flex-direction: column; gap: 14px; }
.cd-tabla .c-v { width: 90px; }
.cd-tabla .c-h { width: 80px; }
.cd-tabla .c-m { width: 170px; }
.cd-tabla .c-t { width: 130px; text-align: right; }
.cd-nro { color: #0f6fae !important; }
.cd-dl { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; margin: 0; padding: 14px 16px; font-size: 15px; }
.cd-dl dt { color: var(--sp-suave); font-weight: 600; }
.cd-dl dd { margin: 0; font-weight: 800; text-align: right; }
.cd-dl .cd-fin { padding-top: 10px; border-top: 1px solid var(--sp-linea); color: var(--sp-texto); font-size: 16px; }
.cd-movs { display: flex; flex-direction: column; padding: 6px 16px 12px; }
.cd-mov { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--sp-linea); font-size: 14px; }
.cd-mov__h { color: var(--sp-suave); font-weight: 700; }
.cd-mov__r { flex: 1; min-width: 0; }
.cd-notas { padding: 12px 16px; font-size: 14px; line-height: 1.45; }
.cd-notas p { margin: 0 0 8px; }
.cd-admin__in { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
.cd-admin__t { font-size: 14px; font-weight: 800; }
.cd-op { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.cd-op input { accent-color: #0f6fae; width: 16px; height: 16px; }
.cd-in { height: 42px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--sp-borde); background: var(--sp-caja); color: var(--sp-texto); font: 500 14px Inter, sans-serif; outline: 0; }
.cd-btn { height: 44px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 0; border-radius: 10px; background: #0f6fae; color: #ffffff; font: 800 15px Inter, sans-serif; cursor: pointer; }
.cd-btn .v-icon { color: #ffffff; }
.cd-btn:disabled { opacity: .45; cursor: not-allowed; }
.cd-btn--rojo { background: #c2413a; padding: 0 18px; }
.cd-borrar { font-size: 14px; font-weight: 800; color: #b23b35; text-decoration: none; }
.cd-borrar:hover { text-decoration: underline; }
.cd-fila { display: flex; align-items: center; justify-content: flex-end; gap: 14px; }
.cd .cj-rojo { color: #c2413a; }
.cd .cj-verde { color: #1f7a5f; }
:is(.v-theme--dark, .v-theme--adminDark) .cd-n.is-falta { background: #3d1a18; }
:is(.v-theme--dark, .v-theme--adminDark) .cd-n.is-falta b, :is(.v-theme--dark, .v-theme--adminDark) .cd-n.is-falta .cd-lab { color: #fca5a5; }
:is(.v-theme--dark, .v-theme--adminDark) .cd-chip--falta { background: #3d1a18; color: #fca5a5; }
:is(.v-theme--dark, .v-theme--adminDark) .cd-chip--abierta { background: #143a2f; color: #6ee7b7; }
@media (max-width: 1100px) { .cd-dos { grid-template-columns: 1fr; } .cd-tres { grid-template-columns: 1fr; } }
</style>
