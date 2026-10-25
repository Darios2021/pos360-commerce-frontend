<!-- src/modules/service/pages/ServiceOrderEditorPage.vue
     Editor de una orden de servicio tecnico.

     Reemplaza la hoja PrintPage del libro SERV_TEC: los mismos datos que se
     llenaban a mano en la orden de trabajo, mas lo que el papel no podia hacer
     (buscar el precio del modelo, vincular la ficha del cliente, cambiar el
     estado y que quede registrado quien y cuando).

     El saldo NO se edita: sale de presupuesto menos seña. Si fuera editable, la
     primera diferencia de tipeo desarma la caja. -->
<template>
  <div class="pa-4">
    <AppPageHeader
      icon="mdi-clipboard-text-outline"
      :title="orden.numero_visible || 'Orden de servicio'"
      :subtitle="subtitulo"
    >
      <v-chip :color="statusColor(orden.status)" variant="tonal" class="mr-2">
        <v-icon start size="16">{{ statusIcon(orden.status) }}</v-icon>
        {{ statusLabel(orden.status) }}
      </v-chip>
      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="volver">Volver</v-btn>
      <v-btn variant="tonal" prepend-icon="mdi-printer-outline" :loading="imprimiendo" @click="imprimir">
        Imprimir orden
      </v-btn>
      <v-btn color="primary" prepend-icon="mdi-content-save-outline" :loading="guardando" @click="guardar">
        Guardar
      </v-btn>
    </AppPageHeader>

    <v-row dense>
      <!-- ── Cliente ─────────────────────────────────────── -->
      <v-col cols="12" md="6">
        <v-card variant="flat" border rounded="lg" class="pa-4 mb-3">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="section-label">Cliente</div>
            <div class="d-flex ga-2">
              <v-btn size="small" variant="text" prepend-icon="mdi-account-search-outline" @click="abrirBuscadorCliente">
                Buscar
              </v-btn>
              <v-btn
                size="small"
                variant="tonal"
                prepend-icon="mdi-account-plus-outline"
                :loading="creandoCliente"
                :disabled="!puedeCrearCliente"
                @click="crearFichaCliente"
              >
                Crear ficha
              </v-btn>
            </div>
          </div>

          <div class="d-flex flex-wrap ga-3">
            <v-text-field v-model="orden.customer_name" label="Nombre" density="compact" variant="outlined" hide-details style="min-width: 220px" />
            <v-text-field v-model="orden.customer_phone" label="Telefono" density="compact" variant="outlined" hide-details style="min-width: 170px" />
            <v-text-field v-model="orden.customer_email" label="Email" density="compact" variant="outlined" hide-details style="min-width: 200px" />
            <v-text-field v-model="orden.customer_doc" label="DNI / CUIT" density="compact" variant="outlined" hide-details style="min-width: 160px" />
          </div>

          <div v-if="orden.customer_id" class="text-caption text-success mt-3">
            <v-icon size="14">mdi-check-circle-outline</v-icon>
            Ficha vinculada (#{{ orden.customer_id }}). Queda el historial de reparaciones.
          </div>
          <div v-else class="text-caption text-medium-emphasis mt-3">
            Sin ficha: los datos quedan solo en esta orden.
          </div>
        </v-card>

        <!-- ── Equipo ────────────────────────────────────── -->
        <v-card variant="flat" border rounded="lg" class="pa-4 mb-3">
          <div class="section-label mb-3">Equipo</div>
          <div class="d-flex flex-wrap ga-3">
            <v-text-field v-model="orden.device_brand" label="Marca" density="compact" variant="outlined" hide-details style="min-width: 150px" />
            <v-text-field v-model="orden.device_model" label="Modelo" density="compact" variant="outlined" hide-details style="min-width: 190px" />
            <v-text-field v-model="orden.device_imei" label="IMEI" density="compact" variant="outlined" hide-details style="min-width: 180px" />
            <!-- Sin esto el tecnico no puede probar que la reparacion anduvo.
                 En el papel se anotaba al margen y se perdia. -->
            <v-text-field v-model="orden.device_unlock" label="PIN / patron" density="compact" variant="outlined" hide-details style="min-width: 140px" />
            <v-text-field v-model="orden.device_accessories" label="Accesorios que quedan" density="compact" variant="outlined" hide-details style="min-width: 240px" />
            <v-text-field v-model="orden.intake_condition" label="Estado al ingresar" density="compact" variant="outlined" hide-details style="min-width: 240px" />
          </div>
        </v-card>

        <!-- ── Diagnostico ───────────────────────────────── -->
        <v-card variant="flat" border rounded="lg" class="pa-4 mb-3">
          <div class="section-label mb-3">Falla y diagnostico</div>
          <v-textarea v-model="orden.reported_fault" label="Falla que informa el cliente" rows="2" auto-grow density="compact" variant="outlined" hide-details class="mb-3" />
          <v-textarea v-model="orden.technical_report" label="Reporte del tecnico" rows="2" auto-grow density="compact" variant="outlined" hide-details class="mb-3" />
          <v-textarea v-model="orden.suggestions" label="Sugerencias al cliente" rows="2" auto-grow density="compact" variant="outlined" hide-details />
        </v-card>
      </v-col>

      <!-- ── Columna derecha ─────────────────────────────── -->
      <v-col cols="12" md="6">
        <v-card variant="flat" border rounded="lg" class="pa-4 mb-3">
          <div class="section-label mb-3">Estado y asignacion</div>
          <div class="d-flex flex-wrap ga-3">
            <v-select
              v-model="orden.status"
              :items="itemsEstado"
              label="Estado"
              density="compact"
              variant="outlined"
              hide-details
              style="min-width: 230px"
            />
            <v-text-field v-model="orden.technician_name" label="Tecnico asignado" density="compact" variant="outlined" hide-details style="min-width: 200px" />
            <v-text-field v-model="orden.estimated_pickup" label="Retiro probable" type="date" density="compact" variant="outlined" hide-details style="min-width: 180px" />
          </div>
          <div class="text-caption text-medium-emphasis mt-3">
            Recibido por {{ orden.received_by || "—" }}
            <template v-if="orden.delivered_at"> · entregado el {{ fecha(orden.delivered_at) }}</template>
          </div>
        </v-card>

        <!-- ── Precio ────────────────────────────────────── -->
        <v-card variant="flat" border rounded="lg" class="pa-4 mb-3">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="section-label">Presupuesto</div>
            <v-btn size="small" variant="text" prepend-icon="mdi-tag-search-outline" @click="abrirPrecios">
              Buscar precio del modelo
            </v-btn>
          </div>

          <div class="d-flex flex-wrap ga-3">
            <v-text-field v-model.number="orden.quoted_amount" label="Presupuesto" type="number" prefix="$" density="compact" variant="outlined" hide-details style="min-width: 160px" />
            <v-text-field v-model.number="orden.deposit" label="Seña" type="number" prefix="$" density="compact" variant="outlined" hide-details style="min-width: 150px" />
            <!-- Derivado, no editable. -->
            <v-text-field :model-value="money(saldo)" label="Saldo a cobrar" density="compact" variant="outlined" hide-details readonly style="min-width: 160px" />
          </div>

          <v-divider class="my-4" />

          <div class="text-caption text-medium-emphasis mb-2">Reparto (como en el libro viejo)</div>
          <div class="d-flex flex-wrap ga-3">
            <v-text-field v-model.number="orden.commission_technician" label="Tecnico" type="number" prefix="$" density="compact" variant="outlined" hide-details style="min-width: 140px" />
            <v-text-field v-model.number="orden.commission_seller" label="Vendedor" type="number" prefix="$" density="compact" variant="outlined" hide-details style="min-width: 140px" />
            <v-text-field v-model.number="orden.commission_shop" label="Local" type="number" prefix="$" density="compact" variant="outlined" hide-details style="min-width: 140px" />
          </div>
        </v-card>

        <!-- ── Repuestos ─────────────────────────────────── -->
        <v-card variant="flat" border rounded="lg" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="section-label">Repuestos y mano de obra</div>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="nuevoRenglon.show = true">
              Agregar
            </v-btn>
          </div>

          <v-table v-if="orden.items?.length" density="compact">
            <thead>
              <tr>
                <th>Descripcion</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Costo</th>
                <th class="text-right">Precio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in orden.items" :key="it.id">
                <td>
                  {{ it.description }}
                  <v-chip v-if="it.kind === 'mano_obra'" size="x-small" variant="tonal" class="ml-1">obra</v-chip>
                </td>
                <td class="text-right">{{ Number(it.qty) }}</td>
                <td class="text-right">{{ money(it.cost) }}</td>
                <td class="text-right">{{ money(it.line_total) }}</td>
                <td class="text-right">
                  <v-btn icon size="x-small" variant="text" @click="borrarRenglon(it)">
                    <v-icon size="16">mdi-delete-outline</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-caption text-medium-emphasis py-3">
            Sin repuestos cargados.
          </div>

          <v-divider class="my-3" />
          <div class="d-flex justify-space-between text-body-2">
            <span class="text-medium-emphasis">Costo de repuestos</span>
            <strong>{{ money(orden.parts_cost) }}</strong>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Buscador de clientes ──────────────────────────── -->
    <v-dialog v-model="dlgCliente" max-width="640">
      <v-card>
        <v-card-title class="text-subtitle-1">Buscar cliente</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="qCliente"
            density="compact"
            variant="outlined"
            hide-details
            autofocus
            placeholder="Nombre o telefono"
            prepend-inner-icon="mdi-magnify"
            class="mb-3"
            @update:model-value="buscarClientesConDemora"
          />
          <v-list density="compact" max-height="320" class="overflow-y-auto">
            <v-list-item
              v-for="c in resultadosCliente"
              :key="c.id"
              :title="c.display_name"
              :subtitle="[c.phone, c.email].filter(Boolean).join(' · ') || 'Sin contacto'"
              @click="elegirCliente(c)"
            />
            <v-list-item v-if="!resultadosCliente.length" class="text-medium-emphasis">
              Sin resultados.
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgCliente = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Lista de precios ──────────────────────────────── -->
    <v-dialog v-model="dlgPrecios" max-width="760">
      <v-card>
        <v-card-title class="text-subtitle-1">Precio de reparacion por modelo</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="qPrecio"
            density="compact"
            variant="outlined"
            hide-details
            autofocus
            placeholder="Ej: A04, MOTO E32, IPHONE 8"
            prepend-inner-icon="mdi-magnify"
            class="mb-3"
            @update:model-value="buscarPreciosConDemora"
          />
          <v-table v-if="resultadosPrecio.length" density="compact">
            <thead>
              <tr>
                <th>Modelo</th>
                <th class="text-right">Total</th>
                <th class="text-right">3 cuotas</th>
                <th class="text-right">6 cuotas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in resultadosPrecio" :key="p.id">
                <td>{{ p.model }}</td>
                <td class="text-right">{{ money(p.total_price) }}</td>
                <td class="text-right text-medium-emphasis">{{ money(p.installment_3) }}</td>
                <td class="text-right text-medium-emphasis">{{ money(p.installment_6) }}</td>
                <td class="text-right text-no-wrap">
                  <!-- Cobrar por POS necesita un producto: la lista de precios
                       no es cobrable por si sola. El espejo se crea una vez. -->
                  <v-btn
                    v-if="!p.product_id"
                    size="x-small"
                    variant="text"
                    :loading="espejando === p.id"
                    title="Crear el producto para cobrarlo por POS"
                    @click="espejar(p)"
                  >
                    <v-icon size="14">mdi-cart-plus</v-icon>
                  </v-btn>
                  <v-icon v-else size="14" color="success" class="mr-1" title="Ya se puede cobrar por POS">
                    mdi-cart-check
                  </v-icon>
                  <v-btn size="x-small" variant="tonal" @click="usarPrecio(p)">Usar</v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="text-caption text-medium-emphasis py-4">
            Tipea el modelo del equipo para ver el precio.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dlgPrecios = false">Cerrar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ── Alta de renglon ───────────────────────────────── -->
    <v-dialog v-model="nuevoRenglon.show" max-width="560">
      <v-card>
        <v-card-title class="text-subtitle-1">Agregar renglon</v-card-title>
        <v-card-text>
          <v-text-field v-model="nuevoRenglon.description" label="Descripcion" density="compact" variant="outlined" class="mb-3" hide-details />
          <div class="d-flex ga-3">
            <v-select v-model="nuevoRenglon.kind" :items="itemsTipo" label="Tipo" density="compact" variant="outlined" hide-details style="min-width: 150px" />
            <v-text-field v-model.number="nuevoRenglon.qty" label="Cantidad" type="number" density="compact" variant="outlined" hide-details style="min-width: 110px" />
            <v-text-field v-model.number="nuevoRenglon.cost" label="Costo" type="number" prefix="$" density="compact" variant="outlined" hide-details style="min-width: 130px" />
            <v-text-field v-model.number="nuevoRenglon.unit_price" label="Precio" type="number" prefix="$" density="compact" variant="outlined" hide-details style="min-width: 130px" />
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="nuevoRenglon.show = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" :loading="agregando" @click="agregarRenglon">Agregar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="aviso.show" :color="aviso.color" timeout="3500">{{ aviso.text }}</v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppPageHeader from "@/app/components/AppPageHeader.vue";
import { listCustomers, createCustomer } from "@/modules/admin/services/customers.service";
import { exportServiceOrderPdf, loadServiceIdentity } from "../utils/serviceOrderPdf";
import { fmtFecha } from "../utils/fechas";
import {
  getOrder,
  updateOrder,
  addOrderItem,
  deleteOrderItem,
  searchPrices,
  mirrorPrice,
  SERVICE_STATUS,
  statusLabel,
  statusColor,
  statusIcon,
} from "../services/service.service";

const route = useRoute();
const router = useRouter();

const orden = ref({ items: [] });
const guardando = ref(false);

const aviso = ref({ show: false, text: "", color: "success" });
function notificar(text, color = "success") {
  aviso.value = { show: true, text, color };
}

const itemsEstado = computed(() => SERVICE_STATUS.map((s) => ({ title: s.label, value: s.value })));
const itemsTipo = [
  { title: "Repuesto", value: "repuesto" },
  { title: "Mano de obra", value: "mano_obra" },
  { title: "Otro", value: "otro" },
];

const subtitulo = computed(() => {
  const eq = [orden.value.device_brand, orden.value.device_model].filter(Boolean).join(" ");
  return [orden.value.customer_name, eq].filter(Boolean).join(" · ");
});

// El saldo se muestra en vivo mientras se tipea el presupuesto o la seña. El
// backend lo vuelve a calcular al guardar: la pantalla no es la fuente de verdad.
const saldo = computed(() =>
  Math.max(0, Number(orden.value.quoted_amount || 0) - Number(orden.value.deposit || 0))
);

function money(v) {
  const n = Number(v || 0);
  return n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
}
const fecha = (v) => fmtFecha(v, "—");

async function cargar() {
  try {
    const { data } = await getOrder(route.params.id);
    orden.value = { items: [], ...(data?.data || {}) };
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo cargar la orden.", "error");
  }
}

async function guardar() {
  guardando.value = true;
  try {
    const { data } = await updateOrder(route.params.id, orden.value);
    orden.value = { items: [], ...(data?.data || {}) };
    notificar("Orden guardada.");
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo guardar.", "error");
  } finally {
    guardando.value = false;
  }
}

function volver() {
  router.push({ name: "serviceOrders" });
}

// La orden de trabajo en papel: tres copias en una A4 (local, taller, cliente),
// como se cortaba el papel del libro viejo.
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

// ── Cliente ────────────────────────────────────────────────────────────────
const dlgCliente = ref(false);
const qCliente = ref("");
const resultadosCliente = ref([]);
const creandoCliente = ref(false);

const puedeCrearCliente = computed(
  () => !orden.value.customer_id && !!String(orden.value.customer_name || "").trim()
);

function abrirBuscadorCliente() {
  dlgCliente.value = true;
  // Arranca con lo que ya tenga cargado la orden: casi siempre el cliente ya
  // esta en el banco de datos y solo hay que encontrarlo.
  qCliente.value = orden.value.customer_phone || orden.value.customer_name || "";
  buscarClientes();
}

let demoraCliente = null;
function buscarClientesConDemora() {
  clearTimeout(demoraCliente);
  demoraCliente = setTimeout(buscarClientes, 350);
}

async function buscarClientes() {
  try {
    const { data } = await listCustomers({ q: qCliente.value, limit: 20 });
    resultadosCliente.value = data?.data || [];
  } catch {
    resultadosCliente.value = [];
  }
}

function elegirCliente(c) {
  orden.value.customer_id = c.id;
  orden.value.customer_name = c.display_name || "";
  orden.value.customer_phone = c.phone || "";
  orden.value.customer_email = c.email || "";
  orden.value.customer_doc = c.doc_number || "";
  dlgCliente.value = false;
}

async function crearFichaCliente() {
  if (!puedeCrearCliente.value) return;
  creandoCliente.value = true;
  try {
    const { data } = await createCustomer({
      display_name: String(orden.value.customer_name || "").trim(),
      phone: orden.value.customer_phone || null,
      email: orden.value.customer_email || null,
      doc_number: orden.value.customer_doc || null,
      source: "admin",
    });
    const creado = data?.data || data;
    if (creado?.id) {
      orden.value.customer_id = creado.id;
      await guardar();
      notificar("Ficha creada y vinculada a la orden.");
    }
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo crear la ficha.", "error");
  } finally {
    creandoCliente.value = false;
  }
}

// ── Lista de precios ───────────────────────────────────────────────────────
const dlgPrecios = ref(false);
const qPrecio = ref("");
const resultadosPrecio = ref([]);

function abrirPrecios() {
  dlgPrecios.value = true;
  qPrecio.value = orden.value.device_model || orden.value.device_brand || "";
  buscarPrecios();
}

let demoraPrecio = null;
function buscarPreciosConDemora() {
  clearTimeout(demoraPrecio);
  demoraPrecio = setTimeout(buscarPrecios, 350);
}

async function buscarPrecios() {
  if (!qPrecio.value) {
    resultadosPrecio.value = [];
    return;
  }
  try {
    const { data } = await searchPrices({ q: qPrecio.value, limit: 30 });
    resultadosPrecio.value = data?.data || [];
  } catch {
    resultadosPrecio.value = [];
  }
}

// Espejar la reparacion como producto del catalogo, para poder cobrarla por
// POS. Idempotente del lado del backend: si ya existe, devuelve el que hay.
const espejando = ref(null);
async function espejar(p) {
  espejando.value = p.id;
  try {
    const { data } = await mirrorPrice(p.id);
    const prod = data?.data?.product;
    p.product_id = prod?.id || null;
    notificar(
      data?.data?.creado
        ? `Producto creado: ${prod?.sku}. Ya se puede cobrar por POS.`
        : "Ya estaba en el catalogo."
    );
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo crear el producto.", "error");
  } finally {
    espejando.value = null;
  }
}

// Al elegir un modelo se completa el presupuesto y el reparto de una: es
// exactamente lo que la hoja MODULOS resolvia con un buscador al costado.
function usarPrecio(p) {
  orden.value.quoted_amount = Number(p.total_price || 0);
  orden.value.commission_technician = Number(p.technician_cost || 0);
  orden.value.commission_seller = Number(p.seller_commission || 0);
  orden.value.commission_shop = Number(p.shop_margin || 0);
  if (!orden.value.device_model) orden.value.device_model = p.model;
  dlgPrecios.value = false;
  notificar(`Precio de ${p.model} aplicado. Revisa y guarda.`, "info");
}

// ── Renglones ──────────────────────────────────────────────────────────────
const agregando = ref(false);
const nuevoRenglon = ref({
  show: false,
  description: "",
  kind: "repuesto",
  qty: 1,
  cost: 0,
  unit_price: 0,
});

async function agregarRenglon() {
  if (!String(nuevoRenglon.value.description || "").trim()) {
    notificar("Falta la descripcion.", "warning");
    return;
  }
  agregando.value = true;
  try {
    await addOrderItem(route.params.id, {
      description: nuevoRenglon.value.description,
      kind: nuevoRenglon.value.kind,
      qty: nuevoRenglon.value.qty,
      cost: nuevoRenglon.value.cost,
      unit_price: nuevoRenglon.value.unit_price,
    });
    nuevoRenglon.value = { show: false, description: "", kind: "repuesto", qty: 1, cost: 0, unit_price: 0 };
    await cargar();
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo agregar el renglon.", "error");
  } finally {
    agregando.value = false;
  }
}

async function borrarRenglon(it) {
  try {
    await deleteOrderItem(route.params.id, it.id);
    await cargar();
  } catch (e) {
    notificar(e?.response?.data?.message || "No se pudo borrar el renglon.", "error");
  }
}

onMounted(cargar);
</script>

<style scoped>
.section-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}
</style>
