<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/PromoBannerSeguridadElectronica.vue -->

<template>
  <v-card
    class="seg-card"
    variant="flat"
    rounded="xl"
    role="button"
    tabindex="0"
    @click="go"
  >
    <div class="seg-grid">

      <!-- LEFT -->
      <div class="seg-left">

        <div class="seg-kicker">
          SEGURIDAD ELECTRÓNICA
        </div>

        <h2 class="seg-title">
          Cámaras de seguridad<br>
          hasta 12 cuotas
        </h2>

        <p class="seg-sub">
          Instalación bonificada y monitoreo opcional con abono mensual.
        </p>

        <!-- MEDIOS DE PAGO -->
        <div class="seg-payments">
          <img
            :src="paymentImgSrc"
            class="seg-payments-img"
            alt="Medios de pago"
          >
        </div>

        <!-- CTA -->
        <div class="seg-link">
          Ver ofertas
          <v-icon size="18">mdi-chevron-right</v-icon>
        </div>

      </div>

      <!-- RIGHT -->
      <div class="seg-right">
        <img
          class="seg-img"
          :src="imgSrc"
          alt="Cámaras de seguridad"
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
"https://storage-files.cingulado.org/pos360/media/1773003110927-1897e885ea435e0d.webp"

const PAYMENT_IMG =
"https://storage-files.cingulado.org/pos360/media/1772493744791-665f713788e427fd.webp"

const FALLBACK_IMG =
"https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80"

const imgSrc = ref(PRIMARY_IMG)
const paymentImgSrc = ref(PAYMENT_IMG)

function onImgError(){
  imgSrc.value = FALLBACK_IMG
}

function go(){
  router.push("/shop/c/11?branch_id=3&page=1")
}

</script>

<style scoped>

.seg-card{
  cursor:pointer;
  background:#02498b;
  border:0;
}

.seg-grid{
  display:grid;
  grid-template-columns:1fr 460px;
  align-items:center;
  padding:26px 32px;
  gap:28px;
  min-height:190px;
}

.seg-left{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.seg-kicker{
  font-size:11px;
  letter-spacing:2px;
  font-weight:700;
  opacity:.7;
  color:white;
}

.seg-title{
  margin:0;
  color:white;
  font-size:40px;
  line-height:1;
  font-weight:800;
}

.seg-sub{
  margin:0;
  color:white;
  opacity:.9;
  font-size:16px;
}

/* MEDIOS DE PAGO */

.seg-payments-img{
  height:34px;
  object-fit:contain;
}

/* CTA */

.seg-link{
  margin-top:6px;
  color:white;
  font-weight:600;
  display:flex;
  align-items:center;
  gap:6px;
  font-size:16px;
}

.seg-right{
  display:flex;
  justify-content:flex-end;
  align-items:center;
}

.seg-img{
  width:440px;
  height:200px;
  object-fit:contain;
}

/* tablet */

@media(max-width:960px){

.seg-grid{
grid-template-columns:1fr;
gap:18px;
}

.seg-right{
justify-content:center;
}

.seg-img{
width:100%;
height:200px;
}

}

/* mobile */

@media(max-width:600px){

.seg-grid{
padding:20px;
}

.seg-title{
font-size:30px;
}

.seg-img{
height:180px;
}

.seg-payments-img{
height:30px;
}

}

</style>