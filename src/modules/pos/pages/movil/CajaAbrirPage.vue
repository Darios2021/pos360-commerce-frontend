<!--
  Abrir caja en el teléfono (maqueta pantalla 12). Reemplaza en el teléfono a
  PosCajaConfigDialog; en escritorio sigue la ventana (barra de teclas). Mismo
  pedido que el escritorio: caja GENERAL, sin facturación, ticket.
-->
<template>
  <MovilVista titulo="Abrir caja" :volver="{ name: 'caja' }">
    <div class="m-pz"><div class="m-pz-b m-pz-b--top"><dl class="m-dl">
      <dt>Cajero</dt><dd>{{ cashierName }}</dd>
      <dt>Sucursal</dt><dd>{{ branchName || "Sin dato" }}</dd>
      <dt>Hora</dt><dd class="num">{{ horaAhora }}</dd>
    </dl></div></div>

    <div class="m-cmp">
      <label for="ca-fondo">Efectivo para empezar el turno</label>
      <div class="m-inpw grande">
        <span class="pre">$</span>
        <input id="ca-fondo" class="m-inp grande num" inputmode="decimal" :value="fondoTxt" @input="onFondo" />
      </div>
    </div>
    <div class="m-cmp">
      <label for="ca-obs">Observación</label>
      <textarea id="ca-obs" v-model="nota" class="m-inp" maxlength="255" placeholder="Opcional"></textarea>
    </div>
    <div v-if="error" class="m-error">{{ error }}</div>

    <template #pie>
      <button type="button" class="m-btn" :disabled="abriendo" @click="abrir">
        <v-progress-circular v-if="abriendo" indeterminate size="22" width="3" />
        <span v-else class="num">{{ `Abrir caja con ${pesos(fondo)}` }}</span>
      </button>
    </template>
  </MovilVista>

  <!-- Caja que traba la apertura: ya es una vista completa (arqueo para cerrarla). -->
  <PosZombieCashDialog
    :open="zombieDialog.open"
    :data="zombieDialog.data"
    :loading="zombieDialog.loading"
    :error="zombieDialog.error"
    :resumen="zombieDialog.resumen"
    :resumen-cargando="zombieDialog.resumenCargando"
    @confirm="onZombieConfirm"
    @cancel="cancelZombieDialog"
    @switch-branch="onSwitchBranch"
  />
  <MovilAviso />
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import MovilVista from "@/app/components/movil/MovilVista.vue";
import MovilAviso from "@/app/components/movil/MovilAviso.vue";
import PosZombieCashDialog from "../../components/PosZombieCashDialog.vue";
import { usePosSalesFlow } from "../../containers/usePosSalesFlow";
import { formatearMonto, montoANumero } from "../../utils/montoTexto";
import { pesos } from "../../utils/cobroReglas";

const router = useRouter();
const flow = usePosSalesFlow();
const {
  cashierName,
  branchName,
  isCajaOpen,
  currentCashRegisterId,
  openCaja,
  refreshCaja,
  zombieDialog,
  closeZombieAndOpen,
  cancelZombieDialog,
  branchPickSelected,
  confirmActiveBranchChange,
  toast,
} = flow;

const fondoTxt = ref("");
const nota = ref("");
const abriendo = ref(false);
const error = ref("");
const fondo = computed(() => montoANumero(fondoTxt.value));
const horaAhora = ref("");

function onFondo(e) {
  fondoTxt.value = formatearMonto(e.target.value);
  e.target.value = fondoTxt.value;
}

function listo() {
  window.dispatchEvent(new CustomEvent("pos:caja-cambio"));
  toast(`Caja #${currentCashRegisterId.value} abierta`);
  router.replace({ name: "caja" });
}

async function abrir() {
  if (abriendo.value) return;
  abriendo.value = true;
  error.value = "";
  try {
    await openCaja({
      opening_cash: fondo.value,
      opening_note: nota.value.trim(),
      caja_type: "GENERAL",
      invoice_mode: "NO_FISCAL",
      invoice_type: "TICKET",
    });
    await refreshCaja().catch(() => {});
    listo();
  } catch (e) {
    // 409 con caja trabada: se abre la vista de la caja trabada.
    if (e?.status === 409 && (zombieDialog.value?.open || isCajaOpen.value)) {
      if (isCajaOpen.value && !zombieDialog.value?.open) router.replace({ name: "caja" });
      return;
    }
    error.value = e?.message || "La caja no se abrió";
  } finally {
    abriendo.value = false;
  }
}

async function onZombieConfirm(arqueo) {
  await closeZombieAndOpen(arqueo);
  if (!zombieDialog.value?.open && isCajaOpen.value) listo();
}

async function onSwitchBranch(branchId) {
  cancelZombieDialog();
  branchPickSelected.value = Number(branchId) || null;
  await confirmActiveBranchChange();
}

onMounted(async () => {
  const d = new Date();
  horaAhora.value = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  await flow.initOnce?.();
  if (isCajaOpen.value) router.replace({ name: "caja" });
});
</script>
