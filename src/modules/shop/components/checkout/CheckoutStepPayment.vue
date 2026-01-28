<template>
  <div>
    <div class="section-title">Pago</div>
    <div class="text-caption text-medium-emphasis mb-3">Elegí el medio de pago.</div>

    <v-radio-group v-model="paymentLocal.method" density="compact" class="mb-2">
      <v-radio v-if="mpEnabled" label="Mercado Pago" value="MERCADO_PAGO" />
      <v-radio label="Transferencia" value="TRANSFER" />
      <v-radio label="Efectivo" value="CASH" />
      <v-radio label="Otro" value="OTHER" />
    </v-radio-group>

    <v-alert v-if="paymentLocal.method==='MERCADO_PAGO' && !mpEnabled" type="warning" variant="tonal" class="rounded-lg">
      Mercado Pago no está habilitado.
    </v-alert>

    <div v-if="paymentLocal.method==='TRANSFER'" class="mt-3">
      <v-card variant="outlined" class="rounded-lg">
        <v-card-text>
          <div class="font-weight-bold">Datos bancarios</div>
          <div class="text-caption mt-2">
            Banco: <b>{{ transferInfo?.bank || "—" }}</b><br />
            Alias: <b>{{ transferInfo?.alias || "—" }}</b><br />
            CBU: <b>{{ transferInfo?.cbu || "—" }}</b><br />
            Titular: <b>{{ transferInfo?.holder || "—" }}</b>
          </div>

          <v-alert v-if="transferInfo?.instructions" type="info" variant="tonal" class="rounded-lg mt-3">
            {{ transferInfo.instructions }}
          </v-alert>

          <v-text-field
            v-model="paymentLocal.reference"
            label="Referencia / Comprobante (opcional)"
            variant="outlined"
            density="comfortable"
            class="mt-3"
          />
        </v-card-text>
      </v-card>
    </div>

    <div v-else-if="paymentLocal.method==='OTHER'" class="mt-3">
      <v-textarea v-model="paymentLocal.note" label="Nota (opcional)" variant="outlined" density="comfortable" rows="3" />
    </div>

    <div class="d-flex justify-space-between mt-4">
      <v-btn variant="tonal" @click="$emit('prev')">
        <v-icon start>mdi-arrow-left</v-icon>
        Volver
      </v-btn>

      <v-btn color="primary" :disabled="!canNext" @click="$emit('next')">
        Continuar
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  payment: { type: Object, required: true },
  mpEnabled: { type: Boolean, default: false },
  transferInfo: { type: Object, default: () => ({}) },
  canNext: { type: Boolean, default: false },
});

const emit = defineEmits(["update:payment", "prev", "next"]);

const paymentLocal = computed({
  get: () => props.payment,
  set: (v) => emit("update:payment", v),
});
</script>

<style scoped>
.section-title {
  font-weight: 900;
  font-size: 18px;
  margin-bottom: 2px;
}
</style>
