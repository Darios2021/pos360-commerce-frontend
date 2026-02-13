<!-- ✅ COPY-PASTE FINAL COMPLETO -->
<!-- src/modules/shop/pages/ShopMore.vue -->

<template>
  <div class="more-page" data-page="shop-more">
    <div class="more-head">
      <button class="backBtn" type="button" @click="goBack" aria-label="Volver">
        <v-icon size="22">mdi-arrow-left</v-icon>
      </button>
      <div class="headTitle">Más</div>
      <div class="headRight"></div>
    </div>

    <div class="more-wrap">
      <div class="card">
        <router-link class="row" to="/app/auth/login">
          <div class="ico"><v-icon>mdi-account-outline</v-icon></div>
          <div class="txt">
            <div class="t1">Ingresá</div>
            <div class="t2">Accedé a tu cuenta</div>
          </div>
          <v-icon class="chev">mdi-chevron-right</v-icon>
        </router-link>

        <router-link class="row" to="/shop">
          <div class="ico"><v-icon>mdi-package-variant</v-icon></div>
          <div class="txt">
            <div class="t1">Mis compras</div>
            <div class="t2">Seguimiento y estado</div>
          </div>
          <v-icon class="chev">mdi-chevron-right</v-icon>
        </router-link>
      </div>

      <div class="card">
        <router-link class="row" to="/shop">
          <div class="ico"><v-icon>mdi-shield-outline</v-icon></div>
          <div class="txt">
            <div class="t1">San Juan Seguridad</div>
            <div class="t2">Soluciones y equipamiento</div>
          </div>
          <v-icon class="chev">mdi-chevron-right</v-icon>
        </router-link>

        <router-link class="row" to="/shop">
          <div class="ico"><v-icon>mdi-laptop</v-icon></div>
          <div class="txt">
            <div class="t1">San Juan Sistemas</div>
            <div class="t2">POS, software y más</div>
          </div>
          <v-icon class="chev">mdi-chevron-right</v-icon>
        </router-link>

        <router-link class="row" to="/shop">
          <div class="ico"><v-icon>mdi-tools</v-icon></div>
          <div class="txt">
            <div class="t1">Servicio Técnico</div>
            <div class="t2">Reparaciones y soporte</div>
          </div>
          <v-icon class="chev">mdi-chevron-right</v-icon>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
const router = useRouter();

function goBack() {
  if (window.history.length > 1) router.back();
  else router.push("/shop");
}
</script>

<style scoped>
.more-page {
  background: #f6f7f9;
  min-height: 100vh;
}

.more-head {
  position: sticky;
  top: 0;
  z-index: 5;
  height: 52px;
  display: grid;
  grid-template-columns: 52px 1fr 52px;
  align-items: center;
  border-bottom: 1px solid #ededed;
  background: #fff;
}

.backBtn {
  width: 52px;
  height: 52px;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.headTitle {
  font-weight: 950;
  font-size: 16px;
  color: #111;
}

.headRight {
  width: 52px;
  height: 52px;
}

.more-wrap {
  padding: 12px;
  display: grid;
  gap: 12px;
}

.card {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 18px rgba(0,0,0,0.04);
}

.row {
  display: grid;
  grid-template-columns: 44px 1fr 26px;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  text-decoration: none;
  color: inherit;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.row:first-child {
  border-top: 0;
}

.ico {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: #f5f7fb;
  border: 1px solid rgba(0,0,0,0.06);
  display: grid;
  place-items: center;
}

.txt { min-width: 0; }
.t1 { font-weight: 950; font-size: 13px; color: #111; }
.t2 { font-size: 12px; opacity: .72; margin-top: 2px; }

.chev { opacity: .45; }
</style>
