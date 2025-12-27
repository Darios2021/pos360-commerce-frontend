<!-- src/app/layouts/AuthLayout.vue -->
<template>
  <v-app>
    <v-main class="auth-main">
      <div class="auth-wrap">
        <router-view />
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.auth-main{
  min-height: 100vh;
  background:
    radial-gradient(circle at 25% 15%, rgba(20,136,209,.18), transparent 45%),
    radial-gradient(circle at 75% 70%, rgba(7,28,48,.18), transparent 45%),
    rgb(var(--v-theme-background));
}
.auth-wrap{
  min-height: 100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding: 24px;
}
</style>
