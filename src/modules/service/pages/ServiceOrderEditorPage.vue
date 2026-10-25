<!-- src/modules/service/pages/ServiceOrderEditorPage.vue
     Ficha de una orden de servicio tecnico.

     Lienzo aprobado (artboard «3 · Ficha de la orden»):
     https://claude.ai/artifact/Qee3bS6R5sweKECTbrDm5K

     La ficha se LEE: arriba el recorrido de estados y un solo boton con el
     siguiente paso (con los datos que ese paso pide, p. ej. diagnostico y
     presupuesto para pasar a Presupuestado). Los datos se cambian en el lugar
     con "Editar", nunca en ventanas emergentes.

     El saldo NO se edita: sale de presupuesto menos seña. Si fuera editable, la
     primera diferencia de tipeo desarma la caja. -->
<template>
  <div class="sv">
    <router-link :to="{ name: 'serviceOrders' }" class="sv-volver">
      <v-icon size="18">mdi-chevron-left</v-icon> Servicio técnico
    </router-link>

    <!-- Cabecera -->
    <div class="sv-cabecera" style="align-items: flex-start">
      <div class="d-flex flex-column ga-1" style="min-width: 0">
        <div class="d-flex align-center ga-3 flex-wrap">
          <h1 class="sv-h1">{{ orden.numero_visible || "Orden" }}</h1>
          <span v-if="orden.status" :class="['sv-estado', `sv-estado--${statusColor(orden.status)}`]">{{ statusLabel(orden.status) }}</span>
          <span v-if="diasTexto" class="text-body-2 sv-suave">{{ diasTexto }}</span>
        </div>
        <div class="text-subtitle-1">
          <strong>{{ equipo || "Equipo" }}</strong>
          <span class="sv-suave"> · {{ fallaCorta }} · {{ orden.customer_name }}<template v-if="orden.customer_phone"> · {{ orden.customer_phone }}</template></span>
        </div>
      </div>
      <div class="d-flex ga-2 flex-wrap">
        <v-btn variant="outlined" prepend-icon="mdi-printer-outline" :loading="imprimiendo" @click="imprimir">Imprimir</v-btn>
        <v-btn
          variant="outlined"
          color="success"
          prepend-icon="mdi-whatsapp"
          :loading="enviando === 'estado'"
          :disabled="!orden.customer_phone"
          @click="enviarWhatsapp('estado')"
        >
          Avisar estado
        </v-btn>
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="outlined" icon="mdi-dots-vertical" aria-label="Más acciones" />
          </template>
          <v-list density="compact">
            <v-list-item :disabled="!orden.customer_phone" prepend-icon="mdi-whatsapp" title="Reenviar comprobante" @click="enviarWhatsapp('comprobante')" />
            <v-list-item prepend-icon="mdi-swap-horizontal" title="Elegir otro estado" @click="eligiendoEstado = true" />
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

    <!-- Recorrido y siguiente paso -->
    <section class="sv-card">
      <ol class="sv-recorrido">
        <li v-for="(p, i) in RECORRIDO" :key="p.value" :class="{ hecho: i < pasoActual, actual: i === pasoActual }">
          <span><template v-if="i < pasoActual">✓ </template>{{ p.label }}</span>
        </li>
      </ol>

      <div v-if="fueraDelRecorrido" class="text-body-2">
        Estado: <span :class="['sv-estado', `sv-estado--${statusColor(orden.status)}`]">{{ statusLabel(orden.status) }}</span>
      </div>

      <!-- Avisar despues de un cambio -->
      <v-alert v-if="ofrecerAviso" type="success" variant="tonal" density="compact" icon="mdi-whatsapp">
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="flex-grow-1">Estado guardado: {{ statusLabel(orden.status) }}. ¿Avisar al cliente?</span>
          <v-btn size="small" color="success" variant="flat" :loading="enviando === 'estado'" @click="enviarWhatsapp('estado')">Avisar por WhatsApp</v-btn>
          <v-btn size="small" variant="text" @click="ofrecerAviso = false">Ahora no</v-btn>
        </div>
      </v-alert>

      <template v-if="!eligiendoEstado && siguiente">
        <div class="d-flex align-end ga-4 flex-wrap">
          <label v-if="pideDiagnostico" class="sv-campo" style="flex: 1 1 260px">
            <span>{{ orden.status === "en_reparacion" ? "Trabajo realizado" : "Diagnóstico del técnico" }}</span>
            <input v-model="paso.reporte" class="sv-input" />
          </label>
          <label v-if="pidePresupuesto" class="sv-campo" style="flex: 0 1 200px">
            <span>Presupuesto</span>
            <input v-model.number="paso.presupuesto" class="sv-input" type="number" min="0" inputmode="numeric" />
          </label>
          <label v-if="!pideDiagnostico" class="sv-campo" style="flex: 1 1 260px">
            <span>Nota (opcional)</span>
            <input v-model="paso.nota" class="sv-input" />
          </label>
          <v-btn color="primary" variant="flat" size="x-large" append-icon="mdi-arrow-right" :loading="avanzando" :disabled="!pasoListo" @click="avanzar">
            {{ siguiente.label }}
          </v-btn>
        </div>
        <div class="d-flex align-center ga-4 flex-wrap text-body-2 sv-suave">
          <span v-if="orden.status === 'diagnostico'">Al pasar, se ofrece avisarle al cliente por WhatsApp con el monto.</span>
          <span v-else-if="orden.status === 'reparado' && saldo > 0">Saldo a cobrar al entregar: <strong>{{ money(saldo) }}</strong>.</span>
          <span class="flex-grow-1" />
          <button v-if="!['sin_solucion', 'entregado'].includes(orden.status)" type="button" class="sv-enlace" @click="cambiarEstado('sin_solucion')">Sin solución</button>
          <button type="button" class="sv-enlace" @click="eligiendoEstado = true">Elegir otro estado</button>
        </div>
      </template>

      <template v-else-if="!eligiendoEstado">
        <div class="d-flex align-center ga-4 flex-wrap text-body-2 sv-suave">
          <span class="flex-grow-1">
            <template v-if="orden.status === 'entregado'">Entregado{{ orden.delivered_at ? ` el ${fecha(orden.delivered_at)}` : "" }}.</template>
          </span>
          <button type="button" class="sv-enlace" @click="eligiendoEstado = true">Elegir otro estado</button>
        </div>
      </template>

      <div v-else class="d-flex align-end ga-3 flex-wrap">
        <label class="sv-campo" style="flex: 0 1 260px">
          <span>Estado</span>
          <select v-model="otroEstado" class="sv-select">
            <option v-for="st in SERVICE_STATUS" :key="st.value" :value="st.value">{{ st.label }}</option>
          </select>
        </label>
        <label class="sv-campo" style="flex: 1 1 240px">
          <span>Nota (opcional)</span>
          <input v-model="paso.nota" class="sv-input" />
        </label>
        <v-btn color="primary" variant="flat" size="large" :loading="avanzando" @click="cambiarEstado(otroEstado)">Guardar estado</v-btn>
        <v-btn variant="text" size="large" @click="eligiendoEstado = false">Cancelar</v-btn>
      </div>
    </section>

    <div class="sv-fila">
      <div class="sv-principal">
        <!-- Tecnico -->
        <section class="sv-card" style="flex-direction: row; align-items: center; flex-wrap: wrap; padding: 16px 24px">
          <span class="sv-avatar tecnico-avatar">{{ iniciales(orden.technician_name) }}</span>
          <div class="flex-grow-1">
            <div class="text-body-2 sv-suave">Técnico</div>
            <div class="text-subtitle-1 font-weight-bold">{{ orden.technician_name || "Sin derivar" }}</div>
          </div>
          <template v-if="!derivando">
            <v-btn variant="outlined" @click="abrirDerivar">{{ orden.technician_id ? "Derivar a otro" : "Derivar" }}</v-btn>
          </template>
          <div v-else class="d-flex align-end ga-2 flex-wrap" style="flex-basis: 100%">
            <label class="sv-campo" style="flex: 0 1 240px">
              <span>Derivar a</span>
              <select v-model="derivar.id" class="sv-select">
                <option :value="null">Sin derivar</option>
                <option v-for="t in tecnicosItems" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </label>
            <label class="sv-campo" style="flex: 1 1 220px">
              <span>Nota para el técnico</span>
              <input v-model="derivar.nota" class="sv-input" />
            </label>
            <v-btn color="primary" variant="flat" size="large" :loading="guardando" @click="guardarDerivar">Guardar</v-btn>
            <v-btn variant="text" size="large" @click="derivando = false">Cancelar</v-btn>
          </div>
        </section>

        <!-- Equipo y cliente -->
        <section class="sv-card">
          <div class="sv-card-titulo">
            <h2>Equipo y cliente</h2>
            <button v-if="!editando" type="button" class="sv-enlace" @click="abrirEdicion">Editar datos</button>
          </div>

          <dl v-if="!editando" class="sv-datos">
            <div><dt>Equipo</dt><dd>{{ equipo || "—" }}</dd></div>
            <div><dt>IMEI</dt><dd>{{ orden.device_imei || "—" }}</dd></div>
            <div><dt>Desbloqueo</dt><dd>{{ orden.device_unlock || "—" }}</dd></div>
            <div class="sv-doble"><dt>Falla</dt><dd>{{ orden.reported_fault || "—" }}</dd></div>
            <div><dt>Queda con el equipo</dt><dd>{{ orden.device_accessories || "—" }}</dd></div>
            <div><dt>Cliente</dt><dd>{{ orden.customer_name || "—" }}</dd></div>
            <div><dt>Teléfono</dt><dd>{{ orden.customer_phone || "—" }}</dd></div>
            <div><dt>Retiro probable</dt><dd>{{ fecha(orden.estimated_pickup) }}</dd></div>
            <div><dt>Ingreso</dt><dd>{{ fechaHora(orden.created_at) }}<template v-if="orden.received_by"> · {{ orden.received_by }}</template></dd></div>
            <div v-if="orden.intake_condition"><dt>Estado al ingresar</dt><dd>{{ orden.intake_condition }}</dd></div>
            <div v-if="orden.technical_report" class="sv-doble"><dt>Reporte del técnico</dt><dd>{{ orden.technical_report }}</dd></div>
            <div v-if="orden.suggestions" class="sv-doble"><dt>Sugerencias al cliente</dt><dd>{{ orden.suggestions }}</dd></div>
          </dl>

          <template v-else>
            <div class="sv-grilla-3">
              <label class="sv-campo"><span>Marca</span><input v-model="ed.device_brand" class="sv-input" /></label>
              <label class="sv-campo"><span>Modelo</span><input v-model="ed.device_model" class="sv-input" /></label>
              <label class="sv-campo"><span>IMEI</span><input v-model="ed.device_imei" class="sv-input" /></label>
              <label class="sv-campo"><span>Desbloqueo</span><input v-model="ed.device_unlock" class="sv-input" /></label>
              <label class="sv-campo"><span>Queda con el equipo</span><input v-model="ed.device_accessories" class="sv-input" /></label>
              <label class="sv-campo"><span>Estado al ingresar</span><input v-model="ed.intake_condition" class="sv-input" /></label>
            </div>
            <label class="sv-campo"><span>Falla</span><textarea v-model="ed.reported_fault" class="sv-textarea" rows="2" /></label>
            <label class="sv-campo"><span>Reporte del técnico</span><textarea v-model="ed.technical_report" class="sv-textarea" rows="2" /></label>
            <label class="sv-campo"><span>Sugerencias al cliente</span><textarea v-model="ed.suggestions" class="sv-textarea" rows="2" /></label>
            <div class="sv-grilla-3">
              <label class="sv-campo"><span>Cliente</span><input v-model="ed.customer_name" class="sv-input" /></label>
              <label class="sv-campo"><span>Teléfono</span><input v-model="ed.customer_phone" class="sv-input" /></label>
              <label class="sv-campo"><span>Retiro probable</span><input v-model="ed.estimated_pickup" class="sv-input" type="date" /></label>
            </div>
            <div class="d-flex ga-2 justify-end">
              <v-btn variant="text" size="large" @click="editando = false">Cancelar</v-btn>
              <v-btn color="primary" variant="flat" size="large" :loading="guardando" @click="guardarEdicion">Guardar cambios</v-btn>
            </div>
          </template>
        </section>

        <!-- Cobro y repuestos -->
        <section class="sv-card">
          <div class="sv-card-titulo">
            <h2>Cobro y repuestos</h2>
            <div class="d-flex ga-4">
              <button type="button" class="sv-enlace" @click="abrirPrecios">Precio de lista</button>
              <button v-if="!editandoCobro" type="button" class="sv-enlace" @click="abrirCobro">Editar</button>
            </div>
          </div>

          <!-- Precio de lista, en el lugar -->
          <div v-if="viendoPrecios" class="d-flex flex-column ga-2">
            <div class="d-flex ga-2">
              <input v-model="qPrecio" class="sv-input" placeholder="Modelo del equipo" @input="buscarPreciosConDemora" />
              <v-btn variant="text" @click="viendoPrecios = false">Cerrar</v-btn>
            </div>
            <div v-if="!resultadosPrecio.length" class="text-body-2 sv-suave">Sin precio cargado para ese modelo.</div>
            <div v-for="p in resultadosPrecio" :key="p.id" class="precio-fila">
              <span class="flex-grow-1">{{ p.model }}</span>
              <strong class="text-no-wrap">{{ money(p.total_price) }}</strong>
              <span class="text-body-2 sv-suave text-no-wrap">3 × {{ money(p.installment_3) }}</span>
              <v-btn size="small" variant="tonal" color="primary" :loading="guardando" @click="usarPrecio(p)">Usar</v-btn>
            </div>
          </div>

          <div v-if="!editandoCobro" class="sv-grilla-3">
            <div class="sv-monto"><div>Presupuesto</div><div>{{ money(orden.quoted_amount) }}</div></div>
            <div class="sv-monto"><div>Seña</div><div>{{ money(orden.deposit) }}</div></div>
            <div class="sv-monto" :class="{ 'sv-monto--saldo': saldo > 0 }"><div>Saldo a cobrar</div><div>{{ money(saldo) }}</div></div>
          </div>
          <template v-else>
            <div class="sv-grilla-3">
              <label class="sv-campo"><span>Presupuesto</span><input v-model.number="cobro.quoted_amount" class="sv-input" type="number" min="0" /></label>
              <label class="sv-campo"><span>Seña</span><input v-model.number="cobro.deposit" class="sv-input" type="number" min="0" /></label>
              <div class="sv-monto" :class="{ 'sv-monto--saldo': saldoEditando > 0 }"><div>Saldo a cobrar</div><div>{{ money(saldoEditando) }}</div></div>
            </div>
            <div class="sv-rotulo">Reparto</div>
            <div class="sv-grilla-3">
              <label class="sv-campo"><span>Técnico</span><input v-model.number="cobro.commission_technician" class="sv-input" type="number" min="0" /></label>
              <label class="sv-campo"><span>Vendedor</span><input v-model.number="cobro.commission_seller" class="sv-input" type="number" min="0" /></label>
              <label class="sv-campo"><span>Local</span><input v-model.number="cobro.commission_shop" class="sv-input" type="number" min="0" /></label>
            </div>
            <div class="d-flex ga-2 justify-end">
              <v-btn variant="text" size="large" @click="editandoCobro = false">Cancelar</v-btn>
              <v-btn color="primary" variant="flat" size="large" :loading="guardando" @click="guardarCobro">Guardar</v-btn>
            </div>
          </template>

          <!-- Renglones -->
          <div class="d-flex flex-column">
            <div v-for="it in orden.items" :key="it.id" class="renglon">
              <span class="flex-grow-1">
                {{ it.description }}
                <span v-if="Number(it.qty) !== 1" class="sv-suave"> × {{ Number(it.qty) }}</span>
              </span>
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

          <div v-if="tieneReparto && !editandoCobro" class="text-body-2 sv-suave">
            Reparto: técnico {{ money(orden.commission_technician) }} · vendedor {{ money(orden.commission_seller) }} · local {{ money(orden.commission_shop) }}
          </div>
        </section>
      </div>

      <!-- Seguimiento -->
      <aside class="sv-lateral">
        <section class="sv-card">
          <h2 class="text-subtitle-1 font-weight-bold ma-0">Seguimiento</h2>
          <div class="d-flex ga-2">
            <input v-model="nuevaNota" class="sv-input" placeholder="Agregar una nota" @keyup.enter="agregarNota" />
            <v-btn variant="tonal" size="large" :loading="agregandoNota" :disabled="!nuevaNota.trim()" @click="agregarNota">Agregar</v-btn>
          </div>
          <div v-if="!eventos.length" class="text-body-2 sv-suave">Sin movimientos registrados.</div>
          <ol v-else class="sv-linea">
            <li v-for="ev in eventos" :key="ev.id">
              <div class="sv-linea-punto">
                <span :style="{ background: colorEvento(ev) }" />
                <span />
              </div>
              <div>
                <div class="sv-linea-titulo">{{ tituloEvento(ev) }}</div>
                <div v-if="ev.note" class="sv-linea-nota">{{ ev.note }}</div>
                <div class="sv-linea-meta">{{ fechaHora(ev.created_at) }}<template v-if="ev.user_name"> · {{ ev.user_name }}</template></div>
              </div>
            </li>
          </ol>
        </section>
      </aside>
    </div>

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
  RECORRIDO,
  SIGUIENTE_PASO,
  statusLabel,
  statusColor,
} from "../services/service.service";

const route = useRoute();
const orden = ref({ items: [], events: [] });

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

const money = (v) =>
  Number(v || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fecha = (v) => fmtFecha(v, "—");
const fechaHora = (v) => fmtFechaHora(v, "—");
const errorDe = (e, msg) => e?.response?.data?.message || msg;

function iniciales(nombre) {
  const s = String(nombre || "").trim();
  if (!s) return "—";
  return s.split(/\s+/).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

const equipo = computed(() => [orden.value.device_brand, orden.value.device_model].filter(Boolean).join(" "));
const fallaCorta = computed(() => {
  const f = String(orden.value.reported_fault || "").split(/[.\n]/)[0].trim();
  return f.length > 40 ? `${f.slice(0, 40)}…` : f || "Sin falla cargada";
});
const saldo = computed(() => Math.max(0, Number(orden.value.quoted_amount || 0) - Number(orden.value.deposit || 0)));
const tieneReparto = computed(
  () => Number(orden.value.commission_technician) + Number(orden.value.commission_seller) + Number(orden.value.commission_shop) > 0
);

const diasTexto = computed(() => {
  if (!orden.value.created_at || ["entregado"].includes(orden.value.status)) return "";
  const dias = Math.floor((Date.now() - new Date(orden.value.created_at).getTime()) / 86400000);
  if (dias <= 0) return "ingresó hoy";
  return `hace ${dias} ${dias === 1 ? "día" : "días"} en el taller`;
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

// ── Recorrido ──────────────────────────────────────────────────────────────
const pasoActual = computed(() => RECORRIDO.findIndex((p) => p.value === orden.value.status));
const fueraDelRecorrido = computed(() => !!orden.value.status && pasoActual.value < 0);
const siguiente = computed(() => SIGUIENTE_PASO[orden.value.status] || null);
const pideDiagnostico = computed(() => ["diagnostico", "en_reparacion"].includes(orden.value.status));
const pidePresupuesto = computed(() => orden.value.status === "diagnostico");

const paso = ref({ reporte: "", presupuesto: null, nota: "" });
const pasoListo = computed(() => {
  if (orden.value.status === "diagnostico") return !!paso.value.reporte.trim() && Number(paso.value.presupuesto) > 0;
  return true;
});

const avanzando = ref(false);
const ofrecerAviso = ref(false);
const eligiendoEstado = ref(false);
const otroEstado = ref("recibido");

function prepararPaso() {
  paso.value = {
    reporte: orden.value.technical_report || "",
    presupuesto: Number(orden.value.quoted_amount) || null,
    nota: "",
  };
  otroEstado.value = orden.value.status || "recibido";
}

async function cambiarEstado(status, extra = {}) {
  avanzando.value = true;
  try {
    const data = await guardarParcial({ status, nota: paso.value.nota.trim() || undefined, ...extra }, null);
    if (data) {
      eligiendoEstado.value = false;
      ofrecerAviso.value = !!data.cambio_estado && !!orden.value.customer_phone;
      if (!ofrecerAviso.value) notificar(`Estado: ${statusLabel(orden.value.status)}.`);
      prepararPaso();
    }
  } finally {
    avanzando.value = false;
  }
}

function avanzar() {
  const extra = {};
  if (pideDiagnostico.value && paso.value.reporte.trim()) extra.technical_report = paso.value.reporte.trim();
  if (pidePresupuesto.value) extra.quoted_amount = Number(paso.value.presupuesto) || 0;
  return cambiarEstado(siguiente.value.to, extra);
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
const derivando = ref(false);
const derivar = ref({ id: null, nota: "" });

function abrirDerivar() {
  derivar.value = { id: orden.value.technician_id || null, nota: "" };
  derivando.value = true;
}

async function guardarDerivar() {
  const data = await guardarParcial(
    { technician_id: derivar.value.id, nota: derivar.value.nota.trim() || undefined },
    derivar.value.id ? "Orden derivada." : "Orden sin técnico."
  );
  if (data) derivando.value = false;
}

// ── Edicion de datos ───────────────────────────────────────────────────────
const CAMPOS_EDITABLES = [
  "device_brand", "device_model", "device_imei", "device_unlock", "device_accessories",
  "intake_condition", "reported_fault", "technical_report", "suggestions",
  "customer_name", "customer_phone", "estimated_pickup",
];
const editando = ref(false);
const ed = ref({});

function abrirEdicion() {
  ed.value = Object.fromEntries(CAMPOS_EDITABLES.map((c) => [c, orden.value[c] ?? ""]));
  editando.value = true;
}

async function guardarEdicion() {
  const data = await guardarParcial({ ...ed.value }, "Datos guardados.");
  if (data) editando.value = false;
}

// ── Cobro ──────────────────────────────────────────────────────────────────
const editandoCobro = ref(false);
const cobro = ref({});
const saldoEditando = computed(() => Math.max(0, Number(cobro.value.quoted_amount || 0) - Number(cobro.value.deposit || 0)));

function abrirCobro() {
  cobro.value = {
    quoted_amount: Number(orden.value.quoted_amount) || 0,
    deposit: Number(orden.value.deposit) || 0,
    commission_technician: Number(orden.value.commission_technician) || 0,
    commission_seller: Number(orden.value.commission_seller) || 0,
    commission_shop: Number(orden.value.commission_shop) || 0,
  };
  editandoCobro.value = true;
}

async function guardarCobro() {
  const data = await guardarParcial({ ...cobro.value }, "Cobro guardado.");
  if (data) editandoCobro.value = false;
}

const viendoPrecios = ref(false);
const qPrecio = ref("");
const resultadosPrecio = ref([]);
let demoraPrecio = null;

function abrirPrecios() {
  qPrecio.value = equipo.value;
  viendoPrecios.value = true;
  buscarPrecios();
}
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
  if (data) {
    viendoPrecios.value = false;
    prepararPaso();
  }
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

// ── Seguimiento ────────────────────────────────────────────────────────────
// Lo mas nuevo arriba: es lo que se busca cuando el cliente llama.
const eventos = computed(() => [...(orden.value.events || [])].reverse());

const COLOR_EVENTO = {
  ingreso: "rgba(var(--v-theme-on-surface), 0.5)",
  estado: "rgb(var(--v-theme-primary))",
  tecnico: "#9b8cff",
  nota: "rgba(var(--v-theme-on-surface), 0.35)",
  aviso: "rgb(var(--v-theme-success))",
};
const colorEvento = (ev) => COLOR_EVENTO[ev.kind] || COLOR_EVENTO.nota;

function tituloEvento(ev) {
  if (ev.kind === "ingreso") return "Equipo recibido";
  if (ev.kind === "estado") return `${statusLabel(ev.from_status)} → ${statusLabel(ev.to_status)}`;
  if (ev.kind === "tecnico") return ev.technician_name ? `Derivado a ${ev.technician_name}` : "Sin técnico asignado";
  if (ev.kind === "aviso") return ev.note === "Comprobante de ingreso" ? "Comprobante por WhatsApp" : "Aviso por WhatsApp";
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
    ofrecerAviso.value = false;
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
  try {
    const { data } = await listTechnicians();
    tecnicos.value = data?.data || [];
  } catch {
    tecnicos.value = [];
  }
});
</script>

<style scoped>
.tecnico-avatar {
  background: rgba(155, 140, 255, 0.22);
}
.renglon,
.precio-fila {
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
</style>
