<template>
  <v-dialog :model-value="open" max-width="540" persistent>
    <v-card rounded="xl" class="zcd">
      <div class="zcd-head" :class="{ 'zcd-head--blocked': !isOwn }">
        <div class="zcd-head__icon">
          <v-icon size="22" color="white">{{ isOwn ? 'mdi-alert-decagram' : 'mdi-account-lock-outline' }}</v-icon>
        </div>
        <div>
          <h2 class="zcd-title">{{ headerTitle }}</h2>
          <span class="zcd-subtitle">{{ headerSubtitle }}</span>
        </div>
      </div>

      <v-divider />

      <v-card-text class="zcd-body">
        <p class="zcd-intro">{{ introMessage }}</p>

        <div class="zcd-card">
          <div class="zcd-card__row">
            <span class="zcd-k">Caja</span>
            <span class="zcd-v zcd-mono">#{{ data?.cash_register_id || "—" }}</span>
          </div>
          <div class="zcd-card__row">
            <span class="zcd-k">Sucursal</span>
            <span class="zcd-v">{{ branchLabel }}</span>
          </div>
          <div v-if="!isOwn && (data?.opened_by_name || data?.opened_by_email)" class="zcd-card__row">
            <span class="zcd-k">Cajero</span>
            <span class="zcd-v">{{ data.opened_by_name || data.opened_by_email }}</span>
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

        <!-- ── Caso A: caja propia → ofrecer cierre neutro ──────────── -->
        <v-alert
          v-if="isOwn"
          type="warning"
          variant="tonal"
          density="compact"
          class="zcd-alert"
        >
          <strong>Cierre neutro:</strong> se cerrará con declarado = esperado, sin diferencia.
          Si la caja tiene ventas pendientes de auditoría, cancelá y cerrala desde
          <b>Configuración → Cajas</b>.
        </v-alert>

        <!-- ── Caso B: caja ajena + sos admin → podés cerrarla con permiso ── -->
        <v-alert
          v-else-if="canCloseAsAdmin"
          type="info"
          variant="tonal"
          density="compact"
          class="zcd-alert"
        >
          <strong>Como administrador</strong> podés cerrar la caja de
          <b>{{ ownerLabel }}</b> con cierre neutro y abrir la tuya. Tené en cuenta que
          la caja vieja queda registrada con el cajero original
          <b>{{ ownerLabel }}</b> en el arqueo y reportes — solo se marca como cerrada.
        </v-alert>

        <!-- ── Caso C: caja ajena + NO sos admin → solo informar ────── -->
        <v-alert
          v-else
          type="error"
          variant="tonal"
          density="compact"
          class="zcd-alert"
        >
          <strong>Solo {{ ownerLabel }}</strong> o un administrador pueden cerrar esta caja.
          Esperá a que termine el turno, o pedile a un admin que la cierre desde
          <b>Configuración → Cajas</b>. Mientras tanto, no podés abrir otra caja en
          <b>{{ branchLabel }}</b>.
        </v-alert>

        <!-- Atajo para cambiar de sucursal si tenés más de una habilitada -->
        <v-alert
          v-if="!isOwn && availableBranches.length > 0"
          type="success"
          variant="tonal"
          density="compact"
          class="zcd-alert"
        >
          <div class="d-flex align-center" style="gap: 10px;">
            <v-icon size="18">mdi-store-marker-outline</v-icon>
            <span>
              <strong>Tip:</strong> podés abrir tu caja en otra sucursal habilitada:
              <span v-for="(b, i) in availableBranches" :key="b.id">
                <a class="zcd-branch-link" @click="onSwitchBranch(b.id)">{{ b.name }}</a><span
                  v-if="i < availableBranches.length - 1"
                >, </span>
              </span>.
            </span>
          </div>
        </v-alert>

        <div v-if="error" class="zcd-error">
          <v-icon size="14">mdi-alert-circle</v-icon>
          <span>{{ error }}</span>
        </div>
      </v-card-text>

      <v-card-actions class="zcd-footer">
        <v-btn variant="text" :disabled="loading" @click="onCancel">
          {{ isOwn ? 'Cancelar' : 'Entendido' }}
        </v-btn>
        <v-spacer />

        <!-- Cerrar PROPIA -->
        <v-btn
          v-if="isOwn"
          color="warning"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-lock-reset"
          :loading="loading"
          @click="onConfirm"
        >
          Cerrar caja #{{ data?.cash_register_id }} y abrir nueva
        </v-btn>

        <!-- Cerrar AJENA (admin/super_admin) -->
        <v-btn
          v-else-if="canCloseAsAdmin"
          color="error"
          variant="flat"
          rounded="lg"
          prepend-icon="mdi-shield-key-outline"
          :loading="loading"
          @click="onConfirm"
        >
          Cerrar caja de {{ ownerLabel }} y abrir la mía
        </v-btn>

        <!-- Ir al panel admin (solo cuando sos admin pero preferís ir manual) -->
        <v-btn
          v-else-if="isAdmin"
          variant="tonal"
          rounded="lg"
          prepend-icon="mdi-cog-outline"
          @click="goToAdminPanel"
        >
          Abrir panel de cajas
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  data: { type: Object, default: () => null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
});

const emit = defineEmits(["confirm", "cancel", "switch-branch"]);

const auth = useAuthStore();
const router = useRouter();

// Permisos del usuario actual.
const isAdmin = computed(() => auth.isBranchAdmin === true); // incluye super
const isSuperAdmin = computed(() => auth.isSuperAdmin === true);

// Sucursales DISPONIBLES para abrir caja (las que el user tiene habilitadas
// que NO son la que está bloqueada).
const availableBranches = computed(() => {
  const blockedId = Number(props.data?.branch_id || 0);
  const list = (auth.branches || []).filter((b) => Number(b.id) !== blockedId);
  // Limitamos a 4 para no romper visualmente.
  return list.slice(0, 4);
});

// Etiqueta del cajero actual (dueño de la caja zombie).
const ownerLabel = computed(() =>
  props.data?.opened_by_name ||
  props.data?.opened_by_email ||
  "el cajero actual"
);

// ¿Puede cerrar la caja AJENA con un cierre neutro?
//   - super_admin: siempre.
//   - admin: si la caja pertenece a una sucursal que tiene habilitada.
const canCloseAsAdmin = computed(() => {
  if (isSuperAdmin.value) return true;
  if (!isAdmin.value) return false;
  const blockedId = Number(props.data?.branch_id || 0);
  if (!blockedId) return false;
  return (auth.branches || []).some((b) => Number(b.id) === blockedId);
});

function onSwitchBranch(bid) {
  emit("switch-branch", bid);
}
function goToAdminPanel() {
  router.push({ name: "adminCashRegisters" }).catch(() => {});
  emit("cancel");
}

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

// is_own = true: la caja es del usuario actual → puede cerrarla.
// is_own = false: la caja es de OTRO operador en esta sucursal → no puede cerrarla.
const isOwn = computed(() => props.data?.is_own !== false);

const headerTitle = computed(() =>
  isOwn.value ? "Ya tenés una caja abierta" : "Caja abierta por otro operador"
);
const headerSubtitle = computed(() =>
  isOwn.value
    ? "Cerrala antes de abrir una nueva"
    : "No podés abrir una nueva acá hasta que cierre la actual"
);

const introMessage = computed(() => {
  if (isOwn.value) {
    return "Encontramos una caja abierta asociada a tu usuario en otra sucursal o sesión. Podés cerrarla ahora con cierre neutro (sin diferencia) y abrir la nueva, o cancelar y cerrarla manualmente desde el panel admin.";
  }
  const who =
    props.data?.opened_by_name ||
    props.data?.opened_by_email ||
    "otro operador";
  return `Esta sucursal ya tiene una caja abierta por ${who}. Solo puede haber una caja activa por sucursal. Esperá que la cierre, o pedile a un admin que la cierre desde Configuración → Cajas.`;
});

const branchLabel = computed(() => {
  if (props.data?.branch_name) return props.data.branch_name;
  if (props.data?.branch_id) return `Sucursal #${props.data.branch_id}`;
  return "—";
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
/* Modo "bloqueado": caja de otro operador, no podés cerrarla. */
.zcd-head--blocked .zcd-head__icon {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 12px -4px rgba(239, 68, 68, 0.5);
}
.zcd-title {
  font-size: 17px;
  font-weight: 500;
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
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}
.zcd-v {
  font-size: 13.5px;
  font-weight: 500;
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
  font-weight: 400;
}

.zcd-branch-link {
  cursor: pointer;
  font-weight: 400;
  color: rgb(var(--v-theme-primary));
  text-decoration: underline dotted;
  text-underline-offset: 3px;
}
.zcd-branch-link:hover {
  text-decoration: underline solid;
}

.zcd-footer {
  padding: 12px 16px;
  background: rgba(var(--v-theme-on-surface), 0.02);
}
</style>
