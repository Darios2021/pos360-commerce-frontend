<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/PromoGridTelefonosAuriculares.vue -->

<template>
  <section class="promo-grid">

    <!-- TELEFONOS -->
    <v-card
      class="promo-card"
      variant="flat"
      rounded="xl"
      role="button"
      tabindex="0"
      @click="goPhones"
      @keydown.enter.prevent="goPhones"
      @keydown.space.prevent="goPhones"
    >
      <div class="promo-inner">

        <div class="promo-copy">

          <div class="promo-kicker">
            TECNOLOGÍA MÓVIL
          </div>

          <h3 class="promo-title">
            Teléfonos y<br>
            smartphones
          </h3>

          <p class="promo-sub">
            Smartphones actuales, conectividad y rendimiento para tu uso diario.
          </p>

          <button
            class="promo-btn"
            type="button"
            @click.stop="goPhones"
          >
            Ver ofertas
          </button>

        </div>

        <div class="promo-media">

          <div class="promo-asset promo-asset--phone">
            <img
              class="promo-img"
              :src="phoneImg"
              alt="Teléfonos"
              loading="lazy"
            >
          </div>

        </div>

      </div>
    </v-card>



    <!-- AURICULARES -->
    <v-card
      class="promo-card"
      variant="flat"
      rounded="xl"
      role="button"
      tabindex="0"
      @click="goHeadphones"
      @keydown.enter.prevent="goHeadphones"
      @keydown.space.prevent="goHeadphones"
    >
      <div class="promo-inner">

        <div class="promo-copy">

          <div class="promo-kicker">
            AUDIO
          </div>

          <h3 class="promo-title">
            Auriculares<br>
            en oferta
          </h3>

          <p class="promo-sub">
            Sonido envolvente, comodidad y autonomía para música o gaming.
          </p>

          <button
            class="promo-btn"
            type="button"
            @click.stop="goHeadphones"
          >
            Ver ofertas
          </button>

        </div>

        <div class="promo-media">

          <div class="promo-asset promo-asset--headphones">
            <img
              class="promo-img"
              :src="headphoneImg"
              alt="Auriculares"
              loading="lazy"
            >
          </div>

        </div>

      </div>
    </v-card>

  </section>
</template>



<script setup>

import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

/* IMÁGENES ESTANDARIZADAS */

const phoneImg = ref(
"https://storage-files.cingulado.org/pos360/media/1772986134454-9e62d72622526209.webp"
)

const headphoneImg = ref(
"https://storage-files.cingulado.org/pos360/media/1772986992813-dcd73f703f5b0dec.webp"
)

/* RUTAS */

function goPhones(){
  router.push("/shop/c/53?branch_id=3&page=1")
}

function goHeadphones(){
  router.push("/shop/c/2?branch_id=3&page=1&subcategory_id=3&sub=3")
}

</script>



<style scoped>

.promo-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:18px;
}

.promo-card{
  cursor:pointer;
  overflow:hidden;
  border:1px solid rgba(2,73,139,0.1);
  background:#ffffff;
  box-shadow:0 1px 2px rgba(0,0,0,0.04);
}

/* layout */

.promo-inner{
  display:grid;
  grid-template-columns:minmax(0,1fr) 43%;
  min-height:250px;
  align-items:stretch;
}

/* texto */

.promo-copy{
  display:flex;
  flex-direction:column;
  justify-content:center;
  gap:10px;
  padding:26px 28px;
}

.promo-kicker{
  font-size:11px;
  letter-spacing:4px;
  text-transform:uppercase;
  font-weight:700;
  color:#333;
}

.promo-title{
  margin:0;
  font-size:27px;
  line-height:1.05;
  font-weight:700;
  letter-spacing:-0.4px;
  color:#333;
}

.promo-sub{
  margin:0;
  font-size:14px;
  line-height:1.5;
  color:rgba(51,51,51,0.85);
  max-width:340px;
}

.promo-btn{
  margin-top:8px;
  align-self:flex-start;
  min-width:168px;
  height:44px;
  border:0;
  border-radius:10px;
  padding:0 22px;
  background:#02498b;
  color:#fff;
  font-size:15px;
  font-weight:700;
  cursor:pointer;
}

/* panel azul */

.promo-media{
  position:relative;
  overflow:hidden;
  background:#02498b;
  display:flex;
  align-items:center;
  justify-content:center;
  height:110%;
}

/* frame producto */

.promo-asset{
  display:flex;
  align-items:center;
  justify-content:center;
}

.promo-asset--phone{
  width:68%;
  height:78%;
}

.promo-asset--headphones{
  width:60%;
  height:70%;
}

.promo-img{
  width:100%;
  height:100%;
  object-fit:contain;
  display:block;
}


/* ======================
   TABLET
====================== */

@media (max-width:960px){

.promo-grid{
grid-template-columns:1fr;
gap:14px;
}

.promo-inner{
grid-template-columns:minmax(0,1fr) 40%;
min-height:220px;
}

.promo-copy{
padding:22px;
}

.promo-title{
font-size:24px;
}

.promo-media{
min-height:220px;
height:110%;
}

.promo-asset--phone{
width:72%;
height:78%;
}

.promo-asset--headphones{
width:64%;
height:70%;
}

}


/* ======================
   MOBILE
====================== */

@media (max-width:600px){

.promo-grid{
gap:12px;
}

.promo-inner{
grid-template-columns:minmax(0,1fr) 42%;
min-height:170px;
}

.promo-copy{
padding:14px 14px 14px 16px;
gap:6px;
}

.promo-kicker{
font-size:9px;
letter-spacing:3px;
}

.promo-title{
font-size:18px;
line-height:1.08;
}

.promo-sub{
font-size:12px;
line-height:1.4;
}

.promo-btn{
min-width:110px;
height:34px;
font-size:13px;
padding:0 14px;
}

.promo-media{
min-height:170px;
height:110%;
}

/* imágenes más grandes en mobile */

.promo-asset--phone{
width:82%;
height:82%;
}

.promo-asset--headphones{
width:74%;
height:74%;
}

}

</style>