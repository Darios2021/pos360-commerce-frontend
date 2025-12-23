<!-- src/app/layouts/AuthLayout.vue -->
<template>
  <v-app>
    <v-layout>
      <v-main class="auth-main">
        <v-container class="auth-container" fluid>
          <slot />
        </v-container>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup>
// layout simple para /auth/*
</script>

<style scoped>
.auth-main {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.auth-container {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}
</style>
