<!-- src/app/layouts/AuthLayout.vue -->
<template>
  <v-main class="auth-bg">
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="10" md="6" lg="4">
          <slot />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script setup>
// nada
</script>

<style scoped>
.auth-bg {
  background: rgb(var(--v-theme-background));
}
</style>
