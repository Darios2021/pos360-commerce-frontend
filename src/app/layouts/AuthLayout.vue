<!-- src/app/layouts/AuthLayout.vue -->
<!-- Wrapper minimal: la página de login controla su propio layout/branding. -->
<template>
  <v-app>
    <v-main class="auth-main">
      <router-view />
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-main {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}
</style>
