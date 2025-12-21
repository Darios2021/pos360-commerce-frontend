<!-- src/app/layouts/AuthLayout.vue -->
<template>
  <v-app>
    <v-main class="d-flex align-center justify-center" style="min-height: 100vh">
      <v-container style="max-width: 520px">
        <v-card rounded="xl" class="pa-6">
          <slot />
        </v-card>

        <div class="text-center text-caption text-medium-emphasis mt-4">
          360POS · Frontend
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
</script>
