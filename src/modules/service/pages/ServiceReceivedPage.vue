<!-- src/modules/service/pages/ServiceReceivedPage.vue
     Despues de recibir un equipo: el comprobante para el cliente.

     Lienzo aprobado (artboard «2 · Recibido: comprobante»):
     https://claude.ai/artifact/Qee3bS6R5sweKECTbrDm5K

     Es el momento en que el cliente sigue en el mostrador: las dos acciones
     grandes son darle el comprobante (papel o WhatsApp). La copia de la
     derecha es lo mismo que sale impreso en la copia del cliente. -->
<template>
  <div class="sv">
    <router-link :to="{ name: 'serviceOrders' }" class="sv-volver">
      <v-icon size="18">mdi-chevron-left</v-icon> Servicio técnico
    </router-link>

    <div class="sv-fila" style="max-width: 1000px; width: 100%; margin: 12px auto 0">
      <div class="sv-principal" style="flex: 1 1 380px; gap: 22px">
        <div class="recibido-ok">
          <v-icon size="32" color="success">mdi-check</v-icon>
        </div>
        <div>
          <div class="text-success font-weight-bold">Equipo recibido</div>
          <h1 class="sv-h1 recibido-numero">{{ orden.numero_visible || "…" }}</h1>
          <p class="sv-sub">
            <template v-if="orden.technician_name">Derivado a <strong>{{ orden.technician_name }}</strong>. </template>
            Ahora, el comprobante para el cliente.
          </p>
        </div>

        <div class="d-flex flex-column ga-3">
          <v-btn color="primary" variant="flat" size="x-large" prepend-icon="mdi-printer-outline" :loading="imprimiendo" @click="imprimir">
            Imprimir comprobante
          </v-btn>
          <v-btn
            color="success"
            variant="tonal"
            size="x-large"
            prepend-icon="mdi-whatsapp"
            :loading="enviando"
            :disabled="!orden.customer_phone"
            @click="enviarWhatsapp"
          >
            {{ orden.customer_phone ? `Enviar por WhatsApp al ${orden.customer_phone}` : "Sin teléfono para WhatsApp" }}
          </v-btn>
          <v-alert v-if="linkPendiente" type="info" variant="tonal" density="compact">
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="flex-grow-1">Mensaje listo para enviar.</span>
              <v-btn size="small" color="success" variant="flat" prepend-icon="mdi-whatsapp" :href="linkPendiente" target="_blank" rel="noopener" @click="linkPendiente = null">
                Abrir WhatsApp
              </v-btn>
            </div>
          </v-alert>
          <div v-if="enviadoWhatsapp" class="text-body-2 text-success">
            <v-icon size="16">mdi-check</v-icon> Comprobante enviado por WhatsApp.
          </div>
        </div>

        <div class="d-flex ga-5 flex-wrap">
          <router-link :to="{ name: 'serviceOrderEdit', params: { id: route.params.id } }" class="sv-enlace">Abrir la orden</router-link>
          <router-link :to="{ name: 'serviceIntake' }" class="sv-enlace">Recibir otro equipo</router-link>
        </div>
      </div>

      <!-- Copia del cliente -->
      <div class="sv-lateral" style="flex: 1 1 380px">
        <div class="sv-rotulo">Copia del cliente</div>
        <div class="papel">
          <div class="d-flex justify-space-between align-start ga-3">
            <div>
              <div class="papel-comercio">{{ comercio || "Servicio técnico" }}</div>
              <div class="papel-gris">Servicio técnico</div>
            </div>
            <div class="text-right">
              <div class="papel-gris">Orden</div>
              <div class="papel-numero">{{ orden.numero_visible }}</div>
            </div>
          </div>
          <div class="papel-linea" />
          <dl class="papel-datos">
            <div><dt>Cliente</dt><dd>{{ orden.customer_name || "—" }}</dd></div>
            <div><dt>Ingreso</dt><dd>{{ fechaHora(orden.created_at) }}</dd></div>
            <div><dt>Equipo</dt><dd>{{ equipo || "—" }}</dd></div>
            <div><dt>Retiro probable</dt><dd>{{ fecha(orden.estimated_pickup) }}</dd></div>
            <div class="papel-ancho"><dt>Falla</dt><dd>{{ orden.reported_fault || "—" }}</dd></div>
            <div v-if="orden.device_accessories" class="papel-ancho"><dt>Queda con el equipo</dt><dd>{{ orden.device_accessories }}</dd></div>
          </dl>
          <div v-if="Number(orden.deposit) > 0" class="papel-sena">
            <span>Seña recibida</span>
            <strong>{{ money(orden.deposit) }}</strong>
          </div>
          <div class="papel-legal">
            Pasados 15 días de la fecha pactada de entrega tendrá un cargo diario. Pasados 45 días será
            considerado abandono (arts. 2375 / 2225 / 2524 CCyC). Para consultar por el equipo, indicar el
            número de orden.
          </div>
        </div>
      </div>
    </div>

    <v-snackbar v-model="aviso.show" :color="aviso.color" timeout="4000">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import "../styles/servicio.css";
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { fmtFecha, fmtFechaHora } from "../utils/fechas";
import { exportServiceOrderPdf, loadServiceIdentity } from "../utils/serviceOrderPdf";
import { getOrder, sendOrderWhatsapp } from "../services/service.service";
import { abrirWhatsapp } from "../utils/whatsapp";

const route = useRoute();
const orden = ref({});
const comercio = ref("");

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

const money = (v) =>
  Number(v || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fecha = (v) => fmtFecha(v, "A definir");
const fechaHora = (v) => fmtFechaHora(v, "—");
const equipo = computed(() => [orden.value.device_brand, orden.value.device_model].filter(Boolean).join(" "));

const imprimiendo = ref(false);
async function imprimir() {
  imprimiendo.value = true;
  try {
    const identity = await loadServiceIdentity(orden.value.branch_id);
    await exportServiceOrderPdf({ orden: orden.value, identity });
  } catch (e) {
    notificar(`No se pudo generar el comprobante: ${e?.message || e}`, "error");
  } finally {
    imprimiendo.value = false;
  }
}

const enviando = ref(false);
const enviadoWhatsapp = ref(false);
const linkPendiente = ref(null);
async function enviarWhatsapp() {
  enviando.value = true;
  try {
    const { data } = await sendOrderWhatsapp(route.params.id, "comprobante");
    const r = data?.data || {};
    if (r.enviado) enviadoWhatsapp.value = true;
    else if (r.link) linkPendiente.value = abrirWhatsapp(r.link);
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo armar el mensaje.", "error");
  } finally {
    enviando.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await getOrder(route.params.id);
    orden.value = data?.data || {};
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo cargar la orden.", "error");
  }
  try {
    const identity = await loadServiceIdentity(orden.value.branch_id);
    comercio.value = identity?.branding?.name || "";
  } catch {
    comercio.value = "";
  }
});
</script>

<style scoped>
.recibido-ok {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(var(--v-theme-success), 0.14);
  border: 2px solid rgb(var(--v-theme-success));
  display: flex;
  align-items: center;
  justify-content: center;
}
.recibido-numero {
  font-size: 44px;
  margin-top: 4px;
}

/* El papel es papel en los dos temas. */
.papel {
  background: #f7f7f5;
  color: #1b1d21;
  border-radius: 14px;
  padding: 24px 26px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.25);
}
.papel-comercio {
  font-size: 18px;
  font-weight: 800;
}
.papel-numero {
  font-size: 20px;
  font-weight: 800;
}
.papel-gris {
  font-size: 12px;
  color: #4f5660;
}
.papel-linea {
  height: 1px;
  background: #d9dbde;
}
.papel-datos {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 18px;
  font-size: 13px;
}
.papel-datos dt {
  color: #4f5660;
}
.papel-datos dd {
  margin: 0;
  font-weight: 600;
  word-break: break-word;
}
.papel-ancho {
  grid-column: span 2;
}
.papel-sena {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #eceeea;
  border-radius: 10px;
  font-size: 13px;
  color: #4f5660;
}
.papel-sena strong {
  font-size: 18px;
  color: #1b1d21;
}
.papel-legal {
  font-size: 11px;
  line-height: 1.5;
  color: #4f5660;
}
</style>
