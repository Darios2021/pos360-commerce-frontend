<!-- src/modules/pos/components/PosZombieCashDialog.vue
     Caja que traba la apertura: la propia en otra sesión, o la de otro
     operador en esta sucursal. Vista completa (cerrar una caja ajena es
     sensible, no va en un cuadro chico) con el diseño del mostrador.

     Para cerrarla se hace arqueo: se ve lo esperado en efectivo y se carga lo
     contado; la diferencia queda registrada con su motivo. Antes era un
     "cierre neutro" con declarado = fondo inicial, que dejaba un faltante
     falso igual al efectivo vendido. -->
<template>
  <v-dialog :model-value="open" fullscreen persistent :scrim="false" transition="fade-transition">
    <div class="zv" @keydown.esc="onCancel">
      <header class="zv-top">
        <button type="button" class="zv-volver" :disabled="loading" @click="onCancel">
          <v-icon size="20">mdi-arrow-left</v-icon>
          Punto de venta
          <span class="zv-tecla">Esc</span>
        </button>
        <span class="zv-top__titulo">
          {{ isOwn ? "Caja propia abierta" : "Caja abierta por otro operador" }}
        </span>
      </header>

      <main class="zv-cuerpo">
        <section class="zv-card">
          <div class="zv-card__head">
            <span class="zv-icono" :class="isOwn ? 'is-propia' : 'is-ajena'">
              <v-icon size="22">{{ isOwn ? "mdi-cash-lock" : "mdi-account-lock-outline" }}</v-icon>
            </span>
            <div class="zv-card__tit">
              <span class="zv-h1">Caja #{{ data?.cash_register_id || "" }}</span>
              <span class="zv-sub">{{ branchLabel }}</span>
            </div>
          </div>

          <dl class="zv-datos">
            <div><dt>Cajero</dt><dd>{{ ownerLabel }}</dd></div>
            <div><dt>Abierta</dt><dd>{{ abiertaLabel }}</dd></div>
            <div><dt>Fondo inicial</dt><dd>{{ money(data?.opening_cash) }}</dd></div>
            <template v-if="totales">
              <div><dt>Ventas</dt><dd>{{ totales.sales_count }} · {{ money(totales.sales_total) }}</dd></div>
              <div><dt>Cobrado en efectivo</dt><dd>{{ money(totales.cash_sales) }}</dd></div>
              <div v-if="movimientos"><dt>Ingresos y egresos</dt><dd>{{ movimientos }}</dd></div>
            </template>
          </dl>

          <div class="zv-esperado">
            <span>Esperado en efectivo</span>
            <strong v-if="totales">{{ money(totales.expected_cash) }}</strong>
            <v-progress-circular v-else-if="resumenCargando" indeterminate size="20" width="2" />
            <strong v-else class="zv-sin">Sin dato</strong>
          </div>
        </section>

        <!-- Puede cerrarla: la propia, o la ajena siendo admin de la sucursal -->
        <section v-if="puedeCerrar" class="zv-card zv-arqueo">
          <span class="zv-h2">Arqueo para cerrar</span>

          <label class="zv-campo">
            <span class="zv-campo__rot">Efectivo contado en la caja</span>
            <span class="zv-monto" :class="{ 'is-foco': true }">
              <span class="zv-monto__signo">$</span>
              <input
                ref="contadoRef"
                v-model="contadoTexto"
                type="text"
                inputmode="decimal"
                autocomplete="off"
                aria-label="Efectivo contado en la caja"
                :disabled="loading"
                @keydown.enter.prevent="confirmar"
              />
            </span>
          </label>

          <div v-if="contadoValido && totales" class="zv-dif" :class="difClase">
            <v-icon size="20">{{ diferencia === 0 ? "mdi-check-circle" : "mdi-alert" }}</v-icon>
            <span class="zv-dif__txt">{{ difTexto }}</span>
            <strong>{{ diferencia === 0 ? "" : money(Math.abs(diferencia)) }}</strong>
          </div>

          <label v-if="pideMotivo" class="zv-campo">
            <span class="zv-campo__rot">Motivo de la diferencia</span>
            <textarea v-model="motivo" rows="2" :disabled="loading" class="zv-texto" />
          </label>

          <div v-if="error" class="zv-error">
            <v-icon size="16">mdi-alert-circle</v-icon>
            <span>{{ error }}</span>
          </div>

          <button
            type="button"
            class="zv-accion"
            :class="isOwn ? 'is-propia' : 'is-ajena'"
            :disabled="!listo || loading"
            @click="confirmar"
          >
            <v-progress-circular v-if="loading" indeterminate size="20" width="2" />
            <v-icon v-else size="22">mdi-lock-reset</v-icon>
            {{ isOwn ? `Cerrar la caja #${data?.cash_register_id} y abrir la nueva` : `Cerrar la caja de ${ownerLabel} y abrir la mía` }}
            <span class="zv-tecla zv-tecla--papel">Enter</span>
          </button>
        </section>

        <!-- No puede cerrarla: quién puede, y las otras sucursales -->
        <section v-else class="zv-card zv-arqueo">
          <span class="zv-h2">La cierra {{ ownerLabel }} o un administrador</span>

          <template v-if="availableBranches.length">
            <span class="zv-campo__rot">Abrir caja en otra sucursal</span>
            <div class="zv-sucursales">
              <button
                v-for="b in availableBranches"
                :key="b.id"
                type="button"
                class="zv-sucursal"
                @click="onSwitchBranch(b.id)"
              >
                <v-icon size="20">mdi-store-outline</v-icon>
                <span>{{ b.name }}</span>
                <v-icon size="20" class="zv-sucursal__ir">mdi-chevron-right</v-icon>
              </button>
            </div>
          </template>

          <button
            v-if="isAdmin"
            type="button"
            class="zv-enlace"
            @click="goToAdminPanel"
          >
            <v-icon size="18">mdi-cog-outline</v-icon>
            Cajas de las sucursales
          </button>
        </section>
      </main>
    </div>
  </v-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/app/store/auth.store";

const props = defineProps({
  open: { type: Boolean, default: false },
  data: { type: Object, default: () => null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  resumen: { type: Object, default: () => null },
  resumenCargando: { type: Boolean, default: false },
});

const emit = defineEmits(["confirm", "cancel", "switch-branch"]);

const auth = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => auth.isBranchAdmin === true); // incluye super
const isSuperAdmin = computed(() => auth.isSuperAdmin === true);
const isOwn = computed(() => props.data?.is_own !== false);

// Sucursales habilitadas del usuario, menos la trabada.
const availableBranches = computed(() => {
  const blockedId = Number(props.data?.branch_id || 0);
  return (auth.branches || []).filter((b) => Number(b.id) !== blockedId).slice(0, 6);
});

const ownerLabel = computed(() =>
  props.data?.opened_by_name || props.data?.opened_by_email || "el cajero"
);

// La ajena la cierra el super admin, o el admin que tiene esa sucursal.
const canCloseAsAdmin = computed(() => {
  if (isSuperAdmin.value) return true;
  if (!isAdmin.value) return false;
  const blockedId = Number(props.data?.branch_id || 0);
  if (!blockedId) return false;
  return (auth.branches || []).some((b) => Number(b.id) === blockedId);
});
const puedeCerrar = computed(() => isOwn.value || canCloseAsAdmin.value);

const branchLabel = computed(() => {
  if (props.data?.branch_name) return props.data.branch_name;
  if (props.data?.branch_id) return `Sucursal #${props.data.branch_id}`;
  return "";
});

const totales = computed(() => props.resumen?.totals || null);
const movimientos = computed(() => {
  const t = totales.value;
  if (!t) return "";
  const ent = Number(t.manual_in || 0);
  const sal = Number(t.manual_out || 0);
  if (!ent && !sal) return "";
  return `+ ${money(ent)} · − ${money(sal)}`;
});

// Reloj para "hace 1 h 50 min".
const now = ref(Date.now());
let timer = null;
onMounted(() => { timer = setInterval(() => { now.value = Date.now(); }, 30 * 1000); });
onBeforeUnmount(() => { if (timer) clearInterval(timer); });

const abiertaLabel = computed(() => {
  const t = props.data?.opened_at ? new Date(props.data.opened_at) : null;
  if (!t || Number.isNaN(t.getTime())) return "";
  const min = Math.floor(Math.max(0, now.value - t.getTime()) / 60000);
  const h = Math.floor(min / 60);
  const hace = h > 0 ? `${h} h ${min % 60} min` : min < 1 ? "recién" : `${min} min`;
  const hora = t.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${hora} · hace ${hace}`;
});

// ── Arqueo ────────────────────────────────────────────────────────────
const contadoTexto = ref("");
const motivo = ref("");
const contadoRef = ref(null);

function parseMonto(txt) {
  const limpio = String(txt || "").replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!limpio) return NaN;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : NaN;
}
const contado = computed(() => parseMonto(contadoTexto.value));
const contadoValido = computed(() => Number.isFinite(contado.value) && contado.value >= 0);
const diferencia = computed(() => {
  if (!contadoValido.value || !totales.value) return 0;
  return Math.round((contado.value - Number(totales.value.expected_cash || 0)) * 100) / 100;
});
const difTexto = computed(() => {
  if (diferencia.value === 0) return "Sin diferencia";
  return diferencia.value < 0 ? "Falta efectivo" : "Sobra efectivo";
});
const difClase = computed(() => (diferencia.value === 0 ? "is-ok" : diferencia.value < 0 ? "is-falta" : "is-sobra"));
// Sin resumen no se sabe si hay diferencia: se pide el motivo igual.
const pideMotivo = computed(() => contadoValido.value && (!totales.value || diferencia.value !== 0));
const listo = computed(() => contadoValido.value && (!pideMotivo.value || motivo.value.trim().length >= 3));

watch(() => props.open, async (v) => {
  if (!v) return;
  contadoTexto.value = "";
  motivo.value = "";
  await nextTick();
  contadoRef.value?.focus?.();
});

function confirmar() {
  if (!listo.value || props.loading) return;
  emit("confirm", { contado: contado.value, motivo: motivo.value.trim() });
}
function onCancel() { if (!props.loading) emit("cancel"); }
function onSwitchBranch(bid) { emit("switch-branch", bid); }
function goToAdminPanel() {
  router.push({ name: "adminCashRegisters" }).catch(() => {});
  emit("cancel");
}

function money(v) {
  return "$ " + new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(Number(v || 0));
}
</script>

<style scoped>
.zv {
  --zv-lienzo: #d6e6f3;
  --zv-panel: #ffffff;
  --zv-campo: #f1f5f9;
  --zv-borde: rgba(15, 23, 42, 0.10);
  --zv-linea: rgba(15, 23, 42, 0.06);
  --zv-texto: #0f172a;
  --zv-texto2: #334155;
  --zv-suave: #64748b;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--zv-lienzo);
  color: var(--zv-texto);
  font-family: Inter, sans-serif;
}
.v-theme--dark .zv,
.v-theme--adminDark .zv,
.v-theme--shopDark .zv {
  --zv-lienzo: #0b0f14;
  --zv-panel: #141a23;
  --zv-campo: #1a2230;
  --zv-borde: rgba(255, 255, 255, 0.10);
  --zv-linea: rgba(255, 255, 255, 0.08);
  --zv-texto: #f1f5f9;
  --zv-texto2: #cbd5e1;
  --zv-suave: #94a3b8;
}

.zv-top {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  background: var(--zv-panel);
  border-bottom: 1px solid var(--zv-linea);
}
.zv-volver {
  height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--zv-texto);
  font: 700 14px Inter, sans-serif;
  cursor: pointer;
}
.zv-volver:hover { background: rgba(15, 23, 42, 0.05); }
.zv-volver :deep(.v-icon) { color: inherit; }
.zv-top__titulo { font: 800 16px Inter, sans-serif; }

.zv-tecla {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 23px;
  padding: 0 6px;
  box-sizing: border-box;
  border-radius: 6px;
  font: 900 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: #1e293b;
  background: linear-gradient(#f8fafc, #cbd5e1);
  border: 1px solid rgba(100, 116, 139, 0.6);
  box-shadow: 0 2px 0 rgba(15, 23, 42, 0.45), 0 2px 4px rgba(0, 0, 0, 0.18);
}
.zv-tecla--papel {
  color: #0f172a;
  background: linear-gradient(#ffffff, #f1f5f9);
  border-color: rgba(0, 0, 0, 0.2);
}

.zv-cuerpo {
  flex: 1;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 440px);
  gap: 16px;
  align-items: start;
}
@media (max-width: 860px) {
  .zv-cuerpo { grid-template-columns: minmax(0, 1fr); }
}

.zv-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  background: var(--zv-panel);
  border: 1px solid var(--zv-borde);
}
.zv-card__head { display: flex; align-items: center; gap: 12px; }
.zv-icono {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.zv-icono.is-ajena { background: rgba(220, 38, 38, 0.12); color: #dc2626; }
.zv-icono.is-propia { background: rgba(245, 158, 11, 0.18); color: #b45309; }
.zv-icono :deep(.v-icon) { color: inherit; }
.zv-card__tit { display: flex; flex-direction: column; }
.zv-h1 { font: 800 22px Inter, sans-serif; }
.zv-sub { font: 600 14px Inter, sans-serif; color: var(--zv-suave); }
.zv-h2 { font: 800 18px Inter, sans-serif; }

.zv-datos {
  margin: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--zv-linea);
}
.zv-datos > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--zv-linea);
}
.zv-datos dt { font: 600 14px Inter, sans-serif; color: var(--zv-suave); }
.zv-datos dd { margin: 0; font: 700 14px Inter, sans-serif; text-align: right; }

.zv-esperado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 10px;
  background: rgba(15, 111, 174, 0.08);
  font: 700 14px Inter, sans-serif;
}
.zv-esperado strong { font: 800 24px Inter, sans-serif; letter-spacing: -0.02em; }
.zv-esperado .zv-sin { font-size: 15px; color: var(--zv-suave); }

.zv-campo { display: flex; flex-direction: column; gap: 8px; }
.zv-campo__rot { font: 700 13px Inter, sans-serif; color: var(--zv-suave); }
.zv-monto {
  height: 68px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 2px solid #0f6fae;
  background: var(--zv-campo);
}
.zv-monto__signo { font: 800 26px Inter, sans-serif; color: var(--zv-suave); }
.zv-monto input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: 800 32px Inter, sans-serif;
  letter-spacing: -0.02em;
  color: var(--zv-texto);
}
.zv-texto {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--zv-borde);
  background: var(--zv-campo);
  color: var(--zv-texto);
  font: 500 14px Inter, sans-serif;
  resize: none;
  outline: none;
}

.zv-dif {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  font: 800 15px Inter, sans-serif;
}
.zv-dif :deep(.v-icon) { color: inherit; }
.zv-dif__txt { flex: 1; }
.zv-dif strong { font-size: 22px; }
.zv-dif.is-ok { background: rgba(16, 185, 129, 0.12); color: #047857; }
.zv-dif.is-falta { background: rgba(245, 158, 11, 0.18); color: #92400e; }
.zv-dif.is-sobra { background: rgba(14, 165, 233, 0.14); color: #0369a1; }

.zv-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.10);
  color: #b91c1c;
  font: 600 13px Inter, sans-serif;
}
.zv-error :deep(.v-icon) { color: inherit; }

.zv-accion {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  color: #ffffff;
  font: 800 16px Inter, sans-serif;
  cursor: pointer;
}
.zv-accion.is-propia { background: #0f6fae; }
.zv-accion.is-ajena { background: #b91c1c; }
.zv-accion:disabled { opacity: 0.45; cursor: default; }
.zv-accion :deep(.v-icon) { color: #ffffff; }

.zv-sucursales { display: flex; flex-direction: column; gap: 8px; }
.zv-sucursal {
  height: 52px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--zv-borde);
  background: var(--zv-panel);
  color: var(--zv-texto);
  font: 700 15px Inter, sans-serif;
  text-align: left;
  cursor: pointer;
}
.zv-sucursal:hover { border-color: #0f6fae; }
.zv-sucursal span { flex: 1; }
.zv-sucursal :deep(.v-icon) { color: #0f6fae; }
.zv-sucursal__ir { color: var(--zv-suave) !important; }
.zv-enlace {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 4px;
  border: 0;
  background: transparent;
  color: #0f6fae;
  font: 700 14px Inter, sans-serif;
  cursor: pointer;
}
.zv-enlace :deep(.v-icon) { color: inherit; }
</style>
