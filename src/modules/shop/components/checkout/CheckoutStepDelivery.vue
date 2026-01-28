<template>
  <div>
    <div class="section-title">Entrega</div>
    <div class="text-caption text-medium-emphasis mb-4">
      Elegí retiro en sucursal o envío a domicilio.
    </div>

    <v-radio-group v-model="deliveryLocal.mode" density="compact" class="mb-2">
      <v-radio label="Retiro en sucursal" value="pickup" />
      <v-radio label="Envío a domicilio" value="shipping" />
    </v-radio-group>

    <v-divider class="my-4" />

    <div class="section-subtitle">Datos del comprador</div>
    <div class="text-caption text-medium-emphasis mb-2">
      Necesitamos estos datos para generar el pedido y contactarte.
    </div>

    <v-row class="mt-1">
      <v-col cols="12" md="6">
        <v-text-field v-model="buyerLocal.name" label="Nombre y apellido" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="buyerLocal.email" label="Email" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="buyerLocal.phone" label="Teléfono" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="buyerLocal.doc_number" label="DNI / CUIT (opcional)" variant="outlined" density="comfortable" />
      </v-col>
    </v-row>

    <v-alert v-if="buyerErrors?.length" type="warning" variant="tonal" class="rounded-lg mt-2">
      <div class="font-weight-bold mb-1">Faltan datos:</div>
      <ul class="ma-0 pl-5">
        <li v-for="(e,i) in buyerErrors" :key="i">{{ e }}</li>
      </ul>
    </v-alert>

    <v-divider class="my-4" />

    <!-- SHIPPING -->
    <div v-if="deliveryLocal.mode === 'shipping'">
      <div class="section-subtitle">Dirección de envío</div>

      <v-row class="mt-1">
        <v-col cols="12" md="6">
          <v-text-field v-model="deliveryLocal.contact_name" label="Nombre receptor" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="deliveryLocal.ship_phone" label="Teléfono receptor" variant="outlined" density="comfortable" />
        </v-col>

        <v-col cols="12">
          <v-text-field v-model="deliveryLocal.address1" label="Dirección (calle + número)" variant="outlined" density="comfortable" />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field v-model="deliveryLocal.zip" label="Código postal" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="deliveryLocal.city" label="Ciudad" variant="outlined" density="comfortable" />
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field v-model="deliveryLocal.province" label="Provincia" variant="outlined" density="comfortable" />
        </v-col>
      </v-row>

      <v-alert v-if="shippingQuoteLocal.status==='ok'" type="success" variant="tonal" class="rounded-lg mt-2">
        Envío: <b>$ {{ fmtMoney(shippingQuoteLocal.amount) }}</b>
        <span v-if="shippingQuoteLocal.eta" class="text-medium-emphasis">· {{ shippingQuoteLocal.eta }}</span>
      </v-alert>

      <div class="d-flex justify-end mt-3">
        <v-btn variant="tonal" :disabled="!canQuoteShipping" @click="$emit('quote-shipping')">
          <v-icon start>mdi-truck-fast-outline</v-icon>
          Calcular envío
        </v-btn>
      </div>
    </div>

    <!-- PICKUP -->
    <div v-else>
      <div class="section-subtitle">Elegí sucursal</div>
      <div class="text-caption text-medium-emphasis mb-2">
        Solo se muestran sucursales que pueden cumplir el carrito completo.
      </div>

      <v-alert
        v-if="deliveryLocal.mode==='pickup' && (pickupBranches?.length || 0) === 0"
        type="warning"
        variant="tonal"
        class="rounded-lg mb-2"
      >
        No encontramos una sucursal con stock para <b>todos</b> los productos.
        Probá <b>envío a domicilio</b> o revisá el carrito.
      </v-alert>

      <v-select
        v-model="deliveryLocal.pickup_branch_id"
        :items="pickupBranches"
        item-title="name"
        item-value="id"
        label="Sucursal"
        variant="outlined"
        density="comfortable"
        :disabled="(pickupBranches?.length || 0) === 0"
      />

      <div v-if="deliveryLocal.pickup_branch_id" class="text-caption text-medium-emphasis mt-2">
        Retiro gratis. Te avisamos cuando esté listo.
      </div>
    </div>

    <div class="d-flex justify-end mt-4">
      <v-btn color="primary" @click="$emit('next')">
        Continuar
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  items: { type: Array, default: () => [] },
  branches: { type: Array, default: () => [] },
  pickupBranches: { type: Array, default: () => [] },

  buyer: { type: Object, required: true },
  delivery: { type: Object, required: true },
  shippingQuote: { type: Object, required: true },

  buyerErrors: { type: Array, default: () => [] },
  canQuoteShipping: { type: Boolean, default: false },
});

const emit = defineEmits(["update:buyer", "update:delivery", "update:shipping-quote", "quote-shipping", "next"]);

const buyerLocal = computed({
  get: () => props.buyer,
  set: (v) => emit("update:buyer", v),
});

const deliveryLocal = computed({
  get: () => props.delivery,
  set: (v) => emit("update:delivery", v),
});

const shippingQuoteLocal = computed({
  get: () => props.shippingQuote,
  set: (v) => emit("update:shipping-quote", v),
});

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
