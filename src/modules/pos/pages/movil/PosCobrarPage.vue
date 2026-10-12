<!--
  Cobrar en el teléfono: 4 pasos en vista completa (maqueta aprobada, pantallas
  6 y "Venta registrada"). Reemplaza en el teléfono al CheckoutDialog de
  escritorio, que no cambia. Las reglas de precio y cuotas son las mismas
  (utils/cobroReglas.js) y la venta se registra por el mismo camino
  (usePosSalesFlow.onCheckoutConfirm), con el mismo payload que el escritorio.
-->
<template>
  <MovilVista
    v-if="!resultado"
    titulo="Cobrar"
    manual
    @volver="onVolver"
  >
    <template #arriba>
      <div v-if="paso < 4" class="cb-total">
        <span>Total</span><b class="num">{{ pesos(total) }}</b>
      </div>
      <div class="cb-pasos" aria-hidden="true">
        <s v-for="n in 4" :key="n" :class="{ ok: n <= paso }"></s>
      </div>
      <div class="cb-paso-t">{{ tituloPaso }}</div>
    </template>

    <div v-if="cargandoMedios" class="m-vacio">Cargando…</div>

    <!-- 1 · Medio de pago -->
    <div v-else-if="paso === 1" class="m-rejilla">
      <button
        v-for="m in medios"
        :key="m.id"
        type="button"
        class="m-op"
        :class="{ on: !mixto && Number(medioId) === m.id }"
        @click="elegirMedio(m.id)"
      >
        <v-icon size="28">{{ methodIcon(m) }}</v-icon>
        <span class="tx"><b>{{ methodLabel(m) }}</b></span>
      </button>
      <button v-if="medios.length > 1" type="button" class="m-op" :class="{ on: mixto }" @click="elegirMixto">
        <v-icon size="28">mdi-format-list-bulleted</v-icon>
        <span class="tx"><b>Mixto</b></span>
      </button>
    </div>

    <!-- 2 · Pago -->
    <template v-else-if="paso === 2">
      <!-- Mixto: pagos parciales hasta cubrir el total -->
      <template v-if="mixto">
        <div v-for="(row, i) in filasMixto" :key="row.uid" class="m-pz">
          <div class="m-pz-b m-pz-b--top cb-mixto">
            <div class="m-cmp">
              <label>Medio de pago</label>
              <select v-model.number="row.payment_method_id" class="m-inp">
                <option v-for="m in medios" :key="m.id" :value="m.id">{{ methodLabel(m) }}</option>
              </select>
            </div>
            <div class="m-cmp">
              <label>Importe</label>
              <div class="m-inpw"><span class="pre">$</span><input class="m-inp num" inputmode="decimal" :value="row.amount" @input="onMontoFila(row, $event)" /></div>
            </div>
            <div v-if="opcionesCuotasFila(row).length > 1" class="m-cmp">
              <label>Cuotas</label>
              <select v-model.number="row.installments" class="m-inp">
                <option v-for="o in opcionesCuotasFila(row)" :key="o.n" :value="o.n">{{ o.n === 1 ? "1 pago" : `${o.n} cuotas` }}</option>
              </select>
            </div>
            <div v-if="methodNeedsReference(medioPorId(row.payment_method_id))" class="m-cmp">
              <label>Número de operación</label>
              <input v-model="row.reference" class="m-inp" inputmode="numeric" placeholder="Opcional" />
            </div>
            <div v-if="filasMixto.length > 1" class="m-centro">
              <button type="button" class="m-lnk rojo" @click="quitarFila(i)">Quitar pago</button>
            </div>
          </div>
        </div>
        <div class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
          <dt>Pagado</dt><dd class="num">{{ pesos(pagadoMixto) }}</dd>
          <dt>{{ faltaMixto > 0 ? "Falta" : "Vuelto" }}</dt>
          <dd class="f num" :class="{ 'm-dif-neg': faltaMixto > 0 }">{{ pesos(faltaMixto > 0 ? faltaMixto : vueltoMixto) }}</dd>
        </dl></div></div>
        <div class="m-centro"><button type="button" class="m-lnk" @click="agregarFila">Agregar pago</button></div>
      </template>

      <!-- Efectivo (y medios que dan vuelto) -->
      <template v-else-if="usaEfectivo">
        <div class="m-cmp">
          <label>Efectivo recibido</label>
          <div class="m-inpw grande"><span class="pre">$</span><input ref="recibidoRef" class="m-inp grande num" inputmode="decimal" :value="recibidoTxt" @input="onRecibido" /></div>
        </div>
        <div class="m-chips">
          <button v-for="(v, i) in rapidos" :key="v" type="button" class="m-chip num" @click="setRecibido(v)">{{ i === 0 ? "Exacto" : pesos(v) }}</button>
        </div>
        <div class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
          <dt>Vuelto</dt>
          <dd class="f num" :class="{ 'm-dif-neg': falta > 0 }">{{ falta > 0 ? `Falta ${pesos(falta)}` : pesos(vuelto) }}</dd>
        </dl></div></div>
      </template>

      <!-- Tarjeta y los demás medios -->
      <template v-else>
        <div v-if="methodNeedsCardKind(medio)" class="m-seg">
          <button type="button" :class="{ on: tipoTarjeta === 'DEBIT' }" @click="tipoTarjeta = 'DEBIT'">Débito</button>
          <button type="button" :class="{ on: tipoTarjeta !== 'DEBIT' }" @click="tipoTarjeta = 'CREDIT'">Crédito</button>
        </div>
        <template v-if="opcionesCuotas.length > 1">
          <div class="m-rot">Cuotas</div>
          <div class="m-ops">
            <button
              v-for="o in opcionesCuotas"
              :key="o.n"
              type="button"
              class="m-op"
              :class="{ on: cuotas === o.n }"
              @click="cuotas = o.n"
            >
              <span class="tx"><b>{{ o.n === 1 ? "1 pago" : `${o.n} cuotas` }}</b><small v-if="o.recargo > 0">Recargo {{ o.recargo }} %</small></span>
              <span class="der"><b class="num">{{ o.n > 1 ? `${o.n} × ` : "" }}{{ pesos(totalCon(o.n) / o.n) }}</b></span>
              <span class="rd"></span>
            </button>
          </div>
        </template>
        <div v-else class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
          <dt>Importe</dt><dd class="f num">{{ pesos(total) }}</dd>
          <dt>Medio</dt><dd>{{ methodLabel(medio) }}</dd>
        </dl></div></div>
        <div v-if="methodNeedsReference(medio)" class="m-cmp">
          <label>Número de operación</label>
          <input v-model="referencia" class="m-inp" inputmode="numeric" placeholder="Opcional" />
        </div>
      </template>
    </template>

    <!-- 3 · Comprobante (y cliente si la factura lo pide) -->
    <template v-else-if="paso === 3">
      <div class="m-ops">
        <button v-for="c in COMPROBANTES" :key="c.key" type="button" class="m-op" :class="{ on: comprobante === c.key }" @click="comprobante = c.key">
          <span class="tx"><b>{{ c.titulo }}</b><small>{{ c.sub }}</small></span>
          <span class="rd"></span>
        </button>
      </div>
      <template v-if="esFiscal">
        <div class="m-rot">Cliente</div>
        <div class="m-cmp">
          <label>DNI / CUIT / CUIL</label>
          <input v-model="clienteDoc" class="m-inp" inputmode="numeric" />
        </div>
        <div class="m-cmp">
          <label>Nombre / Razón social</label>
          <input v-model="clienteNombre" class="m-inp" />
        </div>
        <div class="m-cmp">
          <label>Teléfono</label>
          <input v-model="clienteTel" class="m-inp" inputmode="tel" placeholder="Opcional" />
        </div>
      </template>
    </template>

    <!-- 4 · Confirmar -->
    <template v-else>
      <div class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
        <dt>Total a cobrar</dt><dd class="f num">{{ pesos(total) }}</dd>
        <div class="m-sep"></div>
        <dt>Medio de pago</dt><dd>{{ resumenMedio }}</dd>
        <template v-if="!mixto && usaEfectivo">
          <dt>Recibido</dt><dd class="num">{{ pesos(recibido) }}</dd>
          <dt>Vuelto</dt><dd class="num">{{ pesos(vuelto) }}</dd>
        </template>
        <dt>Comprobante</dt><dd>{{ comprobanteActual.titulo }}</dd>
        <dt>Cliente</dt><dd>{{ esFiscal && clienteNombre ? clienteNombre : "Consumidor final" }}</dd>
      </dl></div></div>
      <div class="m-pz">
        <div class="m-pz-h"><h3>Artículos</h3><span class="num">{{ cantidad }}</span></div>
        <div v-for="it in lineas" :key="it.key" class="m-it">
          <span class="tx"><b>{{ it.name }}</b><small class="num">{{ it.qty }} × {{ pesos(it.unit) }}</small></span>
          <span class="der"><b class="num">{{ pesos(it.subtotal) }}</b></span>
        </div>
      </div>
      <div v-if="errorVenta" class="m-error">{{ errorVenta }}</div>
    </template>

    <template #pie>
      <button
        v-if="paso < 4"
        type="button"
        class="m-btn"
        :disabled="!puedeSeguir"
        @click="siguiente"
      >Siguiente</button>
      <button
        v-else
        type="button"
        class="m-btn"
        :disabled="enviando"
        @click="confirmar"
      >
        <v-progress-circular v-if="enviando" indeterminate size="22" width="3" />
        <template v-else>{{ errorVenta ? "Reintentar" : "Confirmar venta" }}</template>
      </button>
    </template>
  </MovilVista>

  <!-- Venta registrada -->
  <MovilVista
    v-else
    :titulo="`Venta #${resultado.id || ''}`"
    cerrar
    :volver="{ name: 'pos' }"
    cuerpo-clase="cb-ok"
  >
    <div class="cb-ok__cab">
      <span class="cb-ok__ic"><v-icon size="40">mdi-check</v-icon></span>
      <div class="cb-ok__tit">Venta registrada</div>
      <div class="m-cifra num">{{ pesos(resultado.total) }}</div>
      <div class="m-sub">{{ resultado.sub }}</div>
    </div>
    <button type="button" class="m-btn" :disabled="compartiendo" @click="onCompartir">
      <v-icon size="20">mdi-share-variant-outline</v-icon>Compartir ticket
    </button>
    <div v-if="!mailAbierto" class="m-centro">
      <button type="button" class="m-lnk" @click="mailAbierto = true">Enviar por email</button>
    </div>
    <div v-else class="m-pz"><div class="m-pz-b m-pz-b--top cb-mail">
      <div class="m-cmp">
        <label>Email</label>
        <input v-model="mailTo" class="m-inp" type="email" inputmode="email" autocomplete="email" />
      </div>
      <div v-if="mailError" class="m-error">{{ mailError }}</div>
      <div class="m-centro"><button type="button" class="m-lnk" :disabled="mailEnviando" @click="onMail">Enviar</button></div>
    </div></div>
    <div class="m-centro">
      <router-link :to="{ name: 'pos' }" replace class="m-lnk">Nueva venta</router-link>
    </div>
  </MovilVista>

  <MovilAviso alto="96px" />
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import { usePosSalesFlow } from "../../containers/usePosSalesFlow";
import { formatearMonto, montoANumero } from "../../utils/montoTexto";
import { compartirTicket, enviarTicketPorEmail } from "../../utils/compartirTicket";
import {
  normalizeMethod,
  methodLabel,
  methodIcon,
  methodNeedsReference,
  methodNeedsCardKind,
  methodSupportsInstallments,
  methodUsesListPrice,
  methodUsesCashEntry,
  installmentOptions,
  effectiveCardKind,
  pickPrice,
  pesos,
} from "../../utils/cobroReglas";

const router = useRouter();
const flow = usePosSalesFlow();
const {
  posStore,
  paymentMethods,
  applyReseller,
  cartItems,
  branchName,
  loadPaymentMethods,
  onCheckoutConfirm,
  receiptSale,
  receiptOpen,
  toast,
} = flow;

const COMPROBANTES = [
  { key: "NF", titulo: "No fiscal", sub: "Sin comprobante ARCA", mode: "NO_FISCAL", tipo: "X", cliente: null },
  { key: "B", titulo: "Factura B", sub: "Consumidor final / Exento", mode: "FISCAL", tipo: "B", cliente: "CONSUMIDOR_FINAL" },
  { key: "A", titulo: "Factura A", sub: "Responsable inscripto", mode: "FISCAL", tipo: "A", cliente: "RESPONSABLE_INSCRIPTO" },
  { key: "C", titulo: "Factura C", sub: "Monotributo", mode: "FISCAL", tipo: "C", cliente: "MONOTRIBUTO" },
];

const paso = ref(1);
const cargandoMedios = ref(false);
const medioId = ref(null);
const mixto = ref(false);
const tipoTarjeta = ref("CREDIT");
const cuotas = ref(1);
const referencia = ref("");
const recibidoTxt = ref("");
const recibidoRef = ref(null);
const comprobante = ref("NF");
const clienteNombre = ref(String(posStore.clienteVenta?.display_name || ""));
const clienteDoc = ref(String(posStore.clienteVenta?.doc_number || ""));
const clienteTel = ref(String(posStore.clienteVenta?.phone || ""));
const filasMixto = ref([]);
const enviando = ref(false);
const errorVenta = ref("");
const resultado = ref(null);
let saliendo = false;

const medios = computed(() =>
  (paymentMethods.value || []).map(normalizeMethod).filter((m) => m.id && m.is_active && !m.only_ecom)
);
function medioPorId(id) {
  return medios.value.find((m) => m.id === Number(id)) || null;
}
const medio = computed(() => medioPorId(medioId.value));
const usaEfectivo = computed(() => methodUsesCashEntry(medio.value));
const tarjetaEfectiva = computed(() => effectiveCardKind(medio.value, tipoTarjeta.value));
const opcionesCuotas = computed(() => installmentOptions(medio.value, tarjetaEfectiva.value));

function opcionesCuotasFila(row) {
  const m = medioPorId(row.payment_method_id);
  return installmentOptions(m, effectiveCardKind(m, row.card_kind));
}

// ── Precios: la misma regla que el escritorio ──────────────────────────────
function usaLista(n = cuotas.value) {
  if (applyReseller.value) return false;
  if (mixto.value) {
    return filasMixto.value.some((row) => {
      const m = medioPorId(row.payment_method_id);
      if (!m || montoANumero(row.amount) <= 0) return false;
      return methodUsesListPrice(m, effectiveCardKind(m, row.card_kind), row.installments);
    });
  }
  if (!medio.value) return false;
  return methodUsesListPrice(medio.value, tarjetaEfectiva.value, n);
}
function totalCon(n) {
  const lista = usaLista(n);
  return (cartItems.value || []).reduce((a, it) => a + pickPrice(it, { usesList: lista, reseller: applyReseller.value }).subtotal, 0);
}
const lineas = computed(() => {
  const lista = usaLista();
  return (cartItems.value || []).map((it, i) => {
    const p = pickPrice(it, { usesList: lista, reseller: applyReseller.value });
    return { key: it.id ?? i, name: it.name, qty: p.qty, unit: p.unit, subtotal: p.subtotal, raw: it };
  });
});
const total = computed(() => lineas.value.reduce((a, l) => a + l.subtotal, 0));
const cantidad = computed(() => lineas.value.reduce((a, l) => a + Number(l.qty || 0), 0));

// ── Efectivo ───────────────────────────────────────────────────────────────
const recibido = computed(() => montoANumero(recibidoTxt.value));
const falta = computed(() => Math.max(0, total.value - recibido.value));
const vuelto = computed(() => Math.max(0, recibido.value - total.value));
const rapidos = computed(() => {
  const t = Math.ceil(total.value);
  return [...new Set([t, Math.ceil(t / 1000) * 1000, Math.ceil(t / 10000) * 10000, Math.ceil(t / 20000) * 20000])];
});
function setRecibido(v) { recibidoTxt.value = formatearMonto(String(v)); }
function onRecibido(e) {
  recibidoTxt.value = formatearMonto(e.target.value);
  e.target.value = recibidoTxt.value;
}

// ── Mixto ──────────────────────────────────────────────────────────────────
function filaNueva(id = medios.value[0]?.id ?? null, amount = "") {
  return reactive({ uid: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, payment_method_id: id, amount, installments: 1, reference: "", card_kind: "CREDIT" });
}
const pagadoMixto = computed(() => filasMixto.value.reduce((a, r) => a + montoANumero(r.amount), 0));
const faltaMixto = computed(() => Math.max(0, total.value - pagadoMixto.value));
const vueltoMixto = computed(() => Math.max(0, pagadoMixto.value - total.value));
function agregarFila() {
  filasMixto.value.push(filaNueva(medios.value[0]?.id, faltaMixto.value > 0 ? formatearMonto(String(Math.round(faltaMixto.value))) : ""));
}
function quitarFila(i) { filasMixto.value.splice(i, 1); }
function onMontoFila(row, e) {
  row.amount = formatearMonto(e.target.value);
  e.target.value = row.amount;
}

// ── Pasos ──────────────────────────────────────────────────────────────────
const comprobanteActual = computed(() => COMPROBANTES.find((c) => c.key === comprobante.value) || COMPROBANTES[0]);
const esFiscal = computed(() => comprobanteActual.value.mode === "FISCAL");
const tituloPaso = computed(() => {
  if (paso.value === 1) return "Medio de pago";
  if (paso.value === 2) return mixto.value ? "Mixto" : methodLabel(medio.value);
  if (paso.value === 3) return "Comprobante";
  return "Confirmar";
});
const resumenMedio = computed(() => {
  if (!mixto.value) {
    const m = medio.value;
    if (!m) return "";
    let s = methodLabel(m);
    if (methodSupportsInstallments(m, tarjetaEfectiva.value) && cuotas.value > 1) s += ` · ${cuotas.value} cuotas`;
    return s;
  }
  return filasMixto.value
    .filter((r) => montoANumero(r.amount) > 0)
    .map((r) => `${methodLabel(medioPorId(r.payment_method_id))} ${pesos(montoANumero(r.amount))}`)
    .join(" + ");
});

const puedeSeguir = computed(() => {
  if (paso.value === 1) return mixto.value || !!medio.value;
  if (paso.value === 2) {
    if (mixto.value) return pagadoMixto.value > 0 && faltaMixto.value <= 0;
    if (usaEfectivo.value) return recibido.value > 0 && falta.value <= 0;
    return !!medio.value;
  }
  if (paso.value === 3) return !esFiscal.value || (!!clienteNombre.value.trim() && !!clienteDoc.value.trim());
  return true;
});

function elegirMedio(id) {
  mixto.value = false;
  medioId.value = Number(id);
}
function elegirMixto() {
  mixto.value = true;
  if (!filasMixto.value.length) filasMixto.value = [filaNueva()];
}
watch(medio, (m) => {
  if (!m) return;
  const configured = String(m.card_kind || "CREDIT").toUpperCase();
  tipoTarjeta.value = configured === "DEBIT" || configured === "PREPAID" ? "DEBIT" : "CREDIT";
  const ops = installmentOptions(m, tarjetaEfectiva.value);
  cuotas.value = ops.some((o) => o.n === m.default_installments) ? m.default_installments : ops[0]?.n || 1;
  if (!methodNeedsReference(m)) referencia.value = "";
});
watch(tarjetaEfectiva, () => {
  if (!opcionesCuotas.value.some((o) => o.n === cuotas.value)) cuotas.value = opcionesCuotas.value[0]?.n || 1;
});

function siguiente() {
  if (!puedeSeguir.value) return;
  paso.value += 1;
  if (paso.value === 2 && usaEfectivo.value && !mixto.value) {
    if (!recibidoTxt.value) setRecibido(Math.ceil(total.value));
    nextTick(() => recibidoRef.value?.focus());
  }
}
// La flecha vuelve un paso; desde el primero, a la venta en curso.
function onVolver() {
  if (enviando.value) return;
  if (paso.value > 1) {
    paso.value -= 1;
    errorVenta.value = "";
    return;
  }
  saliendo = true;
  if (window.history.state?.back) router.back();
  else router.replace({ name: "pos" });
}
// El botón atrás del teléfono hace lo mismo que la flecha.
onBeforeRouteLeave(() => {
  if (enviando.value) return false;
  if (paso.value > 1 && !resultado.value && !saliendo) {
    paso.value -= 1;
    errorVenta.value = "";
    return false;
  }
  return true;
});

// ── Confirmar ──────────────────────────────────────────────────────────────
async function confirmar() {
  if (enviando.value) return;
  enviando.value = true;
  errorVenta.value = "";
  const c = comprobanteActual.value;
  const payload = {
    payment_method_id: mixto.value ? null : medio.value?.id ?? null,
    card_kind: tarjetaEfectiva.value,
    installments: mixto.value ? 1 : Number(cuotas.value || 1),
    apply_reseller: !!applyReseller.value,
    proof: referencia.value || null,
    cash_received: !mixto.value && usaEfectivo.value ? recibido.value : null,
    change: mixto.value ? vueltoMixto.value : vuelto.value,
    mixed_mode: mixto.value,
    mixed_payments: mixto.value
      ? filasMixto.value.map((r) => ({
          payment_method_id: r.payment_method_id != null ? Number(r.payment_method_id) : null,
          amount: montoANumero(r.amount),
          installments: Number(r.installments || 1),
          reference: r.reference || null,
          card_kind: effectiveCardKind(medioPorId(r.payment_method_id), r.card_kind),
        }))
      : [],
    invoice_mode: c.mode,
    invoice_type: c.tipo,
    customer_type: c.cliente,
    customer_name: esFiscal.value ? clienteNombre.value || null : null,
    customer_doc: esFiscal.value ? clienteDoc.value || null : null,
    customer_phone: esFiscal.value ? clienteTel.value || null : null,
    total: total.value,
    total_preview: total.value,
    items: lineas.value.map((l) => ({
      product_id: l.raw.product_id ?? l.raw.id,
      quantity: l.qty,
      unit_price: l.unit,
    })),
  };
  const totalCobrado = total.value;
  const sub = mixto.value ? "Mixto" : `${methodLabel(medio.value)}${usaEfectivo.value ? ` · Vuelto ${pesos(vuelto.value)}` : ""}`;
  try {
    const res = await onCheckoutConfirm(payload);
    if (!res) {
      // Sin caja abierta: el flujo ya llevó a Abrir caja.
      return;
    }
    receiptOpen.value = false;
    const venta = res?.sale || receiptSale.value || posStore.last_sale || {};
    resultado.value = { id: venta.id || venta.sale_number || "", total: totalCobrado, sub, venta };
    window.dispatchEvent(new CustomEvent("pos:caja-cambio"));
  } catch (e) {
    errorVenta.value = !navigator.onLine ? "Sin conexión" : "La venta no se registró";
  } finally {
    enviando.value = false;
  }
}

// ── Venta registrada ───────────────────────────────────────────────────────
const compartiendo = ref(false);
async function onCompartir() {
  if (!resultado.value?.venta?.id) return;
  compartiendo.value = true;
  try {
    await compartirTicket(resultado.value.venta, { branchName: branchName.value || "" });
  } catch {
    toast("No se pudo compartir el ticket");
  } finally {
    compartiendo.value = false;
  }
}
const mailAbierto = ref(false);
const mailTo = ref("");
const mailError = ref("");
const mailEnviando = ref(false);
async function onMail() {
  const to = mailTo.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) { mailError.value = "Email inválido"; return; }
  mailError.value = "";
  mailEnviando.value = true;
  try {
    await enviarTicketPorEmail(resultado.value.venta, to, { branchName: branchName.value || "" });
    mailAbierto.value = false;
    toast("Ticket enviado");
  } catch (e) {
    mailError.value = e?.response?.data?.message || "No se pudo enviar";
  } finally {
    mailEnviando.value = false;
  }
}

onMounted(async () => {
  await flow.initOnce?.();
  if (!(cartItems.value || []).length) {
    saliendo = true;
    router.replace({ name: "pos" });
    return;
  }
  if (!medios.value.length) {
    cargandoMedios.value = true;
    try { await loadPaymentMethods(); } finally { cargandoMedios.value = false; }
  }
  // Arranca en el primero (el más usado), igual que el escritorio.
  medioId.value = medios.value.find((m) => m.kind === "CASH")?.id ?? medios.value[0]?.id ?? null;
  if (!medios.value.length) toast("Sin medios de pago");
});
</script>

<style scoped>
.cb-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 14px 16px;
  background: var(--m-pieza);
  border-bottom: 1px solid var(--m-linea);
  flex: none;
}
.cb-total span { font-size: 14px; color: var(--m-suave); font-weight: 600; }
.cb-total b { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
.cb-pasos { display: flex; gap: 6px; padding: 12px 16px 0; flex: none; }
.cb-pasos s { flex: 1; height: 4px; border-radius: 2px; background: var(--m-linea); }
.cb-pasos s.ok { background: var(--m-accion); }
.cb-paso-t { padding: 8px 16px 0; font-size: 13px; color: var(--m-sobre-canvas); font-weight: 600; flex: none; }
.cb-mixto, .cb-mail { display: flex; flex-direction: column; gap: 12px; }
:deep(.cb-ok) { justify-content: center; }
.cb-ok__cab { display: flex; flex-direction: column; align-items: center; gap: 10px; margin-bottom: 8px; text-align: center; }
.cb-ok__ic { width: 96px; height: 96px; border-radius: 50%; display: grid; place-items: center; background: var(--m-verde-tinte); color: var(--m-verde); }
.cb-ok__ic .v-icon { color: var(--m-verde); }
.cb-ok__tit { font-size: 20px; font-weight: 800; }
</style>
