<!-- src/modules/service/pages/ServiceOrderEditorPage.vue
     Ficha de una orden de servicio tecnico.

     Lienzo aprobado (artboard «3b · Ficha de la orden, versión 2»):
     https://claude.ai/artifact/Qee3bS6R5sweKECTbrDm5K

     La version 1 confundia: tres lugares para WhatsApp, una nota opcional que
     parecia obligatoria al lado del boton y enlaces sueltos compitiendo con el
     paso principal. Ahora arriba hay UN bloque, «que sigue»: en que esta el
     equipo, quien lo tiene y un solo boton, que cuando corresponde tambien le
     avisa al cliente. Todo lo demas va a «Otras opciones». Debajo, tres
     tarjetas de lectura (Equipo, Cobro, Cliente) y al final el historial.

     El saldo NO se edita: sale de presupuesto menos seña. Si fuera editable, la
     primera diferencia de tipeo desarma la caja. -->
<template>
  <div class="sv" style="max-width: 1160px">
    <router-link :to="{ name: 'serviceOrders' }" class="sv-volver">
      <v-icon size="18">mdi-chevron-left</v-icon> Servicio técnico
    </router-link>

    <!-- Cabecera -->
    <div class="sv-cabecera" style="align-items: center">
      <div class="d-flex flex-column ga-1" style="min-width: 0">
        <div class="text-body-2 sv-suave">{{ orden.numero_visible }}<template v-if="diasTexto"> · {{ diasTexto }}</template></div>
        <h1 class="sv-h1">{{ equipo || "Equipo" }} · {{ orden.customer_name || "Cliente" }}</h1>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="outlined" size="large" prepend-icon="mdi-printer-outline" :loading="imprimiendo" @click="imprimir">Imprimir</v-btn>
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="outlined" size="large" color="success" prepend-icon="mdi-whatsapp" append-icon="mdi-chevron-down" :disabled="!orden.customer_phone" :loading="!!enviando">
              WhatsApp
            </v-btn>
          </template>
          <v-list density="comfortable">
            <v-list-item title="Avisar el estado actual" :subtitle="statusLabel(orden.status)" @click="enviarWhatsapp('estado')" />
            <v-list-item title="Reenviar el comprobante de ingreso" @click="enviarWhatsapp('comprobante')" />
          </v-list>
        </v-menu>
      </div>
    </div>

    <v-alert v-if="linkPendiente" type="info" variant="tonal" density="compact">
      <div class="d-flex align-center flex-wrap ga-2">
        <span class="flex-grow-1">Mensaje listo para enviar.</span>
        <v-btn size="small" color="success" variant="flat" prepend-icon="mdi-whatsapp" :href="linkPendiente" target="_blank" rel="noopener" @click="linkPendiente = null">
          Abrir WhatsApp
        </v-btn>
      </div>
    </v-alert>

    <!-- QUE SIGUE -->
    <section class="sv-card ahora">
      <div class="progreso" aria-label="Recorrido de la orden">
        <template v-for="(p, i) in PROGRESO" :key="p.value">
          <span v-if="i > 0" class="progreso-linea" :class="{ hecho: i <= pasoProgreso }" />
          <span class="progreso-paso" :class="{ hecho: i < pasoProgreso, actual: i === pasoProgreso }">
            <template v-if="i < pasoProgreso">✓ </template>{{ p.label }}
          </span>
        </template>
      </div>

      <div>
        <div class="ahora-titulo">{{ ahora.titulo }}</div>
        <div v-if="ahora.texto" class="ahora-texto">{{ ahora.texto }}</div>
      </div>

      <!-- Derivar / otro estado (desde Otras opciones) -->
      <div v-if="modo === 'derivar'" class="d-flex align-end ga-3 flex-wrap">
        <label class="sv-campo" style="flex: 0 1 260px">
          <span>Técnico</span>
          <select v-model="derivar.id" class="sv-select">
            <option :value="null">Sin derivar</option>
            <option v-for="t in tecnicosItems" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </label>
        <label class="sv-campo" style="flex: 1 1 240px">
          <span>Nota para el técnico (opcional)</span>
          <input v-model="derivar.nota" class="sv-input" />
        </label>
        <v-btn color="primary" variant="flat" size="x-large" :loading="guardando" @click="guardarDerivar">Guardar</v-btn>
        <v-btn variant="text" size="x-large" @click="modo = null">Cancelar</v-btn>
      </div>

      <div v-else-if="modo === 'estado'" class="d-flex align-end ga-3 flex-wrap">
        <label class="sv-campo" style="flex: 0 1 260px">
          <span>Estado</span>
          <select v-model="otroEstado" class="sv-select">
            <option v-for="st in SERVICE_STATUS" :key="st.value" :value="st.value">{{ st.label }}</option>
          </select>
        </label>
        <label class="sv-campo" style="flex: 1 1 240px">
          <span>Motivo (opcional)</span>
          <input v-model="notaEstado" class="sv-input" />
        </label>
        <v-btn color="primary" variant="flat" size="x-large" :loading="avanzando" @click="cambiarEstado(otroEstado, {}, notaEstado)">Guardar</v-btn>
        <v-btn variant="text" size="x-large" @click="modo = null">Cancelar</v-btn>
      </div>

      <template v-else>
        <!-- Lo que el paso pide -->
        <div v-if="ahora.pide.length" class="ahora-campos">
          <label v-if="ahora.pide.includes('tecnico')" class="sv-campo">
            <span>Técnico</span>
            <select v-model="paso.tecnico" class="sv-select">
              <option :value="null">Elegir…</option>
              <option v-for="t in tecnicosItems" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </label>
          <label v-if="ahora.pide.includes('reporte')" class="sv-campo">
            <span>{{ orden.status === "en_reparacion" ? "Qué se hizo (opcional)" : "Qué tiene" }}</span>
            <input v-model="paso.reporte" class="sv-input" />
          </label>
          <label v-if="ahora.pide.includes('presupuesto')" class="sv-campo">
            <span>Cuánto sale</span>
            <input v-model.number="paso.presupuesto" class="sv-input" type="number" min="0" inputmode="numeric" placeholder="$" />
          </label>
        </div>

        <div class="d-flex align-center ga-3 flex-wrap">
          <v-btn
            v-if="ahora.boton"
            color="primary"
            variant="flat"
            size="x-large"
            append-icon="mdi-arrow-right"
            :loading="avanzando"
            :disabled="!pasoListo"
            @click="avanzar"
          >
            {{ ahora.boton }}
          </v-btn>
          <v-btn v-if="ahora.secundario" variant="outlined" size="x-large" :loading="avanzando" @click="ahora.secundario.accion()">
            {{ ahora.secundario.label }}
          </v-btn>
          <span class="flex-grow-1" />
          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="outlined" size="large" append-icon="mdi-chevron-down">Otras opciones</v-btn>
            </template>
            <v-list density="comfortable">
              <v-list-item :title="orden.technician_id ? 'Cambiar técnico' : 'Derivar a un técnico'" prepend-icon="mdi-account-switch-outline" @click="abrirDerivar" />
              <v-list-item v-if="!['sin_solucion', 'entregado'].includes(orden.status)" title="No tiene arreglo" prepend-icon="mdi-close-circle-outline" @click="cambiarEstado('sin_solucion')" />
              <v-list-item title="Elegir otro estado" prepend-icon="mdi-swap-horizontal" @click="abrirOtroEstado" />
            </v-list>
          </v-menu>
        </div>
      </template>
    </section>

    <!-- Edicion de datos: reemplaza a las tarjetas mientras dura -->
    <section v-if="editando" class="sv-card">
      <div class="sv-card-titulo"><h2>Editar datos</h2></div>
      <div class="sv-grilla-3">
        <label class="sv-campo"><span>Equipo</span><input v-model="ed.device_model" class="sv-input" /></label>
        <label class="sv-campo"><span>IMEI</span><input v-model="ed.device_imei" class="sv-input" /></label>
        <label class="sv-campo"><span>Desbloqueo</span><input v-model="ed.device_unlock" class="sv-input" /></label>
      </div>
      <label class="sv-campo"><span>Falla</span><textarea v-model="ed.reported_fault" class="sv-textarea" rows="2" /></label>
      <div class="sv-grilla-2">
        <label class="sv-campo"><span>Queda con el equipo</span><input v-model="ed.device_accessories" class="sv-input" /></label>
        <label class="sv-campo"><span>Estado al ingresar</span><input v-model="ed.intake_condition" class="sv-input" /></label>
      </div>
      <label class="sv-campo"><span>Diagnóstico / trabajo del técnico</span><textarea v-model="ed.technical_report" class="sv-textarea" rows="2" /></label>
      <label class="sv-campo"><span>Sugerencias al cliente</span><textarea v-model="ed.suggestions" class="sv-textarea" rows="2" /></label>
      <div class="sv-grilla-3">
        <label class="sv-campo"><span>Cliente</span><input v-model="ed.customer_name" class="sv-input" /></label>
        <label class="sv-campo"><span>Teléfono</span><input v-model="ed.customer_phone" class="sv-input" /></label>
        <label class="sv-campo"><span>Retiro prometido</span><input v-model="ed.estimated_pickup" class="sv-input" type="date" /></label>
      </div>
      <div class="d-flex ga-2 justify-end">
        <v-btn variant="text" size="large" @click="editando = false">Cancelar</v-btn>
        <v-btn color="primary" variant="flat" size="large" :loading="guardando" @click="guardarEdicion">Guardar cambios</v-btn>
      </div>
    </section>

    <!-- Tres tarjetas de lectura -->
    <div v-else class="tarjetas">
      <section class="sv-card">
        <div class="sv-card-titulo"><h2>Equipo</h2><button type="button" class="sv-enlace" @click="abrirEdicion">Editar</button></div>
        <div class="dato"><span>Falla</span><strong>{{ orden.reported_fault || "—" }}</strong></div>
        <div v-if="orden.technical_report" class="dato"><span>Diagnóstico</span><strong>{{ orden.technical_report }}</strong></div>
        <div class="dato"><span>Queda con el equipo</span><strong>{{ orden.device_accessories || "Nada" }}</strong></div>
        <div class="d-flex align-center ga-3">
          <PatronDesbloqueo v-if="patronGuardado.length" :model-value="patronGuardado" :tam="72" solo-lectura />
          <div class="dato"><span>Desbloqueo</span><strong>{{ orden.device_unlock || "—" }}</strong></div>
        </div>
        <div v-if="orden.device_imei" class="dato"><span>IMEI</span><strong>{{ orden.device_imei }}</strong></div>
        <div v-if="orden.intake_condition" class="dato"><span>Estado al ingresar</span><strong>{{ orden.intake_condition }}</strong></div>
      </section>

      <section class="sv-card">
        <div class="sv-card-titulo"><h2>Cobro</h2><button v-if="!editandoCobro" type="button" class="sv-enlace" @click="abrirCobro">Editar</button></div>
        <template v-if="!editandoCobro">
          <div class="cuenta"><span>Presupuesto</span><strong>{{ money(orden.quoted_amount) }}</strong></div>
          <div class="cuenta"><span>Seña</span><strong>− {{ money(orden.deposit) }}</strong></div>
          <div class="cuenta-linea" />
          <div class="cuenta cuenta--saldo" :class="{ 'cuenta--debe': saldo > 0 }"><span>Saldo</span><strong>{{ money(saldo) }}</strong></div>
        </template>
        <template v-else>
          <label class="sv-campo"><span>Presupuesto</span><input v-model.number="cobro.quoted_amount" class="sv-input" type="number" min="0" /></label>
          <label class="sv-campo"><span>Seña</span><input v-model.number="cobro.deposit" class="sv-input" type="number" min="0" /></label>
          <div class="cuenta cuenta--saldo"><span>Saldo</span><strong>{{ money(saldoEditando) }}</strong></div>
          <div class="d-flex ga-2 justify-end">
            <v-btn variant="text" @click="editandoCobro = false">Cancelar</v-btn>
            <v-btn color="primary" variant="flat" :loading="guardando" @click="guardarCobro">Guardar</v-btn>
          </div>
        </template>
        <button type="button" class="sv-enlace" style="align-self: flex-start" @click="verDetalleCobro = !verDetalleCobro">
          {{ verDetalleCobro ? "Ocultar repuestos" : `Repuestos (${orden.items?.length || 0}) y precio de lista` }}
        </button>
      </section>

      <section class="sv-card">
        <div class="sv-card-titulo"><h2>Cliente</h2><button type="button" class="sv-enlace" @click="abrirEdicion">Editar</button></div>
        <div class="dato"><span>Nombre</span><strong>{{ orden.customer_name || "—" }}</strong></div>
        <div class="dato"><span>Teléfono</span><strong>{{ orden.customer_phone || "—" }}</strong></div>
        <div class="dato"><span>Retiro prometido</span><strong>{{ fecha(orden.estimated_pickup) }}</strong></div>
        <div class="dato"><span>Recibió</span><strong>{{ orden.received_by || "—" }} · {{ fechaHora(orden.created_at) }}</strong></div>
      </section>
    </div>

    <!-- Repuestos y precio de lista, a demanda -->
    <section v-if="verDetalleCobro && !editando" class="sv-card">
      <div class="sv-card-titulo"><h2>Repuestos y mano de obra</h2></div>
      <div class="d-flex flex-column">
        <div v-if="!orden.items?.length" class="text-body-2 sv-suave">Sin repuestos cargados.</div>
        <div v-for="it in orden.items" :key="it.id" class="renglon">
          <span class="flex-grow-1">{{ it.description }}<span v-if="Number(it.qty) !== 1" class="sv-suave"> × {{ Number(it.qty) }}</span></span>
          <span v-if="Number(it.cost) > 0" class="text-body-2 sv-suave text-no-wrap">costo {{ money(it.cost) }}</span>
          <strong class="renglon-precio">{{ money(it.line_total) }}</strong>
          <v-btn icon="mdi-close" size="small" variant="text" :aria-label="`Quitar ${it.description}`" @click="borrarRenglon(it)" />
        </div>
        <div v-if="agregando" class="d-flex align-end ga-2 flex-wrap mt-3">
          <label class="sv-campo" style="flex: 2 1 220px"><span>Descripción</span><input v-model="nuevoRenglon.description" class="sv-input" /></label>
          <label class="sv-campo" style="flex: 0 1 150px">
            <span>Tipo</span>
            <select v-model="nuevoRenglon.kind" class="sv-select">
              <option value="repuesto">Repuesto</option>
              <option value="mano_obra">Mano de obra</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label class="sv-campo" style="flex: 0 1 90px"><span>Cant.</span><input v-model.number="nuevoRenglon.qty" class="sv-input" type="number" min="1" /></label>
          <label class="sv-campo" style="flex: 0 1 130px"><span>Costo</span><input v-model.number="nuevoRenglon.cost" class="sv-input" type="number" min="0" /></label>
          <label class="sv-campo" style="flex: 0 1 130px"><span>Precio</span><input v-model.number="nuevoRenglon.unit_price" class="sv-input" type="number" min="0" /></label>
          <v-btn color="primary" variant="flat" size="large" :loading="guardandoRenglon" @click="agregarRenglon">Agregar</v-btn>
          <v-btn variant="text" size="large" @click="agregando = false">Cancelar</v-btn>
        </div>
        <button v-else type="button" class="agregar" @click="agregando = true">+ Agregar repuesto o mano de obra</button>
      </div>

      <div class="sv-rotulo mt-2">Precio de lista</div>
      <input v-model="qPrecio" class="sv-input" placeholder="Modelo del equipo" @input="buscarPreciosConDemora" />
      <div v-if="qPrecio && !resultadosPrecio.length" class="text-body-2 sv-suave">Sin precio cargado para ese modelo.</div>
      <div v-for="p in resultadosPrecio" :key="p.id" class="renglon">
        <span class="flex-grow-1">{{ p.model }}</span>
        <strong class="text-no-wrap">{{ money(p.total_price) }}</strong>
        <span class="text-body-2 sv-suave text-no-wrap">3 × {{ money(p.installment_3) }}</span>
        <v-btn size="small" variant="tonal" color="primary" :loading="guardando" @click="usarPrecio(p)">Usar</v-btn>
      </div>
      <div v-if="tieneReparto" class="text-body-2 sv-suave">
        Reparto: técnico {{ money(orden.commission_technician) }} · vendedor {{ money(orden.commission_seller) }} · local {{ money(orden.commission_shop) }}
      </div>
    </section>

    <!-- Historial -->
    <section class="sv-card">
      <div class="sv-card-titulo">
        <h2>Historial <span class="font-weight-regular sv-suave">· {{ eventos.length }} {{ eventos.length === 1 ? "movimiento" : "movimientos" }}</span></h2>
        <div class="d-flex ga-2" style="flex: 1 1 320px; max-width: 520px">
          <input v-model="nuevaNota" class="sv-input" style="height: 42px" placeholder="Agregar una nota interna" @keyup.enter="agregarNota" />
          <v-btn variant="tonal" :loading="agregandoNota" :disabled="!nuevaNota.trim()" @click="agregarNota">Agregar</v-btn>
        </div>
      </div>
      <div v-if="!eventos.length" class="text-body-2 sv-suave">Sin movimientos registrados.</div>
      <div v-for="ev in eventos" :key="ev.id" class="historial-fila">
        <span class="sv-suave">{{ fechaHora(ev.created_at) }}</span>
        <span><strong>{{ tituloEvento(ev) }}</strong><template v-if="ev.note"> · {{ ev.note }}</template></span>
        <span class="sv-suave text-right">{{ ev.user_name || "" }}</span>
      </div>
    </section>

    <v-snackbar v-model="aviso.show" :color="aviso.color" timeout="3500">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import "../styles/servicio.css";
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { exportServiceOrderPdf, loadServiceIdentity } from "../utils/serviceOrderPdf";
import { fmtFecha, fmtFechaHora } from "../utils/fechas";
import { abrirWhatsapp } from "../utils/whatsapp";
import PatronDesbloqueo from "../components/PatronDesbloqueo.vue";
import {
  getOrder,
  updateOrder,
  addOrderItem,
  deleteOrderItem,
  addOrderNote,
  sendOrderWhatsapp,
  listTechnicians,
  searchPrices,
  SERVICE_STATUS,
  statusLabel,
} from "../services/service.service";

const route = useRoute();
const orden = ref({ items: [], events: [] });

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

const money = (v) =>
  Number(v || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fecha = (v) => fmtFecha(v, "A definir");
const fechaHora = (v) => fmtFechaHora(v, "—");
const errorDe = (e, msg) => e?.response?.data?.message || msg;

const equipo = computed(() => [orden.value.device_brand, orden.value.device_model].filter(Boolean).join(" "));
const primerNombre = computed(() => String(orden.value.customer_name || "").trim().split(/\s+/)[0] || "el cliente");
const saldo = computed(() => Math.max(0, Number(orden.value.quoted_amount || 0) - Number(orden.value.deposit || 0)));
const tieneReparto = computed(
  () => Number(orden.value.commission_technician) + Number(orden.value.commission_seller) + Number(orden.value.commission_shop) > 0
);

// "Patrón 1-5-9" (como lo guarda el ingreso) se dibuja; un PIN o un texto
// del libro viejo se muestra tal cual.
const patronGuardado = computed(() => {
  const m = /^patr[oó]n\s+([1-9](?:-[1-9])+)$/i.exec(String(orden.value.device_unlock || "").trim());
  return m ? m[1].split("-").map(Number) : [];
});

const diasTexto = computed(() => {
  if (!orden.value.created_at || orden.value.status === "entregado") return "";
  const dias = Math.floor((Date.now() - new Date(orden.value.created_at).getTime()) / 86400000);
  if (dias <= 0) return "ingresó hoy";
  return `ingresó hace ${dias} ${dias === 1 ? "día" : "días"}`;
});

function aplicar(data) {
  orden.value = { items: [], events: [], ...(data || {}) };
}

async function cargar() {
  try {
    const { data } = await getOrder(route.params.id);
    aplicar(data?.data);
  } catch (e) {
    notificar(errorDe(e, "No se pudo cargar la orden."), "error");
  }
}

// Guarda solo lo que se manda: el PUT no toca lo que no viene.
const guardando = ref(false);
async function guardarParcial(campos, mensaje = "Guardado.") {
  guardando.value = true;
  try {
    const { data } = await updateOrder(route.params.id, campos);
    aplicar(data?.data);
    if (mensaje) notificar(mensaje);
    return data;
  } catch (e) {
    notificar(errorDe(e, "No se pudo guardar."), "error");
    return null;
  } finally {
    guardando.value = false;
  }
}

// ── Que sigue ──────────────────────────────────────────────────────────────
// Seis pasos a la vista (aprobado se lee como parte del presupuesto).
const PROGRESO = [
  { value: "recibido", label: "Recibido" },
  { value: "diagnostico", label: "Diagnóstico" },
  { value: "presupuestado", label: "Presupuesto" },
  { value: "en_reparacion", label: "Reparación" },
  { value: "reparado", label: "Listo" },
  { value: "entregado", label: "Entregado" },
];
const PASO_DE = {
  recibido: 0, diagnostico: 1, presupuestado: 2, aprobado: 2, en_reparacion: 3,
  reparado: 4, no_retirado: 4, sin_solucion: 4, entregado: 5,
};
const pasoProgreso = computed(() => PASO_DE[orden.value.status] ?? 0);

// Lo que dice el bloque, lo que pide y a donde lleva, segun el estado. Cuando
// el paso es para el cliente (presupuesto, listo), el mismo boton le avisa.
const ahora = computed(() => {
  const o = orden.value;
  const tec = o.technician_name;
  const avisa = !!o.customer_phone;
  const quien = primerNombre.value;
  switch (o.status) {
    case "recibido":
      return tec
        ? { titulo: "Falta revisarlo", texto: `Lo tiene ${tec}.`, pide: [], boton: "Empezar diagnóstico", to: "diagnostico" }
        : { titulo: "Falta derivarlo", texto: "Elegir quién lo revisa.", pide: ["tecnico"], boton: "Derivar y empezar diagnóstico", to: "diagnostico" };
    case "diagnostico":
      return {
        titulo: "Falta el diagnóstico",
        texto: `${tec ? `Lo tiene ${tec}. ` : ""}Cargar qué tiene y cuánto sale${avisa ? `; se le avisa a ${quien}` : ""}.`,
        pide: ["reporte", "presupuesto"],
        boton: avisa ? `Guardar presupuesto y avisar a ${quien}` : "Guardar presupuesto",
        to: "presupuestado",
        avisar: avisa,
      };
    case "presupuestado":
      return {
        titulo: `Esperando que ${quien} apruebe ${money(o.quoted_amount)}`,
        texto: o.technical_report ? `Diagnóstico: ${o.technical_report}` : "",
        pide: [],
        boton: "Aprobó: a reparar",
        to: "en_reparacion",
        secundario: { label: "No aprobó", accion: () => cambiarEstado("sin_solucion", {}, "No aprobó el presupuesto") },
      };
    case "aprobado":
      return { titulo: "Aprobado: falta repararlo", texto: tec ? `Lo tiene ${tec}.` : "", pide: [], boton: "Empezar reparación", to: "en_reparacion" };
    case "en_reparacion":
      return {
        titulo: "En reparación",
        texto: `${tec ? `Lo tiene ${tec}. ` : ""}Al terminar${avisa ? `, se le avisa a ${quien} que lo pase a buscar` : ""}.`,
        pide: ["reporte"],
        boton: avisa ? `Listo: avisar a ${quien}` : "Marcar listo para retirar",
        to: "reparado",
        avisar: avisa,
      };
    case "reparado":
    case "no_retirado":
      return {
        titulo: saldo.value > 0 ? `Listo para retirar · cobrar ${money(saldo.value)}` : "Listo para retirar",
        texto: o.status === "no_retirado" ? "Hace tiempo que está listo y no lo pasaron a buscar." : `Esperando a ${quien}.`,
        pide: [],
        boton: "Entregar al cliente",
        to: "entregado",
      };
    case "sin_solucion":
      return { titulo: "Sin arreglo: a devolver", texto: `Esperando a ${quien}.`, pide: [], boton: "Entregar al cliente", to: "entregado" };
    case "entregado":
      return { titulo: "Entregado", texto: o.delivered_at ? `El ${fecha(o.delivered_at)}.` : "", pide: [], boton: null };
    default:
      return { titulo: statusLabel(o.status), texto: "", pide: [], boton: null };
  }
});

const paso = ref({ reporte: "", presupuesto: null, tecnico: null });
const pasoListo = computed(() => {
  const pide = ahora.value.pide;
  if (pide.includes("tecnico") && !paso.value.tecnico) return false;
  if (pide.includes("presupuesto") && !(Number(paso.value.presupuesto) > 0)) return false;
  if (orden.value.status === "diagnostico" && !paso.value.reporte.trim()) return false;
  return true;
});

const avanzando = ref(false);
const modo = ref(null); // null | "derivar" | "estado"
const otroEstado = ref("recibido");
const notaEstado = ref("");

function prepararPaso() {
  paso.value = {
    reporte: orden.value.status === "en_reparacion" ? "" : orden.value.technical_report || "",
    presupuesto: Number(orden.value.quoted_amount) || null,
    tecnico: orden.value.technician_id || null,
  };
}

async function cambiarEstado(status, extra = {}, nota = "", avisar = false) {
  avanzando.value = true;
  try {
    const data = await guardarParcial({ status, nota: nota || undefined, ...extra }, null);
    if (!data) return;
    modo.value = null;
    notaEstado.value = "";
    prepararPaso();
    if (avisar && data.cambio_estado) await enviarWhatsapp("estado");
    else notificar(`Estado: ${statusLabel(orden.value.status)}.`);
  } finally {
    avanzando.value = false;
  }
}

function avanzar() {
  const a = ahora.value;
  const extra = {};
  if (a.pide.includes("tecnico")) extra.technician_id = paso.value.tecnico;
  if (a.pide.includes("reporte") && paso.value.reporte.trim()) extra.technical_report = paso.value.reporte.trim();
  if (a.pide.includes("presupuesto")) extra.quoted_amount = Number(paso.value.presupuesto) || 0;
  return cambiarEstado(a.to, extra, "", !!a.avisar);
}

function abrirOtroEstado() {
  otroEstado.value = orden.value.status || "recibido";
  notaEstado.value = "";
  modo.value = "estado";
}

// ── Tecnico ────────────────────────────────────────────────────────────────
const tecnicos = ref([]);
const tecnicosItems = computed(() => {
  const lista = [...tecnicos.value];
  // Derivado a alguien que despues dejo de ser tecnico: se sigue mostrando.
  if (orden.value.technician_id && !lista.some((t) => t.id === orden.value.technician_id)) {
    lista.push({ id: orden.value.technician_id, name: orden.value.technician_name || `Usuario ${orden.value.technician_id}` });
  }
  return lista;
});
const derivar = ref({ id: null, nota: "" });

function abrirDerivar() {
  derivar.value = { id: orden.value.technician_id || null, nota: "" };
  modo.value = "derivar";
}

async function guardarDerivar() {
  const data = await guardarParcial(
    { technician_id: derivar.value.id, nota: derivar.value.nota.trim() || undefined },
    derivar.value.id ? "Orden derivada." : "Orden sin técnico."
  );
  if (data) {
    modo.value = null;
    prepararPaso();
  }
}

// ── Edicion de datos ───────────────────────────────────────────────────────
const CAMPOS_EDITABLES = [
  "device_model", "device_imei", "device_unlock", "device_accessories",
  "intake_condition", "reported_fault", "technical_report", "suggestions",
  "customer_name", "customer_phone", "estimated_pickup",
];
const editando = ref(false);
const ed = ref({});

function abrirEdicion() {
  ed.value = Object.fromEntries(CAMPOS_EDITABLES.map((c) => [c, orden.value[c] ?? ""]));
  // El equipo se edita en un solo campo; la marca del libro viejo se suma.
  if (orden.value.device_brand) ed.value.device_model = equipo.value;
  editando.value = true;
}

async function guardarEdicion() {
  const data = await guardarParcial({ ...ed.value, device_brand: "" }, "Datos guardados.");
  if (data) {
    editando.value = false;
    prepararPaso();
  }
}

// ── Cobro ──────────────────────────────────────────────────────────────────
const editandoCobro = ref(false);
const verDetalleCobro = ref(false);
const cobro = ref({});
const saldoEditando = computed(() => Math.max(0, Number(cobro.value.quoted_amount || 0) - Number(cobro.value.deposit || 0)));

function abrirCobro() {
  cobro.value = { quoted_amount: Number(orden.value.quoted_amount) || 0, deposit: Number(orden.value.deposit) || 0 };
  editandoCobro.value = true;
}

async function guardarCobro() {
  const data = await guardarParcial({ ...cobro.value }, "Cobro guardado.");
  if (data) {
    editandoCobro.value = false;
    prepararPaso();
  }
}

const qPrecio = ref("");
const resultadosPrecio = ref([]);
let demoraPrecio = null;
function buscarPreciosConDemora() {
  clearTimeout(demoraPrecio);
  demoraPrecio = setTimeout(buscarPrecios, 350);
}
async function buscarPrecios() {
  if (qPrecio.value.trim().length < 2) {
    resultadosPrecio.value = [];
    return;
  }
  try {
    const { data } = await searchPrices({ q: qPrecio.value.trim(), limit: 8 });
    resultadosPrecio.value = data?.data || [];
  } catch {
    resultadosPrecio.value = [];
  }
}

// Usar un precio completa presupuesto y reparto de una, como la hoja MODULOS.
async function usarPrecio(p) {
  const data = await guardarParcial(
    {
      quoted_amount: Number(p.total_price || 0),
      commission_technician: Number(p.technician_cost || 0),
      commission_seller: Number(p.seller_commission || 0),
      commission_shop: Number(p.shop_margin || 0),
    },
    `Precio de ${p.model} aplicado.`
  );
  if (data) prepararPaso();
}

// ── Renglones ──────────────────────────────────────────────────────────────
const agregando = ref(false);
const guardandoRenglon = ref(false);
const RENGLON_VACIO = { description: "", kind: "repuesto", qty: 1, cost: 0, unit_price: 0 };
const nuevoRenglon = ref({ ...RENGLON_VACIO });

async function agregarRenglon() {
  if (!nuevoRenglon.value.description.trim()) {
    notificar("Falta la descripción.", "warning");
    return;
  }
  guardandoRenglon.value = true;
  try {
    await addOrderItem(route.params.id, { ...nuevoRenglon.value });
    nuevoRenglon.value = { ...RENGLON_VACIO };
    agregando.value = false;
    await cargar();
  } catch (e) {
    notificar(errorDe(e, "No se pudo agregar."), "error");
  } finally {
    guardandoRenglon.value = false;
  }
}

async function borrarRenglon(it) {
  try {
    await deleteOrderItem(route.params.id, it.id);
    await cargar();
  } catch (e) {
    notificar(errorDe(e, "No se pudo quitar."), "error");
  }
}

// ── Historial ──────────────────────────────────────────────────────────────
// Lo mas nuevo arriba: es lo que se busca cuando el cliente llama.
const eventos = computed(() => [...(orden.value.events || [])].reverse());

function tituloEvento(ev) {
  if (ev.kind === "ingreso") return "Equipo recibido";
  if (ev.kind === "estado") return `Estado: ${statusLabel(ev.to_status)}`;
  if (ev.kind === "tecnico") return ev.technician_name ? `Derivado a ${ev.technician_name}` : "Sin técnico asignado";
  if (ev.kind === "aviso") return ev.note === "Comprobante de ingreso" ? "Comprobante enviado por WhatsApp" : "Aviso por WhatsApp";
  return "Nota";
}

const nuevaNota = ref("");
const agregandoNota = ref(false);
async function agregarNota() {
  const nota = nuevaNota.value.trim();
  if (!nota) return;
  agregandoNota.value = true;
  try {
    const { data } = await addOrderNote(route.params.id, nota);
    orden.value.events = data?.data || orden.value.events;
    nuevaNota.value = "";
  } catch (e) {
    notificar(errorDe(e, "No se pudo agregar la nota."), "error");
  } finally {
    agregandoNota.value = false;
  }
}

// ── Imprimir y WhatsApp ────────────────────────────────────────────────────
const imprimiendo = ref(false);
async function imprimir() {
  imprimiendo.value = true;
  try {
    const identity = await loadServiceIdentity(orden.value.branch_id);
    await exportServiceOrderPdf({ orden: orden.value, identity });
  } catch (e) {
    notificar(`No se pudo generar la orden: ${e?.message || e}`, "error");
  } finally {
    imprimiendo.value = false;
  }
}

const enviando = ref(null);
const linkPendiente = ref(null);
async function enviarWhatsapp(tipo) {
  enviando.value = tipo;
  try {
    const { data } = await sendOrderWhatsapp(route.params.id, tipo);
    const r = data?.data || {};
    if (r.events) orden.value.events = r.events;
    if (r.enviado) notificar("Mensaje enviado por WhatsApp.");
    else if (r.link) linkPendiente.value = abrirWhatsapp(r.link);
  } catch (e) {
    notificar(errorDe(e, "No se pudo armar el mensaje."), "error");
  } finally {
    enviando.value = null;
  }
}

onMounted(async () => {
  await cargar();
  prepararPaso();
  qPrecio.value = equipo.value;
  try {
    const { data } = await listTechnicians();
    tecnicos.value = data?.data || [];
  } catch {
    tecnicos.value = [];
  }
});
</script>

<style scoped>
.ahora {
  border: 1px solid rgb(var(--v-theme-primary));
  border-radius: 18px;
  padding: 24px 28px;
  gap: 20px;
}
.ahora-titulo {
  font-size: 22px;
  font-weight: 800;
  line-height: 1.25;
}
.ahora-texto {
  font-size: 15px;
  color: rgba(var(--v-theme-on-surface), 0.75);
  margin-top: 4px;
}
.ahora-campos {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 14px;
}
.ahora-campos > :only-child {
  grid-column: 1 / -1;
  max-width: 520px;
}
@media (max-width: 760px) {
  .ahora-campos {
    grid-template-columns: minmax(0, 1fr);
  }
}

.progreso {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 13px;
}
.progreso-paso {
  color: rgba(var(--v-theme-on-surface), 0.55);
}
.progreso-paso.hecho {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
.progreso-paso.actual {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 700;
}
.progreso-linea {
  width: 24px;
  height: 2px;
  background: rgba(var(--v-theme-on-surface), 0.15);
}
.progreso-linea.hecho {
  background: rgb(var(--v-theme-primary));
}

.tarjetas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}
@media (max-width: 900px) {
  .tarjetas {
    grid-template-columns: minmax(0, 1fr);
  }
}
.tarjetas .sv-card {
  padding: 20px 22px;
  gap: 14px;
}
.dato {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.dato span {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.66);
}
.dato strong {
  font-size: 15px;
  font-weight: 600;
  word-break: break-word;
}
.cuenta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 15px;
}
.cuenta span {
  color: rgba(var(--v-theme-on-surface), 0.66);
}
.cuenta--saldo span {
  color: rgb(var(--v-theme-on-surface));
  font-weight: 700;
}
.cuenta--saldo strong {
  font-size: 26px;
}
.cuenta--debe strong {
  color: rgb(var(--v-theme-warning));
}
.cuenta-linea {
  height: 1px;
  background: rgba(var(--v-border-color), var(--v-border-opacity));
}

.renglon {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
.renglon-precio {
  width: 100px;
  text-align: right;
}
.agregar {
  align-self: flex-start;
  margin-top: 8px;
  height: 40px;
  padding: 0 14px;
  border-radius: 10px;
  background: transparent;
  border: 1px dashed rgba(var(--v-border-color), 0.4);
  color: rgb(var(--v-theme-primary));
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.historial-fila {
  display: grid;
  grid-template-columns: 170px minmax(0, 1fr) 160px;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 14px;
}
@media (max-width: 760px) {
  .historial-fila {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
  .historial-fila .text-right {
    text-align: left !important;
  }
}
</style>
