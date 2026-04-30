<!-- ✅ COPY-PASTE FINAL -->
<!-- src/modules/shop/components/PromoBannerParlantes.vue -->

<template>
  <v-card
    class="pb-card"
    variant="flat"
    rounded="xl"
    role="button"
    tabindex="0"
    @click="go"
  >
    <div class="pb-grid">

      <!-- LEFT -->
      <div class="pb-left">

        <div class="pb-kicker">
          AUDIO
        </div>

        <h2 class="pb-title">
          Parlantes en<br>
          hasta 12 cuotas
        </h2>

        <p class="pb-sub">
          Audio para tu setup con financiación y varios medios de pago.
        </p>

        <div class="pb-payments">
          <img
            :src="paymentImgSrc"
            class="pb-payments-img"
            alt="Medios de pago"
          >
        </div>

        <div class="pb-link">
          Ver ofertas
          <v-icon size="18">mdi-chevron-right</v-icon>
        </div>

      </div>

      <!-- RIGHT -->
      <div class="pb-right">
        <img
          v-for="(src, i) in productImages"
          :key="i"
          class="pb-product"
          :src="src"
          alt="Parlante"
          @error="onImgError(i)"
        >
      </div>

    </div>
  </v-card>
</template>


<script setup>

import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const PAYMENT_IMG =
"https://storage-files.cingulado.org/pos360/media/1772493744791-665f713788e427fd.webp"

const PRODUCT_IMAGES_DEFAULT = [
  "https://storage-files.cingulado.org/pos360/media/1777556355995-daa0966cad126e74.webp",
  "https://storage-files.cingulado.org/pos360/media/1777556345695-6babc0843643597f.webp",
]

const productImages = ref([...PRODUCT_IMAGES_DEFAULT])
const paymentImgSrc = ref(PAYMENT_IMG)

function onImgError(idx){
  // si una imagen falla, removerla en lugar de cambiarla
  productImages.value = productImages.value.filter((_, i) => i !== idx)
}

function go(){
  router.push("/shop/c/2?category_id=2&subcategory_id=7&sub=7&page=1")
}

</script>


<style scoped>

.pb-card{
  cursor:pointer;
  background:#02498b;
  border:0;
}

.pb-grid{
  display:grid;
  grid-template-columns:1fr 480px;
  align-items:center;
  padding:26px 32px;
  gap:28px;
  min-height:260px;
}

.pb-left{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.pb-kicker{
  font-size:11px;
  letter-spacing:2px;
  font-weight: 400;
  opacity:.7;
  color:white;
}

.pb-title{
  margin:0;
  color:white;
  font-size:40px;
  line-height:1;
  font-weight: 500;
}

.pb-sub{
  margin:0;
  color:white;
  opacity:.9;
  font-size:16px;
}

/* MEDIOS DE PAGO MAS GRANDES */

.pb-payments-img{
  height:34px;
  object-fit:contain;
}

/* CTA */

.pb-link{
  margin-top:6px;
  color:white;
  font-weight: 400;
  display:flex;
  align-items:center;
  gap:6px;
  font-size:16px;
}

.pb-right{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:18px;
}

.pb-product{
  max-width:50%;
  max-height:300px;
  object-fit:contain;
  display:block;
  filter: drop-shadow(0 14px 28px rgba(0, 0, 0, 0.36));
  transition: transform 0.4s ease;
}

/* XAEA (segundo PNG) un poco más chico que Xiaomi */
.pb-product:nth-child(2){
  max-height:240px;
  max-width:42%;
}

.pb-card:hover .pb-product{
  transform: translateY(-2px);
}

/* tablet */

@media(max-width:960px){

.pb-grid{
grid-template-columns:1fr;
gap:18px;
}

.pb-right{
justify-content:center;
}

.pb-product{
max-height:240px;
max-width:46%;
}

.pb-product:nth-child(2){
max-height:200px;
max-width:40%;
}

}

/* mobile */

@media(max-width:600px){

.pb-grid{
padding:20px;
}

.pb-title{
font-size:30px;
}

.pb-product{
max-height:180px;
max-width:46%;
}

.pb-product:nth-child(2){
max-height:150px;
max-width:40%;
}

.pb-payments-img{
height:30px;
}

}

</style>