<template>
  <div class="tdet">

    <!-- ══════════ BREADCRUMB / VOLVER ══════════════════════════ -->
    <div class="tdet__breadcrumb">
      <button class="tdet__back" @click="$emit('close')">
        <v-icon size="15">mdi-arrow-left</v-icon>
        <span>Derivaciones</span>
      </button>
      <v-icon size="13" color="medium-emphasis">mdi-chevron-right</v-icon>
      <span class="tdet__breadcrumb-current">{{ tr.number }}</span>
      <v-chip size="x-small" :color="statusColor(tr.status)" variant="tonal" class="ml-1">
        <v-icon start size="10">{{ statusIcon(tr.status) }}</v-icon>
        {{ statusLabel(tr.status) }}
      </v-chip>
    </div>

    <!-- Loading -->
    <div v-if="loadingData" class="tdet__loading">
      <v-progress-circular indeterminate color="primary" size="36" />
      <span class="mt-3">Cargando derivación…</span>
    </div>

    <template v-else>

      <!-- ══════════ VISTA: DETALLE ════════════════════════════ -->
      <div v-if="view === 'detail'" class="tdet__view">

        <!-- Acciones -->
        <div class="tdet__actions-bar">
          <v-btn
            v-if="canDispatch"
            color="primary" size="small" variant="flat" rounded="lg"
            prepend-icon="mdi-truck-fast-outline"
            @click="openView('dispatch')"
          >Despachar</v-btn>
          <v-btn
            v-if="canReceive"
            color="success" size="small" variant="flat" rounded="lg"
            prepend-icon="mdi-check-circle-outline"
            @click="openView('receive')"
          >Recepcionar</v-btn>
          <v-btn
            v-if="canCancel"
            color="error" size="small" variant="outlined" rounded="lg"
            @click="openView('cancel')"
          >Cancelar</v-btn>
        </div>

        <!-- Ruta card -->
        <v-card elevation="0" rounded="xl" class="tdet__route-card">
          <div class="tdet__route">
            <div class="tdet__route-node">
              <v-avatar size="40" rounded="lg" color="primary" variant="tonal">
                <v-icon size="20">mdi-store-outline</v-icon>
              </v-avatar>
              <div>
                <p class="tdet__route-label">Origen</p>
                <p class="tdet__route-name">{{ tr.fromWarehouse?.branch?.name || '—' }}</p>
              </div>
            </div>

            <div class="tdet__route-middle">
              <div class="tdet__route-line" :class="`tdet__route-line--${tr.status}`" />
              <v-icon size="18" :color="routeIconColor">mdi-truck-fast-outline</v-icon>
              <div class="tdet__route-line" :class="`tdet__route-line--${tr.status}`" />
            </div>

            <div class="tdet__route-node tdet__route-node--right">
              <div style="text-align:right">
                <p class="tdet__route-label">Destino</p>
                <p class="tdet__route-name tdet__route-name--to">
                  {{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || '—' }}
                </p>
              </div>
              <v-avatar size="40" rounded="lg" color="success" variant="tonal">
                <v-icon size="20">mdi-store</v-icon>
              </v-avatar>
            </div>
          </div>
        </v-card>

        <!-- Trazabilidad + nota -->
        <v-card elevation="0" rounded="xl" class="tdet__meta-card">
          <div class="tdet__meta-head">
            <v-icon size="14" class="mr-1" color="medium-emphasis">mdi-timeline-outline</v-icon>
            <span>Trazabilidad</span>
          </div>
          <v-divider />
          <div class="tdet__timeline">
            <div class="tdet__tl-item">
              <v-icon size="14" color="medium-emphasis">mdi-pencil-circle-outline</v-icon>
              <span>Creado por <strong>{{ userName(tr.creator) }}</strong> · {{ fmtDate(tr.created_at) }}</span>
            </div>
            <div v-if="tr.dispatched_at" class="tdet__tl-item">
              <v-icon size="14" color="warning">mdi-truck-fast-outline</v-icon>
              <span>Despachado por <strong>{{ userName(tr.dispatcher) }}</strong> · {{ fmtDate(tr.dispatched_at) }}</span>
            </div>
            <div v-if="tr.received_at" class="tdet__tl-item">
              <v-icon size="14" color="success">mdi-check-circle-outline</v-icon>
              <span>Recepcionado por <strong>{{ userName(tr.receiver) }}</strong> · {{ fmtDate(tr.received_at) }}</span>
            </div>
          </div>
          <template v-if="tr.note">
            <v-divider />
            <div class="tdet__note">
              <v-icon size="14" color="medium-emphasis" class="mr-2">mdi-note-text-outline</v-icon>
              <span>{{ tr.note }}</span>
            </div>
          </template>
        </v-card>

        <!-- Productos -->
        <v-card elevation="0" rounded="xl" class="tdet__items-card">
          <div class="tdet__meta-head">
            <v-icon size="14" class="mr-1" color="medium-emphasis">mdi-package-variant-closed</v-icon>
            <span>Productos ({{ tr.items?.length || 0 }})</span>
          </div>
          <v-divider />

          <div v-if="tr.items?.length">
            <div
              v-for="item in tr.items" :key="item.id"
              class="tdet__item-row"
            >
              <v-avatar size="40" rounded="lg" color="surface-variant" class="flex-shrink-0">
                <v-img v-if="item.product?.images?.[0]?.url" :src="item.product.images[0].url" cover />
                <v-icon v-else size="18">mdi-package-variant</v-icon>
              </v-avatar>
              <div class="tdet__item-info">
                <p class="tdet__item-name">{{ item.product?.name || `Producto #${item.product_id}` }}</p>
                <p class="tdet__item-sku">{{ item.product?.sku || item.product?.barcode || '' }}</p>
              </div>
              <div class="tdet__item-qtys">
                <div class="tdet__qty">
                  <span class="tdet__qty-label">Enviado</span>
                  <span class="tdet__qty-val">{{ fmt(item.qty_sent) }}</span>
                </div>
                <template v-if="item.qty_received != null">
                  <v-icon size="14" color="medium-emphasis">mdi-arrow-right</v-icon>
                  <div class="tdet__qty" :class="{ 'tdet__qty--diff': +item.qty_received !== +item.qty_sent }">
                    <span class="tdet__qty-label">Recibido</span>
                    <span class="tdet__qty-val">{{ fmt(item.qty_received) }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
          <div v-else class="tdet__empty-items">Sin productos registrados.</div>
        </v-card>
      </div>

      <!-- ══════════ VISTA: DESPACHAR ══════════════════════════ -->
      <div v-else-if="view === 'dispatch'" class="tdet__view">
        <!-- Cabecera de acción -->
        <div class="tdet__action-header">
          <button class="tdet__back tdet__back--sub" @click="view = 'detail'" :disabled="actioning">
            <v-icon size="15">mdi-arrow-left</v-icon>
            <span>Volver al detalle</span>
          </button>
          <span class="tdet__action-title">Confirmar despacho</span>
        </div>

        <v-alert type="warning" variant="tonal" rounded="xl">
          <template #title>¿Confirmar el despacho?</template>
          El stock de <strong>{{ tr.fromWarehouse?.branch?.name }}</strong>
          se va a <strong>descontar</strong> con las cantidades indicadas.
          Esta acción no puede deshacerse.
        </v-alert>

        <v-card elevation="0" rounded="xl" class="tdet__action-card">
          <div class="tdet__meta-head">
            <v-icon size="14" class="mr-1" color="medium-emphasis">mdi-package-variant-closed</v-icon>
            <span>Stock a descontar en {{ tr.fromWarehouse?.branch?.name || '—' }}</span>
          </div>
          <v-divider />
          <div v-if="tr.items?.length">
            <div v-for="item in tr.items" :key="item.id" class="tdet__action-row">
              <span class="tdet__action-row-name">{{ item.product?.name || `#${item.product_id}` }}</span>
              <span class="tdet__action-row-qty tdet__action-row-qty--out">
                <v-icon size="13" color="error">mdi-minus-circle-outline</v-icon>
                {{ fmt(item.qty_sent) }}
              </span>
            </div>
          </div>
          <div v-else class="tdet__empty-items">Sin productos.</div>
        </v-card>

        <v-alert v-if="actionError" type="error" variant="tonal" rounded="lg" density="compact">
          {{ actionError }}
        </v-alert>

        <div class="tdet__action-btns">
          <v-btn variant="outlined" rounded="lg" @click="view = 'detail'" :disabled="actioning">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="actioning" @click="doDispatch">
            <v-icon start>mdi-send-outline</v-icon>
            Confirmar despacho
          </v-btn>
        </div>
      </div>

      <!-- ══════════ VISTA: RECEPCIONAR ════════════════════════ -->
      <div v-else-if="view === 'receive'" class="tdet__view">
        <div class="tdet__action-header">
          <button class="tdet__back tdet__back--sub" @click="view = 'detail'" :disabled="actioning">
            <v-icon size="15">mdi-arrow-left</v-icon>
            <span>Volver al detalle</span>
          </button>
          <span class="tdet__action-title">Confirmar recepción</span>
        </div>

        <v-alert type="success" variant="tonal" rounded="xl">
          <template #title>Confirmar recepción</template>
          El stock ingresará en
          <strong>{{ tr.toBranch?.name || tr.toWarehouse?.branch?.name }}</strong>.
          Ajustá las cantidades si recibiste diferente a lo enviado.
        </v-alert>

        <v-card elevation="0" rounded="xl" class="tdet__action-card">
          <div class="tdet__meta-head">
            <v-icon size="14" class="mr-1" color="medium-emphasis">mdi-package-variant-closed</v-icon>
            <span>Cantidades recibidas</span>
            <v-chip v-if="hasDifferences" size="x-small" color="warning" variant="tonal" class="ml-2">
              con diferencias
            </v-chip>
          </div>
          <v-divider />
          <template v-if="receiveForm.length">
            <div
              v-for="item in receiveForm" :key="item.item_id"
              class="tdet__recv-item"
              :class="{ 'tdet__recv-item--diff': item.qty_received !== item.qty_sent }"
            >
              <div class="tdet__recv-name-row">
                <span class="tdet__recv-name">{{ item.name }}</span>
                <v-chip v-if="item.qty_received !== item.qty_sent" size="x-small" color="warning" variant="tonal">
                  diferencia
                </v-chip>
              </div>
              <div class="tdet__recv-controls">
                <div class="tdet__recv-sent">
                  <span class="tdet__recv-sent-label">Enviado</span>
                  <span class="tdet__recv-sent-val">{{ item.qty_sent }}</span>
                </div>
                <v-icon size="14" color="medium-emphasis">mdi-arrow-right</v-icon>
                <div class="tdet__recv-stepper">
                  <v-btn icon size="x-small" variant="tonal"
                    @click="item.qty_received = Math.max(0, item.qty_received - 1)">
                    <v-icon size="14">mdi-minus</v-icon>
                  </v-btn>
                  <input
                    type="number" min="0"
                    class="tdet__recv-input"
                    :class="{ 'tdet__recv-input--diff': item.qty_received !== item.qty_sent }"
                    v-model.number="item.qty_received"
                  />
                  <v-btn icon size="x-small" variant="tonal" @click="item.qty_received++">
                    <v-icon size="14">mdi-plus</v-icon>
                  </v-btn>
                </div>
              </div>
              <v-text-field
                v-model="item.note"
                placeholder="Nota / motivo diferencia…"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                class="tdet__recv-note"
              />
            </div>
          </template>
          <div v-else class="tdet__empty-items">Sin productos — solo se confirmará la entrega.</div>
        </v-card>

        <v-alert v-if="hasDifferences" type="warning" variant="tonal" rounded="lg" density="compact">
          Hay diferencias entre lo enviado y lo recibido. La derivación quedará en estado
          <strong>Con diferencia</strong>.
        </v-alert>
        <v-alert v-if="actionError" type="error" variant="tonal" rounded="lg" density="compact">
          {{ actionError }}
        </v-alert>

        <div class="tdet__action-btns">
          <v-btn variant="outlined" rounded="lg" @click="view = 'detail'" :disabled="actioning">Cancelar</v-btn>
          <v-btn
            :color="hasDifferences ? 'warning' : 'success'"
            variant="flat" rounded="lg" :loading="actioning" @click="doReceive"
          >
            <v-icon start>{{ hasDifferences ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline' }}</v-icon>
            {{ hasDifferences ? 'Confirmar con diferencia' : 'Confirmar recepción' }}
          </v-btn>
        </div>
      </div>

      <!-- ══════════ VISTA: CANCELAR ═══════════════════════════ -->
      <div v-else-if="view === 'cancel'" class="tdet__view">
        <div class="tdet__action-header">
          <button class="tdet__back tdet__back--sub" @click="view = 'detail'" :disabled="actioning">
            <v-icon size="15">mdi-arrow-left</v-icon>
            <span>Volver al detalle</span>
          </button>
          <span class="tdet__action-title">Cancelar derivación</span>
        </div>

        <v-alert type="error" variant="tonal" rounded="xl">
          <template #title>¿Cancelar esta derivación?</template>
          La derivación <strong>{{ tr.number }}</strong> pasará a estado
          <strong>Cancelada</strong>. El stock no se modifica y esta acción
          no puede deshacerse.
        </v-alert>

        <v-card elevation="0" rounded="xl" class="tdet__action-card">
          <div class="tdet__meta-head">
            <v-icon size="14" class="mr-1" color="medium-emphasis">mdi-note-outline</v-icon>
            <span>Motivo de cancelación</span>
          </div>
          <v-divider />
          <div class="pa-4">
            <v-textarea
              v-model="cancelReason"
              placeholder="Ej: error de carga, pedido cancelado, duplicado… (opcional)"
              variant="outlined"
              density="compact"
              rounded="lg"
              rows="3"
              hide-details
            />
          </div>
        </v-card>

        <v-alert v-if="actionError" type="error" variant="tonal" rounded="lg" density="compact">
          {{ actionError }}
        </v-alert>

        <div class="tdet__action-btns">
          <v-btn variant="outlined" rounded="lg" @click="view = 'detail'" :disabled="actioning">Volver</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" :loading="actioning" @click="doCancel">
            <v-icon start>mdi-cancel</v-icon>
            Sí, cancelar derivación
          </v-btn>
        </div>
      </div>

    </template>

    <!-- Snackbar -->
    <v-snackbar v-model="snack.show" :color="snack.color" :timeout="3500"
      location="bottom center" rounded="lg" elevation="4">
      <div class="d-flex align-center gap-3">
        <v-icon>{{ snack.icon }}</v-icon>
        {{ snack.message }}
      </div>
    </v-snackbar>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getTransfer, dispatchTransfer, receiveTransfer, cancelTransfer } from "../service/stockTransfer.api";

const props = defineProps({
  transfer:        { type: Object, required: true },
  isAdmin:         { type: Boolean, default: false },
  isCentral:       { type: Boolean, default: false },
  currentBranchId: { type: Number, default: null },
});
const emit = defineEmits(["dispatch", "receive", "cancel", "close"]);

const fullData     = ref(props.transfer);
const loadingData  = ref(false);
const actioning    = ref(false);
const actionError  = ref("");
const view         = ref("detail");
const cancelReason = ref("");
const receiveForm  = ref([]);
const snack        = ref({ show: false, message: "", color: "success", icon: "mdi-check-circle" });

function showSnack(msg, color = "success", icon = "mdi-check-circle") {
  snack.value = { show: true, message: msg, color, icon };
}

onMounted(async () => {
  loadingData.value = true;
  try {
    const { data } = await getTransfer(props.transfer.id);
    if (data?.transfer) fullData.value = data.transfer;
    else if (data?.id)  fullData.value = data;
  } catch {}
  finally { loadingData.value = false; }
});

watch(() => props.transfer, async (v) => {
  if (!v?.id) return;
  try {
    const { data } = await getTransfer(v.id);
    if (data?.transfer) fullData.value = data.transfer;
    else if (data?.id)  fullData.value = data;
  } catch { fullData.value = v; }
});

watch(() => props.transfer?.id, () => {
  view.value = "detail"; actionError.value = "";
});

const tr = computed(() => fullData.value);

const isDestination = computed(() =>
  props.currentBranchId && tr.value.to_branch_id === props.currentBranchId
);
const isOrigin = computed(() =>
  props.currentBranchId && tr.value.fromWarehouse?.branch_id === props.currentBranchId
);
const canDispatch = computed(() => tr.value.status === "draft"      && (props.isAdmin || isOrigin.value));
const canCancel   = computed(() => tr.value.status === "draft"      && (props.isAdmin || isOrigin.value));
const canReceive  = computed(() => tr.value.status === "dispatched" && (props.isAdmin || isDestination.value));

const hasDifferences = computed(() =>
  receiveForm.value.some(i => i.qty_received !== i.qty_sent)
);

const routeIconColor = computed(() => ({
  draft: "medium-emphasis", dispatched: "warning",
  received: "success", partial: "warning",
})[tr.value.status] || "medium-emphasis");

function statusLabel(s) {
  return { draft:"Borrador", dispatched:"Enviada", received:"Recibida",
           partial:"Diferencia", cancelled:"Cancelada", rejected:"Rechazada" }[s] || s;
}
function statusIcon(s) {
  return { draft:"mdi-clock-edit-outline", dispatched:"mdi-truck-fast-outline",
           received:"mdi-check-circle-outline", partial:"mdi-alert-circle-outline",
           cancelled:"mdi-cancel", rejected:"mdi-close-circle-outline" }[s] || "mdi-help";
}
function statusColor(s) {
  return { draft:"default", dispatched:"warning", received:"success",
           partial:"warning", cancelled:"default", rejected:"error" }[s] || "default";
}
function userName(u) {
  if (!u) return "—";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || `#${u.id}`;
}
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-AR", {
    day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit",
  });
}
function fmt(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? (n % 1 === 0 ? n : n.toFixed(2)) : "—";
}

function openView(v) {
  actionError.value = "";
  if (v === "receive") {
    receiveForm.value = (tr.value.items || []).map(i => ({
      item_id:      i.id,
      name:         i.product?.name || `Producto #${i.product_id}`,
      qty_sent:     parseFloat(i.qty_sent),
      qty_received: parseFloat(i.qty_sent),
      note:         "",
    }));
  }
  view.value = v;
}

async function doDispatch() {
  actioning.value = true; actionError.value = "";
  try {
    await dispatchTransfer(tr.value.id);
    view.value = "detail";
    showSnack("Derivación despachada — stock descontado", "primary", "mdi-truck-fast-outline");
    emit("dispatch", tr.value.id);
  } catch (e) {
    actionError.value = e?.response?.data?.message || "Error al despachar";
  } finally { actioning.value = false; }
}

async function doReceive() {
  actioning.value = true; actionError.value = "";
  try {
    await receiveTransfer(tr.value.id, { receptions: receiveForm.value });
    view.value = "detail";
    showSnack(
      hasDifferences.value ? "Recepción confirmada con diferencias" : "Recepción confirmada — stock actualizado",
      hasDifferences.value ? "warning" : "success",
      "mdi-check-circle-outline"
    );
    emit("receive", tr.value.id);
  } catch (e) {
    actionError.value = e?.response?.data?.message || "Error al recepcionar";
  } finally { actioning.value = false; }
}

async function doCancel() {
  actioning.value = true; actionError.value = "";
  try {
    await cancelTransfer(tr.value.id);
    view.value = "detail";
    showSnack("Derivación cancelada", "error", "mdi-cancel");
    emit("cancel", tr.value.id);
  } catch (e) {
    actionError.value = e?.response?.data?.message || "Error al cancelar";
  } finally { actioning.value = false; }
}
</script>

<style scoped>
/* ══════════════════════════════════════════════════
   RAÍZ
══════════════════════════════════════════════════ */
.tdet {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ══════════════════════════════════════════════════
   BREADCRUMB
══════════════════════════════════════════════════ */
.tdet__breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.tdet__breadcrumb-current {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: .01em;
}

/* ══════════════════════════════════════════════════
   BOTÓN VOLVER
══════════════════════════════════════════════════ */
.tdet__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), .55);
  transition: color .12s, background .12s;
}
.tdet__back:hover {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), .07);
}
.tdet__back[disabled] { opacity: .4; cursor: not-allowed; }

/* ══════════════════════════════════════════════════
   LOADING
══════════════════════════════════════════════════ */
.tdet__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: rgba(var(--v-theme-on-surface), .45);
  font-size: 13px;
}

/* ══════════════════════════════════════════════════
   VISTA CONTENEDOR
══════════════════════════════════════════════════ */
.tdet__view {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 820px;
}

/* ══════════════════════════════════════════════════
   BAR DE ACCIONES (DESPACHAR / RECEPCIONAR / CANCELAR)
══════════════════════════════════════════════════ */
.tdet__actions-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ══════════════════════════════════════════════════
   CARD HEAD (igual a .stk-head del sistema)
══════════════════════════════════════════════════ */
.tdet__route-card,
.tdet__meta-card,
.tdet__items-card,
.tdet__action-card {
  border: 1px solid rgba(var(--v-theme-on-surface), .09) !important;
}

.tdet__meta-head {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: rgba(var(--v-theme-on-surface), .5);
}

/* ══════════════════════════════════════════════════
   RUTA
══════════════════════════════════════════════════ */
.tdet__route {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 12px;
}
.tdet__route-node {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}
.tdet__route-node--right { justify-content: flex-end; }
.tdet__route-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .07em;
  color: rgba(var(--v-theme-on-surface), .45);
  margin: 0 0 3px;
}
.tdet__route-name {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
}
.tdet__route-name--to { color: rgb(var(--v-theme-success)); }
.tdet__route-middle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 60px;
}
.tdet__route-line {
  flex: 1;
  height: 2px;
  border-radius: 2px;
  background: rgba(var(--v-theme-on-surface), .15);
  transition: background .3s;
}
.tdet__route-line--dispatched { background: rgb(var(--v-theme-warning)); }
.tdet__route-line--received,
.tdet__route-line--partial    { background: rgb(var(--v-theme-success)); }

/* ══════════════════════════════════════════════════
   TRAZABILIDAD
══════════════════════════════════════════════════ */
.tdet__timeline {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.tdet__tl-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), .7);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
}
.tdet__tl-item:last-child { border-bottom: none; }

.tdet__note {
  display: flex;
  align-items: flex-start;
  padding: 10px 16px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), .7);
}

/* ══════════════════════════════════════════════════
   FILAS DE PRODUCTOS (feed rows — igual a .stk-alert-row)
══════════════════════════════════════════════════ */
.tdet__item-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .07);
  transition: background .12s;
}
.tdet__item-row:last-child { border-bottom: none; }
.tdet__item-row:hover { background: rgba(var(--v-theme-on-surface), .04); }

.tdet__item-info { flex: 1; min-width: 0; }
.tdet__item-name {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tdet__item-sku {
  font-size: 11px;
  color: rgba(var(--v-theme-on-surface), .45);
  margin: 0;
}
.tdet__item-qtys {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.tdet__qty { display: flex; flex-direction: column; align-items: center; min-width: 52px; }
.tdet__qty-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: rgba(var(--v-theme-on-surface), .4);
}
.tdet__qty-val {
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
}
.tdet__qty--diff .tdet__qty-val { color: rgb(var(--v-theme-warning)); }

.tdet__empty-items {
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), .4);
  text-align: center;
  padding: 20px 16px;
}

/* ══════════════════════════════════════════════════
   CABECERA DE VISTAS DE ACCIÓN
══════════════════════════════════════════════════ */
.tdet__action-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.tdet__back--sub { font-size: 12px; }
.tdet__action-title {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: -.01em;
}

/* ══════════════════════════════════════════════════
   FILAS DE ACCIÓN (despacho / cancelar)
══════════════════════════════════════════════════ */
.tdet__action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .06);
  font-size: 13px;
}
.tdet__action-row:last-child { border-bottom: none; }
.tdet__action-row-name { font-weight: 500; }
.tdet__action-row-qty {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 800;
  font-size: 15px;
}
.tdet__action-row-qty--out { color: rgb(var(--v-theme-error)); }

/* ══════════════════════════════════════════════════
   RECEPCIÓN — filas editables
══════════════════════════════════════════════════ */
.tdet__recv-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), .07);
  transition: background .15s;
}
.tdet__recv-item:last-child { border-bottom: none; }
.tdet__recv-item--diff { background: rgba(var(--v-theme-warning), .04); }

.tdet__recv-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.tdet__recv-name { font-size: 13px; font-weight: 600; }

.tdet__recv-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}
.tdet__recv-sent {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}
.tdet__recv-sent-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .06em;
  color: rgba(var(--v-theme-on-surface), .4);
}
.tdet__recv-sent-val {
  font-size: 18px;
  font-weight: 800;
  color: rgba(var(--v-theme-on-surface), .35);
}
.tdet__recv-stepper {
  display: flex;
  align-items: center;
  gap: 6px;
}
.tdet__recv-input {
  width: 52px;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  border: 2px solid rgba(var(--v-theme-on-surface), .2);
  border-radius: 8px;
  padding: 4px 2px;
  background: transparent;
  color: inherit;
  transition: border-color .15s;
  outline: none;
}
.tdet__recv-input:focus { border-color: rgb(var(--v-theme-primary)); }
.tdet__recv-input--diff {
  border-color: rgb(var(--v-theme-warning));
  color: rgb(var(--v-theme-warning));
}
.tdet__recv-note { flex: 1; }

/* ══════════════════════════════════════════════════
   BOTONES DE CONFIRMACIÓN
══════════════════════════════════════════════════ */
.tdet__action-btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 4px;
}
</style>
