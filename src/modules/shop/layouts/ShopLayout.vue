<!-- src/modules/shop/layouts/ShopLayout.vue -->
<template>
  <v-app class="shop-app">
    <ShopHeader />
    <v-main class="shop-main">
      <router-view />
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
