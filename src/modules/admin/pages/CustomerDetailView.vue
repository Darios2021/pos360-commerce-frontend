<!-- src/modules/admin/pages/CustomerDetailView.vue -->
<!--
  Vista de detalle de un cliente (página completa, no modal).
  Reemplaza el modal de "Ver/editar" del listado.

  Layout:
   - Header con avatar, nombre, tipo, estado de promos, contacto, botones rápidos.
   - Grid 2 columnas:
     - Izq: Datos personales + Contacto + Comercial (editable inline).
     - Der: Stats + Últimas ventas + Historial de mensajes.
  - Acciones: enviar email, enviar WhatsApp, enviar promociones, marcar para promos.
  - Botón "Volver" arriba a la izq.
-->
<template>
  <v-container class="cust-detail" fluid>
    <!-- BACK + ACCIONES -->
    <div class="cust-detail__topbar">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">
        Volver al listado
      </v-btn>
      <v-spacer />
      <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading">
        Recargar
      </v-btn>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-content-save" @click="save" :loading="saving"
             :disabled="!form.display_name?.trim()">
        Guardar
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

    <!-- HERO -->
    <div class="cust-hero">
      <div class="cust-hero__left">
        <div class="cust-hero__avatar">{{ initials }}</div>
        <div>
          <div class="cust-hero__name">{{ customer?.display_name || "Cliente" }}</div>
          <div class="cust-hero__meta">
            <span class="cust-type-chip" :class="`cust-type-chip--${customer?.customer_type?.toLowerCase()}`">
              {{ typeLabel(customer?.customer_type) }}
            </span>
            <span v-if="customer?.doc_number" class="cust-hero__doc">
              <v-icon size="13">mdi-card-account-details-outline</v-icon>
              {{ customer.doc_type || "DNI" }} {{ customer.doc_number }}
            </span>
            <span v-if="!customer?.is_active" class="cust-hero__inactive">
              <v-icon size="13">mdi-cancel</v-icon> Inactivo
            </span>
          </div>
          <!-- Contacto del hero (visible siempre) -->
          <div class="cust-hero__contact">
            <span v-if="customer?.email" class="cust-hero__contact-item">
              <v-icon size="13">mdi-email</v-icon> {{ customer.email }}
            </span>
            <span v-if="customer?.phone" class="cust-hero__contact-item">
              <v-icon size="13">mdi-phone</v-icon> {{ customer.phone }}
            </span>
            <span v-if="!customer?.email && !customer?.phone" class="cust-hero__no-contact">
              <v-icon size="13" color="warning">mdi-alert</v-icon>
              Sin email ni teléfono — no podés enviarle mensajes hasta cargarlo
            </span>
          </div>
        </div>
      </div>

      <div class="cust-hero__actions">
        <v-btn :disabled="!customer?.email" color="primary" variant="flat" rounded="lg"
               prepend-icon="mdi-email-outline" @click="openSendQuick('email')">
          Enviar email
        </v-btn>
        <v-btn :disabled="!customer?.phone" color="success" variant="flat" rounded="lg"
               prepend-icon="mdi-whatsapp" @click="openSendQuick('whatsapp')">
          WhatsApp
        </v-btn>
        <v-btn :disabled="!customer?.email && !customer?.phone" variant="tonal" rounded="lg"
               prepend-icon="mdi-tag-multiple-outline" @click="openPromoSend">
          Enviar promos
        </v-btn>
        <v-btn variant="text" rounded="lg" :prepend-icon="customer?.accepts_promos ? 'mdi-bell-off-outline' : 'mdi-bell-ring-outline'"
               @click="togglePromos">
          {{ customer?.accepts_promos ? "Quitar de promos" : "Marcar para promos" }}
        </v-btn>
      </div>
    </div>

    <!-- GRID -->
    <div class="cust-grid">
      <!-- COL IZQ — Datos editables -->
      <div class="cust-col">
        <section class="cust-section">
          <div class="cust-section__head">
            <v-icon size="14" color="primary">mdi-account-edit-outline</v-icon>
            <span>Datos personales</span>
          </div>
          <div class="cust-section__body">
            <div class="cust-row-2">
              <v-text-field v-model="form.first_name" label="Nombre"
                            variant="outlined" density="compact" hide-details />
              <v-text-field v-model="form.last_name" label="Apellido"
                            variant="outlined" density="compact" hide-details />
            </div>
            <v-text-field v-model="form.display_name" label="Nombre a mostrar (display_name)"
                          variant="outlined" density="compact" hide-details class="mt-3" />
            <div class="cust-row-2 mt-3">
              <v-select v-model="form.doc_type" :items="docTypeItems" label="Tipo doc"
                        variant="outlined" density="compact" hide-details />
              <v-text-field v-model="form.doc_number" label="Nro documento"
                            variant="outlined" density="compact" hide-details />
            </div>
          </div>
        </section>

        <section class="cust-section">
          <div class="cust-section__head">
            <v-icon size="14" color="primary">mdi-card-account-phone-outline</v-icon>
            <span>Contacto</span>
            <v-spacer />
            <span v-if="!hasContact" class="cust-section__warn">
              <v-icon size="12" color="warning">mdi-alert</v-icon>
              Necesario para enviar mensajes
            </span>
          </div>
          <div class="cust-section__body">
            <v-text-field v-model="form.email" label="Email" type="email"
                          variant="outlined" density="comfortable" hide-details
                          prepend-inner-icon="mdi-email-outline"
                          placeholder="cliente@ejemplo.com" />
            <v-text-field v-model="form.phone" label="Teléfono"
                          variant="outlined" density="comfortable" hide-details class="mt-3"
                          prepend-inner-icon="mdi-phone-outline"
                          placeholder="+54 11 1234-5678" />
          </div>
        </section>

        <section class="cust-section">
          <div class="cust-section__head">
            <v-icon size="14" color="primary">mdi-tune-variant</v-icon>
            <span>Comercial</span>
          </div>
          <div class="cust-section__body">
            <v-select v-model="form.customer_type" :items="customerTypeItems"
                      label="Tipo de cliente"
                      variant="outlined" density="compact" hide-details />
            <v-text-field v-model="form.tags" label="Tags / etiquetas (libre)"
                          variant="outlined" density="compact" hide-details class="mt-3"
                          placeholder="vip, campania-2026" />
            <v-textarea v-model="form.notes" label="Notas internas"
                        variant="outlined" density="compact" hide-details rows="3" auto-grow class="mt-3"
                        placeholder="Información que solo ven los admins" />
            <div class="d-flex ga-3 mt-3">
              <v-switch v-model="form.accepts_promos" color="primary" hide-details density="compact"
                        :label="form.accepts_promos ? 'Acepta promos' : 'No acepta promos'" />
              <v-switch v-model="form.is_active" color="success" hide-details density="compact"
                        :label="form.is_active ? 'Activo' : 'Inactivo'" />
            </div>
          </div>
        </section>

        <section v-if="customer && customer.id" class="cust-section cust-section--danger">
          <div class="cust-section__head">
            <v-icon size="14" color="error">mdi-alert-octagon-outline</v-icon>
            <span>Zona peligrosa</span>
          </div>
          <div class="cust-section__body">
            <div class="text-caption text-medium-emphasis mb-2">
              Eliminar el cliente desactiva su registro. Si querés borrarlo definitivamente,
              primero desactivalo y volvé a hacer click.
            </div>
            <v-btn color="error" variant="tonal" prepend-icon="mdi-trash-can-outline"
                   :loading="busyDelete" @click="onDelete">
              {{ form.is_active ? "Desactivar cliente" : "Eliminar definitivamente" }}
            </v-btn>
          </div>
        </section>
      </div>

      <!-- COL DER — Stats + Historial -->
      <div class="cust-col">
        <section class="cust-section">
          <div class="cust-section__head">
            <v-icon size="14" color="primary">mdi-chart-line</v-icon>
            <span>Estadísticas</span>
          </div>
          <div class="cust-stats">
            <div class="cust-stat">
              <div class="cust-stat__num">{{ stats.sales_count }}</div>
              <div class="cust-stat__label">Compras</div>
            </div>
            <div class="cust-stat">
              <div class="cust-stat__num">${{ fmtNum(stats.sales_total) }}</div>
              <div class="cust-stat__label">Total facturado</div>
            </div>
            <div class="cust-stat">
              <div class="cust-stat__num">${{ fmtNum(stats.avg_ticket, 0) }}</div>
              <div class="cust-stat__label">Ticket promedio</div>
            </div>
            <div class="cust-stat">
              <div class="cust-stat__num">{{ fmtDate(stats.last_sold_at) }}</div>
              <div class="cust-stat__label">Última compra</div>
            </div>
          </div>
        </section>

        <section class="cust-section">
          <div class="cust-section__head">
            <v-icon size="14" color="primary">mdi-receipt-text-outline</v-icon>
            <span>Últimas ventas</span>
            <v-spacer />
            <span v-if="recentSales.length" class="cust-section__count">{{ recentSales.length }}</span>
          </div>
          <div class="cust-section__body">
            <div v-if="!recentSales.length" class="cust-empty">
              Sin ventas registradas para este cliente.
            </div>
            <div v-else class="cust-sales">
              <div v-for="s in recentSales" :key="s.id" class="cust-sale">
                <div class="cust-sale__main">
                  <div class="cust-sale__num">{{ s.sale_number || `Venta #${s.id}` }}</div>
                  <div class="cust-sale__date">{{ fmtDateTime(s.sold_at) }}</div>
                </div>
                <div class="cust-sale__total">${{ fmtNum(s.total) }}</div>
                <span class="cust-sale__status" :class="`cust-sale__status--${(s.status || '').toLowerCase()}`">
                  {{ s.status }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section class="cust-section">
          <div class="cust-section__head">
            <v-icon size="14" color="primary">mdi-message-text-outline</v-icon>
            <span>Historial de mensajes</span>
            <v-spacer />
            <span v-if="messageLogs.length" class="cust-section__count">{{ messageLogs.length }}</span>
          </div>
          <div class="cust-section__body">
            <div v-if="loadingLogs" class="cust-empty">
              <v-progress-circular indeterminate size="22" color="primary" />
            </div>
            <div v-else-if="!messageLogs.length" class="cust-empty">
              No hay envíos registrados para este cliente.
            </div>
            <div v-else class="cust-msgs">
              <div v-for="m in messageLogs" :key="m.id" class="cust-msg">
                <v-icon size="14" :color="m.channel === 'email' ? 'primary' : 'success'">
                  {{ m.channel === "email" ? "mdi-email-outline" : "mdi-whatsapp" }}
                </v-icon>
                <div class="cust-msg__main">
                  <div class="cust-msg__sub">{{ m.subject || "(sin asunto)" }}</div>
                  <div class="cust-msg__meta">
                    {{ fmtDateTime(m.sent_at || m.created_at) }} · → {{ m.to_address }}
                  </div>
                </div>
                <span class="cust-msg__status" :class="`cust-msg__status--${m.status}`">
                  {{ statusLabel(m.status) }}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Dialog para envío rápido (1 cliente) -->
    <SendMessageDialog
      :open="quickSend.open"
      :targets="quickSend.targets"
      :initial-channel="quickSend.channel"
      @close="quickSend.open = false"
      @sent="onQuickSent"
    />

    <!-- Dialog "Enviar promociones" -->
    <PromoSendDialog
      :open="promoSend.open"
      :promo-blocks="promoSend.blocks"
      @close="promoSend.open = false"
      @sent="onPromoSent"
    />

    <v-snackbar v-model="snack.show" :timeout="3000">{{ snack.text }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  getCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/modules/admin/services/customers.service";
import { getCustomerMessageLogs } from "@/modules/admin/services/messaging.service";
import { listPromoBlocks } from "@/modules/admin/services/emailPromoBlocks.api";
import SendMessageDialog from "@/modules/admin/components/SendMessageDialog.vue";
import PromoSendDialog from "@/modules/admin/components/PromoSendDialog.vue";

const route = useRoute();
const router = useRouter();

const customerId = computed(() => Number(route.params.id) || 0);
const loading = ref(false);
const saving = ref(false);
const busyDelete = ref(false);
const loadingLogs = ref(false);
const error = ref("");
const customer = ref(null);
const stats = reactive({
  sales_count: 0,
  sales_total: 0,
  avg_ticket: 0,
  last_sold_at: null,
});
const recentSales = ref([]);
const messageLogs = ref([]);
const snack = reactive({ show: false, text: "" });

const form = reactive({
  first_name: "",
  last_name: "",
  display_name: "",
  email: "",
  phone: "",
  doc_type: "DNI",
  doc_number: "",
  customer_type: "consumidor_final",
  tags: "",
  notes: "",
  accepts_promos: false,
  is_active: true,
});

const docTypeItems = [
  { title: "DNI", value: "DNI" },
  { title: "CUIT", value: "CUIT" },
  { title: "CUIL", value: "CUIL" },
  { title: "PASAPORTE", value: "PASAPORTE" },
];
const customerTypeItems = [
  { title: "Consumidor final", value: "consumidor_final" },
  { title: "Responsable inscripto", value: "responsable_inscripto" },
  { title: "Monotributo", value: "monotributo" },
  { title: "Exento", value: "exento" },
];

const initials = computed(() => {
  const src = customer.value?.display_name || `${customer.value?.first_name || ""} ${customer.value?.last_name || ""}`;
  const parts = String(src).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
});
const hasContact = computed(() => !!(form.email?.trim() || form.phone?.trim()));

// ── Quick send (email/whatsapp solo, sin promos) ──
const quickSend = reactive({ open: false, targets: [], channel: "email" });
function openSendQuick(channel) {
  if (!customer.value) return;
  quickSend.targets = [{
    id: customer.value.id,
    display_name: customer.value.display_name,
    email: customer.value.email,
    phone: customer.value.phone,
  }];
  quickSend.channel = channel;
  quickSend.open = true;
}
function onQuickSent() {
  quickSend.open = false;
  loadMessageLogs();
}

// ── Promo send (email + promos del catálogo) ──
const promoSend = reactive({ open: false, blocks: [] });
async function openPromoSend() {
  // Cargamos promos activas y abrimos el dialog. El usuario elige cuáles
  // adjuntar y este cliente queda preseleccionado.
  try {
    const blocks = await listPromoBlocks({ activeOnly: true });
    promoSend.blocks = blocks || [];
    // Pre-targetear este cliente — pasamos al PromoSendDialog vía un truco:
    // el dialog lo lee como prop opcional `initialTargetIds` (no implementado aún
    // — lo dejo abierto para que el usuario elija manualmente, se autocargan promos
    // y solo busca al cliente). Versión MVP rápida.
    promoSend.open = true;
  } catch (e) {
    snack.show = true;
    snack.text = e?.response?.data?.message || e?.message || "No se pudieron cargar promos.";
  }
}
function onPromoSent() {
  promoSend.open = false;
  loadMessageLogs();
}

async function load() {
  if (!customerId.value) return;
  loading.value = true;
  error.value = "";
  try {
    const { data } = await getCustomer(customerId.value);
    const c = data?.data;
    if (!c) throw new Error("Cliente no encontrado");
    customer.value = c;
    Object.assign(form, {
      first_name: c.first_name || "",
      last_name: c.last_name || "",
      display_name: c.display_name || "",
      email: c.email || "",
      phone: c.phone || "",
      doc_type: c.doc_type || "DNI",
      doc_number: c.doc_number || "",
      customer_type: c.customer_type || "consumidor_final",
      tags: c.tags || "",
      notes: c.notes || "",
      accepts_promos: !!c.accepts_promos,
      is_active: c.is_active !== false,
    });
    if (c.stats) {
      stats.sales_count = c.stats.sales_count || 0;
      stats.sales_total = c.stats.sales_total || 0;
      stats.avg_ticket = c.stats.avg_ticket || 0;
      stats.last_sold_at = c.stats.last_sold_at || null;
    }
    recentSales.value = c.recent_sales || [];
    loadMessageLogs();
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Error al cargar.";
  } finally {
    loading.value = false;
  }
}

async function loadMessageLogs() {
  if (!customerId.value) return;
  loadingLogs.value = true;
  try {
    const { data } = await getCustomerMessageLogs(customerId.value);
    messageLogs.value = data?.data || [];
  } catch (e) {
    messageLogs.value = [];
  } finally {
    loadingLogs.value = false;
  }
}

async function save() {
  saving.value = true;
  error.value = "";
  try {
    const { data } = await updateCustomer(customerId.value, { ...form });
    if (data?.data) customer.value = { ...customer.value, ...data.data };
    snack.show = true; snack.text = "Cliente guardado";
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Error al guardar.";
  } finally {
    saving.value = false;
  }
}

async function togglePromos() {
  form.accepts_promos = !form.accepts_promos;
  await save();
}

async function onDelete() {
  const isHard = !form.is_active;
  const ok = window.confirm(isHard
    ? "¿Eliminar definitivamente este cliente? Las ventas pierden el vínculo (quedan como Cliente eliminado)."
    : "¿Desactivar este cliente? Podés reactivarlo después.");
  if (!ok) return;
  busyDelete.value = true;
  try {
    await deleteCustomer(customerId.value, { force: isHard });
    snack.show = true; snack.text = isHard ? "Cliente eliminado" : "Cliente desactivado";
    setTimeout(goBack, 800);
  } catch (e) {
    error.value = e?.response?.data?.message || e?.message || "Error al eliminar.";
  } finally {
    busyDelete.value = false;
  }
}

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push({ name: "adminCustomers" });
}

function fmtNum(v, dec = 0) {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: dec }).format(Number(v || 0));
}
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}
function fmtDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
function typeLabel(v) {
  return customerTypeItems.find((i) => i.value === v)?.title || v || "—";
}
function statusLabel(s) {
  const m = { sent: "Enviado", failed: "Falló", queued: "En cola", manual_link: "Link generado" };
  return m[s] || s;
}

watch(() => customerId.value, () => {
  if (customerId.value) load();
});
onMounted(load);
</script>

<style scoped>
.cust-detail { max-width: 1280px; }
.cust-detail__topbar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 12px;
}

/* HERO */
.cust-hero {
  display: flex; gap: 20px; align-items: flex-start; flex-wrap: wrap;
  padding: 22px 24px;
  background: linear-gradient(135deg,
    rgba(var(--v-theme-primary), 0.08) 0%,
    rgba(var(--v-theme-primary), 0.02) 100%);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 16px;
  margin-bottom: 18px;
}
.cust-hero__left { display: flex; gap: 16px; align-items: flex-start; flex-grow: 1; min-width: 280px; }
.cust-hero__avatar {
  width: 72px; height: 72px; border-radius: 18px;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  display: grid; place-items: center;
  font-size: 24px; font-weight: 500;
  letter-spacing: -0.02em;
  flex-shrink: 0;
}
.cust-hero__name {
  font-size: 22px; font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.cust-hero__meta {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  margin-top: 6px;
}
.cust-type-chip {
  font-size: 10.5px; font-weight: 500;
  padding: 3px 8px; border-radius: 999px;
  letter-spacing: 0.04em; text-transform: uppercase;
  background: rgba(var(--v-theme-primary), 0.15);
  color: rgb(var(--v-theme-primary));
}
.cust-hero__doc {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 12px; opacity: 0.7;
}
.cust-hero__inactive {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11.5px; font-weight: 400;
  color: rgb(var(--v-theme-error));
}
.cust-hero__contact {
  display: flex; gap: 16px; flex-wrap: wrap;
  margin-top: 10px;
  font-size: 13px;
}
.cust-hero__contact-item {
  display: inline-flex; align-items: center; gap: 5px;
  opacity: 0.85;
}
.cust-hero__no-contact {
  display: inline-flex; align-items: center; gap: 5px;
  color: rgb(var(--v-theme-warning));
  font-weight: 400; font-size: 12.5px;
}
.cust-hero__actions {
  display: flex; gap: 8px; flex-wrap: wrap;
}

/* GRID */
.cust-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 960px) {
  .cust-grid { grid-template-columns: 1fr; }
}
.cust-col { display: flex; flex-direction: column; gap: 16px; }

/* SECTIONS */
.cust-section {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 14px;
  overflow: hidden;
}
.cust-section--danger { border-color: rgba(var(--v-theme-error), 0.25); }
.cust-section__head {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  background: rgba(var(--v-theme-on-surface), 0.02);
  font-size: 11.5px; font-weight: 500;
  letter-spacing: 0.06em; text-transform: uppercase;
  opacity: 0.7;
}
.cust-section__warn {
  display: inline-flex; align-items: center; gap: 4px;
  color: rgb(var(--v-theme-warning));
  font-weight: 400; font-size: 11px;
  text-transform: none; letter-spacing: 0.02em;
}
.cust-section__count {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0; text-transform: none;
  font-size: 11px;
  padding: 2px 7px; border-radius: 999px;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}
.cust-section__body { padding: 16px; }

.cust-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 600px) { .cust-row-2 { grid-template-columns: 1fr; } }

.cust-empty {
  text-align: center;
  padding: 18px;
  font-size: 12.5px; opacity: 0.55;
}

/* STATS */
.cust-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.cust-stat {
  background: rgb(var(--v-theme-surface));
  padding: 18px 16px;
  text-align: center;
}
.cust-stat__num {
  font-size: 22px; font-weight: 500;
  letter-spacing: -0.02em;
  color: rgb(var(--v-theme-primary));
}
.cust-stat__label {
  font-size: 10.5px; font-weight: 500;
  opacity: 0.6;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-top: 4px;
}

/* SALES LIST */
.cust-sales { display: flex; flex-direction: column; gap: 4px; }
.cust-sale {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}
.cust-sale__main { flex-grow: 1; min-width: 0; }
.cust-sale__num { font-size: 12.5px; font-weight: 400; }
.cust-sale__date { font-size: 10.5px; opacity: 0.6; }
.cust-sale__total { font-size: 13px; font-weight: 500; }
.cust-sale__status {
  font-size: 9.5px; font-weight: 500;
  padding: 2px 6px; border-radius: 5px;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.cust-sale__status--paid { background: rgba(var(--v-theme-success), 0.18); color: rgb(var(--v-theme-success)); }
.cust-sale__status--cancelled { background: rgba(var(--v-theme-error), 0.15); color: rgb(var(--v-theme-error)); }

/* MSGS */
.cust-msgs { display: flex; flex-direction: column; gap: 6px; }
.cust-msg {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.03);
}
.cust-msg__main { flex-grow: 1; min-width: 0; }
.cust-msg__sub {
  font-size: 12.5px; font-weight: 400;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cust-msg__meta { font-size: 10.5px; opacity: 0.6; }
.cust-msg__status {
  font-size: 9.5px; font-weight: 500;
  padding: 2px 6px; border-radius: 5px;
  letter-spacing: 0.04em; text-transform: uppercase;
}
.cust-msg__status--sent { background: rgba(var(--v-theme-success), 0.18); color: rgb(var(--v-theme-success)); }
.cust-msg__status--failed { background: rgba(var(--v-theme-error), 0.15); color: rgb(var(--v-theme-error)); }
.cust-msg__status--queued { background: rgba(var(--v-theme-info), 0.15); color: rgb(var(--v-theme-info)); }
.cust-msg__status--manual_link { background: rgba(var(--v-theme-warning), 0.15); color: rgb(var(--v-theme-warning)); }
</style>
