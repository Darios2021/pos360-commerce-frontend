<!-- ✅ COPY-PASTE FINAL (estilo Mercado Libre: secciones + grilla de logos, sin inventar) -->
<!-- src/modules/shop/components/PaymentMethodsCard.vue -->
<template>
  <v-card class="pm-card" rounded="xl" elevation="0" variant="outlined">
    <v-card-text class="pm-pad">
      <div class="pm-title">Medios de pago</div>

      <!-- Cuotas sin tarjeta -->
      <div class="pm-section" v-if="showMercadoPago">
        <div class="pm-sub">Cuotas sin Tarjeta</div>
        <div class="pm-logos pm-logos-1">
          <img class="pm-logo" :src="icons.mercadopago" alt="Mercado Pago" />
        </div>
      </div>

      <!-- Crédito -->
      <div class="pm-section" v-if="showCredit">
        <div class="pm-sub">Tarjetas de crédito</div>

        <div class="pm-logos">
          <img class="pm-logo" :src="icons.visa" alt="VISA" />
          <img class="pm-logo" :src="icons.mastercard" alt="Mastercard" />
          <img class="pm-logo" :src="icons.naranja" alt="Naranja X" />

          <!-- ✅ Destacado sutil: Crédito SJT -->
          <div class="pm-sjt-wrap" title="Crédito San Juan Tecnología">
            <img class="pm-logo pm-logo-sjt" :src="icons.creditoSjt" alt="Crédito San Juan Tecnología" />
            <span class="pm-sjt-badge">Crédito SJT</span>
          </div>
        </div>
      </div>

      <!-- Link al modal / scroll / lo que uses -->
      <a class="pm-more" href="javascript:void(0)" @click.prevent="emit('more')">
        Conocé otros medios de pago
      </a>
    </v-card-text>
  </v-card>
</template>

<script setup>
const emit = defineEmits(["more"]);

/**
 * IMPORTANTE:
 * - No inventa medios.
 * - Solo muestra lo que efectivamente tenés disponible.
 *   Si todavía no estás trayendo config real, queda "true" por default para MP y Crédito.
 *
 * Si ya tenés config público:
 * - pasalo como prop y usalo acá (ej: props.config.mercadopago.enabled)
 */
const props = defineProps({
  // opcional: { mercadopago: { enabled }, cash: { enabled }, transfer... }
  config: { type: Object, default: null },
});

const icons = {
  // Los mismos que ya tenías
  mastercard: "https://storage-files.cingulado.org/pos360/media/1769785611712-ef532460bf2a0059.webp",
  mercadopago: "https://storage-files.cingulado.org/pos360/media/1769785611712-ef532460bf2a0059.webp",
  visa: "https://storage-files.cingulado.org/pos360/media/1769785603289-8ef15a33274405c8.webp",
  naranja: "https://storage-files.cingulado.org/pos360/media/1769785599197-627b0a0bac168cee.webp",
  creditoSjt: "https://storage-files.cingulado.org/pos360/products/191/1768436764101-45978c9e355b.webp",
};

// ✅ sin inventar: si hay config, respeta enabled; si no hay, muestra por defecto
const showMercadoPago = (() => {
  if (!props.config) return true;
  return !!props.config?.mercadopago?.enabled;
})();

const showCredit = true; // si querés hacerlo configurable, lo pasamos por config también
</script>

<style scoped>
.pm-card {
  border-color: rgba(0, 0, 0, 0.08);
  background: #fff;
}

.pm-pad {
  padding: 18px;
}

.pm-title {
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 14px;
}

.pm-section + .pm-section {
  margin-top: 18px;
}

.pm-sub {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
  color: rgba(0, 0, 0, 0.85);
}

/* Grilla de logos como ML */
.pm-logos {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px 22px;
}

.pm-logos-1 {
  gap: 14px;
}

/* Logos: no “chips”, no cajas, solo logos como el screenshot */
.pm-logo {
  width: 64px;
  height: 26px;
  object-fit: contain;
  display: block;
}

/* Destacado Crédito SJT sin cambiar el layout */
.pm-sjt-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.pm-logo-sjt {
  width: 72px;
  height: 30px;
}

.pm-sjt-badge {
  position: absolute;
  left: 0;
  bottom: -12px;
  font-size: 10px;
  font-weight: 800;
  color: rgba(0, 0, 0, 0.62);
  white-space: nowrap;
}

/* link inferior */
.pm-more {
  display: inline-block;
  margin-top: 18px;
  color: #1a73e8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
}
.pm-more:hover {
  text-decoration: underline;
}

@media (max-width: 600px) {
  .pm-logo {
    width: 62px;
    height: 26px;
  }
  .pm-logo-sjt {
    width: 70px;
    height: 30px;
  }
}
</style>
