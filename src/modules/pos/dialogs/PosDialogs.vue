<template>
  <div class="pos-dialogs">

    <!-- En el teléfono cobro, abrir y cerrar caja son vistas completas con
         ruta propia (rediseño móvil): estas ventanas son sólo del mostrador. -->
    <CheckoutDialog
      v-if="!mobile"
      v-model:open="checkoutDialog"
      :total="checkoutTotal"
      :total-preview="checkoutTotalPreview"
      :cart="cartItems"
      :payment-methods="paymentMethods"
      v-model:payment-method-id="paymentMethodId"
      v-model:installments="installments"
      v-model:apply-reseller="applyReseller"
      v-model:payment-proof="paymentProof"
      v-model:cash-input="cashInput"
      v-model:card-kind="cardKind"
      v-model:mixed-mode="mixedMode"
      v-model:mixed-payments="mixedPayments"
      v-model:invoice-mode="checkoutInvoiceMode"
      v-model:invoice-type="checkoutInvoiceType"
      v-model:customer-type="customerType"
      :customer-name-value="posStore.clienteVenta?.display_name || ''"
      :customer-doc-value="posStore.clienteVenta?.doc_number || ''"
      :customer-phone-value="posStore.clienteVenta?.phone || ''"
      :cash-error="cashError"
      :cash-error-msg="cashErrorMsg"
      @confirm="onCheckoutConfirm"
      @cancel="onCheckoutCancel"
    />

    <ReceiptDialog
      v-if="!mobile"
      v-model:open="receiptOpen"
      :sale="receiptSale"
      :company-name="receiptCompanyName"
      :branch-name="branchName || ''"
    />

    <PosBranchSwitchDialog
      v-model:open="branchPickOpen"
      v-model:selected="branchPickSelected"
      :items="uiBranchesForSelect"
      :cart-count="cartCount"
      @confirm="confirmActiveBranchChange"
    />

    <PosCajaConfigDialog
      v-if="!mobile"
      v-model:open="cajaConfigOpen"
      :opening-amount="openingAmount"
      :note="openingNote"
      :cashier-name="cashierName"
      :branch-label="branchChipLabel"
      @save="onSaveCajaConfig"
    />

    <PosZombieCashDialog
      :open="zombieDialog.open"
      :data="zombieDialog.data"
      :loading="zombieDialog.loading"
      :error="zombieDialog.error"
      :resumen="zombieDialog.resumen"
      :resumen-cargando="zombieDialog.resumenCargando"
      @confirm="closeZombieAndOpen"
      @cancel="cancelZombieDialog"
      @switch-branch="onSwitchBranchFromZombie"
    />

    <PosCajaArqueoDialog
      v-if="!mobile"
      v-model:open="cajaArqueoOpen"
      :is-caja-open="isCajaOpen"
      @reload="reloadSummaryFromArqueo"
      :caja-type-label="cajaTypeLabel"
      :invoice-type-label="invoiceTypeLabel"
      :summary="summary"
      @save="onSaveArqueo"
    />


    <!-- El tour explica la pantalla: en el teléfono no se muestra (la interfaz no explica). -->
    <PosWizardDialog v-if="!mobile" v-model="wizardOpen" :first-run="wizardFirstRun" />


    <v-dialog v-model="scannerTestOpen" max-width="460">
      <v-card class="pos-scanner-test-dialog">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Probar scanner</span>
          <v-btn
            icon
            variant="text"
            density="comfortable"
            @click="scannerTestOpen = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="pt-2">
          <div class="text-body-2 mb-3">
            Pegá o escribí un código para simular una lectura de pistola.
          </div>

          <v-text-field
            v-model="scannerTestCode"
            label="Código"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @keyup.enter="runScannerTest"
          />
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="scannerTestOpen = false">
            Cerrar
          </v-btn>
          <v-btn color="primary" variant="flat" @click="runScannerTest">
            Simular lectura
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- En el teléfono el aviso breve lo pinta MovilAviso, arriba de la barra de cobro. -->
    <v-snackbar
      v-if="!mobile"
      v-model="snack.show"
      :timeout="snack.timeout || 3200"
      :color="snack.color || undefined"
    >
      {{ snack.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import CheckoutDialog from "../components/checkout/CheckoutDialog.vue";
import ReceiptDialog from "../components/ReceiptDialog.vue";
import PosWizardDialog from "../components/PosWizardDialog.vue";
import PosCajaConfigDialog from "../components/PosCajaConfigDialog.vue";
import PosZombieCashDialog from "../components/PosZombieCashDialog.vue";
import PosCajaArqueoDialog from "../components/PosCajaArqueoDialog.vue";
import PosBranchSwitchDialog from "../components/PosBranchSwitchDialog.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useDisplay } from "vuetify";

const { mobile } = useDisplay();

// ── Mini wizard del POS ───────────────────────────────────────────────
// Auto-show la primera vez (flag en localStorage). Se relanza desde el
// dialog de atajos (F1) vía CustomEvent("pos:open-wizard").
const wizardOpen = ref(false);
const wizardFirstRun = ref(false);
function openWizard() {
  wizardFirstRun.value = false;
  wizardOpen.value = true;
}
onMounted(() => {
  try {
    if (!mobile.value && !localStorage.getItem("pos.wizard.seen")) {
      wizardFirstRun.value = true;
      wizardOpen.value = true;
    }
  } catch {}
  if (typeof window !== "undefined") {
    window.addEventListener("pos:open-wizard", openWizard);
  }
});
onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("pos:open-wizard", openWizard);
  }
});

const {
  posStore,
  showCartDialog,
  cartItems,
  checkoutDialog,
  checkoutTotal,
  checkoutTotalPreview,

  paymentMethods,
  paymentMethodId,
  installments,
  applyReseller,
  paymentProof,
  cashInput,
  cashError,
  cashErrorMsg,
  cardKind,

  mixedMode,
  mixedPayments,

  invoiceMode,
  invoiceType,
  checkoutInvoiceMode,
  checkoutInvoiceType,
  customerType,

  receiptOpen,
  receiptSale,
  receiptCompanyName,
  branchName,
  branchPickOpen,
  branchPickSelected,
  uiBranchesForSelect,
  cartCount,
  cajaConfigOpen,
  cajaArqueoOpen,
  zombieDialog,
  closeZombieAndOpen,
  cancelZombieDialog,
  cajaType,
  openingAmount,
  openingNote,
  cajaTypeOptions,
  invoiceModeOptions,
  invoiceTypeOptions,
  isCajaOpen,
  cashierName,
  branchChipLabel,
  cajaTypeLabel,
  invoiceTypeLabel,
  summary,
  helpOpen,
  consultaOpen,
  consultaItems,
  consultaLoading,
  scannerTestOpen,
  scannerTestCode,
  snack,
  handleGoPayFromCart,
  onCheckoutConfirm,
  onCheckoutCancel,
  confirmActiveBranchChange,
  onSaveCajaConfig,
  onSaveArqueo,
  handleManualConsulta,
  handleBarcodeConsulta,
  handleAddConsultaToCart,
  handleSelectConsultaItem,
  runScannerTest,
  reloadSummaryFromArqueo,
} = usePosSalesFlow();

// Cuando el dialog "caja abierta por otro" ofrece links a otras sucursales,
// cerramos el dialog y disparamos el cambio de sucursal activa. Reutilizamos
// el mismo flujo que el branch-switch del header.
async function onSwitchBranchFromZombie(branchId) {
  try {
    cancelZombieDialog();
    branchPickSelected.value = Number(branchId) || null;
    await confirmActiveBranchChange();
  } catch (e) {
    console.warn("[POS] cambio de sucursal desde zombie dialog falló", e);
  }
}
</script>

<style scoped>
.pos-dialogs {
  display: contents;
}
</style>