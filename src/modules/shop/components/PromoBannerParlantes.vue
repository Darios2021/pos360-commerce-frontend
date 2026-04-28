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
          class="pb-img"
          :src="imgSrc"
          alt="Parlantes"
          @error="onImgError"
        >
      </div>

    </div>
  </v-card>
</template>


<script setup>

import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

const PRIMARY_IMG =
"https://storage-files.cingulado.org/pos360/products/14/1766778670423-5fba6ded.jpeg"

const PAYMENT_IMG =
"https://storage-files.cingulado.org/pos360/media/1772493744791-665f713788e427fd.webp"

const FALLBACK_IMG =
"https://images.unsplash.com/photo-1518441984357-749f0f4a53b1?auto=format&fit=crop&w=1200&q=80"

const imgSrc = ref(PRIMARY_IMG)
const paymentImgSrc = ref(PAYMENT_IMG)

function onImgError(){
  imgSrc.value = FALLBACK_IMG
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
  grid-template-columns:1fr 420px;
  align-items:center;
  padding:26px 32px;
  gap:28px;
  min-height:190px;
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
  justify-content:flex-end;
}

/* PARLANTE MAS GRANDE */

.pb-img{
  width:380px;
  height:160px;
  object-fit:cover;
  border-radius:16px;
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

.pb-img{
width:100%;
height:180px;
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

.pb-img{
height:170px;
}

.pb-payments-img{
height:30px;
}

}

</style>