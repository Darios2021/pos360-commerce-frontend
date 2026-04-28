<!-- src/modules/shop/components/ShopFooter.vue -->
<template>
  <v-sheet tag="footer" class="shop-footer">
    <v-container fluid class="footer-inner">
      <div class="footer-shell">

        <div class="footer-grid">

          <!-- BRAND -->
          <section class="footer-brand">
            <router-link to="/shop" class="brand-link">
              <img
                v-if="logoUrl"
                :src="logoUrl"
                :alt="branding.name"
                class="brand-logo"
              />

              <div v-else class="brand-fallback">
                <div class="brand-title">{{ branding.name }}</div>
                <div class="brand-subtitle">Ecommerce · Inventario · POS</div>
              </div>
            </router-link>

            <p class="brand-desc">
              Seguridad Electrónica · Hogar · Seguridad<br />
              Consultoría y asesoramiento personalizado.
            </p>

            <div class="brand-actions">
              <a class="footer-pill" :href="instagramUrl" target="_blank">
                <v-icon size="16">mdi-instagram</v-icon>
                Instagram
              </a>

              <a class="footer-pill" :href="rivadaviaMapsUrl" target="_blank">
                <v-icon size="16">mdi-map-marker-outline</v-icon>
                Cómo llegar
              </a>

              <router-link class="footer-pill" to="/shop">
                <v-icon size="16">mdi-storefront-outline</v-icon>
                Tienda
              </router-link>
            </div>
          </section>


          <!-- TIENDA -->
          <section class="footer-col">
            <div class="footer-title">Tienda</div>

            <router-link to="/shop" class="footer-link">Inicio</router-link>
            <router-link to="/shop/cart" class="footer-link">Carrito</router-link>
            <router-link to="/shop/account/favorites" class="footer-link">Favoritos</router-link>
            <router-link to="/shop/account/orders" class="footer-link">Mis compras</router-link>
          </section>


          <!-- CUENTA -->
          <section class="footer-col">
            <div class="footer-title">Cuenta</div>

            <router-link to="/shop/login" class="footer-link">Ingresar</router-link>
            <router-link to="/shop/register" class="footer-link">Registrarse</router-link>
            <router-link to="/shop/account/orders" class="footer-link">
              Seguimiento de compras
            </router-link>
          </section>


          <!-- SUCURSALES -->
          <section class="footer-col footer-col-contact">

            <div class="footer-title">Sucursales</div>

            <div class="branches-list">

              <!-- Rivadavia -->
              <a
                class="branch-card"
                :href="rivadaviaMapsUrl"
                target="_blank"
              >
                <div class="branch-top">
                  <div class="branch-name">
                    Sucursal Rivadavia
                  </div>

                  <v-icon size="18" class="branch-arrow">
                    mdi-arrow-top-right
                  </v-icon>
                </div>

                <div class="branch-location">
                  <v-icon size="17">mdi-map-marker</v-icon>
                  <span>
                    CESAP · Calle Los Jesuitas · San Juan
                  </span>
                </div>
              </a>


              <!-- Chimbas -->
              <a
                class="branch-card"
                :href="chimbasMapsUrl"
                target="_blank"
              >
                <div class="branch-top">
                  <div class="branch-name">
                    Sucursal Chimbas
                  </div>

                  <v-icon size="18" class="branch-arrow">
                    mdi-arrow-top-right
                  </v-icon>
                </div>

                <div class="branch-location">
                  <v-icon size="17">mdi-map-marker</v-icon>
                  <span>
                    Chango Más · Local 2 · Av. Benavidez
                  </span>
                </div>
              </a>

            </div>
          </section>
        </div>


        <!-- Divider -->
        <div class="footer-divider"></div>


        <!-- Bottom -->
        <div class="footer-bottom">

          <div class="footer-copy">
            © {{ year }} {{ branding.name }} · Todos los derechos reservados
          </div>

          <button class="footer-top" @click="toTop">

            <v-icon size="16">mdi-arrow-up</v-icon>

            Arriba
          </button>

        </div>

      </div>
    </v-container>
  </v-sheet>
</template>



<script setup>
import { ref, computed, onMounted } from "vue"
import { getShopBranding } from "@/modules/shop/service/shop.public.api"

const year = new Date().getFullYear()

const instagramUrl = "https://www.instagram.com/sanjuan.tecnologia/"
const rivadaviaMapsUrl = "https://maps.app.goo.gl/jxjPeb3JdsM9sprR6"
const chimbasMapsUrl = "https://maps.app.goo.gl/r95QAotu3v6ZKqhMA"

const branding = ref({
  name: "San Juan Tecnología",
  logo_url: "",
  updated_at: null
})

function withVersion(url,v){
  if(!url) return ""
  if(!v) return url
  return url + "?v=" + v
}

const logoUrl = computed(()=>{
  return withVersion(branding.value.logo_url,branding.value.updated_at)
})

function toTop(){
  window.scrollTo({
    top:0,
    behavior:"smooth"
  })
}

onMounted(async()=>{
  try{
    const b = await getShopBranding()
    if(b) branding.value = {...branding.value,...b}
  }catch{}
})
</script>



<style scoped>

.shop-footer{
  width:100%;
  background:rgb(var(--v-theme-primary));
  color:white;
  border-top:1px solid rgba(255,255,255,.12);
}

.footer-inner{
  width:min(1200px,calc(100% - 24px));
  margin:auto;
  padding:28px 0 18px;
}

.footer-grid{
  display:grid;
  grid-template-columns:1.2fr .8fr .9fr 1fr;
  gap:28px;
}

.brand-logo{
  max-height:72px;
  object-fit:contain;
}

.brand-desc{
  margin:16px 0;
  opacity:.9;
  line-height:1.5;
}

.brand-actions{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.footer-pill{
  display:flex;
  align-items:center;
  gap:8px;
  padding:8px 14px;
  border-radius:999px;
  text-decoration:none;
  color:white;
  background:rgba(255,255,255,.07);
  border:1px solid rgba(255,255,255,.16);
  transition:.15s;
}

.footer-pill:hover{
  background:rgba(255,255,255,.12);
}

.footer-title{
  font-weight: 400;
  margin-bottom:14px;
}

.footer-link{
  display:block;
  margin-bottom:10px;
  color:rgba(255,255,255,.85);
  text-decoration:none;
  font-size:.95rem;
}

.footer-link:hover{
  color:white;
}

.branches-list{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.branch-card{
  padding:14px;
  border-radius:14px;
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.1);
  text-decoration:none;
  color:white;
  transition:.15s;
}

.branch-card:hover{
  background:rgba(255,255,255,.09);
}

.branch-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:6px;
}

.branch-name{
  font-weight: 400;
  font-size:.95rem;
}

.branch-location{
  display:flex;
  gap:8px;
  font-size:.9rem;
  opacity:.9;
}

.footer-divider{
  margin:20px 0 12px;
  height:1px;
  background:rgba(255,255,255,.15);
}

.footer-bottom{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.footer-copy{
  font-size:.85rem;
  opacity:.8;
}

.footer-top{
  display:flex;
  align-items:center;
  gap:6px;
  border:none;
  background:rgba(255,255,255,.08);
  border-radius:999px;
  padding:8px 14px;
  color:white;
  cursor:pointer;
  transition:.15s;
}

.footer-top:hover{
  background:rgba(255,255,255,.14);
}

@media (max-width:900px){

.footer-grid{
grid-template-columns:1fr;
gap:24px;
}

.footer-bottom{
flex-direction:column;
align-items:flex-start;
gap:12px;
}

}

</style>