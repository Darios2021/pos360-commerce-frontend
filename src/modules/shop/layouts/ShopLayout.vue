<template>
  <v-app class="shop-app">
    <ShopHeader />
    <v-main class="shop-main">
      <!-- ✅ FIX: fuerza remount cuando cambia params/query -->
      <router-view :key="$route.fullPath" />
    </v-main>
  </v-app>
</template>

<script setup>
import ShopHeader from "@/modules/shop/components/ShopHeader.vue";
</script>

<style scoped>
.shop-main {
  background: #f5f5f5;
  min-height: calc(100vh - 64px);
}
</style>
