<template>
  <v-alert
    v-if="modelValue?.visible"
    :type="modelValue?.type || 'info'"
    variant="tonal"
    class="rounded-lg"
  >
    <div class="font-weight-bold">{{ modelValue?.title || "Estado del pago" }}</div>
    <div class="text-body-2 mt-1">
      {{ modelValue?.message || "" }}
      <template v-if="modelValue?.orderId">
        <span class="text-medium-emphasis"> · Orden:</span>
        <b>#{{ modelValue.orderId }}</b>
      </template>
    </div>

    <div class="d-flex flex-wrap ga-2 mt-3">
      <v-btn
        v-if="showGoReview"
        color="primary"
        variant="flat"
        @click="$emit('go-review')"
      >
        Volver a revisión
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>

      <v-btn
        v-if="showRetry"
        variant="tonal"
        @click="$emit('retry-payment')"
      >
        Reintentar pago
        <v-icon end>mdi-credit-card-outline</v-icon>
      </v-btn>

      <v-btn
        v-if="showOrders"
        variant="tonal"
        @click="$emit('go-orders')"
      >
        Ver mis pedidos
        <v-icon end>mdi-receipt-text-outline</v-icon>
      </v-btn>
    </div>
  </v-alert>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ visible: false }),
  },
});

defineEmits(["go-review", "retry-payment", "go-orders"]);

const showGoReview = computed(() => props.modelValue?.type === "warning");
const showRetry = computed(() => props.modelValue?.type === "error");
const showOrders = computed(() => props.modelValue?.type === "success");
</script>
