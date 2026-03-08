<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/components/PromoBannerEntretenimiento.vue -->

<template>
  <v-card
    class="ent-card"
    variant="flat"
    rounded="xl"
    role="button"
    tabindex="0"
    @click="go"
    @keydown.enter.prevent="go"
    @keydown.space.prevent="go"
  >
    <div class="ent-shell">

      <!-- TEXTO -->
      <div class="ent-copy">

        <div class="ent-kicker">
          ENTRETENIMIENTO
        </div>

        <h2 class="ent-title">
          Todo para disfrutar
          <span>tu tiempo libre</span>
        </h2>

        <p class="ent-sub">
          Consolas, audio, accesorios y tecnología para una experiencia más inmersiva.
        </p>

        <div class="ent-actions">
          <button
            class="ent-btn"
            type="button"
            @click.stop="go"
          >
            Ver categoría
          </button>

          <div class="ent-note">
            Gaming, audio, TV y más
          </div>
        </div>

      </div>

      <!-- IMAGEN -->
      <div class="ent-media" aria-hidden="true">
        <img
          class="ent-img"
          :src="imgSrc"
          alt="Entretenimiento"
          loading="lazy"
          @error="onImgError"
        />
      </div>

    </div>
  </v-card>
</template>


<script setup>

import { ref } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()

/* ✅ NUEVA IMAGEN CORREGIDA */

const PRIMARY_IMG =
"https://storage-files.cingulado.org/pos360/media/1772989031926-7f449c32e22dcf8d.webp"

const FALLBACK_IMG =
"https://images.unsplash.com/photo-1486572788966-cfd3df1f5b42?auto=format&fit=crop&w=1400&q=80"

const imgSrc = ref(PRIMARY_IMG)

function onImgError(){
  if(imgSrc.value !== FALLBACK_IMG) imgSrc.value = FALLBACK_IMG
}

function go(){
  router.push("/shop/c/6?category_id=6&page=1")
}

</script>


<style scoped>

.ent-card{
cursor:pointer;
overflow:hidden;
border:0;
background:#02498b;
box-shadow:0 2px 10px rgba(0,0,0,.08);
}

/* layout */

.ent-shell{
display:grid;
grid-template-columns:minmax(0,1fr) minmax(260px,38%);
align-items:center;
min-height:190px;
}

/* texto */

.ent-copy{
display:flex;
flex-direction:column;
justify-content:center;
gap:8px;
padding:24px 28px;
color:#fff;
}

.ent-kicker{
font-size:10px;
letter-spacing:4px;
text-transform:uppercase;
font-weight:800;
color:rgba(255,255,255,.7);
}

.ent-title{
margin:0;
font-size:30px;
line-height:1.05;
font-weight:800;
letter-spacing:-0.6px;
max-width:420px;
}

.ent-title span{
display:block;
}

.ent-sub{
margin:0;
font-size:14px;
line-height:1.45;
max-width:420px;
color:rgba(255,255,255,.85);
}

.ent-actions{
display:flex;
align-items:center;
gap:12px;
margin-top:4px;
}

.ent-btn{
height:36px;
padding:0 16px;
border-radius:9px;
border:0;
background:#ffffff;
color:#02498b;
font-size:14px;
font-weight:700;
cursor:pointer;
}

.ent-note{
font-size:13px;
color:rgba(255,255,255,.7);
}

/* imagen */

.ent-media{
display:flex;
align-items:center;
justify-content:center;
min-height:190px;
}

.ent-img{
max-width:300px;
width:100%;
height:auto;
object-fit:contain;
}

/* tablet */

@media (max-width:960px){

.ent-shell{
min-height:170px;
grid-template-columns:minmax(0,1fr) 40%;
}

.ent-title{
font-size:24px;
}

.ent-sub{
font-size:13px;
}

.ent-img{
max-width:240px;
}

}

/* mobile */

@media (max-width:600px){

.ent-shell{
min-height:150px;
grid-template-columns:minmax(0,1fr) 40%;
}

.ent-copy{
padding:14px 16px;
gap:6px;
}

.ent-kicker{
font-size:9px;
letter-spacing:3px;
}

.ent-title{
font-size:18px;
}

.ent-sub{
font-size:11px;
}

.ent-btn{
height:32px;
padding:0 12px;
font-size:12px;
}

.ent-note{
display:none;
}

.ent-img{
max-width:200px;
}

}

</style>