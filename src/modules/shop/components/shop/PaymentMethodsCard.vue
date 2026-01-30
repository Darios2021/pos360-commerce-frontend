<!-- ✅ COPY-PASTE FINAL -->
<!-- src/modules/shop/components/PaymentMethodsCard.vue -->
<template>
  <v-card class="pm-card" rounded="xl" elevation="0" variant="outlined">
    <v-card-text class="pm-pad">
      <div class="pm-title">Medios de pago</div>

      <div class="pm-section">
        <div class="pm-sub">Cuotas sin Tarjeta</div>
        <div class="pm-row">
          <img class="pm-icon" :src="icons.mercadopago" alt="Mercado Pago" />
          <div class="pm-name">Mercado Pago</div>
        </div>
      </div>

      <div class="pm-section">
        <div class="pm-sub">Tarjetas de crédito</div>
        <div class="pm-icons">
          <img class="pm-icon" :src="icons.visa" alt="VISA" />
          <img class="pm-icon" :src="icons.mastercard" alt="Mastercard" />
          <img class="pm-icon" :src="icons.naranja" alt="Naranja X" />
          <img class="pm-icon" :src="icons.creditoSjt" alt="Crédito San Juan Tecnología" />
        </div>
      </div>

      <a class="pm-more" href="javascript:void(0)">Conocé otros medios de pago</a>
    </v-card-text>
  </v-card>
</template>

<script setup>
const icons = {
  mastercard: "https://storage-files.cingulado.org/pos360/media/1769785611712-ef532460bf2a0059.webp",
  mercadopago: "https://storage-files.cingulado.org/pos360/media/1769785611712-ef532460bf2a0059.webp",
  visa: "https://storage-files.cingulado.org/pos360/media/1769785603289-8ef15a33274405c8.webp",
  naranja: "https://storage-files.cingulado.org/pos360/media/1769785599197-627b0a0bac168cee.webp",
  creditoSjt: "https://storage-files.cingulado.org/pos360/products/191/1768436764101-45978c9e355b.webp",
};
</script>

<style scoped>
.pm-card {
  border-color: rgba(0, 0, 0, 0.08);
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
  margin-top: 14px;
}
.pm-sub {
  font-size: 14px;
  font-weight: 800;
  margin-bottom: 10px;
}
.pm-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.pm-icons {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}
.pm-icon {
  width: 52px;
  height: 18px;
  object-fit: contain;
  display: block;
  opacity: 0.95;
}
.pm-name {
  font-size: 14px;
  font-weight: 700;
  opacity: 0.9;
}
.pm-more {
  display: inline-block;
  margin-top: 16px;
  color: #1a73e8;
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
}
</style>
