<template>
  <v-card rounded="xl">
    <v-card-title class="td-title">
      <div class="td-title__left">
        <span class="td-number">{{ tr.number }}</span>
        <span class="td-status" :class="`td-st--${tr.status}`">{{ statusLabel(tr.status) }}</span>
      </div>
      <v-btn icon size="small" variant="text" @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-card-title>
    <v-divider />

    <v-card-text class="td-body">
      <!-- Cargando datos completos -->
      <div v-if="loadingData" class="d-flex justify-center py-4">
        <v-progress-circular indeterminate color="primary" size="28" />
      </div>

      <!-- Ruta -->
      <div class="td-route">
        <div class="td-route__node">
          <v-icon size="16" color="primary">mdi-store-outline</v-icon>
          <div>
            <p class="td-route__label">Origen</p>
            <p class="td-route__name">{{ tr.fromWarehouse?.branch?.name || "—" }}</p>
          </div>
        </div>
        <div class="td-route__arrow"><v-icon>mdi-arrow-right</v-icon></div>
        <div class="td-route__node">
          <v-icon size="16" color="success">mdi-store</v-icon>
          <div>
            <p class="td-route__label">Destino</p>
            <p class="td-route__name">{{ tr.toBranch?.name || tr.toWarehouse?.branch?.name || "—" }}</p>
          </div>
        </div>
      </div>

      <!-- Trazabilidad -->
      <div class="td-timeline">
        <div class="td-tl-item">
          <v-icon size="14" color="primary">mdi-pencil-outline</v-icon>
          <span>Creado por {{ userName(tr.creator) }} — {{ fmtDate(tr.created_at) }}</span>
        </div>
        <div v-if="tr.dispatched_at" class="td-tl-item">
          <v-icon size="14" color="blue">mdi-truck-fast-outline</v-icon>
          <span>Despachado por {{ userName(tr.dispatcher) }} — {{ fmtDate(tr.dispatched_at) }}</span>
        </div>
        <div v-if="tr.received_at" class="td-tl-item">
          <v-icon size="14" color="success">mdi-check-circle-outline</v-icon>
          <span>Recepcionado por {{ userName(tr.receiver) }} — {{ fmtDate(tr.received_at) }}</span>
        </div>
      </div>

      <p v-if="tr.note" class="td-note">📝 {{ tr.note }}</p>

      <!-- Items -->
      <div class="td-items-title">Productos ({{ tr.items?.length || 0 }})</div>
      <div class="td-items">
        <div v-for="item in tr.items" :key="item.id" class="td-item">
          <v-avatar size="36" rounded="md">
            <v-img v-if="item.product?.images?.[0]?.url" :src="item.product.images[0].url" />
            <v-icon v-else size="18" color="secondary">mdi-package-variant</v-icon>
          </v-avatar>
          <div class="td-item__info">
            <span class="td-item__name">{{ item.product?.name || `Producto #${item.product_id}` }}</span>
            <span class="td-item__sku">{{ item.product?.sku || "" }}</span>
          </div>
          <div class="td-item__qtys">
            <div class="td-qty">
              <span class="td-qty__label">Enviado</span>
              <span class="td-qty__val">{{ fmt(item.qty_sent) }}</span>
            </div>
            <template v-if="item.qty_received !== null && item.qty_received !== undefined">
              <v-icon size="14" class="mx-1">mdi-arrow-right</v-icon>
              <div class="td-qty" :class="{ 'td-qty--diff': +item.qty_received !== +item.qty_sent }">
                <span class="td-qty__label">Recibido</span>
                <span class="td-qty__val">{{ fmt(item.qty_received) }}</span>
              </div>
            </template>
          </div>
          <div v-if="item.note" class="td-item__note">{{ item.note }}</div>
        </div>
      </div>

      <!-- Formulario de recepción -->
      <div v-if="canReceive && showReceiveForm" class="td-receive">
        <p class="td-receive__title">Confirmar recepción</p>
        <div v-for="item in receiveForm" :key="item.item_id" class="td-receive-row">
          <span class="td-receive-row__name">{{ item.name }}</span>
          <span class="td-receive-row__sent">Enviado: {{ item.qty_sent }}</span>
          <div class="td-receive-row__qty">
            <v-btn icon size="x-small" variant="text" @click="item.qty_received = Math.max(0, item.qty_received-1)">
              <v-icon>mdi-minus</v-icon>
            </v-btn>
            <input type="number" class="td-qty-input" v-model.number="item.qty_received" min="0" />
            <v-btn icon size="x-small" variant="text" @click="item.qty_received++">
              <v-icon>mdi-plus</v-icon>
            </v-btn>
          </div>
          <v-text-field
            v-model="item.note" placeholder="Diferencia / nota"
            variant="outlined" density="compact" rounded="lg" hide-details
            class="td-receive-row__note"
          />
        </div>
        <div class="td-receive__actions">
          <v-btn variant="text" size="small" @click="showReceiveForm = false">Cancelar</v-btn>
          <v-btn color="success" variant="flat" rounded="lg" size="small" :loading="actioning" @click="doReceive">
            Confirmar recepción
          </v-btn>
        </div>
      </div>

      <v-alert v-if="actionError" type="error" variant="tonal" rounded="lg" density="compact" class="mt-3">
        {{ actionError }}
      </v-alert>
    </v-card-text>

    <v-divider />
    <v-card-actions class="td-actions">
      <!-- Central: despachar / cancelar -->
      <v-btn
        v-if="canDispatch" color="primary" variant="flat" rounded="lg" size="small"
        prepend-icon="mdi-truck-fast-outline" :loading="actioning" @click="doDispatch"
      >Despachar</v-btn>

      <v-btn
        v-if="canCancel" color="error" variant="text" rounded="lg" size="small"
        :loading="actioning" @click="doCancel"
      >Cancelar derivación</v-btn>

      <!-- Sucursal: recepcionar -->
      <v-btn
        v-if="canReceive && !showReceiveForm" color="success" variant="flat" rounded="lg" size="small"
        prepend-icon="mdi-check-circle-outline"
        @click="hasItems ? initReceiveForm() : doReceiveDirect()"
      >Recepcionar</v-btn>

      <v-spacer />
      <v-btn variant="text" size="small" @click="$emit('close')">Cerrar</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { getTransfer, dispatchTransfer, receiveTransfer, cancelTransfer } from "../service/stockTransfer.api";

const props = defineProps({
  transfer:        { type: Object, required: true },
  isAdmin:         { type: Boolean, default: false },
  isCentral:       { type: Boolean, default: false },
  currentBranchId: { type: Number, default: null },
});
const emit = defineEmits(["dispatch","receive","cancel","close"]);

// Datos completos cargados desde API (el prop del listado no incluye items)
const fullData     = ref(props.transfer);
const loadingData  = ref(false);
const actioning    = ref(false);
const actionError  = ref("");
const showReceiveForm = ref(false);
const receiveForm  = ref([]);

// Cargar datos completos al abrir — así siempre tenemos los items reales de DB
onMounted(async () => {
  loadingData.value = true;
  try {
    const { data } = await getTransfer(props.transfer.id);
    if (data?.transfer) fullData.value = data.transfer;
    else if (data?.id)  fullData.value = data;
  } catch (e) { /* usa el prop inicial como fallback */ }
  finally { loadingData.value = false; }
});

// ── computed helpers ──
const tr       = computed(() => fullData.value);
const hasItems = computed(() => (tr.value.items?.length ?? 0) > 0);

// ── computed permissions ──
const isDestination = computed(() =>
  props.currentBranchId && tr.value.to_branch_id === props.currentBranchId
);
const isOrigin = computed(() =>
  props.currentBranchId &&
  tr.value.fromWarehouse?.branch_id === props.currentBranchId
);
const canDispatch = computed(() =>
  tr.value.status === "draft" && (props.isAdmin || isOrigin.value)
);
const canCancel = computed(() =>
  tr.value.status === "draft" && (props.isAdmin || isOrigin.value)
);
const canReceive = computed(() =>
  tr.value.status === "dispatched" && (props.isAdmin || isDestination.value)
);

// ── helpers ──
function statusLabel(s) {
  return { draft:"Por despachar", dispatched:"En camino", received:"Entregada",
           partial:"Con diferencia", rejected:"Rechazada", cancelled:"Cancelada" }[s] || s;
}
function userName(u) {
  if (!u) return "—";
  return [u.first_name, u.last_name].filter(Boolean).join(" ") || `#${u.id}`;
}
function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("es-AR", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}
function fmt(v) {
  const n = parseFloat(v);
  return Number.isFinite(n) ? (n % 1 === 0 ? n : n.toFixed(2)) : "—";
}

// ── actions ──
async function doDispatch() {
  actioning.value = true; actionError.value = "";
  try {
    await dispatchTransfer(tr.value.id);
    emit("dispatch", tr.value.id);
  } catch (e) { actionError.value = e?.response?.data?.message || "Error al despachar"; }
  finally { actioning.value = false; }
}

function initReceiveForm() {
  receiveForm.value = (tr.value.items || []).map((i) => ({
    item_id:      i.id,
    name:         i.product?.name || `Producto #${i.product_id}`,
    qty_sent:     parseFloat(i.qty_sent),
    qty_received: parseFloat(i.qty_sent),
    note:         "",
  }));
  showReceiveForm.value = true;
}

async function doReceive() {
  actioning.value = true; actionError.value = "";
  try {
    await receiveTransfer(tr.value.id, { receptions: receiveForm.value });
    emit("receive", tr.value.id);
    showReceiveForm.value = false;
  } catch (e) { actionError.value = e?.response?.data?.message || "Error al recepcionar"; }
  finally { actioning.value = false; }
}

// Recepción directa para transfers sin productos
async function doReceiveDirect() {
  if (!confirm("¿Confirmar recepción del paquete? (sin productos)")) return;
  actioning.value = true; actionError.value = "";
  try {
    await receiveTransfer(tr.value.id, { receptions: [] });
    emit("receive", tr.value.id);
  } catch (e) { actionError.value = e?.response?.data?.message || "Error al recepcionar"; }
  finally { actioning.value = false; }
}

async function doCancel() {
  if (!confirm("¿Cancelar esta derivación?")) return;
  actioning.value = true; actionError.value = "";
  try {
    await cancelTransfer(tr.value.id);
    emit("cancel", tr.value.id);
  } catch (e) { actionError.value = e?.response?.data?.message || "Error al cancelar"; }
  finally { actioning.value = false; }
}
</script>

<style scoped>
.td-title { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; }
.td-title__left { display:flex; align-items:center; gap:10px; }
.td-number { font-size:15px; font-weight:700; }
.td-status { font-size:11px; font-weight:600; padding:3px 10px; border-radius:20px; }
.td-st--draft      { background:rgba(var(--v-theme-on-surface),.08); }
.td-st--dispatched { background:#e3f2fd; color:#1565c0; }
.td-st--received   { background:#e8f5e9; color:#2e7d32; }
.td-st--partial    { background:#fff8e1; color:#f57f17; }
.td-st--rejected   { background:#ffebee; color:#c62828; }
.td-st--cancelled  { background:rgba(var(--v-theme-on-surface),.06); color:rgba(var(--v-theme-on-surface),.4); }

.td-body { padding:16px 20px; display:flex; flex-direction:column; gap:14px; }

.td-route { display:flex; align-items:center; gap:12px;
  background:rgba(var(--v-theme-surface-variant),.5); border-radius:10px; padding:12px 16px; }
.td-route__node { display:flex; align-items:center; gap:8px; flex:1; }
.td-route__label { font-size:10px; color:rgba(var(--v-theme-on-surface),.45); margin-bottom:1px; }
.td-route__name  { font-size:13px; font-weight:600; }
.td-route__arrow { color:rgba(var(--v-theme-on-surface),.3); }

.td-timeline { display:flex; flex-direction:column; gap:4px; }
.td-tl-item  { display:flex; align-items:center; gap:6px; font-size:12px; color:rgba(var(--v-theme-on-surface),.6); }

.td-note { font-size:12px; color:rgba(var(--v-theme-on-surface),.55); padding:8px 12px;
  background:rgba(var(--v-theme-surface-variant),.4); border-radius:8px; }

.td-items-title { font-size:12px; font-weight:600; color:rgba(var(--v-theme-on-surface),.55); }
.td-items { display:flex; flex-direction:column; gap:6px; }
.td-item  { display:flex; align-items:center; gap:10px; padding:10px 12px;
  border:1px solid rgba(var(--v-theme-on-surface),.08); border-radius:10px;
  background:rgba(var(--v-theme-surface-variant),.3); flex-wrap:wrap; }
.td-item__info { flex:1; display:flex; flex-direction:column; }
.td-item__name { font-size:13px; font-weight:500; }
.td-item__sku  { font-size:11px; color:rgba(var(--v-theme-on-surface),.4); }
.td-item__note { width:100%; font-size:11px; color:#f57f17; padding:2px 0 0 46px; }
.td-item__qtys { display:flex; align-items:center; gap:4px; }
.td-qty { display:flex; flex-direction:column; align-items:center; }
.td-qty__label { font-size:9px; color:rgba(var(--v-theme-on-surface),.4); }
.td-qty__val   { font-size:13px; font-weight:700; }
.td-qty--diff .td-qty__val { color:#f57f17; }

.td-receive { border:1px solid rgba(var(--v-theme-primary),.25); border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:10px; }
.td-receive__title { font-size:12px; font-weight:700; color:rgb(var(--v-theme-primary)); }
.td-receive-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.td-receive-row__name { flex:1; font-size:12px; font-weight:500; min-width:120px; }
.td-receive-row__sent { font-size:11px; color:rgba(var(--v-theme-on-surface),.45); white-space:nowrap; }
.td-receive-row__qty  { display:flex; align-items:center; gap:4px; }
.td-qty-input {
  width:44px; text-align:center; font-size:13px; font-weight:600;
  border:1px solid rgba(var(--v-theme-on-surface),.2); border-radius:6px; padding:2px 4px;
  background:transparent; color:inherit;
}
.td-receive-row__note { flex:1; min-width:120px; }
.td-receive__actions  { display:flex; justify-content:flex-end; gap:8px; }

.td-actions { padding:10px 16px; }
</style>
