<template>
  <div class="tdet">

    <!-- ══════════ TOPBAR: navegación limpia ═══ -->
    <div class="tdet__topbar">
      <AppBackButton
        :label="view !== 'detail' ? 'detalle' : 'Derivaciones'"
        emit-only
        :disabled="actioning"
        @back="view !== 'detail' ? view = 'detail' : $emit('close')"
      />

      <v-spacer />

      <!-- Menú secundario (acciones no críticas) -->
      <v-menu v-if="view === 'detail' && !loadingData && canCancel" :close-on-content-click="true">
        <template #activator="{ props: menuProps }">
          <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="small" />
        </template>
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-cancel"
            @click="openView('cancel')"
            class="text-error"
          >
            <v-list-item-title>Cancelar derivación</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <!-- ══════════ HEADER: número + estado + ruta inline ═══ -->
    <div v-if="!loadingData" class="tdet__header">
      <div class="tdet__header-top">
        <h1 class="tdet__number">{{ tr.number }}</h1>
        <span class="tdet__status-chip" :class="`tdet__status-chip--${tr.status}`">
          <v-icon size="12">{{ statusIcon(tr.status) }}</v-icon>
          {{ statusLabel(tr.status) }}
        </span>
      </div>
      <div class="tdet__header-meta">
        <span class="tdet__hroute">
          <v-icon size="13">mdi-store-outline</v-icon>
          <span class="tdet__hbranch">{{ tr.fromWarehouse?.branch?.name || '—' }}</span>
          <v-icon size="13" class="tdet__hroute-arrow">mdi-arrow-right</v-icon>
          <v-icon size="13" color="success">mdi-store</v-icon>
          <span class="tdet__hbranch tdet__hbranch--to">
            {{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || '—' }}
          </span>
        </span>
        <span class="tdet__hsep">·</span>
        <span class="tdet__hitems">
          <v-icon size="13">mdi-package-variant-closed</v-icon>
          {{ tr.items?.length || 0 }} {{ (tr.items?.length || 0) === 1 ? 'producto' : 'productos' }}
        </span>
        <span class="tdet__hsep">·</span>
        <span class="tdet__hdate">
          {{ fmtShortDate(tr.created_at) }}
        </span>
      </div>
      <div v-if="view !== 'detail'" class="tdet__header-viewlabel">
        <v-icon size="14">mdi-chevron-right</v-icon>
        <span>
          {{ view === 'dispatch' ? 'Preparar despacho'
          : view === 'receive'  ? 'Confirmar recepción'
          : 'Cancelar derivación' }}
        </span>
      </div>
    </div>

    <!-- ══════════ ACTION CARD: CTA principal destacado ═══ -->
    <div
      v-if="view === 'detail' && !loadingData && (canDispatch || canReceive)"
      class="tdet__cta"
      :class="canReceive ? 'tdet__cta--receive' : 'tdet__cta--dispatch'"
    >
      <div class="tdet__cta-icon">
        <v-icon size="24" color="white">
          {{ canReceive ? 'mdi-package-down' : 'mdi-truck-fast' }}
        </v-icon>
      </div>
      <div class="tdet__cta-body">
        <h2 class="tdet__cta-title">
          {{ canReceive ? 'Esperando recepción' : 'Listo para despachar' }}
        </h2>
        <p class="tdet__cta-desc">
          <template v-if="canReceive">
            Esta derivación está en tránsito hacia
            <strong>{{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || 'destino' }}</strong>.
            Al confirmar, el stock ingresa al depósito destino.
          </template>
          <template v-else>
            Al despachar, el stock de
            <strong>{{ tr.fromWarehouse?.branch?.name || 'origen' }}</strong>
            se descuenta con las cantidades indicadas.
          </template>
        </p>
      </div>
      <v-btn
        :color="canReceive ? 'success' : 'warning'"
        variant="flat"
        size="large"
        rounded="lg"
        class="tdet__cta-btn"
        :prepend-icon="canReceive ? 'mdi-check-circle' : 'mdi-truck-fast'"
        @click="openView(canReceive ? 'receive' : 'dispatch')"
      >
        {{ canReceive ? 'Recepcionar ahora' : 'Despachar ahora' }}
      </v-btn>
    </div>

    <!-- Loading -->
    <div v-if="loadingData" class="tdet__loading">
      <v-progress-circular indeterminate color="primary" size="36" />
      <span class="mt-3">Cargando derivación…</span>
    </div>

    <template v-else>

      <!-- ══════════ VISTA: DETALLE ════════════════════════════ -->
      <div v-if="view === 'detail'" class="tdet__view">

        <!-- STEPPER visual: Borrador → Despachado → Recibido -->
        <div class="tdet__stepper" :class="`tdet__stepper--${tr.status}`">
          <div
            class="tdet__step"
            :class="stepClass('created')"
          >
            <div class="tdet__step-dot">
              <v-icon size="16" color="white">mdi-file-document-edit-outline</v-icon>
            </div>
            <div class="tdet__step-body">
              <div class="tdet__step-label">Creada</div>
              <div class="tdet__step-meta" v-if="tr.created_at">
                {{ userName(tr.creator) }} · {{ fmtShortDate(tr.created_at) }}
              </div>
              <div class="tdet__step-meta tdet__step-meta--dim" v-else>—</div>
            </div>
          </div>

          <div class="tdet__step-line" :class="lineClass('dispatched')" />

          <div
            class="tdet__step"
            :class="stepClass('dispatched')"
          >
            <div class="tdet__step-dot">
              <v-icon size="16" color="white">mdi-truck-fast-outline</v-icon>
            </div>
            <div class="tdet__step-body">
              <div class="tdet__step-label">Despachada</div>
              <div class="tdet__step-meta" v-if="tr.dispatched_at">
                {{ userName(tr.dispatcher) }} · {{ fmtShortDate(tr.dispatched_at) }}
              </div>
              <div class="tdet__step-meta tdet__step-meta--dim" v-else>Pendiente</div>
            </div>
          </div>

          <div class="tdet__step-line" :class="lineClass('received')" />

          <div
            class="tdet__step"
            :class="stepClass('received')"
          >
            <div class="tdet__step-dot">
              <v-icon size="16" color="white">mdi-check-bold</v-icon>
            </div>
            <div class="tdet__step-body">
              <div class="tdet__step-label">
                {{ tr.status === 'partial' ? 'Recibida con diferencia' : 'Recibida' }}
              </div>
              <div class="tdet__step-meta" v-if="tr.received_at">
                {{ userName(tr.receiver) }} · {{ fmtShortDate(tr.received_at) }}
              </div>
              <div class="tdet__step-meta tdet__step-meta--dim" v-else>Pendiente</div>
            </div>
          </div>
        </div>

        <!-- Banner cancelado/rechazado si aplica -->
        <v-alert
          v-if="tr.status === 'cancelled' || tr.status === 'rejected'"
          :type="tr.status === 'cancelled' ? 'error' : 'warning'"
          variant="tonal"
          rounded="xl"
          density="compact"
        >
          <template #title>
            {{ tr.status === 'cancelled' ? 'Derivación cancelada' : 'Derivación rechazada' }}
          </template>
          El stock no fue modificado. Esta derivación queda en el historial.
        </v-alert>

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

        <!-- Nota (solo si existe) -->
        <div v-if="tr.note" class="tdet__note-inline">
          <v-icon size="14" color="medium-emphasis">mdi-note-text-outline</v-icon>
          <span>{{ tr.note }}</span>
        </div>
      </div>

      <!-- ══════════ VISTA: DESPACHAR ══════════════════════════ -->
      <div v-else-if="view === 'dispatch'" class="tdet__view">
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
import AppBackButton from "@/app/components/AppBackButton.vue";

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
function stepClass(step) {
  const s = String(tr.value.status || "").toLowerCase();
  // Mapa de qué steps están "completos" por estado.
  const completed = {
    draft: ["created"],
    dispatched: ["created", "dispatched"],
    received: ["created", "dispatched", "received"],
    partial: ["created", "dispatched", "received"],
    cancelled: [],
    rejected: [],
  };
  const current = {
    draft: "dispatched",
    dispatched: "received",
  };
  const done = (completed[s] || []).includes(step);
  const isCurrent = current[s] === step;
  return {
    "is-done": done,
    "is-current": isCurrent && !done,
    "is-partial": step === "received" && s === "partial",
    "is-muted": !done && !isCurrent,
    "is-dead": ["cancelled", "rejected"].includes(s),
  };
}
function lineClass(toStep) {
  const s = String(tr.value.status || "").toLowerCase();
  const completed = {
    draft: [],
    dispatched: ["dispatched"],
    received: ["dispatched", "received"],
    partial: ["dispatched", "received"],
    cancelled: [],
    rejected: [],
  };
  const done = (completed[s] || []).includes(toStep);
  return {
    "is-done": done,
    "is-dead": ["cancelled", "rejected"].includes(s),
    "is-partial": toStep === "received" && s === "partial",
  };
}
function fmtShortDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" })} · ${date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`;
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
   TOPBAR — navegación limpia (botón volver visible)
══════════════════════════════════════════════════ */
.tdet__topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 820px;
  padding-bottom: 4px;
}

/* ══════════════════════════════════════════════════
   HEADER — número grande + estado
══════════════════════════════════════════════════ */
.tdet__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 820px;
}
.tdet__header-top {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.tdet__number {
  font-size: 24px;
  font-weight: 900;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: -0.01em;
  margin: 0;
  line-height: 1.1;
  color: rgb(var(--v-theme-on-surface));
}
.tdet__status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.tdet__status-chip--draft {
  background: rgba(var(--v-theme-on-surface), 0.1);
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.tdet__status-chip--dispatched {
  background: rgba(245, 158, 11, 0.16);
  color: #d97706;
}
:global(.v-theme--dark) .tdet__status-chip--dispatched { color: #fbbf24; }
.tdet__status-chip--received,
.tdet__status-chip--partial {
  background: rgba(var(--v-theme-success), 0.15);
  color: rgb(var(--v-theme-success));
}
.tdet__status-chip--cancelled,
.tdet__status-chip--rejected {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

.tdet__header-viewlabel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.tdet__header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
  font-size: 13px;
  color: rgba(var(--v-theme-on-surface), 0.7);
  font-weight: 500;
}
.tdet__hroute {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}
.tdet__hbranch {
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}
.tdet__hbranch--to { color: rgb(var(--v-theme-success)); }
.tdet__hroute-arrow { opacity: 0.4; }
.tdet__hsep { opacity: 0.3; }
.tdet__hitems,
.tdet__hdate {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tdet__note-inline {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px dashed rgba(var(--v-border-color), var(--v-border-opacity));
  font-size: 13px;
  font-style: italic;
  opacity: 0.85;
  max-width: 820px;
}

/* ══════════════════════════════════════════════════
   ACTION CARD — CTA principal destacado
══════════════════════════════════════════════════ */
.tdet__cta {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  max-width: 820px;
  border: 1.5px solid;
  position: relative;
  overflow: hidden;
}
.tdet__cta::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
}
.tdet__cta--receive {
  background: linear-gradient(100deg,
    rgba(var(--v-theme-success), 0.08) 0%,
    rgba(var(--v-theme-success), 0.02) 100%);
  border-color: rgba(var(--v-theme-success), 0.35);
}
.tdet__cta--receive::before { background: rgb(var(--v-theme-success)); }
.tdet__cta--dispatch {
  background: linear-gradient(100deg,
    rgba(245, 158, 11, 0.08) 0%,
    rgba(245, 158, 11, 0.02) 100%);
  border-color: rgba(245, 158, 11, 0.4);
}
.tdet__cta--dispatch::before { background: #f59e0b; }

.tdet__cta-icon {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 4px 14px -4px rgba(0, 0, 0, 0.3);
}
.tdet__cta--receive .tdet__cta-icon {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}
.tdet__cta--dispatch .tdet__cta-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.tdet__cta-body {
  flex: 1;
  min-width: 0;
}
.tdet__cta-title {
  font-size: 15px;
  font-weight: 900;
  margin: 0 0 2px;
  letter-spacing: -0.01em;
  line-height: 1.2;
}
.tdet__cta-desc {
  font-size: 13px;
  margin: 0;
  line-height: 1.5;
  opacity: 0.8;
}
.tdet__cta-btn {
  flex-shrink: 0;
  font-weight: 800 !important;
  min-width: 180px;
}

@media (max-width: 720px) {
  .tdet__cta {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .tdet__cta-body { text-align: center; }
  .tdet__cta-btn { width: 100%; }
}

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
   STEPPER DE FLUJO
══════════════════════════════════════════════════ */
.tdet__stepper {
  display: grid;
  grid-template-columns: 1fr 40px 1fr 40px 1fr;
  align-items: stretch;
  gap: 8px;
  padding: 18px 16px;
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.tdet__step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 4px 6px;
  border-radius: 12px;
  transition: background 0.15s;
}
.tdet__step.is-current {
  background: rgba(var(--v-theme-primary), 0.06);
}
.tdet__step-dot {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  background: rgba(var(--v-theme-on-surface), 0.15);
  color: #fff;
  transition: background 0.15s, box-shadow 0.15s;
}
.tdet__step.is-done .tdet__step-dot {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 3px 10px -2px rgba(34, 197, 94, 0.45);
}
.tdet__step.is-current .tdet__step-dot {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.18);
  animation: tdet-step-pulse 2s ease-in-out infinite;
}
.tdet__step.is-partial .tdet__step-dot {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.tdet__step.is-dead .tdet__step-dot {
  background: rgba(var(--v-theme-on-surface), 0.2);
}
@keyframes tdet-step-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50%      { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0.08); }
}

.tdet__step-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.tdet__step-label {
  font-size: 12.5px;
  font-weight: 800;
  line-height: 1.2;
  color: rgb(var(--v-theme-on-surface));
}
.tdet__step.is-muted .tdet__step-label { opacity: 0.5; }
.tdet__step-meta {
  font-size: 11px;
  opacity: 0.7;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tdet__step-meta--dim {
  opacity: 0.4;
  font-style: italic;
}

.tdet__step-line {
  align-self: center;
  height: 3px;
  border-radius: 999px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  position: relative;
  overflow: hidden;
}
.tdet__step-line.is-done {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}
.tdet__step-line.is-partial {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

@media (max-width: 720px) {
  .tdet__stepper {
    grid-template-columns: 1fr;
    gap: 0;
  }
  .tdet__step-line {
    width: 3px;
    height: 24px;
    justify-self: start;
    margin-left: 16px;
  }
  .tdet__step-line.is-done {
    background: linear-gradient(180deg, #22c55e, #16a34a);
  }
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
