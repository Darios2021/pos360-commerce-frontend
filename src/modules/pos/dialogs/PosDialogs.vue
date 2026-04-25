<template>
  <div class="pos-dialogs">
    <PosCartPreviewDialog
      v-model="showCartDialog"
      :items="cartItems"
      :total-amount="checkoutTotalPreview"
      currency="ARS"
      @go-pay="handleGoPayFromCart"
    />

    <CheckoutDialog
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
      :cash-error="cashError"
      :cash-error-msg="cashErrorMsg"
      @confirm="onCheckoutConfirm"
      @cancel="onCheckoutCancel"
    />

    <ReceiptDialog
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
      @confirm="closeZombieAndOpen"
      @cancel="cancelZombieDialog"
    />

    <PosCajaArqueoDialog
      v-model:open="cajaArqueoOpen"
      :is-caja-open="isCajaOpen"
      @reload="reloadSummaryFromArqueo"
      :caja-type-label="cajaTypeLabel"
      :invoice-type-label="invoiceTypeLabel"
      :summary="summary"
      @save="onSaveArqueo"
    />

    <PosShortcutsHelpDialog v-model="helpOpen" />

    <PosConsultaDialog
      v-model="consultaOpen"
      :items="consultaItems"
      :loading="consultaLoading"
      @manual-search="handleManualConsulta"
      @barcode-search="handleBarcodeConsulta"
      @add-to-cart="handleAddConsultaToCart"
      @select="handleSelectConsultaItem"
    />

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

    <v-snackbar
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
import PosCartPreviewDialog from "../components/PosCartPreviewDialog.vue";
import PosShortcutsHelpDialog from "../components/PosShortcutsHelpDialog.vue";
import PosCajaConfigDialog from "../components/PosCajaConfigDialog.vue";
import PosZombieCashDialog from "../components/PosZombieCashDialog.vue";
import PosCajaArqueoDialog from "../components/PosCajaArqueoDialog.vue";
import PosBranchSwitchDialog from "../components/PosBranchSwitchDialog.vue";
import PosConsultaDialog from "../components/PosConsultaDialog.vue";
import { usePosSalesFlow } from "../containers/usePosSalesFlow";

const {
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
</script>

<style scoped>
.pos-dialogs {
  display: contents;
}
</style>