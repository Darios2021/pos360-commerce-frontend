<!-- src/modules/service/pages/ServiceIntakePage.vue
     Recibir un equipo: lo minimo para dar el comprobante.

     Lienzo aprobado (artboard «1 · Recibir equipo»):
     https://claude.ai/artifact/Qee3bS6R5sweKECTbrDm5K

     La orden se crea recien al confirmar: antes, "Recibir equipo" creaba una
     orden vacia y abria el editor entero, y una orden abandonada a la mitad
     quedaba numerada para siempre. Lo que no hace falta en el mostrador
     (estado al ingresar, reparto, repuestos) se completa despues en la ficha. -->
<template>
  <div class="sv sv--con-pie">
    <router-link :to="{ name: 'serviceOrders' }" class="sv-volver">
      <v-icon size="18">mdi-chevron-left</v-icon> Servicio técnico
    </router-link>

    <div class="sv-cabecera">
      <div>
        <h1 class="sv-h1">Recibir equipo</h1>
        <p class="sv-sub">Lo mínimo para dar el comprobante. El resto se completa en la orden.</p>
      </div>
    </div>

    <div class="sv-fila">
      <div class="sv-principal">
        <!-- 1 Cliente -->
        <section class="sv-card">
          <div class="sv-card-titulo">
            <div class="d-flex align-center ga-2"><span class="sv-paso">1</span><h2>Cliente</h2></div>
          </div>

          <div v-if="cliente" class="sv-cliente">
            <span class="sv-avatar">{{ iniciales(cliente.display_name) }}</span>
            <div class="flex-grow-1" style="min-width: 180px">
              <div class="text-subtitle-1 font-weight-bold">{{ cliente.display_name }}</div>
              <div class="text-body-2 sv-suave">
                {{ cliente.phone || "Sin teléfono" }}
                <template v-if="cliente.reparaciones"> · {{ cliente.reparaciones }} {{ cliente.reparaciones === 1 ? "reparación anterior" : "reparaciones anteriores" }}</template>
              </div>
            </div>
            <v-btn variant="outlined" @click="cambiarCliente">Cambiar</v-btn>
          </div>

          <template v-else-if="!clienteNuevo">
            <label class="sv-campo">
              <span>Teléfono o nombre</span>
              <div class="sv-buscador">
                <v-icon color="primary">mdi-magnify</v-icon>
                <input
                  ref="buscadorRef"
                  v-model="qCliente"
                  autocomplete="off"
                  placeholder="Ej. 264 512 3456 o Pérez"
                  @input="buscarClientesConDemora"
                />
              </div>
            </label>
            <div v-if="resultados.length" class="sv-resultados">
              <button v-for="c in resultados" :key="c.id" type="button" @click="elegirCliente(c)">
                <span>
                  <strong>{{ c.display_name }}</strong>
                  <span class="sv-suave"> · {{ c.phone || "sin teléfono" }}</span>
                </span>
                <span v-if="c.reparaciones" class="sv-suave text-no-wrap">{{ c.reparaciones }} rep.</span>
              </button>
            </div>
            <div class="text-body-2 sv-suave">
              <template v-if="buscado && !resultados.length">No está en la base. </template>
              <template v-else>¿No está? </template>
              <button type="button" class="sv-enlace" @click="abrirClienteNuevo">Cargar cliente nuevo</button>
            </div>
          </template>

          <template v-else>
            <div class="sv-grilla-2">
              <label class="sv-campo">
                <span>Nombre</span>
                <input ref="nombreRef" v-model="nuevo.nombre" class="sv-input" autocomplete="off" />
              </label>
              <label class="sv-campo">
                <span>Teléfono</span>
                <input v-model="nuevo.telefono" class="sv-input" inputmode="tel" autocomplete="off" />
              </label>
            </div>
            <div class="text-body-2 sv-suave">
              <button type="button" class="sv-enlace" @click="clienteNuevo = false">Buscar en la base</button>
            </div>
          </template>
        </section>

        <!-- 2 Equipo y falla -->
        <section class="sv-card">
          <div class="sv-card-titulo">
            <div class="d-flex align-center ga-2"><span class="sv-paso">2</span><h2>Equipo y falla</h2></div>
          </div>

          <div class="sv-grilla-3">
            <label class="sv-campo sv-doble">
              <span>Equipo</span>
              <input v-model="equipo" class="sv-input" placeholder="Ej. Samsung A04" autocomplete="off" @input="buscarPreciosConDemora" />
            </label>
            <label class="sv-campo">
              <span>IMEI (opcional)</span>
              <input v-model="imei" class="sv-input" inputmode="numeric" autocomplete="off" />
            </label>
          </div>

          <div class="sv-campo">
            <span>Falla</span>
            <div class="sv-chips">
              <button
                v-for="f in FALLAS_FRECUENTES"
                :key="f"
                type="button"
                class="sv-chip"
                :class="{ on: fallas.includes(f) }"
                :aria-pressed="fallas.includes(f)"
                @click="alternar(fallas, f)"
              >
                {{ f }}
              </button>
            </div>
            <textarea v-model="detalleFalla" class="sv-textarea" rows="2" placeholder="Lo que cuenta el cliente" />
          </div>

          <div class="sv-grilla-2">
            <div class="sv-campo">
              <span>Queda con el equipo</span>
              <div class="sv-chips">
                <button
                  v-for="a in ACCESORIOS"
                  :key="a"
                  type="button"
                  class="sv-chip sv-chip--cuadrado"
                  :class="{ on: accesorios.includes(a) }"
                  :aria-pressed="accesorios.includes(a)"
                  @click="alternar(accesorios, a)"
                >
                  {{ a }}
                </button>
              </div>
            </div>

            <div class="sv-campo">
              <span>Desbloqueo</span>
              <div class="d-flex align-center ga-3 flex-wrap">
                <div class="sv-segmentado" role="group" aria-label="Tipo de desbloqueo">
                  <button type="button" :class="{ on: bloqueo === 'pin' }" @click="bloqueo = 'pin'">PIN</button>
                  <button type="button" :class="{ on: bloqueo === 'patron' }" @click="bloqueo = 'patron'">Patrón</button>
                  <button type="button" :class="{ on: bloqueo === 'ninguno' }" @click="bloqueo = 'ninguno'">Sin bloqueo</button>
                </div>
                <input
                  v-if="bloqueo === 'pin'"
                  v-model="pin"
                  class="sv-input"
                  aria-label="PIN"
                  inputmode="numeric"
                  autocomplete="off"
                  style="width: 120px; letter-spacing: 0.2em; font-weight: 600"
                />
              </div>
              <div v-if="bloqueo === 'patron'" class="d-flex align-center ga-4 mt-1">
                <div class="sv-patron" aria-label="Patrón: tocar los puntos en orden">
                  <button
                    v-for="n in 9"
                    :key="n"
                    type="button"
                    :class="{ on: patron.includes(n) }"
                    @click="tocarPatron(n)"
                  >
                    {{ patron.includes(n) ? patron.indexOf(n) + 1 : "" }}
                  </button>
                </div>
                <div class="text-body-2 sv-suave">
                  <div>{{ patron.length ? patron.join(" → ") : "Tocar los puntos en orden" }}</div>
                  <button v-if="patron.length" type="button" class="sv-enlace mt-1" @click="patron = []">Borrar</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3 Opcional -->
        <section class="sv-card">
          <div class="sv-card-titulo">
            <div class="d-flex align-center ga-2">
              <span class="sv-paso">3</span><h2>Seña, retiro y técnico</h2>
              <span class="text-body-2 sv-suave">opcional</span>
            </div>
          </div>
          <div class="sv-grilla-3">
            <label class="sv-campo">
              <span>Seña</span>
              <input v-model.number="sena" class="sv-input" type="number" min="0" inputmode="numeric" placeholder="$ 0" />
            </label>
            <div class="sv-campo">
              <span>Retiro probable</span>
              <div class="d-flex ga-2">
                <button
                  v-for="op in OPCIONES_RETIRO"
                  :key="op.value"
                  type="button"
                  class="sv-chip sv-chip--cuadrado flex-grow-1"
                  :class="{ on: retiro === op.value }"
                  @click="retiro = retiro === op.value ? null : op.value"
                >
                  {{ op.label }}
                </button>
              </div>
              <input v-if="retiro === 'fecha'" v-model="retiroFecha" class="sv-input" type="date" aria-label="Fecha de retiro" />
            </div>
            <label class="sv-campo">
              <span>Derivar a</span>
              <select v-model="tecnicoId" class="sv-select">
                <option :value="null">Sin derivar</option>
                <option v-for="t in tecnicos" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <!-- Lateral: referencia -->
      <aside class="sv-lateral">
        <section class="sv-card">
          <div class="sv-rotulo">Precio de lista{{ equipo ? ` · ${equipo}` : "" }}</div>
          <div v-if="!equipo" class="text-body-2 sv-suave">Al escribir el equipo aparece el precio de lista.</div>
          <div v-else-if="!precios.length" class="text-body-2 sv-suave">Sin precio cargado para ese modelo.</div>
          <div v-for="p in precios" :key="p.id" class="d-flex justify-space-between align-baseline ga-3">
            <span class="text-body-2">{{ p.model }}</span>
            <strong class="text-h6 text-no-wrap">{{ money(p.total_price) }}</strong>
          </div>
          <div v-if="precios.length" class="text-body-2 sv-suave">El presupuesto se confirma después del diagnóstico.</div>
        </section>

        <section v-if="cliente" class="sv-card">
          <div class="sv-rotulo">Reparaciones de {{ cliente.display_name }}</div>
          <div v-if="!historial.length" class="text-body-2 sv-suave">Primera vez en el taller.</div>
          <div v-for="o in historial" :key="o.id">
            <div class="d-flex justify-space-between ga-2">
              <strong class="text-body-2">{{ o.numero_visible }} · {{ equipoDe(o) }}</strong>
              <span :class="['sv-estado', `sv-estado--${statusColor(o.status)}`]">{{ statusLabel(o.status) }}</span>
            </div>
            <div class="text-body-2 sv-suave">{{ o.reported_fault || "—" }} · {{ fecha(o.created_at) }}</div>
          </div>
        </section>
      </aside>
    </div>

    <!-- Pie fijo -->
    <footer class="sv-pie">
      <div class="sv-pie-dentro">
        <div class="sv-pie-resumen">{{ resumen || "Completar cliente, equipo y falla." }}</div>
        <v-btn variant="text" size="large" :to="{ name: 'serviceOrders' }">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="x-large"
          prepend-icon="mdi-check"
          :loading="guardando"
          :disabled="!listo"
          @click="recibir"
        >
          Recibir equipo
        </v-btn>
      </div>
    </footer>

    <v-snackbar v-model="aviso.show" :color="aviso.color" timeout="4000">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import "../styles/servicio.css";
import { ref, computed, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { fmtFecha } from "../utils/fechas";
import {
  createOrder,
  listOrders,
  searchPrices,
  searchServiceCustomers,
  listTechnicians,
  statusLabel,
  statusColor,
  FALLAS_FRECUENTES,
  ACCESORIOS,
} from "../services/service.service";

const router = useRouter();

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

const money = (v) =>
  Number(v || 0).toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const fecha = (v) => fmtFecha(v, "—");
const equipoDe = (o) => [o.device_brand, o.device_model].filter(Boolean).join(" ") || "Equipo";

function iniciales(nombre) {
  return String(nombre || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
}

function alternar(lista, valor) {
  const i = lista.indexOf(valor);
  if (i >= 0) lista.splice(i, 1);
  else lista.push(valor);
}

// ── Cliente ────────────────────────────────────────────────────────────────
const buscadorRef = ref(null);
const nombreRef = ref(null);
const qCliente = ref("");
const resultados = ref([]);
const buscado = ref(false);
const cliente = ref(null);
const clienteNuevo = ref(false);
const nuevo = ref({ nombre: "", telefono: "" });
const historial = ref([]);

let demoraCliente = null;
function buscarClientesConDemora() {
  clearTimeout(demoraCliente);
  buscado.value = false;
  demoraCliente = setTimeout(buscarClientes, 300);
}

async function buscarClientes() {
  const q = qCliente.value.trim();
  if (q.length < 3) {
    resultados.value = [];
    return;
  }
  try {
    const { data } = await searchServiceCustomers(q);
    resultados.value = data?.data || [];
  } catch {
    resultados.value = [];
  } finally {
    buscado.value = true;
  }
}

async function elegirCliente(c) {
  cliente.value = c;
  resultados.value = [];
  historial.value = [];
  try {
    // Por telefono salen tambien las del libro viejo, que no tienen ficha.
    const q = c.phone || c.display_name;
    const { data } = await listOrders({ q, incluir_historico: 1, limit: 3 });
    historial.value = data?.data || [];
  } catch {
    historial.value = [];
  }
}

function cambiarCliente() {
  cliente.value = null;
  historial.value = [];
  nextTick(() => buscadorRef.value?.focus());
}

// Lo tipeado en el buscador pasa al campo que corresponde: si eran numeros, al
// telefono; si no, al nombre.
function abrirClienteNuevo() {
  const q = qCliente.value.trim();
  const esTelefono = q.replace(/\D/g, "").length >= 6;
  nuevo.value = { nombre: esTelefono ? "" : q, telefono: esTelefono ? q : "" };
  clienteNuevo.value = true;
  nextTick(() => nombreRef.value?.focus());
}

// ── Equipo y falla ─────────────────────────────────────────────────────────
const equipo = ref("");
const imei = ref("");
const fallas = ref([]);
const detalleFalla = ref("");
const accesorios = ref([]);
const bloqueo = ref("pin");
const pin = ref("");
const patron = ref([]);

function tocarPatron(n) {
  if (!patron.value.includes(n)) patron.value.push(n);
}

const precios = ref([]);
let demoraPrecio = null;
function buscarPreciosConDemora() {
  clearTimeout(demoraPrecio);
  demoraPrecio = setTimeout(async () => {
    if (equipo.value.trim().length < 2) {
      precios.value = [];
      return;
    }
    try {
      const { data } = await searchPrices({ q: equipo.value.trim(), limit: 4 });
      precios.value = data?.data || [];
    } catch {
      precios.value = [];
    }
  }, 400);
}

// ── Opcional ───────────────────────────────────────────────────────────────
const OPCIONES_RETIRO = [
  { value: "24", label: "24 h" },
  { value: "72", label: "72 h" },
  { value: "fecha", label: "Fecha" },
];
const sena = ref(null);
const retiro = ref(null);
const retiroFecha = ref("");
const tecnicoId = ref(null);
const tecnicos = ref([]);

// "AAAA-MM-DD" local: con toISOString la fecha salta un dia despues de las 21.
function aFechaLocal(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fechaRetiro() {
  if (retiro.value === "fecha") return retiroFecha.value || null;
  if (!retiro.value) return null;
  return aFechaLocal(new Date(Date.now() + Number(retiro.value) * 3600000));
}

// ── Confirmar ──────────────────────────────────────────────────────────────
const nombreCliente = computed(() =>
  cliente.value ? cliente.value.display_name : nuevo.value.nombre.trim()
);
const telefonoCliente = computed(() =>
  cliente.value ? cliente.value.phone || "" : nuevo.value.telefono.trim()
);
const textoFalla = computed(() =>
  [fallas.value.join(", "), detalleFalla.value.trim()].filter(Boolean).join(". ")
);

const listo = computed(
  () => !!(nombreCliente.value || telefonoCliente.value) && !!equipo.value.trim() && !!textoFalla.value
);

const resumen = computed(() =>
  [
    nombreCliente.value,
    equipo.value.trim(),
    fallas.value[0] || (detalleFalla.value.trim() ? detalleFalla.value.trim().slice(0, 40) : ""),
    Number(sena.value) > 0 ? `Seña ${money(sena.value)}` : "",
  ]
    .filter(Boolean)
    .join(" · ")
);

function desbloqueo() {
  if (bloqueo.value === "pin") return pin.value.trim() ? `PIN ${pin.value.trim()}` : null;
  if (bloqueo.value === "patron") return patron.value.length ? `Patrón ${patron.value.join("-")}` : null;
  return "Sin bloqueo";
}

const guardando = ref(false);
async function recibir() {
  if (!listo.value) return;
  guardando.value = true;
  try {
    const c = cliente.value;
    const { data } = await createOrder({
      customer_id: c?.id || null,
      customer_name: nombreCliente.value || "Consumidor Final",
      customer_phone: telefonoCliente.value || null,
      customer_email: c?.email || null,
      customer_doc: c?.doc_number || null,
      device_model: equipo.value.trim(),
      device_imei: imei.value.trim() || null,
      device_unlock: desbloqueo(),
      device_accessories: accesorios.value.join(", ") || null,
      reported_fault: textoFalla.value,
      deposit: Number(sena.value) || 0,
      estimated_pickup: fechaRetiro(),
      technician_id: tecnicoId.value,
    });
    const creada = data?.data;
    if (creada?.id) router.replace({ name: "serviceOrderReceived", params: { id: creada.id } });
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo recibir el equipo.", "error");
  } finally {
    guardando.value = false;
  }
}

onMounted(async () => {
  nextTick(() => buscadorRef.value?.focus());
  try {
    const { data } = await listTechnicians();
    tecnicos.value = data?.data || [];
  } catch {
    tecnicos.value = [];
  }
});
</script>
