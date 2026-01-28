<template>
  <div>
    <div class="section-title">Revisión</div>
    <div class="text-caption text-medium-emphasis mb-3">
      Verificá todo antes de confirmar.
    </div>

    <v-card variant="outlined" class="rounded-lg">
      <v-card-text>
        <div class="section-subtitle">Comprador</div>
        <div class="text-body-2">
          <b>{{ buyer?.name || "—" }}</b>
          <div class="text-caption text-medium-emphasis">
            {{ buyer?.email || "—" }} · {{ buyer?.phone || "—" }}
          </div>
        </div>

        <v-divider class="my-3" />

        <div class="section-subtitle">Entrega</div>
        <div v-if="delivery?.mode==='pickup'" class="text-body-2">
          Retiro en sucursal: <b>{{ selectedBranchName || "—" }}</b>
        </div>
        <div v-else class="text-body-2">
          Envío a: <b>{{ delivery?.address1 || "—" }}</b>,
          {{ delivery?.city || "—" }}, {{ delivery?.province || "—" }},
          CP {{ delivery?.zip || "—" }}
          <div class="text-caption text-medium-emphasis mt-1">
            {{ delivery?.contact_name || buyer?.name || "—" }} ·
            {{ delivery?.ship_phone || buyer?.phone || "—" }}
          </div>
          <div v-if="shippingQuote?.status==='ok'" class="text-caption mt-1">
            Envío: <b>$ {{ fmtMoney(shippingQuote?.amount) }}</b>
            <span v-if="shippingQuote?.eta" class="text-medium-emphasis">· {{ shippingQuote.eta }}</span>
          </div>
        </div>

        <v-divider class="my-3" />

        <div class="section-subtitle">Pago</div>
        <div class="text-body-2">
          Método: <b>{{ paymentLabel || "—" }}</b>
          <div class="text-caption text-medium-emphasis mt-1" v-if="paymentLabel === 'Mercado Pago'">
            Se redirigirá a Mercado Pago al confirmar.
          </div>
        </div>
      </v-card-text>
    </v-card>

    <v-alert v-if="submitError" type="error" variant="tonal" class="rounded-lg mt-3">
      {{ submitError }}
    </v-alert>

    <div class="d-flex justify-space-between mt-4">
      <v-btn variant="tonal" @click="$emit('prev')">
        <v-icon start>mdi-arrow-left</v-icon>
        Volver
      </v-btn>

      <v-btn
        color="primary"
        size="large"
        :loading="submitting"
        :disabled="submitting || !canSubmit"
        @click="$emit('submit')"
      >
        Confirmar compra
        <v-icon end>mdi-check</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  buyer: { type: Object, default: () => ({}) },
  delivery: { type: Object, default: () => ({}) },
  selectedBranchName: { type: String, default: "" },
  shippingQuote: { type: Object, default: () => ({ status: "idle", amount: 0 }) },
  paymentLabel: { type: String, default: "" },

  submitting: { type: Boolean, default: false },
  submitError: { type: String, default: "" },
  canSubmit: { type: Boolean, default: false },
});

defineEmits(["prev", "submit"]);

function fmtMoney(v) {
  return new Intl.NumberFormat("es-AR").format(Math.round(Number(v || 0)));
}
</script>

<style scoped>
.section-title {
  font-weight: 900;
  font-size: 18px;
  margin-bottom: 2px;
}

.section-subtitle {
  font-weight: 900;
  font-size: 14px;
}
</style>
