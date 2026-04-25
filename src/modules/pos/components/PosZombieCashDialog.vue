<template>
  <v-dialog :model-value="open" max-width="520" persistent>
    <v-card rounded="xl" class="zcd">
      <div class="zcd-head">
        <div class="zcd-head__icon">
          <v-icon size="22" color="white">mdi-alert-decagram</v-icon>
        </div>
        <div>
          <h2 class="zcd-title">Ya tenés una caja abierta</h2>
          <span class="zcd-subtitle">Cerrala antes de abrir una nueva</span>
        </div>
      </div>

      <v-divider />

      <v-card-text class="zcd-body">
        <p class="zcd-intro">
          Encontramos una caja abierta asociada a tu usuario en otra sucursal o sesión.
          Podés cerrarla ahora con cierre neutro (sin diferencia) y abrir la nueva, o
          cancelar y cerrarla manualmente desde el panel admin.
        </p>

        <div class="zcd-card">
          <div class="zcd-card__row">
            <span class="zcd-k">Caja</span>
            <span class="zcd-v zcd-mono">#{{ data?.cash_register_id || "—" }}</span>
          </div>
          <div class="zcd-card__row">
            <span class="zcd-k">Sucursal</span>
            <span class="zcd-v">{{ data?.branch_name || `Sucursal #${data?.branch_id || "?"}` }}</span>
          </div>
          <div class="zcd-card__row">
            <span class="zcd-k">Abierta hace</span>
            <span class="zcd-v">{{ elapsedLabel }}</span>
          </div>
          <div v-if="data?.opening_cash != null" class="zcd-card__row">
            <span class="zcd-k">Fondo inicial</span>
            <span class="zcd-v">${{ fmtNum(data.opening_cash) }}</span>
          </div>
        </div>

        <v-alert type="warning" variant="tonal" density="compact" class="zcd-alert">
          <strong>Cierre neutro:</strong> se cerrará con declarado = esperado, sin diferencia.
          Si la caja tiene ventas pendientes de auditoría, cancelá y cerrala desde
          <b>Configuración → Cajas</b>.
        </v-alert>

        <div v-if="error" class="zcd-error">
          <v-icon size="14">mdi-alert-circle</v-icon>
          <span>{{ error }}</span>
        </div>
      </v-card-text>

      <v-card-actions class="zcd-footer">
        <v-btn variant="text" :disabled="loading" @click="onCancel">
          Cancelar
        </v-btn>
        <v-spacer />
        <v-btn
          color="warning"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-lock-reset"
          :loading="loading"
          @click="onConfirm"
        >
          Cerrar caja #{{ data?.cash_register_id }} y abrir nueva
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  data: { type: Object, default: () => null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["confirm", "cancel"]);

const now = ref(Date.now());
let timer = null;

onMounted(() => {
  timer = setInterval(() => { now.value = Date.now(); }, 30 * 1000);
});
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});

const elapsedLabel = computed(() => {
  const t = props.data?.opened_at ? new Date(props.data.opened_at).getTime() : 0;
  if (!t) return "—";
  const ms = Math.max(0, now.value - t);
  const min = Math.floor(ms / 60000);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m < 1) return "recién";
  return `${m} min`;
});

function fmtNum(v) {
  return new Intl.NumberFormat("es-AR").format(Number(v || 0));
}

function onConfirm() { emit("confirm"); }
function onCancel() { emit("cancel"); }
</script>

<style scoped>
.zcd { overflow: hidden; }

.zcd-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}
.zcd-head__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px -4px rgba(245, 158, 11, 0.5);
}
.zcd-title {
  font-size: 17px;
  font-weight: 900;
  line-height: 1.15;
  margin: 0;
  letter-spacing: -0.01em;
}
.zcd-subtitle {
  font-size: 12px;
  opacity: 0.7;
  font-weight: 500;
}

.zcd-body {
  padding: 18px 20px 8px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.zcd-intro {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  opacity: 0.85;
}

.zcd-card {
  border-radius: 12px;
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
.zcd-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(var(--v-border-color), calc(var(--v-border-opacity) * 0.5));
}
.zcd-card__row:last-child { border-bottom: none; }
.zcd-k {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}
.zcd-v {
  font-size: 13.5px;
  font-weight: 800;
}
.zcd-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.zcd-alert {
  font-size: 12px;
  line-height: 1.5;
}

.zcd-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  font-size: 12.5px;
  font-weight: 700;
}

.zcd-footer {
  padding: 12px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
