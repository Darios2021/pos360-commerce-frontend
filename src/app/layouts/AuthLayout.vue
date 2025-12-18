<template>
  <v-app>
    <v-main class="auth-main">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup></script>

<style scoped>
.auth-main {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
</style>
